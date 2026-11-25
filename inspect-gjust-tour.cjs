const {spawn} = require('node:child_process');
const {mkdtempSync} = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--enable-unsafe-swiftshader', '--remote-debugging-pipe',
  '--no-first-run', '--no-default-browser-check',
  '--user-data-dir=' + mkdtempSync(path.join(os.tmpdir(), 'gjust-tour-')), 'about:blank'
], {stdio:['ignore','ignore','ignore','pipe','pipe'], windowsHide:true});
let sequence=0, buffer='', session;
const pending=new Map();
chrome.stdio[4].on('data',chunk=>{
  buffer+=chunk.toString();
  let i;
  while((i=buffer.indexOf('\0'))>=0){
    const msg=JSON.parse(buffer.slice(0,i));
    buffer=buffer.slice(i+1);
    if(pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  }
});
function command(method,params={},sessionId){
  const id=++sequence;
  const promise=new Promise(resolve=>pending.set(id,resolve));
  chrome.stdio[3].write(JSON.stringify({id,method,params,sessionId})+'\0');
  return promise;
}
(async()=>{
 const t=(await command('Target.createTarget',{url:'about:blank'})).result.targetId;
 session=(await command('Target.attachToTarget',{targetId:t,flatten:true})).result.sessionId;
 await command('Page.navigate',{url:'https://360gjuhisar.s3.ap-south-1.amazonaws.com/gju_hisar/index.html'},session);
 let output;
 for(let i=0;i<30;i++){
   await new Promise(r=>setTimeout(r,900));
   const res=await command('Runtime.evaluate',{expression:`(()=>{
     const viewer=document.querySelector('#krpanoSWFObject');
     if(!viewer || !viewer.get || !viewer.get('scene.count'))return {waiting:document.title,text:document.body.innerText.slice(0,300),ids:Array.from(document.querySelectorAll('[id]'),el=>el.id).slice(0,20)};
     return Array.from({length:viewer.get('scene.count')},(_,index)=>Object.fromEntries(['name','title','lat','lng','thumburl'].map(key=>[key,viewer.get('scene['+index+'].'+key)])));
   })()`,returnByValue:true},session);
   output=res.result?.result?.value;
   if(Array.isArray(output)) break;
 }
 console.log(JSON.stringify(output));
 await command('Browser.close');
})().catch(e=>{console.error(e);chrome.kill()});
