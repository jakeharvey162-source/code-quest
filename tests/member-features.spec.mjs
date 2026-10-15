import { test, expect } from "@playwright/test";
import { fixture } from "./community-fixture.mjs";

test("guests see clean coding tools but no member-only community, private chat or study desk", async ({page}) => {
  await page.goto("/#home");
  const nav=page.getByRole("navigation",{name:"Main navigation"});
  for(const name of ["Community chat","Private chats","Tor study desk","Classroom"])
    await expect(nav.getByRole("button",{name,exact:true})).toHaveCount(0);
  await expect(nav.getByRole("button",{name:"Code Lab",exact:true})).toBeVisible();
  for(const target of ["community","private-chats","tor","classes"]) {
    await page.goto("/#"+target);
    await expect(page.getByRole("heading",{name:"Join CodeQuest to connect"})).toBeVisible();
    await expect(page.getByRole("button",{name:"Create account or sign in"})).toBeVisible();
  }
  await page.goto("/#playground");
  await expect(page.locator(".cm-editor").first()).toBeVisible();
  await expect(page.getByRole("button",{name:/Suggest \(Ctrl\+Space\)/})).toHaveCount(0);
  await expect(page.locator(".editor-assist")).toHaveCount(0);
});
test("after sign-in Community chat, private friends and Tor desk appear and private shortcut opens friends",async({page})=>{
  const service=await fixture();
  try {
    await service.attach(page);
    await page.goto("/#account");
    await page.getByRole("textbox",{name:"Email",exact:true}).fill("a@community.test");
    await page.getByRole("textbox",{name:"Password",exact:true}).fill("Community-test-123!");
    await page.getByRole("button",{name:"Sign in",exact:true}).click();
    await expect(page.getByRole("button",{name:"Sign out",exact:true})).toBeVisible();
    const nav=page.getByRole("navigation",{name:"Main navigation"});
    for(const name of ["Community chat","Private chats","Tor study desk","Classroom"])
      await expect(nav.getByRole("button",{name,exact:true})).toBeVisible();
    await nav.getByRole("button",{name:"Private chats",exact:true}).click();
    await expect(page.getByRole("heading",{name:"Your people, your pace."})).toBeVisible();
    await nav.getByRole("button",{name:"Community chat",exact:true}).click();
    await expect(page.getByRole("heading",{name:"Community",exact:true})).toBeVisible();
    await nav.getByRole("button",{name:"Tor study desk",exact:true}).click();
    await expect(page.getByRole("heading",{name:"Tor’s study desk"})).toBeVisible();
  } finally { await service.close(); }
});
