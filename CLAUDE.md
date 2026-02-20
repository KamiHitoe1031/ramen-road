# 🍜 らーめん道 ～至高の一杯～

## プロジェクト概要

3-4人オンライン対戦のドラフト式ボードゲーム。
具材を取り合い → 3×3の丼に盛り付け → 味と芸術点で勝負する。

**重要: 実装前に必ず `docs/` 配下のドキュメントを読むこと。**

| ドキュメント | 内容 |
|-------------|------|
| `docs/game-design.md` | ゲーム全体のルール・フロー・UI設計 |
| `docs/scoring-system.md` | 4レイヤー採点の具体的な計算仕様 |
| `docs/network-protocol.md` | Socket.io通信イベント仕様 |
| `docs/asset-guide.md` | 画像・音声アセットの仕様とファイル名 |
| `docs/phase-checklist.md` | 実装フェーズごとのチェックリスト |

---

## 技術スタック

| 用途 | 技術 |
|------|------|
| クライアント | **Phaser 3.80**（CDN読み込み、ビルドツールなし） |
| サーバー | **Node.js + Express + Socket.io** |
| デプロイ | **Railway**（`railway.toml` 設定済み） |
| バージョン管理 | **Git + GitHub** |
| 効果音 | **ElevenLabs Sound Effects API**（Phase 4） |
| 画像生成 | **Gemini 3.0 Pro / NanoBanana Pro**（Phase 4） |
| 背景削除 | **Adobe Photoshop「背景を削除」のみ**（他ツール禁止※ユーザー許可時のみ例外） |

---

## ディレクトリ構造

```
ramen-road/
├── CLAUDE.md              ← このファイル
├── package.json
├── railway.toml
├── .gitignore
├── .env.example
│
├── server/                ← Phase 3で実装
│   ├── index.js           # Express + Socket.io
│   ├── gameManager.js     # ルーム管理
│   ├── gameLogic.js       # ゲーム進行ステートマシン
│   ├── scoringEngine.js   # 採点エンジン（サーバー版）
│   └── cardPool.js        # カードプール生成
│
├── public/                ← Express.staticで配信
│   ├── index.html
│   ├── css/style.css
│   ├── js/
│   │   ├── main.js        # Phaser設定・起動
│   │   ├── scenes/
│   │   │   ├── BootScene.js
│   │   │   ├── PreloadScene.js
│   │   │   ├── LobbyScene.js      # Phase 3
│   │   │   ├── WaitingScene.js     # Phase 3
│   │   │   ├── CharSelectScene.js  # Phase 2
│   │   │   ├── SoupNoodleScene.js
│   │   │   ├── DraftScene.js       # Phase 2
│   │   │   ├── PlacementScene.js   # ★最重要
│   │   │   ├── ScoringScene.js
│   │   │   ├── CeremonyScene.js
│   │   │   └── ResultScene.js
│   │   └── utils/
│   │       ├── scoringEngine.js  # 採点エンジン（クライアント版）
│   │       ├── socketClient.js   # Phase 3
│   │       └── constants.js
│   └── assets/
│       ├── data/          # JSONデータ（data/からコピー）
│       ├── images/        # 画像アセット
│       └── audio/         # 音声アセット
│
├── data/                  ← マスターデータ（JSONソース）
│   ├── ingredients.json   # 具材18種
│   ├── soups.json         # スープ4種
│   ├── noodles.json       # 麺3種
│   ├── characters.json    # キャラ6人
│   ├── customers.json     # お客さん10人
│   ├── scoring.json       # 採点ルール
│   └── titles.json        # 称号
│
└── docs/                  ← 設計ドキュメント
```

---

## 実装フェーズ（順番厳守）

### Phase 1: MVP（ローカル1人プレイ）
**サーバー不要。`npx http-server public` で動作。**
- プレースホルダーアセット（色付き矩形+テキスト）でUI構築
- 3×3グリッドのドラッグ＆ドロップ盛り付け
- JSONデータ読み込み
- 4レイヤー採点エンジン
- スープ選択→麺選択→手札配布（ランダム9枚）→盛り付け→採点→結果

### Phase 2: ドラフト＋AI対戦
- 寿司ゴー方式ドラフト（手札→1枚選択→残りを左隣へ）
- ダミーAI 3体
- キャラ選択、お客さんカード、タイマー

### Phase 3: オンライン対戦
- Node.js + Express + Socket.io サーバー
- ルーム作成/参加（ルームコード方式）
- 全ゲームロジックをサーバー側に移行
- Railway デプロイ

### Phase 4: ポリッシュ
- NanoBanana Pro で本番画像生成・差し替え
- ElevenLabs API で効果音生成・組み込み
- アニメーション演出、モバイル対応

**詳細なチェックリスト → `docs/phase-checklist.md`**

---

## コーディング規約

- **JavaScript ES6+**（TypeScript不使用）
- Phaser 3 は CDN 読み込み
- 1ファイル1シーン
- 定数は `constants.js` に集約
- マジックナンバー禁止（JSON or constants から取得）
- **Phase 1-2**: クライアント側で全ロジック仮実装
- **Phase 3**: ゲームロジックをサーバーに移行、クライアントは表示のみ

## アセットキー命名規則

```
キャラクター: char_{id}      例: char_kenji
お客さん:     customer_{id}   例: customer_takeshi
具材:         ing_{id}        例: ing_chashu
スープ丼:     bowl_{id}       例: bowl_tonkotsu
UI:           ui_{name}       例: ui_btn_start
BGM:          bgm_{scene}     例: bgm_draft
SE:           sfx_{action}    例: sfx_card_pick
```

## ⚠️ アセット制作ルール

### 背景削除は Photoshop 限定（厳守）
AI画像生成で出力した画像の背景削除には **Adobe Photoshopの「背景を削除」機能のみ** を使用する。
- remove.bg、Rembg 等の他ツールは **ユーザーの明示的な許可なしに使用禁止**
- 理由: 他ツールはエッジ処理のクオリティが低い
- Claude Code がスクリプトで自動背景削除を行うことも **禁止**（必ずユーザーに確認）
- 詳細は `docs/asset-guide.md` を参照

## Git 運用

```bash
# 初期設定
git init
git remote add origin https://github.com/YOUR_USER/ramen-road.git

# 作業の流れ
git add -A
git commit -m "Phase 1: 盛り付け画面のドラッグ＆ドロップ実装"
git push origin main

# Railway は main ブランチへの push で自動デプロイ
```

## Railway デプロイ

1. Railway ダッシュボードで New Project → Deploy from GitHub repo
2. 環境変数に `PORT` を設定（Railway が自動付与）
3. `railway.toml` が自動検出される
4. main ブランチへの push で自動デプロイ
