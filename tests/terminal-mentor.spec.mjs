import {test,expect} from "@playwright/test";
test("students see actionable Tor quests, hints, and TypeScript challenges",async({page})=>{
 await page.goto("/#terminal");
 const panel=page.getByRole("region",{name:"Tor coding side quest"});
 await expect(panel).toContainText("Make the heart dance");
 await panel.getByRole("button",{name:"Ask Tor for hint"}).click();
 await expect(panel).toContainText("fillStyle");
 await panel.getByRole("button",{name:"Next mission"}).click();
 await expect(panel).toContainText("Make the screen celebrate");
 await expect(panel).not.toContainText("Find fillStyle");
 await page.getByRole("combobox",{name:"Terminal programming language"}).selectOption("typescript");
 await expect(panel).toContainText("Typed birthday hero");
 await panel.getByRole("button",{name:"Ask Tor for hint"}).click();
 await expect(panel).toContainText("ctx.fillText");
});
test("side quests remain accessible on a 390px phone",async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto("/#terminal");
 await expect(page.getByRole("region",{name:"Tor coding side quest"})).toBeVisible();
 await page.getByRole("button",{name:"Ask Tor for hint"}).click();
 await expect(page.getByRole("region",{name:"Tor coding side quest"})).toContainText("Hint:");
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
 expect(overflow).toBe(false);
});
