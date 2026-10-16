/**
 * Read-only GitHub public metadata probe. No auth, writes, or private repository access.
 * Output is for local review. NEVER commit the generated real-data JSON to public Pages.
 */
import { readFile } from 'node:fs/promises';

const argv=process.argv.slice(2);
const opt=flag=>{const i=argv.indexOf(flag);return i<0?null:argv[i+1];};
const repository=opt('--repo') || 'moyashimisosoup/session-deck';
const fixture=opt('--fixture');
const limit=Number(opt('--limit') || 5);
if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)||!Number.isInteger(limit)||limit<1||limit>20){
  throw Error('Usage: --repo owner/repository [--limit 1..20] [--fixture path]');
}
const base='https://api.github.com/repos/'+repository;
const endpoints={
  issues:base+'/issues?state=all&per_page='+limit,
  pulls:base+'/pulls?state=all&per_page='+limit,
  workflow_runs:base+'/actions/runs?per_page='+limit,
};
async function request(kind,url){
  const response=await fetch(url,{headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},redirect:'error'});
  if(!response.ok)throw Error(kind+': HTTP '+response.status);
  return response.json();
}
async function collect(read){
  const [issues,pulls,runs]=await Promise.all([read('issues',endpoints.issues),read('pulls',endpoints.pulls),read('workflow_runs',endpoints.workflow_runs)]);
  if(!Array.isArray(issues)||!Array.isArray(pulls)||!Array.isArray(runs?.workflow_runs))throw Error('Unexpected GitHub response schema');
  const pick=(items,fields)=>items.slice(0,limit).map(row=>Object.fromEntries(fields.map(k=>[k,row?.[k]??null])));
  return {
    schema_version:1,
    source:'github_public_read_only',
    repository,
    observed_at:new Date().toISOString(),
    provenance:endpoints,
    verification:fixture?'fixture':'api_response_observed',
    issues:pick(issues.filter(row=>!row.pull_request),['number','state','title','html_url','updated_at']),
    pulls:pick(pulls,['number','state','title','html_url','updated_at']),
    workflow_runs:pick(runs.workflow_runs,['id','name','status','conclusion','head_sha','html_url','updated_at'])
  };
}
const read=fixture?async kind=>JSON.parse(await readFile(fixture,'utf8'))[kind]:request;
try{process.stdout.write(JSON.stringify(await collect(read),null,2)+'\n');}
catch(error){console.error('Public metadata probe failed:',error.message);process.exitCode=1;}
