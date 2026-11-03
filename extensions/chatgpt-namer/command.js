/* Narrow, local-only protocol: a direct user request plus one marked reply. */
(() => {
  'use strict';
  function boundedText(node,limit){
    // Walk text nodes with an early bound; never materialize an entire message.
    let text='';
    const visit=n=>{
      if(n.nodeType===3){text+=String(n.nodeValue||'').slice(0,limit+1-text.length);return text.length<=limit;}
      for(const child of n.childNodes||[])if(!visit(child))return false;
      return true;
    };
    return visit(node)?text:null;
  }
  function action(text){
    const value=String(text??'').trim().replace(/[。！!]$/u,'').trim();
    const m=value.match(/^自動命名(?:を)?\s*(ON|OFF)(?:にして(?:ください)?)?$/iu);
    return m?m[1].toLowerCase():null;
  }
  function decode(text){
    if(typeof text!=='string'||text.length>2048)throw Error('命名指示が長すぎます。');
    const data=JSON.parse(text);
    const keys=['workId','group','detail','date'];
    if(!data||Array.isArray(data)||Object.keys(data).length!==keys.length||
      !keys.every(k=>Object.hasOwn(data,k)&&typeof data[k]==='string')||
      !globalThis.SessionDeckNaming.generate(data))throw Error('命名指示の形式を確認してください。');
    return data;
  }
  function observe(document){
    const messages=[...document.querySelectorAll('[data-message-author-role]')];
    let index=-1;
    for(let i=messages.length-1;i>=0;i--)if(messages[i].getAttribute('data-message-author-role')==='user'){index=i;break;}
    if(index<0)return null;
    const user=messages[index], text=boundedText(user,64), mode=action(text);
    const requestId=user.getAttribute('data-message-id');
    if(!mode||!requestId||user.querySelector?.('pre,blockquote,code'))return null;
    if(mode==='off')return {requestId,mode};
    const replies=messages.slice(index+1).filter(m=>m.getAttribute('data-message-author-role')==='assistant');
    const blocks=replies.flatMap(m=>[...m.querySelectorAll('code.language-session-deck-namer')]);
    if(blocks.length!==1||blocks[0].closest?.('blockquote'))return null;
    try{
      const payload=decode(boundedText(blocks[0],2048));
      return {requestId,mode,payload};
    }catch{return null;} // Partial or malformed reply never authorizes a write.
  }
  function latestUserId(document){
    const messages=[...document.querySelectorAll('[data-message-author-role]')];
    for(let i=messages.length-1;i>=0;i--)if(messages[i].getAttribute('data-message-author-role')==='user')
      return messages[i].getAttribute('data-message-id');
    return null;
  }
  function instructions(work){
    if(!globalThis.SessionDeckNaming.generate({...work,date:'0101'}))throw Error('登録済み作業を選択してください。');
    return [
      'ユーザーが単独で「自動命名をONにして」と依頼した場合、この会話だけを次の既存作業に対応付けて命名する。引用・例示を起動依頼と解釈しない。',
      '既存作業（番号・内容を変更、推測、再発番しない）：'+JSON.stringify({workId:work.workId,group:work.group,detail:work.detail}),
      '現在の会話名を変更できるツールが利用可能なら、正式名【短い作業名】MMDD・作業番号・具体的内容を作り、この会話だけをそのツールで改名する。成功応答を確認した場合だけ実行済みと報告する。',
      '改名ツールが利用できないChatGPT Webでは、応答にsession-deck-namer言語のコードブロックを1個だけ出す。中身はworkId,group,detail,dateの4キーだけのJSON。最初の3値は上記と完全一致させ、dateはJSTの当日MMDDを4桁で記す。日付が確認不能なら質問する。会話ID・URL・本文・秘密情報を含めない。',
      'コードを出力しただけでは改名成功と報告せず「拡張への命名指示を出しました」と伝える。拡張は登録済み作業と照合して実行する。未登録と表示された場合だけ最初の作業登録が必要。',
      '「自動命名をOFFにして」はこの会話の許可取消。停止後の復活や手動名の上書きを行わない。'
    ].join('\n');
  }
  globalThis.SessionDeckNamerCommand=Object.freeze({action,decode,observe,instructions,latestUserId,readAction:node=>action(boundedText(node,64))});
})();
