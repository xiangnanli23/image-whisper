import {test} from 'node:test';
import assert from 'node:assert/strict';
import {startToolkit} from '../lib/toolkit-client.ts';

function fixture({failFirst=false}={}){
 const originals={window:globalThis.window,location:globalThis.location,fetch:globalThis.fetch};
 const listeners=new Map();let registrations=0,configCalls=0,deletions=0;const states=[];
 globalThis.location={origin:'https://demo.example',href:'https://demo.example/'};
 globalThis.window={addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)};
 globalThis.fetch=async(input,init={})=>{
  const url=String(input);
  if(url.endsWith('/status')){configCalls++;if(failFirst&&configCalls===1)throw new TypeError('Temporary network failure');return Response.json({configured:true});}
  if(url.endsWith('/getProfile'))return Response.json({ok:true,result:{fields:{needs:[{dimension:'describeImages',value:true}]}}});
  if(url.endsWith('/selection'))return Response.json({selected:null});
  if(url.endsWith('/providers')){registrations++;return Response.json({providerId:JSON.parse(init.body).providerId,endpoints:{}});}
  if(init.method==='DELETE'){deletions++;return new Response(null,{status:204});}
  if(url.endsWith('/channel')||url.endsWith('/events')){
   return new Response(new ReadableStream({start(controller){init.signal?.addEventListener('abort',()=>controller.error(new DOMException('Aborted','AbortError')),{once:true});}}),{headers:{'content-type':'text/event-stream'}});
  }
  throw new Error('Unexpected test route');
 };
 const close=startToolkit({onStatus:s=>states.push(s),onProfile(){},getEnabled:()=>true,setEnabled(){}});
 return {listeners,states,get registrations(){return registrations;},get configCalls(){return configCalls;},get deletions(){return deletions;},close:async()=>{close();await flush();Object.assign(globalThis,originals);}};
}
async function flush(){for(let i=0;i<20;i++)await new Promise(setImmediate);}
async function until(predicate){for(let i=0;i<1000;i++){if(predicate())return;await new Promise(setImmediate);}assert.fail('Lifecycle did not reach expected state');}
test('restoring a page from back-forward cache opens a fresh toolkit connection',async()=>{
 const f=fixture();try{
  await until(()=>f.states.includes('connected'));assert.equal(f.registrations,1);
  f.listeners.get('pagehide')({persisted:true});await until(()=>f.deletions===1);
  assert.equal(typeof f.listeners.get('pageshow'),'function');
  f.listeners.get('pageshow')({persisted:true});await until(()=>f.registrations===2);await until(()=>f.states.filter(s=>s==='connected').length===2);
 }finally{await f.close();}
});
test('an initial network failure retries without requiring a reload',async(t)=>{
 t.mock.timers.enable({apis:['setTimeout']});const f=fixture({failFirst:true});
 try{await flush();assert.equal(f.configCalls,1);assert.ok(f.states.includes('reconnecting'));t.mock.timers.tick(3001);await until(()=>f.states.includes('connected'));assert.equal(f.configCalls,2);assert.equal(f.registrations,1);}finally{await f.close();t.mock.timers.reset();}
});
