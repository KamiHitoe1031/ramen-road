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
        this.advancing = false; // 連打防止
    }

    create() {
        const { width, height } = this.cameras.main;
        const allResults = this.registry.get(REGISTRY.SCORING_RESULT);
        const titlesData = this.registry.get('data_titles');
        const scoring = this.registry.get('data_scoring');
        const ingredients = this.registry.get('data_ingredients');

        // 背景
        this.add.image(width / 2, height / 2, 'bg_table').setDisplaySize(width, height).setAlpha(0.3);

        const engine = new ScoringEngine(scoring, ingredients);
        const allCustomers = this.registry.get('data_customers');
        const customerIds = this.registry.get(REGISTRY.ACTIVE_CUSTOMERS);
        const activeCustomers = customerIds.map(id => allCustomers.find(c => c.id === id));
        this.awardedTitles = engine.calcLayer4(allResults, titlesData, activeCustomers);

        // 各プレイヤーのボーナス初期化
        allResults.forEach(r => { this.titleBonuses[r.playerId] = 0; });

        this.add.text(width / 2, 30, '🏆 称号セレモニー', {
            fontSize: GAME_CONFIG.FONT.HEADING_SIZE,
            color: GAME_CONFIG.COLORS.TEXT_SCORE,
        }).setOrigin(0.5);

        // カウンター表示
        this.counterText = this.add.text(width / 2, 65, '', {
            fontSize: '14px',
            color: '#888888',
        }).setOrigin(0.5);

        // 称号表示エリア（中央の大きなエリア）
        this.titleDisplay = this.add.container(width / 2, height / 2 - 30);

        // 進行ヒント
        this.hintText = this.add.text(width / 2, height - 40, 'クリックで次へ', {
            fontSize: '14px',
            color: '#666666',
        }).setOrigin(0.5);

        if (this.awardedTitles.length === 0) {
            this.counterText.setText('');
            this.hintText.destroy();
            this.add.text(width / 2, height / 2, '今回は称号なし…！\n次こそ狙おう！', {
                fontSize: '20px',
                color: '#999999',
                align: 'center',
            }).setOrigin(0.5);

            this.time.delayedCall(2000, () => this.goToResult());
        } else {
            console.log(`[Ceremony] Total titles to award: ${this.awardedTitles.length}`);
            this.showNextTitle();
        }
    }

    showNextTitle() {
        if (this.advancing) return;
        this.advancing = true;

        const { width, height } = this.cameras.main;
        const allResults = this.registry.get(REGISTRY.SCORING_RESULT);

        if (this.currentTitleIndex >= this.awardedTitles.length) {
            this.hintText.setText('');
            this.time.delayedCall(1500, () => this.goToResult());
            return;
        }

        const title = this.awardedTitles[this.currentTitleIndex];

        // 前の称号をフェードアウトしてクリア
        if (this.titleDisplay.length > 0) {
            this.tweens.add({
                targets: this.titleDisplay.getAll(),
                alpha: 0,
                duration: 200,
                onComplete: () => {
                    this.titleDisplay.removeAll(true);
                    this._displayTitle(title, allResults);
                }
            });
        } else {
            this._displayTitle(title, allResults);
        }
    }

    _displayTitle(title, allResults) {
        const total = this.awardedTitles.length;

        // カウンター更新
        this.counterText.setText(`${this.currentTitleIndex + 1} / ${total}`);

        // 受賞者名
        const winnerNames = title.winners.map(pid => {
            const p = allResults.find(r => r.playerId === pid);
            return p ? p.name : pid;
        }).join('、');

        // 称号名（大きく中央に）
        const titleText = this.add.text(0, -40, `${title.emoji} ${title.name}`, {
            fontSize: '32px',
            color: GAME_CONFIG.COLORS.TEXT_SCORE,
        }).setOrigin(0.5).setAlpha(0);
        this.titleDisplay.add(titleText);

        // ポイント
        const pointsText = this.add.text(0, 10, `+${title.points}点`, {
            fontSize: '24px',
            color: GAME_CONFIG.COLORS.TEXT_ACCENT,
        }).setOrigin(0.5).setAlpha(0);
        this.titleDisplay.add(pointsText);

        // 受賞者
        const winnerText = this.add.text(0, 50, `→ ${winnerNames}`, {
            fontSize: '20px',
            color: GAME_CONFIG.COLORS.TEXT_PRIMARY,
        }).setOrigin(0.5).setAlpha(0);
        this.titleDisplay.add(winnerText);

        // アナウンス
        if (title.announcement) {
            const announceText = this.add.text(0, 85, title.announcement, {
                fontSize: '14px',
                color: '#cccccc',
                fontStyle: 'italic',
            }).setOrigin(0.5).setAlpha(0);
            this.titleDisplay.add(announceText);
            this.tweens.add({ targets: announceText, alpha: 1, duration: 400, delay: 600 });
        }

        // 称号発表音
        this.sound.play('sfx_title_reveal');

        // フェードイン
        this.tweens.add({ targets: titleText, alpha: 1, duration: 500, ease: 'Power2' });
        this.tweens.add({ targets: pointsText, alpha: 1, duration: 500, delay: 200 });
        this.tweens.add({ targets: winnerText, alpha: 1, duration: 500, delay: 400 });

        console.log(`[Ceremony] Title: ${title.name} → ${winnerNames} +${title.points}pts`);

        // ボーナス加算
        title.winners.forEach(pid => {
            this.titleBonuses[pid] = (this.titleBonuses[pid] || 0) + title.points;
        });

        this.currentTitleIndex++;

        // 進行可能にする（少し待ってから）
        this.time.delayedCall(800, () => {
            this.advancing = false;
        });

        // クリックで次へ
        this.input.once('pointerdown', () => {
            this.showNextTitle();
        });

        // 自動進行（4秒）
        this.autoTimer = this.time.delayedCall(4000, () => {
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

        this.registry.set(REGISTRY.FINAL_SCORES, finalScores);
        this.scene.start(SCENES.RESULT);
    }
}
