const { test, expect } = require("@playwright/test");
const { faker } = require("@faker-js/faker");

// functions
const getRoomsSettings = async ({ page }) => {
  return page.locator("section").getByRole("link").filter({ hasText: "Rooms" });
};

const getRoomByName = async ({ name, page }) => {
  return page.locator("fieldset", { hasText: name });
};

const getDeletionConfirmationDialog = async ({ name, page }) => {
  const deletionConfirmationDialog = page.locator("dialog", { hasText: "Delete Room" });
  const createdRoom = await getRoomByName({ name, page });
  await createdRoom.getByRole("button").click();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(deletionConfirmationDialog).toBeVisible();
  return deletionConfirmationDialog;
};

const fillFormRoom = async ({
  abandonedThreshold,
  availabilityIncrement,
  creditPrice,
  description,
  earlyCheckIn,
  maxTime,
  minTime,
  moneyPrice,
  name,
  page,
  preparationTime,
  reschedulingPolicy,
  seatingCapacity,
  visibility,
}) => {
  const dialog = page.locator("dialog");
  await dialog.locator("fieldset", { hasText: "Name" }).locator("input").fill(name);

  if (seatingCapacity) {
    await dialog.locator("fieldset", { hasText: "Seating Capacity" }).locator("input").fill(seatingCapacity);
  }

  if (description) {
    await dialog.locator("fieldset", { hasText: "Description" }).locator("textarea").fill(description);
  }

  if (availabilityIncrement) {
    await dialog.locator("fieldset", { hasText: "Availability Increment" }).locator("select").selectOption(availabilityIncrement);
  }
  if (minTime) {
    await dialog.locator("fieldset", { hasText: "Min Time" }).locator("select").selectOption(minTime);
  }
  if (maxTime) {
    await dialog.locator("fieldset", { hasText: "Max Time" }).locator("select").selectOption(maxTime);
  }

  if (maxTime) {
    await dialog.locator("fieldset", { hasText: "Max Time" }).locator("select").selectOption(maxTime);
  }

  if (preparationTime) {
    await dialog.locator("fieldset", { hasText: "Preparation Time" }).locator("select").selectOption(preparationTime);
  }

  if (creditPrice != undefined) {
    if ((await dialog.locator("fieldset", { hasText: "Credits" }).getByRole("switch").getAttribute("aria-checked")) === "false") {
      await dialog.locator("fieldset", { hasText: "Credits" }).getByRole("switch").click();
    }
    await dialog.locator("fieldset", { hasText: "Price, ☆/hr" }).locator("input").fill(creditPrice);
  }

  if (moneyPrice != undefined) {
    const switchOn = await dialog.locator("fieldset", { hasText: "Money" }).getByRole("switch").getAttribute("aria-checked");
    if (switchOn === "false") {
      await dialog.locator("fieldset", { hasText: "Money" }).getByRole("switch").click();
    }
    await dialog.locator("fieldset", { hasText: "Price, ₩/hr" }).locator("input").fill(moneyPrice);
  }

  if (reschedulingPolicy) {
    await dialog.locator("fieldset", { hasText: "Rescheduling Policy" }).locator("select").selectOption(reschedulingPolicy);
  }

  if (visibility) {
    await dialog.locator("fieldset", { hasText: "Visibility" }).locator("select").selectOption(visibility);
  }
  if (abandonedThreshold && earlyCheckIn) {
    const creditsOn = await dialog.locator("fieldset", { hasText: "Credits" }).getByRole("switch").getAttribute("aria-checked");
    const moneyOn = await dialog.locator("fieldset", { hasText: "Money" }).getByRole("switch").getAttribute("aria-checked");
    if (creditsOn === "true") {
      await dialog.locator("fieldset", { hasText: "Credits" }).getByRole("switch").click();
    }
    if (moneyOn === "true") {
      await dialog.locator("fieldset", { hasText: "Money" }).getByRole("switch").click();
    }
    const checkIn = await dialog.locator("fieldset", { hasText: "Check In" }).getByRole("switch").getAttribute("aria-checked");
    if (checkIn === "false") {
      await dialog.locator("fieldset", { hasText: "Check In" }).getByRole("switch").click();
    }
    await dialog.locator("fieldset", { hasText: "Abandoned Threshold" }).locator("select").selectOption(abandonedThreshold);
    await dialog.locator("fieldset", { hasText: "Early Check In" }).locator("select").selectOption(earlyCheckIn);
  }
};

test.use({ storageState: "session.json" });

test.describe("Functional overview of the Rooms page", () => {
  const rooms = [
    {
      name: `Room 1: Wellness room`,
    },
    {
      name: `Room 2: ${new Date().toISOString()} `,
      abandonedThreshold: "10 minutes",
      earlyCheckIn: "10 minutes",
    },
    {
      name: `Room 3: ${new Date().toISOString()}`,
      description: faker.lorem.text(),
      seatingCapacity: "10",
      availabilityIncrement: "30 minutes",
      maxTime: "5 hours",
      minTime: "2 hours",
      preparationTime: "5 minutes",
      creditPrice: "69",
      moneyPrice: "79",
      reschedulingPolicy: "30 minutes",
      visibility: "Network Members",
    },
  ];

  const firstRoomName = rooms[0].name;

  test.beforeEach(async ({ page }) => {
    await page.goto("https://startuphub.andcards.com/suite/organizations/ad70a36e-0b38-4ac8-aa50-e4db5bb4577e/settings");
    const roomsSettings = await getRoomsSettings({ page });
    await roomsSettings.click();
    await expect(page.getByRole("heading", { name: "Rooms" })).toBeVisible();
  });

  test("User must be able to create new room", async ({ page }) => {
    const addRoomButton = page.getByRole("button", { name: "Add" });
    for (const room of rooms) {
      await addRoomButton.click();
      expect(await page.locator("dialog").getByRole("heading").textContent()).toEqual("New Room");
      await fillFormRoom({ ...room, page });
      await page.getByRole("button", { name: "Create" }).click();
      await page.waitForResponse((request) => request.url().includes("/api/rooms/v1.0") && request.status() === 201);
      await expect(page.locator("fieldset", { hasText: room.name })).toBeVisible();
      const isPriceDisabled = room.earlyCheckIn && room.abandonedThreshold;
      if (isPriceDisabled) {
        await expect(page.locator("fieldset", { hasText: room.name })).toHaveText(room.name);
      } else if (room.creditPrice && room.moneyPrice) {
        await expect(page.locator("fieldset", { hasText: room.name })).toContainText(`${room.creditPrice} ☆ • ₩${room.moneyPrice} / hr`);
      } else if (room.creditPrice === undefined && room.moneyPrice === undefined) {
        await expect(page.locator("fieldset", { hasText: room.name })).toContainText("1 ☆ • ₩10 / hr");
      }
    }
  });

  test("User must NOT be able to create a new room when Min time cannot be smaller than availability increment", async ({ page }) => {
    const addRoomButton = page.getByRole("button", { name: "Add" });
    const validationMessage = "Min time cannot be smaller than availability increment";
    await addRoomButton.click();
    const dialog = page.locator("dialog");
    expect(await dialog.getByRole("heading").textContent()).toEqual("New Room");
    await fillFormRoom({ name: `Room 5: ${Date.now()}`, availabilityIncrement: "15 minutes", minTime: "10 minutes", page });
    await expect(dialog.getByRole("button", { name: "Create " })).toHaveAttribute("area-disabled", "true");
    await expect(dialog).toContainText(validationMessage);
  });

  test("User must NOT be able to create new a plan without filling up required field", async ({ page }) => {
    // review
    const addRoomButton = page.getByRole("button", { name: "Add" });
    await addRoomButton.click();
    const dialog = page.locator("dialog");
    const name = dialog.locator("fieldset", { hasText: "Name" }).locator("input");
    const creditPrice = dialog.locator("fieldset", { hasText: "Price, ☆/hr" }).locator("input");
    const moneyPrice = dialog.locator("fieldset", { hasText: "Price, ₩/hr" }).locator("input");
    const createButton = dialog.getByRole("button", { name: "Create" });
    await name.fill("");
    await expect(createButton).toHaveAttribute("area-disabled", "true");
    await name.fill("Wellness room");
    await expect(createButton).not.toHaveAttribute("area-disabled");
    if ((await creditPrice.inputValue()) !== "") {
      await creditPrice.fill("");
    }
    await expect(createButton).toHaveAttribute("area-disabled", "true");
    await creditPrice.fill("900");
    await expect(createButton).not.toHaveAttribute("area-disabled");
    if ((await moneyPrice.inputValue()) !== "") {
      await moneyPrice.fill("");
      await expect(createButton).toHaveAttribute("area-disabled", "true");
      await moneyPrice.fill("999");
      await expect(createButton).not.toHaveAttribute("area-disabled");
    }
  });

  test("User must be able to edit the room", async ({ page }) => {
    const updatedRoom = {
      name: "Updated Room 1: Wellness room",
      seatingCapacity: "10",
      description: `Updated description: ${faker.lorem.text()}`,
      availabilityIncrement: "5 minutes",
      minTime: "10 minutes",
      maxTime: "1 hour",
      preparationTime: "5 minutes",
      creditPrice: "11",
      moneyPrice: "12",
      reschedulingPolicy: "15 minutes",
      visibility: "Network Members",
    };
    const createdRoom = await getRoomByName({ page, name: firstRoomName });
    await createdRoom.getByRole("button").click();
    await page.getByRole("button", { name: "Edit" }).click();
    expect(await page.locator("dialog").getByRole("heading").textContent()).toEqual("Edit Room");
    await fillFormRoom({ ...updatedRoom, page });
    await page.locator("dialog").getByRole("button", { name: "Save" }).click();
    await page.waitForResponse((request) => request.url().includes("api/rooms/v1.0") && request.status() === 200);
    const updatedRoomName = await getRoomByName({ name: updatedRoom.name, page });
    await expect(updatedRoomName).toBeVisible();
    await expect(updatedRoomName).toContainText(`${updatedRoom.creditPrice} ☆ • ₩${updatedRoom.moneyPrice} / hr`);
  });

  test("User must be able to delete the room", async ({ page }) => {
    /// To improve
    let deletionConfirmationDialog = await getDeletionConfirmationDialog({ name: firstRoomName, page });
    await deletionConfirmationDialog.getByRole("button", { name: "Cancel" }).click();
    const createdRoom = await getRoomByName({ name: firstRoomName, page });
    await expect(createdRoom).toBeVisible();
    deletionConfirmationDialog = await getDeletionConfirmationDialog({ name: firstRoomName, page });
    await deletionConfirmationDialog.getByRole("button", { name: "OK" }).click();
    await page.waitForResponse((request) => request.url().includes("api/rooms/v1.0") && request.status() === 204);
    await expect(createdRoom).toBeHidden();
  });

  test("User must be able to enable/disable rooms", async ({ page }) => {
    const roomsSwitchState = await page.locator("section").filter({ hasText: "Rooms" }).getByRole("switch").getAttribute("aria-checked");
    if (roomsSwitchState === "true") {
      await expect(page.getByRole("navigation").getByRole("link", { name: "Rooms" })).toBeVisible();
      await page.locator("section").filter({ hasText: "Rooms" }).getByRole("switch").click();
      await expect(page.getByRole("navigation").getByRole("link", { name: "Rooms" })).toBeHidden();
      await page.locator("section").filter({ hasText: "Rooms" }).getByRole("switch").click();
    } else {
      await expect(page.getByRole("navigation").getByRole("link", { name: "Rooms" })).toBeHidden();
      await page.locator("section").filter({ hasText: "Rooms" }).getByRole("switch").click();
      await expect(page.getByRole("navigation").getByRole("link", { name: "Rooms" })).toBeVisible();
    }
  });

  test("User must be able to change room settings", async ({ page }) => {
   await page.locator("fieldset ", { hasText: "Book Ahead" }).locator('select').selectOption(['1 week', '6 months'])
   await page.locator("fieldset ", { hasText: "Book for Free" }).locator('select').selectOption('One Active')   // 
  });
});
