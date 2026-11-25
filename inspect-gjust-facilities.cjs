const fs=require('node:fs'), cp=require('node:child_process');
const urls=Object.fromEntries(Object.entries({
  library:'Index_Department/University_Library/633',auditorium:'Index_Department/Ch_Ranbir_Singh_Auditorium/402',hostels:'Index_4/Hostels/3331',cafeteria:'Index_4s/Cafeteria/640',market:'Index_4s/Shopping_Complex/639',post:'Index_4s/Post_Office/417',bank:'Index_4s/Bank/641',cil:'Index_4s/C_I_L/396',sports:'Index_4s/Sports_Facilities/407',health:'Index_4/University_Health_Centre/399',hsb:'Index_Department/Haryana-School-of-Business/157',guest:'Index_4/VIP_guest_house/398',faculty:'Index_4s/Faculty_House/403',hall:'Index_4/Conference_Hall/638'
}).map(([key,route])=>[key,'https://gjust.ac.in/Page/'+route]));
const cache='C:/Desktop/portfolio website/.gjust-tour-data';
fs.mkdirSync(cache,{recursive:true});
(async()=>{
 await Promise.all(Object.entries(urls).map(([key,url])=>new Promise(resolve=>{
   cp.execFile('curl.exe',['-fsSL','--max-time','40',url,'-o',cache+'/'+key+'.html'],(e)=>{
    console.log(key,e?.code??'ok');resolve()
   });
 })));
})();
