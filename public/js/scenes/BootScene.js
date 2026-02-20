/**
 * BootScene - ローディング画面表示用の最小アセットを読み込む
 */
class BootScene extends Phaser.Scene {
    constructor() {
        super(SCENES.BOOT);
    }

    preload() {
        // ローディングバー用の最小限アセット（なければGraphicsで代用）
    }

    create() {
        this.scene.start(SCENES.PRELOAD);
    }
}
