import * as T from 'three';
import {ROCK} from '../../shared/config';
export function sculptedRock(){
 const geometry=new T.IcosahedronGeometry(ROCK.radius,3),p=geometry.getAttribute('position'),colors=[];const v=new T.Vector3();
 for(let i=0;i<p.count;i++){
  v.fromBufferAttribute(p,i).normalize();const noise=Math.sin(v.x*13+v.z*5)*Math.sin(v.y*11-v.x*4)*.035;
  const seam=Math.min(Math.abs(Math.sin(v.x*4+v.y*3+v.z)),Math.abs(Math.sin(v.z*5-v.y*2+.7)));
  const crack=1-T.MathUtils.smoothstep(seam,.015,.055),radius=ROCK.radius*(1+noise-crack*.018);
  p.setXYZ(i,v.x*radius,v.y*radius,v.z*radius);const shade=(.63+v.y*.08+noise*2)*(1-crack*.45);colors.push(shade*.86,shade*.92,shade);
 }
 geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
 const material=new T.MeshStandardMaterial({color:0xc5ccbd,roughness:.92,vertexColors:true,flatShading:true});const rock=new T.Mesh(geometry,material);rock.castShadow=true;rock.receiveShadow=true;return rock;
}
