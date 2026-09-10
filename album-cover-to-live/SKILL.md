---
name: album-cover-to-live
description: 将专辑封面规划为克制的动态封面，并在明确付费确认后通过 MiniMax H3 生成静音视频。用于封面查找、运动 brief 规划、视频生成与技术复核；默认使用 MusicBrainz 和 Cover Art Archive，不使用 Apple 服务。
---

# Album cover to live

独立运行本目录的 `scripts/album-cover-to-live.mjs`。需要 Node.js 20+、ffmpeg 和 ffprobe，无 npm 安装依赖。封面查找免 API Key，仅付费执行路径（包含 Context IR 与视频生成）读取 MiniMax 凭据。

## Agent 执行流程

1. **准备与参数核对**：
   - 执行前先运行 `node scripts/album-cover-to-live.mjs help`；调用 CLI 各子命令前阅读 [cli-reference.md](./references/cli-reference.md)。
   - 发起查询前必须阅读 [providers-and-rights.md](./references/providers-and-rights.md)，确认 MusicBrainz 限流、Deezer 显式开启规则与数据来源权利边界。
   - 复用已确认的 release 与参数，集中一次询问缺失信息；不省略实际封面确认与完整付费确认。
2. **解析封面**：
   - 运行 `resolve --artist <name> --album <title> --output-dir <dir>`（未设环境变量时必传 `--contact`）。
   - 若返回多条候选或置信度不足（退出码 3），展示候选项供用户明确选择 release ID，不主观猜测。
3. **确认封面与事实分离**：
   - 向用户展示实际下载的封面图片、来源平台与发行版本，确认目标无误后再推进。
   - 查证专辑内容时严格区分可信事实与创意推断，不把名字或视觉猜想包装为专辑背景事实。
4. **制定运动 Brief**：
   - 观察当前封面结构，选择单一安全载体与主运动机制。规则、幅度预算与八类结构保护参考 [motion-design-guide.md](./references/motion-design-guide.md)。
   - 正常路径在观察封面后制定 Brief，默认 `medium` 幅度；若无视觉可靠 Brief，诚实回退为针对可见封面的 `low` 幅度背景光呼吸（标记 `needs_review`），不伪称模型已理解图像或主题。
5. **离线规划（Plan）与预演（Dry-run）**：
   - 运行 `plan --input <cover> --brief <brief.json> --output <prompt.txt> --json` 验证生成提示词。
   - 运行 `generate ... --dry-run` 预演流程；注意 dry-run 仍会联网重新解析元数据并下载封面，但不调用远程 H3 模型。
6. **付费披露与显式确认**：
   - 披露前核对用户凭据所属平台与 `cn` / `global`、实际 API origin，并仅检查凭据是否已配置，不展示秘密值。CLI 不自动加载 `.env`；仅在用户明确给出文件路径后受控解析指定键，详见 CLI Reference 的凭据准备规则。
   - 必须向用户完整披露：确认的封面与来源、Brief 摘要、完整 Prompt 文本、生成参数（模型 MiniMax-H3、时长、分辨率、region、实际 API origin、context-ir）、上传内容及费用不确定性，获得用户明确同意。
   - 从已确认的 Plan 或 source 中提取封面的 64 位十六进制 SHA-256（`expected_cover_sha256`）。
7. **执行生成（Generate）**：
   - 必须使用全新的独立输出目录，避免覆盖前序产物。
   - 传入 `--confirm-paid-generation` 与 `--expected-cover-sha256 <64hex>` 执行生成。
   - 脚本对上传前的同一 Buffer 强校验尺寸与哈希，通过后才读取 key，不匹配立即中断。严禁自动静默重试任何付费任务；401 不授权自动切区重试。
8. **技术与视觉复核（Review）**：
   - 优先读取内置 review；需要单独复核时运行 `review --input <video.mp4> --output-dir <new-dir> --expected-duration <已确认秒数>`。
   - 结合采样接触表与人工播放完整视频，依据 [motion-design-guide.md](./references/motion-design-guide.md) 复核门禁给出验收结论。自动化技术通过不等于人工视觉终审。
   - 分开报告远端生成、技术复核、视觉复核与用户反馈。生成成功但技术失败仍为退出码 4；用户满意不覆盖硬性失败，不据此重复付费生成或自动裁剪。

## 网络与安全策略

- 默认仅允许公网 HTTPS 连接，DNS 绑定与逐跳 Redirect 严格校验，Bearer 凭据禁止跨源。
- 环境变量 `ALBUM_LIVE_ALLOW_PRIVATE_HTTPS=1` 默认关闭；仅在可信代理或内网环境下显式开启，放行 RFC1918、IPv6 ULA 与 fake-IP 范围。不关闭 TLS 证书验证。
- 详细 CLI 命令选项、Brief Schema、环境变量及退出码规范见 [cli-reference.md](./references/cli-reference.md)。
