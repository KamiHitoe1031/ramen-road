/**
 * キービジュアル生成スクリプト
 * Gemini API (Imagen) でタイトル画面用のメインビジュアルを生成
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.error('GEMINI_API_KEY が .env に設定されていません');
    process.exit(1);
}

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'assets', 'images', 'ui');

async function generateImage(prompt, filename) {
    console.log(`生成中: ${filename}`);
    console.log(`プロンプト: ${prompt}`);

    // Gemini 2.0 Flash (image generation対応) を使用
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${API_KEY}`;

    const body = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }],
        generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
        }
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API Error ${res.status}: ${errText}`);
    }

    const data = await res.json();

    // レスポンスから画像データを抽出
    const candidates = data.candidates || [];
    for (const candidate of candidates) {
        const parts = candidate.content?.parts || [];
        for (const part of parts) {
            if (part.inlineData) {
                const imageData = Buffer.from(part.inlineData.data, 'base64');
                const outputPath = path.join(OUTPUT_DIR, filename);
                fs.writeFileSync(outputPath, imageData);
                console.log(`保存完了: ${outputPath} (${(imageData.length / 1024).toFixed(0)}KB)`);
                return outputPath;
            }
        }
    }

    throw new Error('画像データがレスポンスに含まれていません: ' + JSON.stringify(data).substring(0, 500));
}

async function main() {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const prompt = `Create a cute, hand-drawn storybook illustration style key visual for a Japanese ramen board game called "らーめん道" (Ramen Road).

The image should show:
- A large, beautifully decorated bowl of ramen in the center, seen from slightly above, with colorful toppings (chashu, egg, nori, green onions, naruto)
- Steam rising from the bowl in a whimsical way
- Soft pastel colors with warm tones (orange, cream, brown)
- Thick gentle outlines, flat shading
- The overall mood should be warm, inviting, and playful
- Game-like atmosphere with a slight competitive feel
- Aspect ratio: roughly 16:9 landscape
- No text in the image
- Transparent or solid warm-toned background`;

    try {
        await generateImage(prompt, 'key_visual.png');
        console.log('\nキービジュアル生成完了！');
    } catch (e) {
        console.error('生成エラー:', e.message);

        // Imagen API もフォールバックとして試行
        console.log('\nImagen 3 APIで再試行...');
        try {
            await generateWithImagen(prompt, 'key_visual.png');
        } catch (e2) {
            console.error('Imagen APIもエラー:', e2.message);
        }
    }
}

async function generateWithImagen(prompt, filename) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${API_KEY}`;

    const body = {
        instances: [{ prompt }],
        parameters: {
            sampleCount: 1,
            aspectRatio: "16:9",
        }
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Imagen API Error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const predictions = data.predictions || [];
    if (predictions.length > 0 && predictions[0].bytesBase64Encoded) {
        const imageData = Buffer.from(predictions[0].bytesBase64Encoded, 'base64');
        const outputPath = path.join(OUTPUT_DIR, filename);
        fs.writeFileSync(outputPath, imageData);
        console.log(`保存完了: ${outputPath} (${(imageData.length / 1024).toFixed(0)}KB)`);
    } else {
        throw new Error('画像が生成されませんでした');
    }
}

main();
