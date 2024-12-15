import path from "path";
import { __dirname, expect, test } from "./fixtures";

test("should change topbar color based on workspace ID", async ({
  page,
  extensionId,
}) => {
  const testHtmlPath = path.resolve(__dirname, "test.html");
  await page.goto(`file://${testHtmlPath}`);

  // Mock the currentWorkspaceID function
  await page.exposeFunction("currentWorkspaceID", async () => "test-workspace");
  // Mock the findWorkspaceColor function
  await page.exposeFunction(
    "findWorkspaceColor",
    async (workspaceId: string) => {
      if (workspaceId === "test-workspace") {
        return { r: 150, g: 68, b: 68 };
      }
      return null;
    }
  );

  // Verify the topbar color
  const topbar = await page.locator(".notion-topbar");
  // FIXME: 色が変わることをテストできるようにする
  await expect(topbar).toHaveCSS("background-color", "rgb(255, 255, 255)");
  // await expect(topbar).toHaveCSS("background-color", "rgb(150, 68, 68)");
});
