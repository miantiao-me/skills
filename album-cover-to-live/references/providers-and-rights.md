# Providers and rights

本页记录当前脚本的接入边界；不是封面授权或服务条款的替代品。发布或商用前核对当时有效条款与权利人许可。

## MusicBrainz：元数据主链

- 默认根地址 `https://musicbrainz.org`。
- 搜索：`GET /ws/2/release/?query=<encoded artist/release query>&fmt=json&limit=100`。
- 显式发行版：`GET /ws/2/release/<mbid>?inc=artist-credits+release-groups&fmt=json`。
- 使用 `User-Agent: album-cover-to-live/1.0 (<contact>)` 和 `Accept: application/json`。`--contact` 优先于 `MUSICBRAINZ_CONTACT`，必须是邮箱或 HTTP(S) URL；不是 API key。
- 每个进程的 MusicBrainz 请求开始时间间隔至少 1050ms，遵守每秒至多一次的限制；多进程没有共享限流，调用者必须串行协调，不能靠并行绕过。
- 自动选择要求标准化后的 artist/title 精确匹配、Official、Album、非 Compilation，且唯一高置信候选、结果未截断。否则返回候选及退出码 3；指定 release ID 不替代用户核实内容。
- [API 文档](https://musicbrainz.org/doc/MusicBrainz_API)、[限流](https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting)、[数据库许可](https://musicbrainz.org/doc/About/Data_License)：核心数据与补充数据许可不同（CC0 / CC BY-SA）；元数据许可不覆盖封面图像。

## Cover Art Archive：默认封面来源

- 根地址 `https://coverartarchive.org`。自动候选先 release-group 再 release；显式 `--release-id` 先 release 再 release-group：`GET /release-group/<mbid>/front-1200`、`GET /release/<mbid>/front-1200`。`source.json.coverScope` 如实记录实际封面层级。
- 必要时读取对应 `GET /release-group/<mbid>` 或 `GET /release/<mbid>` JSON，选择 `approved && front`，依次尝试 `thumbnails["1200"]` 和 `image`。
- 跟随 HTTP redirect（可能转向图片托管服务）；`source.json` 保存请求来源 URL，不保证是最终 redirect 目标。CAA/图片请求没有脚本自定义 MusicBrainz User-Agent 或共享 1req/s 限流，应保守串行使用。
- 404 可继续尝试元数据、其他图像或下一发行层级；无有效图像则失败。503 表示服务不可用，不是“无封面”，不会据此切换 Deezer；稍后人工重试。HTTP 429/503 无自动退避重试。图片无效或非 HTTP 状态错误在部分候选分支可继续尝试，不能把它们都解释成 404。
- 接受 JPEG/PNG/WebP，最多 30 MiB，正方形 256–5760 像素；不自动裁剪。
- [CAA API](https://musicbrainz.org/doc/Cover_Art_Archive/API)、[CAA 说明](https://musicbrainz.org/doc/Cover_Art_Archive)：可下载不等于取得复制、改编、模型上传或商业发行许可。使用或改编封面需要取得相应授权。

## Deezer：显式选择的备用来源

- 只有 `--allow-deezer` 才允许备用请求：`GET https://api.deezer.com/search/album?q=<encoded artist album>`。
- 仅接受唯一精确 artist/title 匹配且没有 `next` 分页标志，使用 `cover_xl` 或 `cover_big`；仍要求同样的图像校验。歧义返回 3。
- 不是无条件故障转移：MusicBrainz 歧义、服务错误或 CAA 非 404 HTTP 错误不会被静默绕过。Deezer 与图片下载使用跟随 redirect 的请求，不设置专用 User-Agent 或限流器。
- 本 Skill 将备用使用限定为非商业用途，仍受 [Deezer 开发者条款](https://developers.deezer.com/termsofuse) 和封面权利人许可约束；不授予动画或商业使用权，也不承诺 API 长期可用。

## 不接入其他目录服务

不接 Discogs：避免新增凭据、来源归属与图像使用条款处理，保持最小的元数据/封面链。不接 Spotify：不将其平台内容接入本生成路径，避免新增认证和平台内容使用限制。它们的元数据或图片可见性都不能替代生成式改编授权。不使用 Apple 服务、endpoint 或 token。

## 费用与隐私

resolve / generate 的准备阶段会向目录提供商发送 artist/album 或发行 ID，向 MusicBrainz 发送联系方式，并向图片托管方暴露网络请求信息。HTTP 超时 60 秒。自定义 base URL 可改变接收方；只使用信任的地址，redirect 也会改变图片接收方。

H3 确认后会接收完整 prompt、brief 上下文和 base64 封面；`--context-ir` 还会先请求上下文接口。不要在 brief 中放秘密或无权上传的资料。key 不写入输出，但本地 prompt/plan/source 保存输入、事实来源及来源信息；自行保护和清理。远端保留、地区处理、收费以提供方政策为准；超时不取消远端任务，不保证退款或免费重试。

付费必须传 `--expected-cover-sha256 <64hex>`，在读取 key 前对实际上传的同一 Buffer 做 magic、尺寸、SHA 校验。Context IR 的 POST `/v2/h3_context_ir` 含 model MiniMax-H3、text + first_frame image、duration、ratio adaptive，返回 task_id；与视频共用 `/v2/query/video_generation/<id>` 轮询 `task.status/content`（兼容 data/root envelope）。Context 成功取 `content.prompt`，合成通用保护/静音/首尾约束并验证完整 prompt ≤7000 Unicode 字符，写入 `prompt.txt`；视频 POST 不含 `context_ir`。创建成功立即原子记录不敏感 receipt，后续错误带任务 ID，勿盲目重提。

动态媒体及 API URL 拒绝凭据，默认仅允许公网 HTTPS；全部 DNS 结果校验且连接绑定已校验地址。redirect 手动最多五跳、逐跳校验，Bearer 请求禁止跨源。独立且默认关闭的本地测试例外 `ALBUM_LIVE_TEST_ALLOW_LOOPBACK_HTTP=1` 仅允许 loopback HTTP，必须只用假凭据；无需大型 CDN allowlist。

`ALBUM_LIVE_ALLOW_PRIVATE_HTTPS` 默认关闭，仅精确 `1` 开启：共享网络层全局额外允许 RFC1918 IPv4、IPv6 ULA fc00/7、fake-IP 198.18/15 的 HTTPS，无域名白名单。仅可信代理/DNS 环境显式开启：提供方下载 URL/重定向可能访问内网。IPv4-mapped IPv6 按实际 IPv4 检查，不额外放行 loopback、link-local、unspecified、multicast；不关闭 TLS 证书验证，URL 凭据禁止、全部 DNS 检查与连接绑定、逐跳 redirect 和 Bearer 跨源禁止不变。拒绝错误只报主机与原因，不含完整 URL 参数或密钥。

原创脚本与文档使用仓库 [MIT 许可](../../LICENSE)；没有引入需单独 LICENSE 的第三方实现。MIT 许可不覆盖封面、视频或提供商数据权利；从公开接口获取图像不等于取得版权，使用或改编封面及生成视频需要取得相应权利人授权。
