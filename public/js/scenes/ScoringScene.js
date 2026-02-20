/**
 * ScoringScene - 4レイヤーの採点結果をアニメーション付きで表示
 */
class ScoringScene extends Phaser.Scene {
    constructor() {
        super(SCENES.SCORING);
    }

    init() {
        this.allResults = [];
    }

    create() {
        const { width, height } = this.cameras.main;
        const scoring = this.registry.get('data_scoring');
        const ingredients = this.registry.get('data_ingredients');
        const characters = this.registry.get('data_characters');
        const allCustomers = this.registry.get('data_customers');
        const customerIds = this.registry.get(REGISTRY.ACTIVE_CUSTOMERS);
        const activeCustomers = customerIds.map(id => allCustomers.find(c => c.id === id));
        const allPlayers = this.registry.get(REGISTRY.ALL_PLAYERS);

        const engine = new ScoringEngine(scoring, ingredients);

        // 全プレイヤーの採点
        this.allResults = allPlayers.map(p => {
            const charData = characters.find(c => c.id === p.characterId);
            const scores = engine.calculate(
                { ...p, playerId: p.playerId },
                charData,
                activeCustomers,
                allPlayers.map(ap => ({ ...ap }))
            );
            return { playerId: p.playerId, name: p.name, state: p, scores };
        });

        // 自分の結果を表示
        const myResult = this.allResults.find(r => r.playerId === 'player');
        const s = myResult.scores;

        this.add.text(width / 2, 20, '📊 採点結果', {
            fontSize: GAME_CONFIG.FONT.HEADING_SIZE,
            color: GAME_CONFIG.COLORS.TEXT_PRIMARY,
        }).setOrigin(0.5);

        let y = 60;
        const leftX = 50;
        const rightX = width - 50;

        // レイヤー1
        y = this.drawSection(leftX, y, '【基本ルール】', [
            `スープ×麺相性 ... +${s.layer1.soupNoodle}`,
            `彩りボーナス ... +${s.layer1.colorBonus}`,
            `隣接ボーナス(良) ... +${s.layer1.adjacencyGood}`,
            s.layer1.adjacencyBad < 0 ? `隣接ペナルティ(悪) ... ${s.layer1.adjacencyBad}` : null,
            `中央ボーナス ... +${s.layer1.centerBonus}`,
            s.layer1.duplicatePenalty < 0 ? `重複ペナルティ ... ${s.layer1.duplicatePenalty}` : null,
        ].filter(Boolean), `小計: ${s.layer1.subtotal}点`);

        // レイヤー2
        const charName = characters.find(c => c.id === myResult.state.characterId)?.name || '';
        const l2Lines = s.layer2.bonuses.map(b => `${b.label} ... +${b.points}`);
        if (l2Lines.length === 0) l2Lines.push('（該当なし）');
        y = this.drawSection(leftX, y + 10, `【キャラ: ${charName}】`, l2Lines, `小計: ${s.layer2.subtotal}点`);

        // レイヤー3
        const l3Lines = [];
        for (const custId in s.layer3.customers) {
            const c = s.layer3.customers[custId];
            l3Lines.push(`${c.name}:`);
            if (c.bonuses.length > 0) {
                c.bonuses.forEach(b => l3Lines.push(`  ${b.label} ... +${b.points}`));
            } else {
                l3Lines.push('  （該当なし）');
            }
        }
        y = this.drawSection(leftX, y + 10, '【お客さん評価】', l3Lines, `小計: ${s.layer3.subtotal}点`);

        // 基本合計
        this.add.text(width / 2, y + 20, `基本合計: ${s.baseTotal}点`, {
            fontSize: GAME_CONFIG.FONT.SCORE_SIZE,
            color: GAME_CONFIG.COLORS.TEXT_SCORE,
            fontStyle: 'bold',
        }).setOrigin(0.5);

        // 称号セレモニーへボタン
        const nextBtn = this.add.rectangle(width / 2, height - 40, 260, 48, GAME_CONFIG.COLORS.BTN_PRIMARY)
            .setInteractive({ useHandCursor: true });
        this.add.text(width / 2, height - 40, '🏆 称号セレモニーへ →', {
            fontSize: '18px',
            color: '#ffffff',
        }).setOrigin(0.5);

        nextBtn.on('pointerdown', () => {
            this.registry.set(REGISTRY.SCORING_RESULT, this.allResults);
            this.scene.start(SCENES.CEREMONY);
        });
    }

    drawSection(x, startY, title, lines, subtotalText) {
        let y = startY;

        this.add.text(x, y, title, {
            fontSize: '16px',
            color: GAME_CONFIG.COLORS.TEXT_ACCENT,
            fontStyle: 'bold',
        });
        y += 24;

        lines.forEach(line => {
            this.add.text(x + 10, y, line, {
                fontSize: '14px',
                color: GAME_CONFIG.COLORS.TEXT_PRIMARY,
            });
            y += 20;
        });

        this.add.text(x + 10, y, subtotalText, {
            fontSize: '15px',
            color: GAME_CONFIG.COLORS.TEXT_SCORE,
        });
        y += 22;

        return y;
    }
}
