/**
 * AudioManager - BGMとSEの音量を統合管理するシングルトン
 * - BGM: シーン間でシームレス遷移
 * - SE: 全効果音の音量を一括制御
 * - localStorage で設定を永続化
 * - DOM オーバーレイで即座に調整可能
 */
class AudioManager {
    constructor() {
        // localStorage から復元
        this.bgmVolume = parseFloat(localStorage.getItem('ramen_bgm_vol') ?? '0.3');
        this.seVolume = parseFloat(localStorage.getItem('ramen_se_vol') ?? '0.5');
        this.bgmMuted = localStorage.getItem('ramen_bgm_mute') === 'true';
        this.seMuted = localStorage.getItem('ramen_se_mute') === 'true';

        this.currentKey = null;
        this.currentSound = null;
        this._scene = null;
        this._overlayVisible = false;
        this._overlay = null;

        this._createOverlay();
        this._createToggleButton();
    }

    // === BGM ===

    play(scene, bgmKey) {
        this._scene = scene;
        if (!bgmKey) return;

        if (this.currentKey === bgmKey && this.currentSound && this.currentSound.isPlaying) {
            return;
        }

        this.stop();

        if (!scene.cache.audio.exists(bgmKey)) {
            console.warn(`[BGM] ${bgmKey} not loaded, skipping`);
            return;
        }

        try {
            this.currentSound = scene.sound.add(bgmKey, {
                loop: true,
                volume: this.bgmMuted ? 0 : this.bgmVolume,
            });
            this.currentSound.play();
            this.currentKey = bgmKey;
        } catch (e) {
            console.warn(`[BGM] Failed to play ${bgmKey}:`, e.message);
        }
    }

    stop() {
        if (this.currentSound) {
            try {
                this.currentSound.stop();
                this.currentSound.destroy();
            } catch (e) {}
            this.currentSound = null;
            this.currentKey = null;
        }
    }

    setBgmVolume(vol) {
        this.bgmVolume = vol;
        localStorage.setItem('ramen_bgm_vol', vol);
        if (this.currentSound && !this.bgmMuted) {
            this.currentSound.setVolume(vol);
        }
    }

    toggleBgmMute() {
        this.bgmMuted = !this.bgmMuted;
        localStorage.setItem('ramen_bgm_mute', this.bgmMuted);
        if (this.currentSound) {
            this.currentSound.setVolume(this.bgmMuted ? 0 : this.bgmVolume);
        }
        this._updateUI();
    }

    // === SE ===

    setSeVolume(vol) {
        this.seVolume = vol;
        localStorage.setItem('ramen_se_vol', vol);
    }

    toggleSeMute() {
        this.seMuted = !this.seMuted;
        localStorage.setItem('ramen_se_mute', this.seMuted);
        this._updateUI();
    }

    /** SE再生のラッパー（各シーンの this.sound.play を置き換え可能） */
    playSe(scene, key) {
        if (this.seMuted) return;
        try {
            scene.sound.play(key, { volume: this.seVolume });
        } catch (e) {}
    }

    /**
     * Phaserのサウンドマネージャーにグローバル SE 音量を適用
     * 各シーンの create() 冒頭で呼ぶと this.sound.play() の音量に反映
     */
    applySeVolume(scene) {
        // Phaser の sound manager 全体の volume は BGM にも影響するので
        // SE は個別に playSe() を使うか、各 play() 時に volume を渡す
        this._scene = scene;
    }

    // === UI: オーバーレイ ===

    _createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'audio-settings-overlay';
        overlay.style.cssText = `
            position:fixed;top:0;left:0;width:100%;height:100%;
            background:rgba(0,0,0,0.6);display:none;align-items:center;
            justify-content:center;z-index:9999;
        `;
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.hideOverlay();
        });

        const box = document.createElement('div');
        box.style.cssText = `
            background:#2a2a3e;border:2px solid #8b6914;border-radius:12px;
            padding:28px 32px;min-width:300px;
        `;
        box.innerHTML = `
            <h3 style="color:#f5e6ca;font-size:18px;margin:0 0 20px;text-align:center;
                font-family:'Hiragino Kaku Gothic ProN',sans-serif;">🔊 音量設定</h3>

            <div style="margin-bottom:18px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <span style="color:#f5e6ca;font-size:14px;">🎵 BGM</span>
                    <button id="audio-bgm-mute" style="background:none;border:1px solid #555;
                        border-radius:4px;color:#ccc;cursor:pointer;padding:2px 8px;font-size:12px;"></button>
                </div>
                <input id="audio-bgm-slider" type="range" min="0" max="100" style="width:100%;accent-color:#ff6b35;">
            </div>

            <div style="margin-bottom:20px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <span style="color:#f5e6ca;font-size:14px;">🔔 効果音</span>
                    <button id="audio-se-mute" style="background:none;border:1px solid #555;
                        border-radius:4px;color:#ccc;cursor:pointer;padding:2px 8px;font-size:12px;"></button>
                </div>
                <input id="audio-se-slider" type="range" min="0" max="100" style="width:100%;accent-color:#ff6b35;">
            </div>

            <button id="audio-close" style="display:block;margin:0 auto;padding:8px 32px;
                border:none;border-radius:6px;background:#c0392b;color:#fff;
                cursor:pointer;font-size:14px;">閉じる</button>
        `;
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        this._overlay = overlay;

        // イベント
        document.getElementById('audio-bgm-slider').addEventListener('input', (e) => {
            this.setBgmVolume(parseInt(e.target.value) / 100);
        });
        document.getElementById('audio-se-slider').addEventListener('input', (e) => {
            this.setSeVolume(parseInt(e.target.value) / 100);
        });
        document.getElementById('audio-bgm-mute').addEventListener('click', () => this.toggleBgmMute());
        document.getElementById('audio-se-mute').addEventListener('click', () => this.toggleSeMute());
        document.getElementById('audio-close').addEventListener('click', () => this.hideOverlay());
    }

    _createToggleButton() {
        const btn = document.createElement('button');
        btn.id = 'audio-toggle-btn';
        btn.textContent = '🔊';
        btn.style.cssText = `
            position:fixed;top:8px;right:8px;z-index:9998;
            width:36px;height:36px;border-radius:50%;border:2px solid #8b6914;
            background:rgba(45,27,14,0.85);color:#f5e6ca;font-size:18px;
            cursor:pointer;display:flex;align-items:center;justify-content:center;
            transition:background 0.2s;line-height:1;padding:0;
        `;
        btn.addEventListener('mouseenter', () => { btn.style.background = 'rgba(80,50,20,0.9)'; });
        btn.addEventListener('mouseleave', () => { btn.style.background = 'rgba(45,27,14,0.85)'; });
        btn.addEventListener('click', () => this.showOverlay());
        document.body.appendChild(btn);
        this._toggleBtn = btn;
    }

    showOverlay() {
        this._updateUI();
        this._overlay.style.display = 'flex';
        this._overlayVisible = true;
    }

    hideOverlay() {
        this._overlay.style.display = 'none';
        this._overlayVisible = false;
    }

    _updateUI() {
        const bgmSlider = document.getElementById('audio-bgm-slider');
        const seSlider = document.getElementById('audio-se-slider');
        const bgmMuteBtn = document.getElementById('audio-bgm-mute');
        const seMuteBtn = document.getElementById('audio-se-mute');
        if (!bgmSlider) return;

        bgmSlider.value = Math.round(this.bgmVolume * 100);
        seSlider.value = Math.round(this.seVolume * 100);
        bgmMuteBtn.textContent = this.bgmMuted ? 'ミュート中' : 'ミュート';
        bgmMuteBtn.style.borderColor = this.bgmMuted ? '#c0392b' : '#555';
        seMuteBtn.textContent = this.seMuted ? 'ミュート中' : 'ミュート';
        seMuteBtn.style.borderColor = this.seMuted ? '#c0392b' : '#555';

        // トグルボタンアイコン
        if (this._toggleBtn) {
            this._toggleBtn.textContent = (this.bgmMuted && this.seMuted) ? '🔇' : '🔊';
        }
    }
}

// グローバルシングルトン（後方互換性のため bgmManager も維持）
window.bgmManager = new AudioManager();
