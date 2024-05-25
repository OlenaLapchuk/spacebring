const { test, expect } = require("@playwright/test");
const { faker } = require("@faker-js/faker");

// functions

const getDesksSettings = async ({ page }) => {
  return page.locator("section").getByRole("link").filter({ hasText: "Desks" });
};

const getActionsButton = async ({ button, deskName, page }) => {
  await page.locator("fieldset", { hasText: deskName }).getByRole("button").click();
  await page.getByRole("button", { name: button }).click();
};

const fillDeskForm = async ({
  dayPasses,
  description,
  name,
  page,
  seatPriceInCredits,
  seatingCapacity,
  seatPriceInMoney,
  type,
  parkingSpaceQuantity,
  parkingSpaceInCredits,
  parkingSpaceInMoney,
  visibility,
}) => {
  const dialog = page.locator("dialog");

  if (type) {
    await dialog.locator("fieldset", { hasText: "Type" }).locator("select").selectOption(type);
  }
  if (name) {
    await dialog.locator("fieldset", { hasText: "Name" }).locator("input").fill(name);
  }
  if (description) {
    await dialog.locator("fieldset", { hasText: "Description" }).locator("textarea").fill(description);
  }
  if (seatingCapacity) {
    await dialog.locator("fieldset", { hasText: "Seating Capacity" }).locator("input").fill(seatingCapacity);
  }
  if (seatPriceInCredits) {
    const switchOn = dialog.locator("fieldset", { hasText: "Credits" }).getByRole("switch").getAttribute("aria-checked");
    if (switchOn === false) {
      await dialog.locator("fieldset", { hasText: "Credits" }).getByRole("switch").click();
    }
    await dialog.locator("fieldset", { hasText: "Seat Price, ☆/day" }).locator("input").fill(seatPriceInCredits);
  }

  if (seatPriceInMoney) {
    const switchOn = dialog.locator("fieldset", { hasText: "Money" }).getByRole("switch").getAttribute("aria-checked");
    if (switchOn === false) {
      await dialog.locator("fieldset", { hasText: "Money" }).getByRole("switch").click();
    }
    await dialog.locator("fieldset", { hasText: "Seat Price, ₩/day" }).locator("input").fill(seatPriceInMoney);
  }
  if (dayPasses === false) {
    const switchOn = dialog.locator("fieldset", { hasText: "Day Passes" }).getByRole("switch").getAttribute("aria-checked");
    if (switchOn === true) await dialog.locator("fieldset", { hasText: "Day Passes" }).getByRole("switch").click();
  }
  if (visibility) {
    await dialog.locator("fieldset", { hasText: "Visibility" }).locator("select").selectOption(visibility);
  }
  if (parkingSpaceQuantity) {
    await dialog.locator("fieldset", { hasText: "Seat Price, ₩/day" }).locator("input").fill(parkingSpaceQuantity);
  }
  if (parkingSpaceInCredits) {
    const switchOn = dialog.locator("fieldset", { hasText: "Credits" }).getByRole("switch").getAttribute("aria-checked");
    if (switchOn === false) {
      dialog.locator("fieldset", { hasText: "Credits" }).getByRole("switch").click();
    }
    await dialog.locator("fieldset", { hasText: "Parking Space Price, ☆/day" }).locator("input").fill(parkingSpaceInCredits);
  }
  if (parkingSpaceInMoney) {
    const switchOn = dialog.locator("fieldset", { hasText: "Money" }).getByRole("switch").getAttribute("aria-checked");
    if (switchOn === false) {
      dialog.locator("fieldset", { hasText: "Money" }).getByRole("switch").click();
    }
    await dialog.locator("fieldset", { hasText: "Parking Space Price, ₩/day" }).locator("input").fill(parkingSpaceInMoney);
  }
};

test.use({ storageState: "session.json" });

test.describe("Functional overview test of the Desks Settings", () => {
  const desks = [
    {
      name: `Open space`,
      seatPriceInCredits: "15",
      seatPriceInMoney: "25",
      dayPasses: false,
    },

    {
      type: "Dedicated Desk",
      name: `Desk 2: ${new Date().toISOString()}`,
      description: faker.lorem.text(),
      seatingCapacity: "10",
      visibility: "Network Members",
    },
  ];

  const createdDeskName = desks[0].name;

  const updatedDesk = {
    name: `${createdDeskName}_updated`,
    seatPriceInCredits: "99",
    seatPriceInMoney: "100",
  };

  const updatedDeskName = updatedDesk.name;

  test.beforeEach(async ({ page }) => {
    await page.goto("https://startuphub.andcards.com/suite/organizations/ad70a36e-0b38-4ac8-aa50-e4db5bb4577e/settings");
    const deskSettings = await getDesksSettings({ page });
    await deskSettings.click();
    await expect(page.getByRole("heading", { hasText: "Desks" })).toBeVisible();
  });

  test("User must be able to create a new desk ", async ({ page }) => {
    const addDeskButton = page.getByRole("button", { name: "Add" });
    for (const desk of desks) {
      await addDeskButton.click();
      await expect(page.locator("dialog").getByRole("heading", { hasText: "New Desk" })).toBeVisible();
      await fillDeskForm({ page, ...desk });
      await page.getByRole("button", { name: "Create" }).click();
      await page.waitForResponse((request) => request.url().includes("api/desks/v1.1") && request.status() === 201);
      const newDesk = page.locator("fieldset", { hasText: desk.name });
      await expect(newDesk).toBeVisible();
      if (desk.seatPriceInMoney && desk.seatPriceInMoney) {
        await expect(newDesk).toContainText(`${desk.seatPriceInCredits} ☆ • ₩${desk.seatPriceInMoney}`);
      } else {
        await expect(newDesk).toContainText("1 ☆ • ₩10");
      }
    }
  });

  test("User must be able to edit the desk", async ({ page }) => {
    await getActionsButton({ page, deskName: createdDeskName, button: "Edit" });
    await expect(page.locator("dialog").getByRole("heading", { hasText: "Edit Desk" })).toBeVisible();
    await fillDeskForm({ page, ...updatedDesk });
    await page.getByRole("button", { name: "Save" }).click();
    await page.waitForResponse((request) => request.url().includes("api/desks/v1.1") && request.status() === 200);
    const deskToBeUpdated = page.locator("fieldset", { hasText: updatedDesk.name });
    await expect(deskToBeUpdated).toBeVisible();
    await expect(deskToBeUpdated).toContainText(`${updatedDesk.seatPriceInCredits} ☆ • ₩${updatedDesk.seatPriceInMoney}`);
  });

  test("Desk must be no longer available on the Desks page after changing desk type to Office/Parking Lot", async ({ page }) => {
    const deskTests = [
      { typeTo: "Office", slugTo: "offices", typeBack: "Hot Desk" },
      { typeTo: "Parking Lot", slugTo: "parking", typeBack: "Dedicated Desk" },
    ];
    for (const deskTest of deskTests) {
      await getActionsButton({ page, deskName: updatedDeskName, button: "Edit" });
      await expect(page.locator("dialog").getByRole("heading", { hasText: "Edit Desk" })).toBeVisible();
      await fillDeskForm({ page, type: deskTest.typeTo });
      await page.getByRole("button", { name: "Save" }).click();
      await page.waitForResponse((request) => request.url().includes("api/desks/v1.1") && request.status() === 200);
      const desk = page.locator("fieldset", { hasText: updatedDeskName });
      await expect(desk).toBeHidden();
      const saveButton = page.getByRole("button", { name: "Save" });
      await page.goto(`https://startuphub.andcards.com/suite/organizations/ad70a36e-0b38-4ac8-aa50-e4db5bb4577e/settings/${slugTo}`);
      await expect(desk).toBeVisible();
      await getActionsButton({ page, deskName: updatedDeskName, button: "Edit" });
      await fillDeskForm({ page, type: deskTest.typeBack });
      await saveButton.click();
      await expect(desk).toBeHidden();
      await page.goto("https://startuphub.andcards.com/suite/organizations/ad70a36e-0b38-4ac8-aa50-e4db5bb4577e/settings/desks");
      await expect(desk).toBeVisible();
    }
  });
});
