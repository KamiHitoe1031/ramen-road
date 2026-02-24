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
        // Phaserの sound.play をラップして SE 音量を自動適用
        const origAdd = Phaser.Sound.BaseSoundManager.prototype.play;
        const audioMgr = window.bgmManager;
        Phaser.Sound.BaseSoundManager.prototype.play = function (key, config) {
            if (key && key.startsWith('sfx_')) {
                config = config || {};
                if (audioMgr.seMuted) {
                    config.volume = 0;
                } else {
                    config.volume = (config.volume ?? 1) * audioMgr.seVolume;
                }
            }
            return origAdd.call(this, key, config);
        };

        this.scene.start(SCENES.PRELOAD);
    }
}
