import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root=new URL('../', import.meta.url);
const runner=fileURLToPath(new URL('../scripts/github-public-probe.mjs',import.meta.url));
const fixture=fileURLToPath(new URL('./public-github-fixture.json',import.meta.url));

test('offline fixture returns only allowlisted public metadata', () => {
  const output=execFileSync(process.execPath,[runner,'--repo','example/demo','--fixture',fixture],{encoding:'utf8',cwd:fileURLToPath(root)});
  const result=JSON.parse(output);
  assert.equal(result.verification,'fixture');
  assert.equal(result.repository,'example/demo');
  assert.equal(result.issues.length,1);
  assert.equal(result.pulls.length,1);
  assert.equal(result.workflow_runs.length,1);
  assert.equal(result.workflow_runs[0].conclusion,'success');
  assert.equal(output.includes('hidden fixture field'),false);
  assert.equal(Object.hasOwn(result.issues[0],'body'),false);
});

test('rejects invalid or excessive repo requests', () => {
  assert.throws(() => execFileSync(process.execPath,[runner,'--repo','../private','--fixture',fixture],{stdio:'pipe'}));
  assert.throws(() => execFileSync(process.execPath,[runner,'--limit','500','--fixture',fixture],{stdio:'pipe'}));
});
