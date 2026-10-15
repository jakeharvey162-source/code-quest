import test from 'node:test';import assert from 'node:assert/strict';
import {lessonSummary,workspaceSummary,explainProblem} from '../src/lib/tor-summary.mjs';
test('Tor explains a known compiler problem without replaying raw output',()=>{const raw='CS0103: SecretDraftName does not exist\n'+ 'private example '.repeat(100);const reply=explainProblem(raw);assert.match(reply,/CS0103.*spelling/);assert.doesNotMatch(reply,/SecretDraftName/);assert.ok(reply.length<240);});
test('Tor teaches a concept and a next action without leaking the challenge solution',()=>{assert.match(lessonSummary('variables',1),/labelled box.*Trace/);assert.match(lessonSummary('loops',4),/stopping condition.*new problem/);assert.match(workspaceSummary({page:'designer',mode:'Designing Form1',controls:1,selected:'lblAnswer',issues:[],output:''}),/Text is the message/);assert.match(workspaceSummary(null,'challenges'),/fixing the logic/);});

test('workspace explanation identifies the selected control and its current visible caption',()=>{
 const reply=workspaceSummary({page:'designer',mode:'Designing Form1',controls:1,selected:'lblStudentName',caption:'Student Name',issues:[],output:''});
 assert.match(reply,/lblStudentName/);assert.match(reply,/Student Name/);assert.match(reply,/Text is the message/);
});
