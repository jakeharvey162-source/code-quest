/** Lightweight movement choreography for CodeQuest's existing CC0 Tor 3D model. */
export const TOR_REACTIONS=Object.freeze({
  highfive:{clip:"ThumbsUp",title:"High five!",duration:2.5},
  dance:{clip:"Dance",title:"Dance break!",duration:3.5},
  celebrate:{clip:"Jump",title:"Level-up energy!",duration:2.4},
  nope:{clip:"No",title:"Debug detective",duration:2.1},
  wow:{clip:"Wave",title:"Hey, look at that!",duration:2.2},
});
export function clipForMood(mood){
  return ({happy:"ThumbsUp",concerned:"No",cheeky:"Dance",listening:"Yes",thinking:"Idle",speaking:"Yes",ready:"Wave"})[mood]||"Idle";
}
export function chooseTorReaction(kind){
 return TOR_REACTIONS[kind]||TOR_REACTIONS.wow;
}
/** Browser TTS rarely provides phonemes or audio samples. Mouth motion is approximate. */
export function mouthLevel(seconds, speaking, beat=0, reduced=false){
 if(!speaking)return 0;
 if(reduced)return 0.34;
 const t=Number.isFinite(seconds)?seconds:0;
 const n=Number.isFinite(beat)?beat:0;
 const vowel=Math.abs(Math.sin(t*10.7+n*0.43));
 const syllable=Math.abs(Math.sin(t*17.8+n*0.91));
 return Math.max(0.14,Math.min(0.97,0.12+0.52*vowel+0.28*syllable));
}
export function reactionLine(kind,locale="en-ZA"){
 const lines={
  highfive:{"en-ZA":"High five! You did the work; I provide the tiny robot applause.","fr-FR":"Tape m'en cinq ! Tu as fait le travail, je fournis les applaudissements.","zu-ZA":"Sishayisane izandla! Wenze umsebenzi omuhle.","pt-PT":"Dá cá cinco! Fizeste o trabalho e eu bato palmas.","sw-KE":"Piga tano! Umefanya kazi nzuri; sasa jaribu changamoto nyingine."},
  dance:{"en-ZA":"My dance compiler has zero errors. My dancing, however, needs debugging.","fr-FR":"Mon code de danse marche. Mes pas méritent encore du débogage.","zu-ZA":"Ikhodi yami yokudansa iyasebenza. Kodwa mina ngisafunda ukudansa!","pt-PT":"O meu código de dança funciona. Os meus passos precisam de depuração.","sw-KE":"Msimbo wangu wa kucheza unafanya kazi. Miguu yangu inahitaji kusahihishwa!"},
  celebrate:{"en-ZA":"Achievement energy! Now prove your code handles the tricky input too.","fr-FR":"Bravo ! Maintenant, teste aussi une entrée difficile.","zu-ZA":"Halala! Manje hlola ikhodi yakho nangokufaka okunzima.","pt-PT":"Muito bem! Agora testa também um valor difícil.","sw-KE":"Hongera! Sasa jaribu pia data ngumu kwenye msimbo wako."},
  nope:{"en-ZA":"Plot twist: the bug wins this round. Read the first error. Rematch in three, two, one.","fr-FR":"Le bogue gagne ce tour. Lis la première erreur, puis réessaie.","zu-ZA":"Iphutha linqobile kulokhu. Funda iphutha lokuqala, uphinde uzame.","pt-PT":"O erro venceu esta ronda. Lê a primeira mensagem e tenta outra vez.","sw-KE":"Hitilafu imeshinda raundi hii. Soma kosa la kwanza, kisha jaribu tena."},
  wow:{"en-ZA":"Plot twist: I'm not just a floating help button. Ask me to explain a loop!","fr-FR":"Surprise ! Je suis aussi là pour expliquer les boucles.","zu-ZA":"Hhawu! Ngikhona ukukusiza ufunde ama-loop.","pt-PT":"Surpresa! Também posso explicar ciclos.","sw-KE":"Ajabu! Ninaweza pia kufundisha loops."}
 };
 return lines[kind]?.[locale]||lines[kind]?.["en-ZA"]||lines.wow["en-ZA"];
}
