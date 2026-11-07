import {test} from 'node:test';
import assert from 'node:assert/strict';
import {toolkitRequest} from '../lib/toolkit-proxy.ts';
import {imageDescriptionDescriptor,settingsFromProfile} from '../lib/toolkit-client.ts';
import {checkDescriptor,createAdapterProvider,fromToggleAdapter} from '@ai4a11y/toolkit/adapter-mcp';
import {toAbilityModel} from '@ai4a11y/toolkit/core/ability';
import {renderWebSettings} from '@ai4a11y/toolkit/surfaces/web';
const env={TOOLKIT_TOKEN:'aat_test'};
const request=(path,method='POST',body={})=>new Request('https://demo.example/api/toolkit'+path,{method,headers:{'content-type':'application/json'},...(method==='POST'?{body:JSON.stringify(body)}:{})});
test('bridge does not expose profile writes or unrelated toolkit APIs',async()=>{for(const path of ['/v1/librarian/setProfileField','/v1/mcp','/v1/apps','/v1/providers/other-app/channel'])assert.equal((await toolkitRequest(request(path),env)).status,403);});
test('bridge rejects registration for another app',async()=>assert.equal((await toolkitRequest(request('/v1/providers','POST',{application:{appId:'other'},providerId:'iw-'+crypto.randomUUID(),adapters:[]}),env)).status,403));
test('bridge requires a configured server token',async()=>assert.equal((await toolkitRequest(request('/v1/profile/selection','GET'),{})).status,503));
test('cross-origin calls cannot use the toolkit credential',async()=>assert.equal((await toolkitRequest(new Request('https://demo.example/api/toolkit/status',{headers:{origin:'https://untrusted.example'}}),env)).status,403));
test('official toolkit maps profile preferences to supported web settings',()=>{const model=toAbilityModel({supportAreas:['vision'],fields:{needs:[{dimension:'textSize',value:1.5,strength:'preference'},{dimension:'reduceMotion',value:true,strength:'preference'},{dimension:'describeImages',value:true,strength:'preference'}]}});assert.deepEqual(renderWebSettings(model),{fontScale:150,motionReducer:true,autoDescribe:true});});
test('image-description adapter validates and supports apply/query/revert',async()=>{const descriptor=imageDescriptionDescriptor('https://demo.example');assert.deepEqual(checkDescriptor(descriptor),[]);let enabled=false;const adapter={get enabled(){return enabled;},enable(){enabled=true;},disable(){enabled=false;}};const wrapped=fromToggleAdapter({descriptor,adapter,parameters:()=>({})});const applied=await wrapped.apply({desired:{enabled:true,parameters:{}}});assert.equal(enabled,true);assert.equal((await wrapped.query()).state.enabled,true);const undone=await wrapped.revert({token:applied.undo.token});assert.equal(undone.status,'applied');assert.equal(enabled,false);});

test('app-specific accepted image-description need enables its adaptation',()=>{assert.equal(settingsFromProfile({fields:{needs:[{dimension:'image-whisper/image-descriptions',value:true}]}}).autoDescribe,true);assert.equal(settingsFromProfile({fields:{needs:[{dimension:'describeImages',value:true},{dimension:'image-whisper/image-descriptions',value:false}]}}).autoDescribe,false);});
