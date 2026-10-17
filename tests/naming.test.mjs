import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script, runInNewContext } from 'node:vm';

const root=new URL('../',import.meta.url);
const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const html=read('naming.html');
const content=read('extensions/chatgpt-namer/content.js');
const popup=read('extensions/chatgpt-namer/popup.js');
const manifest=JSON.parse(read('extensions/chatgpt-namer/manifest.json'));

test('Naming console and Chrome extension are standalone and syntax-valid',()=>{
  assert.match(html,/<title>命名コンソール/);
  assert.match(html,/名前を組み立てる/);
  const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length,1);
  new Script(scripts[0][1]);
  new Script(content);
  new Script(popup);
  assert.equal(manifest.manifest_version,3);
  assert.deepEqual(manifest.permissions,['storage','activeTab']);
  assert.deepEqual(manifest.content_scripts[0].matches,['https://chatgpt.com/*']);
  assert.doesNotMatch(content,/\bfetch\s*\(|\bXMLHttpRequest\b|\bchrome\.cookies\b/);
});

test('Naming console creates valid titles and refuses invalid work ID',()=>{
  const elements={};
  const element=id=>elements[id]??=( {value:'',textContent:'',disabled:false,
    classList:{add(){},remove(){}},handlers:{},addEventListener(k,f){this.handlers[k]=f;}});
  const buttons=[{dataset:{copy:'title'},disabled:false,addEventListener(){}},{dataset:{copy:'command'},disabled:false,addEventListener(){}}];
  for(const [key,val] of Object.entries({group:'設計',workId:'SD-012',detail:'命名実装'}))element(key).value=val;
  const document={getElementById:element,querySelectorAll:s=>s==='[data-copy]'?buttons:[]};
  const js=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
  runInNewContext(js,{document,Intl,Date,URL,navigator:{clipboard:{writeText:async()=>{}}},window:{prompt:()=>{},open:()=>{}}});
  assert.match(element('preview').textContent,/^【設計】\d{4}・SD-012・命名実装$/);
  assert.equal(element('copyTitle').disabled,false);
  element('workId').value='SD・INVALID';
  element('workId').handlers.input();
  assert.equal(element('copyTitle').disabled,true);
  element('workId').value='SD-012';
  element('workId').handlers.input();
  assert.equal(element('copyTitle').disabled,false);
  element('chatUrl').value='https://evil.example/c/12345678';
  element('chatUrl').handlers.input();
  assert.equal(element('openChat').disabled,true);
  element('chatUrl').value='https://chatgpt.com/c/12345678?secret=do-not-forward';
  element('chatUrl').handlers.input();
  assert.equal(element('openChat').disabled,false);
});

function simulateChatGPT(){
  const id='aabbccdd-1234-5678-9abc-abcdefabcdef';
  let title='旧チャット',menuOpen=false,editing=false,saved=null,listener;
  const anchor={href:'https://chatgpt.com/c/'+id,innerText:title,
    getAttribute:()=>null,closest:()=>({querySelector:()=>menuButton})};
  const menuButton={click(){menuOpen=true}};
  const renameItem={textContent:'名前を変更',getClientRects:()=>[{}],click(){editing=true}};
  const input={value:'',focus(){},parentElement:null,
    closest:s=>s==='form'?{requestSubmit(){title=input.value;anchor.innerText=title;}}:null};
  const document={
    querySelectorAll:s=>{
      if(s==='a[href*="/c/"]')return [anchor];
      if(s==='[role="menuitem"]')return menuOpen?[renameItem]:[];
      if(s.startsWith('input[name="title-editor"]'))return editing?[input]:[];
      if(s==='[role="dialog"]')return [];
      return [];
    },
    querySelector:s=>null
  };
  const store={};
  const chrome={runtime:{onMessage:{addListener(fn){listener=fn;}}},
    storage:{local:{get:async k=>({[k]:store[k]}),set:async items=>Object.assign(store,items)}}};
  const loc={href:'https://chatgpt.com/c/'+id};
  const vm={document,chrome,location:loc,URL,CSS:{escape:x=>x},HTMLElement:class {},HTMLInputElement:class {},
    InputEvent:class{constructor(type,props){this.type=type;this.props=props}},
    Event:class{constructor(type){this.type=type}},setTimeout,clearTimeout,console};
  input.dispatchEvent=()=>{};
  runInNewContext(content,vm);
  const send=message=>new Promise(resolve=>listener(message,null,resolve));
  return {send,id,getTitle:()=>title};
}
test('ChatGPT extension only changes active ID and verifies UI title',async()=>{
  const sim=simulateChatGPT();
  const title='【命名管理】1017・SD-012・セッション命名機能';
  const wrong=await sim.send({type:'RENAME',expectedId:'another-session',title});
  assert.equal(wrong.ok,false);
  assert.equal(sim.getTitle(),'旧チャット');
  const ok=await sim.send({type:'RENAME',expectedId:sim.id,title});
  assert.equal(ok.ok,true);
  assert.equal(ok.status,'ui_verified');
  assert.equal(sim.getTitle(),title);
  const status=await sim.send({type:'GET_STATUS'});
  assert.equal(status.record.verification,'ui_observed');
});
test('ChatGPT extension refuses invalid title rather than guessing',async()=>{
  const sim=simulateChatGPT();
  const r=await sim.send({type:'RENAME',expectedId:sim.id,title:'no date or work ID'});
  assert.equal(r.ok,false);
  assert.equal(sim.getTitle(),'旧チャット');
});
