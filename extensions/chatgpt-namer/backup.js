/* Local file transfer for moving an unpacked extension without losing records. */
(() => {
  'use strict';
  const known=key=>key==='sessionDeckNamerRecords'||/^(?:sessionDeckNamerWork:|sessionDeckNamerBinding:|sessionDeckNamerHistory:).+$/u.test(key);
  const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
  function validate(value,depth=0){
    if(depth>12)throw Error('保存データの階層が深すぎます。');
    if(value===null||['string','number','boolean'].includes(typeof value))return;
    if(typeof value!=='object')throw Error('保存データの形式を確認してください。');
    for(const [key,item] of Object.entries(value)){
      if(['__proto__','constructor','prototype'].includes(key))throw Error('使用できないキーが含まれています。');
      validate(item,depth+1);
    }
  }
  function encode(store){
    const data=Object.fromEntries(Object.entries(store).filter(([key])=>known(key)));
    validate(data);
    return JSON.stringify({app:'Session Deck Namer',data},null,2);
  }
  function decode(text){
    if(text.length>5_000_000)throw Error('保存データが大きすぎます。');
    const backup=JSON.parse(text);
    if(backup?.app!=='Session Deck Namer'||!object(backup.data))throw Error('Session Deck Namerの保存データではありません。');
    for(const [key,value] of Object.entries(backup.data)){
      if(!known(key)||!object(value)&&!Array.isArray(value))throw Error('保存データの項目を確認してください。');
    }
    validate(backup.data);
    return backup.data;
  }
  function merge(current,incoming){
    const result={...incoming};
    for(const [key,value] of Object.entries(incoming)){
      if(!(key in current))continue;
      if(key==='sessionDeckNamerRecords'){
        if(!object(value)||!object(current[key]))throw Error('改名記録の形式を確認してください。');
        result[key]={...current[key],...value};
        for(const id of Object.keys(value)){
          if(id in current[key]&&JSON.stringify(current[key][id])!==JSON.stringify(value[id]))throw Error('既存の改名記録と競合しています。上書きせず停止しました。');
        }
      }else if(JSON.stringify(current[key])!==JSON.stringify(value))throw Error('既存の作業・対応・履歴と競合しています。上書きせず停止しました。');
    }
    return result;
  }
  globalThis.SessionDeckBackup=Object.freeze({encode,decode,merge});
})();
