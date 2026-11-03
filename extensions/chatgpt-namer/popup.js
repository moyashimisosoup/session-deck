(() => {
  'use strict';
  const $=id=>document.getElementById(id), naming=globalThis.SessionDeckNaming;
  let activeTab=null, snapshot=null, operating=false;
  const show=(text,failed=false)=>{ $('result').textContent=text; $('result').style.color=failed?'#ad404b':'#295c4d';};
  function valid(){
    const ready=Boolean(activeTab&&snapshot?.id&&snapshot.currentTitle&&!operating);
    $('rename').disabled=!(ready&&naming.parse($('desired').value.trim()));
    $('confirm').disabled=!(ready&&snapshot.candidate&&!snapshot.blocked&&snapshot.currentTitle!==snapshot.candidate);
    $('bind').disabled=!(ready&&$('work').value&&!snapshot.binding&&naming.dateValid($('date').value));
    $('register').disabled=!(ready&&!snapshot.binding&&naming.generate({workId:$('workId').value,group:$('group').value,detail:$('detail').value,date:$('date').value}));
    $('unbind').disabled=!(ready&&snapshot.binding);
    $('autoStop').disabled=!(activeTab&&snapshot&&!operating&&snapshot.auto?.id===snapshot.id&&['enabled','running'].includes(snapshot.auto?.state));
    $('workAutoOn').disabled=!(ready&&snapshot.binding&&!snapshot.blocked&&snapshot.autoAvailable&&!snapshot.policy);
    $('workAutoOff').disabled=!(ready&&snapshot.policy);
    $('copyNamingInstructions').disabled=!(snapshot?.works.some(w=>w.workId===$('work').value)&&!operating);
  }
  async function send(type,extra={}){
    if(!activeTab)return {ok:false,error:'ChatGPT Webの会話を開いてください。'};
    return new Promise(resolve=>chrome.tabs.sendMessage(activeTab.id,{type,...extra},answer=>{
      if(chrome.runtime.lastError)return resolve({ok:false,error:'このページに接続できません。ChatGPTを再読み込みしてください。'});
      resolve(answer||{ok:false,error:'応答がありません。'});
    }));
  }
  function render(result){
    snapshot=result;
    $('session').textContent=result.id?'会話ID: '+result.id+'\n表示名: '+(result.currentTitle||'取得できません（サイドバーを開いてください）'):'まだ会話IDがありません。会話を保存してから再度開いてください。';
    $('candidate').textContent=result.candidate||'作業を選択・登録すると正式名を生成します。';
    $('protection').textContent=(result.command?.state==='rejected'?result.command.notice:'')||result.blocked||result.command?.notice||'登録済み作業に基づく候補です。';
    $('autoStatus').textContent='自動改名：'+({enabled:'ON（明示した1会話・1候補のみ）',running:'実行中または前回未確認。中断時はOFFにして画面を確認してください。',completed:'完了（自動再試行なし）',stopped:'OFF（停止済み）'}[result.auto?.state]||'OFF');
    $('workAutoStatus').textContent=result.policy?'この作業の自動命名ON：今後、初めて登録する会話へ適用します。':'作業別の自動命名OFF。既存会話へ一括適用しません。';
    const selected=result.binding?.workId||$('work').value;
    $('work').replaceChildren(new Option('作業を選択してください',''));
    for(const work of result.works)$('work').append(new Option(work.workId+' — '+work.group+(result.autoWorkIds.includes(work.workId)?'（自動命名ON）':''),work.workId));
    $('work').value=selected;
    $('work').disabled=Boolean(result.binding);
    $('date').disabled=Boolean(result.binding);
    if(result.binding)$('date').value=result.binding.date;
    valid();
  }
  async function refresh(){
    const result=await send('GET_STATUS');
    if(!result.ok){snapshot=null;valid();throw Error(result.error);}
    render(result);
  }
  async function operate(type,extra={},rename=false){
    if(!snapshot||operating)return;
    const expectedId=snapshot.id,expectedTitle=snapshot.currentTitle;
    operating=true;valid();
    try{
      show(rename?'対象の会話名を変更し、画面で再確認しています…':'登録情報を更新しています…');
      const result=await send(type,{expectedId,expectedTitle,...extra});
      if(!result.ok)throw Error(result.error);
      await refresh();
      show(rename?(result.status==='already'?'既に同じ名前でした。':'ChatGPT画面で変更後の表示名を確認しました。再読み込み後の保持は未確認です。'):'登録情報を更新しました。');
    }catch(error){show(error.message,true);await refresh().catch(()=>{});}
    finally{operating=false;valid();}
  }
  $('date').value=naming.today();
  for(const id of ['date','workId','group','detail','desired'])$(id).addEventListener('input',valid);
  $('work').addEventListener('change',valid);
  $('copyNamingInstructions').addEventListener('click',async()=>{
    try{
      const work=snapshot?.works.find(w=>w.workId===$('work').value);
      await navigator.clipboard.writeText(globalThis.SessionDeckNamerCommand.instructions(work));
      show('一言命名用の指示をコピーしました。対象のChatGPTプロジェクト指示へ一度貼り付けてください。会話ID・本文は含みません。');
    }catch(error){show(error.message,true);}
  });
  $('bind').addEventListener('click',()=>{
    const work=snapshot?.works.find(work=>work.workId===$('work').value);
    if(work)void operate('BIND_WORK',{work,date:$('date').value});
  });
  $('register').addEventListener('click',()=>void operate('BIND_WORK',{work:{workId:$('workId').value.trim(),group:$('group').value.trim(),detail:$('detail').value.trim()},date:$('date').value.trim()}));
  $('unbind').addEventListener('click',()=>void operate('UNBIND_WORK'));
  $('autoStop').addEventListener('click',()=>void operate('STOP_AUTO'));
  $('workAutoOn').addEventListener('click',()=>void operate('ENABLE_WORK_AUTO',{workId:snapshot?.binding?.workId,title:snapshot?.candidate}));
  $('workAutoOff').addEventListener('click',()=>void operate('STOP_WORK_AUTO',{workId:snapshot?.binding?.workId}));
  $('confirm').addEventListener('click',()=>void operate('CONFIRM_CANDIDATE',{title:snapshot?.candidate},true));
  $('rename').addEventListener('click',()=>void operate('RENAME',{title:$('desired').value.trim()},true));
  $('export').addEventListener('click',async()=>{
    try{
      const text=SessionDeckBackup.encode(await chrome.storage.local.get(null));
      const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));
      const link=document.createElement('a');link.href=url;link.download='session-deck-namer-backup.json';link.click();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      $('backupResult').textContent='保存ファイルのダウンロードを開始しました。保存先を確認してください。';
    }catch(error){$('backupResult').textContent=error.message;}
  });
  $('import').addEventListener('change',async()=>{
    const file=$('import').files?.[0];if(!file)return;
    try{
      if(file.size>5_000_000)throw Error('保存ファイルが大きすぎます。');
      const data=SessionDeckBackup.decode(await file.text());
      const merged=SessionDeckBackup.merge(await chrome.storage.local.get(null),data);
      await chrome.storage.local.set(merged);
      $('backupResult').textContent='保存データを読み込みました。旧拡張の保存データは削除していません。';
      if(activeTab)await refresh();
    }catch(error){$('backupResult').textContent=error.message;}
    finally{$('import').value='';}
  });
  (async()=>{
    const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
    if(!tab?.url?.startsWith('https://chatgpt.com/'))throw Error('ChatGPT Webのタブを選択してください。');
    activeTab=tab;
    await refresh();
    // Refresh route identity even if the popup is kept open while navigating.
    setInterval(()=>{if(!operating)void refresh().catch(error=>show(error.message,true));},1000);
  })().catch(error=>show(error.message,true));
})();
