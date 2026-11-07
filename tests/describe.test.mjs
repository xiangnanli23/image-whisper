import {test} from 'node:test';
import assert from 'node:assert/strict';
import {describeRequest} from '../lib/describe.ts';
const req=(body,headers={})=>new Request('http://localhost/api/describe',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
test('requires a server credential',async()=>assert.equal((await describeRequest(req({}))).status,503));
test('refuses cross-origin requests',async()=>assert.equal((await describeRequest(req({}, {origin:'https://other.example'}),'test')).status,403));
test('refuses arbitrary image URLs before fetching',async()=>assert.equal((await describeRequest(req({image:'http://127.0.0.1/private'}),'test')).status,400));
test('refuses disguised image files',async()=>assert.equal((await describeRequest(req({image:'data:image/png;base64,aGVsbG8='}),'test')).status,400));
test('rejects oversized requests',async()=>assert.equal((await describeRequest(req({},{'content-length':'6000000'}),'test')).status,413));
