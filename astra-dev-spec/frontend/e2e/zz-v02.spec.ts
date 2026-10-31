import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
const api = "http://127.0.0.1:8001/api";
const screenshots = resolve(__dirname, "../../artifacts/screenshots");
async function shot(page: Page, task: string) {
  mkdirSync(screenshots, { recursive: true });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: resolve(screenshots, `${task}.png`) });
}

test("specified actions, disabled empty selection, and cost differences", async ({ page, request }) => {
  await page.goto("/inbox?order=O5");
  await expect(page.getByRole("button", { name: /采纳建议（0）/ })).toBeDisabled();
  await expect(page.getByTestId("profits")).toContainText("+$16,000.00");
  await expect(page.getByTestId("profits")).toContainText("−17.8pp");
  await expect(page.getByTestId("layers").locator("tbody td").first()).toHaveCSS("white-space", "nowrap");
  const before = await (await request.get(api + "/decisions")).json();
  await page.locator("h1").click();
  await page.keyboard.press("Control+Enter");
  await expect(page.getByText("先勾选要采纳的建议")).toBeVisible();
  expect((await (await request.get(api + "/decisions")).json()).length).toBe(before.length);
  await page.getByRole("checkbox", { name: "action-1", exact: true }).check();
  await page.getByRole("checkbox", { name: "action-3", exact: true }).check();
  await page.getByRole("button", { name: /采纳建议（2）/ }).click();
  await expect(page.locator(".decision-explanation")).toHaveText("已采纳：第 01、03 条");
  await expect(page.locator(".history-table tbody tr").first()).toContainText("第 01、03 条");
  await shot(page, "T-10.2-adopted");
});

test("detail note shortcut submits Needs Detail and preserves text", async ({ page }) => {
  await page.goto("/inbox?order=O1");
  await expect(page.locator(".document-header .label-mono")).toContainText("O1 · 规则快照");
  await page.locator("h1").click();
  await page.keyboard.press("Control+d");
  const note = page.getByLabel("补充说明（必填）");
  await expect(note).toBeVisible();
  await expect(page.getByRole("button", { name: "提交", exact: true })).toBeDisabled();
  await note.fill("请确认客户是否接受新报价，再决定建议。");
  await shot(page, "T-10.2-note");
  await note.press("Control+Enter");
  await expect(page.getByTestId("big-stamp")).toHaveText("需补充");
  await expect(page.locator(".decision-explanation")).toContainText("补充说明：请确认客户是否接受新报价");
  await expect(note).toHaveCount(0);
});

test("Ctrl Backspace inside search never submits a decision", async ({ page, request }) => {
  await page.goto("/inbox");
  await expect(page.locator(".impact-card")).toHaveCount(8);
  const before = await (await request.get(api + "/decisions")).json();
  const search = page.getByPlaceholder(/搜索订单/);
  await search.fill("abc def");
  await search.press("Control+Backspace");
  await expect(search).toHaveValue("abc ");
  expect((await (await request.get(api + "/decisions")).json()).length).toBe(before.length);
  await shot(page, "T-9.1");
});

test("knowledge edits preserve content after source changes and restore system version", async ({
  page,
  request,
}) => {
  await page.goto("/knowledge?id=policy%3A2026-20510");
  await page.getByRole("button", { name: "编辑", exact: true }).click();
  await page.getByLabel("正文", { exact: true }).fill("本地编辑的政策说明，仅用于问答。");
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await expect(page.locator(".knowledge-body")).toHaveText("本地编辑的政策说明，仅用于问答。");
  const response = await request.post(api + "/rule-drafts/DRAFT-2026-20510/review", {
    data: { action: "needs_detail" },
  });
  expect(response.ok()).toBeTruthy();
  await page.reload();
  await expect(page.getByText("来源已更新，当前显示的是你编辑过的版本")).toBeVisible();
  await page.getByRole("button", { name: "查看系统版本", exact: true }).click();
  await expect(page.locator(".system-version")).toBeVisible();
  await expect(page.locator(".knowledge-body").first()).toHaveText("本地编辑的政策说明，仅用于问答。");
  await shot(page, "T-11.3-source-changed");
  await page.getByRole("button", { name: "恢复", exact: true }).click();
  await expect(page.getByText("来源已更新，当前显示的是你编辑过的版本")).toHaveCount(0);
  await expect(page.locator(".knowledge-body")).not.toHaveText("本地编辑的政策说明，仅用于问答。");
  await shot(page, "T-11.3");
  await page.goto("/knowledge?id=impact%3AO5");
  await expect(page.getByText("系统生成，只读", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "编辑", exact: true })).toHaveCount(0);
});

test("workbench policy and order answers show citations and numeric guard", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".sidebar nav a").first()).toContainText("工作台");
  await expect(page.getByRole("checkbox", { name: "对话可使用订单数据" })).not.toBeChecked();
  await page.getByRole("button", { name: "新对话", exact: true }).click();
  const input = page.getByPlaceholder("输入问题，或上传订单文件…");
  await input.fill("今天有哪些需要关注的政策？");
  await input.press("Enter");
  await expect(page.locator(".chat-assistant .tags a")).toHaveCount(2);
  await shot(page, "T-12.3");
  const source = page.locator(".chat-assistant .tags a").first();
  await source.click();
  await expect(page).toHaveURL(/knowledge\?id=/);
  await page.goto("/");
  await page.getByPlaceholder("输入问题，或上传订单文件…").fill("O5 为什么是红色？");
  await page.getByRole("button", { name: "发送", exact: true }).click();
  await expect(page.getByText(/回答中有知识库里找不到的数字/)).toBeVisible();
  await shot(page, "T-12.3-guard");
  await page.getByRole("checkbox", { name: "对话可使用订单数据" }).check();
  await expect(page.getByText(/开启后，检索到的订单和影响单内容会发送给模型/)).toBeVisible();
  await page.getByPlaceholder("输入问题，或上传订单文件…").fill("O5 为什么是红色？");
  await page.getByRole("button", { name: "发送", exact: true }).click();
  await expect(page.locator(".chat-assistant").last().locator('a[href*="impact%3AO5"]')).toBeVisible();
  await expect(page.locator(".chat-assistant").last()).not.toContainText("回答中有知识库里找不到的数字");
});

test("image import requires consent, validates edits, and imports two orders", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "新对话", exact: true }).click();
  await page
    .locator('input[type="file"]')
    .setInputFiles(resolve(__dirname, "../../backend/fixtures/import/order_sheet_sample.png"));
  const consent = page.getByRole("dialog");
  await expect(consent).toContainText("文件可能包含客户、价格和成本信息。");
  await expect(consent).toContainText("内置夹具");
  await shot(page, "T-12.4-consent");
  await page.getByRole("button", { name: "发送并识别", exact: true }).click();
  await expect(page.locator(".import-preview tbody tr")).toHaveCount(2);
  const qty = page.getByRole("textbox", { name: "1-qty", exact: true });
  const original = await qty.inputValue();
  await qty.fill("0");
  await qty.blur();
  await expect(qty).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("button", { name: "确认导入", exact: true })).toBeDisabled();
  await shot(page, "T-12.4-invalid");
  await qty.fill(original);
  await qty.blur();
  await expect(page.getByRole("button", { name: "确认导入", exact: true })).toBeEnabled();
  await shot(page, "T-12.4");
  await page.getByRole("button", { name: "确认导入", exact: true }).click();
  await expect(page.getByTestId("import-preview")).toContainText("已导入2行，更新0行");
  await page.goto("/inbox");
  await expect(page.locator(".impact-card")).toHaveCount(10);
});

test("language selection persists across refresh and all primary pages", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  const labels = [
    "Workbench",
    "Risk Inbox",
    "Policy Brief",
    "Knowledge Base",
    "Rule Review",
    "Agent Pipeline",
    "Model Access",
  ];
  for (let i = 0; i < labels.length; i++)
    await expect(page.locator(".sidebar nav a").nth(i)).toContainText(labels[i]);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("h1")).toHaveText("Workbench");
  await shot(page, "T-13.1-workbench");
  for (const [path, title] of [
    ["/inbox?order=O5", "Order Risk Inbox"],
    ["/knowledge", "Knowledge Base"],
    ["/brief", "Policy Brief"],
    ["/review", "Rule Review"],
    ["/pipeline", "Agent Pipeline"],
    ["/settings", "Model Access"],
  ]) {
    await page.goto(path);
    await expect(page.locator("h1")).toHaveText(title);
    await shot(page, `T-13.1-${path.split("?")[0].slice(1)}`);
  }
  await page.getByRole("button", { name: "中", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expect(page.locator("h1")).toHaveText("模型接入");
  expect(errors).toEqual([]);
});
