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

        // 背景・UI
        this.load.image('bg_table', 'assets/images/backgrounds/bg_table.png');
        this.load.image('ui_btn_large', 'assets/images/ui/ui_btn_large.png');
        this.load.image('ui_btn_small', 'assets/images/ui/ui_btn_small.png');
        this.load.image('ui_card_back', 'assets/images/ui/ui_card_back.png');

        // 丼
        this.load.image('bowl_tonkotsu', 'assets/images/soup/bowl_tonkotsu.png');
        this.load.image('bowl_shoyu', 'assets/images/soup/bowl_shoyu.png');
        this.load.image('bowl_miso', 'assets/images/soup/bowl_miso.png');
        this.load.image('bowl_shio', 'assets/images/soup/bowl_shio.png');
        this.load.image('bowl_empty', 'assets/images/soup/bowl_empty.png');

        // キャラクター
        this.load.image('char_kenji', 'assets/images/characters/char_kenji.png');
        this.load.image('char_yuki', 'assets/images/characters/char_yuki.png');
        this.load.image('char_gen', 'assets/images/characters/char_gen.png');
        this.load.image('char_aya', 'assets/images/characters/char_aya.png');
        this.load.image('char_ryou', 'assets/images/characters/char_ryou.png');
        this.load.image('char_hana', 'assets/images/characters/char_hana.png');

        // お客さん
        this.load.image('customer_takeshi', 'assets/images/customers/customer_takeshi.png');
        this.load.image('customer_sakura', 'assets/images/customers/customer_sakura.png');
        this.load.image('customer_kouta', 'assets/images/customers/customer_kouta.png');
        this.load.image('customer_miho', 'assets/images/customers/customer_miho.png');
        this.load.image('customer_mike', 'assets/images/customers/customer_mike.png');
        this.load.image('customer_yoshiko', 'assets/images/customers/customer_yoshiko.png');
        this.load.image('customer_daisuke', 'assets/images/customers/customer_daisuke.png');
        this.load.image('customer_aoi', 'assets/images/customers/customer_aoi.png');
        this.load.image('customer_shinji', 'assets/images/customers/customer_shinji.png');
        this.load.image('customer_rei', 'assets/images/customers/customer_rei.png');

        // 具材
        this.load.image('ing_chashu', 'assets/images/ingredients/ing_chashu.png');
        this.load.image('ing_kakuni', 'assets/images/ingredients/ing_kakuni.png');
        this.load.image('ing_tori_chashu', 'assets/images/ingredients/ing_tori_chashu.png');
        this.load.image('ing_nitamago', 'assets/images/ingredients/ing_nitamago.png');
        this.load.image('ing_negi', 'assets/images/ingredients/ing_negi.png');
        this.load.image('ing_menma', 'assets/images/ingredients/ing_menma.png');
        this.load.image('ing_moyashi', 'assets/images/ingredients/ing_moyashi.png');
        this.load.image('ing_corn', 'assets/images/ingredients/ing_corn.png');
        this.load.image('ing_horenso', 'assets/images/ingredients/ing_horenso.png');
        this.load.image('ing_nori', 'assets/images/ingredients/ing_nori.png');
        this.load.image('ing_wakame', 'assets/images/ingredients/ing_wakame.png');
        this.load.image('ing_naruto', 'assets/images/ingredients/ing_naruto.png');
        this.load.image('ing_ebi', 'assets/images/ingredients/ing_ebi.png');
        this.load.image('ing_benishoga', 'assets/images/ingredients/ing_benishoga.png');
        this.load.image('ing_butter', 'assets/images/ingredients/ing_butter.png');
        this.load.image('ing_ninniku', 'assets/images/ingredients/ing_ninniku.png');
        this.load.image('ing_karamiso', 'assets/images/ingredients/ing_karamiso.png');
        this.load.image('ing_shirogoma', 'assets/images/ingredients/ing_shirogoma.png');

        // --- 音声アセット ---
        // Phase 4で実装
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
