import RAPIER from '@dimforge/rapier3d-compat';
import {ARENA as A,PLAYER as P,ROCK as R,RULES} from '../shared/config';
import {boundaries,rampSections} from '../shared/arena';
import {attitude,dot,length,normalize,stepMotor,syncAttitude,rotate,scale,plus,cross,type MotorState} from '../shared/controller';
import type {Input,Vec,PhysicsDebug} from '../shared/protocol';
export {RAPIER};
export async function initPhysics(){await RAPIER.init();}

export class ArenaPhysics {
  world=new RAPIER.World({x:0,y:RULES.gravity,z:0});
  rock:RAPIER.RigidBody;
  constructor(){
    this.world.timestep=1/RULES.tick;this.world.numSolverIterations=8;this.world.maxCcdSubsteps=4;
    const surface=(shape:RAPIER.ColliderDesc)=>this.world.createCollider(shape.setFriction(.2).setRestitution(.64).setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Min));
    const wall=(x:number,y:number,z:number,hx:number,hy:number,hz:number,yaw=0)=>surface(RAPIER.ColliderDesc.cuboid(hx,hy,hz).setTranslation(x,y,z).setRotation(attitude(yaw,0,0)));
    wall(0,-.5,0,A.width/2+10,.5,A.length/2+A.goalDepth+3);
    for(const b of boundaries()){
      wall(b.x-b.normal.x*.5,A.wallHeight/2,b.z-b.normal.z*.5,b.length/2+.02,A.wallHeight/2,.5,b.yaw);
      for(const section of rampSections(b)){const shape=RAPIER.ColliderDesc.convexHull(new Float32Array(section.points));if(shape)surface(shape);}
    }
    for(const side of [-1,1]){
      const z=side*A.length/2;
      wall(0,(A.wallHeight+A.goalHeight)/2,z+side*.5,A.goalWidth/2,(A.wallHeight-A.goalHeight)/2,.5);
      for(const x of [-1,1])wall(x*(A.goalWidth/2+.5),A.goalHeight/2,z+side*A.goalDepth/2,.5,A.goalHeight/2,A.goalDepth/2);
      wall(0,A.goalHeight/2,z+side*(A.goalDepth+.5),A.goalWidth/2+1,A.goalHeight/2,.5);
      wall(0,A.goalHeight+.5,z+side*A.goalDepth/2,A.goalWidth/2+1,.5,A.goalDepth/2);
    }
    wall(0,A.ceiling+.5,0,A.width/2+1,.5,A.length/2+A.goalDepth+1);
    this.rock=this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0,R.radius+.05,0).setLinearDamping(R.linearDamping).setAngularDamping(R.angularDamping).setCcdEnabled(true));
    this.world.createCollider(RAPIER.ColliderDesc.ball(R.radius).setMass(R.mass).setFriction(R.friction).setRestitution(R.restitution),this.rock);this.rock.recomputeMassPropertiesFromColliders();
  }
  createPlayer(position:Vec){
    const body=this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(position.x,position.y,position.z).setAdditionalMassProperties(P.mass,{x:0,y:P.centerOfMassY,z:0},P.inertia,{x:0,y:0,z:0,w:1}).setLinearDamping(0).setAngularDamping(0).setCcdEnabled(true));
    this.world.createCollider(RAPIER.ColliderDesc.roundCuboid(P.halfWidth,P.halfHeight,P.halfLength,P.colliderRadius).setDensity(0).setFriction(P.colliderFriction).setFrictionCombineRule(RAPIER.CoefficientCombineRule.Min).setRestitution(0),body);
    body.recomputeMassPropertiesFromColliders();body.setAdditionalSolverIterations(4);return body;
  }
  ground(body:RAPIER.RigidBody,yaw=0){
    const p=body.translation(),q=body.rotation(),up=rotate(q,{x:0,y:1,z:0}),down=scale(up,-1),normal={x:0,y:0,z:0},rays:number[]=[],probes:{point:Vec;normal:Vec;distance:number;velocity:number}[]=[];
    for(const x of [-P.probeX,P.probeX])for(const z of [-P.probeZ,P.probeZ]){
      const origin=plus(p,rotate(q,{x,y:0,z})),end=plus(origin,scale(down,P.suspensionLength));rays.push(origin.x,origin.y,origin.z,end.x,end.y,end.z);
      const hit=this.world.castRayAndGetNormal(new RAPIER.Ray(origin,down),P.suspensionLength,true,undefined,undefined,undefined,body,c=>!c.parent());
      if(hit&&dot(hit.normal,up)>.25){const point=plus(origin,scale(down,hit.timeOfImpact)),weight=Math.max(.01,P.suspensionLength-hit.timeOfImpact);normal.x+=hit.normal.x*weight;normal.y+=hit.normal.y*weight;normal.z+=hit.normal.z*weight;probes.push({point,normal:{...hit.normal},distance:hit.timeOfImpact,velocity:dot(body.velocityAtPoint(point),hit.normal)});}
    }
    return {grounded:probes.length>=2,normal:probes.length?normalize(normal):{x:0,y:1,z:0},contacts:probes.length,rays,probes};
  }
  grounded(body:RAPIER.RigidBody){return this.ground(body).grounded;}
  torque(body:RAPIER.RigidBody,dw:Vec){const i=body.effectiveAngularInertia();body.applyTorqueImpulse({x:i.m11*dw.x+i.m12*dw.y+i.m13*dw.z,y:i.m21*dw.x+i.m22*dw.y+i.m23*dw.z,z:i.m31*dw.x+i.m32*dw.y+i.m33*dw.z},true);}
  drive(body:RAPIER.RigidBody,motor:MotorState,input:Input,dt:number){
    syncAttitude(motor,body.rotation(),body.angvel());const ground=this.ground(body);motor.probeCount=ground.contacts;motor.grounded=ground.grounded&&motor.jumpLock<=0&&dot(body.linvel(),ground.normal)<1.5;
    if(motor.grounded)motor.groundNormal=ground.normal;
    const dv=stepMotor(motor,input,body.linvel(),dt);body.applyImpulse(scale(dv,body.mass()),true);this.torque(body,motor.angularDelta);
    if(motor.grounded){for(const probe of ground.probes){const force=Math.max(0,Math.min(P.maxSpringForce,P.suspensionStiffness*(P.suspensionRest-probe.distance)-P.suspensionDamping*probe.velocity));body.applyImpulseAtPoint(scale(probe.normal,force*dt),probe.point,true);}body.applyImpulse(scale(ground.normal,-P.groundAdhesion*body.mass()*dt),true);}
    // Recovery torque only when stranded close to a surface with probes facing away.
    if(!motor.grounded&&body.translation().y<.7&&motor.airTime>.5&&motor.dodging<=0){const up=rotate(body.rotation(),{x:0,y:1,z:0});if(up.y<.4){let axis=cross(up,{x:0,y:1,z:0});if(length(axis)<.1)axis={x:0,y:0,z:1};this.torque(body,scale(normalize(axis),P.recoveryTorque*dt));}}
  }
  impacts=new Map<number,{touching:boolean;cooldown:number;approach:number;direction:Vec}>();
  beforeStep(players:{body:RAPIER.RigidBody}[],dt:number){for(const {body} of players){const delta=plus(this.rock.translation(),scale(body.translation(),-1)),direction=normalize(delta),relative=plus(body.linvel(),scale(this.rock.linvel(),-1)),old=this.impacts.get(body.handle);this.impacts.set(body.handle,{touching:old?.touching??false,cooldown:Math.max(0,(old?.cooldown??0)-dt),approach:Math.max(0,dot(relative,direction)),direction});}}
  afterStep(players:{body:RAPIER.RigidBody}[]){const hits:number[]=[];for(const {body} of players){const hit=this.impacts.get(body.handle);if(!hit)continue;let touching=false;this.world.contactPair(body.collider(0),this.rock.collider(0),m=>{if(m.numSolverContacts()>0)touching=true;});if(touching&&!hit.touching&&hit.cooldown===0){const dv=Math.min(R.maxImpactDelta,hit.approach*R.impactMultiplier);this.rock.applyImpulse(scale(hit.direction,dv*this.rock.mass()),true);hit.cooldown=R.impactCooldown;hits.push(body.handle);}hit.touching=touching;}return hits;}
  limitRock(dt:number){
    const spin=this.rock.angvel();if(length(spin)>R.maxAngularSpeed){const dw=scale(spin,R.maxAngularSpeed/length(spin)-1);this.torque(this.rock,dw);}
    const v=this.rock.linvel(),speed=length(v);
    if(speed>R.maxSpeed){const target=R.maxSpeed+(speed-R.maxSpeed)*Math.exp(-R.speedLimitResponse*dt),scale=(target/speed-1)*this.rock.mass();this.rock.applyImpulse({x:v.x*scale,y:v.y*scale,z:v.z*scale},true);}
  }
  debug(players:{body:RAPIER.RigidBody;yaw:number}[]):PhysicsDebug{
    const data:PhysicsDebug={vertices:Array.from(this.world.debugRender().vertices),rays:[],velocities:[],contacts:[],normals:[]};
    for(const player of players){const ground=this.ground(player.body);data.rays.push(...ground.rays);for(const p of ground.probes)data.normals!.push(p.point.x,p.point.y,p.point.z,p.point.x+p.normal.x,p.point.y+p.normal.y,p.point.z+p.normal.z);this.world.contactPair(player.body.collider(0),this.rock.collider(0),manifold=>{for(let i=0;i<manifold.numSolverContacts();i++)data.contacts.push({...manifold.solverContactPoint(i)});});}
    for(const body of [this.rock,...players.map(p=>p.body)]){const p=body.translation(),v=body.linvel();data.velocities.push(p.x,p.y,p.z,p.x+v.x*.25,p.y+v.y*.25,p.z+v.z*.25);}
    return data;
  }
  reset(body:RAPIER.RigidBody,position:Vec){body.setTranslation(position,true);body.setLinvel({x:0,y:0,z:0},true);body.setAngvel({x:0,y:0,z:0},true);body.setRotation({x:0,y:0,z:0,w:1},true);}
  dispose(){this.world.free();}
}
