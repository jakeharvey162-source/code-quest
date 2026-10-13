import {test,expect} from "@playwright/test";
import {addControl} from "../src/designer-engine.mjs";
test("new MaskedTextBox filters letters and its real C# handler can check completeness",async({page})=>{
 const controls=addControl(addControl([],"MaskedTextBox"),"Label");controls[0].eventTextChanged="StudentNumberChanged";
 const code='private void StudentNumberChanged(object sender, System.EventArgs e) { label1.Text = maskedtextbox1.MaskCompleted ? "Ready to submit" : "Enter eight digits"; }';
 await page.addInitScript(({controls,code})=>{localStorage.setItem('cq-form',JSON.stringify(controls));localStorage.setItem('cq-practical-code',code);},{controls,code});
 await page.goto('/#designer');await expect(page.getByRole('button',{name:'MaskedTextBox',exact:true})).toBeVisible();
 await page.keyboard.press('F5');
 const input=page.getByRole('textbox',{name:'maskedtextbox1',exact:true});await input.fill('1234');await expect(page.locator('.form-canvas')).toContainText('Enter eight digits',{timeout:90000});
 await input.fill('a1234567');await expect(input).toHaveValue('1234567');await expect(page.locator('.form-canvas')).toContainText('Enter eight digits');
 await input.fill('12345678');await expect(page.locator('.form-canvas')).toContainText('Ready to submit',{timeout:90000});
});
