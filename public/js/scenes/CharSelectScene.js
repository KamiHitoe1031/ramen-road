/**
 * CharSelectScene - ラーメン屋キャラクターの選択
 */
class CharSelectScene extends Phaser.Scene {
    constructor() {
        super(SCENES.CHAR_SELECT);
    }

    init() {
        this.selectedCharId = null;
    }

    create() {
        const { width, height } = this.cameras.main;
        const characters = this.registry.get('data_characters');

        // 背景
        this.add.image(width / 2, height / 2, 'bg_table').setDisplaySize(width, height).setAlpha(0.3);

        this.add.text(width / 2, 30, '👨‍🍳 ラーメン屋を選べ！', {
            fontSize: GAME_CONFIG.FONT.HEADING_SIZE,
            color: GAME_CONFIG.COLORS.TEXT_PRIMARY,
        }).setOrigin(0.5);

        // キャラカードを2行3列で配置
        const cols = 3, startX = 140, startY = 90, gapX = 220, gapY = 220;

        characters.forEach((char, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const cx = startX + col * gapX;
            const cy = startY + row * gapY;

            // カード背景
            const card = this.add.rectangle(cx, cy + 60, 180, 190, 0x3a2a1a)
                .setInteractive({ useHandCursor: true })
                .setStrokeStyle(2, 0x8b6914);

            // キャラクター画像
            this.add.image(cx, cy + 10, char.spriteKey).setDisplaySize(80, 80);

            // 名前
            this.add.text(cx, cy + 55, char.name, {
                fontSize: '16px',
                color: GAME_CONFIG.COLORS.TEXT_PRIMARY,
                fontFamily: GAME_CONFIG.FONT.FAMILY,
            }).setOrigin(0.5);

            // プレイスタイル
            this.add.text(cx, cy + 80, char.playstyle, {
                fontSize: '12px',
                color: '#999999',
            }).setOrigin(0.5);

            // ボーナス概要（最初の2つだけ表示）
            const bonusPreview = char.bonuses.slice(0, 2).map(b => `+${b.points} ${b.label}`).join('\n');
            this.add.text(cx, cy + 115, bonusPreview, {
                fontSize: '11px',
                color: '#cccccc',
                align: 'center',
                lineSpacing: 4,
            }).setOrigin(0.5);

            // 選択
            card.on('pointerdown', () => {
                console.log('[CharSelect] Selected:', char.id, char.name);
                this.selectedCharId = char.id;
                this.registry.set(REGISTRY.SELECTED_CHARACTER, char.id);

                // ランダムにお客さんを2人選出
                const customers = this.registry.get('data_customers');
                const shuffled = Phaser.Utils.Array.Shuffle([...customers]);
                this.registry.set(REGISTRY.ACTIVE_CUSTOMERS, [shuffled[0].id, shuffled[1].id]);

                this.scene.start(SCENES.SOUP_NOODLE);
            });

            card.on('pointerover', () => card.setFillStyle(0x4a3a2a));
            card.on('pointerout', () => card.setFillStyle(0x3a2a1a));
        });
    }
}
