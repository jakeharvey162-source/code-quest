import {test,expect} from "@playwright/test";
test("WinForms student uses Visual Studio F7 and Shift+F7 to navigate code and design",async({page})=>{
 await page.goto("/#designer");
 const designer=page.locator(".designer-page");
 await designer.getByRole("button",{name:"Code · F7"}).click();
 await expect(page.getByRole("button",{name:"Form1.cs",exact:true}).first()).toHaveAttribute("aria-pressed","true");
 await page.keyboard.press("Shift+F7");
 await expect(page.getByRole("button",{name:"Form1.cs [Design]"}).first()).toHaveAttribute("aria-pressed","true");
 await page.keyboard.press("F7");
 await expect(page.getByRole("button",{name:"Form1.cs",exact:true}).first()).toHaveAttribute("aria-pressed","true");
});
test("WinForms build check validates design but does not claim an actual Windows build",async({page})=>{
 await page.goto("/#designer");
 await page.getByRole("button",{name:"Check WinForms design"}).click();
 await expect(page.locator(".form-validation").last()).toContainText(/Design check|properties|issue/i);
 await page.getByRole("button",{name:"Check WinForms design"}).focus();
 await page.keyboard.press("Control+Shift+B");
 await expect(page.locator(".form-validation").last()).toContainText(/Visual Studio|issue/i);
});
test("keyboard shortcuts focus toolbox and properties while preserving form workflow",async({page})=>{
 await page.goto("/#designer");
 await page.getByRole("button",{name:"Check WinForms design"}).focus();
 await page.keyboard.press("Control+Alt+X");
 await expect(page.getByRole("textbox",{name:"Search toolbox"})).toBeFocused();
 await page.getByRole("textbox",{name:"Search toolbox"}).fill("Button");
 await page.getByRole("button",{name:"Button",exact:true}).first().click();
 await page.getByRole("button",{name:"Check WinForms design"}).focus();
 await page.keyboard.press("F4");
 await expect(page.getByRole("textbox",{name:"Control Name"})).toBeFocused();
});
