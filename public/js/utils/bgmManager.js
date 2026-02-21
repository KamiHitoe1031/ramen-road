/**
 * BGMManager - シーン間でBGMを管理するシングルトン
 * 同じBGMキーなら再起動しない（シームレス遷移）
 */
class BGMManager {
    constructor() {
        this.currentKey = null;
        this.currentSound = null;
        this.volume = 0.3;
    }

    /**
     * シーンに応じたBGMを再生（同じ曲なら何もしない）
     * @param {Phaser.Scene} scene - 現在のシーン
     * @param {string} bgmKey - BGMキー（例: 'bgm_lobby'）
     */
    play(scene, bgmKey) {
        if (!bgmKey) return;

        // 同じBGMなら何もしない
        if (this.currentKey === bgmKey && this.currentSound && this.currentSound.isPlaying) {
            return;
        }

        // 前のBGMを停止
        this.stop();

        // BGMが読み込まれているか確認
        if (!scene.cache.audio.exists(bgmKey)) {
            console.warn(`[BGM] ${bgmKey} not loaded, skipping`);
            return;
        }

        try {
            this.currentSound = scene.sound.add(bgmKey, {
                loop: true,
                volume: this.volume,
            });
            this.currentSound.play();
            this.currentKey = bgmKey;
            console.log(`[BGM] Playing: ${bgmKey}`);
        } catch (e) {
            console.warn(`[BGM] Failed to play ${bgmKey}:`, e.message);
        }
    }

    /** BGMを停止 */
    stop() {
        if (this.currentSound) {
            try {
                this.currentSound.stop();
                this.currentSound.destroy();
            } catch (e) {
                // 既にdestroy済みの場合無視
            }
            this.currentSound = null;
            this.currentKey = null;
        }
    }

    /** 音量設定 */
    setVolume(vol) {
        this.volume = vol;
        if (this.currentSound) {
            this.currentSound.setVolume(vol);
        }
    }
}

// グローバルシングルトン
window.bgmManager = new BGMManager();
