const { test, expect } = require("@playwright/test");
const { faker } = require("@faker-js/faker");

// functions
const getCreditsSetting = async ({ page }) => {
  return page.locator("section").getByRole("link").filter({ hasText: "Credits" });
};

test.use({ storageState: "session.json" });

test.describe("Functional overview test for Credits page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("https://startuphub.andcards.com/suite/organizations/ad70a36e-0b38-4ac8-aa50-e4db5bb4577e/settings");
    const creditsSettings = await getCreditsSetting({ page });
    await creditsSettings.click();
    await page.getByRole("heading", { name: "Credits" }).isVisible();
  });

  test("Verify Switch Credits", async ({ page }) => {
    const creditsSwitch = page.locator("fieldset").filter({ hasText: "Credits" }).getByRole("switch");
    await expect(creditsSwitch).toHaveAttribute("aria-checked", "true");
    await expect(page.getByRole("button", { name: "Create" })).toBeVisible();
    await creditsSwitch.click();
    await expect(creditsSwitch).toHaveAttribute("aria-checked", "false");
    await expect(page.getByRole("button", { name: "Create" })).toBeHidden();
    await creditsSwitch.click();
    await expect(creditsSwitch).toHaveAttribute("aria-checked", "true");
  });

  test("Verify Discount switch", async ({ page }) => {
    const discountSwitch = page.locator("fieldset", { hasText: "Discount" }).getByRole("switch");
    await expect(discountSwitch).toHaveAttribute("aria-checked", "true");
    await discountSwitch.click();
    await expect(discountSwitch).toHaveAttribute("aria-checked", "false");
    await discountSwitch.click();
    await expect(discountSwitch).toHaveAttribute("aria-checked", "true");
  });

  test("Verify adding of a new credit", async ({ page }) => {
    const createCreditButton = page.getByRole("button", { name: "Create" });
    await createCreditButton.click();
    await expect(page.locator("dialog").getByRole("heading", { name: "New Credit Package" })).toBeVisible();
    await page.locator("fieldset", { hasText: "Credits" }).locator("input").fill("69");
    await page.getByRole("button", { name: "Save" }).click();
    await page.waitForResponse((request) => request.url().includes("/api/credit_options/v1.0") && request.status() === 201);
    expect(await page.locator("h1").textContent()).toEqual("Credits");
    await expect(page.locator("fieldset").filter({ hasText: "69 ☆" })).toContainText("₩100");
  });

  test("Verify credit edition", async ({ page }) => {
    const createdCredit = page.locator("fieldset").filter({ hasText: "69 ☆" });
    await createdCredit.getByRole("button").click();
    await page.getByRole("button", { name: "Edit" }).click();
    await expect(page.locator("dialog").getByRole("heading", { name: "Edit Credit Package" })).toBeVisible();
    await page.locator("fieldset", { hasText: "Credits" }).locator("input").fill("79");
    await page.locator("fieldset", { hasText: "Price, ₩" }).locator("input").fill("200");
    await page.getByRole("button", { name: "Save" }).click();
    await page.waitForResponse((request) => request.url().includes("/api/credit_options/v1.0") && request.status() === 200);
    expect(await page.locator("h1").textContent()).toEqual("Credits");
    await expect(page.locator("fieldset").filter({ hasText: "79 ☆" })).toBeVisible();
    await expect(page.locator("fieldset").filter({ hasText: "79 ☆" })).toContainText("₩200");
  });

  test("Verify credit deletion", async ({ page }) => {
    const createdCredit = page.locator("fieldset").filter({ hasText: "79 ☆" });
    await createdCredit.getByRole("button").click();
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.locator("dialog", { hasText: "Delete Credit Package" })).toBeVisible();
    await page.getByRole("button", { name: "OK" }).click();
    await page.waitForResponse((request) => request.url().includes("/api/credit_options/v1.0") && request.status() === 204);
    await expect(createdCredit).toBeHidden();
  });
});
