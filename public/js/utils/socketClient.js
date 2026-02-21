/**
 * Socket.io通信ラッパー
 * 接続管理・切断検知・再接続通知を含む
 *
 * 使い方:
 *   const client = new SocketClient();
 *   client.connect();
 *   client.createRoom('プレイヤー名', 3);
 *   client.on('room_created', (data) => { ... });
 */
class SocketClient {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.overlayEl = null;
    }

    connect() {
        if (typeof io === 'undefined') {
            console.warn('Socket.io not loaded. Online features disabled.');
            return;
        }
        this.socket = io({
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        this.socket.on('connect', () => {
            this.connected = true;
            console.log('[Socket] Connected:', this.socket.id);
            this.hideDisconnectOverlay();
        });

        this.socket.on('disconnect', (reason) => {
            this.connected = false;
            console.log('[Socket] Disconnected:', reason);
            this.showDisconnectOverlay('接続が切れました…再接続中');
        });

        this.socket.on('reconnect_attempt', (attemptNumber) => {
            console.log(`[Socket] Reconnect attempt ${attemptNumber}`);
            this.showDisconnectOverlay(`再接続中… (${attemptNumber}回目)`);
        });

        this.socket.on('reconnect', () => {
            console.log('[Socket] Reconnected');
            this.hideDisconnectOverlay();
        });

        this.socket.on('reconnect_failed', () => {
            console.log('[Socket] Reconnect failed');
            this.showDisconnectOverlay('再接続に失敗しました', true);
        });

        this.socket.on('connect_error', (err) => {
            console.warn('[Socket] Connection error:', err.message);
        });
    }

    on(event, callback) {
        if (this.socket) this.socket.on(event, callback);
    }

    off(event, callback) {
        if (this.socket) this.socket.off(event, callback);
    }

    emit(event, data) {
        if (this.socket) this.socket.emit(event, data);
    }

    // --- 切断オーバーレイUI ---

    showDisconnectOverlay(message, showBackButton = false) {
        this.hideDisconnectOverlay();

        const overlay = document.createElement('div');
        overlay.id = 'disconnect-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.7); display: flex; flex-direction: column;
            justify-content: center; align-items: center; z-index: 9999;
            font-family: Arial, sans-serif;
        `;

        const text = document.createElement('div');
        text.style.cssText = 'color: #f5e6ca; font-size: 24px; margin-bottom: 20px;';
        text.textContent = message;
        overlay.appendChild(text);

        const spinner = document.createElement('div');
        spinner.style.cssText = `
            width: 40px; height: 40px; border: 4px solid #555;
            border-top: 4px solid #ff6b35; border-radius: 50%;
            animation: spin 1s linear infinite; margin-bottom: 20px;
        `;
        overlay.appendChild(spinner);

        // スピナーアニメーション
        if (!document.getElementById('disconnect-spinner-style')) {
            const style = document.createElement('style');
            style.id = 'disconnect-spinner-style';
            style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
            document.head.appendChild(style);
        }

        if (showBackButton) {
            spinner.style.display = 'none';
            const btn = document.createElement('button');
            btn.style.cssText = `
                padding: 12px 32px; font-size: 18px; background: #c0392b;
                color: white; border: none; border-radius: 8px; cursor: pointer;
            `;
            btn.textContent = 'タイトルへ戻る';
            btn.onclick = () => {
                this.hideDisconnectOverlay();
                // Phaserのゲームシーンをタイトルへ
                if (window.game && window.game.scene) {
                    const scenes = window.game.scene.scenes;
                    for (const scene of scenes) {
                        if (scene.scene.isActive()) {
                            scene.scene.start(SCENES.TITLE);
                            break;
                        }
                    }
                }
            };
            overlay.appendChild(btn);
        }

        document.body.appendChild(overlay);
        this.overlayEl = overlay;
    }

    hideDisconnectOverlay() {
        const existing = document.getElementById('disconnect-overlay');
        if (existing) existing.remove();
        this.overlayEl = null;
    }

    // --- ルーム管理 ---
    createRoom(playerName, playerCount) {
        this.emit('create_room', { playerName, playerCount });
    }

    joinRoom(roomCode, playerName) {
        this.emit('join_room', { roomCode, playerName });
    }

    // --- ゲームアクション ---
    selectCharacter(characterId) {
        this.emit('select_character', { characterId });
    }

    selectSoup(soupId) {
        this.emit('select_soup', { soupId });
    }

    selectNoodle(noodleId) {
        this.emit('select_noodle', { noodleId });
    }

    draftPick(ingredientId) {
        this.emit('draft_pick', { ingredientId });
    }

    submitPlacement(grid) {
        this.emit('submit_placement', { grid });
    }
}
