import {test,expect} from '@playwright/test';
test('direct Tor route asks guests to sign in, including after refresh',async({page})=>{
  await page.goto('/tor');
  await expect(page.getByRole('heading',{name:'Join CodeQuest to connect'})).toBeVisible();
  await expect(page).toHaveURL(/\/#tor$/);
  await expect(page.getByRole('button',{name:'Create account or sign in'})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading',{name:'Join CodeQuest to connect'})).toBeVisible();
});
