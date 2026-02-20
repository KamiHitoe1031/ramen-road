/**
 * 採点エンジン
 * 4レイヤーの採点をすべて処理する
 * Phase 1-2ではクライアント側で動作、Phase 3でサーバーに移行
 */
class ScoringEngine {

    constructor(scoringData, ingredientsData) {
        this.scoring = scoringData;
        this.ingredients = ingredientsData;
        // 具材IDから具材データへのマップ
        this.ingredientMap = {};
        ingredientsData.forEach(ing => { this.ingredientMap[ing.id] = ing; });
    }

    /**
     * メイン採点関数
     * @param {object} playerState - { soup, noodle, grid, characterId }
     * @param {object} characterData - キャラクターJSON
     * @param {object[]} customerDataList - 今回のお客さん2人のJSON
     * @param {object[]} allPlayersStates - 全プレイヤーの状態（称号判定用）
     * @returns {object} 採点結果
     */
    calculate(playerState, characterData, customerDataList, allPlayersStates) {
        const result = {
            layer1: this.calcLayer1(playerState),
            layer2: this.calcLayer2(playerState, characterData, allPlayersStates),
            layer3: this.calcLayer3(playerState, customerDataList, allPlayersStates),
            layer4: [],  // 称号は別途 calcLayer4 で全員分まとめて計算
        };

        result.baseTotal = result.layer1.subtotal + result.layer2.subtotal + result.layer3.subtotal;
        return result;
    }

    // ========================================
    // レイヤー1: 基本ルール
    // ========================================

    calcLayer1(playerState) {
        const { soup, noodle, grid } = playerState;
        const placed = this.getPlacedIngredients(grid);

        const soupNoodle = this.calcSoupNoodleScore(soup, noodle);
        const colorBonus = this.calcColorBonus(placed);
        const adjGood = this.calcAdjacencyGood(grid);
        const adjBad = this.calcAdjacencyBad(grid);
        const center = this.calcCenterBonus(grid);
        const duplicate = this.calcDuplicatePenalty(placed);

        const subtotal = soupNoodle + colorBonus + adjGood + adjBad + center + duplicate;

        return {
            soupNoodle,
            colorBonus,
            adjacencyGood: adjGood,
            adjacencyBad: adjBad,
            centerBonus: center,
            duplicatePenalty: duplicate,
            subtotal,
            // 分類用（称号判定用）
            artScore: colorBonus + center,
            tasteScore: soupNoodle + adjGood + adjBad,
        };
    }

    calcSoupNoodleScore(soup, noodle) {
        const table = this.scoring.soupNoodleCompatibility.table;
        return (table[soup] && table[soup][noodle]) || 0;
    }

    calcColorBonus(placed) {
        const colors = new Set(placed.map(id => this.ingredientMap[id]?.colorTag).filter(Boolean));
        const count = colors.size;
        return this.scoring.colorBonus.table[String(count)] || 0;
    }

    calcAdjacencyGood(grid) {
        const pairs = this.getAdjacentPairs(grid);
        let score = 0;
        const goodPairs = this.scoring.adjacencyGoodPairs.pairs;
        const ptsPerPair = this.scoring.adjacencyGoodPairs.pointsPerPair;

        for (const [a, b] of pairs) {
            for (const [ga, gb] of goodPairs) {
                if ((a === ga && b === gb) || (a === gb && b === ga)) {
                    score += ptsPerPair;
                }
            }
        }
        return score;
    }

    calcAdjacencyBad(grid) {
        const pairs = this.getAdjacentPairs(grid);
        let score = 0;
        const badPairs = this.scoring.adjacencyBadPairs.pairs;
        const ptsPerPair = this.scoring.adjacencyBadPairs.pointsPerPair;

        for (const [a, b] of pairs) {
            for (const [ba, bb] of badPairs) {
                if ((a === ba && b === bb) || (a === bb && b === ba)) {
                    score += ptsPerPair;
                }
            }
        }
        return score;
    }

    calcCenterBonus(grid) {
        return grid[1][1] !== null ? this.scoring.centerBonus.points : 0;
    }

    calcDuplicatePenalty(placed) {
        const counts = {};
        placed.forEach(id => { counts[id] = (counts[id] || 0) + 1; });

        let penalty = 0;
        for (const id in counts) {
            if (counts[id] > 1) {
                penalty += (counts[id] - 1) * this.scoring.duplicatePenalty.pointsPerDuplicate;
            }
        }
        return penalty;
    }

    // ========================================
    // レイヤー2: キャラボーナス
    // ========================================

    calcLayer2(playerState, characterData, allPlayersStates) {
        const bonuses = [];
        let subtotal = 0;

        for (const bonus of characterData.bonuses) {
            const met = this.evaluateCondition(bonus.condition, bonus.value, playerState, allPlayersStates);
            if (met) {
                bonuses.push({ label: bonus.label, points: bonus.points });
                subtotal += bonus.points;
            }
        }

        return { bonuses, subtotal };
    }

    // ========================================
    // レイヤー3: お客さん評価
    // ========================================

    calcLayer3(playerState, customerDataList, allPlayersStates) {
        const customerResults = {};
        let subtotal = 0;

        for (const customer of customerDataList) {
            const cBonuses = [];
            let cSubtotal = 0;

            for (const bonus of customer.bonuses) {
                const met = this.evaluateCondition(bonus.condition, bonus.value, playerState, allPlayersStates);
                if (met) {
                    cBonuses.push({ label: bonus.label, points: bonus.points });
                    cSubtotal += bonus.points;
                }
            }

            customerResults[customer.id] = { name: customer.name, bonuses: cBonuses, subtotal: cSubtotal };
            subtotal += cSubtotal;
        }

        return { customers: customerResults, subtotal };
    }

    // ========================================
    // レイヤー4: 称号セレモニー
    // ========================================

    calcLayer4(allResults, titlesData) {
        const awarded = [];

        // --- 比較系 ---
        for (const title of titlesData.comparative) {
            let winners = [];
            let maxVal = -Infinity;

            for (const p of allResults) {
                let val = 0;
                switch (title.condition) {
                    case 'most_placed_count':
                        val = this.getPlacedIngredients(p.state.grid).length;
                        break;
                    case 'highest_art_score':
                        val = p.scores.layer1.artScore;
                        break;
                    case 'highest_taste_score':
                        val = p.scores.layer1.tasteScore;
                        break;
                }
                if (val > maxVal) {
                    maxVal = val;
                    winners = [p.playerId];
                } else if (val === maxVal) {
                    winners.push(p.playerId);
                }
            }

            if (maxVal > 0) {
                awarded.push({
                    ...title,
                    winners,
                });
            }
        }

        // --- 達成系 ---
        for (const title of titlesData.achievement) {
            const winners = [];

            for (const p of allResults) {
                let met = false;
                const placed = this.getPlacedIngredients(p.state.grid);

                switch (title.condition) {
                    case 'regional_set_complete':
                        met = this.checkRegionalSet(p.state);
                        break;
                    case 'symmetrical_blanks_with_min2':
                        met = this.checkSymmetry(p.state.grid) &&
                              (9 - placed.length) >= 2;
                        break;
                    case 'placed_count_eq_9':
                        met = placed.length === 9;
                        break;
                    case 'color_count_gte_6': {
                        const colors = new Set(placed.map(id => this.ingredientMap[id]?.colorTag));
                        met = colors.size >= 6;
                        break;
                    }
                    case 'unique_ingredients_gte_3': {
                        const unique = this.countUniqueIngredients(p, allResults);
                        met = unique >= 3;
                        break;
                    }
                    case 'customer_all_conditions_met':
                        met = this.checkPerfectCustomer(p.scores.layer3);
                        break;
                }

                if (met) winners.push(p.playerId);
            }

            if (winners.length > 0) {
                awarded.push({ ...title, winners });
            }
        }

        return awarded;
    }

    // ========================================
    // 条件判定（共通）
    // ========================================

    evaluateCondition(condition, value, playerState, allPlayersStates) {
        const placed = this.getPlacedIngredients(playerState.grid);

        switch (condition) {
            case 'soup_is':
                return playerState.soup === value;

            case 'soup_in':
                return value.includes(playerState.soup);

            case 'noodle_is':
                return playerState.noodle === value;

            case 'has_ingredient':
                return placed.includes(value);

            case 'not_has_ingredient':
                return !placed.includes(value);

            case 'has_both_ingredients':
                return value.every(id => placed.includes(id));

            case 'placed_count_lte':
                return placed.length <= value;

            case 'placed_count_eq':
                return placed.length === value;

            case 'placed_count_gte':
                return placed.length >= value;

            case 'symmetrical_blanks':
                return this.checkSymmetry(playerState.grid);

            case 'color_count_gte': {
                const colors = new Set(placed.map(id => this.ingredientMap[id]?.colorTag).filter(Boolean));
                return colors.size >= value;
            }

            case 'category_count_gte': {
                const { category, count } = value;
                const catCount = placed.filter(id => this.ingredientMap[id]?.category === category).length;
                return catCount >= count;
            }

            case 'adjacency_pairs_gte': {
                const pairs = this.getAdjacentPairs(playerState.grid);
                const goodPairs = this.scoring.adjacencyGoodPairs.pairs;
                let goodCount = 0;
                for (const [a, b] of pairs) {
                    for (const [ga, gb] of goodPairs) {
                        if ((a === ga && b === gb) || (a === gb && b === ga)) goodCount++;
                    }
                }
                return goodCount >= value;
            }

            case 'adjacency_good_pairs_gte': {
                const pairs2 = this.getAdjacentPairs(playerState.grid);
                const gp = this.scoring.adjacencyGoodPairs.pairs;
                let gc = 0;
                for (const [a, b] of pairs2) {
                    for (const [ga, gb] of gp) {
                        if ((a === ga && b === gb) || (a === gb && b === ga)) gc++;
                    }
                }
                return gc >= value;
            }

            case 'adjacency_bad_pairs_eq': {
                const pairs3 = this.getAdjacentPairs(playerState.grid);
                const bp = this.scoring.adjacencyBadPairs.pairs;
                let bc = 0;
                for (const [a, b] of pairs3) {
                    for (const [ba, bb] of bp) {
                        if ((a === ba && b === bb) || (a === bb && b === ba)) bc++;
                    }
                }
                return bc === value;
            }

            case 'center_ingredient_is':
                return value.includes(playerState.grid[1][1]);

            case 'has_blanks':
                return placed.length < 9;

            case 'unique_ingredients_gte': {
                if (!allPlayersStates) return false;
                // 他全員と被らない具材の数
                const otherPlaced = new Set();
                allPlayersStates.forEach(other => {
                    if (other.playerId !== playerState.playerId) {
                        this.getPlacedIngredients(other.grid).forEach(id => otherPlaced.add(id));
                    }
                });
                const uniqueCount = placed.filter(id => !otherPlaced.has(id)).length;
                return uniqueCount >= value;
            }

            case 'regional_set_complete':
                return this.checkRegionalSet(playerState);

            case 'soup_noodle_max_compatibility': {
                const score = this.calcSoupNoodleScore(playerState.soup, playerState.noodle);
                return score === this.scoring.soupNoodleCompatibility.maxPoints;
            }

            default:
                console.warn(`Unknown condition: ${condition}`);
                return false;
        }
    }

    // ========================================
    // ヘルパー関数
    // ========================================

    /** grid[y][x] からnull以外の具材IDリストを取得 */
    getPlacedIngredients(grid) {
        const result = [];
        for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 3; x++) {
                if (grid[y][x] !== null) result.push(grid[y][x]);
            }
        }
        return result;
    }

    /** 隣接する具材ペアのリストを取得（上下左右のみ） */
    getAdjacentPairs(grid) {
        const pairs = [];
        const dirs = [[0,1],[1,0]]; // 下方向と右方向のみチェック（重複防止）

        for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 3; x++) {
                if (grid[y][x] === null) continue;
                for (const [dx, dy] of dirs) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx < 3 && ny < 3 && grid[ny][nx] !== null) {
                        pairs.push([grid[y][x], grid[ny][nx]]);
                    }
                }
            }
        }
        return pairs;
    }

    /** 左右対称チェック */
    checkSymmetry(grid) {
        const symPairs = this.scoring.symmetryCheck.pairs;
        let hasBlank = false;

        for (const [left, right] of symPairs) {
            const leftEmpty = grid[left[1]][left[0]] === null;
            const rightEmpty = grid[right[1]][right[0]] === null;
            if (leftEmpty !== rightEmpty) return false;
            if (leftEmpty) hasBlank = true;
        }

        return hasBlank;
    }

    /** ご当地セット判定 */
    checkRegionalSet(playerState) {
        const sets = this.scoring.regionalSets.sets;
        const placed = this.getPlacedIngredients(playerState.grid);

        for (const regionId in sets) {
            const set = sets[regionId];
            if (playerState.soup !== set.requiredSoup) continue;
            if (playerState.noodle !== set.requiredNoodle) continue;

            const matchCount = set.ingredientPool.filter(id => placed.includes(id)).length;
            if (matchCount >= set.minIngredients) return regionId;
        }

        return false;
    }

    /** 他プレイヤーと被らない具材数 */
    countUniqueIngredients(playerResult, allResults) {
        const myPlaced = this.getPlacedIngredients(playerResult.state.grid);
        const otherPlaced = new Set();

        allResults.forEach(other => {
            if (other.playerId !== playerResult.playerId) {
                this.getPlacedIngredients(other.state.grid).forEach(id => otherPlaced.add(id));
            }
        });

        return myPlaced.filter(id => !otherPlaced.has(id)).length;
    }

    /** お客さん1人の全条件達成チェック */
    checkPerfectCustomer(layer3) {
        for (const custId in layer3.customers) {
            const cust = layer3.customers[custId];
            // お客さんの全bonusが達成されていれば true
            // customerDataから元の条件数を取得する必要があるため、
            // subtotalがmaxBonusと一致するかで判定
            // ※ 簡易実装: bonuses配列の長さが元データの条件数と一致
            if (cust.bonuses.length > 0 && cust.subtotal > 0) {
                // TODO: 正確にはcustomer元データの条件数と比較すべき
                // Phase 2で修正
                return true;
            }
        }
        return false;
    }
}
