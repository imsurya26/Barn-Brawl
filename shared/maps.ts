export const MAPS=[
 {id:'barnyard',name:'Barnyard Bowl',tagline:'Late afternoon in the countryside',sky:0xb5dfe6,fog:0xb9d0bb,ground:0x477c45,turf:0x70a54f,stripe:0x639946,ramp:0x9dbe76,wood:0x765032,sun:0xffddb0,fill:0xa5d9ec,intensity:3.2,exposure:1.1},
 {id:'harvest',name:'Harvest Moon Arena',tagline:'An autumn festival under the stars',sky:0x101d38,fog:0x202941,ground:0x273b31,turf:0x2c664c,stripe:0x285d43,ramp:0x537453,wood:0x694331,sun:0xb2c7ff,fill:0x768ba5,intensity:2,exposure:1.25},
 {id:'frostbite',name:'Frostbite Ranch',tagline:'Blue hour beneath snowy peaks',sky:0x8fafd1,fog:0xb5c8d7,ground:0xd5e5ec,turf:0x89acb5,stripe:0x80a3ae,ramp:0xc8dce4,wood:0x5a6675,sun:0xffd4bc,fill:0xb2d9ff,intensity:2.5,exposure:1.05},
 {id:'canyon',name:'Sunset Canyon Ranch',tagline:'Dust, cattle gates and golden skies',sky:0xe7ac86,fog:0xd79575,ground:0xb96944,turf:0xc29a65,stripe:0xb98d58,ramp:0xd8af76,wood:0x774532,sun:0xffb272,fill:0xc0acbb,intensity:3,exposure:1.1},
] as const;
export type MapId=typeof MAPS[number]['id'];
export const mapTheme=(id:string)=>MAPS.find(m=>m.id===id)??MAPS[0];
