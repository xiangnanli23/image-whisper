import {createAdapterProvider,connectToToolkit,defineDescriptor,fromToggleAdapter,detectBrowserPlatform} from '@ai4a11y/toolkit/adapter-mcp';
import {toAbilityModel} from '@ai4a11y/toolkit/core/ability';
import {renderWebSettings} from '@ai4a11y/toolkit/surfaces/web';
export const APP_ID='image-whisper';
export type ToolkitSettings={fontScale?:number;lineHeight?:number;motionReducer?:boolean;autoDescribe?:boolean;speechRate?:number};
export type IntegrationCallbacks={onStatus:(state:string,message?:string)=>void;onProfile:(settings:ToolkitSettings,name:string)=>void;setEnabled:(on:boolean)=>void;getEnabled:()=>boolean};
export function imageDescriptionDescriptor(origin:string){return defineDescriptor({
 appId:APP_ID,id:'image-descriptions',name:'On-demand image descriptions',version:'0.2.0',
 description:'Shows a Describe image button on each photo for people who cannot see or interpret the image. AI runs only after the person asks. Includes read-aloud.',
 supportAreas:['vision'],settingsKeys:['autoDescribe'],
 targets:[{platforms:['*'],urls:[origin+'/*']}],
 operations:['query','check','apply','revert','targets'],
 effects:{writes:['ui.imageDescriptions'],idempotent:true,reversibility:'full'},
 needs:[{id:'image-descriptions',phrase:'Describe images when I ask',description:'Offers a button that turns the visible content of an image into text and optional speech.',abilities:'Seeing small or visual details can be difficult with blindness or low vision.'}],
});}
export function settingsFromProfile(profile:Parameters<typeof toAbilityModel>[0]):ToolkitSettings{
 const settings=renderWebSettings(toAbilityModel(profile)) as ToolkitSettings;
 const needs=profile?.fields?.needs;
 if(Array.isArray(needs)){
  const custom=[...needs].reverse().find((n:unknown)=>n&&typeof n==='object'&&(n as {dimension?:unknown}).dimension==='image-whisper/image-descriptions') as {value?:unknown}|undefined;
  if(typeof custom?.value==='boolean')settings.autoDescribe=custom.value;
 }
 return settings;
}
export function startToolkit(callbacks:IntegrationCallbacks){
 let closed=false;let paused=false;let session=0;let retryTimer:ReturnType<typeof setTimeout>|undefined;let link:ReturnType<typeof connectToToolkit>|undefined;let profileTimer:ReturnType<typeof setTimeout>|undefined;let eventAbort:AbortController|undefined;
 const prefix=location.origin+'/api/toolkit';
 const safeFetch:typeof fetch=(input,init)=>{const headers=new Headers(init?.headers);headers.delete('authorization');return fetch(input,{...init,headers});};
 async function refresh(expectedSession=session){
  const [profileResponse,selectionResponse]=await Promise.all([fetch(prefix+'/v1/librarian/getProfile',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"args":[]}'}),fetch(prefix+'/v1/profile/selection')]);
  if(!profileResponse.ok)throw new Error('Could not read the toolkit profile.');
  const profile=await profileResponse.json() as {ok:boolean;result:Parameters<typeof toAbilityModel>[0]};
  if(!profile.ok)throw new Error('The toolkit did not return a profile.');
  const selection=selectionResponse.ok?await selectionResponse.json() as {selected?:{name?:string}}:{};
  const settings=settingsFromProfile(profile.result);
  if(!closed&&!paused&&expectedSession===session)callbacks.onProfile(settings,selection.selected?.name||'Default profile');
 }
 async function watchProfile(expectedSession:number){
  while(!closed&&!paused&&expectedSession===session){
   eventAbort=new AbortController();
   try{
    const response=await fetch(prefix+'/v1/profile/events',{signal:eventAbort.signal});
    if(!response.ok||!response.body)throw new Error('Profile stream interrupted');
    const reader=response.body.getReader();const decoder=new TextDecoder();let buffer='';
    while(!closed&&!paused&&expectedSession===session){const chunk=await reader.read();if(chunk.done)break;buffer+=decoder.decode(chunk.value,{stream:true});let index;while((index=buffer.indexOf('\n\n'))!==-1){const event=buffer.slice(0,index);buffer=buffer.slice(index+2);if(event.includes('event: profile')){clearTimeout(profileTimer);profileTimer=setTimeout(()=>{void refresh(expectedSession).catch(()=>callbacks.onStatus('reconnecting','Profile refresh interrupted.'));},100);}}}
   }catch{if(closed||paused||expectedSession!==session)return;}
   await new Promise(r=>setTimeout(r,3000));
   if(!closed&&!paused&&expectedSession===session)void refresh(expectedSession).catch(()=>{});
  }
 }
 async function begin(){
  const expectedSession=session;
  const inactive=()=>closed||paused||expectedSession!==session;
  try{
   const configResponse=await fetch(prefix+'/status');
   if(!configResponse.ok)throw new Error('Could not reach the toolkit connection service.');
   const config=await configResponse.json() as {configured:boolean};
   if(inactive())return;
   if(!config.configured){callbacks.onStatus('unconfigured','Set TOOLKIT_TOKEN in server secrets to connect.');return;}
   callbacks.onStatus('connecting');
   const adapter={get enabled(){return callbacks.getEnabled();},enable(){callbacks.setEnabled(true);},disable(){callbacks.setEnabled(false);}};
   const descriptor=imageDescriptionDescriptor(location.origin);
   const provider=createAdapterProvider({application:{appId:APP_ID,name:'Image Whisper',version:'0.2.0',visibility:'app',supportedPlatforms:[{environment:'web-page'}],platform:detectBrowserPlatform(),surfaces:['web']},adapters:[fromToggleAdapter({adapter,descriptor,parameters:()=>({}),targets:()=>({candidates:[{target:{url:location.href}}],coverage:'complete'}),resolveTarget:(target:{url?:string})=>target.url&&new URL(target.url).origin===location.origin?null:{code:'target-unavailable',message:'This adaptation only changes the open Image Whisper page.'}})]});
   await refresh(expectedSession);if(inactive())return;
   link=connectToToolkit({url:prefix,token:'aat_server-side-placeholder',provider,providerId:'iw-'+crypto.randomUUID(),label:'Image Whisper demo',fetch:safeFetch,onStatus:(s:{state:string;message?:string})=>{if(!inactive())callbacks.onStatus(s.state,s.message);}});
   await link.ready;if(!inactive())void watchProfile(expectedSession);
  }catch(error){
   if(inactive())return;
   const terminal=link?.status.state==='failed';
   callbacks.onStatus(terminal?'failed':'reconnecting',error instanceof Error?error.message:'Toolkit connection interrupted.');
   if(!terminal)retryTimer=setTimeout(()=>{if(!inactive())void begin();},3000);
  }
 }
 void begin();
 const pause=()=>{paused=true;session++;eventAbort?.abort();clearTimeout(profileTimer);clearTimeout(retryTimer);void link?.close();link=undefined;};
 const resume=()=>{if(paused&&!closed){paused=false;callbacks.onStatus('connecting');void begin();}};
 window.addEventListener('pagehide',pause);window.addEventListener('pageshow',resume);
 return ()=>{closed=true;pause();window.removeEventListener('pagehide',pause);window.removeEventListener('pageshow',resume);};
}
