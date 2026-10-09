import test from 'node:test';
import assert from 'node:assert/strict';
import {MAPS} from '../shared/maps';
import {Room} from '../server/room';
import {initPhysics} from '../server/physics';
import {ANIMALS} from '../shared/config';
import {createAnimal} from '../client/rendering/animals';
import * as T from 'three';
import {parseMessage} from '../shared/protocol';
await initPhysics();
test('host map selection is authoritative, validates IDs, locks during a match and preserves collision geometry',()=>{
 const r=new Room('MAPS2');try{const a=r.add('A','goat','dust'),b=r.add('B','cow','wind');const count=r.physics.world.colliders.len();for(const map of MAPS){a.ready=true;b.ready=true;assert.throws(()=>r.selectMap(b.id,map.id),/host/);r.selectMap(a.id,map.id);assert.equal(r.snapshot().mapId,map.id);assert.equal(a.ready,false);assert.equal(r.physics.world.colliders.len(),count);}assert.equal(parseMessage(JSON.stringify({type:'map',mapId:'ice-slippery'})),null);r.phase='PLAYING';assert.throws(()=>r.selectMap(a.id,'barnyard'),/lobby/);}finally{r.physics.dispose();}
});
test('all animals have three decreasing skinned LODs and a compact named skeleton',()=>{for(const kind of ANIMALS){const a=createAnimal(kind);assert.equal(a.lod.levels.length,3);assert.ok(a.skeleton.bones.length>=11&&a.skeleton.bones.length<25);for(const name of ['root','spine','head','neck','tail'])assert.ok(a.skeleton.bones.some(b=>b.name===name));const counts=a.lod.levels.map(l=>{const skin=l.object as T.SkinnedMesh;assert.ok(skin.isSkinnedMesh);assert.equal(skin.skeleton,a.skeleton);return skin.geometry.attributes.position.count/3;});assert.ok(counts[0]<=35000);assert.ok(counts[0]>counts[1]&&counts[1]>counts[2]);console.log('LOD',kind,counts);}});
