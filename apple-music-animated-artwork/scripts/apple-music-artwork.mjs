#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { link, lstat, rename, stat, unlink } from 'node:fs/promises';
import path from 'node:path';

const OFFICIAL_ORIGIN = 'https://api.music.apple.com';
const WEB_ORIGIN = 'https://amp-api.music.apple.com';
const MUSIC_ORIGIN = 'https://music.apple.com';
const JWT_PATTERN = /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g;

const HELP = `Apple Music animated artwork CLI (Node.js 20+)

Usage:
  apple-music-artwork.mjs search <query> [--storefront us] [--limit N] [--json] [--experimental-web-token]
  apple-music-artwork.mjs inspect <album-id-or-Apple-Music-URL> [--storefront us] [--json] [--experimental-web-token]
  apple-music-artwork.mjs download <album-id-or-Apple-Music-URL> --variant square|tall [--resolution best|WxH] [--output path] [--storefront us] [--force] [--experimental-web-token]
  apple-music-artwork.mjs help

Authentication:
  Prefer APPLE_MUSIC_DEVELOPER_TOKEN for the official Catalog API.
  Use --experimental-web-token only when explicitly approved; it relies on undocumented Apple Web behavior.

Download selection:
  --resolution defaults to best for backward compatibility. Exact WxH matching never falls back.
`;

class CliError extends Error {
  constructor(message, exitCode = 1) {
    super(message);
    this.exitCode = exitCode;
  }
}

function caughtMessage(value) {
  return value instanceof Error ? value.message : 'Unexpected failure.';
}

function requireNode20() {
  if (Number.parseInt(process.versions.node.split('.')[0], 10) < 20) {
    throw new CliError('Node.js 20 or newer is required.');
  }
}

function parseArgs(argv) {
  if (argv.length === 0 || argv[0] === '--help' || argv[0] === '-h' || argv[0] === 'help') {
    return { command: 'help' };
  }

  const command = argv[0];
  if (!['search', 'inspect', 'download'].includes(command)) {
    throw new CliError(`Unknown command: ${command}. Run with --help for usage.`, 2);
  }

  const options = { storefront: 'us', limit: 5, resolution: 'best', json: false, force: false, experimentalWebToken: false };
  const positionals = [];
  const supplied = new Set();
  const valueOptions = new Map([
    ['--storefront', 'storefront'],
    ['--limit', 'limit'],
    ['--variant', 'variant'],
    ['--resolution', 'resolution'],
    ['--output', 'output'],
  ]);
  const booleanOptions = new Map([
    ['--json', 'json'],
    ['--force', 'force'],
    ['--experimental-web-token', 'experimentalWebToken'],
  ]);

  for (let index = 1; index < argv.length; index += 1) {
    const argument = argv[index];
    if (valueOptions.has(argument)) {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) throw new CliError(`${argument} requires a value.`, 2);
      options[valueOptions.get(argument)] = value;
      supplied.add(argument);
      index += 1;
    } else if (booleanOptions.has(argument)) {
      options[booleanOptions.get(argument)] = true;
      supplied.add(argument);
    } else if (argument.startsWith('-')) {
      throw new CliError(`Unknown option: ${argument}. Run with --help for usage.`, 2);
    } else {
      positionals.push(argument);
    }
  }

  options.storefront = normalizeStorefront(options.storefront);
  if (command !== 'search' && supplied.has('--limit')) {
    throw new CliError('--limit is only supported by search.', 2);
  }

  if (command === 'search') {
    options.limit = normalizeLimit(options.limit);
    if (positionals.length === 0) throw new CliError('search requires a query.', 2);
    if (options.variant || options.output || options.force || supplied.has('--resolution')) throw new CliError('download-only options cannot be used with search.', 2);
    options.query = positionals.join(' ');
  } else {
    if (positionals.length !== 1) throw new CliError(`${command} requires exactly one album ID or Apple Music URL.`, 2);
    options.albumInput = positionals[0];
    if (command === 'inspect' && (options.variant || options.output || options.force || supplied.has('--resolution'))) {
      throw new CliError('download-only options cannot be used with inspect.', 2);
    }
    if (command === 'download') {
      if (!['square', 'tall'].includes(options.variant)) throw new CliError('download requires --variant square or --variant tall.', 2);
      options.resolution = normalizeResolution(options.resolution);
      if (options.json) throw new CliError('--json is not supported by download.', 2);
    }
  }

  return { command, options };
}

function normalizeStorefront(value) {
  if (!/^[A-Za-z]{2}$/.test(String(value))) {
    throw new CliError('Storefront must be a two-letter code, for example us or jp.', 2);
  }
  return String(value).toLowerCase();
}

function normalizeLimit(value) {
  if (!/^\d+$/.test(String(value))) throw new CliError('Limit must be an integer from 1 to 25.', 2);
  const limit = Number(value);
  if (limit < 1 || limit > 25) throw new CliError('Limit must be between 1 and 25.', 2);
  return limit;
}

function normalizeResolution(value) {
  if (String(value).toLowerCase() === 'best') return 'best';
  const match = String(value).match(/^(\d+)[xX](\d+)$/);
  if (!match || Number(match[1]) === 0 || Number(match[2]) === 0) {
    throw new CliError('Resolution must be best or an exact size such as 1080x1080.', 2);
  }
  return `${Number(match[1])}x${Number(match[2])}`;
}

function parseAlbumInput(input, fallbackStorefront) {
  if (/^\d+$/.test(input)) return { id: input, storefront: fallbackStorefront };

  let url;
  try {
    url = new URL(input);
  } catch {
    throw new CliError('Album must be a numeric ID or a valid Apple Music URL.', 2);
  }

  if (url.protocol !== 'https:' || url.hostname !== 'music.apple.com' || url.username || url.password || url.port || url.hash) {
    throw new CliError('Only https://music.apple.com album URLs are accepted.', 2);
  }

  const segments = url.pathname.split('/').filter(Boolean);
  if (segments.length !== 4 || segments[1] !== 'album' || !/^\d+$/.test(segments[3])) {
    throw new CliError('Expected an Apple Music URL shaped like https://music.apple.com/us/album/name/123.', 2);
  }

  return { storefront: normalizeStorefront(segments[0]), id: segments[3] };
}

async function getAuthentication(experimentalWebToken) {
  const developerToken = process.env.APPLE_MUSIC_DEVELOPER_TOKEN;
  if (developerToken) return { token: developerToken, origin: OFFICIAL_ORIGIN, headers: {} };
  if (!experimentalWebToken) {
    throw new CliError('Missing APPLE_MUSIC_DEVELOPER_TOKEN. Set it, or explicitly use --experimental-web-token for best-effort Web authentication.');
  }

  const token = await discoverWebToken();
  return { token, origin: WEB_ORIGIN, headers: { Origin: MUSIC_ORIGIN } };
}

async function discoverWebToken() {
  const signal = AbortSignal.timeout(30_000);
  let html;
  try {
    const response = await fetch(MUSIC_ORIGIN, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal });
    if (!response.ok) throw new CliError(`Experimental token discovery could not load music.apple.com (HTTP ${response.status}).`);
    html = await response.text();
    if (signal.aborted) throw new CliError('Experimental token discovery timed out after 30 seconds.');
  } catch (error) {
    if (signal.aborted) throw new CliError('Experimental token discovery timed out after 30 seconds.');
    if (error instanceof CliError) throw error;
    throw new CliError(`Experimental token discovery failed: ${caughtMessage(error)}`);
  }

  const assetPaths = [...html.matchAll(/(?:src=["']|["'])(\/?assets\/[^"'<>\\?]+\.js)(?:[?][^"'<>\\]*)?["']/gi)]
    .map((match) => match[1].startsWith('/') ? match[1] : `/${match[1]}`);
  const uniqueAssets = [...new Set(assetPaths)].sort((left, right) => assetPriority(right) - assetPriority(left));
  if (uniqueAssets.length === 0) throw new CliError('Experimental token discovery found no Apple Music JavaScript assets; the Web client may have changed.');

  for (const assetPath of uniqueAssets) {
    try {
      const response = await fetch(new URL(assetPath, MUSIC_ORIGIN), { headers: { 'User-Agent': 'Mozilla/5.0' }, signal });
      if (!response.ok) continue;
      const source = await response.text();
      if (signal.aborted) throw new CliError('Experimental token discovery timed out after 30 seconds.');
      const token = source.match(JWT_PATTERN)?.[0];
      if (token) return token;
    } catch (error) {
      if (signal.aborted) throw new CliError('Experimental token discovery timed out after 30 seconds.');
      // Continue through public assets; report one sanitized failure only after all candidates fail.
    }
  }

  if (signal.aborted) throw new CliError('Experimental token discovery timed out after 30 seconds.');
  throw new CliError('Experimental token discovery found no bearer token; Apple may have changed or rate-limited the Web client.');
}

function assetPriority(assetPath) {
  const value = assetPath.toLowerCase();
  return (value.includes('index') ? 4 : 0) + (value.includes('web-client') ? 2 : 0) + (value.includes('apple-music') ? 1 : 0);
}

async function catalogRequest(auth, pathname, parameters) {
  const url = new URL(pathname, auth.origin);
  for (const [name, value] of Object.entries(parameters)) url.searchParams.set(name, String(value));

  const signal = AbortSignal.timeout(15_000);
  let response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${auth.token}`, Accept: 'application/json', ...auth.headers },
      signal,
    });
  } catch (error) {
    if (signal.aborted) throw new CliError('Apple Music request timed out after 15 seconds.');
    throw new CliError(`Apple Music request failed: ${caughtMessage(error)}`);
  }

  if (!response.ok) throwHttpError(response.status);
  try {
    const payload = await response.json();
    if (signal.aborted) throw new CliError('Apple Music request timed out after 15 seconds.');
    return payload;
  } catch (error) {
    if (signal.aborted) throw new CliError('Apple Music request timed out after 15 seconds.');
    if (error instanceof CliError) throw error;
    throw new CliError('Apple Music returned an invalid JSON response.');
  }
}

function throwHttpError(status) {
  const messages = {
    401: 'Apple Music rejected the token (HTTP 401). Generate or supply a valid token.',
    403: 'Apple Music denied this request (HTTP 403). Check token permissions, storefront, and experimental access.',
    404: 'Apple Music could not find this album or endpoint (HTTP 404). Check the album ID and storefront.',
    429: 'Apple Music rate-limited the request (HTTP 429). Wait and retry later.',
  };
  throw new CliError(messages[status] ?? `Apple Music request failed (HTTP ${status}).`);
}

async function searchAlbums(options, auth) {
  const payload = await catalogRequest(auth, `/v1/catalog/${options.storefront}/search`, {
    term: options.query,
    types: 'albums',
    limit: options.limit,
  });
  return (payload.results?.albums?.data ?? []).map(({ id, attributes = {} }) => ({
    id,
    name: attributes.name ?? null,
    artistName: attributes.artistName ?? null,
    url: attributes.url ?? null,
  }));
}

async function inspectAlbum(options, auth) {
  const target = parseAlbumInput(options.albumInput, options.storefront);
  const payload = await catalogRequest(auth, `/v1/catalog/${target.storefront}/albums/${target.id}`, {
    extend: 'editorialVideo',
    platform: 'web',
  });
  const album = payload.data?.[0];
  if (!album) throw new CliError('Apple Music returned no album for that ID and storefront.');
  const attributes = album.attributes ?? {};
  const editorialVideo = attributes.editorialVideo ?? album.editorialVideo ?? {};
  const squareUrl = findHlsUrl(editorialVideo.motionDetailSquare);
  const tallUrl = findHlsUrl(editorialVideo.motionDetailTall);
  const [square, tall] = await Promise.all([
    inspectPlaylist('square', squareUrl),
    inspectPlaylist('tall', tallUrl),
  ]);

  return {
    id: album.id,
    storefront: target.storefront,
    name: attributes.name ?? null,
    artistName: attributes.artistName ?? null,
    url: attributes.url ?? null,
    variants: { square, tall },
  };
}

async function inspectPlaylist(variant, playlistUrl) {
  if (!playlistUrl) return { available: false, url: null, playlistType: null, resolutions: [], streams: [] };

  const signal = AbortSignal.timeout(15_000);
  let response;
  try {
    response = await fetch(playlistUrl, {
      headers: { Accept: 'application/vnd.apple.mpegurl, application/x-mpegURL, text/plain' },
      signal,
    });
  } catch (error) {
    if (signal.aborted) throw new CliError(`Could not fetch the ${variant} HLS playlist within 15 seconds.`);
    throw new CliError(`Could not fetch the ${variant} HLS playlist: ${caughtMessage(error)}`);
  }
  if (!response.ok) throw new CliError(`Could not fetch the ${variant} HLS playlist (HTTP ${response.status}).`);

  let source;
  try {
    source = await response.text();
    if (signal.aborted) throw new CliError(`Could not fetch the ${variant} HLS playlist within 15 seconds.`);
  } catch (error) {
    if (signal.aborted) throw new CliError(`Could not fetch the ${variant} HLS playlist within 15 seconds.`);
    if (error instanceof CliError) throw error;
    throw new CliError(`Could not fetch the ${variant} HLS playlist: ${caughtMessage(error)}`);
  }

  const parsed = parseHlsPlaylist(source, playlistUrl);
  return {
    available: true,
    url: playlistUrl,
    playlistType: parsed.isMaster ? 'master' : 'media',
    resolutions: [...new Set(parsed.streams.map((stream) => stream.resolution).filter(Boolean))]
      .sort(compareResolutions),
    streams: parsed.streams,
  };
}

function parseHlsPlaylist(source, playlistUrl) {
  const lines = source.replace(/^\uFEFF/, '').split(/\r?\n/).map((line) => line.trim());
  if (lines[0] !== '#EXTM3U') {
    throw new CliError('HLS response is not a valid playlist: missing #EXTM3U header.');
  }

  const streams = [];
  let isMaster = false;

  for (let index = 0; index < lines.length; index += 1) {
    if (!lines[index].startsWith('#EXT-X-STREAM-INF:')) continue;
    isMaster = true;
    const attributes = parseAttributeList(lines[index].slice('#EXT-X-STREAM-INF:'.length));
    let uriIndex = index + 1;
    while (lines[uriIndex] === '') uriIndex += 1;
    const uri = lines[uriIndex];
    if (!uri || uri.startsWith('#')) throw new CliError('HLS master playlist has a variant without a following playlist URL.');

    const resolutionMatch = attributes.RESOLUTION?.match(/^(\d+)[xX](\d+)$/);
    const bandwidth = parsePositiveInteger(attributes.BANDWIDTH);
    const averageBandwidth = parsePositiveInteger(attributes['AVERAGE-BANDWIDTH']);
    let url;
    try {
      url = new URL(uri, playlistUrl).href;
    } catch {
      throw new CliError('HLS master playlist contains an invalid variant URL.');
    }
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'https:') {
      throw new CliError('HLS master playlist contains a non-HTTPS variant URL.');
    }
    if (parsedUrl.username || parsedUrl.password) {
      throw new CliError('HLS master playlist contains an invalid variant URL.');
    }

    streams.push({
      resolution: resolutionMatch ? `${Number(resolutionMatch[1])}x${Number(resolutionMatch[2])}` : null,
      width: resolutionMatch ? Number(resolutionMatch[1]) : null,
      height: resolutionMatch ? Number(resolutionMatch[2]) : null,
      bandwidth,
      averageBandwidth,
      codecs: attributes.CODECS ?? null,
      url,
    });
    index = uriIndex;
  }

  if (!isMaster) {
    let waitingForSegment = false;
    const hasMediaSegment = lines.some((line) => {
      if (line.startsWith('#EXTINF:')) waitingForSegment = true;
      return waitingForSegment && Boolean(line) && !line.startsWith('#');
    });
    if (!hasMediaSegment) throw new CliError('HLS media playlist contains no media segments.');
  }

  return { isMaster, streams };
}

function parseAttributeList(source) {
  const attributes = {};
  let index = 0;

  while (index < source.length) {
    while (source[index] === ',' || /\s/.test(source[index] ?? '')) index += 1;
    const nameStart = index;
    while (index < source.length && source[index] !== '=') index += 1;
    if (index >= source.length) break;
    const name = source.slice(nameStart, index).trim().toUpperCase();
    index += 1;

    let value = '';
    if (source[index] === '"') {
      index += 1;
      while (index < source.length) {
        if (source[index] === '"') {
          index += 1;
          break;
        }
        value += source[index];
        index += 1;
      }
    } else {
      const valueStart = index;
      while (index < source.length && source[index] !== ',') index += 1;
      value = source.slice(valueStart, index).trim();
    }
    if (name) attributes[name] = value;
    while (index < source.length && source[index] !== ',') index += 1;
    if (source[index] === ',') index += 1;
  }

  return attributes;
}

function parsePositiveInteger(value) {
  if (!/^\d+$/.test(value ?? '')) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

function compareResolutions(left, right) {
  const [leftWidth, leftHeight] = left.split('x').map(Number);
  const [rightWidth, rightHeight] = right.split('x').map(Number);
  return (leftWidth * leftHeight) - (rightWidth * rightHeight) || leftWidth - rightWidth || leftHeight - rightHeight;
}

function findHlsUrl(value) {
  if (typeof value === 'string') return isHlsUrl(value) ? value : null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findHlsUrl(item);
      if (found) return found;
    }
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) {
      const found = findHlsUrl(item);
      if (found) return found;
    }
  }
  return null;
}

function isHlsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:'
      && !url.username
      && !url.password
      && /\.m3u8$/i.test(url.pathname);
  } catch {
    return false;
  }
}

function printSearch(albums, json) {
  if (json) {
    console.log(JSON.stringify(albums, null, 2));
  } else if (albums.length === 0) {
    console.log('No albums found.');
  } else {
    for (const album of albums) console.log(`${album.id}\t${album.name ?? ''}\t${album.artistName ?? ''}\t${album.url ?? ''}`);
  }
}

function printInspection(album, json) {
  if (json) {
    console.log(JSON.stringify(album, null, 2));
  } else {
    console.log(`${album.name ?? 'Unknown album'} — ${album.artistName ?? 'Unknown artist'} (${album.id})`);
    for (const variantName of ['square', 'tall']) {
      const variant = album.variants[variantName];
      if (!variant.available) {
        console.log(`${variantName}: unavailable`);
      } else if (variant.playlistType === 'media') {
        console.log(`${variantName}: available (media playlist; resolution not advertised)`);
      } else {
        console.log(`${variantName}: available — ${variant.resolutions.join(', ') || 'no advertised resolutions'}`);
      }
    }
  }
}

function safeFilename(value) {
  const cleaned = value
    .normalize('NFKC')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
    .replace(/[. ]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const base = cleaned || 'apple-music-artwork';
  return /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(base) ? `_${base}` : base;
}

function truncateUtf8(value, maxBytes) {
  let result = '';
  let byteLength = 0;
  for (const character of value) {
    const characterBytes = Buffer.byteLength(character);
    if (byteLength + characterBytes > maxBytes) break;
    result += character;
    byteLength += characterBytes;
  }
  return result;
}

function defaultArtworkName(album, options) {
  const suffix = ` [${album.id}]-${options.variant}-${options.resolution}.mp4`;
  const availableBytes = 255 - Buffer.byteLength(suffix);
  if (availableBytes < 0) throw new CliError('Default output filename suffix exceeds 255 UTF-8 bytes.');

  const description = safeFilename(`${album.artistName ?? 'Unknown Artist'} - ${album.name ?? 'Unknown Album'}`);
  const truncatedDescription = truncateUtf8(description, availableBytes).replace(/[. ]+$/g, '');
  return `${truncatedDescription}${suffix}`;
}

async function downloadAlbum(options, auth) {
  const album = await inspectAlbum(options, auth);
  const streamUrl = selectStreamUrl(album.variants[options.variant], options.variant, options.resolution);

  const defaultName = defaultArtworkName(album, options);
  const outputPath = path.resolve(options.output ?? defaultName);
  await ensureOutputPath(outputPath, options.force);
  await runFfmpeg(streamUrl, outputPath, options.force);
  console.log(`Saved ${outputPath}`);
}

function selectStreamUrl(variant, variantName, resolution) {
  if (!variant.available) throw new CliError(`No ${variantName} animated artwork is available for this album.`);
  if (variant.playlistType === 'media') {
    if (resolution === 'best') return variant.url;
    throw new CliError(`Cannot select ${resolution}: the ${variantName} artwork is a media playlist and advertises no rendition sizes. Use --resolution best.`);
  }

  const candidates = resolution === 'best'
    ? variant.streams.filter((stream) => stream.resolution)
    : variant.streams.filter((stream) => stream.resolution === resolution);
  if (candidates.length === 0) {
    const available = variant.resolutions.length > 0 ? variant.resolutions.join(', ') : 'none advertised';
    throw new CliError(`Resolution ${resolution} is unavailable for ${variantName}. Available sizes: ${available}.`);
  }

  return [...candidates].sort(compareStreams)[0].url;
}

function compareStreams(left, right) {
  const areaDifference = (right.width * right.height) - (left.width * left.height);
  if (areaDifference !== 0) return areaDifference;
  const bandwidthDifference = effectiveBandwidth(right) - effectiveBandwidth(left);
  if (bandwidthDifference !== 0) return bandwidthDifference;
  const averageDifference = (right.averageBandwidth ?? 0) - (left.averageBandwidth ?? 0);
  if (averageDifference !== 0) return averageDifference;
  if (left.url < right.url) return -1;
  if (left.url > right.url) return 1;
  return 0;
}

function effectiveBandwidth(stream) {
  return stream.bandwidth ?? stream.averageBandwidth ?? 0;
}

async function ensureOutputPath(outputPath, force) {
  const outputDirectory = path.dirname(outputPath);
  try {
    const parent = await stat(outputDirectory);
    if (!parent.isDirectory()) throw new CliError(`Output parent is not a directory: ${outputDirectory}`);
  } catch (error) {
    if (error instanceof CliError) throw error;
    if (error.code === 'ENOENT') throw new CliError(`Output directory does not exist: ${outputDirectory}`);
    if (error.code === 'ENOTDIR') throw new CliError(`Output parent is not a directory: ${outputDirectory}`);
    if (error.code === 'EACCES' || error.code === 'EPERM') {
      throw new CliError(`Cannot access output directory: ${outputDirectory} (${error.code}).`);
    }
    throw new CliError(`Cannot inspect output directory: ${outputDirectory} (${error.code ?? 'UNKNOWN'}).`);
  }

  try {
    const output = await lstat(outputPath);
    if (output.isDirectory()) throw new CliError(`Output path is a directory: ${outputPath}`);
    if (!force) throw new CliError(`Output already exists: ${outputPath}. Use --force to overwrite it.`);
  } catch (error) {
    if (error instanceof CliError) throw error;
    if (error.code !== 'ENOENT') throw new CliError(`Cannot inspect output path: ${outputPath} (${error.code ?? 'UNKNOWN'}).`);
  }
}

function runFfmpegProcess(mediaUrl, temporaryPath) {
  return new Promise((resolve, reject) => {
    const args = ['-n', '-protocol_whitelist', 'https,tls,tcp,crypto', '-i', mediaUrl, '-c', 'copy', '-movflags', '+faststart', temporaryPath];
    const child = spawn('ffmpeg', args, { shell: false, stdio: ['ignore', 'inherit', 'inherit'] });
    let spawnFailed = false;
    child.once('error', (error) => {
      spawnFailed = true;
      if (error.code === 'ENOENT') reject(new CliError('ffmpeg was not found. Install FFmpeg and ensure ffmpeg is on PATH.'));
      else reject(new CliError(`Could not start ffmpeg: ${caughtMessage(error)}`));
    });
    child.once('close', (code, signal) => {
      if (spawnFailed) return;
      if (code === 0) resolve();
      else reject(new CliError(`ffmpeg failed${signal ? ` with signal ${signal}` : ` with exit code ${code}`}. The HLS stream may be unavailable, encrypted, or unsupported.`));
    });
  });
}

async function removeTemporaryFile(temporaryPath) {
  try {
    await unlink(temporaryPath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw new CliError(`Could not remove temporary file: ${temporaryPath} (${error.code ?? 'UNKNOWN'}).`);
    }
  }
}

async function runFfmpeg(mediaUrl, outputPath, force) {
  const extension = path.extname(outputPath);
  const temporaryName = `.apple-music-artwork-${randomUUID()}${extension}`;
  if (Buffer.byteLength(temporaryName) > 255) {
    throw new CliError('Temporary output filename exceeds 255 UTF-8 bytes because the output extension is too long.');
  }
  const temporaryPath = path.join(path.dirname(outputPath), temporaryName);

  try {
    await runFfmpegProcess(mediaUrl, temporaryPath);
  } catch (error) {
    try {
      await removeTemporaryFile(temporaryPath);
    } catch (cleanupError) {
      throw new CliError(`${caughtMessage(error)} ${cleanupError.message}`);
    }
    throw error;
  }

  if (force) {
    try {
      await rename(temporaryPath, outputPath);
    } catch (error) {
      const publicationError = new CliError(`Could not publish output file: ${outputPath} (${error.code ?? 'UNKNOWN'}).`);
      try {
        await removeTemporaryFile(temporaryPath);
      } catch (cleanupError) {
        throw new CliError(`${publicationError.message} ${cleanupError.message}`);
      }
      throw publicationError;
    }
    return;
  }

  try {
    await link(temporaryPath, outputPath);
  } catch (error) {
    const publicationError = error.code === 'EEXIST'
      ? new CliError(`Output already exists: ${outputPath}. Use --force to overwrite it.`)
      : new CliError(`Could not publish output file: ${outputPath} (${error.code ?? 'UNKNOWN'}).`);
    try {
      await removeTemporaryFile(temporaryPath);
    } catch (cleanupError) {
      throw new CliError(`${publicationError.message} ${cleanupError.message}`);
    }
    throw publicationError;
  }

  await removeTemporaryFile(temporaryPath);
}

async function main() {
  requireNode20();
  const { command, options } = parseArgs(process.argv.slice(2));
  if (command === 'help') {
    process.stdout.write(HELP);
    return;
  }

  const auth = await getAuthentication(options.experimentalWebToken);
  if (command === 'search') printSearch(await searchAlbums(options, auth), options.json);
  if (command === 'inspect') printInspection(await inspectAlbum(options, auth), options.json);
  if (command === 'download') await downloadAlbum(options, auth);
}

main().catch((error) => {
  const message = caughtMessage(error);
  console.error(`Error: ${message}`);
  process.exitCode = error instanceof CliError ? error.exitCode : 1;
});
