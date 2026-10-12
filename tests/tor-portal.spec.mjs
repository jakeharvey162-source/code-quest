import {test,expect} from '@playwright/test';
test('Tor exits through portal, returns and preserves the lesson',async({page})=>{
  await page.goto('/#designer');
  const tor=page.getByRole('complementary',{name:'Tor hologram tutor'});
  await tor.getByRole('button',{name:'Open Tor tutor'}).click();
  await tor.getByLabel('Speak replies automatically').uncheck();
  const input=tor.getByLabel('Ask about C# or your form');
  await input.fill('What is a TextBox?');
  await tor.getByRole('button',{name:'Explain',exact:true}).click();
  await input.fill('get out');
  await tor.getByRole('button',{name:'Explain',exact:true}).click();
  await expect(page.getByRole('button',{name:'Call Tor',exact:true})).toBeVisible();
  await expect(tor).toHaveCount(0);
  await page.getByRole('button',{name:'Call Tor',exact:true}).click();
  await expect(tor).toHaveAttribute('data-presence','visible');
  await tor.getByRole('button',{name:'Open Tor tutor'}).click();
  await expect(input).toHaveValue('get out');
  await expect(tor).toContainText('TextBox');
});
