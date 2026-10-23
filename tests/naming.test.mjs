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

function simulateChatGPT({menuLabel='名前を変更', inline=false, ambiguous=false, noRename=false, dialogInputTypes=null, foreignMenu=false, mixedRow=false, foreignEditor=false, onMenu=null, store={}, initialTitle='旧チャット', locks=makeLocks(), focused=true, saveFailure=false, onSet=null}={}){
  const id='aabbccdd-1234-5678-9abc-abcdefabcdef';
  let title=initialTitle,menuOpen=false,editing=dialogInputTypes!==null,listener,saves=0;
  const intervals=[];
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
  const save=()=>{saves++;if(saveFailure)throw Error('synthetic save failure');title=input.value;anchor.innerText=title;editing=false;menuOpen=false;};
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
    visibilityState:'visible',hasFocus:()=>focused,
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
    storage:{local:{get:async k=>k===null?{...store}:{[k]:store[k]},set:async items=>{await onSet?.(items);Object.assign(store,items);},remove:async k=>{delete store[k];}}}};
  const loc={href:'https://chatgpt.com/c/'+id};
  const vm={document,chrome,location:loc,URL,CSS:{escape:x=>x},HTMLElement:class {},HTMLInputElement:class {},
    InputEvent:class{constructor(type,props){this.type=type;this.props=props}},
    Event:class{constructor(type){this.type=type}},
    KeyboardEvent:class{constructor(type,props){this.type=type;this.key=props.key;this.code=props.code;}},setTimeout,clearTimeout,console,
    navigator:{locks},crypto:{randomUUID:()=>globalThis.crypto.randomUUID()},setInterval:fn=>intervals.push(fn)};
  runInNewContext(core+'\n'+content,vm);
  const send=message=>new Promise(resolve=>listener({expectedTitle:title,...message},null,resolve));
  // A foreign menu has neither ownership relation, even when its label matches.
  if(foreignMenu){menu.id='unrelated-menu';menuButton.getAttribute=()=>null;}
  return {send,id,store,getTitle:()=>title,getSaves:()=>saves,async tick(){await intervals[0]();},
    focus(value){focused=value;},hide(value){document.visibilityState=value?'hidden':'visible';},
    setTitle(value){title=value;anchor.innerText=value;input.value=value;},navigate(path){loc.href='https://chatgpt.com'+path;}};
}

function makeLocks(){
  let held=false;
  return {async request(_name,_options,fn){
    if(held)return fn(null);
    held=true;try{return await fn({});}finally{held=false;}
  }};
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

test('Renaming archives an imported record for the same conversation without losing opaque metadata',async()=>{
  const vm={};runInNewContext(read('extensions/chatgpt-namer/backup.js'),vm);
  const id='aabbccdd-1234-5678-9abc-abcdefabcdef';
  const prior={id,title:'旧チャット',updatedAt:'2025-01-02T03:04:05.000Z',verification:'legacy_import',extra:{source:'synthetic fixture'}};
  const original=JSON.stringify(prior);
  const incoming=vm.SessionDeckBackup.decode(vm.SessionDeckBackup.encode({sessionDeckNamerRecords:{[id]:prior}}));
  const store=vm.SessionDeckBackup.merge({},incoming);
  const sim=simulateChatGPT({store});
  const bound=await bind(sim);
  assert.equal((await sim.send({type:'CONFIRM_CANDIDATE',expectedId:id,title:bound.candidate})).status,'ui_verified');
  const history=store['sessionDeckNamerHistory:'+id];
  assert.equal(history.length,2);
  assert.equal(JSON.stringify(history[0]),original);
  assert.equal(history[1].title,bound.candidate);
  assert.equal(history[1].verification,'ui_observed');
  assert.equal(JSON.stringify(store.sessionDeckNamerRecords[id]),JSON.stringify(history[1]));
  const reload=simulateChatGPT({store,initialTitle:sim.getTitle()});
  assert.equal((await reload.send({type:'CONFIRM_CANDIDATE',expectedId:id,title:bound.candidate})).status,'already');
  assert.equal(store['sessionDeckNamerHistory:'+id].length,2);
});

test('Renaming preserves existing history and archives only an absent prior record',async()=>{
  const id='aabbccdd-1234-5678-9abc-abcdefabcdef';
  const prior={id,title:'旧チャット',updatedAt:'2025-01-02T03:04:05.000Z',verification:'legacy_import'};
  const older={...prior,updatedAt:'2024-01-02T03:04:05.000Z',verification:'older_import'};
  for(const alreadyArchived of [false,true]){
    const initial=alreadyArchived?[older,JSON.parse(JSON.stringify(prior))]:[older];
    const store={sessionDeckNamerRecords:{[id]:prior,'other-fixture':older},['sessionDeckNamerHistory:'+id]:initial};
    const sim=simulateChatGPT({store});
    const bound=await bind(sim);
    assert.equal((await sim.send({type:'CONFIRM_CANDIDATE',expectedId:id,title:bound.candidate})).status,'ui_verified');
    const history=store['sessionDeckNamerHistory:'+id];
    assert.equal(history.length,3);
    assert.equal(JSON.stringify(history[0]),JSON.stringify(older));
    assert.equal(JSON.stringify(history[1]),JSON.stringify(prior));
    assert.equal(history[2].title,bound.candidate);
    assert.equal(JSON.stringify(store.sessionDeckNamerRecords['other-fixture']),JSON.stringify(older));
  }
});

test('Manual changes remain protected after re-registration; removing a mapping disables confirmation',async()=>{
  const sim=simulateChatGPT();
  const bound=await bind(sim);
  sim.setTitle('手動で変更した名前');
  assert.match((await sim.send({type:'GET_STATUS'})).blocked,/手動変更/);
  const registered=await bind(sim);
  assert.equal(registered.ok,true);
  assert.match(registered.blocked,/手動変更/);
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

test('Local export/import preserves opaque old records and merges without overwriting conflicts',()=>{
  const vm={};runInNewContext(read('extensions/chatgpt-namer/backup.js'),vm);
  const backup=vm.SessionDeckBackup;
  const old={sessionDeckNamerRecords:{'fixture-0001':{title:'過去の記録',verification:'ui_observed'}},unrelated:'not exported'};
  const restored=backup.decode(backup.encode(old));
  assert.equal(restored.sessionDeckNamerRecords['fixture-0001'].title,'過去の記録');
  assert.equal('unrelated' in restored,false);
  const current={sessionDeckNamerRecords:{'fixture-0002':{title:'別の記録'}}};
  const merged=backup.merge(current,restored);
  assert.equal(Object.keys(merged.sessionDeckNamerRecords).length,2);
  assert.throws(()=>backup.merge({sessionDeckNamerRecords:{'fixture-0001':{title:'変更済み'}}},restored),/競合/);
  assert.equal(current.sessionDeckNamerRecords['fixture-0002'].title,'別の記録');
});

test('Local import refuses unrelated or dangerous files',()=>{
  const vm={};runInNewContext(read('extensions/chatgpt-namer/backup.js'),vm);
  const backup=vm.SessionDeckBackup;
  assert.throws(()=>backup.decode('{"app":"other","data":{}}'));
  assert.throws(()=>backup.decode('{"app":"Session Deck Namer","data":{"unknown":{}}}'));
  assert.throws(()=>backup.decode('{"app":"Session Deck Namer","data":{"sessionDeckNamerRecords":{"__proto__":{}}}}'));
});

test('Local import rejects incompatible storage container types before applying data',()=>{
  const vm={};runInNewContext(read('extensions/chatgpt-namer/backup.js'),vm);
  const backup=vm.SessionDeckBackup;
  const invalid={sessionDeckNamerRecords:[], 'sessionDeckNamerWork:FIXTURE-001':[],
    'sessionDeckNamerBinding:fixture-chat':[], 'sessionDeckNamerHistory:fixture-chat':{}};
  for(const [key,value] of Object.entries(invalid)){
    assert.throws(()=>backup.decode(JSON.stringify({app:'Session Deck Namer',data:{[key]:value}})),/項目/);
  }
  const valid={sessionDeckNamerRecords:{}, 'sessionDeckNamerWork:FIXTURE-001':{},
    'sessionDeckNamerBinding:fixture-chat':{}, 'sessionDeckNamerHistory:fixture-chat':[]};
  assert.equal(JSON.stringify(backup.decode(backup.encode(valid))),JSON.stringify(valid));
});

const autoKey='sessionDeckNamerAuto';
async function enable(sim){
  const s=await sim.send({type:'GET_STATUS'});
  return sim.send({type:'ENABLE_AUTO',expectedId:sim.id,title:s.candidate});
}

test('Automatic mode defaults OFF; explicit grant saves once and never retries on reload',async()=>{
  const sim=simulateChatGPT();await bind(sim);
  await sim.tick();assert.equal(sim.getSaves(),0);
  assert.equal((await enable(sim)).auto.state,'enabled');
  await sim.tick();assert.equal(sim.getSaves(),1);
  assert.equal((await sim.send({type:'GET_STATUS'})).auto.state,'completed');
  await sim.tick();assert.equal(sim.getSaves(),1);
  const reload=simulateChatGPT({store:sim.store,initialTitle:sim.getTitle()});
  await reload.tick();assert.equal(reload.getSaves(),0);
});

test('Automatic grant for an already matching name stays ON without duplicate history or saves',async()=>{
  const sim=simulateChatGPT();const s=await bind(sim);
  await sim.send({type:'CONFIRM_CANDIDATE',expectedId:sim.id,title:s.candidate});
  assert.equal((await enable(sim)).auto.state,'enabled');
  await sim.tick();await sim.tick();assert.equal(sim.getSaves(),1);
  assert.equal(sim.store['sessionDeckNamerHistory:'+sim.id].length,1);
  const reload=simulateChatGPT({store:sim.store,initialTitle:sim.getTitle()});
  await reload.tick();assert.equal(reload.getSaves(),0);
  assert.equal((await reload.send({type:'GET_STATUS'})).auto.state,'enabled');
});

test('Automatic mode protects manual edits and rejects changed candidates',async()=>{
  for(const change of ['manual','candidate']){
    const sim=simulateChatGPT();await bind(sim);await enable(sim);
    if(change==='manual')sim.setTitle('人が選んだ表示名');
    else sim.store['sessionDeckNamerWork:TEST-001'].detail='承認していない別候補';
    await sim.tick();assert.equal(sim.getSaves(),0);
    assert.equal((await sim.send({type:'GET_STATUS'})).auto.state,'stopped');
  }
});

test('Automatic mode waits for the active visible target and ignores another conversation',async()=>{
  const sim=simulateChatGPT();await bind(sim);await enable(sim);
  sim.focus(false);await sim.tick();assert.equal(sim.getSaves(),0);
  sim.focus(true);sim.hide(true);await sim.tick();assert.equal(sim.getSaves(),0);
  sim.hide(false);sim.navigate('/c/another-fixture');await sim.tick();assert.equal(sim.getSaves(),0);
  sim.navigate('/c/'+sim.id);await sim.tick();assert.equal(sim.getSaves(),1);
});

test('Automatic grant requires locks and refuses an existing editor; unbinding revokes it',async()=>{
  const noLock=simulateChatGPT({locks:null});await bind(noLock);
  assert.equal((await enable(noLock)).ok,false);await noLock.tick();assert.equal(noLock.getSaves(),0);
  const edit=simulateChatGPT({dialogInputTypes:[null]});await bind(edit);
  assert.equal((await enable(edit)).ok,false);
  const sim=simulateChatGPT();await bind(sim);await enable(sim);
  await sim.send({type:'UNBIND_WORK',expectedId:sim.id});await sim.tick();assert.equal(sim.getSaves(),0);
  assert.equal((await sim.send({type:'GET_STATUS'})).auto.state,'stopped');
});

test('A failed or interrupted automatic attempt never resumes itself',async()=>{
  const sim=simulateChatGPT({saveFailure:true});await bind(sim);await enable(sim);
  await sim.tick();assert.equal(sim.getSaves(),1);
  await sim.tick();assert.equal(sim.getSaves(),1);
  assert.equal((await sim.send({type:'GET_STATUS'})).auto.state,'stopped');
  sim.store[autoKey]={...sim.store[autoKey],grantId:'interrupted-fixture',state:'running'};
  const reload=simulateChatGPT({store:sim.store});await reload.tick();assert.equal(reload.getSaves(),0);
  assert.equal((await enable(reload)).ok,false);
  await reload.send({type:'STOP_AUTO'});
  assert.equal((await enable(reload)).ok,true);
});

test('Revocation, navigation, loss of focus or binding removal during menu opening prevents automatic save',async()=>{
  for(const change of ['revoke','navigate','blur','unbind']){
    let sim;
    sim=simulateChatGPT({onMenu:loc=>{
      if(change==='revoke')sim.store.sessionDeckNamerAutoRevoked=sim.store[autoKey].grantId;
      if(change==='navigate')loc.href='https://chatgpt.com/c/another-fixture';
      if(change==='blur')sim.focus(false);
      if(change==='unbind')delete sim.store['sessionDeckNamerBinding:'+sim.id];
    }});
    await bind(sim);await enable(sim);await sim.tick();
    assert.equal(sim.getSaves(),0,change);
    assert.equal((await sim.send({type:'GET_STATUS'})).auto.state,'stopped',change);
  }
});

test('Shared tab lock permits only one automatic save and serializes manual operations',async()=>{
  const store={},locks=makeLocks(),a=simulateChatGPT({store,locks}),b=simulateChatGPT({store,locks});
  await bind(a);await enable(a);
  await Promise.all([a.tick(),b.tick()]);
  assert.equal(a.getSaves()+b.getSaves(),1);
  assert.equal(store['sessionDeckNamerHistory:'+a.id].length,1);
  const c=simulateChatGPT({locks});const s=await bind(c);
  await locks.request('session-deck-namer-write',{},async()=>{
    assert.equal((await c.send({type:'CONFIRM_CANDIDATE',expectedId:c.id,title:s.candidate})).ok,false);
  });
  assert.equal(c.getSaves(),0);
});

test('Backup export excludes automatic grants and import cannot revive them',()=>{
  const vm={};runInNewContext(read('extensions/chatgpt-namer/backup.js'),vm);
  const data=vm.SessionDeckBackup.decode(vm.SessionDeckBackup.encode({[autoKey]:{state:'enabled'},sessionDeckNamerAutoRevoked:'token',sessionDeckNamerRecords:{}}));
  assert.equal(autoKey in data,false);
  assert.equal('sessionDeckNamerAutoRevoked' in data,false);
  assert.throws(()=>vm.SessionDeckBackup.decode(JSON.stringify({app:'Session Deck Namer',data:{[autoKey]:{state:'enabled'}}})));
});

test('OFF survives a concurrent state write and never permits a save',async()=>{
  let sim;
  sim=simulateChatGPT({onSet:async items=>{
    if(items[autoKey]?.state==='running')await sim.send({type:'STOP_AUTO'});
  }});
  await bind(sim);await enable(sim);await sim.tick();
  assert.equal(sim.getSaves(),0);
  assert.equal((await sim.send({type:'GET_STATUS'})).auto.state,'stopped');
  await sim.tick();assert.equal(sim.getSaves(),0);
});
