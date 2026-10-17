/* Session Deck Namer 0.2.0: explicit user-directed rename in ChatGPT Web UI only. */
(() => {
  'use strict';
  const TITLE=/^【[^】\n・]{1,20}】(?:0[1-9]|1[0-2])(?:0[1-9]|[12][0-9]|3[01])・[^・\s]{1,30}・[^\r\n]{2,70}$/u;
  const LABELS=new Set(['rename','名前を変更','名称変更','名前の変更','rename conversation','rename chat']);
  const STORAGE='sessionDeckNamerRecords';
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
  function menuButton(id){
    const candidate=document.querySelector('[data-conversation-options-trigger="'+CSS.escape(id)+'"]');
    if(candidate&&candidate instanceof HTMLElement)return candidate;
    const anchor=findConversationLink(id);
    if(!anchor)return null;
    const row=anchor.closest('[data-sidebar-chatgpt-conversation-key],[role="listitem"]')||anchor.parentElement?.parentElement;
    if(!row)return null;
    // Do not click general page-level action menus.
    return row.querySelector('button[aria-haspopup="menu"],button[data-testid="conversation-options-button"]');
  }
  function menuRenameItem(){
    const options=[...document.querySelectorAll('[role="menuitem"]')].filter(el=>el.getClientRects().length);
    const matches=options.filter(el=>LABELS.has(clean(el.textContent||el.getAttribute('aria-label')).toLowerCase()));
    return matches.length===1?matches[0]:null;
  }
  function editor(){
    const found=[...document.querySelectorAll('input[name="title-editor"],input[aria-label="Chat title"],input[aria-label="会話名"],input[data-testid="rename-title-input"]')];
    if(found.length===1)return found[0];
    const dialogs=[...document.querySelectorAll('[role="dialog"]')].filter(x=>x.getClientRects().length);
    if(dialogs.length!==1)return null;
    const inputs=[...dialogs[0].querySelectorAll('input[type="text"]')];
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
    if(actions.length!==1)return false;
    actions[0].click();return true;
  }
  async function rename(id,title){
    if(busy)throw Error('ほかの改名処理が進行中です。');
    if(!TITLE.test(title))throw Error('命名規則に一致しません。');
    if(currentId()!==id)throw Error('対象会話が切り替わりました。');
    const previous=observedName(id);
    if(previous===title)return {status:'already',title,verification:'ui_observed'};
    busy=true;
    try{
      // We only mutate a currently visible, uniquely matched conversation row.
      let input=editor();
      if(!input){
        const button=await waitUntil(()=>menuButton(id),2500);
        if(!button)throw Error('会話のメニューが特定できません。サイドバーを開いて再試行してください。');
        button.click();
        const renameItem=await waitUntil(menuRenameItem,1700);
        if(!renameItem)throw Error('「名前を変更」メニューが一意に見つかりません。');
        renameItem.click();
        input=await waitUntil(editor,1700);
      }
      if(!input)throw Error('会話名の入力欄が見つかりません。');
      if(currentId()!==id)throw Error('対象会話が切り替わったため中止しました。');
      input.focus();
      setReactValue(input,title);
      if(!saveEditor(input))throw Error('保存操作の対象が特定できません。手動で確定してください。');
      const confirmed=await waitUntil(()=>currentId()===id&&observedName(id)===title,5000);
      if(!confirmed)throw Error('変更後のタイトルを画面上で確認できませんでした。');
      const item={id,title,previousTitle:previous||null,updatedAt:new Date().toISOString(),verification:'ui_observed'};
      const store=await chrome.storage.local.get(STORAGE);
      const records=store[STORAGE]&&typeof store[STORAGE]==='object'?store[STORAGE]:{};
      records[id]=item;
      await chrome.storage.local.set({[STORAGE]:records});
      return {status:'ui_verified',title,verification:'ui_observed'};
    }finally{busy=false;}
  }
  chrome.runtime.onMessage.addListener((msg,_sender,respond)=>{
    (async()=>{
      if(msg?.type==='GET_STATUS'){
        const id=currentId();
        const store=await chrome.storage.local.get(STORAGE);
        return {ok:true,id,currentTitle:id?observedName(id):null,record:id?store[STORAGE]?.[id]||null:null};
      }
      if(msg?.type==='RENAME'){
        const id=currentId();
        if(!id||id!==msg.expectedId)throw Error('開いている会話のIDと指定IDが一致しません。');
        const title=String(msg.title||'').trim();
        return {ok:true,...await rename(id,title)};
      }
      throw Error('未対応の操作です。');
    })().then(respond).catch(err=>respond({ok:false,error:err.message}));
    return true;
  });
})();
