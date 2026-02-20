/**
 * CeremonyScene - 称号を1つずつ発表する演出画面
 */
class CeremonyScene extends Phaser.Scene {
    constructor() {
        super(SCENES.CEREMONY);
    }

    init() {
        this.currentTitleIndex = 0;
        this.titleBonuses = {}; // playerId → ボーナス点数合計
    }

    create() {
        const { width, height } = this.cameras.main;
        const allResults = this.registry.get(REGISTRY.SCORING_RESULT);
        const titlesData = this.registry.get('data_titles');
        const scoring = this.registry.get('data_scoring');
        const ingredients = this.registry.get('data_ingredients');

        const engine = new ScoringEngine(scoring, ingredients);
        this.awardedTitles = engine.calcLayer4(allResults, titlesData);

        // 各プレイヤーのボーナス初期化
        allResults.forEach(r => { this.titleBonuses[r.playerId] = 0; });

        this.add.text(width / 2, 30, '🏆 称号セレモニー', {
            fontSize: GAME_CONFIG.FONT.HEADING_SIZE,
            color: GAME_CONFIG.COLORS.TEXT_SCORE,
        }).setOrigin(0.5);

        this.titleContainer = this.add.container(0, 0);

        if (this.awardedTitles.length === 0) {
            this.add.text(width / 2, height / 2, '今回は称号なし…！\n次こそ狙おう！', {
                fontSize: '20px',
                color: '#999999',
                align: 'center',
            }).setOrigin(0.5);

            this.time.delayedCall(2000, () => this.goToResult());
        } else {
            this.showNextTitle();
        }
    }

    showNextTitle() {
        const { width, height } = this.cameras.main;
        const allResults = this.registry.get(REGISTRY.SCORING_RESULT);

        if (this.currentTitleIndex >= this.awardedTitles.length) {
            this.time.delayedCall(1500, () => this.goToResult());
            return;
        }

        const title = this.awardedTitles[this.currentTitleIndex];
        this.titleContainer.removeAll(true);

        const y = 120 + (this.currentTitleIndex % 4) * 100;

        // 称号名
        const titleText = this.add.text(width / 2, y, `${title.emoji} ${title.name}`, {
            fontSize: '26px',
            color: GAME_CONFIG.COLORS.TEXT_SCORE,
        }).setOrigin(0.5).setAlpha(0);

        // 受賞者
        const winnerNames = title.winners.map(pid => {
            const p = allResults.find(r => r.playerId === pid);
            return p ? p.name : pid;
        }).join('、');

        const winnerText = this.add.text(width / 2, y + 34, `→ ${winnerNames}！ +${title.points}点`, {
            fontSize: '18px',
            color: GAME_CONFIG.COLORS.TEXT_PRIMARY,
        }).setOrigin(0.5).setAlpha(0);

        // アナウンス
        const announceText = this.add.text(width / 2, y + 60, title.announcement || '', {
            fontSize: '14px',
            color: '#cccccc',
            fontStyle: 'italic',
        }).setOrigin(0.5).setAlpha(0);

        // フェードインアニメーション
        this.tweens.add({ targets: titleText, alpha: 1, duration: 500, ease: 'Power2' });
        this.tweens.add({ targets: winnerText, alpha: 1, duration: 500, delay: 300, ease: 'Power2' });
        this.tweens.add({ targets: announceText, alpha: 1, duration: 500, delay: 500, ease: 'Power2' });

        // ボーナス加算
        title.winners.forEach(pid => {
            this.titleBonuses[pid] = (this.titleBonuses[pid] || 0) + title.points;
        });

        this.currentTitleIndex++;

        // 次の称号を表示（クリックで進む）
        this.input.once('pointerdown', () => {
            this.showNextTitle();
        });

        // 自動進行（3秒）
        this.time.delayedCall(3000, () => {
            this.showNextTitle();
        });
    }

    goToResult() {
        // 最終スコア計算
        const allResults = this.registry.get(REGISTRY.SCORING_RESULT);

        const finalScores = allResults.map(r => ({
            playerId: r.playerId,
            name: r.name,
            baseScore: r.scores.baseTotal,
            titleBonus: this.titleBonuses[r.playerId] || 0,
            totalScore: r.scores.baseTotal + (this.titleBonuses[r.playerId] || 0),
        }));

        // ソート（降順）
        finalScores.sort((a, b) => b.totalScore - a.totalScore);
        finalScores.forEach((s, i) => { s.rank = i + 1; });

        this.registry.set('finalScores', finalScores);
        this.scene.start(SCENES.RESULT);
    }
}
