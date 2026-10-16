/* Search and keyboard navigation: public metadata only, no writes. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const themeToggle = $('themeToggle');
  const launcher = $('commandLauncher');
  const STORAGE_KEY = 'session-deck-portfolio-theme';
  let overlay = null, input = null, resultRoot = null, items = [], activeIndex = 0, returnFocus = null;
  let selectedRow = null;

  const buttons = [
    {id:'view-review',name:'未レビューを確認する',note:'更新候補',action:() => api()?.setView('review')},
    {id:'view-active',name:'進行中のアプリ',note:'台帳ベース',action:() => api()?.setView('active')},
    {id:'view-all',name:'すべてのアプリ',note:'表示切替',action:() => api()?.setView('all')},
    {id:'view-ideas',name:'Repo未照合の構想',note:'整理待ち',action:() => api()?.setView('ideas')},
    {id:'theme',name:'明暗テーマを切り替える',note:'外観',action:toggleTheme}
  ];
  const api = () => window.SessionDeckPortfolio;
  function create(tag,cls,text){
    const v=document.createElement(tag);
    if(cls)v.className=cls;
    if(text!==undefined)v.textContent=text;
    return v;
  }
  function safeStorageGet(){
    try{return localStorage.getItem(STORAGE_KEY)}catch(_){return null}
  }
  function safeStorageSet(value){
    try{localStorage.setItem(STORAGE_KEY,value)}catch(_){/* Private mode is fine. */}
  }
  function setTheme(value,save=true){
    const theme=value==='light'?'light':'dark';
    document.documentElement.dataset.theme=theme;
    document.documentElement.style.colorScheme=theme;
    themeToggle.textContent=theme==='dark'?'☼':'☾';
    themeToggle.title=theme==='dark'?'ライトテーマへ切り替える':'ダークテーマへ切り替える';
    themeToggle.setAttribute('aria-label',themeToggle.title);
    themeToggle.setAttribute('aria-pressed',String(theme==='dark'));
    if(save)safeStorageSet(theme);
  }
  function toggleTheme(){setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');}
  setTheme(safeStorageGet()||'dark',false);
  themeToggle.addEventListener('click',toggleTheme);
  function isTyping(el){
    return !!(el && typeof el.matches==='function' && (el.matches('input,textarea,select,[contenteditable="true"]')||el.closest('[contenteditable="true"]')));
  }
  function allRows(){
    return Array.from(document.querySelectorAll('.app-row'));
  }
  function selectRow(index){
    const rows=allRows();
    if(!rows.length)return;
    if(selectedRow && selectedRow.isConnected)selectedRow.classList.remove('keyboard-selected');
    const normalized=(index+rows.length)%rows.length;
    selectedRow=rows[normalized];
    selectedRow.classList.add('keyboard-selected');
    selectedRow.scrollIntoView({block:'nearest',behavior:'auto'});
  }
  function moveSelection(delta){
    const rows=allRows();
    if(!rows.length)return;
    const current=rows.findIndex(r=>r===selectedRow);
    if(current<0)selectRow(delta>0?0:rows.length-1);
    else selectRow(current+delta);
  }
  function perform(action){
    closePalette(false);
    action();
  }
  function addItem(action,id,title,meta){
    const row=create('button','command-item');
    row.type='button';
    row.dataset.itemId=id;
    row.append(create('span','command-item-id',id.startsWith('APP-')?id:'↳'),create('span','command-item-name',title),create('span','command-item-meta',meta));
    row.addEventListener('mouseenter',()=>{
      const next=items.findIndex(x=>x.button===row);
      if(next>=0)highlight(next);
    });
    row.addEventListener('click',()=>perform(action));
    resultRoot.append(row);
    items.push({button:row,action});
  }
  function highlight(index){
    if(!items.length)return;
    activeIndex=(index+items.length)%items.length;
    items.forEach((item,i)=>{
      item.button.setAttribute('aria-current',String(i===activeIndex));
      item.button.setAttribute('aria-selected',String(i===activeIndex));
    });
    items[activeIndex].button.scrollIntoView({block:'nearest',behavior:'auto'});
  }
  function populate(){
    if(!resultRoot)return;
    const query=input.value.trim().toLocaleLowerCase();
    resultRoot.replaceChildren();
    items=[];
    const commands=buttons.filter(c=>(c.name+' '+c.note).toLocaleLowerCase().includes(query));
    if(commands.length){
      resultRoot.append(create('div','command-group','操作'));
      commands.forEach(c=>addItem(c.action,c.id,c.name,c.note));
    }
    const apps=(api()?.getApps()||[]).filter(a=>(a.id+' '+a.name+' '+a.stage).toLocaleLowerCase().includes(query)).slice(0,40);
    if(apps.length){
      resultRoot.append(create('div','command-group','アプリへ移動'));
      apps.forEach(a=>addItem(()=>api()?.focusApp(a.id),a.id,a.name,a.stage.split('／')[0]));
    }
    if(!items.length)resultRoot.append(create('div','command-empty','該当する操作やアプリがありません'));
    activeIndex=0;
    if(items.length)highlight(0);
  }
  function closePalette(restore=true){
    if(!overlay)return;
    const old=overlay;overlay=null;input=null;resultRoot=null;items=[];
    document.body.style.removeProperty('overflow');
    old.remove();
    if(restore && returnFocus && returnFocus.isConnected)returnFocus.focus();
    returnFocus=null;
  }
  function openPalette(){
    if(overlay){input?.focus();return}
    returnFocus=document.activeElement;
    overlay=create('div','command-backdrop');
    overlay.addEventListener('mousedown',e=>{if(e.target===overlay)closePalette()});
    const panel=create('section','command-panel');
    panel.setAttribute('role','dialog');
    panel.setAttribute('aria-modal','true');
    panel.setAttribute('aria-label','アプリ検索と操作メニュー');
    const head=create('div','command-head');
    const icon=create('span','command-symbol','⌕');icon.setAttribute('aria-hidden','true');
    input=create('input','command-input');
    input.type='search';input.setAttribute('aria-label','アプリまたは操作を検索');
    input.placeholder='アプリ名、APP-ID、操作を入力…';
    input.autocomplete='off';
    const close=create('button','command-dismiss','Esc');
    close.type='button';close.setAttribute('aria-label','操作メニューを閉じる');
    close.addEventListener('click',()=>closePalette());
    head.append(icon,input,close);
    resultRoot=create('div','command-list');resultRoot.id='commandResults';
    const foot=create('div','command-foot');
    foot.append(create('kbd','','↑↓'),document.createTextNode(' 選択'),create('kbd','','Enter'),document.createTextNode(' 実行'),create('kbd','','Esc'),document.createTextNode(' 閉じる'));
    panel.append(head,resultRoot,foot);overlay.append(panel);document.body.append(overlay);
    document.body.style.overflow='hidden';
    input.addEventListener('input',populate);
    overlay.addEventListener('keydown',e=>{
      if(e.key==='Escape'){e.preventDefault();closePalette();return;}
      if(e.key==='ArrowDown'){e.preventDefault();highlight(activeIndex+1);return;}
      if(e.key==='ArrowUp'){e.preventDefault();highlight(activeIndex-1);return;}
      if(e.key==='Enter' && items.length){e.preventDefault();const item=items[activeIndex];if(item)perform(item.action);return;}
      if(e.key==='Tab'){
        const focusable=[input,close,...items.map(x=>x.button)];
        const curr=focusable.indexOf(document.activeElement);
        if(e.shiftKey && curr<=0){e.preventDefault();focusable[focusable.length-1]?.focus();}
        else if(!e.shiftKey && curr===focusable.length-1){e.preventDefault();input.focus();}
      }
    });
    populate();input.focus();
  }
  launcher.addEventListener('click',openPalette);
  document.addEventListener('keydown',e=>{
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){
      e.preventDefault();
      if(overlay)closePalette();else openPalette();
      return;
    }
    if(overlay)return;
    if(e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||isTyping(e.target))return;
    const key=e.key.toLowerCase();
    if(key==='/'){
      e.preventDefault();$('search')?.focus();return;
    }
    if(key==='j'||e.key==='ArrowDown'){
      e.preventDefault();moveSelection(1);return;
    }
    if(key==='k'||e.key==='ArrowUp'){
      e.preventDefault();moveSelection(-1);return;
    }
    if(e.key==='Enter' && selectedRow?.isConnected){
      // Keep the browser's normal Enter behavior for links, buttons and summaries.
      if(e.target && typeof e.target.closest==='function' && e.target.closest('a,button,summary,[role="button"]'))return;
      e.preventDefault();
      const sum=selectedRow.querySelector('summary');
      if(sum){sum.click();sum.focus({preventScroll:true});}
      return;
    }
    if(e.key==='Escape' && selectedRow){
      selectedRow.classList.remove('keyboard-selected');
      selectedRow=null;
    }
  });
  const list=$('list');
  if(list && typeof MutationObserver!=='undefined'){
    new MutationObserver(()=>{
      if(selectedRow && !selectedRow.isConnected){selectedRow=null;}
    }).observe(list,{childList:true});
  }
})();
