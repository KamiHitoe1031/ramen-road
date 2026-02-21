/**
 * WaitingScene - ルーム待機室
 * プレイヤーリスト表示 + ホストの「ゲーム開始」ボタン
 */
class WaitingScene extends Phaser.Scene {
    constructor() {
        super(SCENES.WAITING);
    }

    init(data) {
        this.roomCode = data.roomCode || '';
        this.players = data.players || [];
        this.isHost = data.isHost || false;
    }

    create() {
        const { width, height } = this.cameras.main;

        // BGM（ロビーと同じ曲 → シームレス）
        window.bgmManager.play(this, BGM_MAP[SCENES.WAITING]);

        // 背景
        this.add.image(width / 2, height / 2, 'bg_table').setDisplaySize(width, height).setAlpha(0.3);

        this.add.text(width / 2, 40, '🍜 待機中...', {
            fontSize: GAME_CONFIG.FONT.HEADING_SIZE,
            color: GAME_CONFIG.COLORS.TEXT_PRIMARY,
        }).setOrigin(0.5);

        // ルームコード（大きく表示）
        this.add.text(width / 2, 100, 'ルームコード', {
            fontSize: '16px', color: '#999',
        }).setOrigin(0.5);

        this.add.text(width / 2, 140, this.roomCode, {
            fontSize: '48px',
            color: GAME_CONFIG.COLORS.TEXT_SCORE,
            fontStyle: 'bold',
            letterSpacing: 8,
        }).setOrigin(0.5);

        this.add.text(width / 2, 180, '↑ このコードを友達に共有！', {
            fontSize: '14px', color: '#888',
        }).setOrigin(0.5);

        // プレイヤーリスト
        this.playerListY = 230;
        this.playerListContainer = this.add.container(0, 0);
        this.updatePlayerList();

        // ホストのみ: 開始ボタン
        if (this.isHost) {
            this.startBtn = this.add.rectangle(width / 2, height - 80, 280, 56, 0x555555)
                .setInteractive({ useHandCursor: true });
            this.startBtnText = this.add.text(width / 2, height - 80, '人数が足りません', {
                fontSize: '20px', color: '#999',
            }).setOrigin(0.5);

            this.startBtn.on('pointerdown', () => {
                if (this.canStart()) {
                    this.sound.play('sfx_click');
                    window.socketClient.emit('start_game', {});
                }
            });

            this.updateStartButton();
        } else {
            this.add.text(width / 2, height - 80, 'ホストの開始を待っています...', {
                fontSize: '16px', color: '#888',
            }).setOrigin(0.5);
        }

        // 退出ボタン
        const leaveBtn = this.add.text(20, height - 30, '← 退出', {
            fontSize: '14px', color: '#ff6666',
        }).setInteractive({ useHandCursor: true });
        leaveBtn.on('pointerdown', () => {
            this.sound.play('sfx_click');
            window.socketClient.emit('leave_room', {});
            this.scene.start(SCENES.LOBBY);
        });

        // Socket イベント
        this.setupSocketEvents();
    }

    setupSocketEvents() {
        const client = window.socketClient;
        if (!client || !client.socket) return;

        client.on('player_joined', ({ player, players }) => {
            this.players = players;
            this.updatePlayerList();
            this.updateStartButton();
            this.sound.play('sfx_bonus');
        });

        client.on('player_left', ({ playerId, players }) => {
            this.players = players;
            this.updatePlayerList();
            this.updateStartButton();
        });

        client.on('host_changed', ({ hostId }) => {
            if (hostId === window.socketClient.socket.id) {
                this.isHost = true;
                // ホストUI追加（シーンを再構築）
                this.scene.restart({ roomCode: this.roomCode, players: this.players, isHost: true });
            }
        });

        client.on('game_starting', ({ players, playerCount }) => {
            console.log('[Waiting] Game starting!');
            this.registry.set(REGISTRY.PLAYER_COUNT, playerCount);
            this.registry.set('onlineMode', true);
            this.registry.set('roomPlayers', players);
            this.scene.start(SCENES.CHAR_SELECT);
        });
    }

    updatePlayerList() {
        const { width } = this.cameras.main;
        this.playerListContainer.removeAll(true);

        this.players.forEach((p, i) => {
            const y = this.playerListY + i * 50;
            const isMe = window.socketClient?.socket?.id === p.id;

            const bg = this.add.rectangle(width / 2, y, 400, 40,
                isMe ? 0xff6b35 : 0x3a2a1a, isMe ? 0.2 : 0.6
            ).setStrokeStyle(1, 0x8b6914);
            this.playerListContainer.add(bg);

            const icon = i === 0 ? '👑' : '👤';
            const nameText = this.add.text(width / 2, y, `${icon} ${p.name}${isMe ? ' (あなた)' : ''}`, {
                fontSize: '20px',
                color: isMe ? '#ffffff' : GAME_CONFIG.COLORS.TEXT_PRIMARY,
                fontStyle: isMe ? 'bold' : 'normal',
            }).setOrigin(0.5);
            this.playerListContainer.add(nameText);
        });

        // 空きスロット
        const maxPlayers = this.registry.get(REGISTRY.PLAYER_COUNT) || 3;
        for (let i = this.players.length; i < maxPlayers; i++) {
            const y = this.playerListY + i * 50;
            const bg = this.add.rectangle(width / 2, y, 400, 40, 0x222222, 0.4)
                .setStrokeStyle(1, 0x444444);
            this.playerListContainer.add(bg);

            const text = this.add.text(width / 2, y, '👤 待機中...', {
                fontSize: '18px', color: '#555',
            }).setOrigin(0.5);
            this.playerListContainer.add(text);
        }
    }

    canStart() {
        const maxPlayers = this.registry.get(REGISTRY.PLAYER_COUNT) || 3;
        return this.players.length >= maxPlayers;
    }

    updateStartButton() {
        if (!this.startBtn) return;

        if (this.canStart()) {
            this.startBtn.setFillStyle(GAME_CONFIG.COLORS.BTN_PRIMARY);
            this.startBtnText.setText('🎮 ゲーム開始！');
            this.startBtnText.setColor('#ffffff');
        } else {
            this.startBtn.setFillStyle(0x555555);
            const remaining = (this.registry.get(REGISTRY.PLAYER_COUNT) || 3) - this.players.length;
            this.startBtnText.setText(`あと${remaining}人必要です`);
            this.startBtnText.setColor('#999');
        }
    }
}
