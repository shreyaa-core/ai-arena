import { expect, test } from "@playwright/test";

test.describe("AI Arena End-to-End Game Flow", () => {
  test("launches cinematic Title Screen, completes guest onboarding, opens World Map and Territory", async ({ page }) => {
    await page.goto("http://localhost:5173/");

    await expect(page.getByRole("heading", { name: "AI ARENA" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Play Game/i })).toBeVisible();

    await page.getByRole("button", { name: /Play Game/i }).click();
    await expect(page.getByText(/Create Your AI Arena Identity/i)).toBeVisible();

    await page.getByPlaceholder("Enter player alias…").fill("PlaywrightAce");
    await page.getByRole("button", { name: /Skip & Start Guest Play Immediately/i }).click();

    await expect(page.getByText(/PlaywrightAce/i)).toBeVisible();
    await expect(page.getByText(/AEI/i)).toBeVisible();
  });
});
