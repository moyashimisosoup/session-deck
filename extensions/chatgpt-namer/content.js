/* Session Deck Namer 0.4.0: local candidates and confirmed, scoped rename. */
(() => {
  'use strict';
  const naming=globalThis.SessionDeckNaming;
  const LABELS=new Set(['rename','rename conversation','rename chat','change chat name','名前を変更','名前の変更','名前を変更する','会話名を変更','会話の名前を変更','チャット名を変更','チャットの名前を変更','タイトルを変更','タイトルの変更','名称変更','名前を編集']);
  const STORAGE='sessionDeckNamerRecords';
  const WORK='sessionDeckNamerWork:', BINDING='sessionDeckNamerBinding:', HISTORY='sessionDeckNamerHistory:';
  let busy=false;
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const clean=s=>String(s||'').trim().replace(/\s+/g,' ');
  function currentId(u=location.href){
    try{return new URL(u,location.href).pathname.match(/(?:^|\/)c\/([a-z0-9-]{8,})(?:\/)?$/i)?.[1]||null}
    catch{return null}
  }
  function findConversationLink(id){
    const anchors=[...document.querySelectorAll('a[href*="/c/"]')].filter(a=>currentId(a.href)===id);
    return anchors.length===1?anchors[0]:null;
  }
  function observedName(id){
    const a=findConversationLink(id);
    if(!a)return null;
    return clean(a.getAttribute('aria-label')||a.innerText||a.textContent);
  }
  async function waitUntil(find,ms){
    const end=Date.now()+ms;
    do{const x=find();if(x)return x;await sleep(100)}while(Date.now()<end);
    return null;
  }
  const visible = el => Boolean(el && (typeof el.getClientRects !== 'function' || el.getClientRects().length) && !el.closest?.('[hidden],[aria-hidden="true"]'));
  function menuButton(id){
    const anchor=findConversationLink(id);
    if(!anchor)return null;
    // Only look near the *exact* active sidebar chat, never in page-level menus.
    let row=anchor.closest?.('[data-sidebar-cycle-item]') || anchor.closest?.('[data-sidebar-chatgpt-conversation-key],[role="listitem"]') || anchor.parentElement?.parentElement;
    for(let depth=0;row&&depth<4;row=row.parentElement,depth++){
      // Check ownership BEFORE considering any button in this container.
      const chatLinks=[...row.querySelectorAll('a[href*="/c/"]')];
      if(chatLinks.length!==1 || currentId(chatLinks[0].href)!==id)return null;
      const selectors='button[aria-haspopup="menu"],button[data-testid="conversation-options-button"],button[data-testid^="history-item-"][data-testid$="-options"],button[aria-label^="Open conversation options"],button[aria-label*="チャットのオプション"],button[aria-label*="会話のオプション"]';
      const candidates=typeof row.querySelectorAll==='function'
        ? [...row.querySelectorAll(selectors)].filter(visible)
        : [row.querySelector?.(selectors)].filter(visible);
      if(candidates.length===1)return candidates[0];
      if(candidates.length>1)return null;
      // Do not climb into a container holding unrelated chats.
    }
    return null;
  }
  function isRenameLabel(el){
    const values=[
      el.getAttribute?.('aria-label'),
      el.innerText,
      el.textContent
    ];
    return values.some(value=>{
      let s=clean(value).toLowerCase();
      // Ignore icon glyphs and keyboard shortcut hints, not arbitrary suffix text.
      s=s.replace(/^[✎✏🖉\s]+/u,'').replace(/\s+(?:⌘|ctrl\+|alt\+|shift\+|⌥|⇧).*$/iu,'').trim();
      return LABELS.has(s) || /^(?:名前|会話名|チャット名|タイトル|会話の名前|チャットの名前)(?:の)?を(?:変更|編集)(?:する)?$/u.test(s);
    });
  }
  function openedMenu(button){
    const controlled=button.getAttribute('aria-controls');
    const menus=[...document.querySelectorAll('[role="menu"]')].filter(visible).filter(menu=>
      (controlled && menu.id===controlled) || (button.id && menu.getAttribute('aria-labelledby')===button.id));
    return menus.length===1?menus[0]:null;
  }
  function menuRenameItem(button){
    const menu=openedMenu(button);
    if(!menu)return null;
    const items=[...menu.querySelectorAll('[role="menuitem"]')];
    const matches=[...new Set(items)].filter(visible).filter(isRenameLabel);
    return matches.length===1?matches[0]:null;
  }
  function menuDiagnostics(){
    // Only return numeric structure counts. Never expose menu text, chat titles or transcript content.
    const all=[...document.querySelectorAll('[role="menuitem"],[role="menuitemcheckbox"],[data-radix-collection-item]')].filter(visible);
    return {visibleOptions:all.length,renameCandidates:all.filter(isRenameLabel).length};
  }
  function editor(){
    const found=[...document.querySelectorAll('input[name="title-editor"],input[aria-label="Chat title"],input[aria-label="会話名"],input[data-testid="rename-title-input"]')];
    if(found.length===1)return found[0];
    const dialogs=[...document.querySelectorAll('[role="dialog"]')].filter(x=>x.getClientRects().length);
    if(dialogs.length!==1)return null;
    // The live popup omits type; the DOM property still defaults to "text".
    const inputs=[...dialogs[0].querySelectorAll('input')].filter(input=>input.type==='text');
    return inputs.length===1?inputs[0]:null;
  }
  function setReactValue(input,title){
    const native=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
    if(native)native.call(input,title);else input.value=title;
    input.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:title}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
  }
  function saveEditor(input){
    const form=input.closest('form');
    if(form?.requestSubmit){form.requestSubmit();return true;}
    const dialog=input.closest('[role="dialog"]');
    const root=dialog||input.parentElement?.parentElement;
    if(!root)return false;
    const actions=[...root.querySelectorAll('button')].filter(btn=>!btn.disabled&&btn.getClientRects().length&&/^(save|保存|変更|rename)$/i.test(clean(btn.textContent||btn.getAttribute('aria-label'))));
    if(actions.length===1){actions[0].click();return true;}
    if(actions.length>1)return false;
    // ChatGPT often edits the title inline. Enter commits it, not a Save button.
    if(!input.matches?.('input[aria-label="Chat title"],input[aria-label="会話名"],input[name="title-editor"],input[data-testid="rename-title-input"]'))return false;
    input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',keyCode:13,which:13,bubbles:true}));
    input.dispatchEvent(new KeyboardEvent('keyup',{key:'Enter',code:'Enter',keyCode:13,which:13,bubbles:true}));
    return true;
  }
  async function rename(id,title,expectedTitle,guard=null){
    if(busy)throw Error('ほかの改名処理が進行中です。');
    if(!naming.parse(title))throw Error('命名規則に一致しません。');
    if(currentId()!==id)throw Error('対象会話が切り替わりました。');
    const previous=observedName(id);
    if(!previous)throw Error('対象会話の表示名を一意に確認できません。');
    if(previous!==expectedTitle)throw Error('候補表示後に会話名が変わりました。確認し直してください。');
    if(previous===title)return {status:'already',title,verification:'ui_observed'};
    busy=true;
    try{
      // We only mutate a currently visible, uniquely matched conversation row.
      let input=editor();
      if(!input){
        const button=await waitUntil(()=>menuButton(id),2500);
        if(!button)throw Error('会話のメニューが特定できません。サイドバーを開いて再試行してください。');
        if(currentId()!==id || observedName(id)!==previous)throw Error('メニュー起動前に対象が変わりました。');
        // The observed trigger is a Radix menu button. Keyboard activation opens
        // its menu; HTMLElement.click() alone need not fire its pointer handler.
        button.focus();
        button.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',code:'ArrowDown',bubbles:true,cancelable:true}));
        input=await waitUntil(editor,250);
        if(!input){
          const renameItem=await waitUntil(()=>menuRenameItem(button),2700);
          if(!renameItem){
            const stats=menuDiagnostics();
            throw Error('改名メニューが特定できません（可視項目 '+stats.visibleOptions+' 件／改名候補 '+stats.renameCandidates+' 件）。');
          }
          if(currentId()!==id)throw Error('メニュー表示中に会話が切り替わりました。');
          renameItem.click();
          input=await waitUntil(editor,2500);
        }
      }
      if(!input)throw Error('会話名の入力欄が見つかりません。');
      if(guard)await guard();
      if(currentId()!==id)throw Error('対象会話が切り替わったため中止しました。');
      if(clean(input.value)!==previous || observedName(id)!==previous)throw Error('入力欄と対象会話の名前が一致しないため中止しました。');
      input.focus();
      setReactValue(input,title);
      if(guard)await guard();
      if(currentId()!==id || observedName(id)!==previous)throw Error('保存前に対象が変わりました。');
      if(!saveEditor(input))throw Error('保存操作の対象が特定できません。手動で確定してください。');
      const confirmed=await waitUntil(()=>currentId()===id&&observedName(id)===title,5000);
      if(!confirmed)throw Error('変更後のタイトルを画面上で確認できませんでした。');
      const item={id,title,previousTitle:previous||null,updatedAt:new Date().toISOString(),verification:'ui_observed'};
      const store=await chrome.storage.local.get(STORAGE);
      const records=store[STORAGE]&&typeof store[STORAGE]==='object'?store[STORAGE]:{};
      const historyStore=await chrome.storage.local.get(HISTORY+id);
      const history=Array.isArray(historyStore[HISTORY+id])?historyStore[HISTORY+id]:[];
      // Imported legacy records may not yet be in this conversation's history.
      const prior=records[id];
      const retained=prior&&!history.some(entry=>JSON.stringify(entry)===JSON.stringify(prior))?[...history,prior]:history;
      records[id]=item;
      await chrome.storage.local.set({[STORAGE]:records,[HISTORY+id]:[...retained,item]});
      return {status:'ui_verified',title,verification:'ui_observed'};
    }finally{busy=false;}
  }
  async function status(){
    const id=currentId(), store=await chrome.storage.local.get(null);
    const currentTitle=id?observedName(id):null;
    const record=id?store[STORAGE]?.[id]||null:null;
    const binding=id?store[BINDING+id]||null:null;
    const works=Object.entries(store).filter(([key])=>key.startsWith(WORK)).map(([,work])=>work);
    const work=binding?store[WORK+binding.workId]:null;
    const candidate=work?naming.generate({...work,date:binding.date}):'';
    const parsed=naming.parse(currentTitle);
    let blocked='';
    if(!id)blocked='まだ会話IDがありません。保存後に作業を選択してください。';
    else if(!currentTitle)blocked='対象の表示名を一意に確認できません。サイドバーを開いてください。';
    else if(!binding)blocked='作業未登録です。既存の作業を選択・登録してください。';
    else if(!candidate)blocked='作業情報または日付を確認してください。';
    else if(parsed && parsed.workId!==binding.workId)blocked='表示名が別の作業に属するため保護しています。';
    else if(currentTitle!==(record?.title||binding.baselineTitle))blocked='手動変更された名前を保護しています。';
    return {ok:true,id,currentTitle,record,binding,works,candidate,blocked};
  }
  function requireId(msg){
    const id=currentId();
    if(!id||id!==msg.expectedId)throw Error('開いている会話のIDと指定IDが一致しません。');
    return id;
  }
  async function bindWork(msg){
    const id=requireId(msg), before=await status();
    if(!before.currentTitle||before.currentTitle!==msg.expectedTitle)throw Error('対象の表示名を確認し直してください。');
    const work=msg.work;
    if(!work||!naming.generate({...work,date:msg.date}))throw Error('作業情報と日付を確認してください。作業番号は既存の値を指定してください。');
    if(before.binding && before.binding.workId!==work.workId)throw Error('別の作業に登録済みです。先に対応を解除してください。');
    const parsed=naming.parse(before.currentTitle);
    if(parsed && parsed.workId!==work.workId)throw Error('表示名が別の作業に属しています。');
    const key=WORK+work.workId, stored=await chrome.storage.local.get(key);
    const canonical={workId:work.workId,group:work.group,detail:work.detail};
    if(stored[key] && (stored[key].group!==work.group || stored[key].detail!==work.detail))throw Error('登録済み作業と内容が違います。既存の作業を選択してください。');
    if(currentId()!==id||observedName(id)!==before.currentTitle)throw Error('登録中に対象が変わりました。');
    // Re-registering must never silently approve a manual title change.
    const binding=before.binding||{workId:work.workId,date:msg.date,baselineTitle:before.currentTitle};
    await chrome.storage.local.set({[key]:canonical,[BINDING+id]:binding});
    return status();
  }
  async function confirmCandidate(msg){
    const id=requireId(msg), snapshot=await status();
    if(snapshot.blocked)throw Error(snapshot.blocked);
    if(snapshot.candidate!==msg.title)throw Error('候補が変わりました。確認し直してください。');
    const guard=async()=>{
      const latest=await status();
      if(latest.id!==id||latest.blocked||latest.candidate!==msg.title||latest.binding?.workId!==snapshot.binding.workId)throw Error('作業との対応または対象が変わったため停止しました。');
    };
    return {ok:true,...await rename(id,snapshot.candidate,msg.expectedTitle,guard)};
  }
  chrome.runtime.onMessage.addListener((msg,_sender,respond)=>{
    (async()=>{
      if(msg?.type==='GET_STATUS'){
        return status();
      }
      if(msg?.type==='BIND_WORK')return bindWork(msg);
      if(msg?.type==='CONFIRM_CANDIDATE')return confirmCandidate(msg);
      if(msg?.type==='UNBIND_WORK'){
        const id=requireId(msg);
        await chrome.storage.local.remove(BINDING+id);
        return status();
      }
      if(msg?.type==='RENAME'){
        const id=requireId(msg);
        const title=String(msg.title||'').trim();
        return {ok:true,...await rename(id,title,msg.expectedTitle)};
      }
      throw Error('未対応の操作です。');
    })().then(respond).catch(err=>respond({ok:false,error:err.message}));
    return true;
  });

  // Observe only route and the uniquely matched sidebar title, never transcript.
  // No worker, network request, injected page-history hook, or automatic rename.
  if(typeof document.createElement==='function'){
    const host=document.createElement('div');
    host.id='session-deck-namer';
    const root=host.attachShadow({mode:'open'});
    const style=document.createElement('style');
    style.textContent=':host{position:fixed;right:18px;bottom:96px;z-index:2147483000;font:13px/1.5 system-ui;color:#20314a}section{max-width:310px;padding:14px;background:#fff;border:1px solid #cbd5e1;border-radius:12px;box-shadow:0 3px 18px #0002}p{margin:5px 0;overflow-wrap:anywhere}button{font:inherit;padding:7px 10px;margin-top:8px;background:#4464dd;color:white;border:0;border-radius:6px;cursor:pointer}button:disabled{opacity:.5;cursor:default}';
    const panel=document.createElement('section');
    panel.setAttribute('aria-label','Session Deck 改名候補');
    const label=document.createElement('strong');label.textContent='Session Deck 改名候補';
    const text=document.createElement('p'), message=document.createElement('p'), button=document.createElement('button');
    message.setAttribute('role','status');button.textContent='確認してこの会話を改名';
    const setup=document.createElement('details'), summary=document.createElement('summary');
    summary.textContent='作業の登録・選択';setup.append(summary);
    const fields={};
    for(const [key,name,max] of [['workId','作業番号（既存ID）',30],['group','短い作業名',20],['detail','具体的内容',70],['date','日付（MMDD）',4]]){
      const wrap=document.createElement('label'), input=document.createElement('input');
      wrap.textContent=name;input.maxLength=max;input.style.cssText='display:block;width:100%;box-sizing:border-box;margin:3px 0 7px;padding:5px';
      wrap.append(input);setup.append(wrap);fields[key]=input;
    }
    fields.date.value=naming.today();
    const workSelect=document.createElement('select');workSelect.setAttribute('aria-label','登録済み作業を選択');
    setup.append(workSelect);
    const register=document.createElement('button');register.textContent='この作業を会話に登録';setup.append(register);
    const unbind=document.createElement('button');unbind.textContent='この会話との対応を解除';
    panel.append(label,text,button,setup,unbind,message);root.append(style,panel);document.documentElement.append(host);
    let snapshot=null, signature='', refreshing=false, operating=false, notice='';
    let worksSignature='';
    async function refresh(){
      if(refreshing||operating)return;
      refreshing=true;
      try{
        const next=await status();
        const key=JSON.stringify([next.id,next.currentTitle,next.candidate,next.blocked]);
        if(signature!==key){signature=key;notice='';}
        snapshot=next;
        host.hidden=!next.id;
        setup.hidden=Boolean(next.binding);unbind.hidden=!next.binding;
        const workKey=JSON.stringify(next.works);
        if(workKey!==worksSignature){
          worksSignature=workKey;workSelect.replaceChildren(new Option('既存の作業を選択、または上に入力',''));
          for(const work of next.works)workSelect.append(new Option(work.workId+' — '+work.group,work.workId));
        }
        text.textContent=next.candidate||'作業情報を確認してください。';
        button.disabled=Boolean(next.blocked)||next.currentTitle===next.candidate;
        message.textContent=notice||next.blocked||(next.currentTitle===next.candidate?'現在の表示名は候補と一致しています。':'登録済み作業から生成しました。');
      }catch{host.hidden=true;snapshot=null;}finally{refreshing=false;}
    }
    workSelect.addEventListener('change',()=>{
      const work=snapshot?.works.find(work=>work.workId===workSelect.value);
      if(work)for(const key of ['workId','group','detail'])fields[key].value=work[key];
    });
    register.addEventListener('click',async()=>{
      if(!snapshot||operating)return;
      const selected=snapshot;operating=true;register.disabled=true;
      let resultNotice='';
      try{
        const values=Object.fromEntries(Object.entries(fields).map(([key,input])=>[key,input.value.trim()]));
        await bindWork({expectedId:selected.id,expectedTitle:selected.currentTitle,work:{workId:values.workId,group:values.group,detail:values.detail},date:values.date});
        resultNotice='作業を登録しました。改名には確認ボタンを押してください。';
      }catch(error){resultNotice=error.message;}
      finally{operating=false;register.disabled=false;await refresh();notice=resultNotice;message.textContent=notice;}
    });
    unbind.addEventListener('click',async()=>{
      if(!snapshot||operating)return;
      const id=snapshot.id;operating=true;
      try{if(currentId()===id)await chrome.storage.local.remove(BINDING+id);}
      catch(error){notice=error.message;}
      finally{operating=false;await refresh();}
    });
    button.addEventListener('click',async()=>{
      if(!snapshot||operating)return;
      const selected=snapshot;operating=true;button.disabled=true;
      let resultNotice='';
      try{
        await confirmCandidate({expectedId:selected.id,expectedTitle:selected.currentTitle,title:selected.candidate});
        resultNotice='画面で変更を確認しました。再読み込み後の保持は別途確認してください。';
      }catch(error){resultNotice=error.message;}
      finally{operating=false;await refresh();notice=resultNotice;message.textContent=notice;}
    });
    window.addEventListener('popstate',()=>void refresh());
    window.addEventListener('pageshow',()=>void refresh());
    chrome.storage.onChanged.addListener(()=>void refresh());
    setInterval(()=>void refresh(),800);
    void refresh();
  }
})();

