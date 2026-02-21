/**
 * LobbyScene - オンライン対戦ロビー
 * 部屋作成 or ルームコードで参加
 */
class LobbyScene extends Phaser.Scene {
    constructor() {
        super(SCENES.LOBBY);
    }

    init() {
        this.playerName = '';
        this.roomCodeInput = '';
        this.mode = 'menu'; // 'menu' | 'create' | 'join'
    }

    create() {
        const { width, height } = this.cameras.main;

        // BGM（ロビーはタイトルと同じ曲 → シームレス）
        window.bgmManager.play(this, BGM_MAP[SCENES.LOBBY]);

        // Socket接続
        if (!window.socketClient) {
            window.socketClient = new SocketClient();
        }
        if (!window.socketClient.connected) {
            window.socketClient.connect();
        }

        this.showMenu();
    }

    showMenu() {
        const { width, height } = this.cameras.main;
        this.children.removeAll();

        // 背景
        this.add.image(width / 2, height / 2, 'bg_table').setDisplaySize(width, height).setAlpha(0.3);

        this.add.text(width / 2, 50, '🌐 オンライン対戦', {
            fontSize: GAME_CONFIG.FONT.HEADING_SIZE,
            color: GAME_CONFIG.COLORS.TEXT_PRIMARY,
        }).setOrigin(0.5);

        // 名前入力
        this.add.text(width / 2, 130, 'あなたの名前:', {
            fontSize: '18px', color: GAME_CONFIG.COLORS.TEXT_PRIMARY,
        }).setOrigin(0.5);

        // DOM要素で名前入力
        this.nameInput = this.add.dom(width / 2, 170).createFromHTML(
            '<input type="text" id="nameInput" placeholder="名前を入力" maxlength="8" ' +
            'style="font-size:20px;padding:8px 16px;width:200px;text-align:center;border-radius:8px;border:2px solid #8b6914;background:#f5e6ca;color:#333;">'
        );

        // 部屋を作るボタン
        this.createButton(width / 2, 240, '🏠 部屋をつくる（3人）', () => {
            this.tryCreateRoom(3);
        });

        this.createButton(width / 2, 310, '🏠 部屋をつくる（4人）', () => {
            this.tryCreateRoom(4);
        });

        // 区切り線
        this.add.text(width / 2, 370, '── または ──', {
            fontSize: '14px', color: '#666',
        }).setOrigin(0.5);

        // コード入力
        this.add.text(width / 2, 410, 'ルームコード:', {
            fontSize: '18px', color: GAME_CONFIG.COLORS.TEXT_PRIMARY,
        }).setOrigin(0.5);

        this.codeInput = this.add.dom(width / 2, 450).createFromHTML(
            '<input type="text" id="codeInput" placeholder="ABCD12" maxlength="6" ' +
            'style="font-size:20px;padding:8px 16px;width:200px;text-align:center;border-radius:8px;border:2px solid #8b6914;background:#f5e6ca;color:#333;text-transform:uppercase;">'
        );

        this.createButton(width / 2, 510, '🚪 部屋に入る', () => {
            this.tryJoinRoom();
        });

        // 戻るボタン
        const backBtn = this.add.text(20, height - 30, '← タイトルへ', {
            fontSize: '14px', color: '#888',
        }).setInteractive({ useHandCursor: true });
        backBtn.on('pointerdown', () => {
            this.sound.play('sfx_click');
            this.scene.start(SCENES.TITLE);
        });

        // エラー表示エリア
        this.errorText = this.add.text(width / 2, height - 60, '', {
            fontSize: '14px', color: '#ff4444',
        }).setOrigin(0.5);

        // Socket イベント
        this.setupSocketEvents();
    }

    setupSocketEvents() {
        const client = window.socketClient;
        if (!client || !client.socket) return;

        client.on('room_created', ({ roomCode, players }) => {
            console.log('[Lobby] Room created:', roomCode);
            this.scene.start(SCENES.WAITING, { roomCode, players, isHost: true });
        });

        client.on('room_joined', ({ roomCode, players }) => {
            console.log('[Lobby] Joined room:', roomCode);
            this.scene.start(SCENES.WAITING, { roomCode, players, isHost: false });
        });

        client.on('room_error', ({ message }) => {
            this.errorText.setText(message);
        });
    }

    tryCreateRoom(playerCount) {
        const nameEl = document.getElementById('nameInput');
        const name = nameEl ? nameEl.value.trim() : '';
        if (!name) {
            this.errorText.setText('名前を入力してください');
            return;
        }
        this.sound.play('sfx_click');
        this.registry.set(REGISTRY.PLAYER_NAME, name);
        this.registry.set(REGISTRY.PLAYER_COUNT, playerCount);
        window.socketClient.createRoom(name, playerCount);
    }

    tryJoinRoom() {
        const nameEl = document.getElementById('nameInput');
        const name = nameEl ? nameEl.value.trim() : '';
        if (!name) {
            this.errorText.setText('名前を入力してください');
            return;
        }
        const codeEl = document.getElementById('codeInput');
        const code = codeEl ? codeEl.value.trim().toUpperCase() : '';
        if (!code || code.length < 4) {
            this.errorText.setText('ルームコードを入力してください');
            return;
        }
        this.sound.play('sfx_click');
        this.registry.set(REGISTRY.PLAYER_NAME, name);
        window.socketClient.joinRoom(code, name);
    }

    createButton(x, y, label, callback) {
        const btn = this.add.rectangle(x, y, 280, 50, GAME_CONFIG.COLORS.BTN_PRIMARY)
            .setInteractive({ useHandCursor: true });
        this.add.text(x, y, label, {
            fontSize: '18px', color: '#ffffff',
        }).setOrigin(0.5);
        btn.on('pointerover', () => btn.setFillStyle(GAME_CONFIG.COLORS.BTN_HOVER));
        btn.on('pointerout', () => btn.setFillStyle(GAME_CONFIG.COLORS.BTN_PRIMARY));
        btn.on('pointerdown', callback);
        return btn;
    }
}
