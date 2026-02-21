/**
 * ElevenLabs Sound Effects API でBGMプレースホルダーを生成
 *
 * 使い方: ELEVENLABS_API_KEY=your_key node scripts/generate-bgm.js
 *
 * ※ 本格的なBGMはフリー素材（DOVA-SYNDROME / 魔王魂等）での差し替えを推奨
 *   このスクリプトはアンビエント風プレースホルダーを生成します
 */
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
    console.error('ERROR: 環境変数 ELEVENLABS_API_KEY を設定してください');
    process.exit(1);
}

const API_URL = 'https://api.elevenlabs.io/v1/sound-generation';
const OUT_DIR = path.join(__dirname, '..', 'public', 'assets', 'audio', 'bgm');

const BGM_LIST = [
    {
        file: 'bgm_lobby.mp3',
        prompt: 'calm relaxing Japanese traditional ambient music with soft shamisen and wind chimes, peaceful background loop',
        duration: 15,
    },
    {
        file: 'bgm_draft.mp3',
        prompt: 'light energetic Japanese festival music with taiko drums and flute, upbeat competitive game background',
        duration: 15,
    },
    {
        file: 'bgm_placement.mp3',
        prompt: 'cheerful warm kitchen cooking ambient music with gentle marimba and xylophone, happy creative background',
        duration: 15,
    },
    {
        file: 'bgm_result.mp3',
        prompt: 'grand celebration fanfare with orchestral brass and strings, triumphant victory ceremony music',
        duration: 15,
    },
];

async function generateBgm(prompt, durationSeconds) {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'xi-api-key': API_KEY,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text: prompt,
            duration_seconds: durationSeconds,
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`API error ${res.status}: ${err}`);
    }

    return Buffer.from(await res.arrayBuffer());
}

async function main() {
    fs.mkdirSync(OUT_DIR, { recursive: true });

    for (const bgm of BGM_LIST) {
        const outPath = path.join(OUT_DIR, bgm.file);

        if (fs.existsSync(outPath)) {
            console.log(`⏭ Skip (exists): ${bgm.file}`);
            continue;
        }

        console.log(`🎵 Generating: ${bgm.file} (${bgm.duration}s) ...`);
        try {
            const buffer = await generateBgm(bgm.prompt, bgm.duration);
            fs.writeFileSync(outPath, buffer);
            console.log(`  ✅ Saved: ${outPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
        } catch (e) {
            console.error(`  ❌ Failed: ${bgm.file} - ${e.message}`);
        }

        // API レート制限回避
        await new Promise(r => setTimeout(r, 2000));
    }

    console.log('\n🎵 BGM generation complete!');
    console.log('💡 本格的なBGMが欲しい場合は DOVA-SYNDROME や 魔王魂 からフリー素材をダウンロードして差し替えてください');
}

main().catch(console.error);
