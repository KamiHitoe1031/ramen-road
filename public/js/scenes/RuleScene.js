/**
 * RuleScene - ゲームルールを実際のカード・画像で解説
 * 複数ページをスワイプ/ボタンで切り替え
 */
class RuleScene extends Phaser.Scene {
    constructor() {
        super(SCENES.RULE);
    }

    init() {
        this.currentPage = 0;
        this.totalPages = 6;
    }

    create() {
        const { width, height } = this.cameras.main;

        // BGM
        window.bgmManager.play(this, BGM_MAP[SCENES.TITLE]);

        // 背景
        this.add.image(width / 2, height / 2, 'bg_table').setDisplaySize(width, height).setAlpha(0.3);

        // コンテンツコンテナ（ページ切り替え用）
        this.contentContainer = this.add.container(0, 0);

        // ナビゲーション（固定）
        this.createNavigation();

        // 最初のページ表示
        this.showPage(0);
    }

    createNavigation() {
        const { width, height } = this.cameras.main;

        // 戻るボタン（タイトルへ）
        const backBtn = this.add.text(20, height - 28, '← タイトルへ', {
            fontSize: '14px', color: '#ff6b35',
        }).setInteractive({ useHandCursor: true }).setDepth(100);
        backBtn.on('pointerdown', () => {
            this.sound.play('sfx_click');
            this.scene.start(SCENES.TITLE);
        });

        // ページ送り
        this.prevBtn = this.add.text(width / 2 - 120, height - 28, '◀ 前へ', {
            fontSize: '16px', color: '#f5e6ca',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(100);
        this.prevBtn.on('pointerdown', () => this.changePage(-1));

        this.nextBtn = this.add.text(width / 2 + 120, height - 28, '次へ ▶', {
            fontSize: '16px', color: '#f5e6ca',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(100);
        this.nextBtn.on('pointerdown', () => this.changePage(1));

        this.pageText = this.add.text(width / 2, height - 28, '', {
            fontSize: '14px', color: '#888',
        }).setOrigin(0.5).setDepth(100);
    }

    changePage(delta) {
        const newPage = this.currentPage + delta;
        if (newPage < 0 || newPage >= this.totalPages) return;
        this.sound.play('sfx_click');
        this.showPage(newPage);
    }

    showPage(pageIndex) {
        this.currentPage = pageIndex;
        this.contentContainer.removeAll(true);

        // ページ描画
        switch (pageIndex) {
            case 0: this.page_overview(); break;
            case 1: this.page_soupNoodle(); break;
            case 2: this.page_ingredients(); break;
            case 3: this.page_draft(); break;
            case 4: this.page_placement(); break;
            case 5: this.page_scoring(); break;
        }

        // ナビ更新
        this.pageText.setText(`${pageIndex + 1} / ${this.totalPages}`);
        this.prevBtn.setAlpha(pageIndex === 0 ? 0.3 : 1);
        this.nextBtn.setAlpha(pageIndex === this.totalPages - 1 ? 0.3 : 1);
    }

    // ============================
    // Page 0: ゲーム全体の流れ
    // ============================
    page_overview() {
        const { width } = this.cameras.main;
        const c = this.contentContainer;

        this._title(c, '🍜 らーめん道 ～遊び方～');

        const steps = [
            { emoji: '👨‍🍳', label: 'キャラ選択', desc: '6人のラーメン屋から1人選ぶ' },
            { emoji: '🍲', label: 'スープ選択', desc: '豚骨・醤油・味噌・塩から1つ' },
            { emoji: '🍜', label: '麺を選択', desc: '細麺・ちぢれ麺・太麺から1つ' },
            { emoji: '🥩', label: 'ドラフト', desc: '具材カードを取り合い（9枚集める）' },
            { emoji: '🎨', label: '盛り付け', desc: '3×3の丼に具材を配置（60秒）' },
            { emoji: '🏆', label: '採点＆結果', desc: '味・彩り・相性で点数が決まる！' },
        ];

        steps.forEach((step, i) => {
            const x = width / 2;
            const y = 80 + i * 72;

            // ステップ番号
            const numBg = this.add.circle(x - 260, y, 18, 0xff6b35);
            c.add(numBg);
            const numText = this.add.text(x - 260, y, `${i + 1}`, {
                fontSize: '16px', color: '#fff', fontStyle: 'bold',
            }).setOrigin(0.5);
            c.add(numText);

            // 絵文字
            const emojiText = this.add.text(x - 220, y, step.emoji, { fontSize: '28px' }).setOrigin(0.5);
            c.add(emojiText);

            // ラベル
            const labelText = this.add.text(x - 190, y - 12, step.label, {
                fontSize: '18px', color: '#f5e6ca', fontStyle: 'bold',
            });
            c.add(labelText);
            const descText = this.add.text(x - 190, y + 10, step.desc, {
                fontSize: '13px', color: '#999',
            });
            c.add(descText);

            // 矢印（最後以外）
            if (i < steps.length - 1) {
                const arrow = this.add.text(x - 260, y + 36, '↓', {
                    fontSize: '16px', color: '#555',
                }).setOrigin(0.5);
                c.add(arrow);
            }
        });

        // ヒント
        const hint = this.add.text(width / 2, 530, '具材の組み合わせ・配置・キャラボーナスの掛け算で\n高得点を目指そう！', {
            fontSize: '14px', color: '#ff6b35', align: 'center',
        }).setOrigin(0.5);
        c.add(hint);
    }

    // ============================
    // Page 1: スープ×麺の相性
    // ============================
    page_soupNoodle() {
        const { width } = this.cameras.main;
        const c = this.contentContainer;
        const scoring = this.registry.get('data_scoring');
        const soups = this.registry.get('data_soups');
        const noodles = this.registry.get('data_noodles');

        this._title(c, '🍲 スープ × 麺の相性');

        const subtext = this.add.text(width / 2, 60, '選んだスープと麺の組み合わせで基本点が決まる！', {
            fontSize: '13px', color: '#999',
        }).setOrigin(0.5);
        c.add(subtext);

        // 丼画像を横に並べる
        soups.forEach((soup, i) => {
            const x = 130 + i * 150;
            const bowlImg = this.add.image(x, 120, soup.spriteKey).setDisplaySize(60, 60);
            c.add(bowlImg);
            const name = this.add.text(x, 158, soup.name, {
                fontSize: '14px', color: '#f5e6ca',
            }).setOrigin(0.5);
            c.add(name);
        });

        // 相性テーブル
        const tableY = 195;
        const cellW = 150, cellH = 50;
        const startX = 130;

        // 麺ヘッダ
        noodles.forEach((noodle, j) => {
            const y = tableY + j * cellH;
            const nLabel = this.add.text(30, y + cellH / 2, `🍜 ${noodle.name}`, {
                fontSize: '14px', color: '#f5e6ca',
            }).setOrigin(0, 0.5);
            c.add(nLabel);
        });

        // セル
        soups.forEach((soup, i) => {
            noodles.forEach((noodle, j) => {
                const x = startX + i * cellW;
                const y = tableY + j * cellH;
                const score = scoring.soupNoodleCompatibility[soup.id][noodle.id];

                const bgColor = score >= 4 ? 0x27ae60 : score >= 3 ? 0x2ecc71 : score >= 2 ? 0xf1c40f : score >= 1 ? 0x95a5a6 : 0x555555;
                const cellBg = this.add.rectangle(x, y + cellH / 2, cellW - 8, cellH - 6, bgColor, 0.3)
                    .setStrokeStyle(1, bgColor, 0.6);
                c.add(cellBg);

                const stars = score >= 4 ? '★★★★' : score >= 3 ? '★★★' : score >= 2 ? '★★' : score >= 1 ? '★' : '−';
                const scoreText = this.add.text(x, y + cellH / 2 - 8, `+${score}点`, {
                    fontSize: '16px', color: '#fff', fontStyle: 'bold',
                }).setOrigin(0.5);
                c.add(scoreText);
                const starText = this.add.text(x, y + cellH / 2 + 10, stars, {
                    fontSize: '11px', color: score >= 3 ? '#ffd700' : '#888',
                }).setOrigin(0.5);
                c.add(starText);
            });
        });

        // ポイント解説
        const tip = this.add.text(width / 2, 380, '💡 最高相性（+4点）: 豚骨×細麺、味噌×ちぢれ麺', {
            fontSize: '14px', color: '#ff6b35',
        }).setOrigin(0.5);
        c.add(tip);

        // ご当地セット紹介
        const setY = 420;
        const sets = scoring.regionalSets;
        const setNames = Object.keys(sets);
        const setLabel = this.add.text(width / 2, setY, '🗾 ご当地セット（揃えるとボーナス！）', {
            fontSize: '15px', color: '#ffd700', fontStyle: 'bold',
        }).setOrigin(0.5);
        c.add(setLabel);

        setNames.forEach((key, i) => {
            const set = sets[key];
            const soupName = soups.find(s => s.id === set.soup)?.name || set.soup;
            const noodleName = noodles.find(n => n.id === set.noodle)?.name || set.noodle;
            const y = setY + 28 + i * 22;
            const text = this.add.text(width / 2, y,
                `${set.name}: ${soupName} + ${noodleName} + 具材${set.min}種`, {
                    fontSize: '12px', color: '#ccc',
                }).setOrigin(0.5);
            c.add(text);
        });
    }

    // ============================
    // Page 2: 具材一覧
    // ============================
    page_ingredients() {
        const { width } = this.cameras.main;
        const c = this.contentContainer;
        const ingredients = this.registry.get('data_ingredients');

        this._title(c, '🥩 具材カード（全18種）');

        const subtext = this.add.text(width / 2, 58, 'ドラフトでこれらのカードを取り合う！色の種類が多いほど高得点', {
            fontSize: '12px', color: '#999',
        }).setOrigin(0.5);
        c.add(subtext);

        // 6列×3行でカード表示
        const cols = 6;
        const cardW = 68, cardH = 82, gapX = 10, gapY = 10;
        const totalW = cols * (cardW + gapX) - gapX;
        const offsetX = (width - totalW) / 2 + cardW / 2;
        const startY = 90;

        ingredients.forEach((ing, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = offsetX + col * (cardW + gapX);
            const y = startY + row * (cardH + gapY + 36);

            // カード背景
            const bg = this.add.rectangle(x, y, cardW, cardH, GAME_CONFIG.COLORS.CARD_BG)
                .setStrokeStyle(2, GAME_CONFIG.COLORS.CARD_BORDER);
            c.add(bg);

            // 色タグ帯
            const colorHex = GAME_CONFIG.COLOR_TAG_MAP[ing.colorTag] || 0x888888;
            const bar = this.add.rectangle(x, y - cardH / 2 + 8, cardW - 4, 14, colorHex);
            c.add(bar);

            // 具材画像
            const img = this.add.image(x, y - 6, ing.spriteKey).setDisplaySize(34, 34);
            c.add(img);

            // 具材名
            const nameText = this.add.text(x, y + 24, ing.name, {
                fontSize: '9px', color: '#333',
            }).setOrigin(0.5);
            c.add(nameText);

            // カテゴリ
            const catEmoji = GAME_CONFIG.CATEGORY_EMOJI[ing.category] || '';
            const catText = this.add.text(x, y + 36, catEmoji, { fontSize: '10px' }).setOrigin(0.5);
            c.add(catText);

            // 枚数
            const countText = this.add.text(x + cardW / 2 - 4, y - cardH / 2 + 4, `×${ing.cardCount}`, {
                fontSize: '9px', color: '#666',
            }).setOrigin(1, 0);
            c.add(countText);
        });

        // 凡例
        const legendY = 478;
        const cats = [
            { emoji: '🥩', label: '肉' }, { emoji: '🥚', label: '卵' },
            { emoji: '🥬', label: '野菜' }, { emoji: '🌊', label: '海鮮' },
            { emoji: '🎭', label: 'トッピング' },
        ];
        cats.forEach((cat, i) => {
            const lx = 80 + i * 140;
            const lt = this.add.text(lx, legendY, `${cat.emoji} ${cat.label}`, {
                fontSize: '13px', color: '#ccc',
            });
            c.add(lt);
        });

        // 色の説明
        const colorNote = this.add.text(width / 2, legendY + 28,
            '帯の色 = カードの「色タグ」→ 彩りボーナスに影響（5色以上で+8点！）', {
                fontSize: '12px', color: '#ff6b35',
            }).setOrigin(0.5);
        c.add(colorNote);
    }

    // ============================
    // Page 3: ドラフトの仕組み
    // ============================
    page_draft() {
        const { width } = this.cameras.main;
        const c = this.contentContainer;

        this._title(c, '🃏 ドラフト（寿司ゴー方式）');

        // ステップ図解
        const steps = [
            { y: 75, label: '① 手札が配られる',
              desc: '3人戦: 10枚 / 4人戦: 9枚' },
            { y: 145, label: '② 1枚選んで取る',
              desc: '欲しいカードを1枚だけ獲得！' },
            { y: 215, label: '③ 残りを左隣に回す',
              desc: '全員同時に手札を左隣のプレイヤーへ' },
            { y: 285, label: '④ 新しい手札から1枚選ぶ',
              desc: '②〜③を9回繰り返し → 9枚の手札完成！' },
        ];

        steps.forEach((step) => {
            const bg = this.add.rectangle(width / 2, step.y + 15, 550, 55, 0x3a2a1a, 0.6)
                .setStrokeStyle(1, 0x8b6914, 0.5);
            c.add(bg);

            const label = this.add.text(60, step.y, step.label, {
                fontSize: '18px', color: '#f5e6ca', fontStyle: 'bold',
            });
            c.add(label);
            const desc = this.add.text(60, step.y + 24, step.desc, {
                fontSize: '13px', color: '#999',
            });
            c.add(desc);
        });

        // カード回転の図解
        const circleY = 400;
        const circleR = 70;
        const players = ['あなた', 'プレイヤーB', 'プレイヤーC'];
        const angles = [-90, 30, 150]; // degrees

        players.forEach((name, i) => {
            const angle = angles[i] * Math.PI / 180;
            const px = width / 2 + Math.cos(angle) * circleR;
            const py = circleY + Math.sin(angle) * circleR;

            const dot = this.add.circle(px, py, 24, i === 0 ? 0xff6b35 : 0x3a2a1a)
                .setStrokeStyle(2, 0x8b6914);
            c.add(dot);
            const pText = this.add.text(px, py, name, {
                fontSize: '10px', color: '#fff',
            }).setOrigin(0.5);
            c.add(pText);
        });

        // 回転矢印
        const arrowText = this.add.text(width / 2, circleY, '↻', {
            fontSize: '28px', color: '#ff6b35',
        }).setOrigin(0.5);
        c.add(arrowText);
        const rotateLabel = this.add.text(width / 2, circleY + 30, '手札が回る！', {
            fontSize: '13px', color: '#ff6b35',
        }).setOrigin(0.5);
        c.add(rotateLabel);

        // コツ
        const tips = this.add.text(width / 2, 520, '💡 コツ: 自分が欲しいカードだけでなく、\n相手に渡したくないカードを取る「カット」も戦略！', {
            fontSize: '13px', color: '#ffd700', align: 'center',
        }).setOrigin(0.5);
        c.add(tips);
    }

    // ============================
    // Page 4: 盛り付け（配置ルール）
    // ============================
    page_placement() {
        const { width } = this.cameras.main;
        const c = this.contentContainer;
        const scoring = this.registry.get('data_scoring');

        this._title(c, '🎨 盛り付け（3×3グリッド）');

        // グリッド例
        const gridX = 180, gridY = 90;
        const cellSize = 56, gap = 4;

        // グリッド描画
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const cx = gridX + col * (cellSize + gap);
                const cy = gridY + row * (cellSize + gap);
                const isCenter = row === 1 && col === 1;
                const rect = this.add.rectangle(cx, cy, cellSize, cellSize,
                    isCenter ? 0x3a6b35 : GAME_CONFIG.COLORS.GRID_EMPTY, 0.6)
                    .setStrokeStyle(2, isCenter ? 0xffd700 : 0x8b6914, 0.5);
                c.add(rect);
                if (isCenter) {
                    const centerLabel = this.add.text(cx, cy + cellSize / 2 + 8, '中央+1点', {
                        fontSize: '9px', color: '#ffd700',
                    }).setOrigin(0.5);
                    c.add(centerLabel);
                }
            }
        }

        // 配置例（サンプル具材をグリッドに置く）
        const sampleGrid = [
            ['ing_chashu', 'ing_negi', 'ing_nori'],
            ['ing_nitamago', 'ing_menma', 'ing_horenso'],
            ['ing_ebi', null, 'ing_corn'],
        ];
        sampleGrid.forEach((row, r) => {
            row.forEach((spriteKey, col) => {
                if (!spriteKey) return;
                const cx = gridX + col * (cellSize + gap);
                const cy = gridY + r * (cellSize + gap);
                const img = this.add.image(cx, cy, spriteKey).setDisplaySize(38, 38);
                c.add(img);
            });
        });

        // 隣接ボーナス解説（右側）
        const infoX = 420;
        let infoY = 80;

        const adj_title = this.add.text(infoX, infoY, '隣接ボーナス', {
            fontSize: '16px', color: '#ffd700', fontStyle: 'bold',
        });
        c.add(adj_title);
        infoY += 24;

        const goodLabel = this.add.text(infoX, infoY, '✅ 良い組み合わせ（+2点）:', {
            fontSize: '12px', color: '#27ae60',
        });
        c.add(goodLabel);
        infoY += 18;

        const ingredients = this.registry.get('data_ingredients');
        const ingMap = {};
        ingredients.forEach(i => { ingMap[i.id] = i; });

        scoring.adjacencyGoodPairs.pairs.slice(0, 4).forEach((pair) => {
            const a = ingMap[pair[0]]?.name || pair[0];
            const b = ingMap[pair[1]]?.name || pair[1];
            const pairText = this.add.text(infoX + 10, infoY, `${a} ↔ ${b}`, {
                fontSize: '11px', color: '#ccc',
            });
            c.add(pairText);
            infoY += 16;
        });
        const moreGood = this.add.text(infoX + 10, infoY, `…他${scoring.adjacencyGoodPairs.pairs.length - 4}組`, {
            fontSize: '10px', color: '#888',
        });
        c.add(moreGood);
        infoY += 22;

        const badLabel = this.add.text(infoX, infoY, '❌ 悪い組み合わせ（-1点）:', {
            fontSize: '12px', color: '#e74c3c',
        });
        c.add(badLabel);
        infoY += 18;

        scoring.adjacencyBadPairs.pairs.forEach((pair) => {
            const a = ingMap[pair[0]]?.name || pair[0];
            const b = ingMap[pair[1]]?.name || pair[1];
            const pairText = this.add.text(infoX + 10, infoY, `${a} ↔ ${b}`, {
                fontSize: '11px', color: '#ccc',
            });
            c.add(pairText);
            infoY += 16;
        });

        // 彩りボーナス
        infoY += 10;
        const colorTitle = this.add.text(infoX, infoY, '🌈 彩りボーナス', {
            fontSize: '14px', color: '#ffd700', fontStyle: 'bold',
        });
        c.add(colorTitle);
        infoY += 22;

        const colorData = scoring.colorBonus;
        [2, 3, 4, 5].forEach(n => {
            const ct = this.add.text(infoX + 10, infoY, `${n}色: +${colorData[n]}点`, {
                fontSize: '12px', color: n >= 5 ? '#00ff00' : n >= 4 ? '#ffff00' : '#ccc',
            });
            c.add(ct);
            infoY += 16;
        });

        // その他ルール
        infoY += 8;
        const otherTitle = this.add.text(infoX, infoY, '⚠️ 注意', {
            fontSize: '13px', color: '#ff6b35',
        });
        c.add(otherTitle);
        infoY += 20;
        const dup = this.add.text(infoX + 10, infoY, '同じ具材2枚以上: -1点/枚', {
            fontSize: '11px', color: '#e74c3c',
        });
        c.add(dup);
        infoY += 16;
        const blank = this.add.text(infoX + 10, infoY, '空きマスもOK（戦略的に使える！）', {
            fontSize: '11px', color: '#ccc',
        });
        c.add(blank);

        // 制限時間
        const timerNote = this.add.text(width / 2, 540, '⏱ 制限時間: 60秒！ 時間切れで自動確定', {
            fontSize: '14px', color: '#ff6b35',
        }).setOrigin(0.5);
        c.add(timerNote);
    }

    // ============================
    // Page 5: 採点の仕組み
    // ============================
    page_scoring() {
        const { width } = this.cameras.main;
        const c = this.contentContainer;
        const characters = this.registry.get('data_characters');
        const customers = this.registry.get('data_customers');

        this._title(c, '📊 採点（4つのレイヤー）');

        const layers = [
            {
                label: 'L1: 基本ルール',
                color: '#27ae60',
                items: ['スープ×麺相性 (0〜4点)', '彩りボーナス (0〜8点)', '隣接Good/Bad (+2/-1)', '中央ボーナス (+1)', '重複ペナルティ (-1)'],
            },
            {
                label: 'L2: キャラボーナス',
                color: '#3498db',
                items: ['選んだキャラの得意分野', '条件達成で追加点 (最大+12点)'],
            },
            {
                label: 'L3: お客さん評価',
                color: '#e67e22',
                items: ['2人のお客さんが審査', '好みに合えば加点 (各最大+11点)'],
            },
            {
                label: 'L4: 称号セレモニー',
                color: '#9b59b6',
                items: ['具沢山王、盛り付けの匠 等', '条件を満たせばボーナス (+3〜5点)'],
            },
        ];

        let y = 65;
        layers.forEach((layer, i) => {
            // レイヤーバー
            const barW = 520;
            const bg = this.add.rectangle(width / 2, y + 8, barW, 16 + layer.items.length * 16, 0x222222, 0.6)
                .setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(layer.color).color, 0.8);
            c.add(bg);

            const title = this.add.text(60, y - 4, layer.label, {
                fontSize: '15px', color: layer.color, fontStyle: 'bold',
            });
            c.add(title);

            layer.items.forEach((item, j) => {
                const itemText = this.add.text(80, y + 16 + j * 16, `• ${item}`, {
                    fontSize: '12px', color: '#ccc',
                });
                c.add(itemText);
            });

            y += 28 + layer.items.length * 16;
        });

        // キャラ紹介（小さく）
        y += 8;
        const charTitle = this.add.text(width / 2, y, '👨‍🍳 キャラクター（一部紹介）', {
            fontSize: '14px', color: '#ffd700', fontStyle: 'bold',
        }).setOrigin(0.5);
        c.add(charTitle);
        y += 24;

        characters.slice(0, 3).forEach((char, i) => {
            const cx = 130 + i * 220;
            const img = this.add.image(cx - 30, y + 10, char.spriteKey).setDisplaySize(40, 40);
            c.add(img);
            const name = this.add.text(cx + 10, y, char.name, {
                fontSize: '13px', color: '#f5e6ca', fontStyle: 'bold',
            });
            c.add(name);
            const style = this.add.text(cx + 10, y + 16, char.playstyle || '', {
                fontSize: '10px', color: '#999',
            });
            c.add(style);
        });

        // お客さん紹介
        y += 50;
        const custTitle = this.add.text(width / 2, y, '👥 お客さん（毎回ランダム2人が審査）', {
            fontSize: '14px', color: '#ffd700', fontStyle: 'bold',
        }).setOrigin(0.5);
        c.add(custTitle);
        y += 24;

        customers.slice(0, 4).forEach((cust, i) => {
            const cx = 100 + i * 170;
            const img = this.add.image(cx - 20, y + 8, cust.spriteKey).setDisplaySize(32, 32);
            c.add(img);
            const name = this.add.text(cx + 8, y, cust.name, {
                fontSize: '12px', color: '#f5e6ca',
            });
            c.add(name);
            const type = this.add.text(cx + 8, y + 16, cust.type || '', {
                fontSize: '10px', color: '#888',
            });
            c.add(type);
        });

        // 管理者リンク（最終ページに表示）
        this.showAdminLink();
    }

    // ============================
    // 管理者ログイン（最終ページに表示）
    // ============================
    showAdminLink() {
        const { width } = this.cameras.main;
        const c = this.contentContainer;

        // 管理者リンク（小さく目立たない）
        const adminLink = this.add.text(width - 30, 555, '⚙️', {
            fontSize: '16px', color: '#444',
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true }).setDepth(50);
        c.add(adminLink);

        adminLink.on('pointerover', () => adminLink.setColor('#666'));
        adminLink.on('pointerout', () => adminLink.setColor('#444'));
        adminLink.on('pointerdown', () => {
            this.showPasswordDialog();
        });
    }

    showPasswordDialog() {
        // DOM要素でパスワード入力オーバーレイを作成
        if (this.adminOverlay) return;

        const overlay = document.createElement('div');
        overlay.id = 'admin-pw-overlay';
        overlay.style.cssText = `
            position:fixed;top:0;left:0;width:100%;height:100%;
            background:rgba(0,0,0,0.7);display:flex;align-items:center;
            justify-content:center;z-index:10000;
        `;

        const box = document.createElement('div');
        box.style.cssText = `
            background:#2a2a3e;border:1px solid #8b6914;border-radius:12px;
            padding:32px;text-align:center;max-width:360px;width:90%;
        `;
        box.innerHTML = `
            <h3 style="color:#f5e6ca;margin-bottom:16px;font-size:18px;">🔒 管理者ログイン</h3>
            <input type="password" id="admin-pw-input" placeholder="パスワード"
                style="width:100%;padding:10px 14px;border:1px solid #555;border-radius:6px;
                background:#1a1a2e;color:#fff;font-size:16px;margin-bottom:12px;outline:none;">
            <div style="display:flex;gap:12px;justify-content:center;">
                <button id="admin-pw-cancel"
                    style="padding:10px 24px;border:1px solid #555;border-radius:6px;
                    background:transparent;color:#ccc;cursor:pointer;font-size:14px;">
                    キャンセル
                </button>
                <button id="admin-pw-submit"
                    style="padding:10px 24px;border:none;border-radius:6px;
                    background:#c0392b;color:#fff;cursor:pointer;font-size:14px;">
                    ログイン
                </button>
            </div>
            <p id="admin-pw-error" style="color:#e74c3c;font-size:13px;margin-top:8px;"></p>
        `;

        overlay.appendChild(box);
        document.body.appendChild(overlay);
        this.adminOverlay = overlay;

        const input = document.getElementById('admin-pw-input');
        input.focus();

        // キャンセル
        document.getElementById('admin-pw-cancel').addEventListener('click', () => {
            this.closePasswordDialog();
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.closePasswordDialog();
        });

        // ログイン
        const doLogin = async () => {
            const password = input.value;
            const errEl = document.getElementById('admin-pw-error');
            if (!password) { errEl.textContent = 'パスワードを入力してください'; return; }

            try {
                const res = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password }),
                });
                const data = await res.json();
                if (!res.ok) { errEl.textContent = data.error; return; }

                // ログイン成功 → 管理画面へ遷移
                sessionStorage.setItem('adminToken', data.token);
                this.closePasswordDialog();
                window.location.href = `/admin.html?token=${data.token}`;
            } catch (e) {
                errEl.textContent = '通信エラー';
            }
        };

        document.getElementById('admin-pw-submit').addEventListener('click', doLogin);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });
    }

    closePasswordDialog() {
        if (this.adminOverlay) {
            this.adminOverlay.remove();
            this.adminOverlay = null;
        }
    }

    // ============================
    // ヘルパー
    // ============================
    _title(container, text) {
        const { width } = this.cameras.main;
        const title = this.add.text(width / 2, 28, text, {
            fontSize: GAME_CONFIG.FONT.HEADING_SIZE,
            color: GAME_CONFIG.COLORS.TEXT_PRIMARY,
        }).setOrigin(0.5);
        container.add(title);
    }
}
