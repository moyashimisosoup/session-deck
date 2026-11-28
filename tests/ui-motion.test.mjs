/** Offline behavior tests for existing optional Web Animations motion. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const source=readFileSync(new URL('../motion.js',import.meta.url),'utf8');

function boot(){
  const events=new Map(),observed=new Map(),animations=[],frames=new Map();
  let nextFrame=0;
  const media={matches:false,addEventListener(type,fn){events.set('media:'+type,fn);}};
  const makeEl=(id,left=0)=>{
    const el={id,hidden:false,dataset:{id},left,
      getClientRects:()=>[{}],getBoundingClientRect:()=>({left}),
      animate(keyframes,options){
        const listeners={};
        const a={el,options,keyframes,cancelled:false,
          addEventListener(event,fn){listeners[event]=fn;},
          cancel(){this.cancelled=true;listeners.cancel?.();},
        };
        animations.push(a);return a;
      },
    };
    return el;
  };
  const cards=[makeEl('right-1',300),makeEl('right-2',300),makeEl('left-1',100)];
  const main=makeEl('mainContent');
  main.querySelectorAll=selector=>selector.includes('work-card')?cards:[];
  const drawer=makeEl('detailDrawer'),modal=makeEl('formModal'),toast=makeEl('toast');
  const nodes={mainContent:main,detailDrawer:drawer,formModal:modal,toast};
  const document={
    getElementById:id=>nodes[id],
    addEventListener(type,fn){events.set(type,fn);},
  };
  class MutationObserver{
    constructor(callback){this.callback=callback;}
    observe(el){observed.set(el.id,this.callback);}
  }
  const requestAnimationFrame=cb=>{const id=++nextFrame;frames.set(id,cb);return id;};
  const cancelAnimationFrame=id=>frames.delete(id);
  runInNewContext(source,{document,window:{matchMedia:()=>media},MutationObserver,
    requestAnimationFrame,cancelAnimationFrame,Math,Set,WeakMap},{filename:'motion.js'});
  return {
    animations,media,drawer,modal,toast,
    flush(){let pending=[...frames.values()];frames.clear();for(const cb of pending)cb();},
    rerender(){observed.get('mainContent')([{type:'childList'}]);},
    input(id){events.get('input')({target:{id}});},
    nav(){events.get('click')({target:{closest:()=>({matches:()=>true})}});},
    surface(el,hidden){el.hidden=hidden;observed.get(el.id)([{type:'attributes'}]);},
    mediaChange(){events.get('media:change')();},
  };
}

test('rightmost cards enter first and typing prevents replay',()=>{
  const ui=boot();ui.flush();
  assert.equal(ui.animations.length,3);
  assert.ok(ui.animations[0].options.delay<ui.animations[2].options.delay);
  ui.input('searchInput');ui.rerender();ui.flush();
  assert.equal(ui.animations.length,3);
  assert.ok(ui.animations.every(x=>x.cancelled));
  ui.nav();ui.rerender();ui.flush();
  assert.equal(ui.animations.length,6);
});

test('reduced-motion cancels in-flight animations and skips new ones',()=>{
  const ui=boot();ui.flush();
  ui.media.matches=true;ui.mediaChange();
  assert.ok(ui.animations.every(x=>x.cancelled));
  ui.nav();ui.rerender();ui.flush();
  assert.equal(ui.animations.length,3);
});

test('rapid surface updates cancel obsolete animations',()=>{
  const ui=boot();ui.flush();
  ui.surface(ui.drawer,false);
  const first=ui.animations.at(-1);
  ui.surface(ui.drawer,false);
  assert.equal(first.cancelled,true);
  const second=ui.animations.at(-1);
  assert.notEqual(first,second);
  ui.surface(ui.drawer,true);
  assert.equal(second.cancelled,true);
});
