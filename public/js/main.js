/**
 * Phaser ゲーム設定と起動
 */
const config = {
    type: Phaser.AUTO,
    width: GAME_CONFIG.WIDTH,
    height: GAME_CONFIG.HEIGHT,
    parent: 'game-container',
    backgroundColor: GAME_CONFIG.COLORS.BACKGROUND,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [
        BootScene,
        PreloadScene,
        TitleScene,
        CharSelectScene,
        SoupNoodleScene,
        DraftScene,
        PlacementScene,
        ScoringScene,
        CeremonyScene,
        ResultScene,
    ],
};

const game = new Phaser.Game(config);

console.log('[Game] Phaser initialized', {
    version: Phaser.VERSION,
    renderer: 'AUTO',
    size: `${GAME_CONFIG.WIDTH}x${GAME_CONFIG.HEIGHT}`
});
