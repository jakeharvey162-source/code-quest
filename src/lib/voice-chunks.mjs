/** Small read-aloud chunks prevent long mobile speech utterances from stalling. */
export function speechChunks(value, max=190) {
 const limit=Math.max(80,Math.min(280,Math.floor(max)||190));
 const text=String(value??"").replace(/\s+/g," ").trim().slice(0,5000);
 if(!text)return [];
 const result=[];let remainder=text;
 while(remainder.length>limit){
  const segment=remainder.slice(0,limit+1);
  const sentence=Math.max(segment.lastIndexOf(". "),segment.lastIndexOf("! "),segment.lastIndexOf("? "));
  let cut=sentence>limit/3?sentence+1:segment.lastIndexOf(" ");
  if(cut<=0||cut<limit/3)cut=limit;
  result.push(remainder.slice(0,cut).trim());
  remainder=remainder.slice(cut).trimStart();
 }
 if(remainder)result.push(remainder);
 return result;
}
