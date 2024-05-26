const { test, expect } = require("@playwright/test");
const { faker } = require("@faker-js/faker");
const path = require("path");

// functions
const getDesksSettings = async ({ page }) => {
  return page.locator("section").getByRole("link").filter({ hasText: "Desks" });
};

const getActionsButton = async ({ button, deskName, page }) => {
  await page.locator("fieldset", { hasText: deskName }).getByRole("button").click();
  await page.getByRole("button", { name: button }).click();
};

const getDeskRow = async ({ page, deskName }) => {
  return page.locator("fieldset").filter({ hasText: deskName });
};

const addDeskDialog = async ({ page }) => {
  const addDeskButton = page.getByRole("button", { name: "Add" });
  await addDeskButton.click();
  return page.locator("dialog", { hasText: "New Desk" });
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
  if (name != undefined) {
    await dialog.locator("fieldset", { hasText: "Name" }).locator("input").fill(name);
  }
  if (description) {
    await dialog.locator("fieldset", { hasText: "Description" }).locator("textarea").fill(description);
  }
  if (seatingCapacity != undefined) {
    await dialog.locator("fieldset", { hasText: "Seating Capacity" }).locator("input").fill(seatingCapacity);
  }
  if (seatPriceInCredits != undefined) {
    const switchOn = dialog.locator("fieldset", { hasText: "Credits" }).getByRole("switch").getAttribute("aria-checked");
    if (switchOn === false) {
      await dialog.locator("fieldset", { hasText: "Credits" }).getByRole("switch").click();
    }
    await dialog.locator("fieldset", { hasText: "Seat Price, ☆/day" }).locator("input").fill(seatPriceInCredits);
  }

  if (seatPriceInMoney != undefined) {
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
    for (const desk of desks) {
      const newDeskDialog = await addDeskDialog({ page });
      await fillDeskForm({ page, ...desk });
      await newDeskDialog.getByRole("button", { name: "Create" }).click();
      await page.waitForResponse((request) => request.url().includes("api/desks/v1.1") && request.status() === 201);
      const newDesk = await getDeskRow({ page, deskName: desk.name });
      await expect(newDesk).toBeVisible();
      if (desk.seatPriceInMoney && desk.seatPriceInMoney) {
        await expect(newDesk).toContainText(`${desk.seatPriceInCredits} ☆ • ₩${desk.seatPriceInMoney}`);
      } else {
        await expect(newDesk).toContainText("1 ☆ • ₩10");
      }
    }
  });

  test("User must NOT be able to create new a desk without filling up required field", async ({ page }) => {
    const desks = [
      {
        name: "",
        seatingCapacity: "9",
        seatPriceInCredits: "10",
        seatPriceInMoney: "11",
      },
      {
        name: "Office desk",
        seatingCapacity: "",
        seatPriceInCredits: "99",
        seatPriceInMoney: "100",
      },
      {
        name: "Office desk",
        seatingCapacity: "14",
        seatPriceInCredits: "",
        seatPriceInMoney: "15",
      },
      {
        name: "Office desk",
        seatingCapacity: "40",
        seatPriceInCredits: "24",
        seatPriceInMoney: "",
      },
    ];

    const newDeskDialog = await addDeskDialog({ page });
    const createDeskButton = newDeskDialog.getByRole("button", { name: "Create" });
    for (const desk of desks) {
      await fillDeskForm({ page, ...desk });
      await expect(createDeskButton).toHaveAttribute("area-disabled", "true");
    }
  });

  test("User must be able to edit the desk", async ({ page }) => {
    await getActionsButton({ page, deskName: createdDeskName, button: "Edit" });
    await fillDeskForm({ page, ...updatedDesk });
    await page.getByRole("button", { name: "Save" }).click();
    await page.waitForResponse((request) => request.url().includes("api/desks/v1.1") && request.status() === 200);
    const deskToBeUpdated = await getDeskRow({ page, deskName: updatedDesk.name });
    await expect(deskToBeUpdated).toBeVisible();
    await expect(deskToBeUpdated).toContainText(`${updatedDesk.seatPriceInCredits} ☆ • ₩${updatedDesk.seatPriceInMoney}`);
  });

  test("User is able to Add/Delete image from desk", async ({ page }) => {
    await getActionsButton({ page, deskName: updatedDeskName, button: "Edit" });
    const childRange = page.locator('[type="range"]');
    await page.locator('[type="file"]').setInputFiles(path.join(__dirname, "Ralph.png"));
    await page.locator("dialog", { has: childRange }).getByRole("button", { name: "Save" }).click();
    const deletePhotoButton = page.locator("dialog").getByRole("button", { name: "Delete Photo" });
    await expect(deletePhotoButton).toBeVisible();
    await page.getByRole("button", { name: "Save" }).click();
    await page.waitForResponse((request) => request.url().includes("api/desks/v1.1") && request.status() === 200);
    await getActionsButton({ page, deskName: updatedDeskName, button: "Edit" });
    await deletePhotoButton.click();
    await expect(deletePhotoButton).toBeHidden();
    await page.getByRole("button", { name: "Save" }).click();
    await page.waitForResponse((request) => request.url().includes("api/desks/v1.1") && request.status() === 200);
  });

  test("Desk must be no longer be available on the Desks page after changing desk type to Office/Parking Lot", async ({ page }) => {
    const deskTests = [
      { typeTo: "Office", slugTo: "offices", typeBack: "Hot Desk" },
      { typeTo: "Parking Lot", slugTo: "parking", typeBack: "Dedicated Desk" },
    ];
    for (const deskTest of deskTests) {
      await getActionsButton({ page, deskName: updatedDeskName, button: "Edit" });
      await fillDeskForm({ page, type: deskTest.typeTo });
      await page.getByRole("button", { name: "Save" }).click();
      await page.waitForResponse((request) => request.url().includes("api/desks/v1.1") && request.status() === 200);
      const desk = await getDeskRow({ page, deskName: updatedDeskName });
      await expect(desk).toBeHidden();
      const saveButton = page.getByRole("button", { name: "Save" });
      await page.goto(
        `https://startuphub.andcards.com/suite/organizations/ad70a36e-0b38-4ac8-aa50-e4db5bb4577e/settings/${deskTest.slugTo}`
      );
      await expect(desk).toBeVisible();
      await getActionsButton({ page, deskName: updatedDeskName, button: "Edit" });
      await fillDeskForm({ page, type: deskTest.typeBack });
      await saveButton.click();
      await expect(desk).toBeHidden();
      await page.goto("https://startuphub.andcards.com/suite/organizations/ad70a36e-0b38-4ac8-aa50-e4db5bb4577e/settings/desks");
      await expect(desk).toBeVisible();
    }
  });

  test("User must be able to delete the desk", async ({ page }) => {
    await getActionsButton({ page, deskName: updatedDeskName, button: "Delete" });
    const deletionConfirmationDialog = page.locator("dialog", { hasText: "Delete Desk" });
    await deletionConfirmationDialog.getByRole("button", { name: "Cancel" }).click();
    const desk = await getDeskRow({ page, deskName: updatedDeskName });
    await expect(desk).toBeVisible();
    await getActionsButton({ page, deskName: updatedDeskName, button: "Delete" });
    await deletionConfirmationDialog.getByRole("button", { name: "OK" }).click();
    await page.waitForResponse((request) => request.url().includes("api/desks/v1.1") && request.status() === 204);
    await expect(desk).toBeHidden();
  });

  test("User must be able to see/NOT to see Day Passes payment option if Day Passes toggle is on/off", async ({ page }) => {
    const dayPassesSwitch = page.locator("fieldset", { hasText: "Day Passes" }).getByRole("switch");
    const isDayPassesSwitchEnabled = await dayPassesSwitch.getAttribute("aria-checked");
    console.log(isDayPassesSwitchEnabled);
    const dayPassesOption = page.locator("dialog", { hasText: "New Desk" }).locator("fieldset", { hasText: "Day Passes" });
    if (isDayPassesSwitchEnabled === "false") {
      await dayPassesSwitch.click();
    }
    await expect(dayPassesSwitch).toHaveAttribute("aria-checked", "true");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(dayPassesOption).toBeVisible();
    await page.goBack();
    await dayPassesSwitch.click();
    await expect(dayPassesSwitch).toHaveAttribute("aria-checked", "false");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(dayPassesOption).toBeHidden();
    await page.goBack();
    await dayPassesSwitch.click();
    await expect(dayPassesSwitch).toHaveAttribute("aria-checked", "true");
  });

  test("User must be able to enable/disable desks", async ({ page }) => {
    const desksSwitch = page.locator("section", { has: page.getByText("Desks", { exact: true }) }).getByRole("switch");
    const desksSwitchEnabled = await desksSwitch.getAttribute("aria-checked");
    const desksItemInMenu = page.getByRole("navigation").getByRole("link", { name: "Desks" });
    const addDeskButton = page.getByRole("button", { name: "Add" });
    if (desksSwitchEnabled === "false") {
      await desksSwitch.click();
    }
    await expect(desksItemInMenu).toBeVisible();
    await expect(addDeskButton).toBeVisible();
    await desksSwitch.click();
    await expect(desksItemInMenu).toBeHidden();
    await expect(addDeskButton).toBeHidden();
    await desksSwitch.click();
  });
});
