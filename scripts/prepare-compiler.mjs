import {cp,mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import path from 'node:path';
const dest='public/compiler';await mkdir(dest,{recursive:true});await cp('node_modules/@wasmsharp/core',dest,{recursive:true});
await cp('node_modules/comlink/dist/esm/comlink.mjs',path.join(dest,'comlink.mjs'));
for(const name of ['WasmCompiler.js','worker.js']){const file=path.join(dest,name);await writeFile(file,(await readFile(file,'utf8')).replaceAll('https://unpkg.com/comlink/dist/esm/comlink.mjs','./comlink.mjs'));}
// Original Apache-2.0 license is shipped alongside the runtime.
console.log('Prepared self-hosted Roslyn runtime (loaded only when code is run).');

const entry=path.join(dest,"index.js");await writeFile(entry,(await readFile(entry,"utf8")).replace('"./WasmCompiler"','"./WasmCompiler.js"'));
// Published framework imports are bundler URL placeholders, not JavaScript modules.
const loader=path.join(dest,'dotnet.js');await writeFile(loader,(await readFile(loader,'utf8')).replace(/import (\w+) from "(\.\/[^"\n]+\.(?:dll|wasm|dat))";/g,(_match,name,url)=>`const ${name} = new URL(${JSON.stringify(url)}, import.meta.url).href;`));
const worker=path.join(dest,'worker.js');await writeFile(worker,(await readFile(worker,'utf8')).replace('"./Compilation"','"./Compilation.js"').replace('"./initializeWasmSharpModule"','"./initializeWasmSharpModule.js"'));
