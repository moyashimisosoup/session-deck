/* Public repository hygiene: display only explicitly public, allowlisted data. */
(() => {
  'use strict';
  const root=document.getElementById('repoHygiene');
  if(!root)return;
  const rows=document.getElementById('hygieneRows');
  const label=document.getElementById('hygieneCount');
  const status=document.getElementById('hygieneStatus');
  const toggle=document.getElementById('toggleHygieneAll');
  const causes={
    same_name:'同名Repo',
    not_in_app_ledger:'台帳未登録',
    minimal_content:'初期状態に近い',
    push_30d_plus:'30日以上pushなし',
    push_60d_plus:'60日以上pushなし',
    push_90d_plus:'90日以上pushなし',
    push_time_unknown:'最終push未取得',
    archived:'既にアーカイブ済み'
  };
  const states={
    review_required:'確認待ち',
    canonical:'正本として確認済み',
    intentional_parallel:'役割分担を確認済み',
    maintenance:'保守対象',
    out_of_scope:'台帳の対象外と確認済み'
  };
  let snapshot=null,all=false;
  const make=(tag,cls,value)=>{
    const n=document.createElement(tag);if(cls)n.className=cls;
    if(value!==undefined)n.textContent=String(value);return n;
  };
  const score=x=>{
    const f=x.flags||[];
    return (f.includes('same_name')?100:0)+(f.includes('not_in_app_ledger')?40:0)+(f.includes('minimal_content')?30:0)+(f.includes('push_90d_plus')?20:f.includes('push_60d_plus')?10:f.includes('push_30d_plus')?5:0);
  };
  const validRepo=x=>x&&typeof x.repo==='string'&&/^(moyashimisosoup|yama-books)\/[a-zA-Z0-9_.-]+$/.test(x.repo)&&x.url==='https://github.com/'+x.repo;
  function render(){
    if(!snapshot)return;
    const items=snapshot.repositories.filter(validRepo).filter(x=>all||(x.flags||[]).length && x.review_status==='review_required');
    items.sort((a,b)=>score(b)-score(a)||a.repo.localeCompare(b.repo));
    const fragment=document.createDocumentFragment();
    items.forEach(x=>{
      const line=make('div','hygiene-row');
      const title=make('div','hygiene-title');
      const a=make('a','',x.repo);a.href=x.url;a.target='_blank';a.rel='noopener noreferrer';
      title.append(a);
      if(x.app_id) title.append(make('span','hygiene-appid',x.app_id));
      const info=make('div','hygiene-meta');
      const date=x.pushed_at?new Date(x.pushed_at):null;
      const push=date&&Number.isFinite(date.getTime())?new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(date):'日時未取得';
      info.append(make('span','','最終push '+push),make('span','','／ '+(states[x.review_status]||'状態未確認')));
      const flags=make('div','hygiene-flags');
      (x.flags||[]).filter(f=>Object.hasOwn(causes,f)).forEach(f=>flags.append(make('span','hygiene-flag',causes[f])));
      if(!flags.childNodes.length) flags.append(make('span','hygiene-clean','特別な確認候補なし'));
      line.append(title,info,flags);
      fragment.append(line);
    });
    rows.replaceChildren(fragment);
    label.textContent=all?items.length+'件すべて':items.length+'件を確認';
    if(!items.length)rows.append(make('p','hygiene-empty','現在のフィルタに該当する整理候補はありません。'));
    toggle.textContent=all?'要確認のみ表示':'全Repoを表示';
    toggle.setAttribute('aria-pressed',String(all));
  }
  toggle.addEventListener('click',()=>{all=!all;render()});
  fetch('./data/repo-hygiene.json',{cache:'no-store'})
    .then(response=>{if(!response.ok)throw new Error('observation_unavailable');return response.json()})
    .then(x=>{
      if(x?.schema_version!==1||x.classification!=='public_repository_metadata_only'||!Array.isArray(x.repositories)||
         !Number.isInteger(x.total_public_repositories)||
         x.repositories.some(y=>!validRepo(y)))throw new Error('invalid_public_inventory');
      snapshot=x;
      const time=x.generated_at?new Date(x.generated_at):null;
      const date=time&&Number.isFinite(time.getTime())?new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(time)+' JST':'時刻未確認';
      status.textContent='最終監査 '+date+' ／ 公開Repo '+x.total_public_repositories+'件。重複・未登録・未push期間は要確認の手掛かりです。自動アーカイブや削除は行いません。';
      render();
    })
    .catch(()=>{
      status.textContent='公開Repoの監査データは取得できませんでした。以前の候補を「解決済み」にはしません。GitHub Actionsの実行履歴をご確認ください。';
      label.textContent='取得不能';
      toggle.disabled=true;
    });
})();