import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze, distanceMeters, duplicates, canTransition } from '../src/civic.js';
test('presentation example is capped at 100 and each factor is visible',()=>{
 const result=analyze({title:'Critical pothole near a school',description:'Dangerous to riders.',category:'roads',severity:'critical'});
 assert.equal(result.score,100);assert.equal(result.reasons.reduce((s,r)=>s+r.points,0),112);assert.equal(result.priority,'Critical');assert.equal(result.department,'Roads & Infrastructure');
});
test('auto category does not confuse streetlight with road or waterlogging with supply',()=>{
 assert.equal(analyze({description:'The streetlight is dark'}).category,'lighting');
 assert.equal(analyze({description:'Waterlogging and blocked drain'}).category,'drainage');
 assert.equal(analyze({description:'A pipeline water leak'}).category,'water');
 assert.equal(analyze({description:'Unrecognized problem'}).category,'other');
});
test('severity is bounded and unknown values fall back safely',()=>{
 assert.equal(analyze({severity:'admin'}).severity,'medium');
 assert.equal(analyze({severity:'low',category:'other'}).score,20);
 assert.equal(analyze({severity:'critical',category:'drainage',description:'unsafe school'}).score,100);
});
test('duplicates use same category and <150m; resolved reports do not block',()=>{
 const report={lat:30.73,lng:76.77,category:'roads'};
 const near={...report,id:'near',status:'Reported'};
 assert.equal(distanceMeters(report,near),0);
 assert.deepEqual(duplicates(report,[near,{...near,id:'resolved',status:'Resolved'},{...near,id:'other',category:'lighting'},{...near,id:'far',lat:31}]).map(i=>i.id),['near']);
 assert.equal(distanceMeters({...report,lat:null},near),Infinity);
 assert.equal(duplicates(report,[{...near,lat:30.73136}]).length,0);
});
test('staff cannot confirm closure and another citizen cannot confirm it',()=>{
 const issue={status:'Awaiting confirmation',reporter_id:'owner'};
 assert.equal(canTransition(issue,'Resolved','staff','other',true),false);
 assert.equal(canTransition(issue,'Resolved','citizen','other',true),false);
 assert.equal(canTransition(issue,'Resolved','citizen','owner',true),true);
 assert.equal(canTransition(issue,'In progress','citizen','owner',true),true);
 assert.equal(canTransition({status:'In progress'},'Awaiting confirmation','staff','staff',false),false);
});
