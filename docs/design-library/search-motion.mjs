#!/usr/bin/env node
// No dependencies. Search the cross-source motion index.
import { readFileSync } from 'node:fs';
const db = JSON.parse(readFileSync(new URL('./motion-db.json', import.meta.url), 'utf8'));
const argv = process.argv.slice(2);
let source = '', family = '', limit = 30, terms = [];
for (let i = 0; i < argv.length; i++) {
 const a = argv[i];
 if (a === '--source') source = argv[++i] || '';
 else if (a === '--family') family = argv[++i] || '';
 else if (a === '--limit') limit = Number(argv[++i]) || 30;
 else if (a === '--help') { console.log('Usage: node search-motion.mjs [--source motion-prompt|takayu-reference|original] [--family grid] [--limit 30] keywords...');process.exit(0); }
 else terms.push(a.normalize('NFKC').toLowerCase());
}
const out=db.items.filter(v => {
 if (source && v.source !== source) return false;
 if (family && v.family !== family) return false;
 const all=[v.id,v.titleJa,v.titleEn,v.summaryJa,v.descriptionJa,v.category,v.family,v.askJa,v.lookupTerm,...(v.tags||[])].filter(Boolean).join(' ').normalize('NFKC').toLowerCase();
 return terms.every(w => all.includes(w));
});
console.log(`Found ${out.length} of ${db.totalIndexed}; showing ${Math.min(limit,out.length)}`);
for (const v of out.slice(0,limit)){
 console.log(`\n${v.id}  ${v.titleJa}  [${v.source}/${v.family}]`);
 if(v.durationMs) console.log(`  ${v.durationMs}ms · ${v.easing}`);
 if(v.summaryJa) console.log('  '+v.summaryJa);
 console.log('  '+(v.demoUrl||v.referenceUrl||v.recipePath));
}
