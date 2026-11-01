import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { freshProgress, xpFor } from "../src/lib/progress.ts";
import { adventureKey, adventureDraftKey, lagosMissions } from "../src/lib/lagos-adventure.mjs";

async function prepare(page) {
  await page.addInitScript(state => {
    if (!localStorage.getItem('cq-progress-v1')) localStorage.setItem('cq-progress-v1', JSON.stringify(state));
    localStorage.setItem('cq-tor-auto-speak', 'false');
    localStorage.setItem('cq-tor-roam', 'false');
  }, { ...freshProgress(), settings: {...freshProgress().settings, editorMode: 'plain', reducedMotion: true} });
}
async function progress(page) { return page.evaluate(() => JSON.parse(localStorage.getItem('cq-progress-v1'))); }
async function screenshot(page, path) {
  await page.evaluate(async () => {
    for (let top = 0; top < document.documentElement.scrollHeight; top += innerHeight) {
      scrollTo(0, top); await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }
    scrollTo(0, 0); await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await page.screenshot({path, fullPage: true});
}
async function repair(page, mission) {
  const editor = page.getByRole('textbox', { name: 'Mission C# solution' });
  await editor.fill(mission.solution);
  // Verify the visible document really changed before evaluating any C#.
  if (await editor.getAttribute('contenteditable') === 'true') {
    await expect(editor).toHaveText(mission.solution);
  } else {
    await expect(editor).toHaveValue(mission.solution);
  }
  await page.getByRole('button', { name: 'Test repair', exact: true }).click();
  await expect(page.locator('.adventure-feedback')).toContainText('Every scenario passed!', {timeout: 90000});
  await expect.poll(async () => (await progress(page)).steps[adventureKey] || []).toContain(mission.id);
}

test('guest restores Lagos with real C#, no mistake penalties, persistent drafts and once-only achievements', async ({page, context}, testInfo) => {
  test.setTimeout(180000);
  await prepare(page);
  const aiRequests = [];
  page.on('request', request => { if (/\/api\/tor|\/functions\/v1\/codequest-tor/.test(request.url())) aiRequests.push(request.url()); });
  await page.goto('/');
  await page.getByRole('link', {name: /Start Adventure/}).click();
  await expect(page).toHaveURL(/#adventure\/streetlights$/);
  await expect(page.getByRole('img', {name: /Rookie Street: streetlights waiting for power, shop closed, network offline/})).toBeVisible();
  await expect(page.getByRole('button', {name: /Repair the Digital Shop/})).toBeDisabled();
  await page.setViewportSize({width: 1440, height: 1050});
  await screenshot(page, testInfo.outputPath('lagos-desktop-start.png'));
  await page.getByRole('button', {name: 'Test repair', exact: true}).click();
  await expect(page.locator('.adventure-feedback')).toContainText('No XP lost.', {timeout: 90000});
  expect((await progress(page)).steps[adventureKey] || []).toEqual([]);
  await page.getByRole('textbox', {name: 'Mission C# solution'}).fill('public static int Lights(int lamps) { return ; }');
  await page.getByRole('button', {name: 'Test repair', exact: true}).click();
  await expect(page.locator('.adventure-feedback')).toContainText(/CS\d{4}/, {timeout: 90000});
  expect((await progress(page)).steps['xp-penalties']).toBeUndefined();
  await page.reload();
  await expect(page.getByRole('textbox', {name: 'Mission C# solution'})).toHaveValue('public static int Lights(int lamps) { return ; }');
  await page.getByRole('button', {name: 'Reset code', exact: true}).click();
  expect((await progress(page)).steps[adventureKey] || []).toEqual([]);
  await repair(page, lagosMissions[0]);
  expect(xpFor(await progress(page))).toBe(40);
  await expect(page.getByRole('img', {name: /streetlights glowing, shop closed, network offline/})).toBeVisible();
  await expect(page.getByRole('region', {name: 'Mission achievement'})).toContainText('Light Keeper');
  // Reuse the already-loaded real compiler and authored TOR hints without a network.
  await context.setOffline(true);
  await page.getByRole('button', {name: /Ask TOR for a hint/}).click();
  await expect(page.locator('.adventure-dialogue')).toContainText(lagosMissions[0].hints[0]);
  await page.getByRole('button', {name: 'Test repair', exact: true}).click();
  await expect(page.locator('.adventure-feedback')).toContainText('already earned', {timeout: 90000});
  expect((await progress(page)).steps[adventureKey]).toEqual(['streetlights']);
  await context.setOffline(false);
  await page.getByRole('button', {name: 'Next mission'}).click();
  await expect(page).toHaveURL(/#adventure\/digital-shop$/);
  await expect(page.getByRole('heading', {name: 'Repair the Digital Shop', exact:true})).toBeFocused();
  await repair(page, lagosMissions[1]);
  expect(xpFor(await progress(page))).toBe(100);
  await expect(page.getByRole('img', {name: /streetlights glowing, shop open, network offline/})).toBeVisible();
  await page.getByRole('button', {name: 'Next mission'}).click();
  await repair(page, lagosMissions[2]);
  expect(xpFor(await progress(page))).toBe(200);
  await expect(page.getByRole('img', {name: /streetlights glowing, shop open, network connected/})).toBeVisible();
  await expect(page.getByRole('region', {name: 'Mission achievement'})).toContainText('CHAPTER COMPLETE');
  await page.reload();
  await expect(page.getByRole('textbox', {name: 'Mission C# solution'})).toHaveValue(lagosMissions[2].solution);
  await expect(page.locator('.adventure-dialogue')).toContainText(lagosMissions[2].success);
  expect((await progress(page)).steps[adventureKey]).toEqual(lagosMissions.map(mission => mission.id));
  expect(aiRequests).toEqual([]);
  expect(xpFor(await progress(page))).toBe(200);
  await page.setViewportSize({width: 1440, height: 1050});
  await screenshot(page, testInfo.outputPath('lagos-desktop-complete.png'));
  for (const width of [320, 360, 412]) {
    await page.setViewportSize({width, height: 900});
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await screenshot(page, testInfo.outputPath(`lagos-${width}-complete.png`));
  }
});

test('locked deep links cannot bypass progression, and stopping or leaving a run never grants a reward', async ({page}) => {
  test.setTimeout(90000);
  await prepare(page);
  await page.goto('/#adventure/network');
  await expect(page).toHaveURL(/#adventure\/streetlights$/);
  await expect(page.getByRole('heading', {name: 'Restore the Streetlights', exact: true})).toBeVisible();
  await page.getByRole('textbox', {name: 'Mission C# solution'}).fill('public static int Lights(int lamps) { while (true) {} }');
  await page.getByRole('button', {name: 'Test repair', exact: true}).click();
  await page.getByRole('button', {name: 'Stop tests', exact: true}).click();
  await expect(page.locator('.adventure-feedback')).toContainText('Run stopped');
  expect((await progress(page)).steps[adventureKey] || []).toEqual([]);
  await page.getByRole('button', {name: 'Test repair', exact: true}).click();
  await page.getByRole('link', {name: 'Leave story · Lessons'}).click();
  await expect(page.getByRole('heading', {name: 'Build a little. Learn a lot.'})).toBeVisible();
  await page.goto('/#adventure/streetlights');
  await expect(page.getByRole('textbox', {name: 'Mission C# solution'})).toHaveValue('public static int Lights(int lamps) { while (true) {} }');
  expect((await progress(page)).steps[adventureKey] || []).toEqual([]);
  await repair(page, lagosMissions[0]);
});

test('mobile adventure supports keyboard, accessible names, reduced motion and readable layouts', async ({page}) => {
  test.setTimeout(90000);
  await prepare(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#adventure/streetlights');
  await expect(page.getByRole('heading', {name: 'Lagos: Rookie Street.'})).toBeVisible();
  for (const width of [320, 360, 412]) {
    await page.setViewportSize({width, height: 900});
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const findings = await new AxeBuilder({page}).include('.adventure-page').analyze();
    expect(findings.violations.filter(v => ['serious','critical'].includes(v.impact)), JSON.stringify(findings.violations, null, 2)).toEqual([]);
  }
  await page.evaluate(() => { const state = JSON.parse(localStorage.getItem('cq-progress-v1')); state.settings.theme = 'dark'; localStorage.setItem('cq-progress-v1', JSON.stringify(state)); });
  await page.reload();
  await expect(page.getByRole('heading', {name: 'Lagos: Rookie Street.'})).toBeVisible();
  const darkFindings = await new AxeBuilder({page}).include('.adventure-page').analyze();
  expect(darkFindings.violations.filter(v => ['serious','critical'].includes(v.impact)), JSON.stringify(darkFindings.violations, null, 2)).toEqual([]);
  const hint = page.getByRole('button', {name: /Ask TOR for a hint/});
  await hint.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.adventure-dialogue')).toContainText(lagosMissions[0].hints[0]);
  await page.getByRole('textbox', {name: 'Mission C# solution'}).focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', {name: 'Test repair', exact: true})).toBeFocused();
  expect(await page.locator('.adventure-page').evaluate(node => [...node.querySelectorAll('*')].every(element => {
    const styles = getComputedStyle(element);
    return styles.animationName === 'none' || styles.animationDuration.split(',').every(value => parseFloat(value) <= 0.01);
  }))).toBe(true);
});


test('quiet TOR keeps learner-requested guidance without reacting to automatic failed checks', async ({page}) => {
  test.setTimeout(90000);
  await prepare(page);
  await page.goto('/#adventure/streetlights');
  await page.getByRole('button', {name:'Open Tor tutor', exact:true}).click();
  await page.getByRole('checkbox', {name:'React to my workspace', exact:true}).uncheck();
  const reply = await page.locator('.tor-reply').textContent();
  await page.getByRole('button', {name:'Minimise Tor', exact:true}).click();
  await page.getByRole('button', {name:'Test repair', exact:true}).click();
  await expect(page.locator('.adventure-feedback')).toContainText('No XP lost.', {timeout:90000});
  await page.getByRole('button', {name:'Open Tor tutor', exact:true}).click();
  await expect(page.locator('.tor-reply')).toHaveText(reply);
  await page.getByLabel('Ask about your mission or C#').fill('give me a hint');
  await page.locator('.tor-panel').getByRole('button', {name:'Explain',exact:true}).click();
  await expect(page.locator('.tor-reply')).toContainText(lagosMissions[0].hints[0]);
});

for (const editorMode of ['editor', 'plain']) {
  test(`${editorMode} oversized mission edits cannot run a previously saved passing solution`, async ({page}) => {
    test.setTimeout(90000);
    const mission = lagosMissions[0];
    await page.addInitScript(state => {
      localStorage.setItem('cq-progress-v1', JSON.stringify(state));
      localStorage.setItem('cq-tor-auto-speak', 'false');
      localStorage.setItem('cq-tor-roam', 'false');
      const original = Worker.prototype.postMessage;
      window.__lagosCompilerRequests = 0;
      Worker.prototype.postMessage = function (payload, ...args) {
        if (typeof payload?.code === 'string') window.__lagosCompilerRequests++;
        return original.call(this, payload, ...args);
      };
    }, {
      ...freshProgress(),
      settings: {...freshProgress().settings, editorMode, reducedMotion: true},
      drafts: {[adventureDraftKey(mission.id)]: mission.solution},
    });
    await page.goto('/#adventure/streetlights');
    const editor = page.getByRole('textbox', {name: 'Mission C# solution'});
    const oversized = 'public static int Lights(int lamps) { return 999; }\n//' + 'x'.repeat(50001);
    await editor.fill(oversized);
    await expect(page.locator('.adventure-feedback')).toContainText('over 50,000 characters');
    await page.getByRole('button', {name: 'Test repair', exact: true}).click();
    await expect(page.locator('.adventure-feedback')).toContainText('last saved draft is unchanged');
    await expect(page.getByRole('button', {name: 'Stop tests', exact: true})).toHaveCount(0);
    expect(await page.evaluate(() => window.__lagosCompilerRequests)).toBe(0);
    expect((await progress(page)).steps[adventureKey] || []).toEqual([]);
    expect((await progress(page)).drafts[adventureDraftKey(mission.id)]).toBe(mission.solution);
    if (editorMode === 'plain') await expect(editor).toHaveValue(oversized);
    await repair(page, mission);
    expect(await page.evaluate(() => window.__lagosCompilerRequests)).toBe(1);
    expect(xpFor(await progress(page))).toBe(40);
  });
}
