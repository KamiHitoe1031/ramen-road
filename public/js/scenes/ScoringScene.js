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

        // 背景
        this.add.image(width / 2, height / 2, 'bg_table').setDisplaySize(width, height).setAlpha(0.3);

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

        // ログ出力
        this.allResults.forEach(r => {
            console.log(`[Scoring] ${r.name}: L1=${r.scores.layer1.subtotal} L2=${r.scores.layer2.subtotal} L3=${r.scores.layer3.subtotal} Total=${r.scores.baseTotal}`);
        });

        // 自分の結果を表示
        const myResult = this.allResults.find(r => r.playerId === 'player');
        const s = myResult.scores;

        this.add.text(width / 2, 16, '📊 採点結果', {
            fontSize: GAME_CONFIG.FONT.HEADING_SIZE,
            color: GAME_CONFIG.COLORS.TEXT_PRIMARY,
        }).setOrigin(0.5);

        // コンパクトなフォントサイズで表示
        const fontSize = '12px';
        const titleSize = '14px';
        const lineH = 16;
        const sectionGap = 6;
        let y = 50;
        const leftX = 40;

        // レイヤー1
        y = this.drawSection(leftX, y, '【基本ルール】', [
            `スープ×麺相性 ... +${s.layer1.soupNoodle}`,
            `彩りボーナス ... +${s.layer1.colorBonus}`,
            `隣接(良) ... +${s.layer1.adjacencyGood}`,
            s.layer1.adjacencyBad < 0 ? `隣接(悪) ... ${s.layer1.adjacencyBad}` : null,
            `中央 ... +${s.layer1.centerBonus}`,
            s.layer1.duplicatePenalty < 0 ? `重複 ... ${s.layer1.duplicatePenalty}` : null,
        ].filter(Boolean), `小計: ${s.layer1.subtotal}点`, titleSize, fontSize, lineH);

        // レイヤー2
        const charName = characters.find(c => c.id === myResult.state.characterId)?.name || '';
        const l2Lines = s.layer2.bonuses.map(b => `${b.label} ... +${b.points}`);
        if (l2Lines.length === 0) l2Lines.push('（該当なし）');
        y = this.drawSection(leftX, y + sectionGap, `【キャラ: ${charName}】`, l2Lines, `小計: ${s.layer2.subtotal}点`, titleSize, fontSize, lineH);

        // レイヤー3
        const l3Lines = [];
        for (const custId in s.layer3.customers) {
            const c = s.layer3.customers[custId];
            l3Lines.push(`■ ${c.name}:`);
            if (c.bonuses.length > 0) {
                c.bonuses.forEach(b => l3Lines.push(`  ${b.label} ... +${b.points}`));
            } else {
                l3Lines.push('  （該当なし）');
            }
        }
        y = this.drawSection(leftX, y + sectionGap, '【お客さん評価】', l3Lines, `小計: ${s.layer3.subtotal}点`, titleSize, fontSize, lineH);

        // スコアティック音
        this.sound.play('sfx_score_tick');

        // 基本合計
        this.add.text(width / 2, y + 14, `基本合計: ${s.baseTotal}点`, {
            fontSize: '22px',
            color: GAME_CONFIG.COLORS.TEXT_SCORE,
            fontStyle: 'bold',
        }).setOrigin(0.5);

        // 称号セレモニーへボタン
        const nextBtn = this.add.rectangle(width / 2, height - 30, 260, 44, GAME_CONFIG.COLORS.BTN_PRIMARY)
            .setInteractive({ useHandCursor: true });
        this.add.text(width / 2, height - 30, '🏆 称号セレモニーへ →', {
            fontSize: '16px',
            color: '#ffffff',
        }).setOrigin(0.5);

        nextBtn.on('pointerdown', () => {
            this.sound.play('sfx_click');
            this.registry.set(REGISTRY.SCORING_RESULT, this.allResults);
            this.scene.start(SCENES.CEREMONY);
        });
    }

    drawSection(x, startY, title, lines, subtotalText, titleSize, fontSize, lineH) {
        let y = startY;

        this.add.text(x, y, title, {
            fontSize: titleSize,
            color: GAME_CONFIG.COLORS.TEXT_ACCENT,
            fontStyle: 'bold',
        });
        y += lineH + 4;

        lines.forEach(line => {
            this.add.text(x + 10, y, line, {
                fontSize: fontSize,
                color: GAME_CONFIG.COLORS.TEXT_PRIMARY,
            });
            y += lineH;
        });

        this.add.text(x + 10, y, subtotalText, {
            fontSize: '13px',
            color: GAME_CONFIG.COLORS.TEXT_SCORE,
        });
        y += lineH + 2;

        return y;
    }
}
