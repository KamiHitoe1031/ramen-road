/**
 * PreloadScene - 全JSONデータ＋アセットを読み込む
 * ローディングバーを表示する
 */
class PreloadScene extends Phaser.Scene {
    constructor() {
        super(SCENES.PRELOAD);
    }

    preload() {
        // --- ローディングバー ---
        const { width, height } = this.cameras.main;
        const barW = 400, barH = 30;
        const barX = (width - barW) / 2;
        const barY = height / 2;

        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x333333, 0.8);
        progressBox.fillRect(barX, barY, barW, barH);

        const progressBar = this.add.graphics();

        this.add.text(width / 2, barY - 40, '🍜 らーめん道', {
            fontSize: GAME_CONFIG.FONT.HEADING_SIZE,
            color: GAME_CONFIG.COLORS.TEXT_PRIMARY,
        }).setOrigin(0.5);

        const loadingText = this.add.text(width / 2, barY + 50, '準備中...', {
            fontSize: GAME_CONFIG.FONT.SMALL_SIZE,
            color: GAME_CONFIG.COLORS.TEXT_PRIMARY,
        }).setOrigin(0.5);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0xff6b35, 1);
            progressBar.fillRect(barX + 4, barY + 4, (barW - 8) * value, barH - 8);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });

        // --- JSONデータ ---
        this.load.json('ingredients', 'assets/data/ingredients.json');
        this.load.json('soups', 'assets/data/soups.json');
        this.load.json('noodles', 'assets/data/noodles.json');
        this.load.json('characters', 'assets/data/characters.json');
        this.load.json('customers', 'assets/data/customers.json');
        this.load.json('scoring', 'assets/data/scoring.json');
        this.load.json('titles', 'assets/data/titles.json');

        // --- 画像アセット ---
        // Phase 4で本番画像に差し替え。現在はプレースホルダー（Graphicsで描画）
        // this.load.image('bg_table', 'assets/images/backgrounds/bg_table.png');
        // this.load.image('bowl_tonkotsu', 'assets/images/soup/bowl_tonkotsu.png');
        // etc.

        // --- 音声アセット ---
        // Phase 4で実装
        // this.load.audio('bgm_lobby', ['assets/audio/bgm/bgm_lobby.ogg']);
        // this.load.audio('sfx_card_pick', 'assets/audio/sfx/sfx_card_pick.mp3');
    }

    create() {
        // JSONデータをレジストリ経由で共有（他シーンからアクセスしやすいように）
        this.registry.set('data_ingredients', this.cache.json.get('ingredients'));
        this.registry.set('data_soups', this.cache.json.get('soups'));
        this.registry.set('data_noodles', this.cache.json.get('noodles'));
        this.registry.set('data_characters', this.cache.json.get('characters'));
        this.registry.set('data_customers', this.cache.json.get('customers'));
        this.registry.set('data_scoring', this.cache.json.get('scoring'));
        this.registry.set('data_titles', this.cache.json.get('titles'));

        this.scene.start(SCENES.TITLE);
    }
}
