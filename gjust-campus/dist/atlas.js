/* Orthographic campus renderer. Geometry and routes stay in local ground metres. */
const Atlas=(()=>{
  const canvas=document.querySelector('#terrain'), ctx=canvas.getContext('2d'), labels=document.querySelector('#labels');
  const lon0=75.7355,lat0=29.1707,fx=111320*Math.cos(lat0*Math.PI/180),fy=110850;
  const local=([lon,lat])=>[(lon-lon0)*fx,(lat0-lat)*fy];
  const state={angle:-0.43,zoom:1,x:0,y:-80,flat:false,lite:false,hour:16.7,weather:'Clear',season:'Autumn',live:false};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),len=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  let w=1,h=1,unit=1,sin=0,cos=1,tilt=.72,raf=0,selected=null,placeList=[],onPick,route=[],connections=[],anim=0,moveToken=0;
  const roads=[],grounds=[],buildings=[],trees=[],lamps=[],nodes=[],edges=[],keys=new Map();
  let seed=9103;const rnd=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
  function project(p,z=0){let x=p[0]-state.x,y=p[1]-state.y;return [w/2+(x*cos-y*sin)*unit,h/2+(x*sin+y*cos)*unit*tilt-z*(state.flat?0:.87)*unit]}
  function inverse(x,y){x=(x-w/2)/unit;y=(y-h/2)/unit/tilt;return [x*cos+y*sin+state.x,-x*sin+y*cos+state.y]}
  function node(p){const key=p.map(x=>Math.round(x*50)).join('/');if(!keys.has(key)){keys.set(key,nodes.length);nodes.push(p);edges.push([])}return keys.get(key)}
  function inside(p,ring){let hit=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])hit=!hit}return hit}
  function bounds(pts){return pts.reduce((b,p)=>[Math.min(b[0],p[0]),Math.min(b[1],p[1]),Math.max(b[2],p[0]),Math.max(b[3],p[1])],[Infinity,Infinity,-Infinity,-Infinity])}
  function center(b){return [(b[0]+b[2])/2,(b[1]+b[3])/2]}
  function area(r){return Math.abs(r.reduce((v,p,i)=>{const q=r[(i+1)%r.length];return v+p[0]*q[1]-p[1]*q[0]},0))/2}
  let campus;
  for(const f of (window.CAMPUS_GEO?.features||[])){
    let t=f.properties||{};t={...t,...t.tags};const g=f.geometry;if(!g)continue;
    if(g.type==='LineString'||g.type==='MultiLineString'){
      for(const line of g.type==='LineString'?[g.coordinates]:g.coordinates){
        if(!t.highway)continue;const pts=line.map(local);roads.push({pts,t});
        if(!/^(motorway|motorway_link|trunk|trunk_link|construction)$/.test(t.highway)&&!['no','private'].includes(t.foot)&&(!['no','private'].includes(t.access)||['yes','designated','permissive'].includes(t.foot))){
          let prev=node(pts[0]);for(let i=1;i<pts.length;i++){const next=node(pts[i]),d=len(pts[i-1],pts[i]);if(next!==prev){edges[prev].push([next,d]);edges[next].push([prev,d])}prev=next}
        }
      }
    }else if(g.type==='Polygon'||g.type==='MultiPolygon'){
      for(const poly of g.type==='Polygon'?[g.coordinates]:g.coordinates){
        const pts=poly[0].map(local),b=bounds(pts),p=center(b),a=area(pts);
        if(t.building||t.kind==='building'||t.type==='building'||t.theme==='buildings'){
          const floors=Number(t['building:levels'])||clamp(Math.round(Math.sqrt(a)/15+rnd()*1.5),1,5);
          buildings.push({pts,holes:poly.slice(1).map(r=>r.map(local)),p,b,a,floors,z:clamp(parseFloat(t.height)||floors*3.8,3,35),color:rnd()});
        }else{grounds.push({pts,b,t});if(t.amenity==='university'||String(f.id).includes('183636455'))campus=pts}
      }
    }
  }
  const campBox=campus?bounds(campus):[-820,-580,850,1000];
  function obstructed(p){return buildings.some(b=>p[0]>b.b[0]-4&&p[0]<b.b[2]+4&&p[1]>b.b[1]-4&&p[1]<b.b[3]+4)}
  function addTree(p,r){if(!obstructed(p))trees.push({p,r,v:rnd(),tree:true})}
  for(const g of grounds.filter(g=>g.t.natural==='wood'||g.t.landuse==='forest'||g.t.leisure==='park'||g.t.landuse==='orchard')){
    const [l,t,r,b]=g.b;for(let i=0;i<Math.min(2700,(r-l)*(b-t)/250);i++){const p=[l+rnd()*(r-l),t+rnd()*(b-t)];if(inside(p,g.pts))addTree(p,3.8+rnd()*4.8)}
  }
  for(const road of roads){for(let i=1;i<road.pts.length;i++){const a=road.pts[i-1],b=road.pts[i],d=len(a,b);if(!d)continue;
    for(let t=12;t<d;t+=23+rnd()*6){const p=[a[0]+(b[0]-a[0])*t/d,a[1]+(b[1]-a[1])*t/d],off=rnd()>.5?9:-9;
      addTree([p[0]+off*(b[1]-a[1])/d,p[1]-off*(b[0]-a[0])/d],3+rnd()*4);
      if(t%3<1.5)lamps.push([p[0]+4*(b[1]-a[1])/d,p[1]-4*(b[0]-a[0])/d]);
    }
  }}
  function path(pts,z=0,dx=0,dy=0){for(let i=0;i<pts.length;i++){const p=project(pts[i],z);if(i)ctx.lineTo(p[0]+dx,p[1]+dy);else ctx.moveTo(p[0]+dx,p[1]+dy)}}
  function polygon(pts,fill,line,width=1,z=0){ctx.beginPath();path(pts,z);ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(line){ctx.strokeStyle=line;ctx.lineWidth=width;ctx.stroke()}}
  function line(pts,color,width){if(pts.length<2)return;ctx.beginPath();path(pts);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke()}
  function screenPoly(pts,fill,stroke){ctx.beginPath();for(let i=0;i<pts.length;i++)i?ctx.lineTo(...pts[i]):ctx.moveTo(...pts[i]);ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.lineWidth=.65;ctx.strokeStyle=stroke;ctx.stroke()}}
  function visible(p,rad=100){const a=project(p);return a[0]>-rad&&a[1]>-rad&&a[0]<w+rad&&a[1]<h+rad}
  function tree(o,night){const [x,y]=project(o.p),r=o.r*unit,s=o.v;const autumn=state.season==='Autumn',winter=state.season==='Winter';
    const green=night?['#314d45','#3c5549','#455c4b']:autumn?['#81985c','#9eac61','#6c8a54','#afad65','#74915d']:winter?['#899678','#a3a386','#758e77']:['#608451','#769654','#8aa559','#6b935f'];
    ctx.fillStyle=night?'#353e39':'#7a7353';ctx.fillRect(x-r*.12,y-r*1.3,r*.24,r*1.5);
    let cy=y-(state.flat?r*.1:r*1.35);
    ctx.fillStyle=green[Math.floor(s*green.length)];ctx.beginPath();ctx.ellipse(x,cy,r,r*(state.flat?.77:1.06),s*.3,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(245,240,166,.22)';ctx.beginPath();ctx.ellipse(x-r*.20,cy-r*.25,r*.72,r*.65,-.45,0,Math.PI*2);ctx.fill();
  }
  function building(b,night){const pts=b.pts,z=b.z*(state.flat?0:1),facades=[];
    if(!state.flat){for(let i=1;i<pts.length;i++){const a=project(pts[i-1]),c=project(pts[i]),aa=project(pts[i-1],z),cc=project(pts[i],z);facades.push({a,c,aa,cc,depth:(a[1]+c[1])/2})}
      facades.sort((a,b)=>a.depth-b.depth);for(const f of facades){const {a,c,aa,cc}=f,bright=(c[0]-a[0])*(c[1]-a[1])<0;
        const pale=b.color<.55;screenPoly([a,c,cc,aa],night?(bright?'#586361':'#4b5352'):pale?(bright?'#d1bd93':'#af9a7f'):(bright?'#c08c69':'#a8775d'),'#594e392e');
        const width=len(a,c);
        if(!state.lite&&width>7){const n=clamp(Math.floor(len(pts[0],pts[1])/3),1,50),cols=clamp(Math.round(width/(unit*4.5)),1,55);
          for(let row=0;row<b.floors;row++){for(let col=0;col<cols;col++){let t=(col+.5)/cols,x=aa[0]+(cc[0]-aa[0])*t,y=aa[1]+(cc[1]-aa[1])*t+(a[1]-aa[1])*(row+.5)/b.floors;
            ctx.strokeStyle=night?((col+row+n)%3?'#ffda8c':'#646c68'):(bright?'#797969':'#6c685c');ctx.lineWidth=clamp(unit*1.05,.55,3);ctx.beginPath();ctx.moveTo(x,y-unit*.8);ctx.lineTo(x,y+unit*.8);ctx.stroke()
          }}
        }
      }
    }
    ctx.beginPath();path(pts,z);ctx.closePath();for(const hole of b.holes){path(hole,z);ctx.closePath()}ctx.fillStyle=night?'#89928a':b.color<.43?'#eadfc4':b.color<.77?'#e1c2a1':'#c99476';ctx.fill('evenodd');ctx.strokeStyle=night?'#68766d':'#ac967b';ctx.lineWidth=Math.max(.6,unit*.8);ctx.stroke();
    if(!state.flat&&b.a>240&&!b.holes.length&&inside(b.p,pts)&&!state.lite){
      const [x,y]=b.p,sz=clamp(Math.sqrt(b.a)*.09,1.8,5);polygon([[x-sz,y-sz],[x+sz,y-sz],[x+sz,y+sz],[x-sz,y+sz]],night?'#9aa297':'#e8d8b9','#a9967b',.7,z+1.8)
    }
  }
  function draw(){
    raf=0;if(!canvas.clientWidth||!canvas.clientHeight)return;w=canvas.clientWidth;h=canvas.clientHeight;const dpr=Math.min(devicePixelRatio||1,state.lite?1:1.65);
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr)}
    ctx.setTransform(dpr,0,0,dpr,0,0);unit=Math.max(.43,Math.min(1.7,Math.max(w/1350,h/890)))*state.zoom;
    cos=Math.cos(state.angle);sin=Math.sin(state.angle);tilt=state.flat?1:.73;
    const sun=solar(),night=sun.alt<-.055,dusk=!night&&sun.alt<.28;
    const palette=state.season==='Monsoon'?['#c0d5a8','#b3c99a']:state.season==='Winter'?['#d5d8bd','#c8ceaf']:['#d9dfba','#cbd8aa'];
    ctx.fillStyle=night?'#45594e':palette[0];ctx.fillRect(0,0,w,h);
    if(campus)polygon(campus,night?'#4d644f':palette[1],night?'#798b74':'#b2c19b',1);
    for(const g of grounds){if(g.pts===campus)continue;let fill=g.t.natural==='water'||g.t.waterway?'#9ec9c1':g.t.natural==='wood'||g.t.landuse==='forest'?'#acc290':g.t.leisure==='pitch'?'#a3bb88':g.t.landuse==='residential'?'#d9d9c1':null;if(fill)polygon(g.pts,night?'#465948':fill)}
    ctx.lineCap='round';ctx.lineJoin='round';
    for(const r of roads){const broad=/primary|secondary|trunk/.test(r.t.highway),small=/path|footway|steps/.test(r.t.highway),width=unit*(broad?14:small?3.5:7.8);line(r.pts,night?'#788577':'#aeb69a',width+1.8*unit);line(r.pts,night?'#8a9482':small?'#f0e6c9':broad?'#eee2c1':'#f2edda',width)}
    const shadow=clamp(1/Math.tan(Math.max(sun.alt,.12)),.45,3.6)*.76;
    const shadowX=Math.sin(sun.az)*shadow,shadowY=Math.cos(sun.az)*shadow;
    const scenery=[...buildings.filter(b=>visible(b.p,Math.max(140,(b.b[2]-b.b[0]+b.b[3]-b.b[1])*unit))),...trees.filter((o,i)=>(!state.lite||i%4===0)&&visible(o.p,24*unit))];
    if(!state.flat&&!night&&!state.lite){ctx.fillStyle=state.weather==='Clear'?'#47553730':'#47553718';
      for(const o of scenery){const s=(o.z||o.r*1.5)*unit;ctx.beginPath();if(o.tree){const a=project(o.p);ctx.ellipse(a[0]+s*shadowX*.37,a[1]+s*shadowY*.24,o.r*unit*(1+shadow*.25),o.r*unit*.64,Math.atan2(shadowY,shadowX),0,Math.PI*2)}else{path(o.pts,0,s*shadowX,s*shadowY*tilt);ctx.closePath()}ctx.fill()}
    }
    scenery.sort((a,b)=>(a.p[0]-b.p[0])*sin+(a.p[1]-b.p[1])*cos);
    for(const o of scenery)o.tree?tree(o,night):building(o,night);
    if(night&&!state.lite)for(const p of lamps){if(!visible(p,20))continue;const a=project(p,3),r=6*unit,glow=ctx.createRadialGradient(...a,0,...a,r);glow.addColorStop(0,'#ffdc8c');glow.addColorStop(1,'#ffda7800');ctx.fillStyle=glow;ctx.fillRect(a[0]-r,a[1]-r,r*2,r*2)}
    if(dusk){ctx.fillStyle='#f9be6120';ctx.fillRect(0,0,w,h)}
    if(state.weather!=='Clear'){ctx.fillStyle=state.weather==='Fog'?'#edf0de70':state.weather==='Rain'?'#6079803b':'#dde0d429';ctx.fillRect(0,0,w,h);if(state.weather==='Rain'&&!state.lite){ctx.strokeStyle='#e8f0eb88';ctx.lineWidth=1;ctx.beginPath();const offset=performance.now()*.2;for(let i=0;i<110;i++){let x=(i*233.89-offset*.35)%(w+20),y=(i*111.3+offset)%(h+20);ctx.moveTo(x,y);ctx.lineTo(x-4,y+10)}ctx.stroke();if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&!document.hidden)request()}}
    if(route.length){line(route,'#fbfff0',6);line(route,'#286a51',3.5);ctx.setLineDash([3,5]);connections.forEach(c=>line(c,'#395f45',2));ctx.setLineDash([])}
    renderLabels();let metres=unit>2?25:unit>1?50:100;const scale=document.querySelector('#scale');scale.style.width=metres*unit+'px';scale.textContent=metres+' m';
    document.querySelector('#north svg').style.transform='rotate('+state.angle+'rad)';
  }
  function request(){if(!raf)raf=requestAnimationFrame(draw)}
  function solar(){const date=new Date(Date.now()+19800000),day=(date-Date.UTC(date.getUTCFullYear(),0,0))/86400000;
    const lat=lat0*Math.PI/180,decl=.4091*Math.sin(2*Math.PI*(day-80)/365.25),b=2*Math.PI*(day-81)/364;
    const offset=(4*(lon0-82.5)+9.87*Math.sin(2*b)-7.53*Math.cos(b)-1.5*Math.sin(b))/60;
    const hour=state.live?date.getUTCHours()+date.getUTCMinutes()/60:state.hour,ha=(hour+offset-12)*Math.PI/12;
    return {alt:Math.asin(Math.sin(lat)*Math.sin(decl)+Math.cos(lat)*Math.cos(decl)*Math.cos(ha)),az:Math.atan2(Math.sin(ha),Math.cos(ha)*Math.sin(lat)-Math.tan(decl)*Math.cos(lat))+state.angle,decl,offset};
  }
  function sunTimes(){const s=solar(),span=Math.acos(-Math.tan(lat0*Math.PI/180)*Math.tan(s.decl))*12/Math.PI;return {Sunrise:12-span-s.offset,'Golden hour':12+span-s.offset-.75,Sunset:12+span-s.offset,Night:21}}
  function renderLabels(){
    let used=[];const sorted=[...placeList].sort((a,b)=>(b.id===selected)-(a.id===selected));
    for(const p of sorted){const el=p.el,[x,y]=project(p.local,6),width=el.offsetWidth||125;const box=[x-width/2-4,y-33,x+width/2+4,y+3];
      const hide=(box[2]<0||box[0]>w||y<18||y>h-9||used.some(q=>box[0]<q[2]&&box[2]>q[0]&&box[1]<q[3]&&box[3]>q[1]));
      el.style.visibility=hide?'hidden':'visible';if(!hide)used.push(box);el.style.left=x+'px';el.style.top=y+'px';el.classList.toggle('sel',p.id===selected)
    }
  }
  function markers(places,callback){labels.replaceChildren();onPick=callback;placeList=places.filter(p=>p.coords).map(p=>{const el=document.createElement('button');el.className='pin';el.innerHTML=icon(p.icon||'pin');el.append(document.createTextNode(p.short||p.name));el.setAttribute('aria-label',p.name);el.onclick=()=>onPick(p.id);labels.append(el);return {...p,local:local(p.coords),el}});request()}
  function camera(x,y,zoom,animate=true){const id=++moveToken;cancelAnimationFrame(anim);if(!animate||matchMedia('(prefers-reduced-motion: reduce)').matches){Object.assign(state,{x,y,zoom});request();return}const start=performance.now(),from={...state};
    function step(now){if(moveToken!==id)return;let t=1-Math.pow(1-clamp((now-start)/420,0,1),3);Object.assign(state,{x:from.x+(x-from.x)*t,y:from.y+(y-from.y)*t,zoom:from.zoom+(zoom-from.zoom)*t});request();if(t<1)anim=requestAnimationFrame(step)}anim=requestAnimationFrame(step)}
  function fit(pts){const b=bounds(pts),p=center(b),base=unit/state.zoom;const xs=pts.map(q=>(q[0]-p[0])*cos-(q[1]-p[1])*sin),ys=pts.map(q=>((q[0]-p[0])*sin+(q[1]-p[1])*cos)*tilt);
    camera(p[0],p[1],clamp(Math.min((w-90)/(Math.max(...xs)-Math.min(...xs)||1),(h-160)/(Math.max(...ys)-Math.min(...ys)||1))/base,.2,5))}
  function snap(p){let best=null;for(let i=0;i<nodes.length;i++){const a=nodes[i];for(const [j,d] of edges[i]){if(j<=i)continue;const b=nodes[j],t=clamp(((p[0]-a[0])*(b[0]-a[0])+(p[1]-a[1])*(b[1]-a[1]))/d**2,0,1),q=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],gap=len(p,q);if(!best||gap<best.gap)best={i,j,d,t,q,gap}}}return best}
  function findRoute(a,b){route=[];connections=[];request();const start=local(a),end=local(b),s=snap(start),e=snap(end);if(!s||!e||Math.max(s.gap,e.gap)>140)return null;
    const dist=Array(nodes.length).fill(Infinity),prev=new Map(),queue=new Set();for(const [i,cost] of [[s.i,s.t*s.d],[s.j,(1-s.t)*s.d]]){dist[i]=cost;queue.add(i)}
    while(queue.size){let i=-1;for(const candidate of queue)if(i<0||dist[candidate]<dist[i])i=candidate;queue.delete(i);for(const [j,c] of edges[i])if(dist[i]+c<dist[j]){dist[j]=dist[i]+c;prev.set(j,i);queue.add(j)}}
    let best=dist[e.i]+e.t*e.d<dist[e.j]+(1-e.t)*e.d?e.i:e.j;if(!Number.isFinite(dist[best]))return null;
    const path=[];for(let i=best;i!==undefined;i=prev.get(i))path.unshift(nodes[i]);route=(s.i===e.i&&s.j===e.j)?[s.q,e.q]:[s.q,...path,e.q];connections=[[start,s.q],[e.q,end]];fit([start,...route,end]);request();
    return {metres:route.reduce((d,p,i)=>d+(i?len(route[i-1],p):0),0),gap:s.gap+e.gap};
  }
  function zoomBy(k,x=w/2,y=h/2){moveToken++;const p=inverse(x,y);state.zoom=clamp(state.zoom*k,.2,9);unit=Math.max(.43,Math.min(1.7,Math.max(w/1350,h/890)))*state.zoom;const q=inverse(x,y);state.x+=p[0]-q[0];state.y+=p[1]-q[1];request()}
  const pointers=new Map();let pinch=0;
  canvas.onpointerdown=e=>{moveToken++;canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.offsetX,e.offsetY]);if(pointers.size===2)pinch=len(...pointers.values())};
  canvas.onpointermove=e=>{if(!pointers.has(e.pointerId))return;const old=pointers.get(e.pointerId),next=[e.offsetX,e.offsetY];pointers.set(e.pointerId,next);
    if(pointers.size===2){const pts=[...pointers.values()],d=len(...pts);if(pinch>0)zoomBy(d/pinch,(pts[0][0]+pts[1][0])/2,(pts[0][1]+pts[1][1])/2);pinch=d}
    else if(e.shiftKey||e.buttons===2){state.angle+=(next[0]-old[0])*.008;request()}
    else{const a=inverse(...old),b=inverse(...next);state.x+=a[0]-b[0];state.y+=a[1]-b[1];request()}};
  canvas.onpointerup=canvas.onpointercancel=e=>{pointers.delete(e.pointerId);pinch=0};
  canvas.oncontextmenu=e=>e.preventDefault();canvas.addEventListener('wheel',e=>{e.preventDefault();zoomBy(Math.exp(-clamp(e.deltaY,-100,100)*.0025),e.offsetX,e.offsetY)},{passive:false});
  document.querySelector('#plus').onclick=()=>zoomBy(1.35);document.querySelector('#minus').onclick=()=>zoomBy(1/1.35);
  document.querySelector('#north').onclick=()=>{state.angle=0;request()};document.querySelector('#fit').onclick=()=>fit(campus||[[campBox[0],campBox[1]],[campBox[2],campBox[3]]]);
  new ResizeObserver(request).observe(canvas);state.hour=sunTimes()['Golden hour'];
  return {state,request,markers,findRoute,sunTimes,clearRoute(){route=[];connections=[];request()},focus(p){selected=p.id;if(p.coords){const [x,y]=local(p.coords);camera(x,y,Math.max(state.zoom,2))}request()},deselect(){selected=null;request()},view(flat){state.flat=flat;state.angle=flat?0:-.43;request()}};
})();
