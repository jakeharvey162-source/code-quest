import {test,expect} from '@playwright/test';
test('direct Tor route opens the study desk and survives refresh',async({page})=>{
 await page.goto('/tor');
 await expect(page.getByRole('heading',{name:'Tor’s study desk',exact:true})).toBeVisible();
 await expect(page).toHaveURL(/\/#tor$/);
 await page.reload();
 await expect(page.getByRole('heading',{name:'Tor’s study desk',exact:true})).toBeVisible();
});
