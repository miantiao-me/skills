# Album Cover to Live

[English](README.md) · [Agent 指令](SKILL.md) · [Skill 索引](../README.zh-CN.md)

通过 MusicBrainz / Cover Art Archive 检索封面（支持可选 Deezer 备用），规划克制的动态 Brief，经显式确认后通过 MiniMax H3 生成静音视频。

## 技能安装

```bash
# 安装到 AI Agent（追加 -g 为全局安装）
npx skills add miantiao-me/skills --skill album-cover-to-live
```

安装后由 Agent 加载 [`SKILL.md`](SKILL.md)，引导完成封面检索、Brief 规划、预演验证、付费确认与复核。

## 运行环境与依赖

- **Node.js 20+**，系统 `PATH` 中可调用 `ffmpeg` 与 `ffprobe`。
- 零 npm 依赖，无需执行 `npm install`。
- 手动执行 CLI 请直接在当前 `album-cover-to-live` 目录下运行。
- `MUSICBRAINZ_CONTACT`：环境变量或命令传参 `--contact <email-or-url>`，用于元数据请求。
- `MINIMAX_API_KEY`：仅确认付费执行时需要（检索与 dry-run 无需提供）。

## 快速上手（CLI）

```bash
# 1. 检索并下载专辑封面
node scripts/album-cover-to-live.mjs resolve --artist "<ARTIST>" --album "<ALBUM>" --contact "<EMAIL_OR_URL>" --output-dir ./output --json

# 2. 针对已下载封面规划运动提示词
node scripts/album-cover-to-live.mjs plan --input ./output/cover.jpg --brief ./brief.json --output ./output/prompt.txt --json
```

第 2 步的 `--input` 请按 resolve 实际保存的文件扩展名调整；`--brief` 需在真实观察封面后按 [CLI 参考](./references/cli-reference.md) 编写。

完整工作流（包括 `--dry-run` 预演、付费生成、review 复核命令及全部参数）见 [CLI 参考](./references/cli-reference.md)。

## 运行与安全边界

- **Dry-run 行为**：`--dry-run` 仍会联网重新验证元数据并下载封面，但不调用远程 MiniMax H3 模型。
- **付费生成门禁**：付费前必须先由用户确认封面、完整提示词、生成参数与上传意图。付费执行必须传入 `--confirm-paid-generation` 与封面哈希 `--expected-cover-sha256 <64hex>`。严禁盲目重试付费请求。
- **任务与超时**：网络超时不会取消远端正在执行的任务。排查状态需凭原子回执（`task-<type>-<id>.json`）中的任务 ID，切勿盲目重复提交。
- **运动 Brief**：使用者需在真实观察封面后按规范编写 `--brief` JSON；未传 brief 时使用 low 幅度回退（标记 `needs_review`），仍需视觉复核。参见 [运动设计指南](./references/motion-design-guide.md)。
- **复核边界**：技术指标检查（`review` 采样图与格式检测）仅验证硬性格式，不可替代人工播放视频验收视觉质量与循环连贯性。
- **权利归属**：工具代码采用根目录 [MIT 许可证](../LICENSE)。封面与生成视频使用需自备或取得原权利人合法授权。详见 [提供方与权利规范](./references/providers-and-rights.md)。
