/**
 * Gemini API を使った画像アセット一括生成スクリプト
 * Usage: node scripts/generate-assets.js
 */
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error('ERROR: 環境変数 GEMINI_API_KEY を設定してください'); process.exit(1); }
const MODEL = 'gemini-3-pro-image-preview';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const BASE_DIR = path.join(__dirname, '..', 'public', 'assets', 'images');

const STYLE = 'A cute, hand-drawn storybook illustration style';
const SUFFIX = 'soft pastel colors, thick gentle outlines, flat shading, transparent background, centered, game asset, no text, no watermark';

// ========== アセット定義 ==========

const INGREDIENTS = [
    { file: 'ingredients/ing_chashu.png', prompt: `${STYLE} round sliced pork chashu for ramen topping, brown juicy meat with char marks, top-down view, ${SUFFIX}, 64x64 pixel art size` },
    { file: 'ingredients/ing_kakuni.png', prompt: `${STYLE} square braised pork belly kakuni, dark brown glazed cube of meat, top-down view, ${SUFFIX}, 64x64 pixel art size` },
    { file: 'ingredients/ing_tori_chashu.png', prompt: `${STYLE} sliced white chicken chashu for ramen, pale pink and white poultry slice, top-down view, ${SUFFIX}, 64x64 pixel art size` },
    { file: 'ingredients/ing_nitamago.png', prompt: `${STYLE} halved soft-boiled ramen egg (ajitama), golden yolk visible, top-down view, ${SUFFIX}, 64x64 pixel art size` },
    { file: 'ingredients/ing_negi.png', prompt: `${STYLE} chopped green onion (negi) for ramen, small green rings scattered, top-down view, ${SUFFIX}, 64x64 pixel art size` },
    { file: 'ingredients/ing_menma.png', prompt: `${STYLE} bamboo shoot strips (menma) for ramen, thin brown-yellow strips, top-down view, ${SUFFIX}, 64x64 pixel art size` },
    { file: 'ingredients/ing_moyashi.png', prompt: `${STYLE} pile of bean sprouts (moyashi) for ramen, white crunchy sprouts, top-down view, ${SUFFIX}, 64x64 pixel art size` },
    { file: 'ingredients/ing_corn.png', prompt: `${STYLE} sweet corn kernels for ramen topping, bright yellow kernels in a small pile, top-down view, ${SUFFIX}, 64x64 pixel art size` },
    { file: 'ingredients/ing_horenso.png', prompt: `${STYLE} cooked spinach (horenso) leaves for ramen, dark green wilted leaves, top-down view, ${SUFFIX}, 64x64 pixel art size` },
    { file: 'ingredients/ing_nori.png', prompt: `${STYLE} square sheet of nori seaweed for ramen, dark black-green rectangle, top-down view, ${SUFFIX}, 64x64 pixel art size` },
    { file: 'ingredients/ing_wakame.png', prompt: `${STYLE} wakame seaweed for ramen, wavy dark green seaweed pieces, top-down view, ${SUFFIX}, 64x64 pixel art size` },
    { file: 'ingredients/ing_naruto.png', prompt: `${STYLE} naruto fish cake (narutomaki) slice, white with pink swirl pattern, circular, top-down view, ${SUFFIX}, 64x64 pixel art size` },
    { file: 'ingredients/ing_ebi.png', prompt: `${STYLE} curled shrimp (ebi) for ramen, pink-red cooked shrimp, top-down view, ${SUFFIX}, 64x64 pixel art size` },
    { file: 'ingredients/ing_benishoga.png', prompt: `${STYLE} pickled red ginger (beni shoga) for ramen, bright red thin strips, top-down view, ${SUFFIX}, 64x64 pixel art size` },
    { file: 'ingredients/ing_butter.png', prompt: `${STYLE} square pat of butter for ramen, pale yellow cube melting slightly, top-down view, ${SUFFIX}, 64x64 pixel art size` },
    { file: 'ingredients/ing_ninniku.png', prompt: `${STYLE} minced garlic (ninniku) for ramen, small white chopped pieces, top-down view, ${SUFFIX}, 64x64 pixel art size` },
    { file: 'ingredients/ing_karamiso.png', prompt: `${STYLE} spicy miso paste (karamiso) dollop for ramen, red-brown paste blob, top-down view, ${SUFFIX}, 64x64 pixel art size` },
    { file: 'ingredients/ing_shirogoma.png', prompt: `${STYLE} white sesame seeds (shirogoma) sprinkled, tiny white dots scattered, top-down view, ${SUFFIX}, 64x64 pixel art size` },
];

const CHARACTERS = [
    { file: 'characters/char_kenji.png', prompt: `${STYLE} portrait of a young energetic Japanese man with a white headband (hachimaki), confident smile, ramen chef, bust shot, ${SUFFIX}, 128x128` },
    { file: 'characters/char_yuki.png', prompt: `${STYLE} portrait of a young Japanese woman wearing a fluffy knit beanie hat, warm smile, Sapporo winter style, bust shot, ${SUFFIX}, 128x128` },
    { file: 'characters/char_gen.png', prompt: `${STYLE} portrait of a wise elderly Japanese man with round glasses, calm expression, old ramen master, bust shot, ${SUFFIX}, 128x128` },
    { file: 'characters/char_aya.png', prompt: `${STYLE} portrait of a young creative Japanese woman wearing a beret, artistic and trendy look, bust shot, ${SUFFIX}, 128x128` },
    { file: 'characters/char_ryou.png', prompt: `${STYLE} portrait of a rugged Japanese fisherman man wearing a bandana, strong jaw, tanned skin, bust shot, ${SUFFIX}, 128x128` },
    { file: 'characters/char_hana.png', prompt: `${STYLE} portrait of a plump friendly Japanese grandmother (obachan), warm maternal smile, bust shot, ${SUFFIX}, 128x128` },
];

const CUSTOMERS = [
    { file: 'customers/customer_takeshi.png', prompt: `${STYLE} portrait of a Japanese construction worker man with a hard hat and work clothes, hearty expression, bust shot, ${SUFFIX}, 96x96` },
    { file: 'customers/customer_sakura.png', prompt: `${STYLE} portrait of a fashionable young Japanese office lady holding a smartphone, trendy and cute, bust shot, ${SUFFIX}, 96x96` },
    { file: 'customers/customer_kouta.png', prompt: `${STYLE} portrait of a young Japanese male college student in a hoodie, casual and hungry look, bust shot, ${SUFFIX}, 96x96` },
    { file: 'customers/customer_miho.png', prompt: `${STYLE} portrait of a Japanese woman food blogger with glasses and a notebook, analytical look, bust shot, ${SUFFIX}, 96x96` },
    { file: 'customers/customer_mike.png', prompt: `${STYLE} portrait of a Western tourist man with a backpack, excited curious expression, bust shot, ${SUFFIX}, 96x96` },
    { file: 'customers/customer_yoshiko.png', prompt: `${STYLE} portrait of an elderly Japanese grandmother in a traditional kimono, gentle kind smile, bust shot, ${SUFFIX}, 96x96` },
    { file: 'customers/customer_daisuke.png', prompt: `${STYLE} portrait of a middle-aged Japanese man with arms crossed, serious ramen connoisseur, bust shot, ${SUFFIX}, 96x96` },
    { file: 'customers/customer_aoi.png', prompt: `${STYLE} portrait of a young Japanese mother holding a baby, warm caring expression, bust shot, ${SUFFIX}, 96x96` },
    { file: 'customers/customer_shinji.png', prompt: `${STYLE} portrait of a tired Japanese salary man with loosened necktie, exhausted but hopeful, bust shot, ${SUFFIX}, 96x96` },
    { file: 'customers/customer_rei.png', prompt: `${STYLE} portrait of an elegant Japanese woman in a stylish suit, sophisticated food critic, bust shot, ${SUFFIX}, 96x96` },
];

const BOWLS = [
    { file: 'soup/bowl_tonkotsu.png', prompt: `${STYLE} top-down view of a ramen bowl filled with creamy white tonkotsu pork bone broth, circular ceramic bowl, no toppings, ${SUFFIX}, 256x256` },
    { file: 'soup/bowl_shoyu.png', prompt: `${STYLE} top-down view of a ramen bowl filled with clear dark brown shoyu soy sauce broth, circular ceramic bowl, no toppings, ${SUFFIX}, 256x256` },
    { file: 'soup/bowl_miso.png', prompt: `${STYLE} top-down view of a ramen bowl filled with rich golden yellow miso broth, circular ceramic bowl, no toppings, ${SUFFIX}, 256x256` },
    { file: 'soup/bowl_shio.png', prompt: `${STYLE} top-down view of a ramen bowl filled with clear pale golden shio salt broth, circular ceramic bowl, no toppings, ${SUFFIX}, 256x256` },
    { file: 'soup/bowl_empty.png', prompt: `${STYLE} top-down view of an empty white ceramic ramen bowl, clean and empty, no soup, ${SUFFIX}, 256x256` },
];

const UI_BG = [
    { file: 'backgrounds/bg_table.png', prompt: `${STYLE} top-down view of a warm wooden table surface for a Japanese ramen restaurant, wood grain texture, cozy atmosphere, ${SUFFIX}, 800x600` },
    { file: 'ui/ui_btn_large.png', prompt: `${STYLE} large rounded rectangle button for a Japanese game UI, warm orange-red color, wooden ramen shop style, ${SUFFIX}, 200x60` },
    { file: 'ui/ui_btn_small.png', prompt: `${STYLE} small rounded rectangle button for a Japanese game UI, warm orange color, wooden ramen shop style, ${SUFFIX}, 120x40` },
    { file: 'ui/ui_card_back.png', prompt: `${STYLE} back of a playing card with a ramen bowl design, Japanese pattern border, red and gold colors, ${SUFFIX}, 80x112` },
];

const ALL_ASSETS = [
    ...INGREDIENTS.map(a => ({ ...a, category: 'ingredients' })),
    ...CHARACTERS.map(a => ({ ...a, category: 'characters' })),
    ...CUSTOMERS.map(a => ({ ...a, category: 'customers' })),
    ...BOWLS.map(a => ({ ...a, category: 'bowls' })),
    ...UI_BG.map(a => ({ ...a, category: 'ui_bg' })),
];

// ========== 生成処理 ==========

async function generateImage(prompt) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                responseModalities: ['IMAGE', 'TEXT'],
            }
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`API error ${response.status}: ${err}`);
    }

    const data = await response.json();

    // 画像パートを探す
    for (const part of data.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
            return Buffer.from(part.inlineData.data, 'base64');
        }
    }

    throw new Error('No image in response');
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log(`\n🍜 らーめん道 アセット生成スクリプト`);
    console.log(`   合計: ${ALL_ASSETS.length} 画像\n`);

    // スキップ済みファイルのチェック
    const pending = ALL_ASSETS.filter(a => {
        const filePath = path.join(BASE_DIR, a.file);
        if (fs.existsSync(filePath) && fs.statSync(filePath).size > 100) {
            console.log(`  ⏭  スキップ（既存）: ${a.file}`);
            return false;
        }
        return true;
    });

    console.log(`\n  生成対象: ${pending.length} / ${ALL_ASSETS.length}\n`);

    let success = 0;
    let fail = 0;

    for (let i = 0; i < pending.length; i++) {
        const asset = pending[i];
        const filePath = path.join(BASE_DIR, asset.file);
        const dir = path.dirname(filePath);

        // ディレクトリ確認
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        console.log(`  [${i + 1}/${pending.length}] ${asset.file} ...`);

        try {
            const imageBuffer = await generateImage(asset.prompt);
            fs.writeFileSync(filePath, imageBuffer);
            console.log(`    ✅ 保存完了 (${(imageBuffer.length / 1024).toFixed(1)} KB)`);
            success++;
        } catch (e) {
            console.error(`    ❌ 失敗: ${e.message}`);
            fail++;
        }

        // レートリミット対策: 4秒間隔
        if (i < pending.length - 1) {
            await sleep(4000);
        }
    }

    console.log(`\n========================================`);
    console.log(`  完了: ✅ ${success}  ❌ ${fail}  ⏭ ${ALL_ASSETS.length - pending.length}`);
    console.log(`========================================\n`);
}

main().catch(console.error);
