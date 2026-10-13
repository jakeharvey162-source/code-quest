import {useEffect,useRef,useState} from "react";
import {Play,Square,Download,Upload,Share2,Expand,Minimize2,Heart,Terminal,Code2,RotateCcw,ShieldCheck} from "lucide-react";
import {TERMINAL_EXAMPLES,exampleFor} from "../lib/terminal-examples.mjs";
import {missionsFor,torDebugTip} from "../lib/terminal-mentor.mjs";
import "../terminal-mentor.css";
import {buildPreviewDocument,encodeSharedProgram,decodeSharedProgram,validLanguage,validateSource} from "../lib/terminal-sandbox.mjs";
import {runCSharp,cancelRun} from "../lib/compiler";
import {download} from "../lib/download";
import {readText,writeText} from "../lib/local-data";
import {requestQuest} from "../lib/workshop-quests.mjs";
import {outputKind,languageMismatch,noOutputHint} from "../lib/terminal-output.mjs";
import {terminalCSharpSource,terminalStdout} from "../lib/terminal-input.mjs";
type Language="javascript"|"typescript"|"html"|"css"|"python"|"python-turtle"|"csharp";
type Line={kind:string;text:string};
type Session={token:string;doc:string};
const LABELS:Record<Language,string>={javascript:"JavaScript + Canvas",typescript:"TypeScript + Canvas",html:"HTML + interactive page",css:"CSS animations",python:"Python console","python-turtle":"Python Turtle graphics",csharp:"C# console"};
const EXT:Record<Language,string>={javascript:"js",typescript:"ts",html:"html",css:"css",python:"py","python-turtle":"py",csharp:"cs"};
const MINIMUM_SOURCE=1;
const MAX_LINES=130;
function initialLanguage():Language{
 const value=readText("cq-terminal-language","javascript");
 return validLanguage(value)?value as Language:"javascript";
}
function initialSource(language:Language):string{
 return readText("cq-terminal-source-"+language,exampleFor(language)?.source||"");
}
export default function UniversalTerminal({sharedCode}:{sharedCode?:string}){
 const [language,setLanguage]=useState<Language>(initialLanguage);
 const [source,setSource]=useState(()=>initialSource(initialLanguage()));
 const [exampleId,setExampleId]=useState(()=>exampleFor(initialLanguage())?.id||"");
 const [consoleLines,setConsoleLines]=useState<Line[]>([]);
 const [status,setStatus]=useState("Ready · select a program and press Run.");
 const [running,setRunning]=useState(false);
 const [full,setFull]=useState(false);
 const [session,setSession]=useState<Session|null>(null);
 const [shareUrl,setShareUrl]=useState("");
 const [standardInput,setStandardInput]=useState(()=>readText("cq-terminal-input",""));
 useEffect(()=>{writeText("cq-terminal-input",standardInput)},[standardInput]);
 const [previewKind,setPreviewKind]=useState<"text"|"visual">("visual");
 const [languageNotice,setLanguageNotice]=useState<{language:string|null;label:string;message:string}|null>(null);
 const [lastRunFinished,setLastRunFinished]=useState(false);
 const [missionIndex,setMissionIndex]=useState(0);
 const [showMissionHint,setShowMissionHint]=useState(false);
 const iframeRef=useRef<HTMLIFrameElement>(null);
 const resultsRef=useRef<HTMLDivElement>(null);
 const tokenRef=useRef("");
 const runRef=useRef(0);
 const timerRef=useRef<ReturnType<typeof setTimeout>|null>(null);
 const busyRef=useRef(false);
 const errorRef=useRef(false);
 const fatalRef=useRef(false);
 const langRef=useRef<Language>(language);
 const exampleRef=useRef(exampleId);
 const fileRef=useRef<HTMLInputElement>(null);
 function clearTimer(){if(timerRef.current){clearTimeout(timerRef.current);timerRef.current=null}}
 function append(kind:string,text:string){
  setConsoleLines(prev=>[...prev,{kind,text:String(text).slice(0,5000)}].slice(-MAX_LINES));
 }
 function stop(){
  runRef.current++;
  fatalRef.current=false;
  tokenRef.current="";
  clearTimer();
  cancelRun();
  setSession(null);
  setRunning(false);busyRef.current=false;
  setStatus("Stopped. Your editor contents are safe.");
 }
 function changeLanguage(next:Language){
  stop();
  setLanguage(next);setSource(initialSource(next));setExampleId(exampleFor(next)?.id||"");
  setLanguageNotice(null);setLastRunFinished(false);
  setMissionIndex(0);setShowMissionHint(false);
  setConsoleLines([]);setShareUrl("");
  writeText("cq-terminal-language",next);
  setStatus("Switched to "+LABELS[next]+". Press Run.");
 }
 function edit(value:string){
  if(value.length>60000){setStatus("Source too long — keep code under 60,000 characters.");return}
  setSource(value);writeText("cq-terminal-source-"+language,value);setShareUrl("");
  setLanguageNotice(null);setExampleId("");setLastRunFinished(false);
 }
 function selectExample(nextId:string){
  const example=exampleFor(language,nextId);
  if(!example)return;
  stop();setExampleId(nextId);setSource(example.source);
  writeText("cq-terminal-source-"+language,example.source);
  setLanguageNotice(null);setLastRunFinished(false);setShareUrl("");
  setConsoleLines([]);setStatus("Loaded "+example.title+". Edit it or press Run.");
 }
 async function run(){
  if(busyRef.current)return;
  if(source.trim().length<MINIMUM_SOURCE){
   setConsoleLines([{kind:"warn",text:"Enter some code, then press Run."}]);
   setStatus("Nothing to run yet.");return;
  }
  try{validateSource(source)}catch(error){setConsoleLines([{kind:"error",text:String(error)}]);setStatus("Code could not be started.");return}
  const mismatch=languageMismatch(language,source);
  if(mismatch){
   setConsoleLines([{kind:"error",text:mismatch.message}]);
   setLanguageNotice(mismatch);setSession(null);setLastRunFinished(false);
   setStatus("The selected runtime cannot execute this source. "+mismatch.label+" detected.");
   window.setTimeout(()=>resultsRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),50);
   return;
  }
  setLanguageNotice(null);setLastRunFinished(false);setPreviewKind(outputKind(language,source));
  const id=++runRef.current;
  errorRef.current=false;fatalRef.current=false;langRef.current=language;exampleRef.current=exampleId;
  busyRef.current=true;setRunning(true);
  setConsoleLines([]);
  setSession(null);
  setStatus("Starting "+LABELS[language]+"...");
  window.setTimeout(()=>resultsRef.current?.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"}),120);
  if(language==="csharp"){
   try{
    const prepared=terminalCSharpSource(source,standardInput);
    const raw=await runCSharp(prepared.source,text=>{if(id===runRef.current)setStatus(text)});
    const result={...raw,stdOut:terminalStdout(raw.stdOut,prepared.marker)};
    if(id!==runRef.current)return;
    setConsoleLines(
      [...(result.stdOut?[{kind:"log",text:result.stdOut}]:[]),
       ...(result.stdErr?[{kind:"error",text:result.stdErr}]:[]),
       ...(!result.success?result.diagnostics.map(d=>({kind:"error",text:d.id+": "+d.message})):[])]
      .slice(-MAX_LINES));
    setLastRunFinished(true);
    if(result.success&&!result.stdOut?.trim()&&!result.stdErr?.trim())setConsoleLines([{kind:"info",text:noOutputHint("csharp")}]);
    setStatus(result.success?"C# finished. Output displayed above.":"Compilation failed — check the errors above.");
    if(result.success)requestQuest("creator-first-run");
   }catch(error){if(id===runRef.current){append("error",error instanceof Error?error.message:"C# failed");setLastRunFinished(true);setStatus("C# run failed. See output.");}}
   finally{if(id===runRef.current){setRunning(false);busyRef.current=false;}}
   return;
  }
  const token=crypto.randomUUID();
  tokenRef.current=token;
  try{
   const doc=buildPreviewDocument(language,source,token,location.origin,standardInput);
   setSession({token,doc});
   setStatus(language==="python"?"Preparing isolated Python runtime...":language==="typescript"?"Loading TypeScript compiler for isolated preview...":"Preview running.");
   const ms=language==="python"||language==="python-turtle"||language==="typescript"?90000:14000;
   clearTimer();
   timerRef.current=setTimeout(()=>{
    if(tokenRef.current!==token)return;
    // HTML/CSS/JS animation can continue. Python must stop if the runtime stalls.
    if(language==="python"||language==="python-turtle"||language==="typescript"){
      setSession(null);tokenRef.current="";append("error",language==="typescript"?"TypeScript compiler timed out after 90 seconds.":"Python timed out after 90 seconds; program stopped.");setStatus(language==="typescript"?"TypeScript compiler timed out.":"Python runtime timed out.");
    }else{
      setStatus("Preview active. Animations continue until Stop.");
    }
    setRunning(false);busyRef.current=false;setLastRunFinished(true);
   },ms);
  }catch(error){
   append("error",error instanceof Error?error.message:"Preview failed.");
   setStatus("Could not start the preview.");setLastRunFinished(true);setRunning(false);busyRef.current=false;
  }
 }
 useEffect(()=>{
  function receive(event:MessageEvent){
   const data=event.data;
   if(event.source!==iframeRef.current?.contentWindow||
      !data||data.channel!=="cq-terminal"||data.token!==tokenRef.current)return;
   if(!["log","info","warn","error","fatal","status","done"].includes(data.kind))return;
   if(typeof data.text!=="string")return;
   if(data.kind==="fatal"){
    if(fatalRef.current)return;
    fatalRef.current=true;
    errorRef.current=true;
    append("error",data.text);
    clearTimer();setRunning(false);busyRef.current=false;setLastRunFinished(true);
    setStatus(langRef.current==="typescript"?"TypeScript stopped after an error. Check the console and try again.":langRef.current==="javascript"?"JavaScript stopped after an error. Fix the code and press Run again.":"Python stopped after an error. Check the console, fix the code, then Run again.");
    return;
   }
   if(fatalRef.current)return;
   if(data.kind==="error")errorRef.current=true;
   if(data.kind==="status"||data.kind==="done"){
    setStatus(data.kind==="done"&&errorRef.current?"Completed with errors — review the console.":data.text.slice(0,300));
    if(data.kind==="done"){
     if(!errorRef.current){
      setConsoleLines(prev=>prev.length?prev:[{kind:"info",text:noOutputHint(langRef.current)}]);
      requestQuest("creator-first-run");
      if((exampleRef.current==="heart"||exampleRef.current==="birthday")&&["javascript","python-turtle"].includes(langRef.current))requestQuest("creator-heart");
     }
     clearTimer();setRunning(false);busyRef.current=false;setLastRunFinished(true)
    }
   }else append(data.kind,data.text);
  }
  window.addEventListener("message",receive);
  return()=>window.removeEventListener("message",receive);
 },[]);
 useEffect(()=>()=>{
  tokenRef.current="";clearTimer();cancelRun();runRef.current++;
 },[]);
 useEffect(()=>{
  if(!sharedCode)return;
  try{
   const shared=decodeSharedProgram(sharedCode);
   stop();
   setLanguage(shared.language as Language);setSource(shared.source);
   setMissionIndex(0);setShowMissionHint(false);
   setExampleId("");setConsoleLines([]);
   setStatus("Shared program loaded. Review the code, then press Run.");
   // Never auto-execute code from a link.
  }catch(error){setStatus(error instanceof Error?error.message:"Share link is invalid.")}
 },[sharedCode]);
 useEffect(()=>{
  function hotkey(e:KeyboardEvent){
   if(e.key==="F5"||(e.key==="Enter"&&(e.ctrlKey||e.metaKey))){
    e.preventDefault();if(!busyRef.current)void run();
   }else if(e.shiftKey&&e.key==="Escape"){e.preventDefault();stop()}
  }
  window.addEventListener("keydown",hotkey);
  return()=>window.removeEventListener("keydown",hotkey);
 },[source,language]);
 async function importFile(file:File|undefined){
  if(!file)return;
  if(file.size>120000){setStatus("File is too large. Limit 120 KB.");return}
  const extension=file.name.split(".").pop()?.toLowerCase()||"";
  const next=(extension==="py"&&/\b(import\s+turtle|from\s+turtle\s+import)\b/.test(await file.text()))?"python-turtle":(Object.keys(EXT) as Language[]).find(key=>EXT[key]===extension);
  if(!next){setStatus("Supported file types: .js, .ts, .html, .css, .py, .cs");return}
  try{
   const text=await file.text();validateSource(text);
   changeLanguage(next);setSource(text);writeText("cq-terminal-source-"+next,text);
   setExampleId("");setStatus("Imported "+file.name+". Review it and press Run.");
  }catch(error){setStatus(error instanceof Error?error.message:"Import failed.")}
  if(fileRef.current)fileRef.current.value="";
 }
 async function share(){
  try{
   const encoded=encodeSharedProgram(language,source);
   const url=location.origin+location.pathname+"#terminal/share/"+encoded;
   setShareUrl(url);
   requestQuest("creator-share");
   try{await navigator.clipboard.writeText(url);setStatus("Runnable link copied. The recipient must press Run to start it.")}
   catch{setStatus("Copy the share link below. Your program will not run automatically.")}
  }catch(error){setShareUrl("");setStatus(error instanceof Error?error.message:"Could not share.")}
 }
 const canPreview=language!=="csharp";
 function keepCodeSwitch(next:Language){
  stop();setLanguage(next);writeText("cq-terminal-language",next);
  writeText("cq-terminal-source-"+next,source);setExampleId("");
  setLanguageNotice(null);setConsoleLines([]);setLastRunFinished(false);
  setStatus("Switched to "+LABELS[next]+". Your pasted code is preserved. Press Run to see its output.");
 }
 const missions=missionsFor(language);
 const mission=missions.length?missions[missionIndex%missions.length]:null;
 return <section className={"cq-terminal-page "+(full?"cq-terminal-full":"")} aria-label="Universal coding terminal">
  <div className="cq-terminal-heading">
   <div><p className="cq-terminal-overline"><Terminal size={14}/> CODEQUEST / CODE TERMINAL</p>
    <h1>Code Terminal</h1>
    <p>Write, run and share something unforgettable. No Visual Studio installation required.</p></div>
   <button type="button" onClick={()=>setFull(x=>!x)} aria-label={full?"Exit expanded terminal":"Expand terminal"}>
    {full?<Minimize2 size={18}/>:<Expand size={18}/>} {full?"Exit full view":"Expand"}</button>
  </div>
  <div className="cq-terminal-topbar">
   <div className="cq-terminal-dots"><span/><span/><span/></div>
   <strong>~ / CodeQuest / Terminal</strong>
   <span className="cq-terminal-live"><span/> {running?"RUNNING":"READY"}</span>
  </div>
  <div className="cq-terminal-toolbar">
   <label>Language
    <select aria-label="Terminal programming language" value={language} onChange={e=>changeLanguage(e.target.value as Language)}>
     {(Object.keys(LABELS) as Language[]).map(id=><option key={id} value={id}>{LABELS[id]}</option>)}
    </select>
   </label>
   <label>Example
    <select aria-label="Terminal example" value={exampleId} onChange={e=>selectExample(e.target.value)}>
     {!exampleId&&<option value="">Shared or imported code</option>}
     {(TERMINAL_EXAMPLES[language]||[]).map(item=><option key={item.id} value={item.id}>{item.title}</option>)}
    </select>
   </label>
   <div className="cq-terminal-actions">
    <button className="cq-terminal-run" onClick={()=>void run()} disabled={running} aria-label="Run terminal code"><Play size={18}/> Run <small>F5</small></button>
    <button onClick={stop} aria-label="Stop terminal code"><Square size={16}/> Stop</button>
    <button type="button" onClick={()=>resultsRef.current?.scrollIntoView({behavior:"smooth",block:"start"})} aria-label="Show code output"><Terminal size={16}/> Show output</button>
    <button onClick={()=>{if(confirm("Replace your code with the starter example?"))selectExample(exampleFor(language)?.id||"")}} aria-label="Reset to example"><RotateCcw size={16}/> Reset</button>
   </div>
  </div>
  {mission&&<section className="cq-terminal-mentor" aria-label="Tor coding side quest">
   <div>
    <span className="cq-tor-kicker">TOR // DAILY SIDE QUEST</span>
    <h2>{mission.title}</h2>
    <p>{mission.task}</p>
    <p className="cq-tor-guidance">{torDebugTip(language,source,consoleLines.some(line=>line.kind==="error"))}</p>
    {showMissionHint&&<p className="cq-tor-hint"><strong>Hint:</strong> {mission.hint}</p>}
    <small>Practice challenge · Tor won't claim you passed without checking your code.</small>
   </div>
   <div className="cq-terminal-mentor-actions">
    <button type="button" onClick={()=>setShowMissionHint(x=>!x)} aria-label="Ask Tor for hint">{showMissionHint?"Hide hint":"Ask Tor for hint"}</button>
    <button type="button" onClick={()=>{setMissionIndex(i=>(i+1)%missions.length);setShowMissionHint(false)}} aria-label="Next mission">Next mission →</button>
   </div>
  </section>}
  {languageNotice&&<div className="cq-terminal-language-notice" role="alert">
   <strong>Wrong or unsupported language:</strong> {languageNotice.message}
   {languageNotice.language&&validLanguage(languageNotice.language)&&
    <button type="button" aria-label={"Switch to "+languageNotice.label+" preserving code"} onClick={()=>keepCodeSwitch(languageNotice.language as Language)}>
      Switch to {languageNotice.label} (keep code)
    </button>}
  </div>}
  <div className="cq-terminal-workspace">
   <div className="cq-terminal-source">
    <div className="cq-terminal-panel-title"><Code2 size={16}/> {language==="html"?"index.html":language==="typescript"?"main.ts":language==="csharp"?"Program.cs":language==="python"||language==="python-turtle"?"main.py":language==="css"?"styles.css":"main.js"}<span>EDITOR</span></div>
    <label className="cq-terminal-editor-label" htmlFor="cq-universal-code">Code editor</label>
    <textarea id="cq-universal-code" className="cq-terminal-editor" aria-label="Terminal code editor" spellCheck={false}
      value={source} onChange={e=>edit(e.target.value)} autoCapitalize="off" autoCorrect="off"/>
    {(language==="python"||language==="csharp")&&<label className="cq-standard-input">Standard input · one answer per line
     <textarea aria-label="Terminal standard input" rows={3} maxLength={20000} value={standardInput} disabled={running} onChange={e=>setStandardInput(e.target.value)} placeholder="Inputs for input() or Console.ReadLine(), supplied before Run"/>
     <small>Each input() / Console.ReadLine() reads the next line. Supply answers before Run.</small>
    </label>}
    <div className="cq-terminal-footer">
     <label className="cq-terminal-file-button"><Upload size={16}/> Open a code file
      <input ref={fileRef} type="file" aria-label="Import terminal code file" accept=".js,.ts,.html,.css,.py,.cs,text/plain" onChange={e=>void importFile(e.target.files?.[0])}/>
     </label>
     <button onClick={()=>download("CodeQuestProgram."+EXT[language],source,"text/plain")}><Download size={16}/> Download</button>
     <button onClick={()=>void share()}><Share2 size={16}/> Share code</button>
    </div>
   </div>
   <div ref={resultsRef} className="cq-terminal-results" id="code-terminal-output">
    <div className="cq-terminal-panel-title"><Heart size={16}/> OUTPUT <span>{canPreview?"GRAPHICS + CONSOLE":"CONSOLE"}</span></div>
    <div className="cq-terminal-visual" aria-label="Program visual preview">
     {session&&canPreview?<div className={"cq-terminal-stage "+(previewKind==="text"?"cq-terminal-text-stage":"")}>
       <iframe key={session.token} ref={iframeRef} src="/terminal-frame.html"
        onLoad={()=>iframeRef.current?.contentWindow?.postMessage({channel:"cq-terminal-start",doc:session.doc},"*")}
        title="Isolated program preview" sandbox="allow-scripts" referrerPolicy="no-referrer"/>
       {previewKind==="text"&&<section className="cq-terminal-big-output" aria-label="Visible program output">
         <div className="cq-terminal-big-output-title"><Terminal size={20}/> Your program result</div>
         <pre aria-live="polite">{consoleLines.length?consoleLines.map(x=>x.text).join("\n"):
           running?"Running "+LABELS[language]+" — waiting for output...":
           lastRunFinished?noOutputHint(language):"Press Run to see output here."}</pre>
         <small>Text output appears here immediately. For graphics, choose a visual example.</small>
       </section>}
     </div>:
      language==="csharp"?<div className="cq-terminal-csharp-preview">
        <h2>C# console output</h2>
        <pre aria-label="C# visible result">{consoleLines.length?consoleLines.map(item=>item.text).join("\n"):(running?"Compiling and running your C# program...":"Press Run to see the result here.")}</pre>
        <p>Console programs display here. Native Windows Forms windows still need Windows and .NET.</p>
      </div>:
      <div className="cq-terminal-awaiting"><span>✦</span><h2>Your preview appears here.</h2><p>Press Run to see what your program does.</p></div>}
    </div>
    <div className="cq-terminal-console-head"><Terminal size={15}/> Console <span>stdout / errors / status</span></div>
    <pre className="cq-terminal-console" role="log" aria-label="Terminal console output" aria-live="polite">{consoleLines.length?consoleLines.map((line,index)=>
      <span key={index} className={"cq-terminal-line cq-terminal-"+line.kind}>{line.kind==="error"?"✕ ":"› "}{line.text}{"\n"}</span>
     ):<span className="cq-terminal-line-muted">› No output yet. Logs and compiler errors will appear here.</span>}</pre>
   </div>
  </div>
  <p className="cq-terminal-status" role="status">{status}</p>
  {shareUrl&&<label className="cq-terminal-share">Shareable link (code only; never auto-runs)<input aria-label="Shareable terminal code link" readOnly value={shareUrl} onFocus={e=>e.currentTarget.select()}/></label>}
  <div className="cq-terminal-guidance"><ShieldCheck size={18}/><p>
   Code runs locally in your browser. Web programs run in an isolated preview without access to your CodeQuest files or login; Python loads its bundled open-source runtime on demand; Python Turtle uses the open-source Skulpt graphics interpreter. TypeScript loads a bundled pinned compiler into an isolated preview on first run. C# uses CodeQuest's existing real compiler. This is not a full desktop operating-system terminal: installed packages, tkinter, pygame, native WinForms and other languages need their own runtime. <strong>Review unknown code before running it; never paste passwords or private keys.</strong></p></div>
 </section>;
}
