# Session Deck UIモーション設計・アニメーション選定計画

- 文書ID: SD-PLAN-MOTION-001
- 版: 0.1 / 策定日: 2026-10-17 JST
- 対象: 現行`index.html` / `styles.css` / `app.js`に対する将来のモーション導入
- 状態: **動作仕様案。本文のアニメーション追加は未実装**
- 関連: [CONCEPT.md](CONCEPT.md) / [REAL_DATA_INGESTION_PLAN.md](REAL_DATA_INGESTION_PLAN.md) / [ROADMAP.md](ROADMAP.md)

## 1. 到達したい操作感

「美しさのための動き」より「状態の変化が一目で分かる動き」を優先する。現行UIはナビ・カード・テーブル・検索・ドロワー・モーダル・トーストが中心で、これらに最小の変化量と短い遅延を与える。利用者の操作には瞬時に反応し、**小気味よいが、待たせず、疲れない**体験を目標とする。

動きの三原則:
1. **反応の速さ**: クリック・タップの直後に押下・選択状態が現れる。
2. **空間的一貫性**: 詳細はカードの近くから、ドロワーは画面右端から、戻る操作は反対方向へ。要素がどこから来たか分かる。
3. **確実性を誇張しない**: 「同期成功」などの演出は実際の確認完了後だけ。`unknown`や`blocked`に過剰な点滅を付けない。

ダッシュボードでは業務情報の判読を優先するため、光量の大きい発光、常時波打つカード、強いパララックス、3D回転、派手なバウンス、スクロールごとの長い再生を採用しない。

## 2. 参照した動きと採否

### 2.1 ユーザー提供の日本語リファレンス

参照: [モーションリファレンス | MOTION MOVEMENT REFERENCE](https://motion-reference.takayustudio.jp/)（2026-10-17閲覧）

| 参照項目 | サイト側の性格（要約） | Session Deckでの採用 |
|---|---|---|
| フェード＋スライド | 透明度と短い並進で出現 | 採用。ページ見出し・カード初回出現を短尺化 |
| スナップイン | 速い到着と停止 | 採用。軽いポップオーバー、件数表示、トースト |
| カスケード表示 | 行ごとの時間差で順次着地 | 採用。作業リスト初回表示 |
| リスト順次表示 | リスト項目が一定差で出現 | 採用。ただし大量行では件数制限 |
| グリッドウェーブ | グリッド上を時間差が伝わる | **変形採用**。右列から左へ、列内だけ小さなずれ |
| 共有要素トランジション | 要素の形状・位置を連続的に扱う | 将来採用。カード→詳細の文脈維持 |
| ホバーリフト | カードの位置と縁がわずかに変化 | PCで限定採用。タッチ端末に依存しない |
| プレスフィードバック | 瞬間的な縮小・影の変化 | 採用。ボタン押下の視覚的フィードバック |
| アコーディオン展開 | 高さと内容の展開 | 採用。詳細情報の折り畳み |
| オーバーシュート / バウンス着地 | 通過や反発の強い動き | 原則不採用。警告・実データには不向き |
| ブラーズーム / グリッチ | ぼかしや色変化を伴う効果 | 不採用。可読性と処理負荷に不利 |

サイト記載のサンプル時間はリファレンスの演出例であり、本UIの推奨時間ではない。以下の時間は**Session Deck向けの暫定設計値**であり、実機計測・利用者評価で修正する。

### 2.2 実装ライブラリ・技術の比較

| 技術 | 主要機能 | 現在のvanilla JSとの相性 | 方針 |
|---|---|---|---|
| CSS transition / keyframes | hover、押下、出現、状態変化 | **最適**。依存ゼロ | **第一候補** |
| Web Animations API（WAAPI） | JS制御、stagger、キャンセル、完了待ち | **良い**。現行renderとの統合が容易 | **第一候補** |
| Motion（JavaScript、mini/hybrid） | `animate`、`stagger`、spring、シーケンス | 良い。導入方法とビルド手順は追加評価 | 複雑な演出が必要になれば比較導入 |
| Anime.js | stagger、タイムライン、レイアウト変更アニメーション | 良い。多対象の制御に強み | グリッド・レイアウト入替PoC候補 |
| GSAP | timeline、複雑なシーケンス、ScrollTrigger | 高機能だが本UIには過剰になりやすい | **現時点で採用しない** |
| View Transition API | ビュー/共有要素の遷移 | 適合性高いがフォールバックとフォーカス制御が必要 | 第二段階で部分採用 |

**決定**: v0.2はCSS＋WAAPIで実装し、初期ロードの追加JSライブラリはゼロ。Motion/Anime.js/GSAPは**参照・比較済みであって導入済みではない**。将来、ネイティブ実装の複雑度が増したときだけ、導入サイズ・ライセンス・更新頻度・CI・通信なしでの動作を実測比較する。

参照: [Motion animate](https://motion.dev/docs/animate)、[Motion stagger](https://motion.dev/docs/stagger)、[Anime.js stagger](https://animejs.com/documentation/utilities/stagger/)、[Anime.js staggered layout](https://animejs.com/documentation/layout/usage/staggered-layout-animation/)、[GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)、[MDN View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)。

## 3. モーショントークン（初期案）

| トークン | ミリ秒 | 役割 | イージング |
|---|---:|---|---|
| `--motion-instant` | 80 | 押下、チェック等 | `ease-out` |
| `--motion-fast` | 130 | ホバー、状態・色変化 | `cubic-bezier(.2,.8,.2,1)` |
| `--motion-normal` | 200 | カード入場、短い展開 | `cubic-bezier(.22,1,.36,1)` |
| `--motion-panel` | 260 | 右ドロワー、モーダル | `cubic-bezier(.2,.8,.2,1)` |
| `--motion-stagger` | 30 | リストの行間 | 時間差 |
| `--motion-column` | 65 | グリッドの列間 | 時間差 |

**最大待ち時間の目安**: 入場演出は初回でも500ms以内に全体が静止、ページ切替でコンテンツは即時読み取り可能。速度や時間差はデザイン案の値で、測定結果ではない。連続操作・大量行表示では動きを短縮・スキップする。

画面一括の長い移動は不要。原則`transform`と`opacity`を優先し、`top/left/width/height`の連続アニメーションや全面の重い`filter: blur`は避ける。`will-change`は常用せず限定的に設定する。

## 4. 具体的な動きの仕様

| ID | 場所・イベント | 演出内容（距離・時間・方向） | 再生条件 |
|---|---|---|---|
| M-01 | ナビゲーション | 旧内容は短いフェード、新内容は`translateY(6px) + opacity 0→1`、150〜190ms | ビュー切替時だけ |
| M-02 | KPIメトリクスカード | 初回だけ`translateY(8px)`＋opacity、180ms、隣を25msずらす | 初回表示、設定で無効化可 |
| M-03 | グリッドのカード | **右列→左列**、各カード`translateX(18px)`＋opacity、240ms。列差65ms、列内ずれ0〜45ms | グリッド初回表示・対象集合の大きな切替 |
| M-04 | 作業リスト | 上から順に`translateY(6px)`＋opacity、180ms、行間30ms（最大6行まで） | 初回/プロジェクト変更時だけ |
| M-05 | カードを開く | カード軽微な押下`scale(.99)`の後、右ドロワーが`translateX(24px)`から260msで入る。背景は淡く変化 | 詳細表示時 |
| M-06 | ドロワーを閉じる | 入場の逆方向へ220ms、Esc/背景クリック/閉じる操作は同じ | 閉じる操作 |
| M-07 | モーダル | `translateY(10px) scale(.985)`→定位置、180〜220ms。背面の変化は120ms | 登録フォーム表示時 |
| M-08 | ボタン | hoverで背景＋縁130ms、押下で`scale(.985)`、80ms。選択状態は即確定 | 利用者操作時 |
| M-09 | ステータス更新 | バッジの色と輪郭を130msで遷移。更新成功トーストを短く入場 | 実際に保存確認後 |
| M-10 | 通信・同期 | 最小待機閾値を超えてから控えめな進捗表示。成功は保存・読戻し後だけ | 将来の実データモード |
| M-11 | 失敗・BLOCKED | 色＋アイコン＋説明文で固定表示。揺れ・連続点滅は禁止 | 取得失敗または権限不足時 |
| M-12 | 検索・絞込み | **入力中は動かさない**。結果件数とリスト更新のみ。確定操作時に短いフェード可 | 入力の各キーでは再生しない |

キーボード入力、リンクのタップ、フォーム送信、フィルター操作はアニメーションの完了を待たずに反応する。操作できない間に「見せるためだけの演出」を挟まない。

## 5. 特別仕様: 右列から入る、列内は少し不規則なグリッド

ユーザー要望: **「右から1列ずつ、列の中ではばらばらに入ってくる」**。

対象例は作業カード/セッションカードのグリッド。DOM順を並べ替えず、**見た目の列だけに時間差**を付ける。読上げ順序、Tab順序、情報のソート条件を動きで変更しない。

初期案:
- 列数は配置されたカードの実測位置から計算。`grid-template-columns`がレスポンシブに変わるので、固定の「3列」と決め打ちしない。
- カードの`getBoundingClientRect().left`を丸めて列番号を得る（RTL言語や横スクロールUIは別途確認）。**右端の列を0**として開始。
- 同一列の各カードには、安定した`session_key`または`work_id`をハッシュして`0〜45ms`のずれを付与。毎回真の乱数を振らない。
- delayは`rightColumnIndex × 65ms + stableJitterMs`。要素数が多いときは最大delayを180msに制限。
- `transform: translateX(18px)`と`opacity: 0`から`240ms`で到達。全カードの終了をおおむね420ms以内に収める。
- 1列のモバイル画面では列波を使わず、上下の小さなカスケード（20〜30ms間隔、表示対象5〜6件まで）。
- ユーザーがすぐクリック/スクロールしたら演出をキャンセルし、即時の最終状態へ移す。
- データ差分による単独カード追加時は、そのカードだけを再生。既存カードを再入場させない。

擬似コード（実装時に実測とアクセシビリティを確認）:

```js
// render 後の「初回のカード集合」に一度だけ呼び出す想定。
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduced) {
  const cards = [...document.querySelectorAll('.work-card')];
  const xs = [...new Set(cards.map(el => Math.round(el.getBoundingClientRect().left)))].sort((a,b)=>b-a);
  cards.forEach(el => {
    const columnFromRight = xs.indexOf(Math.round(el.getBoundingClientRect().left));
    const stableJitter = stableHash(el.dataset.workId || '') % 46;
    el.animate(
      [{ transform:'translateX(18px)', opacity:0 },
       { transform:'translateX(0)', opacity:1 }],
      { duration:240, delay: Math.min(180,columnFromRight*65+stableJitter),
        easing:'cubic-bezier(.22,1,.36,1)', fill:'backwards' }
    );
  });
}
```

実装では`stableHash`を定義するほか、空ID・表示外要素・描画切替・アニメーション終了/キャンセルの処理を加える。上のサンプルは**設計用の擬似コード**で、v0.1に追加済みではない。

## 6. 既存コードに沿った実装順序

現行`app.js`は`render()`で画面DOMを再構築し、検索入力のたびに再描画してフォーカスを戻している。すべての`render()`に出現アニメーションを直付けすると、入力のたびにカードが消えて現れ、操作を妨げる。**最初の修正は描画原因の区別**。

推奨:
1. `render({ reason })`相当のレンダリング要求を`navigation / filter_commit / typing / data_patch / initial`で区別する（互換性のある小さなラッパーから着手）。
2. `typing`は**アニメーションなし**。入力フォーカス・カーソル位置とスクロール位置の維持を優先。
3. `initial`と`navigation`だけカードの短い入場演出を適用。前の演出が残っていれば`cancel()`で停止。
4. ドロワー/モーダルの開閉を`open()`/`close()`に閉じ込め、連打時は状態を先に確定する。フォーカスを開いた先へ移し、閉じたら元へ戻す。
5. グリッドはDOM順を変えず、レイアウト後の`requestAnimationFrame`で列座標を取得。多数の要素では対象を可視域＋上限数に制限する。
6. `prefers-reduced-motion`をCSSだけでなくJSからも参照。途中切替にも対応して再生中アニメーションを`cancel()`する。
7. UI状態と実データ取得状態を分離。通信状態の「成功」とモーション完了を混同しない。

**View Transition API**は新旧ビュー間の位置関係を保つ用途に適するが、全面の写真風クロスフェードは文字読取りを妨げる可能性があるため、v0.2は通常のCSS/WAAPIを優先。`document.startViewTransition`対応時だけ将来試し、非対応端末は即時DOM更新に戻す。

## 7. アクセシビリティ、視認性、安全な状態表示

- `@media (prefers-reduced-motion: reduce)`を既定で尊重し、移動・拡大縮小・staggerを0にする。必要なら状態を一瞬の色変化だけで伝える。
- 完了・失敗・未確認は色だけに依存させず、アイコン、文字、スクリーンリーダー用の適切なテキストを持つ。
- トースト`role=status`は短く、同一イベントを何度も読み上げない。
- 動画・無限ループ・自動点滅を標準搭載しない。
- focus-visibleを消さず、モーダルはフォーカス移動・復帰を検証。Escで閉じても情報は失われない。
- 入場アニメーション待機中にカードが非表示/クリック不能のまま放置されないよう、JS例外時は静止の完成画面を表示する。
- 高コントラスト/拡大文字/320px画面でもカードの重なりや文字切れを発生させない。
- 稼働・同期・成功の意味はデータ層の根拠に従い、アニメーションは証拠を代替しない。

参照: [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion)、[web.dev アニメーション性能](https://web.dev/articles/animations-guide)。

## 8. 性能予算と検証方法

以下は**採用前の目標案**。実機計測済み数値ではない。

- モーションの対象は`transform`/`opacity`を優先し、古い端末でレイアウトやスクロールを妨げない。
- 目標: PCとiPhoneの代表環境で主要な入場アニメーションを滑らかに表示。60Hz端末なら各フレーム約16.7msを目安に観察し、長い処理を避ける。
- 画面初期表示、100Work/500Sessionの架空負荷、絞込み連打、引継ぎ画面切替、モーダル開閉をそれぞれプロファイルする。
- DevTools Performanceで長いスタイル計算、レイアウト、ペイント、タスクを観測し、変更前後を比較。静止画と動画の比較だけで「高速化成功」としない。
- 重い端末／省電力／アニメーション低減設定／非対応ブラウザで機能が同じく使えるか確かめる。
- 外部ライブラリ導入を検討する場合、圧縮転送サイズ、依存、初回表示、キャッシュ、ライセンスを実測し、ネイティブ案と比較してから採用。
- 過度な`will-change`や大量の同時`box-shadow`変更を避ける。長いリストでは仮想化や件数制限を先に検討。

## 9. 動作テストと受入条件

| ID | 試験 | 完了条件 |
|---|---|---|
| MOT-01 | ナビ4画面 | クリック後即時に内容が切替、入力可能、視覚的な違和感なし |
| MOT-02 | 右→左グリッド | 列単位の大まかな順序は右→左、列内は安定した短いずれ、全体の静止まで500ms以内 |
| MOT-03 | 1列/2列/3列 | iPhone/タブレット/PCで破綻なく再配置 |
| MOT-04 | 検索50文字の連続入力 | キーごとに出現アニメなし、フォーカス・カーソル・入力が維持 |
| MOT-05 | ドロワー連打とEsc | 表示崩れ、背景への残存、フォーカス喪失なし |
| MOT-06 | モーダル操作 | キーボード、タッチ、読み上げで開閉・入力・保存が可能 |
| MOT-07 | reduced-motion | 登場アニメなし、状態変化と機能は完全に使用可能 |
| MOT-08 | JS無効・animation例外 | できる範囲で静止最終状態へフォールバック。重要操作を隠さない |
| MOT-09 | 100Work/500Session負荷 | 測定ログを保存し、スムーズさ・初期描画への影響を確認 |
| MOT-10 | 稼働/同期/失敗表示 | 実データ根拠がない演出による虚偽の完了表示ゼロ |
| MOT-11 | 回帰 | JSON保存、命名、作業登録、リストの検索/絞込みを壊さない |
| MOT-12 | タッチ操作とホバー | hover依存の要素がなく、押下反応と文字の可読性を維持 |

映像証跡: PC幅1366px、iPhone想定幅390pxと320px、`prefers-reduced-motion` ON/OFF、操作連打を記録。実機操作が未実施の場合は未確認と記載する。

## 10. 実装タスクと推奨順

| ID | タスク | 変更対象 | 条件・依存 |
|---|---|---|---|
| MOT-P0 | モーショントークンと再生許可ポリシー | `styles.css`/JS補助関数 | DOM再描画の原因を区別 |
| MOT-P1 | ボタン/カードの即時フィードバック | `styles.css` | reduced-motion＋キーボード確認 |
| MOT-P2 | ドロワー・モーダルの入退場 | `app.js`＋CSS | 連打、Esc、フォーカス復帰試験 |
| MOT-P3 | **右→左グリッド**とカスケード | `app.js`＋CSS | 一覧レンダリング制御、レスポンシブ確認 |
| MOT-P4 | ナビ切替とデータ更新のミクロ反応 | `app.js` | 入力時・大量更新で再生しない |
| MOT-P5 | 実データ接続時の状態モーション | UI/データ状態境界 | REAL_DATA_INGESTION_PLANの状態契約が前提 |
| MOT-P6 | View Transition / Motion / Anime比較PoC | 独立PoCブランチ | 必要性、ビルド、サイズ、アクセシビリティ実測後のみ |

順序: MOT-P0→MOT-P1→MOT-P2→MOT-P3→MOT-P4。MOT-P5は実データ取り込みの`DATA-08`以降、MOT-P6はネイティブ実装の限界が明確になった場合に限る。

## 11. 他のページ・作業との関係

- リポジトリの静的PagesワークフローはUIの3ファイルだけをデプロイする。本書だけの更新ではUIは変わらない。
- アニメーション導入は実データ取り込みと独立した変更セットにする。同じブランチ・同じ作業IDの無秩序な並行更新を避ける。
- TradingSystem既存のCI、Hooks、注文モード、証券関連の権限に影響を及ぼさない。
- 本計画の時間・速度はユーザー検証前の値。設計変更を行った場合は効果と回帰結果を残す。

## 12. 参照リンク集

- 日本語モーションリファレンス: https://motion-reference.takayustudio.jp/
- Motion JavaScript animate: https://motion.dev/docs/animate
- Motion stagger: https://motion.dev/docs/stagger
- Motion スプリング: https://motion.dev/docs/spring
- Anime.js stagger: https://animejs.com/documentation/utilities/stagger/
- Anime.js Layout stagger: https://animejs.com/documentation/layout/usage/staggered-layout-animation/
- GSAP ScrollTrigger: https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- MDN Web Animations API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API
- MDN View Transition API: https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API
- MDN Reduced motion: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion
- web.dev パフォーマンス: https://web.dev/articles/animations-guide

**本書は選定・実装・テストの計画書であり、現在の公開UIにアニメーションを追加した証明ではない。**
