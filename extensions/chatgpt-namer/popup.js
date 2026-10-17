(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const NAME=/^【[^】\n・]{1,20}】(?:0[1-9]|1[0-2])(?:0[1-9]|[12][0-9]|3[01])・[^・\s]{1,30}・[^\r\n]{2,70}$/u;
  let activeTab=null, activeId=null;
  const show=(text,failed=false)=>{ $('result').textContent=text; $('result').style.color=failed?'#ad404b':'#295c4d';};
  function valid(){
    const value=$('desired').value.trim();
    $('rename').disabled=!(activeTab&&activeId&&NAME.test(value));
  }
  async function send(type,extra={}){
    if(!activeTab)return {ok:false,error:'ChatGPT Webの会話を開いてください。'};
    return new Promise(resolve=>chrome.tabs.sendMessage(activeTab.id,{type,...extra},answer=>{
      if(chrome.runtime.lastError)return resolve({ok:false,error:'このページに接続できません。ChatGPTを再読み込みしてください。'});
      resolve(answer||{ok:false,error:'応答がありません。'});
    }));
  }
  async function init(){
    const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
    if(!tab?.url?.startsWith('https://chatgpt.com/')){
      $('session').textContent='ChatGPT Webのタブを選択してください。';
      return;
    }
    activeTab=tab;
    const result=await send('GET_STATUS');
    if(!result.ok){$('session').textContent=result.error;return;}
    activeId=result.id||null;
    $('session').textContent=result.id?
      '会話ID: '+result.id+'\n表示名: '+(result.currentTitle||'取得できません（サイドバーを開いてください）'):
      'まだ会話IDがありません。会話を保存してから再度開いてください。';
    if(result.record)show('記録: '+result.record.title+'（'+result.record.verification+'）');
    valid();
  }
  $('desired').addEventListener('input',valid);
  $('rename').addEventListener('click',async()=>{
    if(!activeId)return;
    const title=$('desired').value.trim();
    if(!NAME.test(title))return show('命名規則を確認してください。',true);
    $('rename').disabled=true;
    show('対象の会話名を変更し、画面で再確認しています…');
    const result=await send('RENAME',{title,expectedId:activeId});
    if(result.ok)show(result.status==='already'?'既に同じ名前でした。':'ChatGPT画面で変更後の表示名を確認しました。再読み込み後の維持は未確認です。');
    else show('未確認・未変更の可能性があります: '+result.error,true);
    valid();
  });
  init().catch(e=>show(e.message,true));
})();
