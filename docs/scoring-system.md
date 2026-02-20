# 採点システム詳細仕様

## 入出力

```
入力:
  soup: string         // 選択スープID
  noodle: string       // 選択麺ID
  grid: (string|null)[3][3]  // 3×3配置（具材ID or null）
  characterId: string  // プレイヤーキャラID
  customerIds: string[2]     // 今回のお客さん2人
  allPlayers: object[]       // 全プレイヤー情報（称号判定用）

出力:
  layer1: { soupNoodle, colorBonus, adjGood, adjBad, center, duplicate, subtotal }
  layer2: { bonuses: [{label, points}], subtotal }
  layer3: { [customerId]: { bonuses, subtotal }, subtotal }
  layer4: { titles: [{id, name, points}], subtotal }
  total: number
```

---

## レイヤー1: 基本ルール

### 1-1. スープ×麺相性
`scoring.json.soupNoodleCompatibility[soup][noodle]` → 0〜4点

### 1-2. 彩りボーナス
1. grid上の全配置具材の `colorTag` を収集（`ingredients.json` 参照）
2. ユニーク色数をカウント
3. `scoring.json.colorBonus[色数]` → 0〜8点

### 1-3. 隣接ボーナス
1. grid上の全隣接ペア列挙（上下左右のみ、null除外）
2. `scoring.json.adjacencyGoodPairs.pairs` に一致 → +2点/ペア
3. `scoring.json.adjacencyBadPairs.pairs` に一致 → -1点/ペア
4. **ペア順序は不問**（[A,B]と[B,A]は同じ）

### 1-4. 中央ボーナス
`grid[1][1] !== null` → +1点

### 1-5. 同具材ペナルティ
各具材IDの出現回数をカウント、2回以上は `(出現数-1) × -1`

---

## レイヤー2: キャラボーナス

`characters.json` の該当キャラ `.bonuses` を順番に評価。

### condition判定ロジック

```javascript
function evaluateCondition(cond, value, playerState, allPlayers) {
  const { soup, noodle, grid, placedIngredients } = playerState;
  
  switch (cond) {
    case 'soup_is':         return soup === value;
    case 'soup_in':         return value.includes(soup);
    case 'noodle_is':       return noodle === value;
    case 'has_ingredient':  return placedIngredients.includes(value);
    case 'not_has_ingredient': return !placedIngredients.includes(value);
    case 'has_both_ingredients': return value.every(v => placedIngredients.includes(v));
    case 'placed_count_eq': return placedIngredients.length === value;
    case 'placed_count_gte': return placedIngredients.length >= value;
    case 'placed_count_lte': return placedIngredients.length <= value;
    case 'color_count_gte': return getUniqueColors(placedIngredients).length >= value;
    case 'category_count_gte':
      return placedIngredients.filter(i => getCategory(i) === value.category).length >= value.count;
    case 'symmetrical_blanks': return isSymmetrical(grid) && hasBlank(grid);
    case 'has_blanks': return hasBlank(grid);
    case 'unique_ingredients_gte':
      return getUniqueToPlayer(placedIngredients, allPlayers).length >= value;
    case 'adjacency_pairs_gte':
      return countGoodAdjacencyPairs(grid) >= value;
    case 'adjacency_good_pairs_gte':
      return countGoodAdjacencyPairs(grid) >= value;
    case 'adjacency_bad_pairs_eq':
      return countBadAdjacencyPairs(grid) === value;
    case 'center_ingredient_is':
      return grid[1][1] !== null && value.includes(grid[1][1]);
    case 'regional_set_complete':
      return checkRegionalSet(soup, noodle, placedIngredients) !== null;
    case 'soup_noodle_max_compatibility':
      return getSoupNoodleScore(soup, noodle) === 4;
    case 'customer_all_conditions_met':
      // 称号判定で使用、別途処理
      return false;
  }
}
```

### 左右対称判定

```javascript
function isSymmetrical(grid) {
  const pairs = [[[0,0],[2,0]], [[0,1],[2,1]], [[0,2],[2,2]]];
  let hasBlank = false;
  for (const [[lx,ly],[rx,ry]] of pairs) {
    const leftEmpty = grid[ly][lx] === null;
    const rightEmpty = grid[ry][rx] === null;
    if (leftEmpty !== rightEmpty) return false;
    if (leftEmpty) hasBlank = true;
  }
  return hasBlank; // 全部埋まってるのは対称扱いにしない
}
```

---

## レイヤー3: お客さんカード

`customers.json` の2人分について、各 `bonuses` をレイヤー2と同じ `evaluateCondition` で評価。

---

## レイヤー4: 称号

### 比較系（全プレイヤー比較→最大値の人に付与、同率は全員）

| 称号ID | 比較対象 |
|--------|---------|
| `guzawasan_king` | `placedIngredients.length` が最大 |
| `moritsuke_master` | `layer1.colorBonus + layer1.center` が最大 |
| `aji_king` | `layer1.soupNoodle + layer1.adjGood + layer1.adjBad` が最大 |

### 達成系

| 称号ID | 判定 |
|--------|------|
| `regional_master` | `checkRegionalSet()` が non-null |
| `yohaku_beauty` | 空き2つ以上 かつ 左右対称 |
| `zenbu_nose` | 配置数 === 9 |
| `rainbow` | 色の種類数 >= 6 |
| `only_one` | 他全員と被らない具材 >= 3 |
| `perfect_satisfy` | お客さんいずれか1人の全bonus条件を達成 |

---

## ご当地セット判定

```javascript
function checkRegionalSet(soup, noodle, placed) {
  const sets = scoring.regionalSets;
  for (const [region, set] of Object.entries(sets)) {
    if (soup !== set.soup) continue;
    if (noodle !== set.noodle) continue;
    const matchCount = set.pool.filter(id => placed.includes(id)).length;
    if (matchCount >= set.min) return region;
  }
  return null;
}
```
