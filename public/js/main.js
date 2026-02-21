/**
 * Phaser ゲーム設定と起動
 */
const config = {
    type: Phaser.AUTO,
    width: GAME_CONFIG.WIDTH,
    height: GAME_CONFIG.HEIGHT,
    parent: 'game-container',
    backgroundColor: GAME_CONFIG.COLORS.BACKGROUND,
    dom: {
        createContainer: true, // DOM入力要素（LobbyScene用）
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [
        BootScene,
        PreloadScene,
        TitleScene,
        LobbyScene,
        WaitingScene,
        CharSelectScene,
        SoupNoodleScene,
        DraftScene,
        PlacementScene,
        ScoringScene,
        CeremonyScene,
        ResultScene,
        RuleScene,
    ],
};

const game = new Phaser.Game(config);
window.game = game; // 切断ハンドラーからアクセス用

console.log('[Game] Phaser initialized', {
    version: Phaser.VERSION,
    renderer: 'AUTO',
    size: `${GAME_CONFIG.WIDTH}x${GAME_CONFIG.HEIGHT}`
});
