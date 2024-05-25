const { test, expect } = require("@playwright/test");
const { faker } = require("@faker-js/faker");

// functions
const getPlansSetting = async ({ page }) => {
  return page.locator("section").getByRole("link").filter({ hasText: "Plans" });
};

const getCreatedPlan = async ({ page, planName }) => {
  return page.locator("fieldset").filter({ hasText: planName });
};

const fillPlan = async ({ description, expiringCredit, expiringDayPasses, name, page, period, price, signUp, taxRate }) => {
  const dialog = page.locator("dialog");
  await dialog.locator("fieldset", { hasText: "Name" }).locator("input").fill(name);
  if (period) {
    await dialog.locator("fieldset").locator("select").selectOption(period);
  }
  if (price !== undefined) {
    await dialog.locator("fieldset", { hasText: "Price" }).locator("input").fill(price);
  }
  if (taxRate) {
    if (dialog.locator("fieldset", { hasText: "Custom Tax Rate" }).getByRole("switch").getAttribute("aria-checked", "false")) {
      await dialog.locator("fieldset", { hasText: "Custom Tax Rate" }).getByRole("switch").click();
    }
    await dialog.locator("fieldset", { hasText: "Tax Rate" }).locator("input").fill(taxRate);
  }
  if (description) {
    await dialog.locator("fieldset", { hasText: "Description" }).locator("textarea").fill(description);
  }
  if (signUp === false) {
    if (dialog.locator("fieldset", { hasText: "Sign-Up" }).getByRole("switch").getAttribute("aria-checked", "true")) {
      //// correct aria-checked
      await dialog.locator("fieldset", { hasText: "Sign-Up" }).getByRole("switch").click();
    }
  }
  if (expiringCredit) {
    await dialog.locator("fieldset", { hasText: "Expiring Credits" }).locator("input").fill(expiringCredit);
  }
  if (expiringDayPasses) {
    await dialog.locator("fieldset", { hasText: "Expiring Day Passes" }).locator("input").fill(expiringDayPasses);
  }
};

test.use({ storageState: "session.json" });

test.describe("Functional overview test for Plans page", () => {
  const plans = [
    { name: `Day ${Date.now()}` },
    { name: `Week ${Date.now()}`, period: "Week" },
    {
      name: `Month ${Date.now()}`,
      period: "Month",
      description: faker.lorem.text(),
      price: "200",
      taxRate: "99",
      signUp: false,
      expiringCredit: "109",
      expiringDayPasses: "1",
    },
  ];
  const planName = plans[0].name;

  test.beforeEach(async ({ page }) => {
    await page.goto("https://startuphub.andcards.com/suite/organizations/ad70a36e-0b38-4ac8-aa50-e4db5bb4577e/settings");
    const planSettings = await getPlansSetting({ page });
    await planSettings.click();
    await expect(page.getByRole("heading", { name: "Plans" })).toBeVisible();
  });

  test("User must be able to create new plan", async ({ page }) => {
    const createPlanButton = page.getByRole("button", { name: "Create" });
    for (const plan of plans) {
      await createPlanButton.click();
      await expect(page.getByRole("heading", { name: "New Plan" })).toBeVisible();
      await fillPlan({ ...plan, page });
      /* await fillPlan({
        page,
        name: plan.name,
        description: plan.description,
        period: plan.period,
        taxRate: plan.taxRate,
        expiringCredit: plan.expiringCredit,
        expiringDayPasses: plan.expiringDayPasses,
      }); */
      await page.locator("dialog").getByRole("button", { name: "Save" }).click();
      await page.waitForResponse((request) => request.url().includes("/api/plans/v1.0") && request.status() === 201);
      await expect(page.locator("fieldset", { hasText: plan.name })).toBeVisible();
      if (plan.price && plan.expiringCredit && plan.expiringDayPasses) {
        await expect(page.locator("fieldset", { hasText: plan.name })).toContainText(
          `₩${plan.price}, +${plan.expiringCredit} ☆, +${plan.expiringDayPasses} day pass / month`
        );
      }
    }
  });

  test("User must NOT be able to create new a plan without filling up required field", async ({ page }) => {
    const createPlanButton = page.getByRole("button", { name: "Create" });
    await createPlanButton.click();
    await expect(page.getByRole("heading", { name: "New Plan" })).toBeVisible();
    await fillPlan({ name: "", page, price: "" });
    await expect(page.getByRole("button", { name: "Save" })).toHaveAttribute("area-disabled", "true");
  });

  test("User must NOT be able to create new a plan when Sign Up is enabled and price is 0", async ({ page }) => {
    const validationMessage = page.locator("dialog", { hasText: "Please indicate the price or disable Sign-Up" });
    const createPlanButton = page.getByRole("button", { name: "Create" });
    await createPlanButton.click();
    await expect(page.getByRole("heading", { name: "New Plan" })).toBeVisible();
    await fillPlan({ name: String(Date.now()), page, price: "0", signUp: true });
    await page.getByRole("button", { name: "Save" }).click();
    await page.waitForResponse((request) => request.url().includes("/api/plans/v1.0") && request.status() === 400);
    await expect(validationMessage).toBeVisible();
  });

  test("Verify Share Public Link option redirect", async ({ page }) => {
    const createdPlan = await getCreatedPlan({ page, planName });
    await createdPlan.getByRole("button").click();
    await page.getByRole("button", { name: "Share Public Link" }).click();
    await expect(page.locator("dialog", { hasText: "Copied to clipboard." })).toBeVisible();
    const clipboardLink = await page.evaluate("navigator.clipboard.readText()");
    await page.goto(clipboardLink);
    await expect(page.getByRole("heading", { name: planName })).toBeVisible();
    (await expect(page.getByRole("button", { name: "Subscribe" })).toBeVisible()) &&
      (await expect(page.getByRole("button", { name: "Subscribe" })).toBeEditable());
  });

  test("User must be able to edit the plan", async ({ page }) => {
    const createdPlan = await getCreatedPlan({ page, planName });
    await createdPlan.getByRole("button").click();
    await page.getByRole("button", { name: "Edit" }).click();
    expect(await page.locator("dialog").getByRole("heading").innerText()).toEqual("Edit Plan");
    const dialog = page.locator("dialog").locator("fieldset");
    await dialog.filter({ hasText: "Name" }).locator("input").fill("Flex Membership_testAutomation_updated");
    await dialog.getByPlaceholder("Description").fill(faker.lorem.text());
    await dialog.filter({ hasText: "Price, ₩/" }).locator("input").fill("169");
    await dialog.filter({ hasText: "Custom Tax Rate" }).getByRole("switch").click();
    await dialog.filter({ hasText: "Tax Rate" }).locator("input").fill("100");
    await dialog.filter({ hasText: "Sign-Up" }).getByRole("switch").click();
    await dialog.filter({ hasText: "Expiring Credits, ☆" }).locator("input").fill("179");
    await dialog.filter({ hasText: "Expiring Day Passes" }).locator("input").fill("189");
    await page.getByRole("button", { name: "Save" }).click();
    await page.waitForResponse((request) => request.url().includes("/api/plans/v1.0") && request.status() === 200);
    const updatedPlan = page.locator("fieldset").filter({ hasText: "Flex Membership_testAutomation_updated" });
    await expect(updatedPlan).toBeVisible();
    await expect(updatedPlan).toContainText("₩169, +179 ☆, +189 day passes / month");
  });

  test("User must be able to delete the plan", async ({ page }) => {
    const createdPlan = page.locator("fieldset").filter({ hasText: "Flex Membership_testAutomation_updated" });
    await expect(createdPlan).toBeVisible();
    await createdPlan.getByRole("button").click();
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByRole("dialog"), { hasText: "Delete Plan" }).toBeVisible();
    await page.getByRole("button", { name: "OK" }).click();
    await page.waitForResponse((request) => request.url().includes("/api/plans/v1.0") && request.status() === 204);
    await expect(createdPlan).toBeHidden();
  });

  /*test.afterAll(async( { page}) => {
    // delete all plans 

  }) */
});
