/**
 * ゲーム定数
 * マジックナンバーは全てここに集約する
 */
const GAME_CONFIG = {
    // 画面サイズ
    WIDTH: 800,
    HEIGHT: 600,

    // グリッド設定
    GRID_SIZE: 3,
    GRID_CELL_SIZE: 80,         // px
    GRID_PADDING: 8,            // セル間のパディング
    GRID_OFFSET_X: 400,         // グリッド中央のX座標
    GRID_OFFSET_Y: 260,         // グリッド中央のY座標

    // 丼の設定
    BOWL_SIZE: 256,

    // カードサイズ
    CARD_WIDTH: 64,
    CARD_HEIGHT: 80,
    CARD_HAND_Y: 520,           // 手札のY座標

    // タイマー（秒）
    TIMER_CHAR_SELECT: 15,
    TIMER_SOUP_SELECT: 10,
    TIMER_NOODLE_SELECT: 10,
    TIMER_DRAFT_TURN: 15,
    TIMER_PLACEMENT: 60,

    // プレイヤー人数
    MIN_PLAYERS: 3,
    MAX_PLAYERS: 4,

    // ドラフト設定
    DRAFT_HAND_SIZE: { 3: 10, 4: 9 },
    DRAFT_PICKS: 9,

    // 色テーマ
    COLORS: {
        BACKGROUND: 0x2d1b0e,       // ダークブラウン（木目テーブル風）
        GRID_EMPTY: 0x4a3728,       // グリッド空マス
        GRID_HIGHLIGHT: 0x6b5341,   // グリッドホバー時
        GRID_VALID: 0x3a6b35,       // 配置可能
        TEXT_PRIMARY: '#f5e6ca',     // メインテキスト（クリーム色）
        TEXT_ACCENT: '#ff6b35',      // アクセントテキスト（暖かいオレンジ）
        TEXT_SCORE: '#ffd700',       // スコア（ゴールド）
        BTN_PRIMARY: 0xc0392b,      // ボタン（赤）
        BTN_HOVER: 0xe74c3c,        // ボタンホバー
        BTN_TEXT: '#ffffff',
        CARD_BG: 0xf5e6ca,          // カード背景
        CARD_BORDER: 0x8b6914,      // カード枠
        OVERLAY: 0x000000,          // オーバーレイ
    },

    // 色タグ→表示色マッピング（プレースホルダー用）
    COLOR_TAG_MAP: {
        red:    0xe74c3c,
        green:  0x27ae60,
        yellow: 0xf1c40f,
        white:  0xecf0f1,
        brown:  0x8b6914,
        black:  0x2c3e50,
        pink:   0xe91e8c,
    },

    // カテゴリアイコン
    CATEGORY_EMOJI: {
        meat: '🥩',
        egg: '🥚',
        vegetable: '🥬',
        seafood: '🌊',
        topping: '🎭',
    },

    // フォント設定
    FONT: {
        FAMILY: 'Arial, "Hiragino Kaku Gothic ProN", sans-serif',
        TITLE_SIZE: '36px',
        HEADING_SIZE: '28px',
        BODY_SIZE: '20px',
        SMALL_SIZE: '16px',
        SCORE_SIZE: '24px',
    },
};

// シーンキー
const SCENES = {
    BOOT: 'BootScene',
    PRELOAD: 'PreloadScene',
    TITLE: 'TitleScene',
    LOBBY: 'LobbyScene',
    WAITING: 'WaitingScene',
    CHAR_SELECT: 'CharSelectScene',
    SOUP_NOODLE: 'SoupNoodleScene',
    DRAFT: 'DraftScene',
    PLACEMENT: 'PlacementScene',
    SCORING: 'ScoringScene',
    CEREMONY: 'CeremonyScene',
    RESULT: 'ResultScene',
    RULE: 'RuleScene',
};

// BGMマッピング（シーン → BGMキー）
const BGM_MAP = {
    [SCENES.TITLE]: 'bgm_lobby',
    [SCENES.LOBBY]: 'bgm_lobby',
    [SCENES.WAITING]: 'bgm_lobby',
    [SCENES.CHAR_SELECT]: 'bgm_draft',
    [SCENES.SOUP_NOODLE]: 'bgm_draft',
    [SCENES.DRAFT]: 'bgm_draft',
    [SCENES.PLACEMENT]: 'bgm_placement',
    [SCENES.SCORING]: 'bgm_result',
    [SCENES.CEREMONY]: 'bgm_result',
    [SCENES.RESULT]: 'bgm_result',
    [SCENES.RULE]: 'bgm_lobby',
};

// レジストリキー（シーン間データ共有）
const REGISTRY = {
    PLAYER_NAME: 'playerName',
    PLAYER_COUNT: 'playerCount',
    SELECTED_CHARACTER: 'selectedCharacter',
    SELECTED_SOUP: 'selectedSoup',
    SELECTED_NOODLE: 'selectedNoodle',
    ACTIVE_CUSTOMERS: 'activeCustomers',
    PLAYER_HAND: 'playerHand',
    PLAYER_GRID: 'playerGrid',
    SCORING_RESULT: 'scoringResult',
    ALL_PLAYERS: 'allPlayers',          // Phase 2以降: AI含む全プレイヤーデータ
    FINAL_SCORES: 'finalScores',        // 最終スコア（称号ボーナス込み）
};
