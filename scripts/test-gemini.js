const fs = require('fs');

async function test() {
    const API_KEY = '***REMOVED***';
    const MODEL = 'gemini-3-pro-image-preview';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: 'Generate an image: A cute hand-drawn storybook illustration of a round sliced pork chashu ramen topping, soft pastel colors, thick gentle outlines, flat shading, transparent background, centered, game asset, no text, 64x64 pixel' }] }],
            generationConfig: {
                responseModalities: ['IMAGE', 'TEXT'],
            }
        })
    });

    if (!res.ok) {
        console.log('ERROR:', res.status, await res.text());
        return;
    }

    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
        if (part.inlineData) {
            console.log('SUCCESS! mimeType:', part.inlineData.mimeType, 'size:', part.inlineData.data.length, 'chars');
            const buf = Buffer.from(part.inlineData.data, 'base64');
            fs.writeFileSync('public/assets/images/ingredients/ing_chashu.png', buf);
            console.log('Saved:', buf.length, 'bytes');
        } else if (part.text) {
            console.log('Text:', part.text.substring(0, 200));
        }
    }
}

test().catch(e => console.error(e.message));
