class ScoringEngine {
    constructor(scoringData, ingredientsData) {
        this.scoring = scoringData;
        this.ingredients = ingredientsData;
        this.ingredientMap = {};
        ingredientsData.forEach(ing => { this.ingredientMap[ing.id] = ing; });
    }

    calculate(playerState, characterData, customerDataList, allPlayersStates) {
        const result = {
            layer1: this.calcLayer1(playerState),
            layer2: this.calcLayer2(playerState, characterData, allPlayersStates),
            layer3: this.calcLayer3(playerState, customerDataList, allPlayersStates),
            layer4: [],
        };
        result.baseTotal = result.layer1.subtotal + result.layer2.subtotal + result.layer3.subtotal;
        return result;
    }

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
            soupNoodle, colorBonus,
            adjacencyGood: adjGood, adjacencyBad: adjBad,
            centerBonus: center, duplicatePenalty: duplicate,
            subtotal,
            artScore: colorBonus + center,
            tasteScore: soupNoodle + adjGood + adjBad,
        };
    }

    calcSoupNoodleScore(soup, noodle) {
        const compat = this.scoring.soupNoodleCompatibility;
        return (compat[soup] && compat[soup][noodle]) || 0;
    }

    calcColorBonus(placed) {
        const colors = new Set(placed.map(id => this.ingredientMap[id]?.colorTag).filter(Boolean));
        return this.scoring.colorBonus[String(colors.size)] || 0;
    }

    calcAdjacencyGood(grid) {
        const pairs = this.getAdjacentPairs(grid);
        let score = 0;
        const goodPairs = this.scoring.adjacencyGoodPairs.pairs;
        const ptsPerPair = this.scoring.adjacencyGoodPairs.pointsPerPair;
        for (const [a, b] of pairs) {
            for (const [ga, gb] of goodPairs) {
                if ((a === ga && b === gb) || (a === gb && b === ga)) score += ptsPerPair;
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
                if ((a === ba && b === bb) || (a === bb && b === ba)) score += ptsPerPair;
            }
        }
        return score;
    }

    calcCenterBonus(grid) {
        return grid[1][1] !== null ? this.scoring.centerBonus : 0;
    }

    calcDuplicatePenalty(placed) {
        const counts = {};
        placed.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
        let penalty = 0;
        for (const id in counts) {
            if (counts[id] > 1) penalty += (counts[id] - 1) * this.scoring.duplicatePenalty;
        }
        return penalty;
    }

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

    calcLayer4(allResults, titlesData, customerDataList) {
        const awarded = [];
        for (const title of titlesData.comparative) {
            let winners = [];
            let maxVal = -Infinity;
            for (const p of allResults) {
                let val = 0;
                switch (title.condition) {
                    case 'most_placed_count': val = this.getPlacedIngredients(p.state.grid).length; break;
                    case 'highest_art_score': val = p.scores.layer1.artScore; break;
                    case 'highest_taste_score': val = p.scores.layer1.tasteScore; break;
                }
                if (val > maxVal) { maxVal = val; winners = [p.playerId]; }
                else if (val === maxVal) { winners.push(p.playerId); }
            }
            if (maxVal > 0) awarded.push({ ...title, winners });
        }
        for (const title of titlesData.achievement) {
            const winners = [];
            for (const p of allResults) {
                let met = false;
                const placed = this.getPlacedIngredients(p.state.grid);
                switch (title.condition) {
                    case 'regional_set_complete': met = this.checkRegionalSet(p.state); break;
                    case 'symmetrical_blanks_with_min2': met = this.checkSymmetry(p.state.grid) && (9 - placed.length) >= 2; break;
                    case 'placed_count_eq_9': met = placed.length === 9; break;
                    case 'color_count_gte_6': { const colors = new Set(placed.map(id => this.ingredientMap[id]?.colorTag)); met = colors.size >= 6; break; }
                    case 'unique_ingredients_gte_3': { met = this.countUniqueIngredients(p, allResults) >= 3; break; }
                    case 'customer_all_conditions_met': met = this.checkPerfectCustomer(p.scores.layer3, customerDataList); break;
                }
                if (met) winners.push(p.playerId);
            }
            if (winners.length > 0) awarded.push({ ...title, winners });
        }
        return awarded;
    }

    evaluateCondition(condition, value, playerState, allPlayersStates) {
        const placed = this.getPlacedIngredients(playerState.grid);
        switch (condition) {
            case 'soup_is': return playerState.soup === value;
            case 'soup_in': return value.includes(playerState.soup);
            case 'noodle_is': return playerState.noodle === value;
            case 'has_ingredient': return placed.includes(value);
            case 'not_has_ingredient': return !placed.includes(value);
            case 'has_both_ingredients': return value.every(id => placed.includes(id));
            case 'placed_count_lte': return placed.length <= value;
            case 'placed_count_eq': return placed.length === value;
            case 'placed_count_gte': return placed.length >= value;
            case 'symmetrical_blanks': return this.checkSymmetry(playerState.grid);
            case 'color_count_gte': { const colors = new Set(placed.map(id => this.ingredientMap[id]?.colorTag).filter(Boolean)); return colors.size >= value; }
            case 'category_count_gte': { const { category, count } = value; return placed.filter(id => this.ingredientMap[id]?.category === category).length >= count; }
            case 'adjacency_pairs_gte': { const pairs = this.getAdjacentPairs(playerState.grid); const goodPairs = this.scoring.adjacencyGoodPairs.pairs; let gc = 0; for (const [a, b] of pairs) { for (const [ga, gb] of goodPairs) { if ((a === ga && b === gb) || (a === gb && b === ga)) gc++; } } return gc >= value; }
            case 'adjacency_good_pairs_gte': { const pairs2 = this.getAdjacentPairs(playerState.grid); const gp = this.scoring.adjacencyGoodPairs.pairs; let gc2 = 0; for (const [a, b] of pairs2) { for (const [ga, gb] of gp) { if ((a === ga && b === gb) || (a === gb && b === ga)) gc2++; } } return gc2 >= value; }
            case 'adjacency_bad_pairs_eq': { const pairs3 = this.getAdjacentPairs(playerState.grid); const bp = this.scoring.adjacencyBadPairs.pairs; let bc = 0; for (const [a, b] of pairs3) { for (const [ba, bb] of bp) { if ((a === ba && b === bb) || (a === bb && b === ba)) bc++; } } return bc === value; }
            case 'center_ingredient_is': return value.includes(playerState.grid[1][1]);
            case 'has_blanks': return placed.length < 9;
            case 'unique_ingredients_gte': { if (!allPlayersStates) return false; const otherPlaced = new Set(); allPlayersStates.forEach(other => { if (other.playerId !== playerState.playerId) { this.getPlacedIngredients(other.grid).forEach(id => otherPlaced.add(id)); } }); return placed.filter(id => !otherPlaced.has(id)).length >= value; }
            case 'regional_set_complete': return this.checkRegionalSet(playerState);
            case 'soup_noodle_max_compatibility': { const score = this.calcSoupNoodleScore(playerState.soup, playerState.noodle); const compat = this.scoring.soupNoodleCompatibility; const maxPts = Math.max(...Object.values(compat).flatMap(row => Object.values(row))); return score === maxPts; }
            default: console.log(`[ScoringEngine] Unknown condition: ${condition}`); return false;
        }
    }

    getPlacedIngredients(grid) {
        const result = [];
        for (let y = 0; y < 3; y++) { for (let x = 0; x < 3; x++) { if (grid[y][x] !== null) result.push(grid[y][x]); } }
        return result;
    }

    getAdjacentPairs(grid) {
        const pairs = [];
        const dirs = [[0,1],[1,0]];
        for (let y = 0; y < 3; y++) { for (let x = 0; x < 3; x++) { if (grid[y][x] === null) continue; for (const [dx, dy] of dirs) { const nx = x + dx; const ny = y + dy; if (nx < 3 && ny < 3 && grid[ny][nx] !== null) { pairs.push([grid[y][x], grid[ny][nx]]); } } } }
        return pairs;
    }

    checkSymmetry(grid) {
        const symPairs = this.scoring.symmetryPairs;
        let hasBlank = false;
        for (const [left, right] of symPairs) {
            const leftEmpty = grid[left[1]][left[0]] === null;
            const rightEmpty = grid[right[1]][right[0]] === null;
            if (leftEmpty !== rightEmpty) return false;
            if (leftEmpty) hasBlank = true;
        }
        return hasBlank;
    }

    checkRegionalSet(playerState) {
        const sets = this.scoring.regionalSets;
        const placed = this.getPlacedIngredients(playerState.grid);
        for (const regionId in sets) {
            const set = sets[regionId];
            if (playerState.soup !== set.soup) continue;
            if (playerState.noodle !== set.noodle) continue;
            const matchCount = set.pool.filter(id => placed.includes(id)).length;
            if (matchCount >= set.min) return regionId;
        }
        return false;
    }

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

    checkPerfectCustomer(layer3, customerDataList) {
        if (!customerDataList) return false;
        for (const customer of customerDataList) {
            const result = layer3.customers[customer.id];
            if (result && result.bonuses.length === customer.bonuses.length) return true;
        }
        return false;
    }
}

module.exports = ScoringEngine;
