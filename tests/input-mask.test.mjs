import test from "node:test";
import assert from "node:assert/strict";
import { maskedInput, validInputMask } from "../src/lib/input-mask.mjs";
import { addControl, designerCode, validateForm } from "../src/designer-engine.mjs";
test("student-number and phone masks keep ASCII digits and native export emits Mask",()=>{
 assert.equal(maskedInput("ab123456789","00000000"),"12345678");
 assert.equal(maskedInput("0123456789","000-000-0000"),"012-345-6789");
 assert.equal(maskedInput("12","(000)"),"(12");assert.equal(maskedInput("123","(000)"),"(123)");
 assert.equal(validInputMask("<script>"),false);
 const controls=addControl([],"MaskedTextBox");assert.equal(controls[0].text,"");assert.equal(controls[0].mask,"00000000");
 assert.equal(validateForm(controls).ok,true);assert.match(designerCode(controls),/maskedtextbox1.Mask = "00000000"/);
});
