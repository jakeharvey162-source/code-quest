import {test,expect} from "@playwright/test";
test("Tor responds with high fives, dances, celebration and real code advice",async({page})=>{
 await page.goto("/#terminal");
 const tor=page.getByRole("complementary",{name:"Tor hologram tutor"});
 await tor.getByRole("button",{name:"Open Tor tutor"}).click();
 await tor.getByLabel("Speak replies automatically").uncheck();
 await tor.getByRole("button",{name:"Make Tor dance"}).click();
 await expect(tor).toHaveAttribute("data-mood","cheeky");
 await expect(tor.locator(".tor-reply")).toContainText("dance compiler");
 await tor.getByRole("button",{name:"High five Tor"}).click();
 await expect(tor.locator(".tor-reply")).toContainText("High five!");
 await tor.getByRole("button",{name:"Make Tor celebrate"}).click();
 await expect(tor.locator(".tor-reply")).toContainText("Achievement energy");
 await tor.getByRole("button",{name:"Make Tor act shocked"}).click();
 await expect(tor.locator(".tor-reply")).toContainText("first error");
});
test("Tor's mouth state follows mocked browser voice lifecycle and stops on command",async({page})=>{
 await page.addInitScript(()=>{
  const voice={name:"Mock English",lang:"en-ZA"};
  let utterance=null;
  const synth={
   getVoices:()=>[voice],cancel(){utterance=null;},
   speak(u){utterance=u;setTimeout(()=>{if(utterance===u)u.onstart?.()},50)}
  };
  Object.defineProperty(window,"speechSynthesis",{configurable:true,value:synth});
  Object.defineProperty(window,"SpeechSynthesisUtterance",{configurable:true,value:class{constructor(text){this.text=text}}});
 });
 await page.goto("/#terminal");
 const tor=page.getByRole("complementary",{name:"Tor hologram tutor"});
 await tor.getByRole("button",{name:"Open Tor tutor"}).click();
 await tor.getByRole("button",{name:"Tor, speak"}).click();
 await expect(tor).toHaveClass(/speaking/,{timeout:10000});
 await expect(tor.getByTestId("tor-3d")).toHaveAttribute("data-speaking","true");
 await tor.getByRole("button",{name:"Stop voice"}).click();
 await expect(tor).not.toHaveClass(/speaking/);
 await expect(tor.getByTestId("tor-3d")).toHaveAttribute("data-speaking","false");
});
test("playful Tor gestures keep touch targets accessible on small iPhone screens",async({page})=>{
 await page.setViewportSize({width:375,height:812});
 await page.goto("/#terminal");
 const tor=page.getByRole("complementary",{name:"Tor hologram tutor"});
 await tor.getByRole("button",{name:"Open Tor tutor"}).click();
 const dance=tor.getByRole("button",{name:"Make Tor dance"});
 await expect(dance).toBeVisible();
 const rect=await dance.boundingBox();
 expect(rect.height).toBeGreaterThanOrEqual(44);
 await dance.click();
 await expect(tor.locator(".tor-reply")).toContainText("dance");
});
