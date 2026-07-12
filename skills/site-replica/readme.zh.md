# Site Replica

[English](./readme.md) | 中文

`site-replica` 是一个用于把现有网站复刻到 Creght 的 skill，适用于“复刻这个网站”、
“把这个 Framer 站搬到 Creght”、“clone this site to Creght”这类任务。

它的目标是在 Creght 上重建一个与源站在视觉和交互上高度一致、但实现完全原创且
授权安全的网站：agent 会在真实浏览器里研究源站，然后用 React/Tailwind 重新实现
布局、动效、响应式行为和交互，并替换素材、改写文案。

## 思路

这个 skill 把源站当作唯一的参考标准，按可测量的流程推进：

1. **侦察源站**：抓取路由、整理页面区块，记录断点、字体、间距、颜色、图片槽位
   和关键响应式行为。
2. **动效审计**：记录首屏冷启动动画、滚动效果、hover、跑马灯、菜单、轮播和其他
   交互状态。
3. **重新构建**：基于基础 `creght` skill 创建 Creght 项目，用原创 React/Tailwind
   代码实现页面；列表 / 详情内容接入 Creght CMS，需要表单时接入 Creght Form。
4. **验证对齐**：在预览站上对比源站和复刻站，覆盖桌面端和移动端，包括路由覆盖、
   区块结构、截图对比、动效、交互、控制台错误、资源 404 和平台能力。
5. **循环修正**：发现差异时，先重新测量真实源站，再修改并重新验证。

这个 skill 不复制源站代码、图片、视频、字体或长文案。它复刻的是设计和体验，交付
的是一个新的、授权安全的 Creght 实现。

## 案例

以下案例均使用 **Fable 5** 完成。

| 源站 | 复刻站 | 差异化模式 | 模型 |
| --- | --- | --- | --- |
| https://trifecta.framer.media/ | https://p1io0guo97bm.site.creght.cn/ | https://p1it45pqg8q6.site.creght.cn/ | Fable 5 |
| https://bildium.webflow.io/home-one | 未列出 | https://p1qhs734c56q.site.creght.cn/ | Fable 5 |

## 适用场景

当用户希望把公开网站的设计搬到 Creght 时，可以使用这个 skill，例如 Framer、
Webflow、作品集、落地页、Agency、SaaS、内容型或营销型网站。

当然，如果你不用 Creght 的托管与后端能力，而是想自托管源代码，也同样适用。你只
需要说：“使用 site-replica 技能复刻这个网站，React 源码放在我本地。”

如果目标不是 1:1 复刻，而是在保留结构质量的同时降低可识别度，可以使用这个 skill
内置的差异化模式。
