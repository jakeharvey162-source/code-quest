let module;
self.onmessage=async(event)=>{
 try{
  if(!module){self.postMessage({type:'status',text:'Loading the C# compiler…'});const runtime=await import(/* @vite-ignore */ '/compiler/index.js');module=await runtime.WasmSharpModule.initializeAsync({disableWebWorker:false,onDownloadResourceProgress:(loaded,total)=>self.postMessage({type:'status',text:`Loading compiler ${loaded}/${total}…`})});}
  self.postMessage({type:'running'});
  const compilation=await module.createCompilationAsync(event.data.code);
  const result=await compilation.run();
  self.postMessage({type:'result',result:{...result,stdOut:result.stdOut?.slice(0,20000),stdErr:result.stdErr?.slice(0,20000)}});
 }catch(error){self.postMessage({type:'error',message:error instanceof Error?error.message:String(error)});}
};
