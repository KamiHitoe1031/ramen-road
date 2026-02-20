# 🎨 アセット制作ガイド

## アートスタイル

**ゆるい手描き風・絵本風**。太めの輪郭線、パステル色、フラット寄り。

---

## ⚠️ 背景削除のルール（重要）

**基本: Adobe Photoshopの「背景を削除」機能を使用する。**

AI画像生成で出力された画像に背景がある場合:

1. Photoshopで画像を開く
2. 下部ツールバーの **「背景を削除」** ボタンをクリック
3. 必要に応じて「被写体を選択」で微調整
4. PNG（透過）で書き出し

**禁止事項:**
- remove.bg、Rembg、その他の背景削除ツール/サービスは **ユーザーの明示的な許可なしに使用禁止**
- 理由: Photoshop以外のツールはエッジ処理のクオリティが低い
- Claude Codeが自動処理スクリプトで背景削除する場合も、必ずユーザーに確認を取ること

**例外:** ユーザーが明示的に他ツールを指示した場合のみ許可

---

## 画像生成: Gemini 3.0 Pro / NanoBanana Pro

### 共通プロンプトテンプレート

```
A cute, hand-drawn storybook illustration style [対象],
soft pastel colors, thick gentle outlines, flat shading,
transparent background, centered, game asset
```

---

## 画像アセット一覧

### キャラクター（6体）128×128px PNG透過

| ファイル | キー | 説明 |
|---------|------|------|
| `characters/char_kenji.png` | `char_kenji` | 白い鉢巻の元気な若い男性 |
| `characters/char_yuki.png` | `char_yuki` | もこもこニット帽の女性 |
| `characters/char_gen.png` | `char_gen` | 渋い高齢男性、丸眼鏡 |
| `characters/char_aya.png` | `char_aya` | ベレー帽の若い女性 |
| `characters/char_ryou.png` | `char_ryou` | バンダナの漁師風男性 |
| `characters/char_hana.png` | `char_hana` | ふくよかなおばあちゃん |

### お客さん（10人）96×96px PNG透過

| ファイル | キー | 説明 |
|---------|------|------|
| `customers/customer_takeshi.png` | `customer_takeshi` | ヘルメット・作業着の男性 |
| `customers/customer_sakura.png` | `customer_sakura` | スマホを持つおしゃれ女性 |
| `customers/customer_kouta.png` | `customer_kouta` | パーカーの青年 |
| `customers/customer_miho.png` | `customer_miho` | ノートを持つ眼鏡の女性 |
| `customers/customer_mike.png` | `customer_mike` | バックパックの外国人男性 |
| `customers/customer_yoshiko.png` | `customer_yoshiko` | 和服のおばあちゃん |
| `customers/customer_daisuke.png` | `customer_daisuke` | 腕組み中年男性 |
| `customers/customer_aoi.png` | `customer_aoi` | 赤ちゃんを抱いた女性 |
| `customers/customer_shinji.png` | `customer_shinji` | ネクタイ緩めた疲れた男性 |
| `customers/customer_rei.png` | `customer_rei` | 上品なスーツの女性 |

### 具材（18種）64×64px PNG透過

| ファイル | キー | 色 | 見た目 |
|---------|------|-----|--------|
| `ingredients/ing_chashu.png` | `ing_chashu` | 茶 | 丸い豚肉スライス |
| `ingredients/ing_kakuni.png` | `ing_kakuni` | 茶 | 四角い煮豚 |
| `ingredients/ing_tori_chashu.png` | `ing_tori_chashu` | 白 | 白い鶏肉スライス |
| `ingredients/ing_nitamago.png` | `ing_nitamago` | 黄 | 半切り煮たまご |
| `ingredients/ing_negi.png` | `ing_negi` | 緑 | 小口切りネギ |
| `ingredients/ing_menma.png` | `ing_menma` | 茶 | 細長いメンマ |
| `ingredients/ing_moyashi.png` | `ing_moyashi` | 白 | 山盛りもやし |
| `ingredients/ing_corn.png` | `ing_corn` | 黄 | つぶつぶコーン |
| `ingredients/ing_horenso.png` | `ing_horenso` | 緑 | ほうれん草の葉 |
| `ingredients/ing_nori.png` | `ing_nori` | 黒 | 四角い海苔 |
| `ingredients/ing_wakame.png` | `ing_wakame` | 緑 | 海藻わかめ |
| `ingredients/ing_naruto.png` | `ing_naruto` | ピンク | 渦巻きナルト |
| `ingredients/ing_ebi.png` | `ing_ebi` | 赤 | 丸まったえび |
| `ingredients/ing_benishoga.png` | `ing_benishoga` | 赤 | 紅しょうが |
| `ingredients/ing_butter.png` | `ing_butter` | 黄 | 四角いバター |
| `ingredients/ing_ninniku.png` | `ing_ninniku` | 白 | みじん切りにんにく |
| `ingredients/ing_karamiso.png` | `ing_karamiso` | 赤 | 辛味噌の塊 |
| `ingredients/ing_shirogoma.png` | `ing_shirogoma` | 白 | 白い粒々 |

### 丼（5種）256×256px PNG透過

| ファイル | キー | 説明 |
|---------|------|------|
| `soup/bowl_tonkotsu.png` | `bowl_tonkotsu` | 白濁スープ丼（上面図） |
| `soup/bowl_shoyu.png` | `bowl_shoyu` | 茶色スープ丼 |
| `soup/bowl_miso.png` | `bowl_miso` | 黄色スープ丼 |
| `soup/bowl_shio.png` | `bowl_shio` | 透明スープ丼 |
| `soup/bowl_empty.png` | `bowl_empty` | スープなし丼 |

### 背景・UI

| ファイル | キー | サイズ | 説明 |
|---------|------|--------|------|
| `backgrounds/bg_table.png` | `bg_table` | 800×600 | 木目テーブル |
| `ui/ui_btn_large.png` | `ui_btn_large` | 200×60 | 大ボタン |
| `ui/ui_btn_small.png` | `ui_btn_small` | 120×40 | 小ボタン |
| `ui/ui_card_back.png` | `ui_card_back` | 80×112 | カード裏面 |

---

## 効果音: ElevenLabs Sound Effects API

```bash
curl -X POST "https://api.elevenlabs.io/v1/sound-generation" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "text": "[prompt]", "duration_seconds": [sec] }' \
  --output [file]
```

| ファイル | キー | プロンプト | 秒 |
|---------|------|-----------|-----|
| `sfx/sfx_card_pick.mp3` | `sfx_card_pick` | short satisfying card picking sound | 0.5 |
| `sfx/sfx_card_pass.mp3` | `sfx_card_pass` | cards shuffling and sliding sound | 1.0 |
| `sfx/sfx_place.mp3` | `sfx_place` | soft plop, food placed in bowl | 0.5 |
| `sfx/sfx_remove.mp3` | `sfx_remove` | quick whoosh, light removal | 0.3 |
| `sfx/sfx_bonus.mp3` | `sfx_bonus` | sparkle chime, positive feedback | 0.8 |
| `sfx/sfx_score_tick.mp3` | `sfx_score_tick` | score counter ticking up | 0.2 |
| `sfx/sfx_title_reveal.mp3` | `sfx_title_reveal` | dramatic fanfare reveal | 1.5 |
| `sfx/sfx_winner.mp3` | `sfx_winner` | celebration confetti and cheers | 2.0 |
| `sfx/sfx_timer_warn.mp3` | `sfx_timer_warn` | clock ticking urgency | 1.0 |
| `sfx/sfx_click.mp3` | `sfx_click` | UI button click | 0.2 |

---

## BGM（フリー素材）

OGG形式推奨（ループギャップ防止）。

| ファイル | キー | 推奨ソース |
|---------|------|-----------|
| `bgm/bgm_lobby.ogg` | `bgm_lobby` | DOVA-SYNDROME / 魔王魂 |
| `bgm/bgm_draft.ogg` | `bgm_draft` | DOVA-SYNDROME |
| `bgm/bgm_placement.ogg` | `bgm_placement` | 甘茶の音楽工房 |
| `bgm/bgm_result.ogg` | `bgm_result` | 魔王魂 |
