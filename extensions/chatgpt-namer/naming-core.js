/* Shared by the extension and the generated inline copy in naming.html. */
(() => {
  'use strict';
  const normalize=value=>String(value??'').trim();
  function dateValid(value){
    if(!/^\d{4}$/.test(value))return false;
    const month=Number(value.slice(0,2)),day=Number(value.slice(2));
    return month>=1&&month<=12&&day>=1&&day<=new Date(2024,month,0).getDate();
  }
  function today(now=new Date()){
    const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tokyo',month:'2-digit',day:'2-digit'}).formatToParts(now);
    return parts.find(p=>p.type==='month').value+parts.find(p=>p.type==='day').value;
  }
  function generate({group,date,workId,detail}={}){
    [group,date,workId,detail]=[group,date,workId,detail].map(normalize);
    if(!group||group.length>20||/[【】・\r\n\t]/u.test(group)||!dateValid(date)||
      !workId||workId.length>30||/[\s・【】]/u.test(workId)||
      detail.length<2||detail.length>70||/[\r\n\t]/u.test(detail))return '';
    return `【${group}】${date}・${workId}・${detail}`;
  }
  function parse(title){
    const match=String(title??'').match(/^【([^【】・\r\n]{1,20})】(\d{4})・([^・\s【】]{1,30})・([^\r\n]{2,70})$/u);
    if(!match)return null;
    const fields={group:match[1],date:match[2],workId:match[3],detail:match[4]};
    return generate(fields)===title?fields:null;
  }
  globalThis.SessionDeckNaming=Object.freeze({generate,parse,today,dateValid});
})();
