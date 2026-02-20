/**
 * ResultScene - 最終結果とランキング表示
 */
class ResultScene extends Phaser.Scene {
    constructor() {
        super(SCENES.RESULT);
    }

    create() {
        const { width, height } = this.cameras.main;
        const finalScores = this.registry.get('finalScores');
        const medals = ['🥇', '🥈', '🥉'];

        this.add.text(width / 2, 40, '🍜 結果発表！', {
            fontSize: GAME_CONFIG.FONT.TITLE_SIZE,
            color: GAME_CONFIG.COLORS.TEXT_SCORE,
        }).setOrigin(0.5);

        // ランキング表示
        finalScores.forEach((score, i) => {
            const y = 120 + i * 90;
            const medal = medals[i] || '  ';
            const isMe = score.playerId === 'player';

            // 背景ハイライト（自分）
            if (isMe) {
                this.add.rectangle(width / 2, y + 15, 500, 70, 0xff6b35, 0.15)
                    .setStrokeStyle(2, 0xff6b35, 0.5);
            }

            // 順位
            this.add.text(80, y, `${medal} ${score.rank}位`, {
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

            // 合計
            this.add.text(width - 80, y + 10, `${score.totalScore}点`, {
                fontSize: '30px',
                color: isMe ? GAME_CONFIG.COLORS.TEXT_SCORE : GAME_CONFIG.COLORS.TEXT_PRIMARY,
                fontStyle: 'bold',
            }).setOrigin(1, 0);
        });

        // --- ボタン ---
        const btnY = height - 60;

        // もう一杯！
        const retryBtn = this.add.rectangle(width / 2 - 120, btnY, 200, 50, GAME_CONFIG.COLORS.BTN_PRIMARY)
            .setInteractive({ useHandCursor: true });
        this.add.text(width / 2 - 120, btnY, '🍜 もう一杯！', {
            fontSize: '18px', color: '#ffffff',
        }).setOrigin(0.5);
        retryBtn.on('pointerdown', () => this.scene.start(SCENES.CHAR_SELECT));

        // タイトルへ
        const titleBtn = this.add.rectangle(width / 2 + 120, btnY, 200, 50, 0x555555)
            .setInteractive({ useHandCursor: true });
        this.add.text(width / 2 + 120, btnY, '🏠 タイトルへ', {
            fontSize: '18px', color: '#ffffff',
        }).setOrigin(0.5);
        titleBtn.on('pointerdown', () => this.scene.start(SCENES.TITLE));
    }
}
