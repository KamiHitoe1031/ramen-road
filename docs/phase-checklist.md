# 実装フェーズチェックリスト

## Phase 1: MVP（ローカル1人プレイ）

サーバー不要。`npx http-server public` で動作。

### 基盤
- [ ] index.html（Phaser CDN読み込み）
- [ ] style.css（body margin:0, 中央配置）
- [ ] main.js（Phaser設定・シーン登録）
- [ ] BootScene.js / PreloadScene.js
- [ ] constants.js（ゲーム定数）
- [ ] ローカルサーバーで動作確認

### 盛り付け画面（★最重要）
- [ ] PlacementScene.js
- [ ] 3×3グリッド描画（Graphics矩形）
- [ ] 丼背景（色付き円形プレースホルダー）
- [ ] 具材カード表示（色付き矩形＋テキスト）
- [ ] ドラッグ＆ドロップでグリッドに配置
- [ ] グリッドから取り外し
- [ ] 「完成！」ボタン

### 選択画面
- [ ] SoupNoodleScene.js（スープ4択→麺3択）
- [ ] 手札表示（ランダム9枚、ドラフトなし）

### 採点エンジン
- [ ] scoringEngine.js（utils/）
- [ ] L1: スープ×麺相性
- [ ] L1: 彩りボーナス
- [ ] L1: 隣接Good/Bad
- [ ] L1: 中央ボーナス
- [ ] L1: 同具材ペナルティ
- [ ] L2: キャラボーナス
- [ ] L3: お客さんボーナス
- [ ] L4: 称号判定

### 結果表示
- [ ] ScoringScene.js（L1-3内訳表示）
- [ ] CeremonyScene.js（称号演出）
- [ ] ResultScene.js（最終スコア＋「もう一杯！」）

### フロー接続
- [ ] タイトル→スープ→麺→手札→盛り付け→採点→称号→結果→ループ

---

## Phase 2: ドラフト＋AI対戦

### キャラ選択
- [ ] CharSelectScene.js
- [ ] 6キャラ表示＋ボーナスプレビュー
- [ ] AI3体にランダム割り当て

### お客さんカード
- [ ] ランダム2人選出
- [ ] カード表示UI

### ドラフト
- [ ] cardPool.js（カードプール生成・シャッフル）
- [ ] 寿司ゴー方式ロジック（手札配布→選択→左隣へ→9巡）
- [ ] DraftScene.js
- [ ] AI選択ロジック
- [ ] ラウンドカウンター

### タイマー
- [ ] 各フェーズ制限時間
- [ ] タイムアウト自動選択
- [ ] 残り5秒警告

### 対戦結果
- [ ] AI3体の盛り付け自動生成
- [ ] 全4人スコア計算＆ランキング

---

## Phase 3: オンライン対戦

### サーバー
- [ ] server/index.js（Express + Socket.io）
- [ ] publicを静的配信
- [ ] 環境変数対応

### ルーム管理
- [ ] server/gameManager.js
- [ ] ルーム作成（6文字コード）
- [ ] ルーム参加・退出
- [ ] ホスト判定

### クライアント通信
- [ ] socketClient.js
- [ ] LobbyScene.js
- [ ] WaitingScene.js

### ロジックのサーバー移行
- [ ] server/gameLogic.js（ステートマシン）
- [ ] server/scoringEngine.js
- [ ] server/cardPool.js
- [ ] クライアントは表示のみに変更

### デプロイ
- [ ] Railway プロジェクト作成
- [ ] 環境変数設定
- [ ] デプロイ＆動作確認
- [ ] GitHub連携自動デプロイ

---

## Phase 4: ポリッシュ

### アセット
- [ ] NanoBanana Proで全画像生成＆差し替え
- [ ] ElevenLabs APIで効果音10種生成
- [ ] フリーBGM選定＆組み込み

### 演出
- [ ] カード配布アニメ
- [ ] 盛り付け「ポトン」アニメ
- [ ] 採点カウントアップ
- [ ] 称号ドラムロール
- [ ] 1位紙吹雪パーティクル

### UX
- [ ] 盛り付け中リアルタイムスコアプレビュー
- [ ] モバイルタッチ最適化
- [ ] 切断→再接続処理
