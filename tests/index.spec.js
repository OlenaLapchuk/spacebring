// @ts-check
const { test, expect } = require("@playwright/test");
const { url } = require("inspector");
const { faker } = require("@faker-js/faker");
const { get } = require("https");
// Functions

const getRoomSetting = async ({ page }) => {
  return page.locator("section").getByRole("link").filter({ hasText: "Rooms" });
};

test.use({ storageState: "session.json" });

test("Verify that user can navigate to Settings page from the Locations page", async ({
  page,
}) => {
  await page.goto("https://startuphub.andcards.com/suite/organizations");
  await page
    .locator(
      '[href="/suite/organizations/ad70a36e-0b38-4ac8-aa50-e4db5bb4577e/settings"]'
    )
    .click();
  expect(page).toHaveURL(/\/settings/);
  await page.getByRole("heading", { name: "Settings" }).isVisible();
});

test.describe("Functional overview test for Rooms page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(
      "https://startuphub.andcards.com/suite/organizations/ad70a36e-0b38-4ac8-aa50-e4db5bb4577e/settings/rooms"
    );
  });
  test("Verify switch button for rooms", async ({ page }) => {
    await page.getByRole("heading", { name: "Rooms" }).isVisible();
    //expect(page).toHaveURL(/\/general/)
    const switchButton = page
      .locator("div")
      .filter({ hasText: "Rooms" })
      .getByRole("switch");
    await switchButton.click();
    const navigationBar = page.getByRole("navigation");
    await expect(
      navigationBar.getByRole("link", { name: "Rooms" })
    ).toBeHidden();
    await expect(switchButton).toHaveAttribute("aria-checked", "false");
    await switchButton.click();
    await expect(
      navigationBar.getByRole("link", { name: "Rooms" })
    ).toBeVisible();
    await expect(switchButton).toHaveAttribute("aria-checked", "true");
  });

  test("Verify that Book Ahead field value can be changed", async ({
    page,
  }) => {
    await page.getByRole("heading", { name: "Rooms" }).isVisible();
    const bookAheadField = page
      .locator("fieldset", { hasText: "Book Ahead" })
      .locator("select");
    await bookAheadField.selectOption("2 weeks");
    await expect(bookAheadField).toHaveValue("BOOKING_PERIOD_TWO_WEEKS");
  });

  test("Verify that Book for Free field value can be changed", async ({
    page,
  }) => {
    await page.getByRole("heading", { name: "Rooms" }).isVisible();
    const bookForFeeField = page
      .locator("fieldset", { hasText: "Book for Free" })
      .locator("select");
    await bookForFeeField.selectOption("One Active");
    await expect(bookForFeeField).toHaveValue(
      "ORGANIZATION_ROOM_BOOK_FOR_FREE_ONE_ACTIVE"
    );
  });

  test("Verify Add button availability", async ({ page }) => {
    await page.getByRole("heading", { name: "Rooms" }).isVisible();
    const addRoomButton = page.getByRole("button", { name: "Add" });
    await expect(addRoomButton).toBeVisible();
  });

  test("Verify that Add button opens Add Room modal", async ({ page }) => {
    await page.getByRole("heading", { name: "Rooms" }).isVisible();
    const addRoomButton = page.getByRole("button", { name: "Add" });

    await addRoomButton.click();
    await expect(
      page.getByRole("heading").filter({ hasText: "New Room" })
    ).toBeVisible();
  });
});

test.describe("Adding new room page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(
      "https://startuphub.andcards.com/suite/organizations/ad70a36e-0b38-4ac8-aa50-e4db5bb4577e/settings/rooms"
    );
  });

  test("Verify adding a new room - happy path", async ({ page }) => {
    await page.getByRole("heading", { name: "Settings" }).isVisible();
    const addRoomButton = page.getByRole("button", { name: "Add" });
    const createButton = page.getByRole("button", { name: "Create" });
    const nameField = page.getByPlaceholder("Phone Booth");
    const roomsSection = page.locator("section", { hasText: "Rooms" });

    await expect(page.getByRole("heading")).toHaveText("Rooms");
    await addRoomButton.click();
    await expect(
      page.getByRole("heading").filter({ hasText: "New Room" })
    ).toBeVisible();
    await expect(createButton).toHaveAttribute("area-disabled", "true");
    await nameField.fill("Co-room");
    await expect(nameField).toHaveValue("Co-room");
    await createButton.click();

    await page.waitForResponse(
      (request) =>
        request.url().includes("/api/rooms/v1.0") && request.status() === 201
    );
    expect(
      await roomsSection.locator("fieldset", { hasText: "Co-room" }).isVisible()
    ).toBeTruthy();
  });

  test("Verify 'Min time cannot be smaller than availability increment'validation message", async ({
    page,
  }) => {
    await page.getByRole("heading", { name: "Settings" }).isVisible();
    const addRoomButton = page.getByRole("button", { name: "Add" });
    await addRoomButton.click();
    await expect(
      page.getByRole("heading").filter({ hasText: "New Room" })
    ).toBeVisible();
    const availabilityIncrement = page
      .locator("fieldset", { hasText: "Availability Increment" })
      .locator("select");
    const minTimeField = page
      .locator("fieldset", { hasText: "Min Time" })
      .locator("select");
    const validationMessage =
      "Min time cannot be smaller than availability increment.";
    await availabilityIncrement.selectOption("5 minutes");
    await minTimeField.selectOption("5 minutes");
    expect(
      await page.locator("section", { hasText: validationMessage }).isHidden()
    ).toBeTruthy();
    await availabilityIncrement.selectOption("10 minutes");
    expect(
      await page.locator("section", { hasText: validationMessage }).isVisible()
    ).toBeTruthy();
    await minTimeField.selectOption("10 minutes");
    expect(
      await page.locator("section", { hasText: validationMessage }).isHidden()
    ).toBeTruthy();
    await availabilityIncrement.selectOption("15 minutes");
    expect(
      await page.locator("section", { hasText: validationMessage }).isVisible()
    ).toBeTruthy();
    await minTimeField.selectOption("15 minutes");
    expect(
      await page.locator("section", { hasText: validationMessage }).isHidden()
    ).toBeTruthy();
    await availabilityIncrement.selectOption("30 minutes");
    expect(
      await page.locator("section", { hasText: validationMessage }).isVisible()
    ).toBeTruthy();
    await minTimeField.selectOption("30 minutes");
    expect(
      await page.locator("section", { hasText: validationMessage }).isHidden()
    ).toBeTruthy();
  });

  test('Verify "ABANDONED BOOKING PROTECTION" section availability', async ({
    page,
  }) => {
    await page.getByRole("heading", { name: "Settings" }).isVisible();
    const addRoomButton = page.getByRole("button", { name: "Add" });
    await addRoomButton.click();
    await expect(
      page.getByRole("heading").filter({ hasText: "New Room" })
    ).toBeVisible();

    const creditsSwitch = page
      .locator("fieldset", { hasText: "Credits" })
      .getByRole("switch");
    const moneySwitch = page
      .locator("fieldset", { hasText: "Money" })
      .getByRole("switch");
  });

  test('Verify "New Room" modal window closing', async ({ page }) => {
    await page.getByRole("heading", { name: "Rooms" }).isVisible();
    const addRoomButton = page.getByRole("button", { name: "Add" });
    const closeButton = page.getByRole("button", { name: "Close" });

    await addRoomButton.click();
    await closeButton.click();
    await expect(page.getByRole("dialog", { name: "New Room" })).toBeHidden();
  });
});






/*

  test("Verify that room can be deleted", async ({ page }) => {
    const roomsButton = await getRoomSetting({ page });
    const createdRoom = page
      .locator("section", { hasText: "Rooms" })
      .locator("fieldset", { hasText: "Co-room" });
    page.getByRole("button", { name: "Delete" }).click();
    const deletionConfirmationDialog = page.locator("dialog");
    await roomsButton.click();
    await createdRoom.getByRole("button").click();
    await expect(deletionConfirmationDialog).toBeVisible();
    await deletionConfirmationDialog
      .getByRole("button", { name: "Ok" })
      .click();
    await createdRoom.isHidden();
  });

  test("Verify that room can be edited", async ({ page }) => {
    const roomButton = await getRoomSetting({ page });
    await roomButton.click();

    const createdRoom = page
      .locator("section")
      .locator("fieldset", { hasText: "Co-room" });
    const updatedRoom = page
      .locator("section", { hasText: "Rooms" })
      .locator("fieldset", { hasText: "Co-room_updated" });
    await createdRoom.getByRole("button").click();
    await page.getByRole("button", { name: "edit" }).click();

    await expect(page.locator("dialog")).toBeVisible();
    await expect(page.locator("dialog").getByRole("heading")).toHaveText(
      "Edit Room"
    );

    const nameField = page
      .locator("fieldset", { hasText: "Name" })
      .getByRole("textbox");
    const seatingCapacityField = page
      .locator("fieldset", { hasText: "Seating Capacity" })
      .getByRole("spinbutton");
    const descriptionField = page
      .locator("fieldset", { hasText: "Description" })
      .getByRole("textbox");
    const descriptionValue = faker.lorem.text();
    const availabilityIncrement = page
      .locator("fieldset", { hasText: "Availability Increment" })
      .locator("select");
    const minTimeField = page
      .locator("fieldset", { hasText: "Min Time" })
      .locator("select");
    const maxTimeField = page
      .locator("fieldset", { hasText: "Max Time" })
      .locator("select");
    const preparationTime = page
      .locator("fieldset", { hasText: "Preparation Time" })
      .locator("select");
    const creditsSwitch = page
      .locator("fieldset", { hasText: "Credits" })
      .getByRole("switch");
    /*const priceStars = page
      .locator("fieldset", { hasText: "Price, ☆" })
      .getByRole("spinbutton");
    const pricehour = page
      .locator("fieldset", { hasText: "Price, ₩/hr" })
      .getByRole("spinbutton");

    await nameField.fill("Co-room_updated");
    await seatingCapacityField.fill("25");
    await descriptionField.fill(descriptionValue);
    await availabilityIncrement.selectOption("5 minutes");
    await minTimeField.selectOption("10 minutes");
    await maxTimeField.selectOption("6 hours");
    await preparationTime.selectOption("None");
    await creditsSwitch.click();
    await priceStars.fill("20");
    await pricehour.fill("30");

    expect(await nameField.inputValue()).toEqual("Co-room_updated");
    expect(await seatingCapacityField.inputValue()).toEqual("25");
    expect(await descriptionField.inputValue()).toEqual(descriptionValue);

    // expect(await availabilityIncrement.textContent()).toEqual("5 minutes");
    //expect(await minTimeField.textContent()).toEqual("10 minutes");
    // expect(await maxTimeField.textContent()).toEqual("6 hours");
    // expect(await preparationTime.textContent()).toEqual("none");
    // expect(await preparationTime.textContent()).toEqual("none");
    // await expect(creditsSwitch).toHaveAttribute("aria-checked", "false");
    expect(await priceStars.inputValue()).toEqual("20");
    expect(await pricehour.inputValue()).toEqual("30");
    await page.getByRole("button", { name: "Save" }).click();

    await page.waitForResponse(
      (request) =>
        request.url().includes("/api/rooms/v1.0") && request.status() === 200
    );

    expect(await updatedRoom.isVisible()).toBeTruthy();
  });

/*
  test("Verify adding new rooms - Happy path", async ({ page }) => {
    const roomSettings = await getRoomSetting({ page });
    const addRoomButton = page.getByRole("button", { name: "Add" });
    const createButton = page.getByRole("button", { name: "Create" });
    const nameField = page.locator('div', { hasText: 'Name'}).getByRole('textbox')

    await roomSettings.click();
    await addRoomButton.click();
    await expect(createButton).toBeVisible();
    await expect(createButton).toHaveAttribute("area-disabled", "true");
    expect(
      await page.getByRole("heading", { name: "New Room" }).isVisible()
    ).toBeTruthy();
    await nameField.fill("LLALLAL");
  });


test.describe("General settings verification", () => {
  test.beforeEach(async ({ page }) => {

    await page
      .locator(
        '[href="/suite/organizations/ad70a36e-0b38-4ac8-aa50-e4db5bb4577e/settings"]'
      )
      .click();
    //expect(page).toHaveURL(/\/settings/);
    await page.getByRole("heading", { name: "Settings" }).isVisible();

    await page.getByText("General").click();
    await page.getByRole("heading", { name: "General" }).isVisible();
    //expect(page).toHaveURL(/\/general/)
  });
  test("Verify that each language can be selected", async ({ page }) => {
    const languageDropdown = page.locator("select", { hasText: "English" });
    await languageDropdown.click();

    const options = languageDropdown.locator("option");
    console.log(await options.allTextContents());

    for (const option of await options.all()) {
      const selectedOption = await option.innerText();
      await option.click();

      await expect(
        page.locator("select", { hasText: selectedOption })
      ).toBeVisible();
    }
  });
});
*/
