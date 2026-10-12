import {test,expect} from "@playwright/test";
test("Tor's fun shortcuts offer varied teaching and French practice",async({page})=>{
 await page.goto("/#terminal");
 await page.getByRole("button",{name:"Open Tor tutor"}).click();
 const tutor=page.getByRole("complementary",{name:"Tor hologram tutor"});
 await tutor.getByLabel("Speak replies automatically").uncheck();
 await tutor.getByRole("button",{name:"Roast my code"}).click();
 await expect(tutor.locator(".tor-reply")).toContainText(/debug|error|compiler|first/i);
 const first=await tutor.locator(".tor-reply").innerText();
 await tutor.getByRole("button",{name:"Roast my code"}).click();
 await expect.poll(()=>tutor.locator(".tor-reply").innerText()).not.toBe(first);
 await tutor.getByRole("combobox",{name:"Tor teaching language"}).selectOption("fr-FR");
 await tutor.getByRole("button",{name:"Give me a challenge"}).click();
 await expect(tutor.locator(".tor-reply")).toContainText("Défi");
});
