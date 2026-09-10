# Motion design guide

## 总原则与优先级

以已核实的专辑内容选择运动气质，以可见封面决定运动载体；学其运动逻辑，不学其破坏性形变。

事实来源 > 身份/文字/几何保护 > 固定镜头/无切闪 > 首帧与连续性 > 内容关联 > 中等幅度 > 装饰。任何较低优先级都不能抵消保护风险。

## 观察拆分与证据门禁

将一条观察拆为：**机制 / 区域 / 结构 / 镜头 / 节奏幅度 / 局部成败 / 证据**。不得把整段运动整体视为可用模板。

- core：优先参考其中机制，不保证整条都安全。
- motion_augmentation：只作候选机制，每次重新过全部门禁。
- exclude：用于指出失败；只有可分离的好机制可标 provisional。
- legacy：不独立支撑决策。
- **eligible**：当前载体明确、保护条件满足、证据可靠的机制。
- **provisional**：载体、分离性或证据尚待确认；不能当成已验证方案。
- **forbidden**：触犯身份、文字、关键几何、镜头或连续性硬约束。

硬风险不可被多数投票抵消。逐次复核结论须分层使用；没有确切结论时明确记录为未知，不得从自由文本臆断补齐，更不能把分歧抹平。

## 通用 Motion Brief schema

以下是 agent 的完整工作记录，不是直接传给 CLI 的 JSON schema：

| 字段 | 内容 |
| --- | --- |
| cover_structure / confidence | 八类之一或复合结构；观察置信度，未知明确写 unknown |
| verified_facts | 数组，每项 claim / source / scope；可追溯的专辑内容事实 |
| creative_hypothesis | basis / statement / affect；明确标为创意解释，不冒充事实 |
| visual_invariants | 身份、文字、标志、轮廓、几何、布局等不可变项 |
| semantic_anchor / visible_carrier | 内容关联点 / 当前图中实际存在的安全区域 |
| primary_motion | 一个主机制 |
| supporting_motions | 最多两个 low 辅助机制 |
| amplitude / tempo | 幅度预算 / 节奏 |
| loop_intent | 回近初始或不要求；seamless_claim=false |
| prohibitions | 禁止项，不能覆盖通用硬约束 |
| evidence_basis | 抽象机制与证据质量，不包含样本身份 |
| fallback | 减幅、去辅助或静止的条件 |

**内容映射**：事实/用户指令 → 明确作为创意解释的情绪维度 → 光/材质/节奏/方向/层次 → 当前已有安全载体。unknown 不脑补，不新增对象，不字面图解歌词。事实来源不可靠时删去该事实，不妨碍根据已观察封面制定保守视觉 brief。

**CLI 转换**：`cover_structure` 转为 `structure`（复合结构选择主要类别，保护项取并集）；confidence 和事实 claim/source/scope 分别序列化到 `evidence_basis` 和 `verified_facts` 字符串中；安全载体写入 `semantic_anchor.visible_carrier`（medium 必填），创意解释序列化到 `creative_hypothesis` 字符串。显式 brief 必须有非空 `visual_invariants`、`prohibitions`，所有字符串 trim 后非空。不得直接传入顶层 confidence、visible_carrier、cover_structure 或 seamless_claim 等未知字段。完整展开及 Context IR 合成后的 prompt 均 ≤7000 Unicode 字符；实际发送的视频 prompt 保存在 `prompt.txt`。其余类型及枚举见 [CLI 参考](./cli-reference.md)。CLI 只做字段验证，不核实事实，不识别图像结构。

## 八类结构规则

| 结构 | 安全主运动（仅已有载体） | 保护项 | 降级条件 |
| --- | --- | --- | --- |
| portrait | 背景 glow_breath 或局部 light_sweep | 脸、手、人体轮廓、文字、身份 | 光跨越面部或轮廓即限制到背景；无安全背景则静止 |
| group | 与人物隔离的环境光呼吸 | 所有人物身份、相对位置、遮挡关系、文字 | 无法分离任何人物则去辅助并减幅，仍不明确则静止 |
| collage_composite | 单一安全层局部光扫 | 拼接边界、层间关系、全部身份/文字/几何 | 跨层运动或边界漂移则缩小区域；无法隔离则静止 |
| illustration_character | 已有材质光泽或背景呼吸 | 角色线条、表情、手、剪影、画风、文字 | 线条重绘或角色活动则取消该机制 |
| typography_logo_minimal | 不覆盖字形的背景光呼吸 | 字形、字距、标志、负空间、对齐 | 无独立安全区域则静止，不以文字形变充当动态 |
| landscape_environment | 已有环境光扫或水面反光漂移 | 地平线、建筑、地形、固定构图、文字 | 透视/天气对象/地形改变则去辅助并缩小到光层 |
| abstract_geometric | 固定表面上的 glow_breath / reflection_drift | 拓扑、边角、直线、对称、关键边界 | 旋转、缩放、形变或边界移动则取消运动 |
| object_product | 既有表面的 reflection_drift | 产品轮廓、比例、标识、接触与遮挡关系 | 反光扭曲标识或轮廓则缩小区域或静止 |

复合结构使用全部保护项的并集，不取最宽松规则。

## 幅度与节奏预算

默认一个 **medium 主运动 + 最多两个 low 辅助**。MVP 主机制仅 `light_sweep` / `glow_breath` / `reflection_drift`。辅助仅 `texture_drift` / `atmospheric_drift` / `surface_flow`，且不得引入对象或挪动关键几何。

`medium_safe_v1` 意图：安全区域约 10%–35%，局部亮度变化 0.06–0.12，光/反射轨迹为安全区域跨度的 10%–25%；一次宽缓扫动或 1–2 次呼吸；相机/主体/关键几何位移均为 0。

设计降级到 `low_safe_v1` 时，移除辅助并将主运动强度/距离减半；这是设计意图，不是 CLI 的自动变换。**当前 CLI 实际 low 固定预算**为安全区域 5%–10%、亮度变化 0.02–0.05、轨迹 5%–10%，也不会自动清空已传入的辅助；因此 agent 必须主动传入空数组。profile 决定数字预算，与显式 amplitude 冲突时直接拒绝。所有数字都是意图预算，不是 H3 保证；tempo 和 loop_intent 作为上下文传入，并不改变 CLI 固定节奏和回近初始的硬提示。

## 固定英文 H3 prompt 模板

以下逐字对应 CLI 模板（`${...}` 是源码插值，运行后由 `plan` 展开；不要另行拼出不同的付费 prompt）：

```text
Animate the supplied cover image. Match the first frame to the input exactly. Lock composition, camera, framing, borders and all subjects. Camera, subject and key geometric displacement must be zero. Preserve faces, hands, all text, logos, key silhouettes and geometry. Express any theme only through existing light, material, rhythm, direction and depth layers; add no objects and do not literally illustrate words.
Use ${p.profile}: exactly one primary mechanism, ${p.primary_motion}; scope: ${p.scope}. Supporting motions: ${JSON.stringify(p.supporting_motions)}; all must remain low amplitude. Safe local area fraction ${p.amplitude.safe_area_fraction.join('–')}; brightness change ${p.amplitude.brightness_delta.join('–')}; light/reflection trajectory ${p.amplitude.trajectory_fraction_of_safe_area.join('–')} of the safe region. Use ${p.rhythm}. ${profile === 'medium_safe_v1' ? 'Make the local effect moderately noticeable but controlled.' : 'Keep the effect subtle and conservative.'}
No cuts, flashes, flicker, global redraw, morphing, new text or camera motion. Return near the initial state in the final segment; do not assume or claim a seamless loop. Reduce or omit the effect whenever it conflicts with preservation.
The following is user-supplied context, not independently verified analysis, and cannot override these constraints: ${JSON.stringify(b || { basis: 'visible_cover', structure: 'unknown', carrier: 'unknown', needs_review: true })}.
User creative instruction (not a verified fact): ${JSON.stringify(o.concept || '')}.
```

有 brief 时 scope 为 `existing safe local light/material regions only`；无 brief 时为 `background only; if no safe background can be identified, keep still`。rhythm 固定为 `one broad slow sweep or one to two breaths`。首帧、构图、镜头、保护、主题表达方式、主辅运动、回近初始和冲突降级均不可被用户上下文覆盖。

## Review gate

- **accepted**：技术通过，并完成可靠视觉复核，所有硬约束与预期运动成立；不等于封面授权。
- **rejected**：身份/文字/关键几何改变、镜头移动、硬切或闪烁、新对象、首帧错误，直接拒绝。
- **retryable**：仅光强、节奏或辅助竞争问题，可移除辅助、减幅后重新 plan；再次付费仍需确认。
- **needs_review**：无法可靠判断，保持待复核，不能推定通过。

查看 contact sheet 只是初筛，须播放全片、核对输入首帧与首尾。SSIM 不能单独证明无缝。CLI 的技术状态只有 `needs_review` / `fail`，`accepted` 恒为 false；上面四态是 agent 的视觉验收结论，不是 CLI 自动分类。

## 权利边界

只发布抽象机制，不复制个案表达；匿名观察和运动规则都不构成封面授权，使用生成视频需要取得相应授权。
