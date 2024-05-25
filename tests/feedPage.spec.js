const { test, expect } = require("@playwright/test");
const { faker } = require("@faker-js/faker");
const { beforeEach } = require("node:test");

test.use({ storageState: "session.json" });

test.describe("Functional overview test for Feed page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("https://startuphub.andcards.com/suite/organizations/2e1f5860-cb5c-11ee-9297-917ca01624ea/feed");
    await expect(page.getByRole("heading", { name: "Feed" })).toBeVisible();
  });

  test("User must be able to create a post", async ({ page }) => {
    const currentUserName = "Angélica Pavão";
    const createdPostWindow = page.locator("dialog");

    await page.getByRole("button", { name: "Create Post" }).click();
    expect(await createdPostWindow.getByRole("heading").textContent()).toEqual("Create Post");
    await expect(createdPostWindow.locator("section")).toContainText(currentUserName);
    await createdPostWindow.locator("textarea").fill(faker.lorem.text());
    await createdPostWindow.getByRole("button", { name: "Post" }).click();
  });

  /*
test.describe("Functional overview of create post dialog", () => {
  test.beforeEach(async ({ page }) => {
    const createPostButton = page.getByRole("button", { name: "Create Post" });
    await createPostButton.click();
    const createPostDialog = page.locator("dialog");
    await expect(createPostDialog.locator("h1", { hasText: "Create Post" })).toBeVisible();
  });
  test("Verify close button", async ({ page }) => {
    const createPostDialog = page.locator("dialog");
    await page.getByRole("button", { name: "Close" }).click();
    await expect(createPostDialog.locator("h1", { hasText: "Create Post" })).toBeHidden();
  });

  test("Verify Post button state", async ({ page }) => {
    const createPostDialog = page.locator("dialog");
    const postButton = createPostDialog.getByRole("button", { name: "Post" });
    await expect(postButton).toHaveAttribute("area-disabled", "true");
    await page.locator("textarea").fill(faker.lorem.word());
    await expect(postButton).toBeEnabled();
  });
});

test("Create a post", async ({ page }) => {
  const createPostButton = page.getByRole("button", { name: "Create Post" });
  const loremText = faker.lorem.text();
  await createPostButton.click();
  await expect(page.locator("dialog").locator("h1", { hasText: "Create Post" })).toBeVisible();
  await page.locator("textarea").fill(loremText);
  await page.locator("dialog").getByRole("button", { name: "Post" }).click();
  await page.waitForResponse((request) => request.url().includes("/api/activities/v1") && request.status() === 201);
  expect(await page.getByRole("heading").innerText()).toEqual("Feed");
  await expect(page.locator("section", { hasText: loremText })).toBeVisible();
});

test('Verif post options', async ({ page}) => {
  const createdPost = page.locator('') 
})

*/
});
