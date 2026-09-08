# Apple Music 动态封面

[English](./README.md) · [Skill 索引](../README.zh-CN.md)

这个 Skill 提供了一款轻量、零依赖的命令行工具，可以查找 Apple Music 专辑，并把可用的动态封面保存为 MP4。下载前可以先查看正方形和竖版封面，以及专辑提供的尺寸。

## 准备工作

- Node.js 20 或更高版本
- 系统中可以直接运行 `ffmpeg`
- 用于官方 Catalog API 的 Apple Music developer token

请在当前 Skill 目录运行命令。developer token 放在环境变量中，不要写入文件，也不要打印到命令输出：

```bash
export APPLE_MUSIC_DEVELOPER_TOKEN='<developer-token>'
```

这是推荐的认证方式。如果没有 developer token，也可以使用 `--experimental-web-token`。它会在运行时查找公开的 Apple Web bearer token，并通过 Apple Music Web 客户端主机发送请求。这条路径并非官方支持，随时可能失效，因此只有在下载请求方明确同意后才能启用。

## 快速开始

用艺人和专辑名搜索，再检查匹配的专辑：

```bash
node scripts/apple-music-artwork.mjs search "Pink Floyd The Dark Side of the Moon 50th Anniversary" --storefront us --limit 5 --json
node scripts/apple-music-artwork.mjs inspect 1665303755 --storefront us
```

搜索可能返回多个结果。请同时核对艺人和专辑名；如果仍有歧义，就列出候选项供选择，不要猜测。`inspect` 会显示 square 和 tall 封面是否可用，以及它们公布的分辨率。

`inspect` 和 `download` 都可以接收专辑 ID 或 Apple Music 专辑 URL。完整参数可以这样查看：

```bash
node scripts/apple-music-artwork.mjs help
```

## 下载与验证

通常可以直接选择 square 和最佳画质。下载命令需要写明版本，分辨率可以用 `best`，也可以指定准确的 `WxH`：

```bash
node scripts/apple-music-artwork.mjs download 1665303755 --variant square --resolution best
node scripts/apple-music-artwork.mjs download 1665303755 --variant tall --resolution 1080x1440 --output artwork.mp4
```

指定准确分辨率时，工具不会自动换成其他尺寸。它调用本地 FFmpeg 生成 MP4；不写 `--output` 时，文件会以可预测的名称保存在当前目录。已有文件默认不会被覆盖，如需覆盖可加入 `--force`。完成后，命令行会显示保存路径。

如果安装了 `ffprobe`，可以用下面的命令确认文件包含视频流、尺寸符合预期，而且时长大于零：

```bash
ffprobe -v error -select_streams v -show_entries stream=codec_name,width,height -show_entries format=duration -of json "<output.mp4>"
```

## 限制与版权

专辑搜索和查询使用 Apple 官方 Catalog API。动态封面则依赖 `extend=editorialVideo`、`platform=web`、`motionDetailSquare` 和 `motionDetailTall` 这些未公开说明的 Web 字段；它们可能随时变化或消失。可用尺寸来自 HLS manifest，并不是 Apple API 承诺的一部分。

工具只下载能够正常访问且未加密的 HLS 流，不会绕过 DRM、加密、访问控制或区域限制。如果媒体流不可用、已加密、不受支持，或者 FFmpeg 执行失败，下载会报错并停止。

仓库不包含 Apple 或其他第三方 token。完整来源和 API 边界见 [API、认证与合规边界](./references/api-and-auth.md)。

仓库代码和原创文档采用根目录的 [MIT License](../LICENSE)。下载的封面仍归相应权利人所有，不在该许可证范围内；本仓库也不授予再分发这些媒体的权利。
