import {test,expect} from "@playwright/test";

test("student runs visual JavaScript heart, reads logs and stops the program",async({page})=>{
 await page.goto("/#terminal");
 await expect(page.getByRole("heading",{name:"Make code come alive."})).toBeVisible();
 await expect(page.getByRole("combobox",{name:"Terminal programming language"})).toHaveValue("javascript");
 await expect(page.getByRole("textbox",{name:"Terminal code editor"})).toHaveValue(/canvas/);
 await page.getByRole("button",{name:"Run terminal code"}).click();
 const frame=page.frameLocator('iframe[title="Isolated program preview"]');
 await expect(frame.locator("canvas#art")).toBeVisible();
 await expect(page.locator(".cq-terminal-status")).toContainText(/JavaScript loaded|Preview running|Preview active/);
 const img=await frame.locator("canvas").evaluate(canvas=>{
   const data=canvas.getContext("2d").getImageData(0,0,canvas.width,canvas.height).data;
   let n=0;
   for(let i=0;i<data.length;i+=40)if(data[i]>120&&data[i]>data[i+1]*1.2)n++;
   return n;
 });
 expect(img).toBeGreaterThan(20);
 await page.getByRole("button",{name:"Stop terminal code"}).click();
 await expect(page.locator('iframe[title="Isolated program preview"]')).toHaveCount(0);
 await page.getByRole("combobox",{name:"Terminal example"}).selectOption("console");
 await page.getByRole("button",{name:"Run terminal code"}).click();
 await expect(page.getByRole("log",{name:"Terminal console output"})).toContainText("2 + 2 = 4");
});
test("HTML birthday surprise opens without importing or installing packages",async({page})=>{
 await page.goto("/#terminal");
 await page.getByRole("combobox",{name:"Terminal programming language"}).selectOption("html");
 await page.getByRole("button",{name:"Run terminal code"}).click();
 const frame=page.frameLocator('iframe[title="Isolated program preview"]');
 await expect(frame.getByText("For you...")).toBeVisible();
 await frame.getByRole("button",{name:"Open my surprise"}).click();
 await expect(frame.getByText(/Happy Birthday/)).toBeVisible();
});
test("JavaScript pasted error appears as safe terminal text, never executes in CodeQuest origin",async({page})=>{
 await page.goto("/#terminal");
 await page.getByRole("textbox",{name:"Terminal code editor"}).fill('console.log("inside sandbox"); try { parent.localStorage; document.body.textContent="UNSAFE"; } catch(e) { document.body.textContent=e.name; }');
 await page.getByRole("button",{name:"Run terminal code"}).click();
 await expect(page.getByRole("log",{name:"Terminal console output"})).toContainText("inside sandbox");
 await expect(page.frameLocator('iframe[title="Isolated program preview"]').locator("body")).toContainText("SecurityError");
 await expect(page.locator("body")).toContainText("CodeQuest");
});
test("gift can be shared by URL and must be run by recipient",async({page,context})=>{
 await page.goto("/#terminal");
 const code='console.log("Happy Birthday 💕");';
 await page.getByRole("textbox",{name:"Terminal code editor"}).fill(code);
 await page.getByRole("button",{name:"Share code"}).click();
 const link=await page.getByRole("textbox",{name:"Shareable terminal code link"}).inputValue();
 expect(link).toContain("#terminal/share/");
 const receiver=await context.newPage();
 await receiver.goto(link);
 await expect(receiver.getByRole("textbox",{name:"Terminal code editor"})).toHaveValue(code);
 await expect(receiver.locator('iframe[title="Isolated program preview"]')).toHaveCount(0);
 await receiver.getByRole("button",{name:"Run terminal code"}).click();
 await expect(receiver.getByRole("log",{name:"Terminal console output"})).toContainText("Happy Birthday");
 await receiver.close();
});
test("C# compiles using real code runner and importing a code file preserves its contents",async({page})=>{
 test.setTimeout(120000);
 await page.goto("/#terminal");
 await page.getByRole("combobox",{name:"Terminal programming language"}).selectOption("csharp");
 await page.getByRole("combobox",{name:"Terminal example"}).selectOption("hello");
 await page.getByRole("button",{name:"Run terminal code"}).click();
 await expect(page.getByRole("log",{name:"Terminal console output"})).toContainText("Hello CodeQuest!",{timeout:90000});
 await page.locator('input[type="file"][aria-label="Import terminal code file"]').setInputFiles({
   name:"birthday.js",mimeType:"text/javascript",buffer:Buffer.from('console.log("Hi from imported file!");')
 });
 await expect(page.getByRole("combobox",{name:"Terminal programming language"})).toHaveValue("javascript");
 await expect(page.getByRole("textbox",{name:"Terminal code editor"})).toHaveValue('console.log("Hi from imported file!");');
 await page.getByRole("button",{name:"Run terminal code"}).click();
 await expect(page.getByRole("log",{name:"Terminal console output"})).toContainText("Hi from imported file!");
});
test("terminal remains readable on a 390px phone and retains code after refresh",async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto("/#terminal");
 await page.getByRole("combobox",{name:"Terminal programming language"}).selectOption("html");
 await page.getByRole("textbox",{name:"Terminal code editor"}).fill("<h1>Hi ♥</h1>");
 await page.reload();
 await expect(page.getByRole("textbox",{name:"Terminal code editor"})).toHaveValue("<h1>Hi ♥</h1>");
 await page.getByRole("button",{name:"Run terminal code"}).click();
 await expect(page.frameLocator('iframe[title="Isolated program preview"]').getByRole("heading",{name:"Hi ♥"})).toBeVisible();
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
 expect(overflow).toBe(false);
});

test("Python Turtle draws birthday-candle graphics from a real Python script",async({page})=>{
 test.setTimeout(120000);
 await page.goto("/#terminal");
 await page.getByRole("combobox",{name:"Terminal programming language"}).selectOption("python-turtle");
 await expect(page.getByRole("textbox",{name:"Terminal code editor"})).toHaveValue(/import turtle/);
 await page.getByRole("combobox",{name:"Terminal example"}).selectOption("birthday");
 await page.getByRole("button",{name:"Run terminal code"}).click();
 const turtleFrame=page.frameLocator('iframe[title="Isolated program preview"]');
 await expect(turtleFrame.locator("#mycanvas")).toBeVisible();
 // The actual Skulpt library must draw a graphic into the canvas container.
 await expect(turtleFrame.locator("#mycanvas canvas, #mycanvas svg").first()).toBeVisible({timeout:70000});
 await expect(page.locator(".cq-terminal-status")).toContainText("Python Turtle drawing finished.", {timeout:50000});
 await expect(page.getByRole("log",{name:"Terminal console output"})).not.toContainText(/Traceback|ImportError|Python library not found/);
});

test("Python console prints real output through its separate WebAssembly runtime",async({page})=>{
 test.setTimeout(120000);
 await page.goto("/#terminal");
 await page.getByRole("combobox",{name:"Terminal programming language"}).selectOption("python");
 await page.getByRole("textbox",{name:"Terminal code editor"}).fill('print("Python result:", 2 + 3)');
 await page.getByRole("button",{name:"Run terminal code"}).click();
 await expect(page.getByRole("log",{name:"Terminal console output"})).toContainText("Python result: 5",{timeout:70000});
 await expect(page.locator(".cq-terminal-status")).toContainText("Python finished.",{timeout:70000});
});
test("CSS animation source appears in the restricted rendering surface",async({page})=>{
 await page.goto("/#terminal");
 await page.getByRole("combobox",{name:"Terminal programming language"}).selectOption("css");
 await page.getByRole("button",{name:"Run terminal code"}).click();
 await expect(page.frameLocator('iframe[title="Isolated program preview"]').getByRole("heading",{name:"Style this page"})).toBeVisible();
});

test("TypeScript runs typed Canvas animation, reports syntax errors and allows correction",async({page})=>{
 await page.goto("/#terminal");
 await page.getByRole("combobox",{name:"Terminal programming language"}).selectOption("typescript");
 await page.getByRole("button",{name:"Run terminal code"}).click();
 const frame=page.frameLocator('iframe[title="Isolated program preview"]');
 await expect(frame.locator("canvas#art")).toBeVisible({timeout:60000});
 await page.getByRole("textbox",{name:"Terminal code editor"}).fill("const broken: = 7;");
 await page.getByRole("button",{name:"Run terminal code"}).click();
 await expect(page.getByRole("log",{name:"Terminal console output"})).toContainText(/TS\d+:/);
 await expect(page.getByRole("button",{name:"Run terminal code"})).toBeEnabled();
 await page.getByRole("textbox",{name:"Terminal code editor"}).fill("const answer: number = 42; console.log('Result: ' + answer);");
 await page.getByRole("button",{name:"Run terminal code"}).click();
 await expect(page.getByRole("log",{name:"Terminal console output"})).toContainText("Result: 42");
});
test("a Python runtime error unlocks Run immediately",async({page})=>{
 await page.goto("/#terminal");
 await page.getByRole("combobox",{name:"Terminal programming language"}).selectOption("python");
 await page.getByRole("button",{name:"Run terminal code"}).click();
 const frame=page.frameLocator('iframe[title="Isolated program preview"]');
 await frame.locator("body").evaluate(()=>window.__cqSend("fatal","Test Python runtime exception"));
 await expect(page.getByRole("log",{name:"Terminal console output"})).toContainText("Test Python runtime exception");
 await expect(page.getByRole("button",{name:"Run terminal code"})).toBeEnabled();
 await expect(page.locator(".cq-terminal-status")).toContainText("Python stopped after an error");
});
