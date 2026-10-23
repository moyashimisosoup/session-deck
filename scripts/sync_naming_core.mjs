// Keep the console standalone for Pages without shipping the extension folder.
import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const core=readFileSync(new URL('extensions/chatgpt-namer/naming-core.js',root),'utf8').trim();
const path=new URL('naming.html',root);
let html=readFileSync(path,'utf8');
const block=`/* NAMING_CORE_START */\n${core}\n/* NAMING_CORE_END */`;
if(html.includes('/* NAMING_CORE_START */'))html=html.replace(/\/\* NAMING_CORE_START \*\/[\s\S]*?\/\* NAMING_CORE_END \*\//,block);
else html=html.replace('<script>','<script>\n'+block);
if(process.argv.includes('--check')){
  if(html!==readFileSync(path,'utf8'))throw Error('Run node scripts/sync_naming_core.mjs');
}else writeFileSync(path,html);
