/**
 * Socket.io通信ラッパー
 * Phase 3で本格実装。Phase 1-2では使用しない。
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
    }

    connect() {
        if (typeof io === 'undefined') {
            console.warn('Socket.io not loaded. Online features disabled.');
            return;
        }
        this.socket = io();
        this.socket.on('connect', () => {
            this.connected = true;
            console.log('Connected to server:', this.socket.id);
        });
        this.socket.on('disconnect', () => {
            this.connected = false;
            console.log('Disconnected from server');
        });
    }

    on(event, callback) {
        if (this.socket) this.socket.on(event, callback);
    }

    emit(event, data) {
        if (this.socket) this.socket.emit(event, data);
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
