import { test, expect } from "@playwright/test";

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
