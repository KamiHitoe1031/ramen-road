/**
 * SoupNoodleScene - スープと麺の選択
 * 1画面で順番に選択する
 */
class SoupNoodleScene extends Phaser.Scene {
    constructor() {
        super(SCENES.SOUP_NOODLE);
    }

    init() {
        this.phase = 'soup'; // 'soup' → 'noodle'
    }

    create() {
        const { width, height } = this.cameras.main;
        this.showSoupSelect();
    }

    showSoupSelect() {
        const { width, height } = this.cameras.main;
        const soups = this.registry.get('data_soups');

        // 前のUIをクリア
        this.children.removeAll();

        // 背景
        this.add.image(width / 2, height / 2, 'bg_table').setDisplaySize(width, height).setAlpha(0.3);

        this.add.text(width / 2, 60, '🍲 スープを選べ！', {
            fontSize: GAME_CONFIG.FONT.HEADING_SIZE,
            color: GAME_CONFIG.COLORS.TEXT_PRIMARY,
        }).setOrigin(0.5);

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
                console.log('[SoupNoodle] Soup selected:', soup.id, soup.name);
                this.registry.set(REGISTRY.SELECTED_SOUP, soup.id);
                this.showNoodleSelect();
            });

            bowlImg.on('pointerover', () => bowlImg.setScale(1.15));
            bowlImg.on('pointerout', () => bowlImg.setScale(1));
        });
    }

    showNoodleSelect() {
        const { width, height } = this.cameras.main;
        const noodles = this.registry.get('data_noodles');

        this.children.removeAll();

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
                console.log('[SoupNoodle] Noodle selected:', noodle.id, noodle.name, 'compat:', compat);
                this.registry.set(REGISTRY.SELECTED_NOODLE, noodle.id);
                this.dealHand();
            });

            card.on('pointerover', () => card.setFillStyle(0x4a3a2a));
            card.on('pointerout', () => card.setFillStyle(0x3a2a1a));
        });
    }

    /** Phase 1: ランダムに9枚配る（ドラフトなし） */
    dealHand() {
        const ingredients = this.registry.get('data_ingredients');

        // カードプール生成（各具材のcardCount枚ずつ）
        let pool = [];
        ingredients.forEach(ing => {
            for (let i = 0; i < ing.cardCount; i++) {
                pool.push(ing.id);
            }
        });

        // シャッフルして9枚配る
        Phaser.Utils.Array.Shuffle(pool);
        const hand = pool.slice(0, 9);

        this.registry.set(REGISTRY.PLAYER_HAND, hand);

        console.log('[SoupNoodle] Hand dealt:', hand);

        // Phase 1: ドラフトスキップ、直接盛り付けへ
        this.scene.start(SCENES.PLACEMENT);
    }
}
