import {test,expect} from "@playwright/test";
test("a student sees JavaScript printed output in the large visible result panel",async({page})=>{
 await page.goto("/#terminal");
 await page.getByRole("textbox",{name:"Terminal code editor"}).fill("const total = 2 + 3; console.log('Your answer:', total);");
 await page.getByRole("button",{name:"Run terminal code"}).click();
 const output=page.getByRole("region",{name:"Visible program output"});
 await expect(output).toBeVisible();
 await expect(output).toContainText("Your answer: 5");
 await expect(page.getByRole("log",{name:"Terminal console output"})).toContainText("Your answer: 5");
 await page.getByRole("button",{name:"Run terminal code"}).click();
 await expect(output).toContainText("Your answer: 5");
});
test("a JavaScript program without console output gets a truthful hint, not a fake result",async({page})=>{
 await page.goto("/#terminal");
 await page.getByRole("textbox",{name:"Terminal code editor"}).fill("let answer=42;");
 await page.getByRole("button",{name:"Run terminal code"}).click();
 await expect(page.getByRole("region",{name:"Visible program output"})).toContainText("program ran without printed output");
 await expect(page.getByRole("region",{name:"Visible program output"})).toContainText("console.log");
});
test("a Python program pasted into JavaScript does not silently appear blank",async({page})=>{
 await page.goto("/#terminal");
 await page.getByRole("textbox",{name:"Terminal code editor"}).fill('print("Happy Birthday")');
 await page.getByRole("button",{name:"Run terminal code"}).click();
 const warning=page.getByRole("alert");
 await expect(warning).toContainText("looks like Python");
 await warning.getByRole("button",{name:"Switch to Python preserving code"}).click();
 await expect(page.getByRole("combobox",{name:"Terminal programming language"})).toHaveValue("python");
 await expect(page.getByRole("textbox",{name:"Terminal code editor"})).toHaveValue('print("Happy Birthday")');
 await page.getByRole("button",{name:"Run terminal code"}).click();
 await expect(page.getByRole("region",{name:"Visible program output"})).toContainText("Happy Birthday",{timeout:70000});
});
test("real JavaScript Canvas drawing keeps the visual preview instead of covering it with stdout",async({page})=>{
 await page.goto("/#terminal");
 await page.getByRole("textbox",{name:"Terminal code editor"}).fill('const ctx=document.querySelector("#art").getContext("2d");ctx.fillStyle="red";ctx.fillRect(0,0,100,100);');
 await page.getByRole("button",{name:"Run terminal code"}).click();
 const frame=page.frameLocator('iframe[title="Isolated program preview"]');
 await expect(frame.locator("canvas#art")).toBeVisible();
 await expect(page.getByRole("region",{name:"Visible program output"})).toHaveCount(0);
 const pixel=await frame.locator("canvas").evaluate(c=>[...c.getContext("2d").getImageData(20,20,1,1).data]);
 expect(pixel[0]).toBe(255);
});
test("C# text programs show their real compiler stdout prominently",async({page})=>{
 test.setTimeout(120000);
 await page.goto("/#terminal");
 await page.getByRole("combobox",{name:"Terminal programming language"}).selectOption("csharp");
 await page.getByRole("combobox",{name:"Terminal example"}).selectOption("hello");
 await page.getByRole("button",{name:"Run terminal code"}).click();
 await expect(page.getByLabel("C# visible result")).toContainText("Hello CodeQuest!",{timeout:90000});
});
test("phone shows readable result and preserves run/edit loop",async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto("/#terminal");
 await page.getByRole("textbox",{name:"Terminal code editor"}).fill('console.log("Phone test passed")');
 await page.getByRole("button",{name:"Run terminal code"}).click();
 await expect(page.getByRole("region",{name:"Visible program output"})).toContainText("Phone test passed");
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2)).toBe(false);
});
