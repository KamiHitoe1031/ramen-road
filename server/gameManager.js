/**
 * GameManager - ルーム管理とSocket.ioイベントハンドリング
 */
const path = require('path');
const GameLogic = require('./gameLogic');

// データファイル読み込み
const dataDir = path.join(__dirname, '..', 'data');
const dataFiles = {
    ingredients: require(path.join(dataDir, 'ingredients.json')),
    soups: require(path.join(dataDir, 'soups.json')),
    noodles: require(path.join(dataDir, 'noodles.json')),
    characters: require(path.join(dataDir, 'characters.json')),
    customers: require(path.join(dataDir, 'customers.json')),
    scoring: require(path.join(dataDir, 'scoring.json')),
    titles: require(path.join(dataDir, 'titles.json')),
};

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
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        return this.rooms.has(code) ? this.generateRoomCode() : code;
    }

    getRoom(socket) {
        const roomCode = socket.roomCode;
        return roomCode ? this.rooms.get(roomCode) : null;
    }

    // ========================================
    // ルーム管理
    // ========================================

    createRoom(socket, { playerName, playerCount }) {
        // バリデーション
        if (!playerName || typeof playerName !== 'string') {
            socket.emit('room_error', { message: '名前を入力してください' });
            return;
        }
        playerCount = parseInt(playerCount);
        if (playerCount < 3 || playerCount > 4) {
            socket.emit('room_error', { message: 'プレイヤー数は3-4人です' });
            return;
        }

        const roomCode = this.generateRoomCode();
        const room = {
            code: roomCode,
            hostId: socket.id,
            maxPlayers: playerCount,
            players: [{ id: socket.id, name: playerName }],
            phase: 'waiting',
            gameLogic: null,
        };
        this.rooms.set(roomCode, room);
        socket.join(roomCode);
        socket.roomCode = roomCode;

        console.log(`[GameManager] Room created: ${roomCode} by ${playerName} (${playerCount}P)`);
        socket.emit('room_created', { roomCode, players: room.players });
    }

    joinRoom(socket, { roomCode, playerName }) {
        if (!playerName || typeof playerName !== 'string') {
            socket.emit('room_error', { message: '名前を入力してください' });
            return;
        }
        roomCode = (roomCode || '').toUpperCase().trim();

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

        console.log(`[GameManager] ${playerName} joined room ${roomCode} (${room.players.length}/${room.maxPlayers})`);

        socket.emit('room_joined', { roomCode, players: room.players });
        socket.to(roomCode).emit('player_joined', {
            player: { id: socket.id, name: playerName },
            players: room.players,
        });
    }

    leaveRoom(socket) {
        const room = this.getRoom(socket);
        if (!room) return;

        room.players = room.players.filter(p => p.id !== socket.id);
        socket.leave(room.code);
        this.io.to(room.code).emit('player_left', {
            playerId: socket.id,
            players: room.players,
        });

        console.log(`[GameManager] Player left room ${room.code} (${room.players.length} remaining)`);

        if (room.players.length === 0) {
            if (room.gameLogic) room.gameLogic.clearTimeout();
            this.rooms.delete(room.code);
            console.log(`[GameManager] Room ${room.code} deleted (empty)`);
        } else if (room.hostId === socket.id) {
            // ホスト交代
            room.hostId = room.players[0].id;
            this.io.to(room.code).emit('host_changed', { hostId: room.hostId });
        }

        socket.roomCode = null;
    }

    // ========================================
    // ゲーム開始
    // ========================================

    startGame(socket) {
        const room = this.getRoom(socket);
        if (!room) return;

        if (room.hostId !== socket.id) {
            socket.emit('room_error', { message: 'ホストのみ開始できます' });
            return;
        }
        if (room.players.length < room.maxPlayers) {
            socket.emit('room_error', { message: `あと${room.maxPlayers - room.players.length}人必要です` });
            return;
        }
        if (room.phase !== 'waiting' && room.phase !== 'result') {
            socket.emit('room_error', { message: 'ゲームは既に進行中です' });
            return;
        }

        console.log(`[GameManager] Game starting in room ${room.code}`);
        room.phase = 'playing';
        room.gameLogic = new GameLogic(room, this.io, dataFiles);

        this.io.to(room.code).emit('game_starting', {
            players: room.players,
            playerCount: room.maxPlayers,
        });

        // 少し待ってからフェーズ開始
        setTimeout(() => room.gameLogic.nextPhase(), 1000);
    }

    // ========================================
    // ゲームアクション
    // ========================================

    selectCharacter(socket, { characterId }) {
        const room = this.getRoom(socket);
        if (!room || !room.gameLogic) return;
        room.gameLogic.handleCharSelect(socket.id, characterId);
    }

    selectSoup(socket, { soupId }) {
        const room = this.getRoom(socket);
        if (!room || !room.gameLogic) return;
        room.gameLogic.handleSoupSelect(socket.id, soupId);
    }

    selectNoodle(socket, { noodleId }) {
        const room = this.getRoom(socket);
        if (!room || !room.gameLogic) return;
        room.gameLogic.handleNoodleSelect(socket.id, noodleId);
    }

    draftPick(socket, { ingredientId }) {
        const room = this.getRoom(socket);
        if (!room || !room.gameLogic) return;
        room.gameLogic.handleDraftPick(socket.id, ingredientId);
    }

    submitPlacement(socket, { grid }) {
        const room = this.getRoom(socket);
        if (!room || !room.gameLogic) return;
        room.gameLogic.handlePlacement(socket.id, grid);
    }

    // ========================================
    // 切断処理
    // ========================================

    handleDisconnect(socket) {
        console.log(`[GameManager] Player disconnected: ${socket.id}`);
        this.leaveRoom(socket);
    }
}

module.exports = GameManager;
