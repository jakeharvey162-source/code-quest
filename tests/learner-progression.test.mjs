import test from "node:test";
import assert from "node:assert/strict";
import { learningLevels, pathLessons } from "../src/lib/learning-path.ts";
import { validAvatar } from "../src/lib/profile.ts";
import { freshProgress, migrateProgress } from "../src/lib/progress.ts";
import { lessons } from "../src/curriculum.ts";
test("easy through advanced cover every lesson once and pro leads to system projects",()=>{
 const ids=learningLevels.flatMap(l=>l.ids);
 assert.equal(new Set(ids).size,21);assert.deepEqual(new Set(ids),new Set(lessons.map(l=>l.id)));
 assert.equal(pathLessons("easy")[0].id,"variables");assert.equal(pathLessons("pro").length,0);
});
test("old backups receive profile and level defaults while unsafe images are rejected",()=>{
 const p=freshProgress();delete p.settings.nickname;delete p.settings.avatar;delete p.settings.level;
 const upgraded=migrateProgress(p);assert.equal(upgraded.settings.level,"easy");assert.equal(upgraded.settings.avatar,"🤖");
 assert.equal(validAvatar('data:image/svg+xml;base64,PHN2Zz4='),false);
 assert.equal(validAvatar('https://tracking.example/photo.jpg'),false);
 assert.equal(validAvatar('data:image/jpeg;base64,AA=='),true);
 assert.equal(migrateProgress({...upgraded,settings:{...upgraded.settings,level:"fake"}}),null);
});
