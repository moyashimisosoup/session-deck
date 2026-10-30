# MOT-CUSTOM-001｜右端の列から、列内はばらばらにスライドイン

状態：**original**（外部サイトのコード・解説を転載していない独立実装レシピ）。

## ねらい

長方形または正方形のタイルをグリッドで並べる。**右端の列から1列ずつ順に進行**し、**各列の中では上から順番ではなくランダム順**に登場させる。「1列を完全表示してから次列へ」も切替可能だが、初期値では列ごとに着手時間をずらす。

- 各タイルの開始状態：`translateX(52px) scale(.94)`、opacity 0。
- 終端状態：`translateX(0) scale(1)`、opacity 1。出現後は動かさない。
- タイル本体の標準duration：460ms、`cubic-bezier(.22,1,.36,1)`。
- 右端列から左方向に、列開始を180msずつずらす。
- 列内は固定シードのFisher–Yatesシャッフルにより、タイルの順番を入れ替える。
- 列内の各タイルは順序によって40msずつ登場を遅らせる。
- 視覚順序を変えてもDOMの読み上げ順序やフォーカス順序は変更しない。
- `prefers-reduced-motion: reduce` では即座に最終状態を表示する。

## ブラウザ向け独立実装サンプル

DOMに `data-col="0"` のような列番号と `data-row="0"` のような行番号を持つセルを置く。列0を左端とする。

```js
function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function animateGridFromRight(root, seed = 42) {
  const tiles = [...root.querySelectorAll('[data-col][data-row]')];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    for (const tile of tiles) {
      tile.getAnimations().forEach(a => a.cancel());
      tile.style.opacity = '1';
      tile.style.transform = 'none';
    }
    return;
  }
  const columns = [...new Set(tiles.map(t => Number(t.dataset.col)))].sort((a,b)=>b-a);
  const rng = mulberry32(seed);
  const jobs = [];
  columns.forEach((col, colIndex) => {
    const group = tiles.filter(t => Number(t.dataset.col) === col)
      .sort((a,b)=>Number(a.dataset.row)-Number(b.dataset.row));
    for (let i = group.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [group[i], group[j]] = [group[j], group[i]];
    }
    group.forEach((tile, order) => jobs.push({tile,delay:colIndex * 180 + order * 40}));
  });
  for (const {tile,delay} of jobs) {
    tile.animate(
      [{transform:'translateX(52px) scale(.94)',opacity:0},
       {transform:'translateX(0) scale(1)',opacity:1}],
      {duration:460,delay,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'}
    );
  }
}
```

**実装メモ**：`fill:'both'` のWeb Animationsは再描画・再実行時に古いアニメーションが残り得る。再生し直す前には `tile.getAnimations().forEach(a=>a.cancel())` を行い、完了時の最終状態を維持したいときは `animation.finished.then(...)` または固定のクラス適用を検討する。実際のDOMでのE2E試験は未実施。

## テストすべきこと

1. 最初に右端の列が動くこと。
2. 同じ列内は行番号順に限定されず、seedが同じなら再生順が変わらないこと。
3. 画面リサイズ、再実行、タイル増減時に空白が残らないこと。
4. reduced-motionで初期状態のまま隠れないこと。
5. keyboard/tab順はレイアウトの意味に沿っていること。

参照したモーションの**分類**は [MOT-0002](./MOT-0002_TAKAYU_REFERENCE.md)の「グリッドウェーブ」「カスケード表示」「シャッフル整列」。そこから独立して設計した複合パターンであり、原サイトのコードの複製ではない。
