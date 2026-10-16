/* Session Deck: public, read-only portfolio UI. No third-party dependencies. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const ledgerUrl = './docs/APP_PORTFOLIO.md';
  const observationUrl = './data/portfolio-observations.json';
  const state = {apps:[], observations:new Map(), snapshot:null, quick:'all', compact:true, open:new Set(), ledgerReady:false, scanReady:false};
  const stageOrder = ['運用・改善','限定公開','試作','調査・設計','構想','保留'];
  const dateFormat = new Intl.DateTimeFormat('ja-JP', {timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});
  const allowedRepo = /^https:\/\/github\.com\/[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+\/?$/i;
  const allowedGithub = /^https:\/\/github\.com\/[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+(?:\/[^\s"'<>]*)?$/i;
  const allowedCompare = /^https:\/\/github\.com\/[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+\/compare\/[a-f0-9]{40}\.\.\.[a-f0-9]{40}$/i;

  function node(tag, cls, content) {
    const el = document.createElement(tag);
    if (cls) el.className=cls;
    if (content !== undefined) el.textContent=String(content);
    return el;
  }
  function plain(s) {
    return String(s || '').replace(/\[([^\]]+)\]\(https?:\/\/[^)]*\)/g,'$1').replace(/[\u0060*]/g,'').trim();
  }
  function shortName(raw) {
    const hit=String(raw||'').match(/^\*\*([^*]+)\*\*/);
    return hit ? hit[1] : plain(raw).split('：')[0].trim();
  }
  function summaryAfterName(raw) {
    const t=plain(raw);
    const idx=t.indexOf('：');
    return idx >= 0 ? t.slice(idx+1).trim() : '';
  }
  function repoFrom(s) {
    const hit=String(s||'').match(/\]\((https:\/\/github\.com\/[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+)\)/);
    return hit && allowedRepo.test(hit[1]) ? hit[1] : null;
  }
  function readRows(md) {
    let section='', out=[];
    md.split(/\r?\n/).forEach(line => {
      if (/^## A\. /.test(line)) section='repo';
      else if (/^## B\. /.test(line)) section='chat';
      else if (/^## C\. /.test(line)) section='';
      if (!section || !/^\|\s*APP-\d{3}\s*\|/.test(line)) return;
      const columns=line.split('|').slice(1,-1).map(s => s.trim());
      if (section==='repo' && columns.length>=6) {
        out.push({id:columns[0], name:shortName(columns[1]), description:summaryAfterName(columns[1]), stage:plain(columns[2]), repo:repoFrom(columns[3]), result:plain(columns[4]), next:plain(columns[5]), source:'repo'});
      } else if (section==='chat' && columns.length>=5) {
        out.push({id:columns[0], name:shortName(columns[1]), description:summaryAfterName(columns[1]), stage:plain(columns[2]), repo:null, result:plain(columns[3]), next:plain(columns[4]), source:'chat'});
      }
    });
    const ids=new Set();
    out.forEach(a => { if(ids.has(a.id)) throw new Error('台帳内のAPP-IDが重複'); ids.add(a.id); });
    if (!out.length) throw new Error('台帳のアプリ行が見つかりません');
    return out;
  }
  function stageOf(app) {
    const raw=app.stage.split('／')[0];
    return stageOrder.find(x => raw.startsWith(x)) || raw.split('・')[0] || '未分類';
  }
  function statusOf(app) {
    const tail=app.stage.includes('／') ? app.stage.split('／').slice(1).join('／') : '';
    if (/保留/.test(tail)) return '保留';
    if (/検証待ち|確認待ち|未確認/.test(tail)) return '検証待ち';
    if (/進行中|改善中|作業中/.test(tail)) return '進行中';
    if (/未着手/.test(tail)) return '未着手';
    return tail ? tail : '状態未記載';
  }
  function looksActive(a) {
    return /進行中|改善中|作業中/.test(a.stage) && !/保留/.test(statusOf(a));
  }
  function observation(app) {
    if(!app.repo) return null;
    return state.observations.get(app.repo.slice('https://github.com/'.length)) || null;
  }
  function commitOf(app) {
    const obs=observation(app);
    return obs && (obs.fetch_status==='ok'||obs.fetch_status==='partial') && obs.commit && typeof obs.commit.sha==='string' ? obs.commit : null;
  }
  function latestTime(app) {
    const commit=commitOf(app);
    const stamp=commit && commit.committed_at ? Date.parse(commit.committed_at) : NaN;
    return Number.isFinite(stamp) ? stamp : null;
  }
  function lastMovement(app) {
    if (!app.repo) return {main:'未照合', sub:'GitHub保存先を確認中', title:'アプリのコード更新日時は取得できません'};
    const obs=observation(app), commit=commitOf(app), tick=latestTime(app);
    if (!obs || !commit || tick===null) return {main:'未取得',sub:'GitHub最終コミット不明',title:'リポジトリは存在しますが最終コミット日時を確認できません'};
    return {main:dateFormat.format(new Date(tick))+' JST',sub:'GitHub最終コミット · '+commit.sha.slice(0,7),title:commit.committed_at+'（コミットに記録された日時。AIセッションの最終利用時刻ではありません）'};
  }
  function badgeClass(stage) {
    if (/^運用|^限定公開/.test(stage))return 'stage-public';
    if (/^調査/.test(stage))return 'stage-design';
    if (/^構想/.test(stage))return 'stage-idea';
    if (/^保留/.test(stage))return 'stage-hold';
    if (/^試作/.test(stage))return 'stage-active';
    return '';
  }
  function safeLink(href, label, cls) {
    if (typeof href!=='string' || !allowedGithub.test(href)) return null;
    const a=node('a',cls||'',label);
    a.href=href;a.target='_blank';a.rel='noopener noreferrer';
    return a;
  }
  function buildReviewMessage(app, obs) {
    const commit=commitOf(app);
    return [
      'Session Deckの更新候補を検証してください。',
      'APP-ID: '+app.id,
      'Repo: '+app.repo,
      '確認基準コミット: '+(obs.review_anchor_sha||'未設定'),
      '確認基準の種類: '+(obs.review_anchor_kind==='reviewed'?'以前の明示レビュー':'初期観測のみ（人によるレビュー未実施）'),
      '最新コミット: '+(commit ? commit.sha : '未取得'),
      'GitHubの比較: '+(obs.review_compare_url||'未取得'),
      'README、コミット、PR、CI、配信状況を検証し、実機確認は別に扱ってください。',
      '重要な成果が確認できたときだけAPP_PORTFOLIO.mdの該当行を変更してください。',
      '差分の内容を十分にレビューできた場合に限りPORTFOLIO_REVIEW_CHECKPOINTS.jsonの該当基準を証拠URLと日時つきで更新してください。',
      '根拠が足りなければ未レビューを維持し、完了扱いにしないでください。'
    ].join('\n');
  }
  function attachCopy(button, content, success) {
    button.addEventListener('click',async event=>{
      event.preventDefault();event.stopPropagation();
      try{
        if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('clipboard-unavailable');
        await navigator.clipboard.writeText(content);
        button.textContent=success;
      }catch(_){
        button.textContent='コピーできません。運用手順をご利用ください';
      }
    });
  }
  function buildRow(app) {
    const details=node('details','app-row');
    details.dataset.appId=app.id;
    details.open=state.open.has(app.id);
    details.addEventListener('toggle',()=>{if(details.open)state.open.add(app.id);else state.open.delete(app.id);});
    const summary=node('summary','row-main');

    const name=node('div','cell app-cell');
    const title=node('div','app-label');
    title.append(node('span','id-code',app.id), document.createTextNode(app.name));
    name.append(title);
    if(app.description) name.append(node('span','app-sub',app.description));

    const current=node('div','cell stage-cell');
    const work=node('div','work-status');
    const category=stageOf(app);
    work.append(node('span','stage-pill '+badgeClass(category),category));
    current.append(work,node('span','phase-note',statusOf(app)));

    const when=node('div','cell when-cell');
    const date=lastMovement(app);
    const time=node('span','when-main',date.main);time.title=date.title;
    when.append(time,node('span','when-sub',date.sub));

    const next=node('div','cell next-cell');
    next.append(node('span','next-kicker','NEXT / 次にすること'),node('span','next-text',app.next || '台帳に未記載'));

    summary.append(name,current,when,next,node('span','expand','›'));
    summary.setAttribute('aria-label',app.name+' の詳細を展開');
    details.append(summary);

    const content=node('div','row-detail'),inner=node('div','detail-inner');
    const makeDetail=(label,value,wide)=>{
      const cell=node('div','detail-cell'+(wide?' wide':''));
      cell.append(node('div','detail-label',label),node('div','detail-text',value));
      return cell;
    };
    inner.append(
      makeDetail('現在地 / 台帳に記載された状態',app.stage,true),
      makeDetail('確認できた成果・未完了事項',app.result || '記載なし',false),
      makeDetail('次の作業',app.next || '記載なし',false)
    );
    const obs=observation(app), commit=commitOf(app);
    if(obs){
      const statusText={
        pending:'未レビューのGitHub更新あり。基準は明示確認まで変わりません。',
        reviewed:'現在観測できたHEADまでは明示レビュー済み。',
        baseline:'初期観測SHAと一致しています。内容は人による未レビューです。',
        untracked:'このアプリのレビュー基準は未登録です。',
        unavailable:'GitHub取得不能につき比較できません。'
      }[obs.review_status] || 'レビュー状況は未確認';
      const safeScan=state.snapshot && state.snapshot.generated_at ? dateFormat.format(new Date(state.snapshot.generated_at))+' JST' : '未確認';
      const meta=makeDetail('GitHub観測 / 収集時刻 '+safeScan,statusText,true);
      const alert=node('div','detail-alert'+(obs.review_status==='reviewed'?' ok':''),statusText);
      meta.append(alert);
      if(obs.workflow){
        let ci='直近のActionsは現行HEADの結果とは限りません';
        if(obs.workflow.matches_latest_commit) ci='現行HEADとActionsの対象SHAが一致 ／ '+(obs.workflow.conclusion||obs.workflow.status||'結果未確認');
        meta.append(node('div','when-sub','CI: '+ci));
      }
      inner.append(meta);
    }else if(app.source==='repo'){
      inner.append(makeDetail('GitHub観測','収集結果をまだ確認できません。未取得を「変更なし」とみなしません。',true));
    }
    content.append(inner);
    const links=node('div','detail-links');
    if(app.repo) {
      const repo=safeLink(app.repo,'リポジトリ ↗');if(repo)links.append(repo);
    }
    if(commit && commit.url){const commitLink=safeLink(commit.url,'最終コミット ↗');if(commitLink)links.append(commitLink);}
    if(obs && obs.review_status==='pending' && typeof obs.review_compare_url==='string' && allowedCompare.test(obs.review_compare_url)){
      const diff=safeLink(obs.review_compare_url,'確認基準からの差分 ↗');if(diff)links.append(diff);
    }
    if(obs && obs.review_status==='pending' && commit && navigator.clipboard){
      const button=node('button','copy-review','検証依頼をコピー');button.type='button';
      attachCopy(button,buildReviewMessage(app,obs),'コピーしました ✓');
      links.append(button);
    }
    content.append(links);
    details.append(content);
    return details;
  }
  function matches(app) {
    const q=$('search').value.trim().toLocaleLowerCase();
    const stage=$('stage').value;
    if(stage!=='all' && stageOf(app)!==stage)return false;
    if(q && ![app.id,app.name,app.description,app.stage,app.next,app.result].join(' ').toLocaleLowerCase().includes(q))return false;
    if(state.quick==='ideas' && app.source!=='chat')return false;
    if(state.quick==='active' && !looksActive(app))return false;
    if(state.quick==='review' && observation(app)?.review_status!=='pending')return false;
    return true;
  }
  function sortApps(a,b) {
    const mode=$('sort').value;
    if(mode==='id')return a.id.localeCompare(b.id);
    if(mode==='stage')return stageOrder.indexOf(stageOf(a))-stageOrder.indexOf(stageOf(b)) || a.id.localeCompare(b.id);
    const ta=latestTime(a),tb=latestTime(b);
    return (tb===null?-Infinity:tb)-(ta===null?-Infinity:ta) || a.id.localeCompare(b.id);
  }
  function draw() {
    if(!state.ledgerReady)return;
    const list=state.apps.filter(matches).sort(sortApps);
    const fragment=document.createDocumentFragment();
    list.forEach(app=>fragment.append(buildRow(app)));
    $('list').replaceChildren(fragment);
    $('resultCount').textContent=list.length+' / '+state.apps.length+'件';
    $('empty').hidden=list.length>0;
    $('totalCount').textContent=String(state.apps.length);
    $('ideaCount').textContent=String(state.apps.filter(a=>a.source==='chat').length);
    $('activeCount').textContent=String(state.apps.filter(looksActive).length);
    $('pendingCount').textContent=state.scanReady?String(state.apps.filter(a=>observation(a)?.review_status==='pending').length):'—';
    document.querySelectorAll('[data-quick]').forEach(button=>{
      const active=button.dataset.quick===state.quick;
      button.setAttribute('aria-pressed',String(active));
    });
  }
  function renderSync() {
    const target=$('syncStatus');
    if(!state.snapshot){
      target.textContent='公開GitHubの観測データは未取得です。アプリ台帳のみ表示しています。';
      return;
    }
    const s=state.snapshot;
    const d=Date.parse(s.generated_at || '');
    const stamp=Number.isFinite(d)?dateFormat.format(new Date(d))+' JST':'時刻不明';
    const age=Number.isFinite(d)?(Date.now()-d)/86400000:Infinity;
    const stale=age>10?' ／ 10日以上更新なし':'';
    const pending=s.repositories.filter(x=>x.review_status==='pending').length;
    target.textContent='GitHub観測：'+stamp+' ／ '+s.usable_count+'/'+s.repo_count+' Repo ／ 未レビュー '+pending+'件'+stale;
    target.title='これはGitHub Actionsによる収集時刻です。個々の開発セッションの最終稼働日時ではありません。';
  }
  function setup() {
    document.querySelectorAll('[data-quick]').forEach(button=>{
      button.addEventListener('click',()=>{state.quick=button.dataset.quick;draw();});
    });
    ['search','stage','sort'].forEach(id=>$(id).addEventListener(id==='search'?'input':'change',draw));
    $('clearFilters').addEventListener('click',()=>{
      $('search').value='';$('stage').value='all';$('sort').value='recent';state.quick='all';draw();
    });
    const switchDensity=(compact)=>{
      state.compact=compact;
      document.body.classList.toggle('comfortable',!compact);
      $('compactBtn').classList.toggle('active',compact);
      $('comfortableBtn').classList.toggle('active',!compact);
      $('compactBtn').setAttribute('aria-pressed',String(compact));
      $('comfortableBtn').setAttribute('aria-pressed',String(!compact));
    };
    $('compactBtn').addEventListener('click',()=>switchDensity(true));
    $('comfortableBtn').addEventListener('click',()=>switchDensity(false));
    const intake=[
      'このアプリを「アプリ思いつき作成」の全体台帳と照合してください。新規実装はせず、①正本GitHub Repo、②実装済・検証済・公開済を分けた現在地、③最新コミット・PR・CI等の証拠URL、④GitHub未保存の成果、⑤未完了と次の一手を報告してください。',
      '未確認は未確認と明記し、重要な状態変化のときだけ記録してください。',
      '全体台帳: https://github.com/moyashimisosoup/session-deck/blob/main/docs/APP_PORTFOLIO.md',
      '台帳の更新ができなければ未反映メモを残してください。'
    ].join('\n');
    attachCopy($('copyIntake'),intake,'コピーしました ✓');
  }
  async function start() {
    setup();
    const [ledger,observationResponse]=await Promise.allSettled([
      fetch(ledgerUrl,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('ledger HTTP '+r.status);return r.text();}),
      fetch(observationUrl,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('snapshot HTTP '+r.status);return r.json();})
    ]);
    if(ledger.status==='fulfilled'){
      try{state.apps=readRows(ledger.value);state.ledgerReady=true;draw();}
      catch(error){$('loadError').hidden=false;console.warn('Portfolio ledger error:',error.message);}
    }else{$('loadError').hidden=false;}
    if(observationResponse.status==='fulfilled'){
      const obj=observationResponse.value;
      if(obj && obj.schema_version===1 && obj.classification==='public_repository_metadata_only' && Array.isArray(obj.repositories)){
        state.snapshot=obj;state.scanReady=true;
        obj.repositories.forEach(item=>{
          if(item && typeof item.repo==='string' && /^[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+$/.test(item.repo) && typeof item.app_id==='string')
            state.observations.set(item.repo,item);
        });
        draw();
      }
    }
    renderSync();
  }
  start().catch(error=>{console.error('Portfolio UI initialization failed',error);$('loadError').hidden=false;renderSync();});
})();
