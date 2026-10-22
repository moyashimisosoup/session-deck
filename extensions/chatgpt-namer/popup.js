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
    $('protection').textContent=result.blocked||'登録済み作業に基づく候補です。';
    const selected=result.binding?.workId||$('work').value;
    $('work').replaceChildren(new Option('作業を選択してください',''));
    for(const work of result.works)$('work').append(new Option(work.workId+' — '+work.group,work.workId));
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
  $('bind').addEventListener('click',()=>{
    const work=snapshot?.works.find(work=>work.workId===$('work').value);
    if(work)void operate('BIND_WORK',{work,date:$('date').value});
  });
  $('register').addEventListener('click',()=>void operate('BIND_WORK',{work:{workId:$('workId').value.trim(),group:$('group').value.trim(),detail:$('detail').value.trim()},date:$('date').value.trim()}));
  $('unbind').addEventListener('click',()=>void operate('UNBIND_WORK'));
  $('confirm').addEventListener('click',()=>void operate('CONFIRM_CANDIDATE',{title:snapshot?.candidate},true));
  $('rename').addEventListener('click',()=>void operate('RENAME',{title:$('desired').value.trim()},true));
  (async()=>{
    const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
    if(!tab?.url?.startsWith('https://chatgpt.com/'))throw Error('ChatGPT Webのタブを選択してください。');
    activeTab=tab;
    await refresh();
    // Refresh route identity even if the popup is kept open while navigating.
    setInterval(()=>{if(!operating)void refresh().catch(error=>show(error.message,true));},1000);
  })().catch(error=>show(error.message,true));
})();
