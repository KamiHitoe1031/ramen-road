/**
 * TitleScene - タイトル画面
 * 「1人で練習」「オンライン対戦」の選択（Phase 1では1人で練習のみ）
 */
class TitleScene extends Phaser.Scene {
    constructor() {
        super(SCENES.TITLE);
    }

    create() {
        const { width, height } = this.cameras.main;

        // 背景
        this.add.image(width / 2, height / 2, 'bg_table').setDisplaySize(width, height).setAlpha(0.4);

        // タイトル
        this.add.text(width / 2, 120, '🍜', { fontSize: '72px' }).setOrigin(0.5);
        this.add.text(width / 2, 200, 'らーめん道', {
            fontSize: GAME_CONFIG.FONT.TITLE_SIZE,
            color: GAME_CONFIG.COLORS.TEXT_PRIMARY,
            fontFamily: GAME_CONFIG.FONT.FAMILY,
        }).setOrigin(0.5);
        this.add.text(width / 2, 240, '～至高の一杯～', {
            fontSize: GAME_CONFIG.FONT.BODY_SIZE,
            color: GAME_CONFIG.COLORS.TEXT_ACCENT,
            fontFamily: GAME_CONFIG.FONT.FAMILY,
        }).setOrigin(0.5);

        // 1人で練習ボタン
        this.createButton(width / 2, 360, '🎮 1人で練習', () => {
            this.registry.set(REGISTRY.PLAYER_COUNT, 3); // AI2体と対戦
            this.scene.start(SCENES.CHAR_SELECT);
        });

        // オンライン対戦ボタン（Phase 3で有効化）
        const onlineBtn = this.createButton(width / 2, 440, '🌐 オンライン対戦', () => {
            // Phase 3で実装
        });
        onlineBtn.setAlpha(0.4);

        // バージョン表示
        this.add.text(width / 2, height - 30, 'v0.1.0 - Phase 1 MVP', {
            fontSize: '14px',
            color: '#666666',
        }).setOrigin(0.5);
    }

    createButton(x, y, label, callback) {
        const btn = this.add.rectangle(x, y, 280, 56, GAME_CONFIG.COLORS.BTN_PRIMARY, 1)
            .setInteractive({ useHandCursor: true });

        const text = this.add.text(x, y, label, {
            fontSize: GAME_CONFIG.FONT.BODY_SIZE,
            color: GAME_CONFIG.COLORS.BTN_TEXT,
            fontFamily: GAME_CONFIG.FONT.FAMILY,
        }).setOrigin(0.5);

        btn.on('pointerover', () => btn.setFillStyle(GAME_CONFIG.COLORS.BTN_HOVER));
        btn.on('pointerout', () => btn.setFillStyle(GAME_CONFIG.COLORS.BTN_PRIMARY));
        btn.on('pointerdown', callback);

        return btn;
    }
}
