const { test, expect } = require("@playwright/test");

// functions
const getFloorsSetting = async ({ page }) => {
  return page.locator("section").getByRole("link").filter({ hasText: "Floors" });
};

test.use({ storageState: "session.json" });

test.describe("Functional overview test for Floors page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("https://startuphub.andcards.com/suite/organizations/ad70a36e-0b38-4ac8-aa50-e4db5bb4577e/settings");
    const floorsSettings = await getFloorsSetting({ page });
    await floorsSettings.click();
    await page.getByRole("heading", { name: "Floors" }).isVisible();
  });
})