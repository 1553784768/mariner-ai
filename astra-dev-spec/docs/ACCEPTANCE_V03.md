# Mariner AI v0.3 验收记录

日期：2026-10-31。源码位于 `astra-dev-spec/`。依据用户提供的 v0.3 资料包、`AGENTS.md`、`V03_DESIGN.md` 和 `TASKS_V03.md`。

## 实现与检查

- T-16.2 至 T-16.13 已完成。T-16.1 的运行时代码已完成；仅旧字体夹具磁盘清理因自动审批拒绝保留为 Q-003。
- 七个主页面全部迁移至 v0.3 顶栏、侧栏、筛选行和列表 / 详情布局。
- Windows Chromium 全部 **22 项 Playwright 通过**：包含原 v0.2、v0.2.1 业务回归及 v0.3 验收。
- 后端 **Ruff 通过、44 项 pytest 通过**，包含 golden 与列表 / 详情税率一致性。只有既有 Starlette / httpx 弃用警告。
- 前端 **ESLint、Prettier、TypeScript、Next.js 生产构建通过**。
- 构建使用独立 `.next-build`，禁用遥测、无效 HTTP(S) 代理及 Node 出站连接阻断辅助脚本；全部页面静态构建成功。没有恢复任何网络字体或字体模拟器。
- 浏览器阻止非本地请求，验证系统字体和背景色；没有 Google Fonts 请求。模型连接测试均为本地请求拦截，不使用真实外部模型。
- 七个英文页面分别在 1280、1440、1890 宽度验证主面板边界与页面横向溢出；静态导航、筛选、标签页、动作、字段标签无中文残留（语言切换「中」除外）。
- 1060 条原始令牌声明经规范化比较全部保留；没有改变设计令牌的数值。
- Linux 未执行：本机有 Ubuntu 22.04 WSL，但没有可用的 Linux Node 与 Chromium。检测到的 npm 路径来自 Windows，不能当作 Linux 验收结果。

## 样张核对

| 页面 | 验收截图 | 原始样张 |
|---|---|---|
| 外壳 | [T-16.2](acceptance/v0.3/T-16.2.png) | 各页顶栏 / 侧栏 |
| 通用组件 | [T-16.4](acceptance/v0.3/T-16.4.png) | V01–V22 |
| 工作台 | [T-16.6](acceptance/v0.3/T-16.6.png)、[发送确认](acceptance/v0.3/T-16.6-consent.png) | workbench / workbench-consent |
| 风险收件箱 | [T-16.5](acceptance/v0.3/T-16.5.png)、[补充说明](acceptance/v0.3/T-16.5-detail.png) | inbox / inbox-tabs |
| 日报 | [T-16.7](acceptance/v0.3/T-16.7.png) | brief |
| 知识库 | [T-16.8](acceptance/v0.3/T-16.8.png)、[已删除](acceptance/v0.3/T-16.8-deleted.png) | knowledge / knowledge-deleted |
| 审核 | [T-16.9](acceptance/v0.3/T-16.9.png)、[原文](acceptance/v0.3/T-16.9-source.png) | review |
| 流水线 | [T-16.10](acceptance/v0.3/T-16.10.png) | pipeline |
| 设置 | [T-16.11](acceptance/v0.3/T-16.11.png) | settings |

英文截图：`acceptance/v0.3/T-16.12-{workbench,inbox,brief,knowledge,review,pipeline,settings}.png`。本机原图为 `artifacts/screenshots/`，1440×900。

并排核对：[工作台 / 收件箱](acceptance/v0.3/comparison-1.png)、[日报 / 知识库](acceptance/v0.3/comparison-2.png)、[审核 / 流水线](acceptance/v0.3/comparison-3.png)、[设置](acceptance/v0.3/comparison-4.png)。每张左侧为实际截图，右侧为提供的 PNG。

布局遵循提供的 HTML 与令牌；动态订单状态、步骤耗时、知识排序、对话和模型配置使用实际接口数据，因此不与 PNG 中的示例值强行一致。系统字体在 Windows 和样张生成平台上的字形 / 换行有差异；审核页已额外在同一个 Windows Chromium 中打开原 HTML，验证标题宽度和换行一致。

## 本轮修复与文档优先级

- 根因是全局样式已更新，但多个页面仍使用旧版结构。现七个页面已全部迁移，源目录搜索无旧样式 / 动画关键词。
- Tailwind 的 `outline` 工具类曾覆盖同名标签修饰类；禁止生成该工具类，保留提供的标签样式。
- Tailwind Preflight 与样张原生控件 / 定义列表默认样式不同；补回原 HTML 的 line-height 和 dl margin，不改令牌。
- 设置测试结果颜色按样张内联样式，避免被 `.detail-copy` 的颜色覆盖。
- review / pipeline 的 URL 选择增加 Suspense 边界，生产构建通过。
- V03_DESIGN §6 优先于旧版一次展示全部详情、侧栏层级和按钮筛选的测试；测试改为操作新标签页 / 下拉框，保留原业务断言。
- 第一次流水线的 7 组 fixture 数值严格验证；再次运行是去重采集，显示当前 API 的真实数量，不伪造首次采集数字。
- 没有修改计算引擎、规则税率、关税日期、golden 结果。

## 未完成与限制

- Q-003：旧字体夹具文件删除被自动审批拒绝，仍保留但没有运行时引用。阻塞详情见 `QUESTIONS.md`。
- 本记录仅描述本地夹具和模拟模型请求的验证结果，不代表真实模型服务联调成功。
- Q-004 已解决：用户选择 MIT；仓库根目录 LICENSE、README 和前端包元数据已同步。
