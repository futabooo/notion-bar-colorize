import { expect, test } from "./fixtures";

test.describe("option.html tests", () => {
  test.beforeEach(async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/src/option.html`);
    // 非同期でchrome.storage.sync.getが呼ばれてawaitしてないので待つ
    await page.waitForTimeout(1000);
  });

  test("option popup page", async ({ page, extensionId }) => {
    // Check if the table header contains "Wordspace ID" and "Color"
    const tableHeaders = page.locator("#conditions th");
    await expect(tableHeaders.nth(0)).toHaveText("Workspace ID");
    await expect(tableHeaders.nth(1)).toHaveText("Color");

    // Check if the "add new condition" button is present
    const addButton = page.locator("#add");
    await expect(addButton).toHaveText("add new condition");

    // Check if the "save" button is present
    const saveButton = page.locator("#save");
    await expect(saveButton).toHaveText("save");
  });

  test("add and save new condition", async ({ page, extensionId }) => {
    // Click the "add new condition" button
    await page.click("#add");

    // Verify that a new row is added with empty inputs
    const newRow = page.locator("#conditions tr:last-child");
    const workspaceIdInput = newRow.locator("td:nth-child(1) input");
    const colorInput = newRow.locator("td:nth-child(2) input");

    await expect(workspaceIdInput).toHaveValue("");
    await expect(colorInput).toHaveValue("");

    // Fill in the new condition
    await workspaceIdInput.fill("test-workspace-id");
    await colorInput.fill("rgb(150, 68, 68)");

    // Intercept the alert dialog and verify its message
    page.on("dialog", async (dialog) => {
      expect(dialog.type()).toBe("alert");
      expect(dialog.message()).toBe("saved!");
      await dialog.accept();
    });

    // Click the "save" button
    await page.click("#save");
  });

  test("delete condition", async ({ page, extensionId }) => {
    const initialRowCount = await page.locator("#conditions tr").count();

    // Click the "add new condition" button
    await page.click("#add");
    const afterRowCount = await page.locator("#conditions tr").count();
    await expect(afterRowCount).toBe(initialRowCount + 1);

    // Click the delete button on the new row
    const deleteButton = page.locator("#conditions tr:last-child #remove");
    await deleteButton.click();

    // Verify that the row is removed
    const finalRowCount = await page.locator("#conditions tr").count();
    await expect(finalRowCount).toBe(initialRowCount);
  });
});

test.describe("storage sync", () => {
  test.beforeEach(async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/src/option.html`);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => chrome.storage.sync.clear(() => resolve()))
    );
    await page.reload();
    await page.waitForTimeout(1000);
  });

  test("option page reflects synced data without reload", async ({ page }) => {
    // ストレージが空なので空の条件行が1つ表示される
    await expect(page.locator(".condition")).toHaveCount(1);
    await expect(page.locator(".workspace-id").first()).toHaveValue("");

    // 別デバイスからのsyncを模倣してストレージを直接更新
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          chrome.storage.sync.set(
            {
              notionBarColorizeConditions: [
                { workspaceId: "synced-workspace", color: { r: 83, g: 173, b: 78 } },
              ],
            },
            () => resolve()
          )
        )
    );

    // onChangedリスナーがUIを更新するのを待つ
    await page.waitForTimeout(500);

    await expect(page.locator(".condition")).toHaveCount(1);
    await expect(page.locator(".workspace-id").first()).toHaveValue("synced-workspace");
  });

  test("option page shows empty row when synced data is cleared", async ({
    page,
  }) => {
    // まずデータをセット
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          chrome.storage.sync.set(
            {
              notionBarColorizeConditions: [
                { workspaceId: "workspace-1", color: { r: 83, g: 173, b: 78 } },
              ],
            },
            () => resolve()
          )
        )
    );
    await page.waitForTimeout(500);
    await expect(page.locator(".workspace-id").first()).toHaveValue("workspace-1");

    // 別デバイスからのsyncで条件が削除された場合を模倣
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          chrome.storage.sync.set(
            { notionBarColorizeConditions: [] },
            () => resolve()
          )
        )
    );
    await page.waitForTimeout(500);

    // 空の条件行が1つ表示される
    await expect(page.locator(".condition")).toHaveCount(1);
    await expect(page.locator(".workspace-id").first()).toHaveValue("");
  });
});
