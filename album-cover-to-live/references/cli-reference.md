# CLI Reference

本页记录 `album-cover-to-live` 命令行工具的完整参数、Brief Schema、环境变量、产物规范与退出码。

## 命令与参数

CLI 运行入口为 `node scripts/album-cover-to-live.mjs <command> [options]`。不传命令时默认输出帮助信息。

```text
resolve --artist <name> --album <title> --output-dir <dir> [--contact <email-or-url>] [--release-id <mbid>] [--allow-deezer] [--force] [--json]
plan --input <cover> [--brief <json-file>] [--concept <text>] [--output <prompt.txt>] [--json]
generate --artist <name> --album <title> --output-dir <dir> [--contact <email-or-url>] [--release-id <mbid>] [--allow-deezer] [--brief <json-file>] [--concept <text>] [--duration <4..15>] [--resolution <768P|2K>] [--region <global|cn>] [--context-ir] [--dry-run] [--confirm-paid-generation] [--expected-cover-sha256 <64hex>] [--force] [--json]
review --input <video.mp4> --output-dir <dir> [--expected-duration <seconds>] [--force] [--json]
help
```

### 参数说明

| 参数 | 适用命令 | 含义与约束 |
| --- | --- | --- |
| `--artist` | `resolve`, `generate` | 必填艺术家名称。用于元数据检索，不作为自动核实的内容事实。 |
| `--album` | `resolve`, `generate` | 必填专辑名称。用于元数据检索。 |
| `--output-dir` | `resolve`, `generate`, `review` | 必填输出目录。执行失败时可能留下部分产物，无事务回滚。 |
| `--contact` | `resolve`, `generate` | MusicBrainz 联系方式（邮箱或 URL）。优先于 `MUSICBRAINZ_CONTACT`。 |
| `--release-id` | `resolve`, `generate` | 指定 MusicBrainz Release UUID（非 release-group ID）。用于消除检索歧义。 |
| `--allow-deezer` | `resolve`, `generate` | 显式启用 Deezer 受限备用检索（仅限非商业用途）。 |
| `--input` | `plan`, `review` | `plan` 时为本地封面图片路径；`review` 时为本地待复核视频路径。 |
| `--brief` | `plan`, `generate` | 指定 Motion Brief JSON 文件路径。 |
| `--concept` | `plan`, `generate` | 用户创意说明文本，明确标记为未经核实的创意解释。 |
| `--output` | `plan` | 指定提示词保存路径。同时会写入同名前缀的 `<output>.json`。`plan` 不支持 `--force`。 |
| `--duration` | `generate` | 视频时长秒数，4 至 15 的整数，默认 6。 |
| `--resolution` | `generate` | 分辨率：`768P` 或 `2K`，默认 `768P`。 |
| `--region` | `generate` | MiniMax API 区域：`global` 或 `cn`，默认 `global`。 |
| `--context-ir` | `generate` | 仅付费路径：在视频生成前先调用 H3 上下文反思（Context IR）接口优化提示词。 |
| `--dry-run` | `generate` | 预演模式。重新解析并下载封面、生成计划，但不调用 MiniMax API。 |
| `--confirm-paid-generation` | `generate` | 显式确认付费生成。必须同时提供 `--expected-cover-sha256`。 |
| `--expected-cover-sha256` | `generate` | 64 位十六进制 SHA-256 哈希值。付费时比对实际上传 Buffer，哈希不匹配立即中断。 |
| `--expected-duration` | `review` | 预期视频时长（秒），容差为 ±0.25 秒。 |
| `--force` | `resolve`, `generate`, `review` | 允许覆盖已有输出文件；不清理其他无关或陈旧文件。 |
| `--json` | 全部 | 标准输出强制采用 JSON 格式，错误输出至 stderr。 |

---

## CLI Brief 投影 Schema

向 `--brief` 传入的 JSON 文件是 [Motion Design Guide](./motion-design-guide.md) 中通用设计方案在命令行工具中的受限投影。CLI 严格校验字段有效性，拒绝未知顶层字段，所有字符串经 trim 处理后不得为空。

### 字段定义

| 字段 | 类型 / 可选值 | 说明 |
| --- | --- | --- |
| `structure` | `portrait` \| `group` \| `collage_composite` \| `illustration_character` \| `typography_logo_minimal` \| `landscape_environment` \| `abstract_geometric` \| `object_product` | 封面结构分类（必填）。复合结构应选主要类别。 |
| `profile` | `medium_safe_v1` \| `low_safe_v1` | 运动预算档位。必须与 `amplitude` 匹配。 |
| `primary_motion` | `light_sweep` \| `glow_breath` \| `reflection_drift` | 主运动机制（三选一）。 |
| `supporting_motions` | 数组（最多 2 项） | 辅助运动。每项格式为 `{"motion": "texture_drift" \| "atmospheric_drift" \| "surface_flow", "amplitude": "low"}`。 |
| `amplitude` | `low` \| `medium` | 幅度预算。`medium_safe_v1` 对应 `medium`；`low_safe_v1` 对应 `low`。 |
| `tempo` | `slow` \| `moderate` | 运动节奏。作为提示词上下文传递。 |
| `loop_intent` | `return_near_start` \| `none` | 循环意图。不保证生成结果完全无缝。 |
| `visual_invariants` | 字符串数组（非空） | 视觉保护项（文字、五官、轮廓等，必填）。 |
| `prohibitions` | 字符串数组（非空） | 明确禁止项（必填）。 |
| `semantic_anchor` | 字符串或对象 | 运动载体。`medium_safe_v1` 必须为对象且包含 `visible_carrier` 字段。 |
| `verified_facts` | 字符串数组 | 经核实的专辑事实（claim/source/scope）。 |
| `creative_hypothesis` | 字符串 | 创意假设（明确与事实区分）。 |
| `evidence_basis` | 字符串 | 证据质量与观察依据说明。 |
| `fallback` | 字符串 | 安全载体无法识别时的降级策略。 |

完整合成的提示词（包含 Context IR 结果）不得超过 7000 个 Unicode 字符。

### 结构语法占位说明

以下占位结构仅作语法参考，各项取值须结合实际封面观察：

```json
{
  "structure": "abstract_geometric",
  "profile": "medium_safe_v1",
  "verified_facts": [],
  "creative_hypothesis": "<CREATIVE_HYPOTHESIS_TEXT>",
  "visual_invariants": [
    "<INVARIANT_1>",
    "<INVARIANT_2>"
  ],
  "semantic_anchor": {
    "visible_carrier": "<OBSERVED_SAFE_REGION>"
  },
  "primary_motion": "glow_breath",
  "supporting_motions": [],
  "amplitude": "medium",
  "tempo": "slow",
  "loop_intent": "return_near_start",
  "prohibitions": [
    "<PROHIBITION_1>"
  ],
  "evidence_basis": "<EVIDENCE_STATEMENT>",
  "fallback": "<FALLBACK_ACTION>"
}
```

---

## 环境变量与网络控制

| 变量名 | 默认值 / 行为 |
| --- | --- |
| `MUSICBRAINZ_CONTACT` | 必填（除非传 `--contact`）。用于 User-Agent，格式为邮箱或 URL。 |
| `MUSICBRAINZ_BASE_URL` | 默认为 `https://musicbrainz.org`。 |
| `CAA_BASE_URL` | 默认为 `https://coverartarchive.org`。 |
| `DEEZER_BASE_URL` | 默认为 `https://api.deezer.com`。 |
| `MINIMAX_API_KEY` | 仅在确认付费执行（Context IR 或视频生成）且非 `--dry-run` 时读取。 |
| `MINIMAX_BASE_URL` | 默认为 `https://api.minimax.io`（global）或 `https://api.minimax.cn`（cn）。 |
| `MINIMAX_POLL_INTERVAL_MS` | 轮询间隔毫秒数，默认 `10000`（≥1）。 |
| `MINIMAX_POLL_TIMEOUT_MS` | 轮询超时毫秒数，默认 `1200000`（20 分钟，≥1）。 |
| `ALBUM_LIVE_ALLOW_PRIVATE_HTTPS` | 默认关闭。仅设为 `1` 时在网络层放行 RFC1918、IPv6 ULA 与 fake-IP（198.18/15）的 HTTPS 目标。不关闭 TLS 证书验证。 |
| `ALBUM_LIVE_TEST_ALLOW_LOOPBACK_HTTP` | 默认关闭。仅设为 `1` 时允许本地回环 HTTP 测试，且仅限假凭据。 |

网络默认仅允许公网 HTTPS。请求遵循最多 5 次逐跳重定向验证，Bearer 凭据禁止跨源。单进程内 MusicBrainz 请求间隔至少 1050ms。

---

## Context IR 与生成细节

- 当启用 `--context-ir` 时，脚本先向 `/v2/h3_context_ir` 发起 POST 请求（包含模型 MiniMax-H3、文本 + 首帧图像、时长与自适应画幅），获取任务 ID 后通过 `/v2/query/video_generation/<id>` 轮询结果。Context IR 属于付费调用，需要有效 API Key。
- 读取返回的 `content.prompt`，与通用保护、静音和首尾循环约束合成最终提示词（总长 ≤7000 Unicode 字符），并在视频任务提交前保存至 `prompt.txt`。原始方案保留在 `plan.json` 中；视频生成请求体中不包含 `context_ir` 字段。
- 任务创建成功后，立即原子写入 `task-<type>-<id>.json` 回执（包含任务类型、ID、API 来源、区域、提交时间与当前状态等非敏感元数据，不包含密钥、Authorization 请求头、完整响应或签名下载链接）。
- 发生错误时输出已知任务 ID 并提示切勿盲目重复提交；CLI 不提供自动恢复或断点重试命令。

---

## 输出产物规范

每次运行根据子命令与参数写入对应文件：

- `cover.<ext>`：解析或下载得到的原始封面（JPEG、PNG 或 WebP，边长 256–5760 像素）。
- `source.json`：封面来源元数据（提供方、匹配置信度、检索用时、SHA-256、尺寸等）。
- `prompt.txt`：最终发送给视频生成模型的完整提示词文本。
- `plan.json`：运动设计计划明细及参数。
- `task-<type>-<id>.json`：任务创建回执（包含任务类型、ID、API 来源、区域、提交时间与当前状态等非敏感元数据，不包含敏感凭据）。
- `live-cover.mp4`：生成完成的静音 MP4 视频（音频流已剥离）。
- `contact-sheet.jpg`：4×3 采样帧接触表，用于快速人工复核。
- `review.json`：自动化技术复核结果（流检测、尺寸、时长等）。

---

## 复核（Review）与退出码

`review` 命令采样 12 帧生成 4×3 接触表，输出 `review.json`。自动化检测仅覆盖视频流存在、无音轨、方形尺寸、正时长与预期时长容差。视觉身份、文字清晰度、几何形变与循环连贯性在技术输出中恒为 `needs_review`，`accepted` 恒为 `false`。技术通过不等于人工视觉终审；采样与 SSIM 指标无法单独证明无缝循环。

| 退出码 | 含义 | 处理指引 |
| --- | --- | --- |
| `0` | 成功 / 规划完成 | 命令执行完毕。若包含技术复核，仍需人工确认视觉效果。 |
| `1` | 执行错误 | 网络超时、文件系统不可写或远程接口错误。 |
| `2` | 参数 / 配置非法 | 检查命令行参数、Brief 格式或环境变量配置。 |
| `3` | 元数据匹配歧义 | 检索结果有多条候选或置信度不足。需人工核对后指定 `--release-id`。 |
| `4` | 技术复核未通过 | 生成的视频未通过编码、尺寸、时长或静音等自动化硬指标检测。 |
