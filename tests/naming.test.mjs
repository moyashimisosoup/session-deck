import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script, runInNewContext } from 'node:vm';

const root=new URL('../',import.meta.url);
const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const html=read('naming.html');
const content=read('extensions/chatgpt-namer/content.js');
const core=read('extensions/chatgpt-namer/naming-core.js');
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

function simulateChatGPT({menuLabel='名前を変更', inline=false, ambiguous=false, noRename=false, dialogInputTypes=null, foreignMenu=false, mixedRow=false, foreignEditor=false, onMenu=null, store={}, initialTitle='旧チャット'}={}){
  const id='aabbccdd-1234-5678-9abc-abcdefabcdef';
  let title=initialTitle,menuOpen=false,editing=dialogInputTypes!==null,listener;
  const anchor={href:'https://chatgpt.com/c/'+id,innerText:title,
    getAttribute:()=>null,closest:()=>row};
  const row={querySelectorAll:s=>s==='a[href*="/c/"]'?(mixedRow?[anchor,{href:'https://chatgpt.com/c/other-chat'}]:[anchor]):[menuButton]};
  const menuButton={id:'test-trigger',focus(){},getAttribute:key=>key==='aria-controls'&&menuOpen?'test-menu':null,
    click(){throw Error('click alone must not be used for menu activation');},
    dispatchEvent(e){if(e.type==='keydown'&&e.key==='ArrowDown'){menuOpen=true;onMenu?.(loc,anchor);}}};
  const renameItem={textContent:menuLabel,innerText:menuLabel,getAttribute:()=>null,getClientRects:()=>[{}],click(){editing=true}};
  const menuItems=ambiguous?[renameItem,{...renameItem}]:noRename?[]:[renameItem];
  const menu={id:'test-menu',getAttribute:()=>foreignMenu?'unrelated-trigger':'test-trigger',
    getClientRects:()=>[{}],querySelectorAll:()=>menuItems};
  const save=()=>{title=input.value;anchor.innerText=title;};
  const dialog={getClientRects:()=>[{}],querySelectorAll:s=>{
    if(s==='input')return dialogInputs;
    if(s==='input[type="text"]')return dialogInputs.filter(i=>i.typeAttribute==='text');
    if(s==='button')return [{textContent:'保存',getClientRects:()=>[{}],click:save}];
    return [];
  }};
  const input={value:foreignEditor?'別の会話':title,type:'text',getClientRects:()=>[{}],focus(){},matches:s=>s.includes('input[aria-label="Chat title"]'),
    parentElement:{parentElement:{querySelectorAll:()=>[]}},
    closest:s=>s==='form'?(inline||dialogInputTypes!==null?null:{requestSubmit:save}):s==='[role="dialog"]'&&dialogInputTypes!==null?dialog:null,
    dispatchEvent(event){
      if(inline&&event.type==='keydown'&&event.key==='Enter'){title=this.value;anchor.innerText=title;}
    }};
  const dialogInputs=(dialogInputTypes||[]).map((type,index)=>index===0?Object.assign(input,{typeAttribute:type,type:type||'text'}):{...input,typeAttribute:type,type:type||'text'});
  const document={
    querySelectorAll:s=>{
      if(s==='a[href*="/c/"]')return [anchor];
      if(s==='[role="menu"]')return menuOpen?[menu]:[];
      if(s.startsWith('[role="menuitem"],'))return menuOpen?menuItems:[];
      if(s.startsWith('input[name="title-editor"]'))return editing&&dialogInputTypes===null?[input]:[];
      if(s==='[role="dialog"]')return editing&&dialogInputTypes!==null?[dialog]:[];
      return [];
    },
    querySelector:s=>null
  };
  const chrome={runtime:{onMessage:{addListener(fn){listener=fn;}}},
    storage:{local:{get:async k=>k===null?{...store}:{[k]:store[k]},set:async items=>Object.assign(store,items),remove:async k=>{delete store[k];}}}};
  const loc={href:'https://chatgpt.com/c/'+id};
  const vm={document,chrome,location:loc,URL,CSS:{escape:x=>x},HTMLElement:class {},HTMLInputElement:class {},
    InputEvent:class{constructor(type,props){this.type=type;this.props=props}},
    Event:class{constructor(type){this.type=type}},
    KeyboardEvent:class{constructor(type,props){this.type=type;this.key=props.key;this.code=props.code;}},setTimeout,clearTimeout,console};
  runInNewContext(core+'\n'+content,vm);
  const send=message=>new Promise(resolve=>listener({expectedTitle:title,...message},null,resolve));
  // A foreign menu has neither ownership relation, even when its label matches.
  if(foreignMenu){menu.id='unrelated-menu';menuButton.getAttribute=()=>null;}
  return {send,id,store,getTitle:()=>title,setTitle(value){title=value;anchor.innerText=value;input.value=value;},navigate(path){loc.href='https://chatgpt.com'+path;}};
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

test('ChatGPT menu accepts Japanese alternate text and inline Enter commit',async()=>{
  const sim=simulateChatGPT({menuLabel:'✎ 名前を変更 ⌘R',inline:true});
  const title='【命名テスト】1019・TEST-001・拡張機能の改名確認';
  const result=await sim.send({type:'RENAME',expectedId:sim.id,title});
  assert.equal(result.ok,true);
  assert.equal(result.status,'ui_verified');
  assert.equal(sim.getTitle(),title);
});

test('ChatGPT menu supports English rename labels',async()=>{
  const sim=simulateChatGPT({menuLabel:'Rename conversation'});
  const result=await sim.send({type:'RENAME',expectedId:sim.id,title:'【Test】1019・TEST-001・Rename flow'});
  assert.equal(result.ok,true);
});

test('ChatGPT extension refuses ambiguous menu rather than clicking',async()=>{
  const sim=simulateChatGPT({ambiguous:true});
  const result=await sim.send({type:'RENAME',expectedId:sim.id,title:'【命名テスト】1019・TEST-001・候補が重複'});
  assert.equal(result.ok,false);
  assert.match(result.error,/改名メニューが特定できません/);
  assert.equal(sim.getTitle(),'旧チャット');
});

test('ChatGPT extension reports missing menu without reading conversation body',async()=>{
  const sim=simulateChatGPT({noRename:true});
  const result=await sim.send({type:'RENAME',expectedId:sim.id,title:'【命名テスト】1019・TEST-001・メニューが不明'});
  assert.equal(result.ok,false);
  assert.match(result.error,/可視項目 0 件/);
  assert.equal(sim.getTitle(),'旧チャット');
});

test('ChatGPT popup accepts a text input with its type attribute omitted',async()=>{
  const sim=simulateChatGPT({dialogInputTypes:[null]});
  const title='【命名テスト】1022・TEST-001・単一会話の改名確認';
  const result=await sim.send({type:'RENAME',expectedId:sim.id,title});
  assert.equal(result.ok,true);
  assert.equal(result.status,'ui_verified');
  assert.equal(sim.getTitle(),title);
});

test('ChatGPT popup refuses two text inputs including an implicit text input',async()=>{
  const sim=simulateChatGPT({dialogInputTypes:['text',null]});
  const result=await sim.send({type:'RENAME',expectedId:sim.id,title:'【命名テスト】1022・TEST-001・入力候補が重複'});
  assert.equal(result.ok,false);
  assert.equal(sim.getTitle(),'旧チャット');
});

test('ChatGPT refuses a container containing another conversation before selecting its only button',async()=>{
  const sim=simulateChatGPT({mixedRow:true});
  const result=await sim.send({type:'RENAME',expectedId:sim.id,title:'【テスト】1022・TEST-001・対象の照合'});
  assert.equal(result.ok,false);
  assert.equal(sim.getTitle(),'旧チャット');
});

test('ChatGPT refuses an unrelated menu with a valid rename label',async()=>{
  const sim=simulateChatGPT({foreignMenu:true});
  const result=await sim.send({type:'RENAME',expectedId:sim.id,title:'【テスト】1022・TEST-001・メニューの照合'});
  assert.equal(result.ok,false);
  assert.equal(sim.getTitle(),'旧チャット');
});

test('ChatGPT refuses an already open editor for a different title',async()=>{
  const sim=simulateChatGPT({dialogInputTypes:[null],foreignEditor:true});
  const result=await sim.send({type:'RENAME',expectedId:sim.id,title:'【テスト】1022・TEST-001・入力欄の照合'});
  assert.equal(result.ok,false);
  assert.match(result.error,/入力欄と対象会話/);
});

test('ChatGPT stops if navigation happens while the menu opens',async()=>{
  const sim=simulateChatGPT({onMenu:loc=>{loc.href='https://chatgpt.com/c/other-chat';}});
  const result=await sim.send({type:'RENAME',expectedId:sim.id,title:'【テスト】1022・TEST-001・切替時の停止'});
  assert.equal(result.ok,false);
  assert.equal(sim.getTitle(),'旧チャット');
});

test('Console embeds the exact shared generator; calendar dates and titles use one rule',()=>{
  assert.equal(html.match(/\/\* NAMING_CORE_START \*\/\n([\s\S]*?)\n\/\* NAMING_CORE_END \*\//)[1],core.trim());
  const vm={Intl,Date};runInNewContext(core,vm);
  const naming=vm.SessionDeckNaming;
  const fields={group:'命名管理',date:'1022',workId:'NAME-01',detail:'候補を自動生成'};
  assert.equal(naming.generate(fields),'【命名管理】1022・NAME-01・候補を自動生成');
  for(const date of ['0000','0230','0431','1301'])assert.equal(naming.generate({...fields,date}),'');
  assert.ok(naming.generate({...fields,date:'0229'}));
  assert.equal(naming.generate({...fields,workId:''}),'');
  assert.equal(naming.parse('〖命名管理〗1022・NAME-01・候補を自動生成'),null);
  assert.equal(naming.today(new Date('2026-10-21T16:00:00Z')),'1022');
});

const work={workId:'TEST-001',group:'命名テスト',detail:'登録した作業からの候補'};
async function bind(sim){
  return sim.send({type:'BIND_WORK',expectedId:sim.id,work,date:'1022'});
}
test('An unregistered conversation needs explicit work selection and never guesses an ID',async()=>{
  const sim=simulateChatGPT();
  const initial=await sim.send({type:'GET_STATUS'});
  assert.equal(initial.candidate,'');
  assert.match(initial.blocked,/作業未登録/);
  const refused=await sim.send({type:'BIND_WORK',expectedId:sim.id,work:{...work,workId:''},date:'1022'});
  assert.equal(refused.ok,false);
  assert.equal(sim.getTitle(),'旧チャット');
});

test('Stored work produces the same candidate after page reload and conversation revisit',async()=>{
  const sim=simulateChatGPT();
  const bound=await bind(sim);
  assert.equal(bound.ok,true);
  assert.equal(sim.getTitle(),'旧チャット');
  assert.equal(bound.candidate,'【命名テスト】1022・TEST-001・登録した作業からの候補');
  sim.navigate('/c/other-chat');
  const other=await sim.send({type:'GET_STATUS'});
  assert.equal(other.candidate,'');
  const wrong=await sim.send({type:'CONFIRM_CANDIDATE',expectedId:sim.id,title:bound.candidate});
  assert.equal(wrong.ok,false);
  sim.navigate('/c/'+sim.id);
  assert.equal((await sim.send({type:'GET_STATUS'})).candidate,bound.candidate);
  const reloaded=simulateChatGPT({store:sim.store});
  const revisited=await reloaded.send({type:'GET_STATUS'});
  assert.equal(revisited.candidate,bound.candidate);
  assert.equal(revisited.blocked,'');
});

test('Confirmation renames once, preserves history, and keeps the candidate after reload',async()=>{
  const sim=simulateChatGPT();
  const bound=await bind(sim);
  const result=await sim.send({type:'CONFIRM_CANDIDATE',expectedId:sim.id,title:bound.candidate});
  assert.equal(result.status,'ui_verified');
  assert.equal(sim.store['sessionDeckNamerHistory:'+sim.id].length,1);
  const again=await sim.send({type:'CONFIRM_CANDIDATE',expectedId:sim.id,title:bound.candidate});
  assert.equal(again.status,'already');
  assert.equal(sim.store['sessionDeckNamerHistory:'+sim.id].length,1);
  const reload=simulateChatGPT({store:sim.store,initialTitle:sim.getTitle()});
  const status=await reload.send({type:'GET_STATUS'});
  assert.equal(status.currentTitle,status.candidate);
  assert.equal(status.blocked,'');
});

test('Manual changes remain protected after re-registration; removing a mapping disables confirmation',async()=>{
  const sim=simulateChatGPT();
  const bound=await bind(sim);
  sim.setTitle('手動で変更した名前');
  assert.match((await sim.send({type:'GET_STATUS'})).blocked,/手動変更/);
  assert.equal((await bind(sim)).ok,true);
  assert.match((await sim.send({type:'GET_STATUS'})).blocked,/手動変更/);
  const protectedResult=await sim.send({type:'CONFIRM_CANDIDATE',expectedId:sim.id,title:bound.candidate});
  assert.equal(protectedResult.ok,false);
  const removed=await sim.send({type:'UNBIND_WORK',expectedId:sim.id});
  assert.equal(removed.candidate,'');
  assert.equal((await sim.send({type:'CONFIRM_CANDIDATE',expectedId:sim.id,title:bound.candidate})).ok,false);
  assert.equal(sim.getTitle(),'手動で変更した名前');
});

test('Existing official names for a different work cannot be bound and old records are retained',async()=>{
  const sim=simulateChatGPT({initialTitle:'【他作業】1022・OTHER-001・手動保護の確認'});
  assert.equal((await bind(sim)).ok,false);
  const store={sessionDeckNamerRecords:{'previous-chat':{title:'既存の履歴'}}};
  const fresh=simulateChatGPT({store});await bind(fresh);
  assert.equal(store.sessionDeckNamerRecords['previous-chat'].title,'既存の履歴');
});

test('New conversation ID is detected without reusing the previous mapping',async()=>{
  const sim=simulateChatGPT();await bind(sim);
  sim.navigate('/');
  assert.equal((await sim.send({type:'GET_STATUS'})).id,null);
  sim.navigate('/c/new-chat-1234');
  const status=await sim.send({type:'GET_STATUS'});
  assert.equal(status.id,'new-chat-1234');
  assert.equal(status.binding,null);
  assert.equal(status.candidate,'');
});

test('A stale expected title is rejected before changing the page',async()=>{
  const sim=simulateChatGPT();const bound=await bind(sim);
  const result=await sim.send({type:'CONFIRM_CANDIDATE',expectedId:sim.id,expectedTitle:'別の名前',title:bound.candidate});
  assert.equal(result.ok,false);
  assert.equal(sim.getTitle(),'旧チャット');
});
