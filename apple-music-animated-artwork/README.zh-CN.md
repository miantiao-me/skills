# Apple Music 动态封面下载器

[English](./README.md) · [Skill 索引](../README.zh-CN.md)

轻量 Node.js 命令行工具，用于查找 Apple Music 专辑并将官方动态封面（Editorial Video）下载保存为 MP4 视频。

## 技能安装

```bash
# 安装到 AI Agent（追加 -g 为全局安装）
npx skills add miantiao-me/skills --skill apple-music-animated-artwork
```

安装后由 Agent 读取 [`SKILL.md`](SKILL.md) 检索 Catalog API、探测 square/tall 变体与分辨率并下载为 MP4。

## 运行环境与认证

- **Node.js 20+**，系统 `PATH` 中可调用 `ffmpeg`（推荐安装 `ffprobe` 用于复核）。
- 零 npm 依赖，无需执行 `npm install`。
- 手动执行 CLI 请直接在当前 `apple-music-animated-artwork` 目录下运行。

### 认证配置

推荐配置官方 Apple Music Developer Token：

```bash
export APPLE_MUSIC_DEVELOPER_TOKEN='<your-developer-token>'
```

备选方案：未配置 Token 时，可附加 `--experimental-web-token` 参数在运行时获取公开临时凭据。

## 快速上手（CLI）

```bash
# 1. 搜索专辑
node scripts/apple-music-artwork.mjs search "Pink Floyd The Dark Side of the Moon" --storefront us --limit 5 --json

# 2. 检查可用封面变体与分辨率
node scripts/apple-music-artwork.mjs inspect 1665303755 --storefront us

# 3. 下载正方形封面最高画质
node scripts/apple-music-artwork.mjs download 1665303755 --variant square --resolution best
```

查看全部参数、指定分辨率及竖版下载命令，可运行 `node scripts/apple-music-artwork.mjs help`。

## 技术限制与版权声明

- **接口依赖**：专辑检索使用 Apple 官方 Catalog API；动态封面检测与流地址解析依赖 Web 客户端未公开字段（`extend=editorialVideo`、`motionDetailSquare` 等），可能随前端调整而变动。
- **无 DRM 绕过**：工具仅下载未加密 HLS 流，不绕过 DRM 或地域限制。
- **版权归属**：工具代码采用根目录 [MIT 许可证](../LICENSE)。封面与视频版权归 Apple 或原版权方所有，不授予再分发权利。详见 [API 与合规说明](./references/api-and-auth.md)。
