#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash, randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { request as httpsRequest } from 'node:https';
import { request as httpRequest } from 'node:http';

const execFileAsync = promisify(execFile);
function exec(file, args, options) {
  // Allowlist avoids reading secrets even when process.env is instrumented.
  const env = Object.create(null);
  for (const name of ['PATH', 'HOME', 'TMPDIR', 'TMP', 'TEMP', 'LANG', 'LC_ALL', 'SystemRoot', 'WINDIR', 'USERPROFILE']) {
    const value = process.env[name];
    if (value !== undefined) env[name] = value;
  }
  return execFileAsync(file, args, { ...options, env });
}
const MAX_IMAGE = 30 * 1024 * 1024;
const HELP = `album-cover-to-live (Node.js >=20; ffmpeg and ffprobe required)
Commands:
  help
  resolve --artist <name> --album <title> --output-dir <dir> [--contact <email-or-url>] [--release-id <mbid>] [--allow-deezer] [--force] [--json]
  plan --input <cover> [--brief <json-file>] [--concept <text>] [--output <prompt.txt>] [--json]
  generate --artist <name> --album <title> --output-dir <dir> [--contact <email-or-url>] [--release-id <mbid>] [--allow-deezer] [--brief <json-file>] [--concept <text>] [--duration <4..15>] [--resolution <768P|2K>] [--region <global|cn>] [--context-ir] [--dry-run] [--confirm-paid-generation] [--expected-cover-sha256 <64hex>] [--force] [--json]
  review --input <video.mp4> --output-dir <dir> [--expected-duration <seconds>] [--force] [--json]
Defaults: duration 6, resolution 768P, region global. No overwrite unless --force.
plan --output writes prompt plus <output>.json; without --output prints the plan/prompt.
generate writes cover, source.json, prompt.txt, plan.json; payment requires explicit confirmation and no --dry-run.
Paid generate also requires --expected-cover-sha256 <64hex> from plan --json or source.json.
Example: generate --artist A --album B --contact you@example.org --output-dir ./paid --confirm-paid-generation --expected-cover-sha256 <64hex>
The exact validated Buffer is uploaded; prompt.txt stores the final sent prompt (including Context IR).
Context IR is an asynchronous task; task-<type>-<id>.json receipts contain no secrets or download URLs.
Successful generation writes silent live-cover.mp4, contact-sheet.jpg, review.json.
Review never automatically accepts visual identity, typography, geometry or loop continuity.
Brief fields: structure, profile, verified_facts, creative_hypothesis, visual_invariants,
semantic_anchor, primary_motion, supporting_motions, amplitude, tempo, loop_intent,
prohibitions, evidence_basis, fallback. Unknown fields are rejected.
structure: portrait|group|collage_composite|illustration_character|typography_logo_minimal|landscape_environment|abstract_geometric|object_product
profile: medium_safe_v1|low_safe_v1; primary_motion: light_sweep|glow_breath|reflection_drift
supporting_motions: at most two {motion: texture_drift|atmospheric_drift|surface_flow, amplitude: low}.
amplitude: low|medium; tempo: slow|moderate; loop_intent: return_near_start|none.
verified_facts, visual_invariants, prohibitions: string arrays; all strings must be nonempty after trim.
Explicit briefs require structure, nonempty visual_invariants and prohibitions.
medium_safe_v1 requires semantic_anchor: {visible_carrier: <nonempty string>}.
Other descriptive fields are strings. Profile/amplitude conflicts are rejected; full prompts <=7000 Unicode characters.
Without brief: unverified visible-cover fallback, background-only glow, needs_review.
Environment: MUSICBRAINZ_CONTACT (required unless --contact); MUSICBRAINZ_BASE_URL,
CAA_BASE_URL, DEEZER_BASE_URL (official defaults); MINIMAX_API_KEY (only read for paid run),
MINIMAX_BASE_URL; MINIMAX_POLL_INTERVAL_MS (default 10000, >=1),
MINIMAX_POLL_TIMEOUT_MS (default 1200000, >=1). HTTP timeout 60 seconds.
HTTPS public targets by default; redirects are validated at every hop, maximum five, Bearer stays same-origin.
ALBUM_LIVE_ALLOW_PRIVATE_HTTPS=1 globally also permits RFC1918 IPv4, IPv6 ULA fc00/7 and fake-IP 198.18/15 over HTTPS; only exact 1 enables it.
Use only with trusted proxy/DNS environments: provider download URLs and redirects may reach internal networks; no domain allowlist.
Mapped IPv6 follows IPv4 rules; loopback, link-local, unspecified and multicast remain blocked. TLS verification and DNS pinning remain enabled.
URL credentials remain forbidden; target rejection errors report only the host and reason, not full URL parameters or secrets.
ALBUM_LIVE_TEST_ALLOW_LOOPBACK_HTTP=1 permits loopback HTTP only for local mocks with FAKE credentials; default off.
Deezer is opt-in fallback, subject to non-commercial use and rights restrictions.
Exit codes: 0 success/planned, 1 error, 2 invalid arguments, 3 ambiguous match, 4 technical review failed.
`;
class Failure extends Error {
  constructor(message, code = 1) {
    super(message);
    this.code = code;
  }
}
const fail = (message, code) => {
  throw new Failure(message, code);
};
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const booleanFlags = new Set(['allow-deezer', 'force', 'json', 'context-ir', 'dry-run', 'confirm-paid-generation']);
const resolveFlags = ['artist', 'album', 'output-dir', 'contact', 'release-id', 'allow-deezer', 'force', 'json'];
function argumentsFor(argv) {
  const command = argv.shift() || 'help';
  const allowed = {
    help: [],
    resolve: resolveFlags,
    plan: ['input', 'brief', 'concept', 'output', 'json'],
    generate: [...resolveFlags, 'brief', 'concept', 'duration', 'resolution', 'region', 'context-ir', 'dry-run', 'confirm-paid-generation', 'expected-cover-sha256'],
    review: ['input', 'output-dir', 'expected-duration', 'force', 'json'],
  }[command];
  if (!allowed) fail('Unknown command. Use help.', 2);
  const options = {};
  while (argv.length) {
    const flag = argv.shift();
    const key = flag.startsWith('--') ? flag.slice(2) : '';
    if (!allowed.includes(key) || key in options) fail(`Invalid or duplicate option: ${flag}`, 2);
    if (booleanFlags.has(key)) {
      options[key] = true;
    } else {
      const value = argv.shift();
      if (!value || value.startsWith('--')) fail(`Missing value: ${flag}`, 2);
      options[key] = value;
    }
  }
  const required = { resolve: ['artist', 'album', 'output-dir'], generate: ['artist', 'album', 'output-dir'], plan: ['input'], review: ['input', 'output-dir'], help: [] }[command];
  for (const key of required) if (!options[key]?.trim()) fail(`Required: --${key}`, 2);
  if (options['release-id'] && !isMBID(options['release-id'])) fail('Invalid release MBID.', 2);
  if (command === 'generate') {
    options.duration = Number(options.duration ?? 6);
    if (!Number.isInteger(options.duration) || options.duration < 4 || options.duration > 15) fail('Duration must be an integer from 4 to 15.', 2);
    options.resolution ??= '768P';
    options.region ??= 'global';
    if (!['768P', '2K'].includes(options.resolution) || !['global', 'cn'].includes(options.region)) fail('Invalid resolution or region.', 2);
  }
  if (options['expected-duration'] && !(Number(options['expected-duration']) > 0 && Number.isFinite(Number(options['expected-duration'])))) fail('Expected duration must be positive.', 2);
  return { command, options };
}
const isMBID = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const norm = value => String(value ?? '').normalize('NFKC').toLowerCase().replace(/ß/g, 'ss').replace(/ς/g, 'σ').replace(/[\p{P}\p{S}\s]+/gu, ' ').trim();
function base(envName, fallback) {
  const url = new URL(process.env[envName] || fallback);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    fail(`Invalid ${envName}.`, 2);
  }
  return url.href.replace(/\/$/, '');
}
async function http(url, { json = false, limit = MAX_IMAGE, ...options } = {}) {
  let response;
  const origin = new URL(url).origin;
  for (let hop = 0; ; hop++) {
    const { target, address } = await safeURL(url);
    if (options.headers?.Authorization && target.origin !== origin) fail('Bearer cross-origin redirect rejected.');
    try {
      response = await new Promise((resolve, reject) => {
        const request = (target.protocol === 'https:' ? httpsRequest : httpRequest)(target, {
          ...options, signal:AbortSignal.timeout(60000),
          // Pin the checked address so DNS cannot change between validation and connection.
          lookup: (_host, lookupOptions, callback) => {
            if (lookupOptions.all) {
              callback(null, [address]);
            } else {
              callback(null, address.address, address.family);
            }
          },
        }, incoming => {
          incoming.cancel = async () => incoming.destroy();
          resolve({
            status: incoming.statusCode,
            ok: incoming.statusCode >= 200 && incoming.statusCode < 300,
            body: incoming,
            headers: { get: name => incoming.headers[name] },
          });
        });
        request.on('error', reject);
        request.end(options.body);
      });
    } catch {
      fail('HTTP connection failed or timed out.');
    }
    if (![301,302,303,307,308].includes(response.status)) break;
    const location = response.headers.get('location');
    await response.body?.cancel();
    if (!location || hop >= 5) fail('Invalid or excessive redirects.');
    url = new URL(location, target).href;
    if (response.status === 303 || ([301,302].includes(response.status) && options.method === 'POST')) {
      options.method = 'GET';
      delete options.body;
    }
  }
  if (!response.ok) {
    await response.body?.cancel();
    const error = new Failure(`HTTP ${response.status}: ${({401:'unauthorized',403:'forbidden',404:'not found',429:'rate limited; retry later',503:'service unavailable; retry later'})[response.status] || 'request failed'}.`);
    error.status = response.status;
    throw error;
  }
  const chunks = [];
  let size = 0;
  try {
    for await (const chunk of response.body) {
      size += chunk.length;
      if (size > limit) fail('Download exceeds size limit.');
      chunks.push(chunk);
    }
  } catch (error) {
    if (error instanceof Failure) throw error;
    fail('HTTP response interrupted or timed out.');
  }
  const bytes = Buffer.concat(chunks);
  if (!json) return bytes;
  try { return JSON.parse(bytes.toString('utf8')); } catch { fail('Server returned invalid JSON.'); }
}
function loopback(ip) { return ip === '::1' || /^127\./.test(ip); }
function publicIP(ip) {
  if (isIP(ip) === 4) {
    const [a,b] = ip.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || a === 169 && b === 254 || a === 172 && b >= 16 && b <= 31 || a === 192 && (b === 168 || b === 0) || a === 100 && b >= 64 && b <= 127 || a === 198 && (b === 18 || b === 19));
  }
  return isIP(ip) === 6 && /^[23]/i.test(ip) && !/^2001:(?:0:|db8:)/i.test(ip);
}
function actualIP(ip) {
  if (isIP(ip) !== 6) return ip;
  const canonical = new URL(`https://[${ip}]/`).hostname.slice(1, -1);
  const mapped = /^::ffff:([\da-f]+):([\da-f]+)$/i.exec(canonical);
  if (!mapped) return canonical;
  const high = parseInt(mapped[1], 16);
  const low = parseInt(mapped[2], 16);
  return [high >> 8, high & 255, low >> 8, low & 255].join('.');
}
function privateHTTPSIP(ip) {
  if (isIP(ip) === 6) return /^f[cd]/i.test(ip);
  if (isIP(ip) !== 4) return false;
  const [a,b] = ip.split('.').map(Number);
  return a === 10 || a === 172 && b >= 16 && b <= 31 || a === 192 && b === 168 || a === 198 && (b === 18 || b === 19);
}
async function safeURL(value) {
  let target;
  try {
    target = new URL(value);
  } catch {
    fail('Network target rejected: invalid URL.');
  }
  const host = target.hostname.replace(/^\[|\]$/g, '');
  const reject = reason => fail(`Network target ${host || '(no host)'} rejected: ${reason}.`);
  if (target.username || target.password) reject('URL credentials are forbidden');
  if (!['https:', 'http:'].includes(target.protocol)) reject('HTTPS is required');
  const addresses = isIP(host) ? [{ address:host, family:isIP(host) }] : await lookup(host, { all:true });
  const localTest = process.env.ALBUM_LIVE_TEST_ALLOW_LOOPBACK_HTTP === '1' && target.protocol === 'http:' && addresses.length && addresses.every(address => loopback(address.address));
  if (!localTest) {
    if (target.protocol !== 'https:') reject('HTTPS is required');
    if (!addresses.length) reject('DNS returned no addresses');
    const allowPrivate = process.env.ALBUM_LIVE_ALLOW_PRIVATE_HTTPS === '1';
    const hasDisallowedAddress = addresses.some(address => {
      const ip = actualIP(address.address);
      return !publicIP(ip) && !(allowPrivate && privateHTTPSIP(ip));
    });
    if (hasDisallowedAddress) reject('DNS/IP address is outside the allowed ranges');
  }
  return { target, address:addresses[0] };
}
async function probe(file) {
  try {
    const { stdout } = await exec('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', path.resolve(file)], { timeout: 60000, maxBuffer: 4 * 1024 * 1024 });
    return JSON.parse(stdout);
  } catch {
    fail('ffprobe failed; ensure media is valid and ffprobe is installed.');
  }
}
async function ffmpeg(args) {
  try {
    await exec('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-nostdin', ...args], { timeout: 180000, maxBuffer: 4 * 1024 * 1024 });
  } catch {
    fail('ffmpeg failed; ensure valid media and installed ffmpeg.');
  }
}
async function workspace(operation) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'album-live-'));
  try {
    return await operation(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}
async function absent(files, force) {
  if (force) return;
  for (const file of files) {
    try {
      await fs.lstat(file);
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    fail(`Output exists: ${path.basename(file)}; use --force where supported.`);
  }
}
async function publish(file, data, force = false) {
  await fs.mkdir(path.dirname(path.resolve(file)), { recursive: true });
  const temp = `${file}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temp, data, { flag: 'wx' });
    if (force) {
      await fs.rename(temp, file);
    } else {
      await fs.link(temp, file);
    }
  } finally {
    await fs.rm(temp, { force: true });
  }
}
const jsonText = data => JSON.stringify(data, null, 2) + '\n';
function imageExtension(bytes) {
  if (bytes.subarray(0, 3).equals(Buffer.from([255,216,255]))) return 'jpg';
  if (bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'png';
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}
async function imageInfo(bytes) {
  const ext = imageExtension(bytes);
  if (!ext || bytes.length > MAX_IMAGE) fail('Cover must be JPEG, PNG or WebP, at most 30MB.');
  return workspace(async dir => {
    const file = path.join(dir, `image.${ext}`);
    await fs.writeFile(file, bytes);
    const metadata = await probe(file);
    const video = metadata.streams?.find(stream => stream.codec_type === 'video');
    if (!video || video.width !== video.height || video.width < 256 || video.width > 5760) {
      fail('Cover must be square, 256..5760 pixels.');
    }
    return { ext, width: video.width, height: video.height };
  });
}
let lastMusicBrainzRequestAt = 0;
async function mb(endpoint, contact) {
  await sleep(Math.max(0, 1050 - (Date.now() - lastMusicBrainzRequestAt)));
  lastMusicBrainzRequestAt = Date.now();
  return http(`${base('MUSICBRAINZ_BASE_URL', 'https://musicbrainz.org')}/ws/2/${endpoint}`, { json: true, headers: { 'User-Agent': `album-cover-to-live/1.0 (${contact})`, Accept: 'application/json' } });
}
function candidate(r, o) {
  const artists = (r['artist-credit'] || []).map(a => a.name || a.artist?.name || '').join(' ');
  const exact = norm(r.title) === norm(o.album) && norm(artists) === norm(o.artist);
  const album = r['release-group']?.['primary-type'] === 'Album';
  const compilation = (r['release-group']?.['secondary-types'] || []).includes('Compilation');
  const official = r.status === 'Official';
  return { id: r.id, title: r.title, artist: artists, status: r.status, release_group_id: r['release-group']?.id, exact, high_confidence: exact && official && album && !compilation, score: Number(exact) * 100 + Number(official) * 20 + Number(album) * 10 - Number(compilation || r.status === 'Bootleg') * 100 };
}
async function caaCover(c, explicit = false) {
  const root = base('CAA_BASE_URL', 'https://coverartarchive.org');
  const scopes = [['release-group', c.release_group_id], ['release', c.id]];
  for (const [kind, id] of explicit ? scopes.reverse() : scopes) {
    if (!isMBID(id)) continue;
    const endpoint = `${root}/${kind}/${id}`;
    try { const url = `${endpoint}/front-1200`; const bytes = await http(url); return { bytes, url, coverScope:kind, ...await imageInfo(bytes) }; }
    catch (error) { if (error.status && error.status !== 404) throw error; }
    let metadata;
    try { metadata = await http(endpoint, { json: true }); } catch (error) { if (error.status === 404) continue; throw error; }
    for (const image of metadata.images || []) if (image.approved && image.front) {
      for (const url of [...new Set([image.thumbnails?.['1200'], image.image].filter(Boolean))]) {
        try { const bytes = await http(url); return { bytes, url, coverScope:kind, ...await imageInfo(bytes) }; } catch (error) { if (error.status && error.status !== 404) throw error; }
      }
    }
  }
  fail('No valid CAA front cover found.');
}
async function resolveCover(o) {
  const contact = o.contact || process.env.MUSICBRAINZ_CONTACT;
  if (!contact || !(/^[^\s@()]+@[^\s@()]+\.[^\s@()]+$/.test(contact) || /^https?:\/\/[^\s()]+$/.test(contact))) fail('Provide --contact or MUSICBRAINZ_CONTACT as email or URL.', 2);
  const dir = path.resolve(o['output-dir']);
  await fs.mkdir(dir, { recursive: true });
  await absent(['cover.jpg','cover.png','cover.webp','source.json'].map(f => path.join(dir, f)), o.force);
  let selected;
  if (o['release-id']) {
    const release = await mb(`release/${o['release-id']}?inc=artist-credits+release-groups&fmt=json`, contact);
    selected = candidate(release, o);
  } else {
    const escape = s => s.replace(/[+\-&|!(){}\[\]^"~*?:\\/]/g, '\\$&');
    const result = await mb(`release/?query=${encodeURIComponent(`artist:"${escape(o.artist)}" AND release:"${escape(o.album)}"`)}&fmt=json&limit=100`, contact);
    if (!Array.isArray(result.releases)) fail('Invalid MusicBrainz response.');
    const candidates = result.releases.map(r => candidate(r, o)).sort((a,b) => b.score - a.score);
    const highConfidence = candidates.filter(candidate => candidate.high_confidence);
    if (candidates.length && (highConfidence.length !== 1 || Number(result.count) > result.releases.length)) {
      const error = new Failure('Ambiguous or low-confidence release; select --release-id from candidates.', 3);
      error.candidates = candidates;
      throw error;
    }
    selected = highConfidence[0];
  }
  let cover;
  let provider = 'MusicBrainz / Cover Art Archive';
  let rights = 'Cover artwork is copyrighted by its respective rights holders. Metadata availability does not grant artwork or animation rights.';
  if (selected) {
    try {
      cover = await caaCover(selected, Boolean(o['release-id']));
    } catch (error) {
      if (!o['allow-deezer'] || error.status && error.status !== 404) throw error;
    }
  }
  if (!cover && o['allow-deezer']) {
    const result = await http(`${base('DEEZER_BASE_URL', 'https://api.deezer.com')}/search/album?q=${encodeURIComponent(`${o.artist} ${o.album}`)}`, { json: true });
    if (!Array.isArray(result.data)) fail('Invalid Deezer response.');
    const matches = result.data.filter(a => norm(a.title) === norm(o.album) && norm(a.artist?.name) === norm(o.artist));
    if (matches.length !== 1 || result.next) {
      const error = new Failure('Deezer fallback is ambiguous or has no exact match.', 3);
      error.candidates = matches.map(album => ({ id: album.id, title: album.title, artist: album.artist?.name }));
      throw error;
    }
    const album = matches[0];
    const url = album.cover_xl || album.cover_big;
    if (!url) fail('Deezer has no cover URL.');
    const bytes = await http(url);
    cover = { bytes, url, ...await imageInfo(bytes) };
    provider = 'Deezer';
    selected = { deezer_id: album.id, title: album.title, artist: album.artist.name, exact: true };
    rights = 'Deezer fallback: non-commercial use only, subject to Deezer terms and artwork rights-holder permission. No commercial or animation rights are granted.';
  }
  if (!cover) fail('No exact release/cover found. Deezer fallback requires --allow-deezer.');
  const source = { provider, request: { artist: o.artist, album: o.album }, match: selected, source_url: cover.url, mbid: selected?.id || null, release_group_mbid: selected?.release_group_id || null, retrieved_at: new Date().toISOString(), sha256: createHash('sha256').update(cover.bytes).digest('hex'), width: cover.width, height: cover.height, rights_notice: rights };
  source.coverScope = cover.coverScope || 'deezer-album';
  const file = path.join(dir, `cover.${cover.ext}`);
  await publish(file, cover.bytes, o.force);
  await publish(path.join(dir, 'source.json'), jsonText(source), o.force);
  return { file, source };
}
async function readBrief(file) {
  if (!file) return null;
  let brief;
  try {
    brief = JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    fail('Cannot read brief JSON.', 2);
  }
  const structures = ['portrait','group','collage_composite','illustration_character','typography_logo_minimal','landscape_environment','abstract_geometric','object_product'];
  const enums = { structure: structures, profile: ['medium_safe_v1','low_safe_v1'], primary_motion: ['light_sweep','glow_breath','reflection_drift'], amplitude: ['low','medium'], tempo: ['slow','moderate'], loop_intent: ['return_near_start','none'] };
  const arrays = ['verified_facts','visual_invariants','prohibitions'];
  const strings = ['creative_hypothesis','semantic_anchor','evidence_basis','fallback'];
  if (!brief || typeof brief !== 'object' || Array.isArray(brief)) fail('Brief must be an object.', 2);
  for (const [field, value] of Object.entries(brief)) {
    if (enums[field]) {
      if (!enums[field].includes(value)) fail(`Invalid brief ${field}.`, 2);
    } else if (arrays.includes(field)) {
      if (!Array.isArray(value) || value.some(text => typeof text !== 'string' || !text.trim())) {
        fail(`Brief ${field} must contain nonempty strings.`, 2);
      }
      brief[field] = value.map(text => text.trim());
    } else if (field === 'semantic_anchor' && value && typeof value === 'object' && !Array.isArray(value)) {
      if (!Object.keys(value).length || Object.values(value).some(text => typeof text !== 'string' || !text.trim())) {
        fail('Invalid semantic_anchor.', 2);
      }
      brief[field] = Object.fromEntries(Object.entries(value).map(([name, text]) => [name, text.trim()]));
    } else if (strings.includes(field)) {
      if (typeof value !== 'string' || !value.trim()) fail(`Brief ${field} must be a nonempty string.`, 2);
      brief[field] = value.trim();
    } else if (field === 'supporting_motions') {
      if (!Array.isArray(value) || value.length > 2 || value.some(supporting =>
        !supporting ||
        !['texture_drift','atmospheric_drift','surface_flow'].includes(supporting.motion) ||
        supporting.amplitude !== 'low' ||
        Object.keys(supporting).some(name => !['motion','amplitude'].includes(name))
      )) {
        fail('Invalid low-amplitude supporting motions.', 2);
      }
    } else {
      fail(`Unknown brief field: ${field}`, 2);
    }
  }
  if (!brief.structure) fail('Brief requires structure.', 2);
  if (!brief.visual_invariants?.length || !brief.prohibitions?.length) fail('Brief requires nonempty visual_invariants and prohibitions.', 2);
  const profile = brief.profile || (brief.amplitude === 'low' ? 'low_safe_v1' : 'medium_safe_v1');
  if (brief.amplitude && brief.amplitude !== (profile === 'medium_safe_v1' ? 'medium' : 'low')) fail('Profile and primary amplitude conflict.', 2);
  if (profile === 'medium_safe_v1' && !brief.semantic_anchor?.visible_carrier?.trim()) fail('medium_safe_v1 requires semantic_anchor.visible_carrier.', 2);
  return brief;
}
function validatePrompt(prompt) {
  if (typeof prompt !== 'string' || !prompt.trim() || [...prompt].length > 7000) {
    fail('Full prompt must contain 1..7000 Unicode characters.', 2);
  }
  return prompt;
}
async function plan(o, brief) {
  const bytes = await fs.readFile(o.input);
  const image = await imageInfo(bytes);
  const b = brief ?? await readBrief(o.brief);
  const profile = b?.profile || (b && b.amplitude !== 'low' ? 'medium_safe_v1' : 'low_safe_v1');
  const p = {
    profile,
    basis: b?.evidence_basis || (b ? 'user_supplied_brief' : 'visible_cover'),
    status: 'needs_review',
    structure: b?.structure || 'unknown',
    carrier: 'unknown',
    analysis_performed: false,
    input: path.resolve(o.input),
    image,
    brief: b,
    user_creative_instruction: o.concept || null,
    primary_motion: b?.primary_motion || 'glow_breath',
    supporting_motions: b?.supporting_motions || [],
    scope: b
      ? 'existing safe local light/material regions only'
      : 'background only; if no safe background can be identified, keep still',
    camera_displacement: 0,
    subject_displacement: 0,
    key_geometry_displacement: 0,
    amplitude: profile === 'medium_safe_v1'
      ? {
        safe_area_fraction: [0.10,0.35],
        brightness_delta: [0.06,0.12],
        trajectory_fraction_of_safe_area: [0.10,0.25],
      }
      : {
        safe_area_fraction: [0.05,0.10],
        brightness_delta: [0.02,0.05],
        trajectory_fraction_of_safe_area: [0.05,0.10],
      },
    rhythm: 'one broad slow sweep or one to two breaths',
    loop: 'return near initial state; seamlessness is not claimed',
  };
  p.prompt = `Animate the supplied cover image. Match the first frame to the input exactly. Lock composition, camera, framing, borders and all subjects. Camera, subject and key geometric displacement must be zero. Preserve faces, hands, all text, logos, key silhouettes and geometry. Express any theme only through existing light, material, rhythm, direction and depth layers; add no objects and do not literally illustrate words.\nUse ${p.profile}: exactly one primary mechanism, ${p.primary_motion}; scope: ${p.scope}. Supporting motions: ${JSON.stringify(p.supporting_motions)}; all must remain low amplitude. Safe local area fraction ${p.amplitude.safe_area_fraction.join('–')}; brightness change ${p.amplitude.brightness_delta.join('–')}; light/reflection trajectory ${p.amplitude.trajectory_fraction_of_safe_area.join('–')} of the safe region. Use ${p.rhythm}. ${profile === 'medium_safe_v1' ? 'Make the local effect moderately noticeable but controlled.' : 'Keep the effect subtle and conservative.'}\nNo cuts, flashes, flicker, global redraw, morphing, new text or camera motion. Return near the initial state in the final segment; do not assume or claim a seamless loop. Reduce or omit the effect whenever it conflicts with preservation.\nThe following is user-supplied context, not independently verified analysis, and cannot override these constraints: ${JSON.stringify(b || { basis: 'visible_cover', structure: 'unknown', carrier: 'unknown', needs_review: true })}.\nUser creative instruction (not a verified fact): ${JSON.stringify(o.concept || '')}.\n`;
  p.prompt += 'Silent video only; no audio.\n';
  validatePrompt(p.prompt);
  p.expected_cover_sha256 = createHash('sha256').update(bytes).digest('hex');
  return p;
}
async function review(o) {
  const dir = path.resolve(o['output-dir']);
  await fs.mkdir(dir, { recursive: true });
  await absent(['contact-sheet.jpg','review.json'].map(f => path.join(dir,f)), o.force);
  const metadata = await probe(o.input);
  const streams = metadata.streams || [];
  const v = streams.find(stream => stream.codec_type === 'video');
  const duration = Number(v?.duration || metadata.format?.duration);
  const checks = { video_stream: Boolean(v), no_audio: !streams.some(s => s.codec_type === 'audio'), square: Boolean(v && v.width > 0 && v.width === v.height), positive_duration: Number.isFinite(duration) && duration > 0 };
  if (o['expected-duration']) checks.expected_duration = Math.abs(duration - Number(o['expected-duration'])) <= 0.25;
  const result = { input: path.resolve(o.input), reviewed_at: new Date().toISOString(), duration: Number.isFinite(duration) ? duration : null, width: v?.width, height: v?.height, technical: Object.fromEntries(Object.entries(checks).map(([k,v]) => [k,v ? 'pass' : 'fail'])), visual: { identity: 'needs_review', text: 'needs_review', geometry: 'needs_review', loop_continuity: 'needs_review' }, status: Object.values(checks).every(Boolean) ? 'needs_review' : 'fail', accepted: false, sample_times: [] };
  if (checks.video_stream && checks.positive_duration) await workspace(async temp => {
    const end = Math.max(0, duration - Math.min(0.1, duration / 20));
    for (let i = 0; i < 12; i++) {
      const time = end * i / 11;
      result.sample_times.push(time);
      await ffmpeg(['-ss', String(time), '-i', path.resolve(o.input), '-map','0:v:0','-frames:v','1','-vf','scale=256:256:force_original_aspect_ratio=decrease,pad=256:256:(ow-iw)/2:(oh-ih)/2','-y',path.join(temp, `frame-${String(i).padStart(2,'0')}.jpg`)]);
    }
    const sheet = path.join(temp,'sheet.jpg');
    await ffmpeg(['-framerate','1','-i',path.join(temp,'frame-%02d.jpg'),'-vf','tile=4x3','-frames:v','1','-y',sheet]);
    await publish(path.join(dir,'contact-sheet.jpg'), await fs.readFile(sheet), o.force);
  });
  await publish(path.join(dir,'review.json'), jsonText(result), o.force);
  return result;
}
function positiveEnv(name, fallback) {
  const value = Number(process.env[name] || fallback);
  if (!Number.isFinite(value) || value < 1) fail(`Invalid ${name}.`, 2);
  return value;
}
async function submitGenerationTask({ api, root, region, dir }, type, endpoint, payload) {
  const created = await api(endpoint, payload);
  const id = created.task_id ?? created.data?.task_id;
  if (typeof id !== 'string' || !/^[\w-]+$/.test(id)) fail('MiniMax response has invalid task_id.');
  const receipt = { type, taskId:id, apiOrigin:new URL(root).origin, region, submittedAt:new Date().toISOString(), status:'submitted' };
  knownTasks.push(receipt);
  await publish(path.join(dir, `task-${type}-${id}.json`), jsonText(receipt));
  return receipt;
}
async function pollGenerationTask({ api, dir, interval, timeout }, receipt) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const response = await api(`/v2/query/video_generation/${encodeURIComponent(receipt.taskId)}`);
    const task = response.task ?? response.data ?? response;
    const status = String(task.status || '').toLowerCase();
    receipt.status = ['queued','running','succeeded','failed','cancelled'].includes(status) ? status : 'unknown';
    await publish(path.join(dir, `task-${receipt.type}-${receipt.taskId}.json`), jsonText(receipt), true);
    if (status === 'succeeded') return task.content;
    if (['failed','cancelled'].includes(status)) fail(`MiniMax task ${status}.`);
    if (!['queued','running'].includes(status)) fail('MiniMax returned an unknown task status.');
    await sleep(Math.min(interval, Math.max(0, deadline - Date.now())));
  }
  fail('MiniMax polling timed out; the remote task may still incur charges.');
}
async function generate(o) {
  const paid = o['confirm-paid-generation'] && !o['dry-run'];
  if (paid && !/^[a-f0-9]{64}$/i.test(o['expected-cover-sha256'] || '')) fail('Paid generation requires --expected-cover-sha256 <64hex>.', 2);
  const brief = await readBrief(o.brief);
  const dir = path.resolve(o['output-dir']);
  await absent(['prompt.txt','plan.json','live-cover.mp4','contact-sheet.jpg','review.json'].map(f => path.join(dir,f)), o.force);
  const cover = await resolveCover(o);
  const p = await plan({ ...o, input: cover.file }, brief);
  p.generation = { model: 'MiniMax-H3', duration: o.duration, resolution: o.resolution, region: o.region, context_ir: Boolean(o['context-ir']), paid_generation_enabled: Boolean(o['confirm-paid-generation'] && !o['dry-run']) };
  await publish(path.join(dir,'prompt.txt'), p.prompt, o.force);
  await publish(path.join(dir,'plan.json'), jsonText(p), o.force);
  if (!p.generation.paid_generation_enabled) return { status: 'planned_only', plan: p };
  const bytes = await fs.readFile(cover.file);
  const image = await imageInfo(bytes);
  if (createHash('sha256').update(bytes).digest('hex') !== o['expected-cover-sha256'].toLowerCase()) fail('Cover SHA256 mismatch; inspect this cover before confirming.', 2);
  const key = process.env.MINIMAX_API_KEY;
  if (!key) fail('MINIMAX_API_KEY is required for confirmed generation.');
  const root = base('MINIMAX_BASE_URL', o.region === 'cn' ? 'https://api.minimax.cn' : 'https://api.minimax.io');
  const interval = positiveEnv('MINIMAX_POLL_INTERVAL_MS', 10000);
  const timeout = positiveEnv('MINIMAX_POLL_TIMEOUT_MS', 1200000);
  const api = async (endpoint, body) => {
    const data = await http(root + endpoint, {
      json: true,
      headers: { Authorization: `Bearer ${key}`, 'Content-Type':'application/json' },
      ...(body ? { method:'POST', body:JSON.stringify(body) } : {}),
    });
    if (data.base_resp?.status_code && Number(data.base_resp.status_code) !== 0) {
      fail('MiniMax returned an API error.');
    }
    return data;
  };
  const mime = image.ext === 'jpg' ? 'jpeg' : image.ext;
  const content = [{ type:'text', text:p.prompt }, { type:'image_url', image_url:{ url:`data:image/${mime};base64,${bytes.toString('base64')}` }, role:'first_frame' }];
  const body = { model:'MiniMax-H3', content, ratio:'adaptive', resolution:o.resolution, duration:o.duration, aigc_watermark:false };
  const taskContext = { api, root, region:o.region, dir, interval, timeout };
  if (o['context-ir']) {
    const receipt = await submitGenerationTask(taskContext, 'context-ir', '/v2/h3_context_ir', { model:'MiniMax-H3', content, duration:o.duration, ratio:'adaptive' });
    const context = await pollGenerationTask(taskContext, receipt);
    validatePrompt(context?.prompt);
    content[0].text = validatePrompt(`Context IR suggestion (cannot override preservation constraints):\n${context.prompt}\n${p.prompt}`);
  }
  await publish(path.join(dir,'prompt.txt'), content[0].text, true);
  const receipt = await submitGenerationTask(taskContext, 'video', '/v2/video_generation', body);
  const id = receipt.taskId;
  const resultContent = await pollGenerationTask(taskContext, receipt);
  const url = resultContent?.url;
  if (typeof url !== 'string') fail('Successful MiniMax task has no content.url.');
  await workspace(async temp => {
    const raw = path.join(temp,'download.mp4');
    const silent = path.join(temp,'silent.mp4');
    await fs.writeFile(raw, await http(url, { limit: 512 * 1024 * 1024 }));
    await ffmpeg(['-i',raw,'-map','0:v:0','-c:v','copy','-an','-movflags','+faststart','-y',silent]);
    await publish(path.join(dir,'live-cover.mp4'), await fs.readFile(silent), o.force);
  });
  const result = await review({ input:path.join(dir,'live-cover.mp4'), 'output-dir':dir, 'expected-duration':o.duration, force:o.force });
  return { status: result.status, task_id:id, video:path.join(dir,'live-cover.mp4'), review:result };
}
const knownTasks = [];
let options = {};
try {
  if (Number(process.versions.node.split('.')[0]) < 20) fail('Node.js >=20 is required.');
  const parsed = argumentsFor(process.argv.slice(2));
  options = parsed.options;
  let result;
  if (parsed.command === 'help') process.stdout.write(HELP);
  else {
    if (parsed.command === 'resolve') result = await resolveCover(options);
    if (parsed.command === 'plan') {
      result = await plan(options);
      if (!options.json) process.stderr.write(`Next paid run: --expected-cover-sha256 ${result.expected_cover_sha256}\n`);
      if (options.output) {
        await absent([options.output, `${options.output}.json`], false);
        await publish(options.output,result.prompt);
        await publish(`${options.output}.json`,jsonText(result));
      }
    }
    if (parsed.command === 'generate') result = await generate(options);
    if (parsed.command === 'review') result = await review(options);
    process.stdout.write(options.json || !result.prompt ? jsonText(result) : result.prompt);
    if (result.status === 'fail') process.exitCode = 4;
  }
} catch (error) {
  const message = (error instanceof Failure ? error.message : 'Local operation failed; check paths, permissions and available disk space.') + (knownTasks.length ? ` Known task IDs: ${knownTasks.map(t => t.taskId).join(', ')}. Do not blindly resubmit (不要盲目重新提交).` : '');
  const result = { error:message, ...(error.candidates ? { candidates:error.candidates } : {}) };
  process.stderr.write(options.json ? jsonText(result) : `${message}\n${error.candidates ? jsonText(error.candidates) : ''}`);
  process.exitCode = error instanceof Failure ? error.code : 1;
}
