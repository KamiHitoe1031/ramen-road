/**
 * RuleScene - ゲームルール・世界観・データ一覧を詳細に解説
 * スクロール型の複数ページ構成
 */
class RuleScene extends Phaser.Scene {
    constructor() {
        super(SCENES.RULE);
    }

    init() {
        this.currentPage = 0;
        this.totalPages = 10;
    }

    create() {
        const { width, height } = this.cameras.main;
        window.bgmManager.play(this, BGM_MAP[SCENES.RULE]);
        this.add.image(width / 2, height / 2, 'bg_table').setDisplaySize(width, height).setAlpha(0.25);
        this.contentContainer = this.add.container(0, 0);
        this.createNavigation();
        this.showPage(0);
    }

    createNavigation() {
        const { width, height } = this.cameras.main;
        // ナビバー背景
        this.add.rectangle(width / 2, height - 20, width, 40, 0x1a1a2e, 0.9).setDepth(99);

        const backBtn = this.add.text(20, height - 22, '← タイトルへ', {
            fontSize: '13px', color: '#ff6b35',
        }).setInteractive({ useHandCursor: true }).setDepth(100);
        backBtn.on('pointerdown', () => { this.sound.play('sfx_click'); this.scene.start(SCENES.TITLE); });

        this.prevBtn = this.add.text(width / 2 - 130, height - 22, '◀ 前へ', {
            fontSize: '15px', color: '#f5e6ca',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(100);
        this.prevBtn.on('pointerdown', () => this.changePage(-1));

        this.nextBtn = this.add.text(width / 2 + 130, height - 22, '次へ ▶', {
            fontSize: '15px', color: '#f5e6ca',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(100);
        this.nextBtn.on('pointerdown', () => this.changePage(1));

        this.pageText = this.add.text(width / 2, height - 22, '', {
            fontSize: '13px', color: '#888',
        }).setOrigin(0.5).setDepth(100);
    }

    changePage(d) {
        const n = this.currentPage + d;
        if (n < 0 || n >= this.totalPages) return;
        this.sound.play('sfx_click');
        this.showPage(n);
    }

    showPage(i) {
        this.currentPage = i;
        this.contentContainer.removeAll(true);
        const pages = [
            'page_story', 'page_flow', 'page_soupNoodle', 'page_ingredients',
            'page_draft', 'page_placement', 'page_scoringBase',
            'page_characters', 'page_customers', 'page_titles',
        ];
        this[pages[i]]();
        this.pageText.setText(`${i + 1} / ${this.totalPages}`);
        this.prevBtn.setAlpha(i === 0 ? 0.3 : 1);
        this.nextBtn.setAlpha(i === this.totalPages - 1 ? 0.3 : 1);
    }

    // ============================================================
    // Page 0: 世界観・フレーバー
    // ============================================================
    page_story() {
        const { width } = this.cameras.main;
        const c = this.contentContainer;
        this._title(c, '🍜 らーめん道 ～至高の一杯～');

        const lines = [
            '',
            '年に一度、全国のラーメン職人が腕を競い合う',
            '伝説の大会「らーめん道グランプリ」。',
            '',
            'テレビカメラが並ぶ特設スタジアムに集った',
            '腕自慢の職人たちが、己の信じた至高の一杯で',
            '頂点を目指す。',
            '',
            'スープを選び、麺を合わせ、具材を取り合い、',
            '3×3の丼に盛り付ける。',
            '',
            'しかし、どんなに美味いラーメンを作っても',
            '審査員の好みに合わなければ高得点は得られない。',
            '味だけではない。彩り、配置の美学、',
            'そしてライバルとの駆け引きが勝敗を分ける。',
            '',
            'さあ、あなたも暖簾をくぐり、',
            '「らーめん道」の頂を掴め！',
        ];

        let y = 55;
        lines.forEach(line => {
            if (line === '') { y += 8; return; }
            const isHighlight = line.includes('らーめん道グランプリ') || line.includes('至高の一杯');
            const t = this.add.text(width / 2, y, line, {
                fontSize: isHighlight ? '16px' : '14px',
                color: isHighlight ? '#ffd700' : '#ddd',
                fontStyle: isHighlight ? 'bold' : '',
            }).setOrigin(0.5);
            c.add(t);
            y += 22;
        });

        // キービジュアル（あれば）
        if (this.textures.exists('key_visual')) {
            const kv = this.add.image(width / 2, y + 50, 'key_visual');
            const s = Math.min(160 / kv.width, 120 / kv.height);
            kv.setScale(s).setAlpha(0.8);
            c.add(kv);
        }
    }

    // ============================================================
    // Page 1: ゲームの流れ
    // ============================================================
    page_flow() {
        const { width } = this.cameras.main;
        const c = this.contentContainer;
        this._title(c, '📋 ゲームの流れ');

        const steps = [
            { n: '1', emoji: '👨‍🍳', title: 'キャラ選択（15秒）', desc: '6人のラーメン職人から1人を選ぶ。\n職人ごとに得意なスタイル・ボーナス条件が異なる。' },
            { n: '2', emoji: '🍲', title: 'スープ選択（10秒）', desc: '豚骨・醤油・味噌・塩の4種から選択。\n麺との相性で基本点が変わる。' },
            { n: '3', emoji: '🍜', title: '麺選択（10秒）', desc: '細麺・ちぢれ麺・太麺の3種から選択。\nスープとの相性が表示される。' },
            { n: '4', emoji: '🃏', title: 'ドラフト（各15秒 × 9回）', desc: '具材カードを寿司ゴー方式で取り合い。\n1枚選んで残りを隣へ回す。これを9回繰り返す。' },
            { n: '5', emoji: '🎨', title: '盛り付け（60秒）', desc: '獲得した具材を3×3の丼に自由に配置。\n隣接・彩り・中央ボーナスを狙う。' },
            { n: '6', emoji: '📊', title: '採点', desc: '4つのレイヤーで採点。基本ルール→キャラボーナス\n→審査員評価→称号ボーナスの順に加算。' },
        ];

        let y = 52;
        steps.forEach(s => {
            const bg = this.add.rectangle(width / 2, y + 22, 700, 58, 0x2a1a0e, 0.5)
                .setStrokeStyle(1, 0x8b6914, 0.3);
            c.add(bg);
            const numBg = this.add.circle(50, y + 22, 16, 0xff6b35);
            c.add(numBg);
            const num = this.add.text(50, y + 22, s.n, { fontSize: '14px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
            c.add(num);
            const emoji = this.add.text(80, y + 22, s.emoji, { fontSize: '22px' }).setOrigin(0.5);
            c.add(emoji);
            const title = this.add.text(100, y + 8, s.title, { fontSize: '15px', color: '#f5e6ca', fontStyle: 'bold' });
            c.add(title);
            const desc = this.add.text(100, y + 26, s.desc, { fontSize: '11px', color: '#999' });
            c.add(desc);
            y += 72;
        });

        const tip = this.add.text(width / 2, y + 10, '💡 最も合計点が高いプレイヤーが優勝！', {
            fontSize: '14px', color: '#ffd700', fontStyle: 'bold',
        }).setOrigin(0.5);
        c.add(tip);
    }

    // ============================================================
    // Page 2: スープ × 麺の相性
    // ============================================================
    page_soupNoodle() {
        const { width } = this.cameras.main;
        const c = this.contentContainer;
        const scoring = this.registry.get('data_scoring');
        const soups = this.registry.get('data_soups');
        const noodles = this.registry.get('data_noodles');
        this._title(c, '🍲 スープ × 麺の相性');

        const sub = this.add.text(width / 2, 55, 'スープと麺の組み合わせで基本点（0〜4点）が決まる', {
            fontSize: '12px', color: '#999',
        }).setOrigin(0.5);
        c.add(sub);

        // 丼画像
        soups.forEach((soup, i) => {
            const x = 130 + i * 150;
            const img = this.add.image(x, 110, soup.spriteKey).setDisplaySize(56, 56);
            c.add(img);
            const n = this.add.text(x, 146, soup.name, { fontSize: '13px', color: '#f5e6ca' }).setOrigin(0.5);
            c.add(n);
            const d = this.add.text(x, 160, soup.description, { fontSize: '9px', color: '#777', wordWrap: { width: 130 }, align: 'center' }).setOrigin(0.5, 0);
            c.add(d);
        });

        // テーブル
        const tY = 195, cW = 150, cH = 46, sX = 130;
        noodles.forEach((noodle, j) => {
            const y = tY + j * cH;
            const nl = this.add.text(25, y + cH / 2, `🍜 ${noodle.name}`, { fontSize: '13px', color: '#f5e6ca' }).setOrigin(0, 0.5);
            c.add(nl);
        });

        soups.forEach((soup, i) => {
            noodles.forEach((noodle, j) => {
                const x = sX + i * cW;
                const y = tY + j * cH;
                const score = scoring.soupNoodleCompatibility[soup.id][noodle.id];
                const bgColor = score >= 4 ? 0x27ae60 : score >= 3 ? 0x2ecc71 : score >= 2 ? 0xf1c40f : score >= 1 ? 0x95a5a6 : 0x555555;
                const bg = this.add.rectangle(x, y + cH / 2, cW - 6, cH - 4, bgColor, 0.25).setStrokeStyle(1, bgColor, 0.5);
                c.add(bg);
                const stars = '★'.repeat(score) + '☆'.repeat(4 - score);
                const st = this.add.text(x, y + cH / 2 - 6, `+${score}点`, { fontSize: '15px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
                c.add(st);
                const ss = this.add.text(x, y + cH / 2 + 10, stars, { fontSize: '10px', color: score >= 3 ? '#ffd700' : '#666' }).setOrigin(0.5);
                c.add(ss);
            });
        });

        // ご当地セット
        let y = 350;
        const setTitle = this.add.text(width / 2, y, '🗾 ご当地セット（揃えるとボーナス称号！）', {
            fontSize: '14px', color: '#ffd700', fontStyle: 'bold',
        }).setOrigin(0.5);
        c.add(setTitle);
        y += 24;

        const sets = scoring.regionalSets;
        Object.keys(sets).forEach(key => {
            const set = sets[key];
            const soupN = soups.find(s => s.id === set.soup)?.name;
            const noodleN = noodles.find(n => n.id === set.noodle)?.name;
            const poolNames = set.pool.map(id => {
                const ing = this.registry.get('data_ingredients').find(i => i.id === id);
                return ing ? ing.name : id;
            }).join('・');
            const t = this.add.text(width / 2, y, `${set.name}: ${soupN}＋${noodleN}＋[${poolNames}]から${set.min}種`, {
                fontSize: '11px', color: '#ccc',
            }).setOrigin(0.5);
            c.add(t);
            y += 20;
        });

        // 麺説明
        y += 12;
        noodles.forEach(n => {
            const t = this.add.text(width / 2, y, `🍜 ${n.name}: ${n.description}`, {
                fontSize: '11px', color: '#aaa',
            }).setOrigin(0.5);
            c.add(t);
            y += 18;
        });
    }

    // ============================================================
    // Page 3: 具材一覧
    // ============================================================
    page_ingredients() {
        const { width } = this.cameras.main;
        const c = this.contentContainer;
        const ingredients = this.registry.get('data_ingredients');
        this._title(c, '🥩 具材カード一覧（全18種 / 39枚）');

        const sub = this.add.text(width / 2, 52, 'ドラフトで取り合うカード。色タグの種類が多いほど彩りボーナスUP', {
            fontSize: '11px', color: '#999',
        }).setOrigin(0.5);
        c.add(sub);

        // カテゴリ別に色分け
        const catColors = { meat: '#e74c3c', egg: '#f1c40f', vegetable: '#27ae60', seafood: '#3498db', topping: '#9b59b6' };
        const catNames = { meat: '肉', egg: '卵', vegetable: '野菜', seafood: '海鮮', topping: 'トッピング' };

        const cols = 6;
        const cardW = 65, cardH = 72, gapX = 8, gapY = 42;
        const totalW = cols * (cardW + gapX) - gapX;
        const offsetX = (width - totalW) / 2 + cardW / 2;
        const startY = 82;

        ingredients.forEach((ing, idx) => {
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            const x = offsetX + col * (cardW + gapX);
            const y = startY + row * (cardH + gapY);

            const bg = this.add.rectangle(x, y, cardW, cardH, GAME_CONFIG.COLORS.CARD_BG).setStrokeStyle(2, GAME_CONFIG.COLORS.CARD_BORDER);
            c.add(bg);

            // 色タグ帯
            const colorHex = GAME_CONFIG.COLOR_TAG_MAP[ing.colorTag] || 0x888888;
            const bar = this.add.rectangle(x, y - cardH / 2 + 7, cardW - 2, 12, colorHex);
            c.add(bar);

            // 画像
            const img = this.add.image(x, y - 4, ing.spriteKey).setDisplaySize(30, 30);
            c.add(img);

            // 名前
            const nameT = this.add.text(x, y + 22, ing.name, { fontSize: '9px', color: '#333' }).setOrigin(0.5);
            c.add(nameT);

            // 枚数
            const cnt = this.add.text(x + cardW / 2 - 3, y - cardH / 2 + 3, `×${ing.cardCount}`, { fontSize: '8px', color: '#666' }).setOrigin(1, 0);
            c.add(cnt);

            // カテゴリ＋色タグ（カード下）
            const catT = this.add.text(x, y + cardH / 2 + 8,
                `${catNames[ing.category]}・${ing.colorTag}`, {
                    fontSize: '8px', color: catColors[ing.category] || '#888',
                }).setOrigin(0.5);
            c.add(catT);

            // 地域タグ
            if (ing.regionTags.length > 0) {
                const regT = this.add.text(x, y + cardH / 2 + 18,
                    ing.regionTags.map(r => {
                        const rn = { hakata: '博多', sapporo: '札幌', tokyo: '東京', hakodate: '函館' };
                        return rn[r] || r;
                    }).join('/'), {
                        fontSize: '7px', color: '#888',
                    }).setOrigin(0.5);
                c.add(regT);
            }
        });

        // 凡例
        const legY = 475;
        let legX = 50;
        Object.entries(catNames).forEach(([key, name]) => {
            const dot = this.add.circle(legX, legY, 5, Phaser.Display.Color.HexStringToColor(catColors[key]).color);
            c.add(dot);
            const lt = this.add.text(legX + 10, legY, name, { fontSize: '11px', color: '#ccc' }).setOrigin(0, 0.5);
            c.add(lt);
            legX += 75;
        });

        const colorNote = this.add.text(width / 2, legY + 22,
            '色タグ全7種: 赤/緑/黄/白/茶/黒/ピンク → 5色以上で彩りボーナス+8点！', {
                fontSize: '11px', color: '#ff6b35',
            }).setOrigin(0.5);
        c.add(colorNote);

        const totalNote = this.add.text(width / 2, legY + 40,
            'カードプール合計39枚。3人戦:各10枚配布(9枚獲得) / 4人戦:各9枚配布(9枚獲得)', {
                fontSize: '10px', color: '#888',
            }).setOrigin(0.5);
        c.add(totalNote);
    }

    // ============================================================
    // Page 4: ドラフトの仕組み
    // ============================================================
    page_draft() {
        const { width } = this.cameras.main;
        const c = this.contentContainer;
        this._title(c, '🃏 ドラフト（寿司ゴー方式）');

        const desc = this.add.text(width / 2, 55,
            '全員に手札が配られ、1枚選んで残りを左隣へ回す。これを9回繰り返す。', {
                fontSize: '12px', color: '#999',
            }).setOrigin(0.5);
        c.add(desc);

        const steps = [
            { title: '① 手札が配られる', desc: '3人戦: 10枚 / 4人戦: 9枚が各プレイヤーに配られる。\nカードプール39枚からランダムに振り分け。' },
            { title: '② 1枚を選んで獲得', desc: '手札を見て、欲しいカード1枚を選ぶ（制限時間15秒）。\n選んだカードは自分の獲得カードになる。' },
            { title: '③ 残りを左隣へ回す', desc: '選ばなかった手札を全て左隣のプレイヤーへ渡す。\n同時に、右隣のプレイヤーから新しい手札が届く。' },
            { title: '④ これを9回繰り返す', desc: '毎回少しずつ手札が減っていく。\n最終的に全員が9枚のカードを獲得する。' },
        ];

        let y = 85;
        steps.forEach(s => {
            const bg = this.add.rectangle(width / 2, y + 26, 650, 60, 0x2a1a0e, 0.5).setStrokeStyle(1, 0x8b6914, 0.3);
            c.add(bg);
            const t = this.add.text(60, y + 10, s.title, { fontSize: '15px', color: '#f5e6ca', fontStyle: 'bold' });
            c.add(t);
            const d = this.add.text(60, y + 30, s.desc, { fontSize: '11px', color: '#999' });
            c.add(d);
            y += 76;
        });

        // 回転図
        const circY = 420, circR = 60;
        const players = ['あなた', 'Player B', 'Player C'];
        const angles = [-90, 30, 150];
        players.forEach((name, i) => {
            const a = angles[i] * Math.PI / 180;
            const px = width / 2 + Math.cos(a) * circR;
            const py = circY + Math.sin(a) * circR;
            const dot = this.add.circle(px, py, 22, i === 0 ? 0xff6b35 : 0x3a2a1a).setStrokeStyle(2, 0x8b6914);
            c.add(dot);
            const pt = this.add.text(px, py, name, { fontSize: '9px', color: '#fff' }).setOrigin(0.5);
            c.add(pt);
        });
        const arrow = this.add.text(width / 2, circY, '↻', { fontSize: '26px', color: '#ff6b35' }).setOrigin(0.5);
        c.add(arrow);
        const rl = this.add.text(width / 2, circY + 28, '手札が左へ回る', { fontSize: '11px', color: '#ff6b35' }).setOrigin(0.5);
        c.add(rl);

        const tips = this.add.text(width / 2, 530, '💡 自分が欲しいカードを取るか、相手に渡したくないカードをカットするか。\nドラフトの駆け引きが勝敗を左右する！', {
            fontSize: '11px', color: '#ffd700', align: 'center',
        }).setOrigin(0.5);
        c.add(tips);
    }

    // ============================================================
    // Page 5: 盛り付けルール
    // ============================================================
    page_placement() {
        const { width } = this.cameras.main;
        const c = this.contentContainer;
        const scoring = this.registry.get('data_scoring');
        const ingredients = this.registry.get('data_ingredients');
        this._title(c, '🎨 盛り付け（3×3グリッド）');

        // グリッド例
        const gX = 160, gY = 75, cs = 52, gap = 3;
        for (let r = 0; r < 3; r++) {
            for (let col = 0; col < 3; col++) {
                const cx = gX + col * (cs + gap), cy = gY + r * (cs + gap);
                const isC = r === 1 && col === 1;
                const rect = this.add.rectangle(cx, cy, cs, cs, isC ? 0x3a6b35 : GAME_CONFIG.COLORS.GRID_EMPTY, 0.5)
                    .setStrokeStyle(1, isC ? 0xffd700 : 0x8b6914, 0.4);
                c.add(rect);
                if (isC) {
                    const cl = this.add.text(cx, cy + cs / 2 + 8, `中央+${scoring.centerBonus}点`, { fontSize: '8px', color: '#ffd700' }).setOrigin(0.5);
                    c.add(cl);
                }
            }
        }

        const sample = [['ing_chashu', 'ing_negi', 'ing_nori'], ['ing_nitamago', 'ing_menma', null], ['ing_ebi', null, 'ing_corn']];
        sample.forEach((row, r) => {
            row.forEach((key, col) => {
                if (!key) return;
                const cx = gX + col * (cs + gap), cy = gY + r * (cs + gap);
                const img = this.add.image(cx, cy, key).setDisplaySize(34, 34);
                c.add(img);
            });
        });

        const placeNote = this.add.text(gX, gY + 3 * (cs + gap) + 16, '制限時間 60秒\n全9枚置かなくてもOK（空きマスも戦略）', {
            fontSize: '10px', color: '#aaa', align: 'center',
        }).setOrigin(0.5, 0);
        c.add(placeNote);

        // 右側: 採点要素
        const infoX = 390;
        let y = 55;

        // 隣接ボーナス
        const ingMap = {};
        ingredients.forEach(i => { ingMap[i.id] = i; });

        const adjT = this.add.text(infoX, y, '✅ 良い隣接（各+2点）', { fontSize: '13px', color: '#27ae60', fontStyle: 'bold' });
        c.add(adjT);
        y += 18;
        scoring.adjacencyGoodPairs.pairs.forEach(pair => {
            const a = ingMap[pair[0]]?.name || pair[0], b = ingMap[pair[1]]?.name || pair[1];
            const t = this.add.text(infoX + 8, y, `${a} ↔ ${b}`, { fontSize: '11px', color: '#ccc' });
            c.add(t);
            y += 15;
        });

        y += 6;
        const badT = this.add.text(infoX, y, '❌ 悪い隣接（各-1点）', { fontSize: '13px', color: '#e74c3c', fontStyle: 'bold' });
        c.add(badT);
        y += 18;
        scoring.adjacencyBadPairs.pairs.forEach(pair => {
            const a = ingMap[pair[0]]?.name || pair[0], b = ingMap[pair[1]]?.name || pair[1];
            const t = this.add.text(infoX + 8, y, `${a} ↔ ${b}`, { fontSize: '11px', color: '#ccc' });
            c.add(t);
            y += 15;
        });

        y += 6;
        const colT = this.add.text(infoX, y, '🌈 彩りボーナス（色タグの種類数）', { fontSize: '13px', color: '#ffd700', fontStyle: 'bold' });
        c.add(colT);
        y += 18;
        [1, 2, 3, 4, 5, 6, 7].forEach(n => {
            const pts = scoring.colorBonus[n];
            const t = this.add.text(infoX + 8, y, `${n}色: +${pts}点${n >= 5 ? ' ★' : ''}`, {
                fontSize: '11px', color: n >= 5 ? '#00ff00' : n >= 4 ? '#ffff00' : '#ccc',
            });
            c.add(t);
            y += 14;
        });

        y += 6;
        const otherT = this.add.text(infoX, y, '⚠️ その他', { fontSize: '13px', color: '#ff6b35', fontStyle: 'bold' });
        c.add(otherT);
        y += 18;
        const rules = [
            `中央マスに配置: +${scoring.centerBonus}点`,
            `同じ具材2枚以上: ${scoring.duplicatePenalty}点/枚`,
            '空きマスも戦略（余白の美学称号など）',
            '※隣接 = 上下左右に隣り合うマス',
        ];
        rules.forEach(r => {
            const t = this.add.text(infoX + 8, y, r, { fontSize: '10px', color: '#aaa' });
            c.add(t);
            y += 14;
        });
    }

    // ============================================================
    // Page 6: 基本採点の仕組み
    // ============================================================
    page_scoringBase() {
        const { width } = this.cameras.main;
        const c = this.contentContainer;
        this._title(c, '📊 採点システム（4レイヤー）');

        const layers = [
            {
                label: 'Layer 1: 基本ルール', color: '#27ae60', icon: '🍲',
                items: [
                    'スープ×麺の相性 (0〜4点)',
                    '彩りボーナス: 色タグの種類数 (0〜8点)',
                    '良い隣接ペア: 各+2点 (最大8組)',
                    '悪い隣接ペア: 各-1点 (最大3組)',
                    '中央マスボーナス: +1点',
                    '重複ペナルティ: 同じ具材2枚以上で-1点/枚',
                ],
            },
            {
                label: 'Layer 2: キャラボーナス', color: '#3498db', icon: '👨‍🍳',
                items: [
                    '選んだ職人のボーナス条件をチェック (最大+12点)',
                    '例: ケンジ → 豚骨+3、細麺+2、紅しょうが+2 ...',
                    '職人選びが戦略の第一歩！',
                ],
            },
            {
                label: 'Layer 3: 審査員評価', color: '#e67e22', icon: '👥',
                items: [
                    '毎回ランダムに2人の審査員が登場',
                    '審査員ごとに好みの条件がある (各最大+11点)',
                    '全員に公開されるので、好みに合わせるかは自分次第',
                    '⚠️ 審査員の好みに合わないと加点なし！',
                ],
            },
            {
                label: 'Layer 4: 称号セレモニー', color: '#9b59b6', icon: '🏆',
                items: [
                    '比較系: 最も○○なプレイヤーに称号 (各+4点)',
                    '達成系: 条件を満たせば全員取得可能 (+3〜5点)',
                    '例: 全部のせ(9マス埋め)、レインボー(6色以上) ...',
                ],
            },
        ];

        let y = 52;
        layers.forEach(layer => {
            const h = 16 + layer.items.length * 14;
            const bg = this.add.rectangle(width / 2, y + h / 2 + 6, 700, h + 8, 0x222222, 0.5)
                .setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(layer.color).color, 0.6);
            c.add(bg);

            const title = this.add.text(55, y, `${layer.icon} ${layer.label}`, {
                fontSize: '14px', color: layer.color, fontStyle: 'bold',
            });
            c.add(title);
            y += 18;

            layer.items.forEach(item => {
                const t = this.add.text(75, y, `• ${item}`, { fontSize: '11px', color: '#bbb' });
                c.add(t);
                y += 14;
            });
            y += 12;
        });

        const formula = this.add.text(width / 2, y + 4,
            '合計点 = L1(基本) + L2(キャラ) + L3(審査員) + L4(称号)', {
                fontSize: '13px', color: '#ffd700', fontStyle: 'bold',
            }).setOrigin(0.5);
        c.add(formula);
    }

    // ============================================================
    // Page 7: キャラクター一覧
    // ============================================================
    page_characters() {
        const { width } = this.cameras.main;
        const c = this.contentContainer;
        const characters = this.registry.get('data_characters');
        this._title(c, '👨‍🍳 ラーメン職人（全6人）');

        const sub = this.add.text(width / 2, 50, '職人ごとにボーナス条件が異なる。得意スタイルに合った戦略を組もう！', {
            fontSize: '11px', color: '#999',
        }).setOrigin(0.5);
        c.add(sub);

        // 2列3行
        characters.forEach((ch, idx) => {
            const col = idx % 2;
            const row = Math.floor(idx / 2);
            const bx = col === 0 ? 200 : 600;
            const by = 100 + row * 150;

            // 背景
            const bg = this.add.rectangle(bx, by + 10, 370, 130, 0x2a1a0e, 0.5).setStrokeStyle(1, 0x8b6914, 0.4);
            c.add(bg);

            // 画像
            const img = this.add.image(bx - 155, by + 10, ch.spriteKey).setDisplaySize(48, 48);
            c.add(img);

            // 名前・スタイル
            const name = this.add.text(bx - 120, by - 30, ch.name, { fontSize: '14px', color: '#f5e6ca', fontStyle: 'bold' });
            c.add(name);
            const style = this.add.text(bx - 120, by - 14, ch.playstyle, { fontSize: '10px', color: '#ff6b35' });
            c.add(style);
            const quote = this.add.text(bx - 120, by, `「${ch.quote}」`, { fontSize: '9px', color: '#888', fontStyle: 'italic' });
            c.add(quote);

            // ボーナス条件
            let bonusY = by + 16;
            ch.bonuses.forEach(b => {
                const t = this.add.text(bx - 120, bonusY, `+${b.points}  ${b.label}`, {
                    fontSize: '10px', color: '#ccc',
                });
                c.add(t);
                bonusY += 13;
            });

            // 最大ボーナス
            const max = this.add.text(bx + 155, by - 30, `最大+${ch.maxBonus}`, {
                fontSize: '11px', color: '#ffd700',
            }).setOrigin(1, 0);
            c.add(max);
        });
    }

    // ============================================================
    // Page 8: 審査員一覧
    // ============================================================
    page_customers() {
        const { width } = this.cameras.main;
        const c = this.contentContainer;
        const customers = this.registry.get('data_customers');
        this._title(c, '👥 審査員（全10人 / 毎回ランダム2人）');

        const sub = this.add.text(width / 2, 50,
            '毎試合ランダムに2人が選ばれ全プレイヤーのラーメンを審査する。好みに合わせると高得点！', {
                fontSize: '10px', color: '#999', wordWrap: { width: 700 }, align: 'center',
            }).setOrigin(0.5);
        c.add(sub);

        // 2列5行
        customers.forEach((cu, idx) => {
            const col = idx % 2;
            const row = Math.floor(idx / 2);
            const bx = col === 0 ? 200 : 600;
            const by = 82 + row * 88;

            const bg = this.add.rectangle(bx, by + 6, 370, 78, 0x1a2a1e, 0.4).setStrokeStyle(1, 0x4a6a4e, 0.3);
            c.add(bg);

            const img = this.add.image(bx - 158, by + 6, cu.spriteKey).setDisplaySize(36, 36);
            c.add(img);

            const name = this.add.text(bx - 130, by - 18, `${cu.name}`, { fontSize: '12px', color: '#f5e6ca', fontStyle: 'bold' });
            c.add(name);
            const type = this.add.text(bx - 40, by - 18, `[${cu.type}]`, { fontSize: '10px', color: '#ff6b35' });
            c.add(type);
            const q = this.add.text(bx - 130, by - 4, `「${cu.quote}」`, { fontSize: '9px', color: '#777', fontStyle: 'italic' });
            c.add(q);

            let bonusX = bx - 130;
            let bonusY = by + 10;
            cu.bonuses.forEach(b => {
                const t = this.add.text(bonusX, bonusY, `+${b.points} ${b.label}`, { fontSize: '9px', color: '#aaa' });
                c.add(t);
                bonusY += 12;
            });

            const max = this.add.text(bx + 158, by - 18, `最大+${cu.maxBonus}`, { fontSize: '10px', color: '#ffd700' }).setOrigin(1, 0);
            c.add(max);
        });
    }

    // ============================================================
    // Page 9: 称号一覧 + 管理者リンク
    // ============================================================
    page_titles() {
        const { width } = this.cameras.main;
        const c = this.contentContainer;
        const titles = this.registry.get('data_titles');
        this._title(c, '🏆 称号セレモニー');

        const sub = this.add.text(width / 2, 50,
            '採点後、条件を満たしたプレイヤーに称号が授与されボーナス点が加算される', {
                fontSize: '11px', color: '#999',
            }).setOrigin(0.5);
        c.add(sub);

        let y = 75;

        // 比較系
        const compT = this.add.text(50, y, '⚔️ 比較系（プレイヤー間で最も優れた者に授与）', {
            fontSize: '13px', color: '#e67e22', fontStyle: 'bold',
        });
        c.add(compT);
        y += 22;

        titles.comparative.forEach(t => {
            const bg = this.add.rectangle(width / 2, y + 10, 700, 36, 0x2a1a0e, 0.4).setStrokeStyle(1, 0x8b6914, 0.2);
            c.add(bg);
            const emoji = this.add.text(50, y + 10, t.emoji, { fontSize: '18px' }).setOrigin(0, 0.5);
            c.add(emoji);
            const name = this.add.text(80, y + 4, t.name, { fontSize: '13px', color: '#f5e6ca', fontStyle: 'bold' });
            c.add(name);
            const pts = this.add.text(200, y + 4, `+${t.points}点`, { fontSize: '12px', color: '#ffd700' });
            c.add(pts);
            const ann = this.add.text(260, y + 4, `「${t.announcement}」`, { fontSize: '10px', color: '#888' });
            c.add(ann);
            const cond = this.add.text(80, y + 20, this._conditionLabel(t.condition), { fontSize: '9px', color: '#777' });
            c.add(cond);
            y += 42;
        });

        y += 8;

        // 達成系
        const achT = this.add.text(50, y, '🎯 達成系（条件を満たせば複数人が同時に取得可能）', {
            fontSize: '13px', color: '#9b59b6', fontStyle: 'bold',
        });
        c.add(achT);
        y += 22;

        titles.achievement.forEach(t => {
            const bg = this.add.rectangle(width / 2, y + 10, 700, 36, 0x1a1a2e, 0.4).setStrokeStyle(1, 0x6a4a8e, 0.2);
            c.add(bg);
            const emoji = this.add.text(50, y + 10, t.emoji, { fontSize: '18px' }).setOrigin(0, 0.5);
            c.add(emoji);
            const name = this.add.text(80, y + 4, t.name, { fontSize: '13px', color: '#f5e6ca', fontStyle: 'bold' });
            c.add(name);
            const pts = this.add.text(220, y + 4, `+${t.points}点`, { fontSize: '12px', color: '#ffd700' });
            c.add(pts);
            const ann = this.add.text(280, y + 4, `「${t.announcement}」`, { fontSize: '10px', color: '#888' });
            c.add(ann);
            const cond = this.add.text(80, y + 20, this._conditionLabel(t.condition), { fontSize: '9px', color: '#777' });
            c.add(cond);
            y += 42;
        });

        // 管理者リンク
        this.showAdminLink();
    }

    // ============================================================
    // 管理者ログイン
    // ============================================================
    showAdminLink() {
        const { width } = this.cameras.main;
        const c = this.contentContainer;
        const adminLink = this.add.text(width - 30, 555, '⚙️', {
            fontSize: '16px', color: '#444',
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true }).setDepth(50);
        c.add(adminLink);
        adminLink.on('pointerover', () => adminLink.setColor('#666'));
        adminLink.on('pointerout', () => adminLink.setColor('#444'));
        adminLink.on('pointerdown', () => this.showPasswordDialog());
    }

    showPasswordDialog() {
        if (this.adminOverlay) return;
        const overlay = document.createElement('div');
        overlay.id = 'admin-pw-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:10000;';
        const box = document.createElement('div');
        box.style.cssText = 'background:#2a2a3e;border:1px solid #8b6914;border-radius:12px;padding:32px;text-align:center;max-width:360px;width:90%;';
        box.innerHTML = '<h3 style="color:#f5e6ca;margin-bottom:16px;font-size:18px;">🔒 管理者ログイン</h3><input type="password" id="admin-pw-input" placeholder="パスワード" style="width:100%;padding:10px 14px;border:1px solid #555;border-radius:6px;background:#1a1a2e;color:#fff;font-size:16px;margin-bottom:12px;outline:none;"><div style="display:flex;gap:12px;justify-content:center;"><button id="admin-pw-cancel" style="padding:10px 24px;border:1px solid #555;border-radius:6px;background:transparent;color:#ccc;cursor:pointer;font-size:14px;">キャンセル</button><button id="admin-pw-submit" style="padding:10px 24px;border:none;border-radius:6px;background:#c0392b;color:#fff;cursor:pointer;font-size:14px;">ログイン</button></div><p id="admin-pw-error" style="color:#e74c3c;font-size:13px;margin-top:8px;"></p>';
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        this.adminOverlay = overlay;
        const input = document.getElementById('admin-pw-input');
        input.focus();
        document.getElementById('admin-pw-cancel').addEventListener('click', () => this.closePasswordDialog());
        overlay.addEventListener('click', (e) => { if (e.target === overlay) this.closePasswordDialog(); });
        const doLogin = async () => {
            const password = input.value;
            const errEl = document.getElementById('admin-pw-error');
            if (!password) { errEl.textContent = 'パスワードを入力してください'; return; }
            try {
                const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
                const data = await res.json();
                if (!res.ok) { errEl.textContent = data.error; return; }
                sessionStorage.setItem('adminToken', data.token);
                this.closePasswordDialog();
                window.location.href = `/admin.html?token=${data.token}`;
            } catch (e) { errEl.textContent = '通信エラー'; }
        };
        document.getElementById('admin-pw-submit').addEventListener('click', doLogin);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });
    }

    closePasswordDialog() {
        if (this.adminOverlay) { this.adminOverlay.remove(); this.adminOverlay = null; }
    }

    // ============================================================
    // ヘルパー
    // ============================================================
    _title(container, text) {
        const { width } = this.cameras.main;
        const t = this.add.text(width / 2, 26, text, {
            fontSize: '22px', color: GAME_CONFIG.COLORS.TEXT_PRIMARY, fontStyle: 'bold',
        }).setOrigin(0.5);
        container.add(t);
    }

    _conditionLabel(cond) {
        const map = {
            most_placed_count: '最も多くの具材を配置したプレイヤー',
            highest_art_score: '彩りボーナスが最も高いプレイヤー',
            highest_taste_score: '基本ルール点(L1)が最も高いプレイヤー',
            regional_set_complete: 'ご当地セットを完成させた',
            symmetrical_blanks_with_min2: '空きマス2つ以上かつ左右対称',
            placed_count_eq_9: '9マス全てに具材を配置',
            color_count_gte_6: '色タグ6種類以上を使用',
            unique_ingredients_gte_3: '他の全プレイヤーと被らない具材を3つ以上',
            customer_all_conditions_met: '審査員1人の全条件を満たした',
        };
        return '条件: ' + (map[cond] || cond);
    }
}
