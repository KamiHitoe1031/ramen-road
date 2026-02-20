/**
 * ElevenLabs Sound Effects API で効果音を一括生成
 */
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) { console.error('ERROR: 環境変数 ELEVENLABS_API_KEY を設定してください'); process.exit(1); }
const API_URL = 'https://api.elevenlabs.io/v1/sound-generation';
const OUT_DIR = path.join(__dirname, '..', 'public', 'assets', 'audio', 'sfx');

const SFX_LIST = [
    { file: 'sfx_card_pick.mp3',    prompt: 'short satisfying card picking sound',     duration: 0.5 },
    { file: 'sfx_card_pass.mp3',    prompt: 'cards shuffling and sliding sound',       duration: 1.0 },
    { file: 'sfx_place.mp3',        prompt: 'soft plop, food placed in bowl',          duration: 0.5 },
    { file: 'sfx_remove.mp3',       prompt: 'quick whoosh, light removal',             duration: 0.5 },
    { file: 'sfx_bonus.mp3',        prompt: 'sparkle chime, positive feedback',        duration: 0.8 },
    { file: 'sfx_score_tick.mp3',   prompt: 'score counter ticking up',                duration: 0.5 },
    { file: 'sfx_title_reveal.mp3', prompt: 'dramatic fanfare reveal',                 duration: 1.5 },
    { file: 'sfx_winner.mp3',       prompt: 'celebration confetti and cheers',         duration: 2.0 },
    { file: 'sfx_timer_warn.mp3',   prompt: 'clock ticking urgency',                   duration: 1.0 },
    { file: 'sfx_click.mp3',        prompt: 'UI button click',                         duration: 0.5 },
];

async function generateSfx(prompt, durationSeconds) {
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

    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log('\n🔊 効果音生成スクリプト');
    console.log(`   合計: ${SFX_LIST.length} 個\n`);

    if (!fs.existsSync(OUT_DIR)) {
        fs.mkdirSync(OUT_DIR, { recursive: true });
    }

    let success = 0;
    let fail = 0;

    for (let i = 0; i < SFX_LIST.length; i++) {
        const sfx = SFX_LIST[i];
        const filePath = path.join(OUT_DIR, sfx.file);

        // スキップチェック
        if (fs.existsSync(filePath) && fs.statSync(filePath).size > 100) {
            console.log(`  ⏭  スキップ（既存）: ${sfx.file}`);
            success++;
            continue;
        }

        console.log(`  [${i + 1}/${SFX_LIST.length}] ${sfx.file} (${sfx.duration}s) ...`);

        try {
            const buf = await generateSfx(sfx.prompt, sfx.duration);
            fs.writeFileSync(filePath, buf);
            console.log(`    ✅ 保存完了 (${(buf.length / 1024).toFixed(1)} KB)`);
            success++;
        } catch (e) {
            console.error(`    ❌ 失敗: ${e.message}`);
            fail++;
        }

        if (i < SFX_LIST.length - 1) {
            await sleep(2000);
        }
    }

    console.log(`\n========================================`);
    console.log(`  完了: ✅ ${success}  ❌ ${fail}`);
    console.log(`========================================\n`);
}

main().catch(console.error);
