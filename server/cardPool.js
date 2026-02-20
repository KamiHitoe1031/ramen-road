/**
 * カードプール生成・配布
 * Phase 2-3で実装
 *
 * 具材カードをcardCount枚ずつプールに入れ、
 * シャッフル→人数に応じた枚数を配る→除外カードを除く
 */

// Phase 3用 Node.js版
// const ingredientsData = require('../data/ingredients.json');

class CardPool {
    /**
     * @param {object[]} ingredientsData - ingredients.jsonの全データ
     */
    constructor(ingredientsData) {
        this.ingredients = ingredientsData;
    }

    /**
     * 全カードプールを生成（39枚）
     * @returns {string[]} 具材IDの配列
     */
    generatePool() {
        const pool = [];
        this.ingredients.forEach(ing => {
            for (let i = 0; i < ing.cardCount; i++) {
                pool.push(ing.id);
            }
        });
        return pool;
    }

    /**
     * シャッフル（Fisher-Yates）
     */
    shuffle(array) {
        const a = [...array];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    /**
     * 手札を配布
     * @param {number} playerCount - 3 or 4
     * @returns {{ hands: string[][], excluded: string[] }}
     */
    deal(playerCount) {
        const pool = this.shuffle(this.generatePool());
        const handSize = playerCount === 3 ? 10 : 9;
        const totalCards = playerCount * handSize;

        // 除外カード
        const excluded = pool.slice(totalCards);
        const inPlay = pool.slice(0, totalCards);

        // 各プレイヤーに配布
        const hands = [];
        for (let i = 0; i < playerCount; i++) {
            hands.push(inPlay.slice(i * handSize, (i + 1) * handSize));
        }

        return { hands, excluded };
    }
}

// Node.js用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CardPool;
}
