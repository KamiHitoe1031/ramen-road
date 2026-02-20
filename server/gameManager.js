/**
 * GameManager - ルーム管理とSocket.ioイベントハンドリング
 * Phase 3で本格実装
 */
class GameManager {
    constructor(io) {
        this.io = io;
        this.rooms = new Map(); // roomCode -> RoomState
    }

    handleConnection(socket) {
        socket.on('create_room', (data) => this.createRoom(socket, data));
        socket.on('join_room', (data) => this.joinRoom(socket, data));
        socket.on('leave_room', () => this.leaveRoom(socket));
        socket.on('start_game', () => this.startGame(socket));
        socket.on('select_character', (data) => this.selectCharacter(socket, data));
        socket.on('select_soup', (data) => this.selectSoup(socket, data));
        socket.on('select_noodle', (data) => this.selectNoodle(socket, data));
        socket.on('draft_pick', (data) => this.draftPick(socket, data));
        socket.on('submit_placement', (data) => this.submitPlacement(socket, data));
        socket.on('disconnect', () => this.handleDisconnect(socket));
    }

    generateRoomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 紛らわしい文字を除外
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        return this.rooms.has(code) ? this.generateRoomCode() : code;
    }

    createRoom(socket, { playerName, playerCount }) {
        const roomCode = this.generateRoomCode();
        const room = {
            code: roomCode,
            hostId: socket.id,
            maxPlayers: playerCount,
            players: [{ id: socket.id, name: playerName }],
            phase: 'waiting',
            gameState: null,
        };
        this.rooms.set(roomCode, room);
        socket.join(roomCode);
        socket.roomCode = roomCode;
        socket.emit('room_created', { roomCode });
    }

    joinRoom(socket, { roomCode, playerName }) {
        const room = this.rooms.get(roomCode);
        if (!room) {
            socket.emit('room_error', { message: '部屋が見つかりません' });
            return;
        }
        if (room.players.length >= room.maxPlayers) {
            socket.emit('room_error', { message: '部屋が満員です' });
            return;
        }
        if (room.phase !== 'waiting') {
            socket.emit('room_error', { message: 'ゲームがすでに開始しています' });
            return;
        }

        room.players.push({ id: socket.id, name: playerName });
        socket.join(roomCode);
        socket.roomCode = roomCode;

        socket.emit('room_joined', { roomCode, players: room.players });
        socket.to(roomCode).emit('player_joined', { player: { id: socket.id, name: playerName } });
    }

    leaveRoom(socket) {
        // Phase 3で実装
    }

    startGame(socket) {
        // Phase 3で実装: ホストのみ開始可能
    }

    selectCharacter(socket, data) {
        // Phase 3で実装
    }

    selectSoup(socket, data) {
        // Phase 3で実装
    }

    selectNoodle(socket, data) {
        // Phase 3で実装
    }

    draftPick(socket, data) {
        // Phase 3で実装
    }

    submitPlacement(socket, data) {
        // Phase 3で実装
    }

    handleDisconnect(socket) {
        const roomCode = socket.roomCode;
        if (!roomCode) return;
        const room = this.rooms.get(roomCode);
        if (!room) return;

        room.players = room.players.filter(p => p.id !== socket.id);
        this.io.to(roomCode).emit('player_left', { playerId: socket.id });

        if (room.players.length === 0) {
            this.rooms.delete(roomCode);
        }
    }
}

module.exports = GameManager;
