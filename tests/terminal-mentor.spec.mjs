import {test,expect} from "@playwright/test";
test("Tor offers offline mission hints in the Creator Terminal", async ({page}) => {
 await page.goto("/#terminal");
 const panel=page.locator(".cq-terminal-mentor");
 await expect(panel).toContainText("Make the heart dance");
 await panel.getByRole("button",{name:"Ask Tor for hint"}).click();
 await expect(panel).toContainText("fillStyle");
 await panel.getByRole("button",{name:"Next mission"}).click();
 await expect(panel).toContainText("Make the screen celebrate");
 await expect(panel).not.toContainText("Find fillStyle");
 await page.getByRole("combobox",{name:"Terminal programming language"}).selectOption("csharp");
 await expect(panel).toContainText("Message from the future");
 await panel.getByRole("button",{name:"Ask Tor for hint"}).click();
 await expect(panel).toContainText("Console.WriteLine");
});
