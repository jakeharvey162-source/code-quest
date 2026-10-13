import {test,expect} from "@playwright/test";
for(const language of ['python','csharp']){
 test(`${language} reads student supplied input lines and preserves the program source`,async({page})=>{
  await page.goto('/#terminal');await page.getByRole('combobox',{name:'Terminal programming language'}).selectOption(language);
  const source=language==='python'?'name=input("Name: ")\namount=int(input("Amount: "))\nprint("Welcome",name,"balance",amount+100)':'using System;\nConsole.Write("Name: ");\nstring name=Console.ReadLine();\nint amount=int.Parse(Console.ReadLine());\nConsole.WriteLine("Welcome " + name + " balance " + (amount + 100));';
  await page.getByRole('textbox',{name:'Terminal code editor'}).fill(source);await page.getByLabel('Terminal standard input').fill('Harvey\n250');
  await page.getByRole('button',{name:'Run terminal code'}).click();await expect(page.getByRole('log',{name:'Terminal console output'})).toContainText('Welcome Harvey balance 350',{timeout:90000});
  await expect(page.getByRole('textbox',{name:'Terminal code editor'})).toHaveValue(source);
 });
}
test("Python strings containing script terminators print literally in the isolated runtime",async({page})=>{
 await page.goto('/#terminal');await page.getByRole('combobox',{name:'Terminal programming language'}).selectOption('python');
 await page.getByRole('textbox',{name:'Terminal code editor'}).fill('print("</script> is just text")');await page.getByRole('button',{name:'Run terminal code'}).click();await expect(page.getByRole('log',{name:'Terminal console output'})).toContainText('</script> is just text',{timeout:90000});
});
