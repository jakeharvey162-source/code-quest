/** Opaque-origin code preview and share codec; never evaluate user code in the app origin. */
export const LANGUAGES = Object.freeze(["javascript","typescript","html","css","python","python-turtle","csharp"]);
const PYODIDE="https://cdn.jsdelivr.net/pyodide/v0.27.7/full/";
export function validLanguage(value){return LANGUAGES.includes(value)}
export function validateSource(code){
 if(typeof code!=="string"||code.length>60000)throw Error("Keep your program under 60,000 characters.");
 return code;
}
export function escapeHtml(text){return String(text).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
export function safeScript(source){return String(source).replace(/<\/script/gi,"<\\/script")}
export function encodeSharedProgram(language,source){
 if(!validLanguage(language)||validateSource(source).length>2800)throw Error("Share links support up to 2,800 characters. Download larger code instead.");
 const bytes=new TextEncoder().encode(JSON.stringify({v:1,language,source}));
 if(bytes.length>6000)throw Error("Share link is too large.");
 let binary="";for(const b of bytes)binary+=String.fromCharCode(b);
 return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
}
export function decodeSharedProgram(encoded){
 if(typeof encoded!=="string"||!/^[a-zA-Z0-9_-]{1,9000}$/.test(encoded))throw Error("Invalid shared code link.");
 let text;try{
  const raw=atob(encoded.replace(/-/g,"+").replace(/_/g,"/"));
  text=new TextDecoder("utf-8",{fatal:true}).decode(Uint8Array.from(raw,x=>x.charCodeAt(0)));
 }catch{throw Error("Shared code could not be decoded.")}
 let data;try{data=JSON.parse(text)}catch{throw Error("The shared code is invalid.")}
 if(data?.v!==1||!validLanguage(data?.language))throw Error("Unsupported shared-code language.");
 validateSource(data.source);
 return {language:data.language,source:data.source};
}
const STYLE="*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#050613;color:#ffe8fb;font:16px/1.5 Consolas,monospace}body{overflow-x:hidden}canvas{width:100%;height:100vh;display:block}#display{text-align:center;padding:28px}button{padding:12px 20px;color:white;background:#51214d;border:1px solid #ff9add;border-radius:12px}";
const POLICY="default-src 'none';script-src 'unsafe-inline';style-src 'unsafe-inline';img-src data: blob:;media-src data: blob:;font-src data:;connect-src 'none';worker-src 'none';frame-src 'none';form-action 'none';base-uri 'none'";
function shell(body,css,scripts,token,policy=POLICY){
 const bridge='(function(){const token='+JSON.stringify(token)+';const fmt=x=>{try{return typeof x==="string"?x:JSON.stringify(x)}catch{return String(x)}};const send=(kind,text)=>parent.postMessage({channel:"cq-terminal",token,kind,text:String(text).slice(0,5000)},"*");window.__cqSend=send;for(const kind of ["log","info","warn","error"])console[kind]=(...values)=>send(kind,values.map(fmt).join(" "));window.addEventListener("error",e=>{window.__cqRuntimeError=true;send("fatal",e.message||"Script error")});window.addEventListener("unhandledrejection",e=>{window.__cqRuntimeError=true;send("fatal",String(e.reason))});})();';
 return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="'+escapeHtml(policy)+'"><style>'+css+'</style><script>'+bridge+'</script></head><body>'+body+scripts+'</body></html>';
}
function pythonFrame(code,token){
 // Python runs in a disposable Web Worker created in a sandboxed, opaque-origin iframe.
 // It cannot access the parent app's cookies/storage and a stopped iframe kills its worker.
 const worker=[
 'importScripts('+JSON.stringify(PYODIDE+"pyodide.js")+');',
 'let py=null;',
 'self.onmessage=async e=>{',
 ' try{',
 ' self.postMessage({kind:"status",text:"Loading Python runtime; internet required on first run..."});',
 ' py=py||await loadPyodide({indexURL:'+JSON.stringify(PYODIDE)+'});',
 ' py.setStdout({batched:text=>self.postMessage({kind:"log",text})});',
 ' py.setStderr({batched:text=>self.postMessage({kind:"error",text})});',
 ' self.postMessage({kind:"status",text:"Running Python..."});',
 ' let result=await py.runPythonAsync(e.data.code);',
 ' if(result!==undefined&&result!==null){self.postMessage({kind:"log",text:String(result)});if(typeof result.destroy==="function")result.destroy();}',
 ' self.postMessage({kind:"done",text:"Python finished."});',
 ' }catch(err){self.postMessage({kind:"fatal",text:err.message||String(err)})}',
 '};'
 ].join("\n");
 const bootstrap=[
 '(function(){try{const blob=new Blob(['+JSON.stringify(worker)+'],{type:"text/javascript"});',
 'const url=URL.createObjectURL(blob);const w=new Worker(url);URL.revokeObjectURL(url);',
 'w.onmessage=e=>{const d=e.data||{};if(["log","error","fatal","status","done"].includes(d.kind))window.__cqSend(d.kind,d.text||"")};',
 'w.onerror=e=>window.__cqSend("fatal",e.message||"Python worker blocked");',
 'w.postMessage({code:'+JSON.stringify(code)+'});',
 '}catch(err){window.__cqSend("fatal","Could not launch Python: "+String(err))}})();'
 ].join("");
 // No same-origin privilege: external runtime may only reach its pinned CDN.
 const policy="default-src 'none';script-src 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://cdn.jsdelivr.net;connect-src https://cdn.jsdelivr.net;worker-src blob:;style-src 'unsafe-inline';img-src data:;base-uri 'none';form-action 'none'";
 return shell('<div id="display"><h2>Python console</h2><p>Standard input/output only. tkinter, pygame and OS windows are not available inside the browser.</p></div>',STYLE,
 '<script>'+bootstrap+'</script>',token,policy);
}
function turtleFrame(code,token){
 const csp="default-src 'none';script-src 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net;connect-src https://cdn.jsdelivr.net;style-src 'unsafe-inline';img-src data: blob:;font-src data:;base-uri 'none';form-action 'none'";
 const loader=
 '<script src="https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt.min.js"></script>'+
 '<script src="https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt-stdlib.js"></script>';
 const bootstrap=[
  '(function(){try{',
  'if(typeof Sk==="undefined")throw Error("Python Turtle runtime unavailable; check internet access.");',
  'Sk.pre="mycanvas";',
  'Sk.execLimit=15000;',
  'Sk.configure({output:text=>window.__cqSend("log",text),read:filename=>{',
  'if(!Sk.builtinFiles||!Sk.builtinFiles.files[filename])throw Error("Python library not found: "+filename);',
  'return Sk.builtinFiles.files[filename];},__future__:Sk.python3});',
  '(Sk.TurtleGraphics||(Sk.TurtleGraphics={})).target="mycanvas";',
  'Sk.misceval.asyncToPromise(()=>Sk.importMainWithBody("<stdin>",false,'+JSON.stringify(code)+',true))',
  '.then(()=>window.__cqSend("done","Python Turtle drawing finished."),',
  'err=>window.__cqSend("fatal",String(err)));',
  '}catch(err){window.__cqSend("fatal",String(err))}})();'
 ].join("");
 return shell('<div id="mycanvas" style="min-height:100vh;background:black"></div>',STYLE,loader+"<script>"+bootstrap+"</script>",token,csp);
}

const TS_COMPILER="https://cdn.jsdelivr.net/npm/typescript@5.9.3/lib/typescript.js";
function typescriptFrame(code,token){
 // TS 7 ships no JavaScript compiler API. Compile with a pinned browser compiler
 // inside an opaque-origin frame; never evaluate source in the CodeQuest origin.
 const csp="default-src 'none';script-src 'unsafe-inline' https://cdn.jsdelivr.net;connect-src 'none';worker-src 'none';style-src 'unsafe-inline';img-src data: blob:;base-uri 'none';form-action 'none'";
 const bootstrap=[
  '(function(){try{',
  'if(!window.ts||typeof window.ts.transpileModule!=="function")throw Error("TypeScript compiler could not load; check the internet connection.");',
  'const ts=window.ts;',
  'const source='+safeScript(JSON.stringify(code))+';',
  'const parsed=ts.createSourceFile("main.ts",source,ts.ScriptTarget.ES2022,true,ts.ScriptKind.TS);',
  'if(parsed.statements.some(node=>ts.isImportDeclaration(node)||ts.isExportDeclaration(node)||ts.isExportAssignment(node)||ts.isImportEqualsDeclaration(node)||node.modifiers?.some(mod=>mod.kind===ts.SyntaxKind.ExportKeyword)))throw Error("Module imports/exports are unsupported in this local preview. Use Canvas and console APIs.");',
  'const compiled=ts.transpileModule(source,{fileName:"main.ts",reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}});',
  'const errors=[...(parsed.parseDiagnostics||[]),...(compiled.diagnostics||[])].filter(d=>d.category===ts.DiagnosticCategory.Error);',
  'if(errors.length){for(const d of errors)window.__cqSend("error","TS"+d.code+": "+ts.flattenDiagnosticMessageText(d.messageText," "));window.__cqSend("fatal","TypeScript has syntax errors.");return;}',
  'window.__cqSend("status","Running compiled TypeScript...");',
  'const script=document.createElement("script");script.textContent=compiled.outputText;document.body.appendChild(script);',
  'window.__cqSend("done","TypeScript loaded; animations may continue.");',
  '}catch(err){window.__cqSend("fatal",err.message||String(err))}})();'
 ].join("");
 return shell('<canvas id="art" width="960" height="540"></canvas>',STYLE,
  '<script src="'+TS_COMPILER+'"></script><script>'+bootstrap+'</script>',token,csp);
}

export function buildPreviewDocument(language,code,token){
 if(!validLanguage(language)||language==="csharp")throw Error("No browser preview for this language.");
 validateSource(code);
 if(typeof token!=="string"||!/^[a-f0-9-]{10,80}$/i.test(token))throw Error("Invalid preview token.");
 if(language==="python")return pythonFrame(code,token);
 if(language==="typescript")return typescriptFrame(code,token);
 if(language==="python-turtle")return turtleFrame(code,token);
 if(language==="javascript"){
  return shell('<canvas id="art" width="960" height="540"></canvas>',STYLE,
   '<script>try{\n'+safeScript(code)+'\n}catch(error){window.__cqRuntimeError=true;window.__cqSend("fatal",error.stack||String(error))}</script>'+
   '<script>if(!window.__cqRuntimeError)window.__cqSend("done","JavaScript loaded; animations may continue.");</script>',token);
 }
 if(language==="css"){
  return shell('<div id="display"><h1>Style this page</h1><p>Your CSS controls this preview.</p><button>Hover me ✦</button><div class="heart">♥</div></div>',STYLE+'\n'+safeScript(code),
   '<script>window.__cqSend("done","CSS loaded.");</script>',token);
 }
 return shell(code,STYLE,'<script>window.__cqSend("done","HTML loaded.");</script>',token);
}
