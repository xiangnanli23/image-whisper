const APP_ID = 'image-whisper';
const HOST = 'https://toolkit-service-774429076434.us-central1.run.app';
export type ToolkitEnv = { TOOLKIT_URL?: string; TOOLKIT_TOKEN?: string };
const json = (body: unknown, status=200) => Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
/** A narrow, server-authenticated bridge. Never forwards caller-provided URLs or credentials. */
export async function toolkitRequest(request:Request,env:ToolkitEnv){
 const url=new URL(request.url);const path=url.pathname.slice('/api/toolkit'.length);
 const origin=request.headers.get('origin');if(origin&&origin!==url.origin)return json({error:'Cross-origin toolkit requests are not allowed.'},403);
 if(path==='/status'&&request.method==='GET')return json({configured:Boolean(env.TOOLKIT_TOKEN),consoleUrl:HOST+'/developer#/apps'});
 if(!env.TOOLKIT_TOKEN)return json({error:'Toolkit is not configured. Add TOOLKIT_TOKEN to server secrets.'},503);
 if(env.TOOLKIT_URL&&env.TOOLKIT_URL.replace(/\/$/,'')!==HOST)return json({error:'This demo is configured for the event toolkit only.'},503);
 const method=request.method;
 const profileRead=path==='/v1/librarian/getProfile'&&method==='POST';
 const events=path==='/v1/profile/events'&&method==='GET';
 const selection=path==='/v1/profile/selection'&&method==='GET';
 const register=path==='/v1/providers'&&method==='POST';
 const channel=/^\/v1\/providers\/iw-[a-f0-9-]{36}\/channel$/.test(path)&&['GET','POST'].includes(method);
 const disconnect=/^\/v1\/providers\/iw-[a-f0-9-]{36}$/.test(path)&&method==='DELETE';
 if(!profileRead&&!events&&!selection&&!register&&!channel&&!disconnect)return json({error:'This toolkit operation is not exposed by the demo.'},403);
 let body:string|undefined;
 if(method==='POST'){
  const raw=await request.text();if(raw.length>100000)return json({error:'Request too large.'},413);
  if(profileRead)body=JSON.stringify({args:[]});
  else if(register){
   let data;try{data=JSON.parse(raw);}catch{return json({error:'Invalid registration JSON.'},400);}
   if(data.application?.appId!==APP_ID||!/^iw-[a-f0-9-]{36}$/.test(data.providerId)||!Array.isArray(data.adapters)||data.adapters.length!==1||data.adapters[0]?.id!=='image-descriptions'||data.adapters[0]?.appId!==APP_ID)return json({error:'Only the Image Whisper adaptation can register here.'},403);
   body=raw;
  }else body=raw;
 }
 try{
  const headers:Record<string,string>={Authorization:`Bearer ${env.TOOLKIT_TOKEN}`};
  if(body)headers['Content-Type']='application/json';if(events||(channel&&method==='GET'))headers.Accept='text/event-stream';
  const response=await fetch(HOST+path,{method,headers,body,signal:request.signal,redirect:'manual'});
  if(response.status>=300&&response.status<400)return json({error:'Unexpected toolkit redirect.'},502);
  if(profileRead&&response.ok){
   const data=await response.json() as {ok:boolean;result?:{supportAreas?:string[];fields?:Record<string,unknown>}};
   if(!data.ok)return json({error:'The toolkit could not read the current profile.'},502);
   // Only preferences relevant to this demo reach the browser, never free-text notes or memories.
   const fields=data.result?.fields||{};
   const dimensions=new Set(['textSize','lineSpacing','reduceMotion','describeImages','readAloudRate','image-whisper/image-descriptions']);
   const needs=Array.isArray(fields.needs)?fields.needs.filter((n:unknown)=>n&&typeof n==='object'&&dimensions.has(String((n as {dimension?:unknown}).dimension))):[];
   return json({ok:true,result:{supportAreas:data.result?.supportAreas||[],fields:{needs}}});
  }
  return new Response(response.body,{status:response.status,headers:{'Content-Type':response.headers.get('Content-Type')||'application/json','Cache-Control':'no-store','X-Accel-Buffering':'no'}});
 }catch{return json({error:'Toolkit connection interrupted. The app will retry.'},502);}
}
