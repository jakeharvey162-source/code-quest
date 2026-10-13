import { test, expect } from "@playwright/test";
test("a learner chooses easy through pro, retains their level and reaches a system workshop",async({page})=>{
 await page.goto('/#home');const path=page.getByRole('region',{name:'Easy to pro learning path'});
 await path.getByRole('button',{name:/Intermediate Useful programs/}).click();
 await path.getByRole('button',{name:'Start Intermediate quest'}).click();
 await expect(page).toHaveURL(/#learn\/methods/);
 await page.goto('/#home');await expect(path.getByRole('button',{name:/Intermediate Useful programs/})).toHaveAttribute('aria-pressed','true');
 await path.getByRole('button',{name:/Pro Ship a complete system/}).click();await path.getByRole('button',{name:'Build a full system'}).click();
 await expect(page.getByRole('heading',{name:'Build a complete system',exact:true})).toBeVisible();
});
test("nickname, selected avatar and photo survive refresh without publishing a guest score",async({page})=>{
 await page.goto('/#account');await page.getByLabel('Your name',{exact:true}).fill('Student Builder');await page.getByLabel('Nickname',{exact:true}).fill('LoanBoss');
 await page.getByRole('button',{name:'Choose avatar 🚀'}).click();await page.getByRole('button',{name:'Save player profile'}).click();
 await expect(page.getByRole('status').filter({hasText:'Profile saved on this device'})).toBeVisible();
 await page.reload();await expect(page.getByLabel('Nickname',{exact:true})).toHaveValue('LoanBoss');await expect(page.getByRole('button',{name:'Choose avatar 🚀'})).toHaveAttribute('aria-pressed','true');
 // Upload a real PNG. The UI decodes/resizes it, rather than accepting a URL or SVG.
 await page.getByLabel('Upload profile photo').setInputFiles({name:'avatar.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jCqkAAAAASUVORK5CYII=','base64')});
 await expect(page.getByRole('button',{name:'Save player profile'})).toBeEnabled();await page.getByRole('button',{name:'Save player profile'}).click();await page.reload();
 await expect(page.locator('.profile-preview img')).toBeVisible();
 await page.goto('/#leaderboard');await expect(page.getByRole('heading',{name:'Leaderboard',exact:true})).toBeVisible();await expect(page.locator('.profile-preview')).toContainText('LoanBoss');await expect(page.getByRole('button',{name:'Join leaderboard'})).toHaveCount(0);
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2)).toBe(false);
});
