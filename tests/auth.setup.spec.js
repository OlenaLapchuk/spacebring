// @ts-check
const { test, expect } = require("@playwright/test");
const { url } = require("inspector");
const { faker } = require("@faker-js/faker");
// Functions

test("Log in to the app", async ({ page }) => {
  await page.goto("https://startuphub.andcards.com/suite/organizations");
  const logInButton = page.getByRole("button", { name: "Log In" });
  const emailField = page.getByPlaceholder("Email");
  const continueButton = page.getByRole("button", { name: "Continue" });
  const confirmationCodeField = page.getByPlaceholder("Confirmation Code");
  const validEmail = "startuphub@andcards.com";
  const validOtp = "978435";

  await logInButton.click();

  await expect(emailField).toBeVisible();
  await expect(continueButton).toHaveAttribute("area-disabled", "true");

  await emailField.fill(validEmail);
  await expect(emailField).toHaveValue(validEmail);

  await continueButton.click();
  await expect(confirmationCodeField).toBeVisible();

  await confirmationCodeField.fill(validOtp);
  await expect(confirmationCodeField).toHaveValue(validOtp);

  const linkToUserProfile = page.locator('[href="/suite/account"]');
  await expect(linkToUserProfile).toBeVisible();
  await page.context().storageState({ path: "session.json" });
});
