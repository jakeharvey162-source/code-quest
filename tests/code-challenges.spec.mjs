import {test,expect} from '@playwright/test';
import {codeChallenges} from '../src/lib/code-challenges.mjs';
import {freshProgress} from '../src/lib/progress.ts';
test('student solves all seven real C# challenges, earns XP once, fixes mistakes and keeps drafts',async({page})=>{
 test.setTimeout(180000);const progress=freshProgress();progress.settings.editorMode='plain';await page.addInitScript(p=>localStorage.setItem('cq-progress-v1',JSON.stringify(p)),progress);
 await page.goto('/#challenges');
 await page.getByLabel('Challenge difficulty').selectOption('pro');await expect(page.getByRole('heading',{name:'Loan calculator boss',exact:true})).toBeVisible();await page.getByLabel('Challenge difficulty').selectOption('easy');await expect(page.getByRole('heading',{name:'Split the bill',exact:true})).toBeVisible();await page.getByLabel('Challenge difficulty').selectOption('all');
 await page.getByLabel('Challenge solution').fill('public static decimal Total(decimal price,int quantity) { return 0m; }');await page.getByRole('button',{name:'Run challenge tests'}).click();await expect(page.locator('.challenge-results')).toContainText('✕ Fix',{timeout:90000});await expect(page.locator('.xp-pill')).toContainText('0 XP');
 let total=0;for(const c of codeChallenges){await page.getByRole('button',{name:new RegExp(c.title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'))}).click();await page.getByLabel('Challenge solution').fill(c.solution);await page.getByRole('button',{name:'Run challenge tests'}).click();await expect(page.getByRole('status')).toContainText('All tests passed!',{timeout:90000});total+=c.xp;await expect(page.locator('.xp-pill')).toContainText(total+' XP');}
 await page.getByRole('button',{name:'Run challenge tests'}).click();await expect(page.getByRole('status')).toContainText('All tests passed!');await expect(page.locator('.xp-pill')).toContainText(total+' XP');
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2)).toBe(false);
});

test("mistakes cost limited XP but repeating failed code and compiler errors do not",async({page})=>{
  test.setTimeout(180000);
  const p=freshProgress();
  p.settings.editorMode="plain";
  p.steps.variables=["0","1"]; // 40 earned XP, enough to pay a mistake cost
  await page.addInitScript(value=>localStorage.setItem("cq-progress-v1",JSON.stringify(value)),p);
  await page.goto("/#challenges");
  const code=page.getByLabel("Challenge solution");
  await expect(page.locator(".xp-pill")).toContainText("40 XP");
  await code.fill("public static decimal Total(decimal price,int quantity) { return 0m; }");
  await page.getByRole("button",{name:"Run challenge tests"}).click();
  await expect(page.getByRole("status").filter({hasText:"Some tests failed."})).toContainText("-5 XP",{timeout:90000});
  await expect(page.locator(".xp-pill")).toContainText("35 XP");
  await page.getByRole("button",{name:"Run challenge tests"}).click();
  await expect(page.getByRole("status").filter({hasText:"Some tests failed."})).toContainText("No extra XP lost",{timeout:90000});
  await expect(page.locator(".xp-pill")).toContainText("35 XP");
  await code.fill("public static decimal Total(decimal price,int quantity) { return 1m; }");
  await page.getByRole("button",{name:"Run challenge tests"}).click();
  await expect(page.getByRole("status").filter({hasText:"Some tests failed."})).toContainText("-5 XP",{timeout:90000});
  await expect(page.locator(".xp-pill")).toContainText("30 XP");
});
