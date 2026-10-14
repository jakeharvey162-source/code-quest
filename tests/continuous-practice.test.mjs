import test from 'node:test';import assert from 'node:assert/strict';
import {practiceQuestion,readPractice} from '../src/lib/continuous-practice.mjs';
test('practice questions are deterministic and unambiguous across all topics',()=>{
 for(let topic=0;topic<6;topic++)for(let i=0;i<2000;i++){
 const q=practiceQuestion(i,topic);assert.deepEqual(q,practiceQuestion(i,topic));assert.equal(q.choices.filter(c=>c===q.answer).length,1);assert.ok(q.choices.length>=3);assert.ok(q.explanation.length>30);if(topic)assert.equal(q.topic,topic);
 }
});
test('corrupt practice state recovers and recent history stays bounded',()=>{
 assert.equal(readPractice('{bad').index,0);const p=readPractice(JSON.stringify({index:-1,topic:99,answered:2,correct:3,recent:Array(1000).fill(true)}));assert.equal(p.topic,0);assert.equal(p.correct,0);assert.equal(p.recent.length,20);
});
