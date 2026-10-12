/** Transpilation only: output runs inside a sandboxed frame, never in CodeQuest's origin. */
import ts from "typescript";
export function compileTerminalTypeScript(source){
 if(typeof source!=="string"||source.length>60000)throw Error("Keep your program under 60,000 characters.");
 const parsed=ts.createSourceFile("main.ts",source,ts.ScriptTarget.ES2022,true,ts.ScriptKind.TS);
 if(parsed.statements.some(node=>ts.isImportDeclaration(node)||ts.isExportDeclaration(node)||ts.isExportAssignment(node)||ts.isImportEqualsDeclaration(node)||node.modifiers?.some(mod=>mod.kind===ts.SyntaxKind.ExportKeyword))){
  return {success:false,code:"",diagnostics:["Modules/imports are not supported in the local visual preview. Use browser APIs such as Canvas instead."]};
 }
 const output=ts.transpileModule(source,{fileName:"main.ts",reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}});
 const errors=[...(parsed.parseDiagnostics||[]),...(output.diagnostics||[])].filter(d=>d.category===ts.DiagnosticCategory.Error);
 const diagnostics=[...new Set(errors.map(d=>{
  const place=d.file&&typeof d.start==="number"?d.file.getLineAndCharacterOfPosition(d.start):null;
  const position=place?` (line ${place.line+1}, column ${place.character+1})`:"";
  return `TS${d.code}${position}: ${ts.flattenDiagnosticMessageText(d.messageText," ")}`;
 }))];
 return {success:diagnostics.length===0,code:diagnostics.length===0?output.outputText:"",diagnostics};
}
