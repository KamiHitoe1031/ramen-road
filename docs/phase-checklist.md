# 実装フェーズチェックリスト

## Phase 1: MVP（ローカル1人プレイ）

サーバー不要。`npx http-server public` で動作。

### 基盤
- [x] index.html（Phaser CDN読み込み）
- [x] style.css（body margin:0, 中央配置）
- [x] main.js（Phaser設定・シーン登録）
- [x] BootScene.js / PreloadScene.js
- [x] constants.js（ゲーム定数）
- [x] ローカルサーバーで動作確認

### 盛り付け画面（★最重要）
- [x] PlacementScene.js
- [x] 3×3グリッド描画（Graphics矩形）
- [x] 丼背景（色付き円形プレースホルダー）
- [x] 具材カード表示（色付き矩形＋テキスト）
- [x] ドラッグ＆ドロップでグリッドに配置
- [x] グリッドから取り外し
- [x] 「完成！」ボタン

### 選択画面
- [x] SoupNoodleScene.js（スープ4択→麺3択）
- [x] 手札表示（ランダム9枚、ドラフトなし）

### 採点エンジン
- [x] scoringEngine.js（utils/）
- [x] L1: スープ×麺相性
- [x] L1: 彩りボーナス
- [x] L1: 隣接Good/Bad
- [x] L1: 中央ボーナス
- [x] L1: 同具材ペナルティ
- [x] L2: キャラボーナス
- [x] L3: お客さんボーナス
- [x] L4: 称号判定

### 結果表示
- [x] ScoringScene.js（L1-3内訳表示）
- [x] CeremonyScene.js（称号演出）
- [x] ResultScene.js（最終スコア＋「もう一杯！」）

### フロー接続
- [x] タイトル→スープ→麺→手札→盛り付け→採点→称号→結果→ループ

---

## Phase 2: ドラフト＋AI対戦

### キャラ選択
- [x] CharSelectScene.js
- [x] 6キャラ表示＋ボーナスプレビュー
- [x] AI3体にランダム割り当て

### お客さんカード
- [x] ランダム2人選出
- [x] カード表示UI

### ドラフト
- [x] cardPool.js（カードプール生成・シャッフル）
- [x] 寿司ゴー方式ロジック（手札配布→選択→左隣へ→9巡）
- [x] DraftScene.js
- [x] AI選択ロジック
- [x] ラウンドカウンター

### タイマー
- [x] 各フェーズ制限時間
- [x] タイムアウト自動選択
- [x] 残り5秒警告

### 対戦結果
- [x] AI3体の盛り付け自動生成
- [x] 全4人スコア計算＆ランキング

---

## Phase 3: オンライン対戦

### サーバー
- [x] server/index.js（Express + Socket.io）
- [x] publicを静的配信
- [x] 環境変数対応

### ルーム管理
- [x] server/gameManager.js
- [x] ルーム作成（6文字コード）
- [x] ルーム参加・退出
- [x] ホスト判定

### クライアント通信
- [x] socketClient.js
- [x] LobbyScene.js
- [x] WaitingScene.js

### ロジックのサーバー移行
- [x] server/gameLogic.js（ステートマシン）
- [x] server/scoringEngine.js
- [x] server/cardPool.js
- [x] クライアントは表示のみに変更

### デプロイ
- [ ] Railway プロジェクト作成
- [ ] 環境変数設定
- [ ] デプロイ＆動作確認
- [ ] GitHub連携自動デプロイ

---

## Phase 4: ポリッシュ

### アセット
- [x] Gemini 3.0 Proで全画像生成＆差し替え
- [x] ElevenLabs APIで効果音10種生成
- [ ] BGM4曲生成＆組み込み（スクリプト作成済み、要実行）

### 演出
- [x] カード配布アニメ
- [x] 盛り付け「ポトン」アニメ
- [x] 採点カウントアップ
- [x] 称号ドラムロール
- [x] 1位紙吹雪パーティクル

### UX
- [x] 盛り付け中リアルタイムスコアプレビュー
- [ ] モバイルタッチ最適化
- [x] 切断→再接続処理
