(function application(){
  'use strict';
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const key=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const matches=(query,...fields)=>key(query).split(' ').every(token=>key(fields.flat().join(' ')).includes(token));
  const ref=(url,label,cls='source')=>`<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}</a>`;
  const styles={
    Academics:['academic','#5b7553','#e7efdc'],Hostels:['hostel','#8d6c48','#f1e7d8'],Landmarks:['landmark','#9c674b','#f4e3d3'],
    Amenities:['service','#5a7790','#e2eaf0'],Gardens:['tree','#598267','#e0eddc'],Sports:['sport','#857093','#eee6ef']
  };
  function category(s){s=key(s);if(/hostel|residen/.test(s))return 'Hostels';if(/garden|green|park/.test(s))return 'Gardens';if(/sport/.test(s))return 'Sports';if(/amenit|service|bank|aid|water|toilet|health|shop|dining/.test(s))return 'Amenities';if(/academic|department|laborator|lecture|faculty|library/.test(s))return 'Academics';return 'Landmarks'}
  const tone=c=>`--c:${styles[c][1]};--t:${styles[c][2]}`;
  const emblem=c=>`<span class="swatch" style="${tone(c)}">${icon(styles[c][0])}</span>`;
  const geo=window.CAMPUS_GEO.features.filter(f=>f.geometry.type==='Point').map(f=>({...f.properties,coords:f.geometry.coordinates,mapSource:f.properties.sourceUrl,source:f.properties.sourceUrl}));
  const listings=(window.CAMPUS_PLACES||[]).map(p=>({...p,category:category(p.category)}));
  function matchPlace(a,b){const normalize=s=>key(s).replace(/choudhary|chaudhary|ch /g,'').replace(/girls hostel (?:no )?(?:i|1)\b/g,'girls hostel 1');return [a.name,...(a.aliases||[])].some(s=>normalize(s)===normalize(b.name))}
  for(const g of geo){const p=listings.find(p=>matchPlace(p,g));if(p){p.coords=g.coords;p.accuracy=g.accuracy;p.mapSource=g.mapSource}else listings.push({...g,category:category(g.category)})}
  const shortNames={'Department of Pharmaceutical Sciences':'Pharmaceutical Sciences','Ch. Ranbir Singh Auditorium':'Ranbir Singh Auditorium','Central Instrumentation Room':'Instrumentation Room','Punjab National Bank & ATM':'PNB & ATM'};
  const places=listings.map((p,i)=>({...p,id:i,icon:styles[p.category][0],short:shortNames[p.name]||p.name}));
  const faculty=window.CAMPUS_DIRECTORY||[],services=window.CAMPUS_SERVICES||[],resources=window.CAMPUS_RESOURCES||[];
  const mapped=places.filter(p=>p.coords);
  const featured=[/ambedkar library|university library/i,/ranbir singh auditorium/i,/administrative block/i,/cafeteria/i,/shopping complex/i,/garden of fragrance/i];
  const highlights=[...new Set(featured.map(re=>places.find(p=>re.test(p.name))).filter(Boolean))];
  const isMobile=()=>matchMedia('(max-width:720px)').matches;
  let page='map',browseCat='',query='',allPlaces=false,visibleCards=36,facultySearch='',facultyDept='',guideSearch='',timeLabel='Golden hour',current=null;
  const sheet=b=>$('#mapPage').classList.toggle('sheet-open',b);
  function openSheet(){sheet(true);$('#sidebar').scrollTop=0}
  function listMarkers(){Atlas.markers(mapped.filter(p=>!browseCat||p.category===browseCat),showPlace)}
  const closeSheet='<button class="iconbtn" data-do="close-sheet" aria-label="Close panel">'+icon('x')+'</button>';
  const back=()=>`<div class="smallhead"><button class="back" data-do="back">${icon('back')}Explore campus</button>${closeSheet}</div>`;
  function placeRow(p){return `<button class="place-row" data-place="${p.id}">${p.image?`<img src="${esc(p.image)}" alt="" loading="lazy">`:emblem(p.category)}<span class="rowtext"><b>${esc(p.short)}</b><small>${esc(p.category)}</small></span>${icon('chev')}</button>`}
  function explorer(){
    current=null;Atlas.deselect();Atlas.clearRoute();listMarkers();
    $('#sideContent').innerHTML=`<div class="smallhead"><div class="eyebrow">${icon('pin')} Campus explorer</div>${closeSheet}</div><h1>Explore campus</h1><p class="university">Guru Jambheshwar University of Science and Technology, Hisar</p>
    <label class="search">${icon('search')}<input id="globalSearch" aria-label="Search places and faculty" placeholder="Search places, faculty…" value="${esc(query)}"><kbd>/</kbd></label>
    <button class="action full" data-do="directions">${icon('route')}Get directions</button>
    <section id="browseControls"><div class="section-title"><h3>Browse by category</h3></div><div class="categories">${Object.keys(styles).map(c=>`<button class="cat ${browseCat===c?'selected':''}" aria-pressed="${browseCat===c}" data-cat="${c}">${emblem(c)}${c}</button>`).join('')}</div></section><div id="sideResults"></div>`;
    $('#globalSearch').oninput=e=>{query=e.target.value;sideResults()};sideResults();
  }
  function sideResults(){const q=query.trim(),ps=places.filter(p=>(!browseCat||p.category===browseCat)&&matches(q,p.name,p.aliases,p.category,p.description)),fs=q?faculty.filter(f=>matches(q,f.name,f.department)).slice(0,12):[];
    $('#browseControls').hidden=!!q;const home=!q&&!browseCat&&!allPlaces,shown=home?highlights:ps;
    $('#sideResults').innerHTML=`<div class="section-title"><h3>${q?'Search results':browseCat|| (home?'Campus highlights':'All places')}</h3>${home?'<button class="textbtn" data-do="all">View all</button>':`<small>${ps.length} places</small>`}</div>${shown.map(placeRow).join('')}${fs.length?`<div class="section-title"><h3>Faculty</h3></div>${fs.map(f=>`<button class="place-row" data-faculty="${faculty.indexOf(f)}"><span class="swatch">${icon('people')}</span><span class="rowtext"><b>${esc(f.name)}</b><small>${esc(f.department)}</small></span>${icon('chev')}</button>`).join('')}`:''}${!shown.length&&!fs.length?'<p class="empty">No matches. Try a surname, department or place name.</p>':''}${q||browseCat||allPlaces?'<button class="secondary full more" data-do="reset">Show campus highlights</button>':''}`;
  }
  function detail(p){
    return `${back()}<div class="detail"><div class="eyebrow">${icon(p.icon)} ${esc(p.category)}</div><h2>${esc(p.name)}</h2>${p.image?`<img class="detail-hero" src="${esc(p.image)}" alt="${esc(p.name)}">`:''}${p.description?`<p>${esc(p.description)}</p>`:''}${p.coords?`<p class="hint">${esc(p.accuracy||'Mapped campus location')} · ${p.coords[1].toFixed(5)}° N, ${p.coords[0].toFixed(5)}° E</p>`:'<p class="hint">An exact campus pin is unavailable for this place.</p>'}
    ${p.phone?phoneLink(p.phone):''}${p.email?emailLink(p.email):''}<button class="action full" data-dest="${p.id}">${icon('route')}Directions here</button>${p.coords?'<button class="secondary full" data-do="see-map">'+icon('focus')+'Show on map</button>':''}
    ${p.source?ref(p.source,'Place information source'):''}${p.mapSource&&p.mapSource!==p.source?' · '+ref(p.mapSource,'Map pin source'):''}</div>`;
  }
  function showPlace(id){const p=places[Number(id)];if(!p)return;current=p;Atlas.clearRoute();Atlas.markers(mapped,showPlace);Atlas.focus(p);$('#sideContent').innerHTML=detail(p);openSheet()}
  function phoneLink(phone){const raw=String(phone).replace(/[^\d+]/g,'');const tel=raw.startsWith('0')?'+91'+raw.slice(1):raw.length===10?'+91'+raw:raw;return `<a class="contact" href="tel:${esc(tel)}">${icon('phone')}${esc(phone)}</a>`}
  function emailLink(email){return `<a class="contact" href="mailto:${esc(email)}">${icon('mail')}${esc(email)}</a>`}
  const knownBlocks=[
    [/computer science.*engineering/i,6,'https://gjust.ac.in/portal/upload/f8dd117c-b038-49b2-823e-e92664ae31f3.pdf'],
    [/pharmaceutical sciences/i,2,'https://gjust.ac.in/portal/upload/Standard%20Inspection%20Form%20Jan%202025_15January2025_13-28-19-80.pdf'],
    [/civil engineering/i,4,'https://gjust.ac.in/portal/upload/Marks%20List_17February2026_11-04-24-17.pdf'],
    [/food technology/i,1,'https://gjust.ac.in/portal/StaffImage/efa6dcb8-3247-4080-a8db-0066745bdb34.pdf']
  ];
  function facultyCard(f){const block=knownBlocks.find(([re])=>re.test(f.department)),roomBlock=f.office?.match(/block\s*(?:no\.?\s*)?(\d+)/i),num=roomBlock?Number(roomBlock[1]):block?.[1];
    const re=num?new RegExp('teaching block (?:'+num+'|'+['','i','ii','iii','iv','v','vi','vii','viii'][num]+')\\b','i'):null;
    const dest=(re&&mapped.find(p=>re.test(p.name)))||(num===2&&mapped.find(p=>/department of pharmaceutical/i.test(p.name)))||mapped.find(p=>key(p.name)===key(f.department));
    return `<article class="card"><div class="eyebrow">${icon('people')}${esc(f.role||'Faculty member')}</div><h3>${esc(f.name)}</h3><p>${esc(f.department)}</p>${f.office||num?`<p class="office">${icon('pin')}${esc(f.office||'Department location · Teaching Block '+num)}</p>`:''}${f.email?emailLink(f.email):''}${f.phone?phoneLink(f.phone):''}
    <footer>${dest?`<button data-facpin="${dest.id}">${icon('map')}Show department</button>`:''}${ref(f.source,'Faculty source','')}${f.officeSource||block?ref(f.officeSource||block[2],'Location source',''):''}</footer></article>`;
  }
  function showFaculty(id){const f=faculty[Number(id)];if(!f)return;$('#sideContent').innerHTML=back()+facultyCard(f);openSheet()}
  const placeValue=p=>p.coords?p.coords[1]+','+p.coords[0]:p.name+', GJUST, Hisar, Haryana';
  function routing(dest){current=null;browseCat='';Atlas.markers(mapped,showPlace);Atlas.clearRoute();Atlas.deselect();openSheet();
    const ordered=[...places].sort((a,b)=>a.name.localeCompare(b.name));
    const options=ordered.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');
    $('#sideContent').innerHTML=`${back()}<section class="route"><div class="eyebrow">${icon('walk')}Walking routes</div><h2>Get directions</h2><p>Choose two campus places to find your way.</p><label>From<select id="origin"><option value="">Choose a starting place</option>${options}</select></label><label>To<select id="destination"><option value="">Choose a destination</option>${options}</select></label><div class="route-actions"><button class="action" id="findRoute">${icon('route')}Find route</button><button class="secondary" id="swapRoute" aria-label="Swap start and destination">${icon('swap')}</button></div><div id="routeResult" role="status"></div></section>`;
    if(dest!==undefined)$('#destination').value=String(dest);
    const clear=()=>{Atlas.clearRoute();$('#routeResult').replaceChildren()};
    $('#origin').onchange=$('#destination').onchange=clear;
    $('#swapRoute').onclick=()=>{const o=$('#origin'),d=$('#destination');[o.value,d.value]=[d.value,o.value];clear()};
    $('#findRoute').onclick=()=>{
      const s=$('#origin').value,t=$('#destination').value,out=$('#routeResult');clear();
      if(!s||!t||s===t){out.innerHTML='<p>Choose two different campus places.</p>';return}
      const a=places[Number(s)],b=places[Number(t)];
      const route=a.coords&&b.coords?Atlas.findRoute(a.coords,b.coords):null;
      const url='https://www.google.com/maps/dir/?'+new URLSearchParams({api:'1',travelmode:'walking',origin:placeValue(a),destination:placeValue(b)});
      if(route){const dist=route.metres,pretty=dist>=1000?(dist/1000).toFixed(1)+' km':Math.round(dist/5)*5+' m';
        out.innerHTML=`<div class="route-result"><strong>${pretty} · ${Math.max(1,Math.ceil(dist/75))} min</strong><p>Walk the green route from ${esc(a.short)} to ${esc(b.short)}.</p><small>Distance follows mapped paths. Dotted ends show the gap to each pin. Use signs for the final approach.</small></div><button class="secondary full" data-do="see-map">${icon('map')}View route on map</button>`;
      }else out.innerHTML=`<div class="route-result"><strong>Check the last approach</strong><p>${a.coords&&b.coords?'These places do not share a verified walking connection in the campus map.':'An exact map pin is missing for one or both places.'}</p>${ref(url,'Look up this walk in Google Maps')}</div>`;
    };
  }
  function facultyPage(){const departments=[...new Set(faculty.map(f=>f.department))].sort();
    $('#otherPage').innerHTML=`<div class="pagehead"><div class="eyebrow">${icon('people')}GJUST · Hisar</div><h1>Faculty directory</h1><p>Find a professor’s university-listed contact details and published office location.</p></div><div class="filters"><label class="search">${icon('search')}<input id="peopleSearch" aria-label="Search faculty" placeholder="Search by name, email or department" value="${esc(facultySearch)}"></label><select class="select" id="dept" aria-label="Filter by department"><option value="">All departments</option>${departments.map(d=>`<option ${d===facultyDept?'selected':''}>${esc(d)}</option>`).join('')}</select></div><div id="facultyResults"></div>`;
    const update=()=>{facultySearch=$('#peopleSearch').value;facultyDept=$('#dept').value;visibleCards=36;cards()};$('#peopleSearch').oninput=update;$('#dept').onchange=update;cards();
  }
  function cards(){const results=faculty.filter(f=>(!facultyDept||f.department===facultyDept)&&matches(facultySearch,f.name,f.department,f.email,f.office));
    $('#facultyResults').innerHTML=`<div class="count">${results.length} faculty ${results.length===1?'listing':'listings'}</div><div class="cards">${results.slice(0,visibleCards).map(facultyCard).join('')}</div>${results.length>visibleCards?'<button class="secondary more" data-do="more">Show more faculty</button>':''}${!results.length?'<p>No faculty match this search.</p>':''}`;
  }
  function guidePage(){ $('#otherPage').innerHTML=`<div class="pagehead"><div class="eyebrow">${icon('book')}GJUST · Hisar</div><h1>Campus guide</h1><p>University services, office numbers and student resources in one place.</p></div><div class="filters"><label class="search">${icon('search')}<input id="guideSearch" aria-label="Search the campus guide" placeholder="Search services, portals, hostels…" value="${esc(guideSearch)}"></label></div><div id="guideResults"></div>`;
    $('#guideSearch').oninput=e=>{guideSearch=e.target.value;guideResults()};guideResults();
  }
  function guideResults(){const links=resources.filter(p=>matches(guideSearch,p.name,p.title,p.description,p.category)),contacts=services.filter(s=>matches(guideSearch,s.name,s.description)),ps=places.filter(p=>matches(guideSearch,p.name,p.category,p.aliases));
    $('#guideResults').innerHTML=`${links.length?`<h2 class="guide-section">Student resources</h2><div class="cards">${links.map(p=>`<a target="_blank" rel="noopener" class="card guide-res" href="${esc(p.url||p.source||p.href)}"><h3>${esc(p.name||p.title)}</h3><p>${esc(p.description||'Open university resource')}</p></a>`).join('')}</div>`:''}
    ${contacts.length?`<h2 class="guide-section">Office contacts</h2><div class="cards">${contacts.map(p=>`<article class="card"><h3>${esc(p.name)}</h3>${p.description?`<p>${esc(p.description)}</p>`:''}${phoneLink(p.phone)}${ref(p.source,'University listing')}</article>`).join('')}</div>`:''}${guideSearch&&ps.length?`<h2 class="guide-section">Places</h2><div class="cards">${ps.map(placeRow).join('')}</div>`:''}${guideSearch&&!links.length&&!contacts.length&&!ps.length?'<p>No matching resources.</p>':''}
    <details class="sources"><summary>About this map and its sources</summary><p>An independent student-facing guide to Guru Jambheshwar University of Science and Technology, Hisar. Building footprints follow Overture Maps. Heights, facades, tree placement and lighting are illustrative. Campus roads come from OpenStreetMap. Walking estimates cover mapped outdoor paths and may miss gates, steps or temporary closures.</p><p>${ref('https://www.openstreetmap.org/copyright','© OpenStreetMap contributors · ODbL')} · ${ref('https://docs.overturemaps.org/attribution/','Overture Maps · Google Open Buildings and Microsoft ML Buildings')}. Faculty and facility entries link to the records used.</p><p>The supplied 360° campus tour displayed an expired-license message when checked. ${ref('https://360gjuhisar.s3.ap-south-1.amazonaws.com/gju_hisar/index.html','Original tour')}</p></details>`;
  }
  function changePage(next){page=['faculty','guide'].includes(next)?next:'map';$('#mapPage').hidden=page!=='map';$('#otherPage').hidden=page==='map';
    $$('nav [data-page]').forEach(b=>{b.classList.toggle('active',b.dataset.page===page);if(b.dataset.page===page)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
    if(page==='faculty')facultyPage();else if(page==='guide')guidePage();else Atlas.request();window.scrollTo(0,0)}
  function go(next){if(location.hash!=='#'+next)history.pushState(null,'','#'+next);changePage(next)}
  window.addEventListener('popstate',()=>changePage(location.hash.slice(1)));
  function view(flat){Atlas.view(flat);for(const [sel,active] of [['#view3',!flat],['#view2',flat]]){$(sel).classList.toggle('active',active);$(sel).setAttribute('aria-pressed',String(active))}}
  $('#view3').onclick=()=>view(false);$('#view2').onclick=()=>view(true);
  const fmtTime=value=>`${String(Math.floor(value)%24).padStart(2,'0')}:${String(Math.floor((value%1)*60)).padStart(2,'0')}`;
  function settings(){const s=Atlas.state,dlg=$('#settings'),presets={Live:null,...Atlas.sunTimes()};const time=new Date(Date.now()+19800000),hour=s.live?time.getUTCHours()+time.getUTCMinutes()/60:s.hour;
    dlg.firstElementChild.innerHTML=`<div class="dialog-top"><h2>Time & atmosphere</h2><button class="iconbtn" id="closeSettings" aria-label="Close settings">${icon('x')}</button></div><div class="presets">${Object.keys(presets).map(p=>`<button class="${timeLabel===p?'active':''}" data-preset="${p}">${p}</button>`).join('')}</div>
    <label class="field">Hisar time · <output id="timeVal">${fmtTime(hour)} IST</output><input type="range" min="0" max="23.9833" step="0.0166667" id="hour" value="${hour}"></label><label class="field">Weather<select id="weather">${selectOptions(['Clear','Cloudy','Fog','Rain'],s.weather)}</select></label><label class="field">Season<select id="season">${selectOptions(['Summer','Monsoon','Autumn','Winter'],s.season)}</select></label><label class="check"><input type="checkbox" id="lite" ${s.lite?'checked':''}>Lite mode for slower phones</label>`;
    if(!dlg.open)dlg.showModal();$('#closeSettings').onclick=()=>dlg.close();
    $$('[data-preset]').forEach(b=>b.onclick=()=>{timeLabel=b.dataset.preset;s.live=timeLabel==='Live';if(!s.live)s.hour=presets[timeLabel];envLabel();settings()});
    $('#hour').oninput=e=>{s.hour=Number(e.target.value);s.live=false;timeLabel=fmtTime(s.hour)+' IST';$('#timeVal').textContent=timeLabel;$$('[data-preset]').forEach(b=>b.classList.remove('active'));envLabel()};
    $('#weather').onchange=e=>{s.weather=e.target.value;envLabel()};$('#season').onchange=e=>{s.season=e.target.value;envLabel()};$('#lite').onchange=e=>{s.lite=e.target.checked;try{localStorage.setItem('atlas-lite',String(s.lite))}catch{}Atlas.request()};
  }
  function selectOptions(options,current){return options.map(v=>`<option ${v===current?'selected':''}>${v}</option>`).join('')}
  function envLabel(){$('#envText').textContent=timeLabel==='Live'?'Live · Hisar':timeLabel;Atlas.request()}
  $('#env').onclick=settings;$('#settings').onclick=e=>{if(e.target===$('#settings'))$('#settings').close()};
  function clock(){$('#clock').textContent=new Intl.DateTimeFormat('en-IN',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit'}).format(new Date());if(Atlas.state.live){Atlas.request();if($('#settings').open)settings()}}
  clock();setInterval(clock,60000);
  $('#mobileExplore').onclick=()=>{explorer();openSheet()};
  document.body.addEventListener('click',e=>{const el=e.target.closest('[data-page],[data-do],[data-cat],[data-place],[data-faculty],[data-dest],[data-facpin],.brand');if(!el)return;
    if(el.matches('.brand')){e.preventDefault();go('map');browseCat='';query='';allPlaces=false;explorer();sheet(false);return}
    const d=el.dataset;
    if(d.page){go(d.page);return}if(d.cat){browseCat=browseCat===d.cat?'':d.cat;query='';allPlaces=false;explorer();return}
    if(d.place!==undefined||d.facpin!==undefined){go('map');showPlace(d.place??d.facpin);return}if(d.faculty!==undefined){showFaculty(d.faculty);return}if(d.dest!==undefined){routing(Number(d.dest));return}
    switch(d.do){case 'back':explorer();break;case 'close-sheet':case 'see-map':sheet(false);if(!isMobile()&&current)Atlas.focus(current);break;case 'directions':routing();break;case 'all':allPlaces=true;sideResults();break;case 'reset':browseCat='';allPlaces=false;query='';explorer();break;case 'more':visibleCards+=36;cards();break}
  });
  document.addEventListener('keydown',e=>{if(e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)&&!$('#settings').open){e.preventDefault();if(page==='map'){explorer();if(isMobile())openSheet()}(page==='map'?$('#globalSearch'):page==='faculty'?$('#peopleSearch'):$('#guideSearch')).focus()}if(e.key==='Escape'&&!$('#settings').open&&isMobile())sheet(false)});
  try{Atlas.state.lite=localStorage.getItem('atlas-lite')==='true'}catch{}
  explorer();changePage(location.hash.slice(1));
})();
