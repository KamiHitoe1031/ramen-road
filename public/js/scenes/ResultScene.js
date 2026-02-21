/**
 * ResultScene - 最終結果とランキング表示
 * スコアカウントアップ演出 + 1位confetti
 */
class ResultScene extends Phaser.Scene {
    constructor() {
        super(SCENES.RESULT);
    }

    create() {
        const { width, height } = this.cameras.main;
        const finalScores = this.registry.get(REGISTRY.FINAL_SCORES);
        const allPlayers = this.registry.get(REGISTRY.ALL_PLAYERS);
        const characters = this.registry.get('data_characters');
        const medals = ['🥇', '🥈', '🥉'];
        const isOnline = this.registry.get('onlineMode') || false;
        const myPlayerId = isOnline && window.socketClient?.socket ? window.socketClient.socket.id : 'player';

        // BGM（結果BGM継続）
        window.bgmManager.play(this, BGM_MAP[SCENES.RESULT]);

        // 背景
        this.add.image(width / 2, height / 2, 'bg_table').setDisplaySize(width, height).setAlpha(0.3);

        // 勝者発表音
        this.sound.play('sfx_winner');

        this.add.text(width / 2, 40, '🍜 結果発表！', {
            fontSize: GAME_CONFIG.FONT.TITLE_SIZE,
            color: GAME_CONFIG.COLORS.TEXT_SCORE,
        }).setOrigin(0.5);

        // ランキング表示（スコアはカウントアップ）
        finalScores.forEach((score, i) => {
            const y = 120 + i * 90;
            const medal = medals[i] || '  ';
            const isMe = score.playerId === myPlayerId;

            // 背景ハイライト（自分）
            if (isMe) {
                this.add.rectangle(width / 2, y + 15, 500, 70, 0xff6b35, 0.15)
                    .setStrokeStyle(2, 0xff6b35, 0.5);
            }

            // キャラアイコン
            const charId = score.characterId || (allPlayers ? allPlayers.find(p => p.playerId === score.playerId)?.characterId : null);
            if (charId) {
                const charData = characters.find(c => c.id === charId);
                if (charData) {
                    this.add.image(55, y + 15, charData.spriteKey).setDisplaySize(48, 48);
                }
            }

            // 順位
            this.add.text(90, y, `${medal} ${score.rank}位`, {
                fontSize: '28px',
                color: isMe ? GAME_CONFIG.COLORS.TEXT_SCORE : GAME_CONFIG.COLORS.TEXT_PRIMARY,
            }).setOrigin(0, 0);

            // 名前
            this.add.text(200, y, score.name, {
                fontSize: '22px',
                color: isMe ? '#ffffff' : GAME_CONFIG.COLORS.TEXT_PRIMARY,
                fontStyle: isMe ? 'bold' : 'normal',
            });

            // スコア内訳
            this.add.text(200, y + 30, `基本: ${score.baseScore}点`, {
                fontSize: '14px',
                color: '#999999',
            });

            if (score.titleBonus > 0) {
                this.add.text(340, y + 30, `称号: +${score.titleBonus}点`, {
                    fontSize: '14px',
                    color: GAME_CONFIG.COLORS.TEXT_ACCENT,
                });
            }

            // 合計スコア（カウントアップ演出）
            const scoreText = this.add.text(width - 80, y + 10, '0点', {
                fontSize: '30px',
                color: isMe ? GAME_CONFIG.COLORS.TEXT_SCORE : GAME_CONFIG.COLORS.TEXT_PRIMARY,
                fontStyle: 'bold',
            }).setOrigin(1, 0);

            // カウントアップTween
            const counter = { val: 0 };
            this.tweens.add({
                targets: counter,
                val: score.totalScore,
                duration: 1200,
                delay: i * 300,
                ease: 'Power2',
                onUpdate: () => {
                    scoreText.setText(`${Math.round(counter.val)}点`);
                },
                onComplete: () => {
                    scoreText.setText(`${score.totalScore}点`);
                    // 1位完了時にconfetti開始
                    if (i === 0) {
                        this.startConfetti();
                    }
                },
            });
        });

        // --- ボタン ---
        const btnY = height - 60;

        if (isOnline) {
            // オンライン: ロビーに戻る
            const lobbyBtn = this.add.rectangle(width / 2, btnY, 280, 50, GAME_CONFIG.COLORS.BTN_PRIMARY)
                .setInteractive({ useHandCursor: true });
            this.add.text(width / 2, btnY, '🏠 タイトルへ戻る', {
                fontSize: '18px', color: '#ffffff',
            }).setOrigin(0.5);
            lobbyBtn.on('pointerdown', () => {
                this.sound.play('sfx_click');
                this.scene.start(SCENES.TITLE);
            });
        } else {
            // オフライン: もう一杯 or タイトル
            const retryBtn = this.add.rectangle(width / 2 - 120, btnY, 200, 50, GAME_CONFIG.COLORS.BTN_PRIMARY)
                .setInteractive({ useHandCursor: true });
            this.add.text(width / 2 - 120, btnY, '🍜 もう一杯！', {
                fontSize: '18px', color: '#ffffff',
            }).setOrigin(0.5);
            retryBtn.on('pointerdown', () => {
                this.sound.play('sfx_click');
                this.scene.start(SCENES.CHAR_SELECT);
            });

            const titleBtn = this.add.rectangle(width / 2 + 120, btnY, 200, 50, 0x555555)
                .setInteractive({ useHandCursor: true });
            this.add.text(width / 2 + 120, btnY, '🏠 タイトルへ', {
                fontSize: '18px', color: '#ffffff',
            }).setOrigin(0.5);
            titleBtn.on('pointerdown', () => {
                this.sound.play('sfx_click');
                this.scene.start(SCENES.TITLE);
            });
        }
    }

    /** 紙吹雪パーティクル */
    startConfetti() {
        const { width } = this.cameras.main;
        const colors = [0xff6b35, 0xffd700, 0xe74c3c, 0x27ae60, 0x3498db, 0xe91e8c];

        // 紙吹雪を30個生成
        for (let i = 0; i < 30; i++) {
            const x = Phaser.Math.Between(50, width - 50);
            const color = Phaser.Utils.Array.GetRandom(colors);
            const size = Phaser.Math.Between(4, 10);

            const piece = this.add.rectangle(x, -20, size, size * 1.5, color)
                .setAngle(Phaser.Math.Between(0, 360))
                .setDepth(200);

            this.tweens.add({
                targets: piece,
                y: Phaser.Math.Between(100, 500),
                x: x + Phaser.Math.Between(-80, 80),
                angle: Phaser.Math.Between(180, 720),
                alpha: 0,
                duration: Phaser.Math.Between(1500, 3000),
                delay: Phaser.Math.Between(0, 500),
                ease: 'Quad.easeOut',
                onComplete: () => piece.destroy(),
            });
        }
    }
}
