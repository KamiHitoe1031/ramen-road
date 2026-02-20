/**
 * SoupNoodleScene - スープと麺の選択
 * 1画面で順番に選択する（各フェーズにタイマー付き）
 */
class SoupNoodleScene extends Phaser.Scene {
    constructor() {
        super(SCENES.SOUP_NOODLE);
    }

    init() {
        this.phase = 'soup'; // 'soup' → 'noodle'
        this.decided = false;
    }

    create() {
        this.showSoupSelect();
    }

    showSoupSelect() {
        const { width, height } = this.cameras.main;
        const soups = this.registry.get('data_soups');
        this.decided = false;

        // 前のUIをクリア
        this.children.removeAll();
        this.time.removeAllEvents();

        // 背景
        this.add.image(width / 2, height / 2, 'bg_table').setDisplaySize(width, height).setAlpha(0.3);

        this.add.text(width / 2, 60, '🍲 スープを選べ！', {
            fontSize: GAME_CONFIG.FONT.HEADING_SIZE,
            color: GAME_CONFIG.COLORS.TEXT_PRIMARY,
        }).setOrigin(0.5);

        // タイマー
        let timer = GAME_CONFIG.TIMER_SOUP_SELECT;
        const timerText = this.add.text(width - 20, 20, `${timer}秒`, {
            fontSize: '22px',
            color: GAME_CONFIG.COLORS.TEXT_ACCENT,
        }).setOrigin(1, 0);

        this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (this.decided) return;
                timer--;
                timerText.setText(`${timer}秒`);
                if (timer <= 5) {
                    timerText.setColor('#ff0000');
                    this.sound.play('sfx_timer_warn');
                }
                if (timer <= 0) {
                    const randomSoup = Phaser.Utils.Array.GetRandom(soups);
                    this.selectSoup(randomSoup.id);
                }
            },
            loop: true,
        });

        soups.forEach((soup, i) => {
            const x = 120 + i * 160;
            const y = 280;

            // 丼画像
            const bowlImg = this.add.image(x, y - 30, soup.spriteKey)
                .setDisplaySize(100, 100)
                .setInteractive({ useHandCursor: true });

            this.add.text(x, y + 40, soup.name, {
                fontSize: '20px',
                color: GAME_CONFIG.COLORS.TEXT_PRIMARY,
            }).setOrigin(0.5);

            this.add.text(x, y + 65, soup.description, {
                fontSize: '12px',
                color: '#999999',
                wordWrap: { width: 140 },
                align: 'center',
            }).setOrigin(0.5);

            bowlImg.on('pointerdown', () => {
                if (this.decided) return;
                this.sound.play('sfx_click');
                this.selectSoup(soup.id);
            });

            bowlImg.on('pointerover', () => bowlImg.setScale(1.15));
            bowlImg.on('pointerout', () => bowlImg.setScale(1));
        });
    }

    selectSoup(soupId) {
        if (this.decided) return;
        this.decided = true;
        console.log('[SoupNoodle] Soup selected:', soupId);
        this.registry.set(REGISTRY.SELECTED_SOUP, soupId);
        this.showNoodleSelect();
    }

    showNoodleSelect() {
        const { width, height } = this.cameras.main;
        const noodles = this.registry.get('data_noodles');
        this.decided = false;

        this.children.removeAll();
        this.time.removeAllEvents();

        // 背景
        this.add.image(width / 2, height / 2, 'bg_table').setDisplaySize(width, height).setAlpha(0.3);

        this.add.text(width / 2, 60, '🍜 麺を選べ！', {
            fontSize: GAME_CONFIG.FONT.HEADING_SIZE,
            color: GAME_CONFIG.COLORS.TEXT_PRIMARY,
        }).setOrigin(0.5);

        // 選択済みスープ表示
        const selectedSoup = this.registry.get('data_soups').find(s => s.id === this.registry.get(REGISTRY.SELECTED_SOUP));
        this.add.text(width / 2, 110, `スープ: ${selectedSoup.name}`, {
            fontSize: '16px',
            color: GAME_CONFIG.COLORS.TEXT_ACCENT,
        }).setOrigin(0.5);

        // タイマー
        let timer = GAME_CONFIG.TIMER_NOODLE_SELECT;
        const timerText = this.add.text(width - 20, 20, `${timer}秒`, {
            fontSize: '22px',
            color: GAME_CONFIG.COLORS.TEXT_ACCENT,
        }).setOrigin(1, 0);

        this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (this.decided) return;
                timer--;
                timerText.setText(`${timer}秒`);
                if (timer <= 5) {
                    timerText.setColor('#ff0000');
                    this.sound.play('sfx_timer_warn');
                }
                if (timer <= 0) {
                    const randomNoodle = Phaser.Utils.Array.GetRandom(noodles);
                    this.selectNoodle(randomNoodle.id);
                }
            },
            loop: true,
        });

        noodles.forEach((noodle, i) => {
            const x = 170 + i * 200;
            const y = 300;

            const card = this.add.rectangle(x, y, 160, 180, 0x3a2a1a)
                .setInteractive({ useHandCursor: true })
                .setStrokeStyle(2, 0x8b6914);

            this.add.text(x, y - 40, '🍜', { fontSize: '40px' }).setOrigin(0.5);

            this.add.text(x, y + 10, noodle.name, {
                fontSize: '22px',
                color: GAME_CONFIG.COLORS.TEXT_PRIMARY,
            }).setOrigin(0.5);

            this.add.text(x, y + 45, noodle.description, {
                fontSize: '11px',
                color: '#999999',
                wordWrap: { width: 140 },
                align: 'center',
            }).setOrigin(0.5);

            // スープ×麺相性プレビュー
            const scoring = this.registry.get('data_scoring');
            const compat = scoring.soupNoodleCompatibility[this.registry.get(REGISTRY.SELECTED_SOUP)][noodle.id];
            this.add.text(x, y + 75, `相性: +${compat}点`, {
                fontSize: '14px',
                color: compat >= 3 ? '#00ff00' : compat >= 2 ? '#ffff00' : '#ff6666',
            }).setOrigin(0.5);

            card.on('pointerdown', () => {
                if (this.decided) return;
                this.sound.play('sfx_click');
                this.selectNoodle(noodle.id);
            });

            card.on('pointerover', () => card.setFillStyle(0x4a3a2a));
            card.on('pointerout', () => card.setFillStyle(0x3a2a1a));
        });
    }

    selectNoodle(noodleId) {
        if (this.decided) return;
        this.decided = true;
        console.log('[SoupNoodle] Noodle selected:', noodleId);
        this.registry.set(REGISTRY.SELECTED_NOODLE, noodleId);
        this.startDraft();
    }

    /** カードプール生成 → ドラフトへ */
    startDraft() {
        const ingredients = this.registry.get('data_ingredients');
        const playerCount = this.registry.get(REGISTRY.PLAYER_COUNT) || 3;

        // カードプール生成（各具材のcardCount枚ずつ）
        let pool = [];
        ingredients.forEach(ing => {
            for (let i = 0; i < ing.cardCount; i++) {
                pool.push(ing.id);
            }
        });

        // シャッフル
        Phaser.Utils.Array.Shuffle(pool);

        // Phase 2: ドラフト用に手札を配布
        const handSize = GAME_CONFIG.DRAFT_HAND_SIZE[playerCount];
        const hands = [];
        for (let p = 0; p < playerCount; p++) {
            hands.push(pool.splice(0, handSize));
        }

        console.log('[SoupNoodle] Hands dealt for draft:', hands.map(h => h.length));

        // ドラフトシーンにデータを渡す
        this.scene.start(SCENES.DRAFT, { hands });
    }
}
