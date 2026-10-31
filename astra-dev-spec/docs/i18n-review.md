# v0.2.1 英文文案审阅清单

生成日期：2026-10-31。全部条目均为实现中的当前文案，供用户审阅；生成清单不等于人工批准译文。

术语优先依据 `V021_SPEC.md` §7，其余依据 `V02_SPEC.md` §7.6。`{...}` 为运行时参数，金额、日期、税率保持原值。以下覆盖 `frontend/src/i18n/en.ts` 的全部键值，以及后端引擎、错误、审计、知识库、日报和内置双语内容。原文标题、来源正文、产品名称、文件名、用户输入、旧记录缺失译文的原文按规格保留；API 字段名、枚举 key、日志和模型提示词属于技术内容，不作为界面译文列入。种子及夹具中的关税事件是项目演示快照，本清单没有独立核实其现实有效性。

重新生成：`backend/.venv/Scripts/python.exe scripts/generate_i18n_review.py`（Linux 使用对应 venv Python；需要已安装前端依赖）。


## 前端字典（279 项，完整）

| 编号 / 来源 | 中文 | English |
|---|---|---|
| UI-001 | 删除对话 | Delete chat |
| UI-002 | 删除后，这条内容不再出现在知识库列表和对话中，可在「已删除」中恢复。不影响订单、规则和关税计算。确定删除吗？ | After deletion this entry no longer appears in the knowledge base list or in chat. You can restore it from "Deleted". Orders, rules and duty calculations are not affected. Delete it? |
| UI-003 | 已删除 | Deleted |
| UI-004 | 确定删除这段对话吗？ | Delete this conversation? |
| UI-005 | 还没有对话 | No conversations yet |
| UI-006 | + 新对话 | + New chat |
| UI-007 | 对话记录 | Conversations |
| UI-008 | 规则快照 | Rule snapshot |
| UI-009 | 、 | ,  |
| UI-010 | 第 {p0} 条 | Actions {p0} |
| UI-011 | 「{filename}」的内容将发送给已配置的模型 {model}{endpoint}用于识别订单。文件可能包含客户、价格和成本信息。 | The contents of “{filename}” will be sent to the configured model {model}{endpoint} to recognize orders. The file may contain customer, price and cost information. |
| UI-012 | 文件过大（上限 10 MB） | File too large (10 MB limit) |
| UI-013 | 工作台 | Workbench |
| UI-014 | 新对话 | New chat |
| UI-015 | 未配置模型：只能回答内置示例问题。 | No model configured: only built-in example questions are available. |
| UI-016 | 去配置 → | Configure → |
| UI-017 | 引用 | Sources |
| UI-018 | 回答中有知识库里找不到的数字： | Numbers not found in the knowledge base:  |
| UI-019 | ，请以订单影响单为准 | . Refer to the Order Impact Sheet. |
| UI-020 | 思考中… | Thinking… |
| UI-021 | 对话可使用订单数据 | Allow order data in chat |
| UI-022 | 开启后，检索到的订单和影响单内容会发送给模型 | When enabled, retrieved orders and impact sheets are sent to model  |
| UI-023 | 内置夹具 | Built-in fixtures |
| UI-024 | 输入问题，或上传订单文件… | Ask a question, or upload an order file… |
| UI-025 | 发送 | Send |
| UI-026 | 风险收件箱 | Risk Inbox |
| UI-027 | 待处理 | Pending |
| UI-028 | 红 | Red |
| UI-029 | 紧急 | Urgent |
| UI-030 | 风险收件箱 → | Risk Inbox → |
| UI-031 | 政策日报 | Policy Brief |
| UI-032 | 查看日报 → | View Brief → |
| UI-033 | 导入订单 CSV | Import Orders CSV |
| UI-034 | 选择文件 | Choose File |
| UI-035 | 第 | Row  |
| UI-036 | 行 · |  ·  |
| UI-037 | 已导入 | Imported  |
| UI-038 | 行，更新 |  rows, updated  |
| UI-039 | 行 |  rows |
| UI-040 | 上传 | Upload |
| UI-041 | 取消 | Cancel |
| UI-042 | 识别中… | Recognizing… |
| UI-043 | 发送文件给模型？ | Send file to the model? |
| UI-044 | 」的内容将发送给已配置的模型 |  will be sent to the configured model  |
| UI-045 | 用于识别订单。文件可能包含客户、价格和成本信息。 |  to recognize orders. The file may include customer, price and cost information. |
| UI-046 | 发送并识别 | Send and Recognize |
| UI-047 | 未配置模型，无法识别该文件。可改用 CSV 模板导入。 | No model configured. This file cannot be recognized. Use the CSV template instead. |
| UI-048 | 显示全部字段 | Show All Fields |
| UI-049 | 确认导入 | Confirm Import |
| UI-050 | 知识库 | Knowledge Base |
| UI-051 | 规则审核 | Rule Review |
| UI-052 | 智能体流水线 | Agent Pipeline |
| UI-053 | 模型接入 | Model Access |
| UI-054 | 已接入 | Connected |
| UI-055 | 未接入 | Not connected |
| UI-056 | 工作区 | Workspace |
| UI-057 | 本 | L |
| UI-058 | 本地用户 | Local user |
| UI-059 | 中 | 中 |
| UI-060 | 红色 | Red |
| UI-061 | 北京时间 | Beijing Time  |
| UI-062 | · 计算批次 | · Calculation run  |
| UI-063 | v0.2.1 · 税则 | v0.2.1 · HTS  |
| UI-064 | 人 | You |
| UI-065 | 已入境 | Entered |
| UI-066 | 规则边界 {p0}天 | Rule boundary in {p0} days |
| UI-067 | 已过入境日 | Entry date passed |
| UI-068 | 入境 {p0}天 | Entry in {p0} days |
| UI-069 | 利润变化 · USD | Profit Change · USD |
| UI-070 | · 预计入境 | · Expected entry  |
| UI-071 | 利好 | Favorable |
| UI-072 | 电商 | E-commerce |
| UI-073 | 进口商 | Importer of record  |
| UI-074 | 卖方 | Seller |
| UI-075 | 买方 | Buyer |
| UI-076 | 搜索订单号、品名、HS 编码… | Search order ID, product, HS code… |
| UI-077 | 今日已处理 | Processed Today |
| UI-078 | 单 |  orders |
| UI-079 | 加载中… | Loading… |
| UI-080 | 重试 | Retry |
| UI-081 | 层 | Layer |
| UI-082 | 第99章税号 | Chapter 99 heading |
| UI-083 | 税率 | Rate |
| UI-084 | 关税额 | Duty |
| UI-085 | 基准关税（ | Baseline Duty ( |
| UI-086 | 新关税 | New Duty |
| UI-087 | 关税增量 | Duty Change |
| UI-088 | 基准 | Baseline |
| UI-089 | 重算 | Recalculated |
| UI-090 | 变化 | Change |
| UI-091 | 收入 | Revenue |
| UI-092 | 卖方成本 | Seller Cost |
| UI-093 | 利润 | Profit |
| UI-094 | 毛利率 | Margin |
| UI-095 | 可执行建议 | Recommended Actions |
| UI-096 | 处理链 | Processing Chain |
| UI-097 | 报关行复核（含未核实字段时） | Broker review (when unverified fields exist) |
| UI-098 | 规则核验 | Rule Checks |
| UI-099 | 订单影响单 | Order Impact Sheet |
| UI-100 | 进口商： | Importer of record:  |
| UI-101 | 品名与税号 | Product and HTS |
| UI-102 | 贸易术语 | Incoterm |
| UI-103 | 无关税条款 | No tariff clause |
| UI-104 | 关税增量我方承担 {p0}% | Seller bears {p0}% of duty increase |
| UI-105 | 关键日期 | Key Dates |
| UI-106 | 装船日 | Load date  |
| UI-107 | 预计入境日 | Expected entry  |
| UI-108 | 已采纳：第 | Adopted: actions  |
| UI-109 | 条 |   |
| UI-110 | 补充说明： | Detail note:  |
| UI-111 | 本工具不构成法律或报关意见；税号归类与最终税额以进口商/报关行申报为准。 | This tool does not provide legal or customs advice. HTS classification and final duty are subject to the importer’s or customs broker’s declaration. |
| UI-112 | 审计日志 | Audit Log |
| UI-113 | 不可篡改 · SHA-256 链式 | Tamper-evident · SHA-256 chain |
| UI-114 | 最近处理 | Recent Decisions |
| UI-115 | 订单号 | Order ID |
| UI-116 | 品名 | Product |
| UI-117 | 利润变化 | Profit Change |
| UI-118 | 处理人 | Actor |
| UI-119 | 时间 | Time |
| UI-120 | 状态印章 | Status Stamp |
| UI-121 | 说明 | Details |
| UI-122 | 已采纳：第 {p0} 条 | Adopted: actions {p0} |
| UI-123 | 触发 | Trigger |
| UI-124 | 采集 | Collect |
| UI-125 | 人工确认 · {p0} 待确认 | Human review · {p0} pending |
| UI-126 | 人工确认 | Human Review |
| UI-127 | 计算 | Calculate |
| UI-128 | 日报 | Brief |
| UI-129 | 完成 | Completed |
| UI-130 | 临界事件 | Critical Events |
| UI-131 | 影响 {p0} 单 · {p1} | Affects {p0} orders · {p1} |
| UI-132 | 暂无受影响订单 | No affected orders |
| UI-133 | 服务器内部错误 | Internal server error |
| UI-134 | 已采纳 | Adopted |
| UI-135 | 不处理 | Dismiss |
| UI-136 | 需补充 | Needs Detail |
| UI-137 | 规则已人工确认 | Rules manually approved |
| UI-138 | 原文引用命中 | Source quote matched |
| UI-139 | 税号存在 | HTS code exists |
| UI-140 | 基准税率一致 | Baseline rate matches |
| UI-141 | 未核实字段 | Unverified fields |
| UI-142 | 原文引用逐字命中 | Source quote matches verbatim |
| UI-143 | 字段均有引用 | All fields have citations |
| UI-144 | 日期合理 | Dates are reasonable |
| UI-145 | 税率范围 | Rate range |
| UI-146 | 第99章税号存在 | Chapter 99 heading exists |
| UI-147 | 目标税号存在 | Target HTS code exists |
| UI-148 | 与已确认规则冲突 | Conflicts with approved rules |
| UI-149 | 新增措施字段完整 | New program fields complete |
| UI-150 | 排除到期日必填 | Exclusion expiry required |
| UI-151 | 通过 | Pass |
| UI-152 | 注意 | Attention |
| UI-153 | 不通过 | Fail |
| UI-154 | 不适用 | Not applicable |
| UI-155 | 等待 | Waiting |
| UI-156 | 运行中 | Running |
| UI-157 | 失败 | Failed |
| UI-158 | 部分完成 | Partially completed |
| UI-159 | 无夹具跳过 | Skipped: no fixture |
| UI-160 | 联邦公报采集 | Federal Register Collector |
| UI-161 | 公开预览采集 | Public Inspection Collector |
| UI-162 | 税则版本检查 | HTS Version Check |
| UI-163 | 政策采集 | Policy Collection |
| UI-164 | 分诊 | Triage |
| UI-165 | 抽取 | Extract |
| UI-166 | 校验 | Validate |
| UI-167 | 计算引擎 | Calculation Engine |
| UI-168 | 你（待决定） | You (decision pending) |
| UI-169 | 已生效 | In force |
| UI-170 | 已签署待生效 | Signed, pending |
| UI-171 | 按期到期 | Scheduled expiry |
| UI-172 | 拟议 | Proposed |
| UI-173 | 调查中 | Under investigation |
| UI-174 | 谈判中（无税率） | In negotiation (no rate) |
| UI-175 | 法院裁决 | Court ruling |
| UI-176 | 程序性 | Procedural |
| UI-177 | 待确认 | Pending approval |
| UI-178 | 已确认 | Approved |
| UI-179 | 已驳回 | Rejected |
| UI-180 | 新增措施 | Add Program |
| UI-181 | 修改措施 | Update Program |
| UI-182 | 修改税号规则 | Update HTS Rule |
| UI-183 | 观察项 | Watch Item |
| UI-184 | 无税率变化 | No rate change |
| UI-185 | 编辑知识 | Edit Knowledge |
| UI-186 | 恢复知识 | Restore knowledge |
| UI-187 | 新建知识 | Create Knowledge |
| UI-188 | 删除知识 | Delete Knowledge |
| UI-189 | 对话外发订单 | Order Data Sent in Chat |
| UI-190 | 文件外发识别 | File Sent for Recognition |
| UI-191 | 导入 | Import |
| UI-192 | 确认规则 | Approve Rule |
| UI-193 | 驳回规则 | Reject Rule |
| UI-194 | 规则需补充 | Rule Needs Detail |
| UI-195 | 决策 | Decision |
| UI-196 | 模型配置 | Model Configuration |
| UI-197 | 政策 | Policy |
| UI-198 | 到期 | Expiry |
| UI-199 | 观察 | Watch |
| UI-200 | 预警（尚未正式发布） | Alert (not yet published) |
| UI-201 | 还没有日报 | No brief yet |
| UI-202 | 日期 | Date |
| UI-203 | 美国关税政策日报 · | U.S. Tariff Policy Brief ·  |
| UI-204 | 待读全文 | Full text pending |
| UI-205 | 原文标题： | Original title:  |
| UI-206 | 受影响订单 · | Affected orders ·  |
| UI-207 | 原文 ↗ | Source ↗ |
| UI-208 | 订单总数 | Total Orders |
| UI-209 | 橙 | Orange |
| UI-210 | 黄 | Yellow |
| UI-211 | 绿 | Green |
| UI-212 | 合计利润变化 | Total Profit Change |
| UI-213 | 潜在退款 | Potential Refund |
| UI-214 | 订单风险收件箱 | Order Risk Inbox |
| UI-215 | + 导入订单 | + Import Orders |
| UI-216 | 全部 | All |
| UI-217 | 非 DDP | Non-DDP |
| UI-218 | 重新计算 | Recalculate |
| UI-219 | 排序：预计入境 最近优先 ↓ | Sort: expected entry, earliest first ↓ |
| UI-220 | 暂无订单，请先导入 CSV | No orders. Import a CSV first. |
| UI-221 | 采纳建议（ | Adopt ( |
| UI-222 | 先勾选要采纳的建议 | Select the actions to adopt first |
| UI-223 | 补充说明（必填） | Detail note (required) |
| UI-224 | 提交 | Submit |
| UI-225 | + 新建条目 | + New Entry |
| UI-226 | 搜索知识库… | Search knowledge base… |
| UI-227 | 规则 | Rule |
| UI-228 | 订单 | Order |
| UI-229 | 影响单 | Impact Sheet |
| UI-230 | 手动 | Manual |
| UI-231 | 显示订单数据 | Show Order Data |
| UI-232 | 暂无条目 | No entries |
| UI-233 | 已编辑 | Edited |
| UI-234 | 来源已更新 | Source Updated |
| UI-235 | 只读 | Read Only |
| UI-236 | 来源已更新，当前显示的是你编辑过的版本 | The source has changed. Your edited version is shown. |
| UI-237 | 查看系统版本 | View System Version |
| UI-238 | 恢复 | Restore |
| UI-239 | 标题 | Title |
| UI-240 | 正文 | Body |
| UI-241 | 保存 | Save |
| UI-242 | 编辑 | Edit |
| UI-243 | 恢复系统版本 | Restore System Version |
| UI-244 | 确定删除这条知识吗？ | Delete this knowledge entry? |
| UI-245 | 删除 | Delete |
| UI-246 | 系统生成，只读 | System generated, read only |
| UI-247 | 立即运行 | Run Now |
| UI-248 | 每日 07:30 | Daily at 07:30 |
| UI-249 | 智能体 | Agent |
| UI-250 | 状态 | Status |
| UI-251 | 输入 | Input |
| UI-252 | 输出 | Output |
| UI-253 | 跳过 | Skipped |
| UI-254 | 错误 | Errors |
| UI-255 | 耗时 | Duration |
| UI-256 | 暂无待确认的规则草稿 | No rule drafts pending approval |
| UI-257 | 预估影响 · USD | Estimated Impact · USD |
| UI-258 | 原文 | Source Text |
| UI-259 | 驳回 | Reject |
| UI-260 | 校验结果 | Validation Results |
| UI-261 | 未接入（使用内置夹具） | Not connected (using built-in fixtures) |
| UI-262 | 接口地址 | Base URL |
| UI-263 | 例如 https://api.example.com/v1 | e.g. https://api.example.com/v1 |
| UI-264 | 已保存 | Saved  |
| UI-265 | ，留空则不修改 | . Leave blank to keep unchanged. |
| UI-266 | 模型名称 | Model Name |
| UI-267 | 填写服务商提供的模型 ID | Enter the model ID from your provider |
| UI-268 | 测试连接 | Test Connection |
| UI-269 | 清除配置 | Clear Configuration |
| UI-270 | 连接成功 | Connected successfully |
| UI-271 | 连接失败：{p0} | Connection failed: {p0} |
| UI-272 | 接口需兼容 OpenAI Chat Completions 格式（POST | The API must support OpenAI Chat Completions (POST  |
| UI-273 | {接口地址} | {Base URL} |
| UI-274 | /chat/completions）。未配置时，智能体使用内置夹具。 | /chat/completions). Agents use built-in fixtures when not configured. |
| UI-275 | Archivo · 订单风险收件箱 | Archivo · Order Risk Inbox |
| UI-276 | Hanken Grotesk · 风险收件箱 | Hanken Grotesk · Risk Inbox |
| UI-277 | Space Mono · 2026-10-31 · 中文 | Space Mono · 2026-10-31 · Chinese |
| UI-278 | 请求参数不合法 | Invalid request parameters |
| UI-279 | 采纳建议（{n}） | Adopt ({n}) |


## 引擎模板（docs/engine_text_templates.json，完整）

| 编号 / 来源 | 中文 | English |
|---|---|---|
| actions/A01 | 入境日若能在 {date} 或之前，税率 {rate_alt}%（当前预计 {rate_new}%），可少缴约 ${saving}；当前预计入境 {entry}，晚 {days} 天。货已装船，入境时间基本由到港时间决定，提前空间很小；不要指望保税仓（按出仓日税率计） | If entry happens on or before {date}, the rate is {rate_alt}% (currently {rate_new}%), saving about ${saving}. Planned entry is {entry}, {days} days late. The goods have shipped, so entry timing mostly depends on arrival and there is little room to move it earlier; a bonded warehouse will not help (duty is assessed at the withdrawal-date rate). |
| actions/A02 | 入境日若能在 {date} 或之前，税率 {rate_alt}%（当前预计 {rate_new}%），可少缴约 ${saving}；当前预计入境 {entry}，晚 {days} 天。尚未装船：评估提前装船、改空运或改港的成本是否低于可省关税 | If entry happens on or before {date}, the rate is {rate_alt}% (currently {rate_new}%), saving about ${saving}. Planned entry is {entry}, {days} days late. Not shipped yet: check whether shipping earlier, switching to air or changing the port costs less than the duty saved. |
| actions/A03 | 盯 USTR 是否在 {date} 前发布延期公告（上一次是 2025-11 延期）；未延期则按上面的数字执行 | Watch whether USTR announces an extension before {date} (the last extension was in 2025-11); if it is not extended, act on the figures above. |
| actions/A04 | 观察：{watch_title} — 当前无税率变化，不改报价；准备备用报价和合同关税条款 | Watch: {watch_title} — no rate change yet; keep the current quote, and prepare a fallback quote and a contract tariff clause. |
| actions/A05 | 维持原毛利率 {margin}% 需售价 ≥ ${price_req}（原 ${price_old}）；结合竞品价格决定是调价还是吸收 | Keeping the original {margin}% margin needs a selling price of at least ${price_req} (was ${price_old}); compare competitor prices before deciding to raise the price or absorb the cost. |
| actions/A06 | 维持原毛利率 {margin}% 需单价 ≥ ${price_req}（原 ${price_old}）；货已发出，只能与客户协商分摊；后续新单改 DAP/FOB 或加关税调整条款 | Keeping the original {margin}% margin needs a unit price of at least ${price_req} (was ${price_old}); the goods have shipped, so only a cost split with the customer is possible; for new orders, switch to DAP/FOB or add a tariff adjustment clause. |
| actions/A07 | 维持原毛利率 {margin}% 需单价 ≥ ${price_req}（原 ${price_old}）；或在发货前与客户改为 DAP/FOB（买方做进口商） | Keeping the original {margin}% margin needs a unit price of at least ${price_req} (was ${price_old}); or switch to DAP/FOB with the customer before shipping (buyer as importer of record). |
| actions/A08 | 按合同关税分担条款，我方承担增量的 {share}：约 ${amount}；向客户发正式通知并附法规原文 | Under the contract's tariff-sharing clause we bear {share} of the increase, about ${amount}; send the customer a formal notice with the regulation text attached. |
| actions/A09 | 客户（进口商）关税增加约 ${amount}，到岸成本 {pct}%；提前沟通，防止压价或取消 | The customer's (importer's) duty rises by about ${amount} and landed cost changes {pct}%; talk to the customer early to avoid price cuts or cancellation. |
| actions/A10 | 关税下降，利润增加约 ${amount}；可留作价格竞争空间或维持报价 | Duty goes down and profit rises by about ${amount}; keep it as room for price competition or hold the quote. |
| actions/A11 | 该票已缴 {program} 约 ${amount}，属已被判无效的关税：由登记进口商通过 CBP CAPE 申报退款；先核对 7501 与清算状态 | This entry paid about ${amount} of {program}, a duty ruled invalid: the importer of record can claim a refund through CBP CAPE; first check the 7501 and the liquidation status. |
| actions/A12 | 该票已缴 {program} 约 ${amount}，合法性仍在上诉中：先保留单证，暂不计入利润 | This entry paid about ${amount} of {program}, whose legality is still under appeal: keep the documents and do not count it in profit yet. |
| actions/A13 | 规则推算应缴 {rate_rule}%，与当时预估 {rate_user}% 不同：核对报关单实际申报的第99章税号 | The rules give {rate_rule}% owed, which differs from the {rate_user}% estimated at the time: check the Chapter 99 headings actually declared on the entry. |
| actions/A14 | 税号/301清单/豁免归属含示例假设：上线前请报关行核对 | Tariff code, Section 301 list and exemption assignments include demo assumptions: have a customs broker check them before going live. |
| reasons/R01 | 重算后亏损 | Loss after recalculation |
| reasons/R02 | 毛利率下降 {pp}pp | Margin change {pp}pp |
| reasons/R03 | 毛利率 {margin}% 低于目标 {target}% | Margin {margin}% is below the {target}% target |
| reasons/R04 | 客户到岸成本 +{pct}% | Customer landed cost +{pct}% |
| reasons/R05 | 观察项：{watch_title}（确定性 {certainty}） | Watch item: {watch_title} (certainty {certainty}) |
| reasons/R06 | 毛利率 {pp}pp / 客户到岸成本 {pct}% | Margin {pp}pp / customer landed cost {pct}% |
| reasons/R07 | 填写的当时税率 {rate_user}% 与规则库按报价日推算的 {rate_rule}% 不一致，先核对基准 | The entered baseline rate {rate_user}% differs from the {rate_rule}% derived from the rules at the quote date; check the baseline first |
| flags/F01 | {program} 与 232 叠加关系未建模，需人工复核 | {program}: stacking with Section 232 is not modelled; needs manual review |
| flags/F02 | {program} 适用在途豁免 {heading}（装船&lt;{loaded_before} 且入境&lt;{entered_before}） | {program}: in-transit exemption {heading} applies (loaded before {loaded_before} and entered before {entered_before}) |
| flags/F03 | 规则库字段 {field}=false（示例假设，需核对第99章原文） | Rule field {field}=false (demo assumption; check the Chapter 99 text) |
| flags/F04 | MPF 上下限取自单一来源（{date} 起），需核对 CBP 公告 | MPF floor and cap come from a single source (from {date}); check the CBP notice |


## 层名、观察项、法律状态与风险

| 编号 / 来源 | 中文 | English |
|---|---|---|
| layer/MFN | 普通税率 | General (MFN) |
| layer/SEC301_LIST_CN | 301 清单 | Section 301 list |
| layer/SEC301_FORCED_LABOR_CN | 301 强迫劳动 | Section 301 forced labor |
| layer/SEC122_GLOBAL | 122 临时附加 | Section 122 surcharge |
| layer/IEEPA_FENTANYL_CN | IEEPA 芬太尼 | IEEPA fentanyl |
| layer/IEEPA_RECIPROCAL_CN | IEEPA 对等 | IEEPA reciprocal |
| watch/W_301_EXCLUSION_EXPIRY/title | 178 项中国 301 排除 11-09 到期 | 178 China Section 301 exclusions expire on 11-09 |
| watch/W_301_EXCLUSION_EXPIRY/summary | 排除覆盖美东时间 2026-11-09 23:59 前入境的货物；截至 2026-10-31 未见延期公告。 | Exclusions cover goods entered before 23:59 U.S. Eastern on 2026-11-09; no extension notice seen as of 2026-10-31. |
| watch/W_232_ROBOTICS/title | 机器人与工业机械 232 公告 | Section 232 proclamation on robotics and industrial machinery |
| watch/W_232_ROBOTICS/summary | 2026-10-28 签署，启动谈判；暂无税率、税号清单和生效日，首次进展报告约 2027-04-26。 | Signed 2026-10-28; starts negotiations; no rate, tariff code list or effective date yet; first progress report due around 2027-04-26. |
| watch/W_301_EXCESS_CAPACITY/title | 301 产能过剩调查（中国：钢、铝、电池、光伏、半导体、汽车） | Section 301 excess-capacity investigation (China: steel, aluminum, batteries, solar, semiconductors, autos) |
| watch/W_301_EXCESS_CAPACITY/summary | 2026-03-11 立案，尚无最终措施。 | Opened 2026-03-11; no final action yet. |
| legal/in_force | 已生效 | In force |
| legal/signed_pending | 已签署待生效 | Signed, pending |
| legal/scheduled_expiry | 按期到期 | Scheduled expiry |
| legal/proposed | 拟议 | Proposed |
| legal/investigation | 调查中 | Under investigation |
| legal/negotiation_no_tariff | 谈判中（无税率） | In negotiation (no rate) |
| legal/court_ruling | 法院裁决 | Court ruling |
| legal/procedural | 程序性 | Procedural |
| draft/draft | 待确认 | Pending |
| draft/needs_detail | 需补充 | Needs Detail |
| draft/approved | 已确认 | Approved |
| draft/rejected | 已驳回 | Rejected |
| risk/红 | 红 | Red |
| risk/橙 | 橙 | Orange |
| risk/黄 | 黄 | Yellow |
| risk/绿 | 绿 | Green |


## 后端错误与校验（localization.py，完整）

| 编号 / 来源 | 中文 | English |
|---|---|---|
| text/1 | 无法连接模型服务 | Cannot reach the model service |
| text/2 | 模型请求超时 | Model request timed out |
| text/3 | 模型返回内容不是符合要求的 JSON | The model did not return the required JSON |
| text/4 | 模型已响应，但返回内容不是 {"ok": true} | The model responded, but did not return {"ok": true} |
| text/5 | 请求参数不合法 | Invalid request parameters |
| text/6 | 服务器内部错误 | Internal server error |
| text/7 | 请求来源不被允许 | Request origin is not allowed |
| text/8 | 连接成功 | Connected |
| text/9 | 系统生成的条目不能编辑 | System-generated entries cannot be edited |
| text/10 | 系统生成的条目不能删除 | System-generated entries cannot be deleted |
| text/11 | 文件过大（上限 10 MB） | File too large (10 MB limit) |
| text/12 | 不支持的文件类型 | Unsupported file type |
| text/13 | 文件未导入，请修正以下错误 | File was not imported. Correct the errors below |
| text/14 | 该草稿已处理，不能重复操作 | This draft has already been reviewed |
| text/15 | 该草稿存在未通过的校验，不能确认 | This draft has failed checks and cannot be approved |
| text/16 | 已有流水线正在运行 | A pipeline is already running |
| text/17 | 通过 | Pass |
| text/18 | 注意 | Attention |
| text/19 | 不通过 | Fail |
| text/20 | 不适用 | Not applicable |
| text/21 | 无夹具，未核验 | No fixture; not verified |
| text/22 | 日期格式应为 YYYY-MM-DD | Date format must be YYYY-MM-DD |
| text/23 | 日期顺序应为 quote_date ≤ load_date ≤ entry_date ≤ delivery_date | Dates must follow quote_date ≤ load_date ≤ entry_date ≤ delivery_date |
| text/24 | 正在识别… | Recognizing… |
| text/25 | 需要确认后发送给模型 | Confirmation required before sending to the model |
| text/26 | 未配置模型，无法识别该文件。可改用 CSV 模板导入。 | No model configured. This file cannot be recognized. Use the CSV template instead. |
| error/1 | 上传文件：{filename} | Uploaded file: {filename} |
| error/2 | 缺少列 {field} | Missing column {field} |
| error/3 | {field} 必须是数字 | {field} must be a number |
| error/4 | {field} 必须大于 0 | {field} must be greater than 0 |
| error/5 | {field} 必须不小于 0 | {field} must be at least 0 |
| error/6 | {field} 必须在 0 到 200 之间 | {field} must be between 0 and 200 |
| error/7 | {field} 必须在 0 到 100 之间（不含 100） | {field} must be at least 0 and less than 100 |
| error/8 | 取值不合法：{value}，允许：{allowed} | Invalid value: {value}. Allowed: {allowed} |
| error/9 | 订单号重复：{id} | Duplicate order ID: {id} |
| error/10 | 规则库中没有该税号，目前支持：{codes} | HTS code not in the rule library. Supported: {codes} |
| error/11 | 未找到{resource}：{key} | {resource} not found: {key} |
| resource/知识条目 | 知识条目 | Knowledge entry |
| resource/对话 | 对话 | Conversation |
| resource/导入任务 | 导入任务 | Import job |
| resource/订单 | 订单 | Order |
| resource/影响单 | 影响单 | Impact sheet |
| resource/计算批次 | 计算批次 | Calculation run |
| resource/规则草稿 | 规则草稿 | Rule draft |
| resource/草稿 | 草稿 | Rule draft |
| resource/日报 | 日报 | Brief |
| resource/流水线批次 | 流水线批次 | Pipeline run |
| resource/流水线 | 流水线 | Pipeline |
| HTTP | HTTP {code}：{body} | HTTP {code}: {body} |


## 审计模板及参数替换（localization.py，完整）

| 编号 / 来源 | 中文 | English |
|---|---|---|
| audit/1 | 导入 {a} 行，更新 {b} 行 | Imported {a} rows, updated {b} rows |
| audit/2 | 对话导入 {name}：导入 {a} 行，更新 {b} 行 | Chat import {name}: imported {a} rows, updated {b} rows |
| audit/3 | 批次 {run} · as_of {date} | Run {run} · as_of {date} |
| audit/4 | 新增 {n} 篇 | Added {n} documents |
| audit/5 | 分诊 {n} 篇，相关 {r} 篇，无夹具跳过 {s} 篇 | Triaged {n} documents, {r} relevant, {s} skipped without fixtures |
| audit/6 | 生成草稿 {n} 篇，无夹具跳过 {s} 篇 | Created {n} drafts, {s} skipped without fixtures |
| audit/7 | 校验草稿 {n} 篇，存在不通过项 {f} 篇 | Checked {n} drafts, {f} with failed checks |
| audit/8 | 日报 {date} · {n} 条 | Brief {date} · {n} items |
| audit/9 | {id} · 已采纳 · 第 {list} 条 | {id} · Adopted · Actions {list} |
| audit/10 | {id} · 需补充 · 补充：{note} | {id} · Needs Detail · Detail note: {note} |
| audit/11 | {id} · 不处理 | {id} · Dismissed |
| audit/12 | {id} · 编辑知识 | {id} · Knowledge edited |
| audit/13 | {id} · 恢复知识 | {id} · Knowledge restored |
| audit/14 | {id} · 新建知识 | {id} · Knowledge created |
| audit/15 | {id} · 删除对话 | {id} · Delete chat |
| audit/16 | {id} · 恢复删除 | {id} · Restore knowledge |
| audit/17 | {id} · 删除知识 | {id} · Knowledge deleted |
| audit/18 | 对话向模型 {model} 发送订单数据：{ids} | Chat sent order data to model {model}: {ids} |
| audit/19 | 文件 {name} 已发送给模型 {model} | File {name} sent to model {model} |
| audit/20 | 模型配置已保存：{model} | Model settings saved: {model} |
| audit/21 | 模型配置已清除 | Model settings cleared |
| audit/22 | 确认 {id} · {outcome} | Approved {id} · {outcome} |
| audit/23 | 驳回 {id} | Rejected {id} |
| audit/24 | {id} 需补充 | {id} needs detail |
| audit parameter | 内置夹具 | Built-in fixtures |
| audit parameter | 不影响现有订单 | No effect on current orders |
| audit parameter | 更新观察项 | Watch item updated |
| audit parameter | 、 | ,  |


## 知识库、日报与对话动态模板（参数归一化）

| 编号 / 来源 | 中文 | English |
|---|---|---|
| generated/1 | 下一节点：{date} | Next milestone: {date} |
| generated/2 | 无 | None |
| generated/3 | 税率 {rate}%<br>第99章税号 {heading}<br>适用入境日 {from} 至 {to}<br>来源：{sources} | Rate {rate}%<br>Chapter 99 heading {heading}<br>Entry dates {from} to {to}<br>Sources: {sources} |
| generated/4 | 无截止 | No end date |
| generated/5 | 法律状态：{legal}<br>原文标题：{title}<br>发布日期：{date}<br>摘要：{summary}<br>草稿状态：{status}<br>原文：{url} | Legal status: {legal}<br>Original title: {title}<br>Publication date: {date}<br>Summary: {summary}<br>Draft status: {status}<br>Source: {url} |
| generated/6 | 美国关税政策日报 · {date} | U.S. Tariff Policy Brief · {date} |
| generated/7 | 贸易术语 | Incoterm |
| generated/8 | 渠道 | Channel |
| generated/9 | 税号 | HTS |
| generated/10 | 数量 | Quantity |
| generated/11 | 单价 | Unit price |
| generated/12 | 完税价格 | Customs value |
| generated/13 | 装船日 | Load date |
| generated/14 | 预计入境日 | Entry date |
| generated/15 | 状态 | Status |
| generated/16 | 电商 | E-commerce |
| generated/17 | 已报价 | Quoted |
| generated/18 | 已确认 | Confirmed |
| generated/19 | 已发货 | Shipped |
| generated/20 | 已入境 | Entered |
| generated/21 | 订单 {id} · {product} | Order {id} · {product} |
| generated/22 | 影响单 {id} · {risk} | Impact sheet {id} · {risk} |
| generated/23 | 订单 {id} {product}（HTS {hts}，{incoterm}）：风险 {risk}；新税率 {rate}%（基准 {baseline}%）；关税增量 {duty}；利润 {old} → {new}（变化 {delta}）<br>原因：{reason} | Order {id} {product} (HTS {hts}, {incoterm}): risk {risk}; new rate {rate}% (baseline {baseline}%); duty change {duty}; profit {old} → {new} (change {delta})<br>Reason: {reason} |
| generated/24 | 今天有新的已生效税率变化。 | There is a new rate change in force today. |
| generated/25 | 今天没有新的已生效税率变化。 | There is no new rate change in force today. |
| generated/26 | 待处理红色订单 {N} 单，合计利润变化 {M}。 | Red orders pending: {N}, total profit change {M}. |
| generated/27 | 没有待处理的红色订单。 | No red orders are pending. |
| generated/28 | 未配置模型，且没有该问题的内置答案。请先到「模型接入」页配置模型。 | No model is configured and this question has no built-in answer. Configure a model on Model Access first. |


## 分诊、抽取、导入和问答的英文夹具（完整）

| 编号 / 来源 | 中文 | English |
|---|---|---|
| triage/2026-22089/one_line_en | 关于马耳他游艇巡航许可的规则，与货物进口关税无关。 | Rule on cruising licenses for Maltese pleasure vessels; unrelated to import duties on goods. |
| triage/2026-21853/one_line_en | 报关行许可年费缴纳通知，不影响货物关税。 | Notice on customs broker permit user fees; does not affect duties on goods. |
| triage/2026-21755/one_line_en | USTR 就是否继续暂停针对中国海事、物流和造船业的 301 措施征求意见；是否影响货物关税需读全文确认。 | USTR seeks comments on further suspending the Section 301 action on China's maritime, logistics and shipbuilding sectors; read the full text to see whether goods duties are affected. |
| triage/2026-21600/one_line_en | CBP 延长邮政小包新入境流程的合规期限；只影响走邮政渠道的货物，新日期需读全文确认。 | CBP extends the compliance period for the new postal informal entry process; affects only goods sent by mail; read the full text for the new date. |
| triage/2026-21570/one_line_en | CBP 调整邮政电子非正式入境流程的测试安排；只影响走邮政渠道的货物。 | CBP modifies the test of the electronic informal entry process for mail; affects only goods sent by mail. |
| triage/2026-21408/one_line_en | 商业实验室认证通知，与关税无关。 | Accreditation notice for a commercial laboratory; unrelated to duties. |
| triage/2026-21407/one_line_en | 商业计量与实验室认证通知，与关税无关。 | Accreditation notice for a commercial gauger and laboratory; unrelated to duties. |
| triage/2026-21406/one_line_en | 商业计量与实验室认证通知，与关税无关。 | Accreditation notice for a commercial gauger and laboratory; unrelated to duties. |
| triage/2026-21405/one_line_en | 商业计量与实验室认证通知，与关税无关。 | Accreditation notice for a commercial gauger and laboratory; unrelated to duties. |
| triage/2026-20884/one_line_en | 铁路旅客预报信息拟议规则，与货物关税无关。 | Proposed rule on advance traveler information for rail; unrelated to duties on goods. |
| triage/2026-20650/one_line_en | CBP 关于低价值货物的拟议规则，可能影响小额包裹的申报与征税方式，具体内容需读全文。 | CBP proposed rule on low-value shipments; may change how small parcels are declared and taxed; read the full text for details. |
| triage/2026-20615/one_line_en | USTR 就欧盟碳边境调节机制对美国贸易的影响征求意见，不涉及美国对华进口关税。 | USTR seeks comments on how the EU carbon border adjustment mechanism affects U.S. trade; not about U.S. duties on Chinese goods. |
| triage/2026-20511/one_line_en | USTR 对中国 301 措施的一项产品排除做了一致性修订；涉及哪个税号需读全文确认。 | USTR makes a conforming amendment to one product exclusion under the China Section 301 action; read the full text for the tariff code. |
| triage/2026-20510/one_line_en | 中国技术转让 301 措施未在 2026-07-06 终止，继续有效；四年审查仍在进行，暂无税率变化。 | The China technology-transfer Section 301 actions did not terminate on 2026-07-06 and remain in effect; the four-year review continues; no rate change. |
| triage/2026-20341/one_line_en | 美墨加协定运行情况的征求意见与听证通知，不涉及中国原产货物。 | Request for comments and hearing on the operation of the USMCA; not about goods of Chinese origin. |
| triage/2026-20228/one_line_en | CBP 就法院判令的 IEEPA 关税退款工作表开展信息收集；与已入境订单的退款申请相关。 | CBP information collection for the court-ordered IEEPA refund worksheet; relevant to refund claims for entered orders. |
| triage/2026-20229/one_line_en | CBP 客户代表技术支持门户的信息收集通知，与关税无关。 | CBP information collection for the Client Representative Technical Assistance Portal; unrelated to duties. |
| triage/2026-20185/one_line_en | 国土安全部移民相关费用的通胀调整，与货物关税无关。 | Inflation adjustment of DHS immigration-related fees; unrelated to duties on goods. |
| triage/2026-20171/one_line_en | 报关单（Entry Summary）信息收集的常规修订，不改变税率。 | Routine revision of the entry summary information collection; no rate change. |
| triage/2026-20170/one_line_en | 入境申报信息收集的常规修订，不改变税率。 | Routine revision of the entry information collection; no rate change. |
| triage/2026-22385/one_line_en | 总统公告（第 11077 号）：对机器人、工业机械及其零部件的进口作出调整；是否加征关税需读全文确认。 | Presidential Proclamation 11077 adjusts imports of robotics, industrial machinery and their parts; read the full text to see whether duties are imposed. |
| triage/2026-22386/one_line_en | 国防授权法相关权限委托备忘录，与关税无关。 | Memorandum delegating authority under the National Defense Authorization Act; unrelated to duties. |
| triage/2026-22251/one_line_en | USTR 绩效评审委员会成员名单，与关税无关。 | List of USTR Performance Review Board members; unrelated to duties. |
| extract/2026-20511/summary_en | 自 2026-07-01 起入境的货物，中国 301 排除注释 20(vvv)(i)(20) 的适用范围改用统计编号 8479.90.9591 描述，以维持原有排除范围；不改变税率。 | From 2026-07-01, the coverage of China Section 301 exclusion note 20(vvv)(i)(20) is described by statistical number 8479.90.9591 to keep the original coverage; no rate change. |
| extract/2026-20510/summary_en | 中国技术转让 301 措施未终止、继续有效，之后可能因四年审查而修改；本次不改变任何税率。 | The China technology-transfer Section 301 actions have not terminated and remain in effect; they may change after the four-year review; this notice changes no rate. |
| import/338b5ec0c948576e90b5e03031fe43503574fcc3c8e93e8f02b04f6bb7ad5115/notes_en | 从图片识别出 2 行订单。 | Recognized 2 order rows from the image. |
| chat/why is o5 red? | O5（微型电机）重算后亏损，所以是红色。它原来适用 301 排除，但排除只覆盖 2026-11-09 及以前入境的货物，O5 预计 2026-11-16 入境，新税率 41.9%，关税增量 +$16,000.00，利润由 $8,473.57 变为 −$7,526.43。 | O5 (small electric motors) shows a loss after recalculation, so it is red. It relied on a Section 301 exclusion that only covers goods entered by 2026-11-09, but O5 is expected to enter on 2026-11-16. The new rate is 41.9%, duty rises by +$16,000.00, and profit goes from $8,473.57 to −$7,526.43. |
