/** @param {string} key @param {any} fallback @param {(value:any)=>boolean} accept */
export function readJSON(key,fallback,accept=(_value)=>true){try{const raw=localStorage.getItem(key);if(raw===null)return fallback;const value=JSON.parse(raw);return accept(value)?value:fallback;}catch{return fallback;}}
export function saveValue(key,value){try{localStorage.setItem(key,value);return true;}catch{return false;}}

export function readValue(key,fallback){try{return localStorage.getItem(key)??fallback;}catch{return fallback;}}
