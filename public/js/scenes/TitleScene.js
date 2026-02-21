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

        // BGM
        window.bgmManager.play(this, BGM_MAP[SCENES.TITLE]);

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
        this.createButton(width / 2, 340, '🎮 1人で練習', () => {
            this.registry.set(REGISTRY.PLAYER_COUNT, 3);
            this.registry.set('onlineMode', false);
            this.scene.start(SCENES.CHAR_SELECT);
        });

        // オンライン対戦ボタン
        this.createButton(width / 2, 430, '🌐 オンライン対戦', () => {
            this.scene.start(SCENES.LOBBY);
        });

        // 遊び方ボタン（テキストリンク風）
        const ruleBtn = this.add.text(width / 2, 500, '📖 遊び方・ルール説明', {
            fontSize: '18px',
            color: '#ff6b35',
            fontFamily: GAME_CONFIG.FONT.FAMILY,
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        ruleBtn.on('pointerover', () => ruleBtn.setColor('#ffaa77'));
        ruleBtn.on('pointerout', () => ruleBtn.setColor('#ff6b35'));
        ruleBtn.on('pointerdown', () => {
            this.sound.play('sfx_click');
            this.scene.start(SCENES.RULE);
        });

        // バージョン表示
        this.add.text(width / 2, height - 30, 'v0.3.0 - Online', {
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
        btn.on('pointerdown', () => {
            this.sound.play('sfx_click');
            callback();
        });

        return btn;
    }
}
