/** Decide whether a run needs a visible canvas or a large text result panel.
 * The code itself always runs in the existing isolated sandbox/real compiler.
 * This does not infer a program's runtime success or execute user source.
 */
export function outputKind(language,source){
 if(["csharp","python"].includes(language))return "text";
 if(["html","css","python-turtle"].includes(language))return "visual";
 if(["javascript","typescript"].includes(language)){
  const s=String(source);
  return /(?:getContext\s*\(|\bcanvas\b|requestAnimationFrame\s*\(|\bdocument\s*\.|\bwindow\s*\.|querySelector\s*\(|getElementById\s*\(|createElement\s*\(|\.innerHTML\b|\.textContent\s*=|\bdrawImage\s*\(|\bImageData\b|\bWebGL\b|\bTHREE\b)/i.test(s)
   ?"visual":"text";
 }
 return "text";
}
export function languageMismatch(selected,source){
 const s=String(source||"").trim();
 if(!s)return null;
 // Only strong syntax cues. Ambiguous expressions should execute normally.
 if(/^\s*#include\s*[<"]|^\s*using\s+namespace\s+std\s*;/m.test(s))
  return {language:null,label:"C++",message:"This is C++ code. Code Terminal does not yet have a C++ compiler. Use a C++ compiler; the current runtime will not produce C++ output."};
 if(/^\s*(?:public\s+)?static\s+void\s+main\s*\(\s*String\s*\[\s*\]/m.test(s))
  return {language:null,label:"Java",message:"This looks like Java. Java execution is not available here yet; choose a supported runtime."};
 if(selected!=="python"&&selected!=="python-turtle"&&
   /^(?:\s*(?:def\s+\w+\s*\(|from\s+\w+\s+import\s+|import\s+(?:math|random|turtle|sys)\b|print\s*\(|for\s+\w+\s+in\s+range\s*\())/m.test(s))
  return {language:s.includes("turtle")?"python-turtle":"python",label:"Python",message:"This looks like Python, but another runtime is selected. Switch to Python and press Run."};
 if(selected!=="csharp"&&/^\s*using\s+System\s*;|Console\.(WriteLine|ReadLine)\s*\(/m.test(s))
  return {language:"csharp",label:"C#",message:"This looks like C# console code. Switch to C# and press Run."};
 if(selected!=="html"&&/^\s*(?:<!doctype\s+html|<html\b|<div\b|<h[1-6]\b)/i.test(s))
  return {language:"html",label:"HTML",message:"This looks like HTML. Switch to HTML and press Run to see the page."};
 if(selected!=="javascript"&&selected!=="typescript"&&/\bconsole\.log\s*\(/.test(s))
  return {language:"javascript",label:"JavaScript",message:"This looks like JavaScript. Switch to JavaScript and press Run."};
 return null;
}
export function noOutputHint(language){
 return language==="python"?"Your program finished but printed nothing. Try print('Hello!') and run again.":
 language==="csharp"?"Your C# program finished but printed nothing. Add Console.WriteLine(\"Hello!\") and run again.":
 language==="javascript"||language==="typescript"?"Your program ran without printed output. Try console.log('Hello!') or draw on Canvas.":
 "Your program is ready. Look at the visual preview for the result.";
}
