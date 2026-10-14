import {useState} from 'react';
import {practiceQuestion,practiceTopics,readPractice} from '../lib/continuous-practice.mjs';
import {localDay,type Progress} from '../lib/progress';
import type {UpdateProgress} from './LessonView';
export default function ContinuousPractice({progress,update}:{progress:Progress;update:UpdateProgress}){
 const state=readPractice(progress.drafts['continuous-practice']),q=practiceQuestion(state.index,state.topic);
 const [teach,setTeach]=useState(false);const answered=q.choices.includes(state.choice);
 function persist(next:typeof state){update(p=>({...p,drafts:{...p.drafts,'continuous-practice':JSON.stringify(next)},activity:[...new Set([...p.activity,localDay()])].slice(-365)}));}
 function choose(choice:string){if(answered)return;const right=choice===q.answer;persist({...state,choice,answered:state.answered+1,correct:state.correct+Number(right),recent:[...state.recent,right].slice(-20)});}
 return <article className="settings-card continuous-practice" aria-label="Continuous C# practice"><p className="eyebrow">START SMALL · KEEP GOING</p><h2>Practice without a finish line</h2>
 <p>Original revision exercises for C# and Units 1–7 concepts. These are practice, not predicted UJ exam questions. Concepts repeat with variations so you can improve.</p>
 <details><summary>New to C#? Your first 30 minutes</summary><ol><li>5 minutes: int stores whole numbers, string stores text, and = assigns a value.</li><li>10 minutes: predict output, following one line at a time.</li><li>5 minutes: practise input validation and Click events.</li><li>10 minutes: solve and run “Split the bill” below. Fix one thing and retest.</li></ol><p>Then practise strings, files and objects. Read every explanation, including answers you got right.</p></details>
 <label>Revision topic<select value={state.topic} onChange={e=>{persist({...state,topic:Number(e.target.value),choice:''});setTeach(false);}}>{practiceTopics.map((t,i)=><option value={i} key={t}>{t}</option>)}</select></label>
 <p>Question {state.index+1} · {state.correct}/{state.answered} correct on first attempt · Quest: complete your next 5 questions ({state.answered%5}/5).</p>
 <h3>{q.title}</h3><pre><code>{q.code}</code></pre><button onClick={()=>setTeach(!teach)} aria-expanded={teach}>Teach me first</button>{teach&&<p>{q.lesson}</p>}
 <div className="practice-choices">{q.choices.map(c=><button key={c} disabled={answered} aria-pressed={state.choice===c} onClick={()=>choose(c)}>{c}</button>)}</div>
 {answered&&<div role="status"><strong>{state.choice===q.answer?'Correct — nice work!':'Good attempt. Let’s trace it.'}</strong><p>Answer: {q.answer}</p><p>{q.explanation}</p><button onClick={()=>{persist({...state,index:(state.index+1)%1e9,choice:''});setTeach(false);}}>Next practice question →</button></div>}
 <p className="muted">Your place is saved with your progress on this device. Use Account to back up before changing devices. Repeat practice does not farm leaderboard XP.</p></article>;
}
