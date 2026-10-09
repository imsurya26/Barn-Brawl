// Gameplay units are meters, seconds and kilograms. Cosmetics never enter these rules.
export const ARENA = { width:90, length:115, wallHeight:24, goalWidth:22, goalHeight:9, goalDepth:10, cornerCut:12, rampWidth:4, rampHeight:4, ceiling:24 } as const;
export const PLAYER = {
  mass:180, halfWidth:.54, halfHeight:.265, halfLength:.84, colliderRadius:.06, colliderFriction:.02,
  centerOfMassY:-.09, inertia:{x:65,y:75,z:30},
  acceleration:16, accelerationMid:8, accelerationHigh:1.6, maxSpeed:14.1,
  throttleCurve:[[0,16],[14,1.6],[14.1,0]] as readonly (readonly [number,number])[],
  brakeForce:35, reverseAcceleration:16, reverseMaxSpeed:12,
  boostAcceleration:9.92, airBoostAcceleration:10.58, boostMaxSpeed:23, coastDrag:5.25,
  steeringCurve:[[0,1.8],[2.5,1.8],[5,2.5],[7.5,3.2],[10,4.3],[12.5,5.4],[15,7.3],[17.5,9.1],[20,10],[23,11.4]] as readonly (readonly [number,number])[],
  steeringResponse:18, lateralGrip:22, highSpeedGrip:22, maxLateralAccel:65, powerslideGrip:2.2, powerslideYaw:1.35, gripResponse:7,
  groundAdhesion:3, angularStability:48, angularDamping:11,
  probeX:.46, probeZ:.65, suspensionLength:.56, suspensionRest:.49, suspensionStiffness:6500, suspensionDamping:600, maxSpringForce:4000,
  jumpImpulse:2.917, jumpHoldAcceleration:14.6, jumpHoldTime:.2, jumpLock:.12, coyoteTime:.06,
  airYaw:9.1, airPitch:12.5, airRoll:38, airResponse:2.5, airControl:0, maxAngularSpeed:5.5,
  airBoostScale:10.58/9.92, dodgeImpulse:5, dodgeLift:0, dodgeDuration:.65, dodgeWindow:1.25, dodgeAngularSpeed:9.66, dodgeServo:22,
  landingGrip:22, speedSafety:23, speedLimitResponse:25, recoveryTorque:20,
} as const;
export const ROCK = { radius:1.6, mass:30, restitution:.60, friction:.35, linearDamping:.012, angularDamping:.02, maxSpeed:60, maxAngularSpeed:6, speedLimitResponse:24, impactMultiplier:.45, impactCooldown:.12, maxImpactDelta:14 } as const;
export const CAMERA = { distance:12, speedDistance:6, height:6.2, speedHeight:1.7, fov:57, speedFov:7, follow:7, rotationFollow:9 } as const;
export const RULES = { tick:120, snapshotRate:30, ...ARENA, rockRadius:ROCK.radius, duration:300, maxPlayers:4, maxBoost:100, boostDrain:33.3, boostRegen:12, gravity:-6.5, reconnectMs:25000, expiryMs:300000 } as const;
export const ANIMALS = ['goat', 'pig', 'cow', 'chicken'] as const;
export type Animal = typeof ANIMALS[number];
export interface BoostStyle { id: string; displayName: string; color: number; particlePreset: 'puff'|'straw'|'spark'|'wind'|'poop'; trailPreset: number; boostStartEffect: number; boostLoopEffect: number; boostEndEffect: number; audioPreset: number; animationModifier: number; description: string }
export const BOOSTS: BoostStyle[] = [
  { id: 'dust', displayName: 'Dust Dash', color: 0xd7b787, particlePreset: 'puff', trailPreset: .45, boostStartEffect: 9, boostLoopEffect: 2, boostEndEffect: 3, audioPreset: 100, animationModifier: 1, description: 'Kick up a little countryside.' },
  { id: 'hay', displayName: 'Hay Burst', color: 0xffd15d, particlePreset: 'straw', trailPreset: .7, boostStartEffect: 10, boostLoopEffect: 2, boostEndEffect: 4, audioPreset: 140, animationModifier: 1, description: 'Make hay. Then make a getaway.' },
  { id: 'spark', displayName: 'Spark Trail', color: 0xff8750, particlePreset: 'spark', trailPreset: .4, boostStartEffect: 12, boostLoopEffect: 2, boostEndEffect: 5, audioPreset: 220, animationModifier: 1, description: 'A bright idea at full speed.' },
  { id: 'wind', displayName: 'Wind Rush', color: 0xd5f5ee, particlePreset: 'wind', trailPreset: .3, boostStartEffect: 6, boostLoopEffect: 2, boostEndEffect: 3, audioPreset: 180, animationModifier: 1, description: 'Gone with the farm breeze.' },
  { id: 'poop', displayName: 'Poop Chaos', color: 0x815738, particlePreset: 'poop', trailPreset: .6, boostStartEffect: 5, boostLoopEffect: 1, boostEndEffect: 2, audioPreset: 65, animationModifier: 1, description: 'Questionable manners. Same horsepower.' }
];
export const boostStyle = (id: string) => BOOSTS.find(b => b.id === id) ?? BOOSTS[0];
