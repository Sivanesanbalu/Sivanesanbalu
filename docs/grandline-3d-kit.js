/* The Engineer's Grand Line — original THREE-DIMENSIONAL character and ship kit.
 * Geometry, bones/pivots and animation are native Three.js objects; no sprites,
 * remote model downloads, licensed character meshes or faked video in this scene.
 * Public functions: createGrandLineShip(THREE, options), createAnimeCrew(THREE, kind, options).
 */
export function createGrandLineShip(T, {mobile=false, quality='high'}={}) {
  const root=new T.Group();root.name='Grand Line — detailed 3D galleon';
  const wood=mat(0x70432f,.73),plank=mat(0x9e6747,.82),hullEdge=mat(0x422b2c,.75),brass=mat(0xe5b96f,.38,.6);
  const darkBrass=mat(0x927149,.52,.4),rope=mat(0xc4a67d,.93),iron=mat(0x30363c,.53,.6),cloth=mat(0xf3ddaf,.87),accent=mat(0xb74c40,.71),foam=mat(0xe7f4d5,.35),windowMat=mat(0x8ed9dc,.24,.13);
  function mat(color,roughness=.8,metalness=0){return new T.MeshStandardMaterial({color,roughness,metalness,side:T.FrontSide})}
  function piece(parent,g,m,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=!mobile;o.receiveShadow=!mobile;parent.add(o);return o;}
  function box(parent,w,h,d,m,x,y,z){return piece(parent,new T.BoxGeometry(w,h,d),m,x,y,z)}
  function ball(parent,r,m,x,y,z){return piece(parent,new T.SphereGeometry(r,mobile?10:18,mobile?8:14),m,x,y,z)}
  function cyl(parent,top,bottom,height,m,x,y,z,segments=12){return piece(parent,new T.CylinderGeometry(top,bottom,height,segments),m,x,y,z)}
  function rod(parent,a,b,r,m){const av=new T.Vector3(...a),bv=new T.Vector3(...b),dir=bv.clone().sub(av),o=piece(parent,new T.CylinderGeometry(r,r,dir.length(),mobile?5:8),m);o.position.copy(av.add(bv).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());return o;}
  function tube(parent,pts,r,m){const curve=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)));return piece(parent,new T.TubeGeometry(curve,mobile?24:64,r,mobile?5:8,false),m);}
  // Rounded, swept boat hull: genuinely triangulated cross-sections from stern to bow.
  const stations=[[-4.55,.07],[-4.20,.48],[-3.55,1.05],[-2.65,1.56],[-1.5,1.85],[0,1.95],[1.65,1.86],[2.9,1.53],[3.85,1.08],[4.45,.25],[4.62,.01]];
  const verts=[],indices=[],ringSize=8;
  for(const [z,w] of stations){
    const waterline=[[-w,.34],[-w*1.015,.08],[-w*.83,-.48],[-w*.47,-1.08],[w*.47,-1.08],[w*.83,-.48],[w*1.015,.08],[w,.34]];
    for(const [x,y] of waterline)verts.push(x,y,z);
  }
  for(let i=0;i<stations.length-1;i++)for(let j=0;j<ringSize;j++){
    const a=i*ringSize+j,b=i*ringSize+(j+1)%ringSize,c=(i+1)*ringSize+(j+1)%ringSize,d=(i+1)*ringSize+j;
    indices.push(a,b,d,b,c,d);
  }
  for(let j=1;j<ringSize-1;j++){indices.push(0,j,j+1);const end=(stations.length-1)*ringSize;indices.push(end,end+j+1,end+j);}
  const hull=new T.BufferGeometry();hull.setAttribute('position',new T.Float32BufferAttribute(verts,3));hull.setIndex(indices);hull.computeVertexNormals();
  piece(root,hull,wood);
  // Waterline and layered gold trim / gunwale.
  for(const side of [-1,1]){
    tube(root,stations.map(([z,w])=>[side*w,.35,z]),.073,brass);
    tube(root,stations.map(([z,w])=>[side*w*.96,-.18,z]),.048,darkBrass);
  }
  box(root,3.45,.12,7.05,plank,0,.37,0);
  for(let z=-3.43;z<3.51;z+=.26)box(root,3.37,.012,.035,hullEdge,0,.445,z);
  for(const s of [-1,1]){
    for(let z=-3.45;z<3.42;z+=.79){cyl(root,.073,.09,.72,wood,s*1.65,.82,z);ball(root,.09,brass,s*1.65,1.2,z);}
    rod(root,[s*1.66,1.14,-3.46],[s*1.66,1.14,3.45],.062,brass);
  }
  // Stern's raised poop deck and steerage.
  box(root,3.08,.25,1.42,wood,0,.85,3.08);
  box(root,2.85,.08,1.35,plank,0,.99,3.09);
  for(let z=2.50;z<3.68;z+=.3)box(root,2.74,.012,.03,hullEdge,0,1.04,z);
  for(const s of [-1,1]){
    rod(root,[s*1.43,1.03,2.38],[s*1.43,1.55,2.38],.061,brass);
    rod(root,[s*1.43,1.03,3.72],[s*1.43,1.55,3.72],.061,brass);
    rod(root,[s*1.43,1.55,2.38],[s*1.43,1.55,3.72],.048,brass);
  }
  // Detailed ship wheel: torus, spokes, axle.
  const wheel=new T.Group();wheel.position.set(.75,1.62,2.90);root.add(wheel);
  const wheelT=piece(wheel,new T.TorusGeometry(.41,.065,8,16),wood);wheelT.rotation.y=Math.PI/2;
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4;rod(wheel,[0,Math.cos(a)*.08,Math.sin(a)*.08],[0,Math.cos(a)*.54,Math.sin(a)*.54],.025,brass);
    ball(wheel,.053,brass,0,Math.cos(a)*.54,Math.sin(a)*.54);
  }
  cyl(root,.055,.055,.65,iron,.75,1.35,2.91).rotation.z=Math.PI/2;
  // Portholes: visible circular brass rims both flanks.
  for(const side of [-1,1])for(let z=-2.75;z<=2.81;z+=1.1){
    const x=side*1.44;
    const p=piece(root,new T.TorusGeometry(.21,.052,7,16),brass,x,-.02,z);
    p.rotation.y=Math.PI/2;
    const glass=piece(root,new T.CircleGeometry(.17,18),windowMat,x+side*.004,-.02,z);
    glass.rotation.y=Math.PI/2;
  }
  // Cannons: side-facing 3D barrels and carriage.
  for(const side of [-1,1])for(const z of [-1.98,-.60,1.15]){
    const mount=box(root,.51,.18,.43,hullEdge,side*1.14,.54,z);
    const barrel=cyl(root,.115,.20,.70,iron,side*1.41,.77,z,12);
    barrel.rotation.z=Math.PI/2;
    const mouth=piece(root,new T.TorusGeometry(.12,.034,7,14),brass,side*1.76,.77,z);
    mouth.rotation.y=Math.PI/2;
  }
  // Bow bowsprit and a friendly original golden sea-lion figurehead.
  rod(root,[0,.65,-3.8],[0,1.38,-6.15],.12,wood);
  const face=ball(root,.32,brass,0,.14,-4.69);face.scale.set(.81,.91,1.18);
  ball(root,.14,brass,-.24,.34,-4.75);ball(root,.14,brass,.24,.34,-4.75);
  const mane=piece(root,new T.TorusGeometry(.34,.11,8,16),brass,0,.14,-4.53);
  const prow=piece(root,new T.ConeGeometry(.17,.75,10),brass,0,-.18,-4.91);prow.rotation.x=Math.PI/2.8;
  // Rope rigging and layered curved fabric sails, intentionally physical meshes.
  const sails=[],masts=[[-1.65,6.10,3.35],[1.63,5.35,3.25]];
  for(const [z,top,bottom] of masts){
    cyl(root,.115,.17,top+.15,wood,0,(top+.15)/2+.42,z);
    ball(root,.15,brass,0,top+.65,z);
    const width=z<0?3.85:3.05;
    rod(root,[-width/2,top,z],[width/2,top,z],.10,wood);
    rod(root,[-width*.45,bottom,z],[width*.45,bottom,z],.082,wood);
    // Sail spans a slightly bulging cloth geometry with a controllable flutter layer.
    const g=new T.PlaneGeometry(width,top-bottom,mobile?9:20,mobile?7:16);
    const a=g.attributes.position;
    for(let i=0;i<a.count;i++){
      const u=a.getX(i)/(width*.5),v=a.getY(i)/(top-bottom);
      a.setZ(i,Math.max(0,1-u*u)*(.31+Math.sin((v+.5)*Math.PI)*.13));
    }
    g.computeVertexNormals();
    const s=piece(root,g,new T.MeshStandardMaterial({color:0xf3dfb9,roughness:.88,side:T.DoubleSide}),0,(top+bottom)/2,z-.12);
    sails.push({mesh:s,base:new Float32Array(a.array)});
    // Gold embroidery on the sail.
    if(z<0){
      const emblem=new T.Group();emblem.position.set(0,4.48,z+.32);root.add(emblem);
      const ring=piece(emblem,new T.TorusGeometry(.55,.028,7,30),darkBrass);
      piece(emblem,new T.IcosahedronGeometry(.20,0),accent,0,0,.05);
      for(let i=0;i<4;i++){
        const a=i*Math.PI/2;
        rod(emblem,[Math.cos(a)*.23,Math.sin(a)*.23,.04],[Math.cos(a)*.45,Math.sin(a)*.45,.04],.025,darkBrass);
      }
    }
    for(const side of [-1,1]){
      rod(root,[side*width*.5,top,z],[side*1.58,.54,z+.95],.024,rope);
      rod(root,[0,top+.3,z],[side*1.55,.48,z-2],.018,rope);
    }
  }
  // Crow's nest: cup, rail and small animated red pennant.
  cyl(root,.65,.58,.17,wood,0,5.88,-1.65);
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4;const x=Math.cos(a)*.56,z=-1.65+Math.sin(a)*.56;
    rod(root,[x,5.95,z],[x,6.45,z],.033,brass);
  }
  const rim=piece(root,new T.TorusGeometry(.56,.039,7,24),brass,0,6.45,-1.65);rim.rotation.x=Math.PI/2;
  rod(root,[0,6.15,-1.65],[0,7.35,-1.65],.04,wood);
  const flagGeo=new T.PlaneGeometry(1.1,.52,10,3);
  const flag=piece(root,flagGeo,new T.MeshStandardMaterial({color:0xa84944,side:T.DoubleSide,roughness:.92}),.55,7.04,-1.65);
  sails.push({mesh:flag,base:new Float32Array(flagGeo.attributes.position.array)});
  // Deck crates, rope coils, lanterns and stern windows.
  for(const [x,z] of [[-1.25,1.44],[1.05,2.0],[-.92,-2.75]]){
    box(root,.56,.43,.54,wood,x,.68,z);
    const h=box(root,.59,.052,.55,brass,x,.92,z);
  }
  for(const s of [-1,1]){
    const lamp=ball(root,.22,mat(0xffd59b,.25),s*1.51,1.49,3.19);
    lamp.material.emissive=new T.Color(0xffab5b);lamp.material.emissiveIntensity=1.1;
  }
  // Whitecaps and ship wake on a flattened, transparent 3D torus and sea foam ribbons.
  const wake=new T.Group();wake.position.set(0,-.72,2.2);root.add(wake);
  const white=new T.MeshBasicMaterial({color:0xaee5dc,transparent:true,opacity:.18,depthWrite:false,side:T.DoubleSide});
  for(let i=0;i<5;i++){
    const w=piece(wake,new T.TorusGeometry(1.7+i*.55,.035,6,44,Math.PI*1.65),white,0,0,i*.82);
    w.rotation.x=-Math.PI/2;w.rotation.z=i*.22;
  }
  const lantern=new T.PointLight(0xffc578,mobile?0:2.5,8);lantern.position.set(0,1.4,2.6);root.add(lantern);
  function update(t){
    if(!Number.isFinite(t))return;
    root.position.y=.82+Math.sin(t*1.24)*.095;
    root.rotation.z=Math.sin(t*.85)*.021;
    root.rotation.x=Math.sin(t*.62)*.018;
    wheel.rotation.x=Math.sin(t*.55)*.09;
    wake.rotation.y=Math.sin(t*.35)*.03;
    for(const {mesh:s,base} of sails){
      const arr=s.geometry.attributes.position.array;
      for(let i=0;i<arr.length;i+=3){
        arr[i+2]=base[i+2]+Math.sin(t*1.48+base[i]*1.15+base[i+1]*.78)*.085;
      }
      s.geometry.attributes.position.needsUpdate=true;
      if(!mobile)s.geometry.computeVertexNormals();
    }
  }
  return {group:root,update,sails,wake};
}

export function createAnimeCrew(T,kind='captain',{mobile=false}={}){
  // The figures are real spatial meshes with transform-pivot rigs, NOT images.
  const root=new T.Group();root.name='Original 3D anime pirate — '+kind;
  const isWarrior=kind==='swordsman',isNavigator=kind==='navigator';
  const palette=isWarrior?{coat:0x2c6653,pants:0x202f41,skin:0xd7a078,hair:0x438c63,accent:0xb8d6d0,hat:0x245045}:
    isNavigator?{coat:0x2e94a6,pants:0x2e485d,skin:0xe5aa80,hair:0xda7a42,accent:0xf6c47d,hat:0x366b7d}:
    {coat:0xb8433e,pants:0x37577a,skin:0xe4ac84,hair:0x24222a,accent:0xe7c279,hat:0xdfb96e};
  const mat=(c,r=.78,m=0)=>new T.MeshStandardMaterial({color:c,roughness:r,metalness:m});
  const coat=mat(palette.coat),pants=mat(palette.pants),skin=mat(palette.skin),hair=mat(palette.hair),boots=mat(0x252c36),accent=mat(palette.accent,.42,.32),eye=mat(0x1b2933,.3),white=mat(0xf1e8d0),belt=mat(0x594035);
  function mesh(p,g,m,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=!mobile;o.receiveShadow=!mobile;p.add(o);return o;}
  function box(p,w,h,d,m,x,y,z){return mesh(p,new T.BoxGeometry(w,h,d),m,x,y,z)}
  function ball(p,r,m,x,y,z){return mesh(p,new T.SphereGeometry(r,mobile?10:18,mobile?8:14),m,x,y,z)}
  function cylinder(p,top,bottom,h,m,x,y,z,n=12){return mesh(p,new T.CylinderGeometry(top,bottom,h,n),m,x,y,z)}
  function cone(p,r,h,m,x,y,z,n=10){return mesh(p,new T.ConeGeometry(r,h,n),m,x,y,z)}
  function bone(p,a,b,r,m){const A=new T.Vector3(...a),B=new T.Vector3(...b),dir=B.clone().sub(A),o=cylinder(p,r,r,dir.length(),m);o.position.copy(A.add(B).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());return o}
  const skeleton={};
  const hips=new T.Group();hips.position.y=.99;root.add(hips);skeleton.hips=hips;
  const torso=new T.Group();torso.position.y=.38;hips.add(torso);skeleton.torso=torso;
  // Legs with hip and knee articulated joint groups.
  const legs=[];
  for(const s of [-1,1]){
    const hip=new T.Group();hip.position.set(s*.23,-.06,0);hips.add(hip);
    cylinder(hip,.19,.215,.64,pants,0,-.33,0);
    const knee=new T.Group();knee.position.y=-.67;hip.add(knee);
    cylinder(knee,.165,.19,.58,pants,0,-.26,0);
    const boot=ball(knee,.22,boots,0,-.61,.095);boot.scale.set(1,.66,1.5);
    legs.push({hip,knee,s});
  }
  // Capsule torso, shoulders and open jacket lapels.
  const body=cylinder(torso,.36,.43,.96,coat,0,.49,0);body.scale.z=.67;
  box(torso,.27,.78,.15,white,0,.50,.34);
  for(const s of [-1,1]){
    const lapel=box(torso,.12,.86,.13,coat,s*.18,.48,.39);lapel.rotation.z=s*.23;
  }
  cylinder(torso,.44,.44,.17,belt,0,-.055,0);
  const buckle=box(torso,.16,.12,.08,accent,0,-.05,.41);
  const headRig=new T.Group();headRig.position.set(0,1.13,0);torso.add(headRig);skeleton.head=headRig;
  cylinder(headRig,.13,.17,.24,skin,0,0,0);
  const face=ball(headRig,.365,skin,0,.35,0);face.scale.set(.94,1.15,.91);
  // Stylized anime eyes, pupils, eyebrows, nose, mouth all actual geometry.
  for(const s of [-1,1]){
    const eyeball=ball(headRig,.093,white,s*.142,.40,.312);eyeball.scale.set(1.14,.64,.5);
    const pupil=ball(headRig,.047,eye,s*.14,.402,.362);pupil.scale.set(.7,1.05,.65);
    const brow=box(headRig,.18,.032,.035,hair,s*.145,.539,.330);brow.rotation.z=s*-.10;
    const ear=ball(headRig,.09,skin,s*.35,.32,.02);ear.scale.z=.63;
  }
  const nose=cone(headRig,.07,.18,skin,0,.25,.343);nose.rotation.x=-Math.PI/2.6;
  const mouth=box(headRig,.16,.026,.023,mat(0x9d5654),0,.103,.347);
  // Layered hair clumps, visible asymmetry and silhouette.
  for(let i=0;i<(mobile?7:12);i++){
    const a=i*Math.PI*2/(mobile?7:12),x=Math.cos(a)*.258,z=Math.sin(a)*.25;
    const clump=cone(headRig,.145,.38,hair,x,.68,z,mobile?5:7);
    clump.rotation.z=Math.sin(a)*.31;
    clump.rotation.x=Math.cos(a)*-.27;
  }
  // Arms: shoulder and elbow articulation, expressive hand pose animation.
  const arms=[];
  for(const s of [-1,1]){
    const shoulder=new T.Group();shoulder.position.set(s*.40,.87,0);torso.add(shoulder);
    const sleeve=cylinder(shoulder,.15,.16,.50,coat,s*.12,-.24,0);sleeve.rotation.z=s*.19;
    const elbow=new T.Group();elbow.position.set(s*.22,-.50,0);shoulder.add(elbow);
    cylinder(elbow,.13,.12,.47,skin,s*.026,-.21,0);
    const hand=ball(elbow,.14,skin,s*.037,-.46,0);hand.scale.set(1,.85,.8);
    arms.push({shoulder,elbow,s});
  }
  const hatRig=new T.Group();hatRig.position.y=.76;headRig.add(hatRig);skeleton.hat=hatRig;
  if(kind==='captain'){
    cylinder(hatRig,.65,.65,.08,mat(0xe4c179),0,.01,0,24);
    cylinder(hatRig,.37,.42,.32,mat(0xe8c884),0,.21,0,18);
    cylinder(hatRig,.42,.42,.07,mat(0xb74d42),0,.115,0,18);
    // Small sash drape + brass buttons.
    for(let i=0;i<3;i++)ball(torso,.045,accent,.26,.22+i*.17,.41);
    const scarf=box(torso,.18,.55,.11,mat(0xe1bc7b),-.22,-.3,.28);scarf.rotation.z=-.34;
  } else if(isWarrior){
    // Original three-sword explorer: swords are independent 3D geometry.
    for(let i=0;i<3;i++){
      const s=i===0?-1:i===1?1:0;
      const sword=new T.Group();
      sword.position.set(s*.31,.48,-.28);sword.rotation.z=(i-1)*.29;torso.add(sword);
      cylinder(sword,.042,.06,1.65,mat(0xa5bfd1,.24,.7),0,.85,0,7);
      const tip=cone(sword,.052,.3,mat(0xd9e8ee,.22,.7),0,1.82,0,7);
      box(sword,.41,.07,.15,accent,0,.04,0);
      cylinder(sword,.075,.075,.28,mat(0x594b44),0,-.17,0,9);
    }
    for(let i=0;i<4;i++){
      const hairSpike=cone(headRig,.17,.36,hair,Math.cos(i*Math.PI/2)*.22,.72,Math.sin(i*Math.PI/2)*.19);
      hairSpike.rotation.z=Math.cos(i*Math.PI/2)*-.5;
    }
  } else {
    // Original navigator: golden compass, staff, ponytail, hair motion.
    const compass=new T.Group();compass.position.set(-.39,.01,.54);torso.add(compass);
    const ring=mesh(compass,new T.TorusGeometry(.19,.043,8,20),accent);
    mesh(compass,new T.IcosahedronGeometry(.1,0),mat(0x66e2da,.4,.3),0,0,.06);
    const staff=new T.Group();staff.position.set(.57,.34,.1);torso.add(staff);skeleton.staff=staff;
    cylinder(staff,.06,.065,2.1,mat(0xdbb875),0,.5,0);
    ball(staff,.19,mat(0x72dfe4,.22,.25),0,1.6,0);
    const pony=new T.Group();pony.position.set(0,.62,-.3);headRig.add(pony);skeleton.pony=pony;
    for(let i=0;i<4;i++){const x=(i-1.5)*.08;const tail=cone(pony,.16,.87,hair,x,-.46,0,7);tail.rotation.x=Math.PI;}
  }
  const blinkees=[];headRig.traverse(o=>{if(o.material===white && o.geometry?.type==='SphereGeometry')blinkees.push(o)});
  const animation={time:0,action:'idle'};
  function setAction(action){animation.action=action==='slash'||action==='wave'||action==='point' ? action : 'idle';animation.time=0;}
  function update(time){
    const t=time;animation.time+=.016;
    root.position.y=Math.sin(t*1.3+ (isWarrior?1:0))*.025;
    hips.rotation.y=Math.sin(t*.6)*.04;
    torso.rotation.z=Math.sin(t*.83)*.025;
    torso.scale.y=1+Math.sin(t*1.7)*.018;
    skeleton.head.rotation.y=Math.sin(t*.75)*.085;
    skeleton.head.rotation.z=Math.cos(t*.94)*.032;
    skeleton.hat.rotation.z=Math.sin(t*.98)*.045;
    const blink=(Math.sin(t*1.79+ (isNavigator?1.8:0))>.995)? .17:1;
    for(const e of blinkees)e.scale.y=.64*blink;
    for(const a of arms){
      a.shoulder.rotation.z=a.s*(.19+Math.sin(t*1.15+a.s)*.12);
      a.shoulder.rotation.x=Math.sin(t*.91+a.s)*.12;
      a.elbow.rotation.x=Math.sin(t*1.3+a.s)*.08;
    }
    for(const l of legs){l.hip.rotation.x=Math.sin(t*.72+l.s)*.027;l.knee.rotation.x=Math.max(0,Math.sin(t*.72+l.s))*.024;}
    if(skeleton.staff)skeleton.staff.rotation.z=Math.sin(t*.8)*.12;
    if(skeleton.pony)skeleton.pony.rotation.x=Math.sin(t*1.6)*.12;
    if(animation.action!=='idle'){
      const progress=Math.min(1,animation.time/1.1);
      const wave=Math.sin(progress*Math.PI);
      arms[1].shoulder.rotation.z-=wave*(animation.action==='slash'?2.3:1.25);
      arms[1].elbow.rotation.x+=wave*(animation.action==='point'?-1.0:-.65);
      torso.rotation.y+=wave*(animation.action==='slash'?.55:.20);
      if(progress>=1)animation.action='idle';
    }
  }
  return {group:root,update,setAction,kind,rig:{hips,torso,head:headRig,arms,legs}};
}
