import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('manual Tor movement takes priority over an automatic walk and stays below the toolbar',async({page})=>{
 await page.goto('/#home');const tor=page.getByRole('complementary',{name:'Tor hologram tutor'});await expect(tor).toBeVisible();await page.waitForTimeout(12500);
 const before=await tor.evaluate(el=>el.getBoundingClientRect().top);await page.getByRole('button',{name:'Move Tor hologram',exact:true}).press('ArrowUp');await page.waitForTimeout(500);
 const after=await tor.evaluate(el=>el.getBoundingClientRect().top);expect(after).toBeLessThanOrEqual(before-15);expect(after).toBeGreaterThanOrEqual(await page.locator('.app-header').evaluate(el=>el.getBoundingClientRect().bottom));
});
test('World owns the learning path, lessons stay focused and Tor explains simply',async({page})=>{
 await page.goto('/#home');await expect(page.getByRole('region',{name:'Easy to pro learning path'})).toHaveCount(1);
 await page.goto('/#learn');await expect(page.getByRole('heading',{name:'Build a little. Learn a lot.'})).toBeVisible();await expect(page.getByRole('region',{name:'Easy to pro learning path'})).toHaveCount(0);
 await page.goto('/#learn/variables');await page.getByRole('button',{name:'Open Tor tutor',exact:true}).click();await page.getByRole('button',{name:'Explain simply',exact:true}).click();await expect(page.locator('.tor-reply')).toContainText('labelled box');await expect(page.locator('.lesson-coach')).toContainText('labelled box');
 await page.goto('/#home');await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);
 await page.emulateMedia({reducedMotion:'reduce'});expect(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
});
test('dark mode contrast stays accessible across World, lessons, challenges, rankings, profile and Tor',async({page})=>{
 test.setTimeout(180000);await page.goto('/#home');await page.getByRole('button',{name:'Switch to dark mode',exact:true}).click();
 const problems=[];
 for(const route of ['home','learn','challenges','leaderboard','account','settings','learn/variables']){
  await page.goto('/#'+route);await expect(page.locator('main h1')).toBeVisible();
  const result=await new AxeBuilder({page}).include('main').include('.app-header').withRules(['color-contrast']).analyze();
  problems.push(...result.violations.map(v=>({route,id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})));
 }
 await page.getByRole('button',{name:'Open Tor tutor',exact:true}).click();await expect(page.locator('.tor-panel')).toBeVisible();const tor=await new AxeBuilder({page}).include('.tor-panel').withRules(['color-contrast']).analyze();problems.push(...tor.violations.map(v=>({route:'tor',id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})));
 expect(problems).toEqual([]);
});
