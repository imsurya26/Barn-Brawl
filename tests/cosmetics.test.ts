import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {ANIMALS,BOOSTS} from '../shared/config';
import {BoostEffects} from '../client/effects/boost';
import {createAnimal,animateAnimal} from '../client/rendering/animals';
test('all boost presets emit and expire using a bounded reusable particle pool',()=>{
 const scene=new T.Scene(),effects=new BoostEffects(scene);
 assert.equal(effects.pool.length,220);
 for(const style of BOOSTS){effects.emit(new T.Vector3(0,2,0),0,style.id,style.boostStartEffect);const active=effects.pool.filter(p=>p.style===style.id&&p.life>0);assert.ok(active.length>0);for(const p of active){assert.equal(p.mesh.geometry,effects.geometries[style.particlePreset]);assert.ok(p.mesh.visible);}}
 for(let i=0;i<1000;i++)effects.emit(new T.Vector3(),0,'dust',3);assert.equal(scene.children.length,220);effects.update(5);assert.ok(effects.pool.every(p=>!p.mesh.visible));
});
test('all four procedural animals animate grounded, airborne, boosting, dodging and celebrating',()=>{
 for(const kind of ANIMALS){const animal=createAnimal(kind);for(const flags of [[true,false,false,false],[true,true,false,false],[false,false,true,false],[true,false,false,true]]){animateAnimal(animal,2,15,flags[1],flags[0],flags[2],flags[3]);animal.root.updateMatrixWorld(true);animal.root.traverse(o=>assert.ok(o.matrixWorld.elements.every(Number.isFinite)));}assert.ok(animal.legs.length>=2);assert.ok(animal.ears.length>=2);}
});
