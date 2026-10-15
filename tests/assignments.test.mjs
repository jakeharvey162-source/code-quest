import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sharedTaskIds,assignmentTask} from '../src/lib/assignments.mjs';
test('shared progress includes known practised repairs but never code or conversation drafts',()=>{
 const ids=sharedTaskIds({completed:['variables'],drafts:{'repair-complete-equipment-booking':'yes','repair-complete-fake':'yes','repair-code-equipment-booking':'private code','tor-study-history':'private chat'}});
 assert.deepEqual(ids,['variables','repair:equipment-booking']);
 assert.equal(assignmentTask('repair:equipment-booking').route,'challenges/equipment-booking');
 assert.equal(assignmentTask('unknown'),undefined);
});
