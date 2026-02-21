/**
 * GameLogic - ゲームフェーズ管理のステートマシン
 * 全フェーズの進行・タイムアウト・状態管理を行う
 */
const CardPool = require('./cardPool');

const PHASES = [
    'char_select',
    'soup_select',
    'noodle_select',
    'draft',
    'placement',
    'scoring',
    'ceremony',
    'result',
];

const TIMERS = {
    char_select: 15,
    soup_select: 10,
    noodle_select: 10,
    draft: 15,
    placement: 60,
};

class GameLogic {
    constructor(room, io, dataFiles) {
        this.room = room;
        this.io = io;
        this.data = dataFiles; // { ingredients, soups, noodles, characters, customers, scoring, titles }
        this.phase = null;
        this.phaseIndex = -1;
        this.timeout = null;

        // ゲーム状態
        this.state = {
            playerCount: room.maxPlayers,
            selections: {},         // playerId → { characterId, soup, noodle }
            availableCharacters: this.data.characters.map(c => c.id),
            activeCustomers: [],    // お客さんID 2つ
            hands: [],              // ドラフト用手札 [hand0, hand1, ...]
            picks: {},              // playerId → [picked cards]
            draftRound: 0,
            grids: {},              // playerId → grid[3][3]
            scoringResults: null,
            ceremonyResults: null,
            finalScores: null,
        };
    }

    /** 次のフェーズに進む */
    nextPhase() {
        this.clearTimeout();
        this.phaseIndex++;
        if (this.phaseIndex >= PHASES.length) {
            this.phase = 'finished';
            return;
        }
        this.phase = PHASES[this.phaseIndex];
        this.room.phase = this.phase;
        console.log(`[GameLogic] Room ${this.room.code}: Phase → ${this.phase}`);
        this.startPhase();
    }

    clearTimeout() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }

    /** 指定秒後にコールバックを実行 */
    setPhaseTimeout(seconds, callback) {
        this.clearTimeout();
        this.timeout = setTimeout(callback, seconds * 1000);
    }

    /** フェーズ開始 */
    startPhase() {
        switch (this.phase) {
            case 'char_select':
                this.startCharSelect();
                break;
            case 'soup_select':
                this.startSoupSelect();
                break;
            case 'noodle_select':
                this.startNoodleSelect();
                break;
            case 'draft':
                this.startDraft();
                break;
            case 'placement':
                this.startPlacement();
                break;
            case 'scoring':
                this.startScoring();
                break;
            case 'ceremony':
                this.startCeremony();
                break;
            case 'result':
                this.startResult();
                break;
        }
    }

    // ========================================
    // キャラ選択
    // ========================================

    startCharSelect() {
        // お客さん2人をランダム選出
        const shuffled = [...this.data.customers].sort(() => Math.random() - 0.5);
        this.state.activeCustomers = [shuffled[0].id, shuffled[1].id];

        this.io.to(this.room.code).emit('phase_char_select', {
            availableCharacters: this.state.availableCharacters,
            customers: this.state.activeCustomers,
            timeLimit: TIMERS.char_select,
        });

        this.state.selections = {};
        this.setPhaseTimeout(TIMERS.char_select + 1, () => this.forceCharSelect());
    }

    handleCharSelect(playerId, characterId) {
        if (this.phase !== 'char_select') return;
        if (this.state.selections[playerId]?.characterId) return; // 既に選択済み

        // 早い者勝ち
        if (!this.state.availableCharacters.includes(characterId)) {
            return; // 既に取られている
        }

        this.state.availableCharacters = this.state.availableCharacters.filter(id => id !== characterId);
        if (!this.state.selections[playerId]) this.state.selections[playerId] = {};
        this.state.selections[playerId].characterId = characterId;

        this.io.to(this.room.code).emit('character_selected', { playerId, characterId });

        // 全員選択済みか確認
        if (this.allPlayersSelected('characterId')) {
            this.nextPhase();
        }
    }

    forceCharSelect() {
        if (this.phase !== 'char_select') return;
        for (const p of this.room.players) {
            if (!this.state.selections[p.id]?.characterId) {
                const randomChar = this.state.availableCharacters[
                    Math.floor(Math.random() * this.state.availableCharacters.length)
                ];
                this.handleCharSelect(p.id, randomChar);
            }
        }
    }

    // ========================================
    // スープ選択
    // ========================================

    startSoupSelect() {
        this.io.to(this.room.code).emit('phase_soup_select', {
            timeLimit: TIMERS.soup_select,
        });

        this.setPhaseTimeout(TIMERS.soup_select + 1, () => this.forceSoupSelect());
    }

    handleSoupSelect(playerId, soupId) {
        if (this.phase !== 'soup_select') return;
        if (this.state.selections[playerId]?.soup) return;

        if (!this.state.selections[playerId]) this.state.selections[playerId] = {};
        this.state.selections[playerId].soup = soupId;

        if (this.allPlayersSelected('soup')) {
            this.io.to(this.room.code).emit('soup_results', {
                selections: this.getSelectionMap('soup'),
            });
            this.nextPhase();
        }
    }

    forceSoupSelect() {
        if (this.phase !== 'soup_select') return;
        const soups = this.data.soups.map(s => s.id);
        for (const p of this.room.players) {
            if (!this.state.selections[p.id]?.soup) {
                this.handleSoupSelect(p.id, soups[Math.floor(Math.random() * soups.length)]);
            }
        }
    }

    // ========================================
    // 麺選択
    // ========================================

    startNoodleSelect() {
        this.io.to(this.room.code).emit('phase_noodle_select', {
            timeLimit: TIMERS.noodle_select,
        });

        this.setPhaseTimeout(TIMERS.noodle_select + 1, () => this.forceNoodleSelect());
    }

    handleNoodleSelect(playerId, noodleId) {
        if (this.phase !== 'noodle_select') return;
        if (this.state.selections[playerId]?.noodle) return;

        if (!this.state.selections[playerId]) this.state.selections[playerId] = {};
        this.state.selections[playerId].noodle = noodleId;

        if (this.allPlayersSelected('noodle')) {
            this.io.to(this.room.code).emit('noodle_results', {
                selections: this.getSelectionMap('noodle'),
            });
            this.nextPhase();
        }
    }

    forceNoodleSelect() {
        if (this.phase !== 'noodle_select') return;
        const noodles = this.data.noodles.map(n => n.id);
        for (const p of this.room.players) {
            if (!this.state.selections[p.id]?.noodle) {
                this.handleNoodleSelect(p.id, noodles[Math.floor(Math.random() * noodles.length)]);
            }
        }
    }

    // ========================================
    // ドラフト
    // ========================================

    startDraft() {
        const pool = new CardPool(this.data.ingredients);
        const { hands } = pool.deal(this.state.playerCount);
        this.state.hands = hands;
        this.state.draftRound = 0;

        // 各プレイヤーのピック初期化
        this.state.picks = {};
        this.room.players.forEach(p => { this.state.picks[p.id] = []; });

        this.sendDraftHands();
    }

    sendDraftHands() {
        const round = this.state.draftRound;

        this.room.players.forEach((p, i) => {
            const socketId = p.id;
            this.io.to(socketId).emit('draft_hand', {
                hand: this.state.hands[i],
                round: round + 1,
                totalRounds: 9,
                picked: this.state.picks[socketId],
                timeLimit: TIMERS.draft,
            });
        });

        this.setPhaseTimeout(TIMERS.draft + 1, () => this.forceDraftPick());
    }

    handleDraftPick(playerId, ingredientId) {
        if (this.phase !== 'draft') return;

        // プレイヤーのインデックスを取得
        const playerIdx = this.room.players.findIndex(p => p.id === playerId);
        if (playerIdx === -1) return;

        const hand = this.state.hands[playerIdx];
        const cardIdx = hand.indexOf(ingredientId);
        if (cardIdx === -1) return; // 手札にないカード

        // 既にこのラウンドでピック済みか
        const expectedPicks = this.state.draftRound;
        if (this.state.picks[playerId].length > expectedPicks) return;

        // ピック
        this.state.picks[playerId].push(ingredientId);
        hand.splice(cardIdx, 1);

        console.log(`[GameLogic] Draft R${this.state.draftRound + 1}: ${playerId} picks ${ingredientId}`);

        // 全員ピック済みか
        const allPicked = this.room.players.every(p =>
            this.state.picks[p.id].length > this.state.draftRound
        );

        if (allPicked) {
            this.advanceDraftRound();
        }
    }

    forceDraftPick() {
        if (this.phase !== 'draft') return;
        this.room.players.forEach((p, i) => {
            if (this.state.picks[p.id].length <= this.state.draftRound) {
                const hand = this.state.hands[i];
                if (hand.length > 0) {
                    this.handleDraftPick(p.id, hand[0]);
                }
            }
        });
    }

    advanceDraftRound() {
        // ピック結果を通知
        const roundPicks = {};
        this.room.players.forEach(p => {
            roundPicks[p.id] = this.state.picks[p.id][this.state.draftRound];
        });

        this.io.to(this.room.code).emit('draft_round_done', {
            round: this.state.draftRound + 1,
            picks: roundPicks,
        });

        this.state.draftRound++;

        // 手札を左隣に回す
        const firstHand = this.state.hands.shift();
        this.state.hands.push(firstHand);

        if (this.state.draftRound >= 9) {
            // ドラフト完了
            this.room.players.forEach(p => {
                this.io.to(p.id).emit('draft_complete', {
                    yourIngredients: this.state.picks[p.id],
                });
            });
            this.nextPhase();
        } else {
            setTimeout(() => this.sendDraftHands(), 500);
        }
    }

    // ========================================
    // 盛り付け
    // ========================================

    startPlacement() {
        this.state.grids = {};

        this.io.to(this.room.code).emit('phase_placement', {
            timeLimit: TIMERS.placement,
        });

        this.setPhaseTimeout(TIMERS.placement + 2, () => this.forcePlacement());
    }

    handlePlacement(playerId, grid) {
        if (this.phase !== 'placement') return;
        if (this.state.grids[playerId]) return; // 既に提出済み

        this.state.grids[playerId] = grid;
        console.log(`[GameLogic] Placement: ${playerId} submitted grid`);

        if (this.allPlayersSubmittedGrids()) {
            this.io.to(this.room.code).emit('all_placed', {});
            this.nextPhase();
        }
    }

    forcePlacement() {
        if (this.phase !== 'placement') return;
        for (const p of this.room.players) {
            if (!this.state.grids[p.id]) {
                // 空のグリッドで提出
                this.handlePlacement(p.id, [
                    [null, null, null],
                    [null, null, null],
                    [null, null, null],
                ]);
            }
        }
    }

    // ========================================
    // 採点
    // ========================================

    startScoring() {
        const ScoringEngine = require('./scoringEngine');
        const engine = new ScoringEngine(this.data.scoring, this.data.ingredients);

        const customerDataList = this.state.activeCustomers.map(id =>
            this.data.customers.find(c => c.id === id)
        );

        // 全プレイヤーの状態構築
        const allPlayersStates = this.room.players.map(p => ({
            playerId: p.id,
            name: p.name,
            characterId: this.state.selections[p.id]?.characterId,
            soup: this.state.selections[p.id]?.soup,
            noodle: this.state.selections[p.id]?.noodle,
            grid: this.state.grids[p.id] || [[null,null,null],[null,null,null],[null,null,null]],
        }));

        // 全プレイヤーの採点
        const allResults = allPlayersStates.map(pState => {
            const charData = this.data.characters.find(c => c.id === pState.characterId);
            const scores = engine.calculate(pState, charData, customerDataList, allPlayersStates);
            return { playerId: pState.playerId, name: pState.name, state: pState, scores };
        });

        this.state.scoringResults = allResults;

        // 称号計算
        const awardedTitles = engine.calcLayer4(allResults, this.data.titles, customerDataList);
        this.state.awardedTitles = awardedTitles;

        // 称号ボーナス計算
        const titleBonuses = {};
        allResults.forEach(r => { titleBonuses[r.playerId] = 0; });
        awardedTitles.forEach(title => {
            title.winners.forEach(pid => {
                titleBonuses[pid] = (titleBonuses[pid] || 0) + title.points;
            });
        });

        // 最終スコア
        const finalScores = allResults.map(r => ({
            playerId: r.playerId,
            name: r.name,
            characterId: r.state.characterId,
            baseScore: r.scores.baseTotal,
            titleBonus: titleBonuses[r.playerId] || 0,
            totalScore: r.scores.baseTotal + (titleBonuses[r.playerId] || 0),
        }));

        finalScores.sort((a, b) => b.totalScore - a.totalScore);
        finalScores.forEach((s, i) => { s.rank = i + 1; });

        this.state.finalScores = finalScores;

        // クライアントに全結果データをまとめて送信
        // （scoring→ceremony→resultが即座に連続するため、1イベントにバンドル）
        this.io.to(this.room.code).emit('scoring_results', {
            players: allResults.map(r => ({
                playerId: r.playerId,
                name: r.name,
                scores: r.scores,
                state: r.state,
            })),
            customers: this.state.activeCustomers,
            ceremony: {
                titles: awardedTitles,
                finalScores: finalScores,
            },
        });

        // フェーズをresultに設定（自動進行はしない、クライアントが表示を管理）
        this.room.phase = 'result';
    }

    // ========================================
    // 称号セレモニー（オンラインではscoringにバンドル済み）
    // ========================================

    startCeremony() {
        // オンラインではscoring_resultsにバンドル済みのため何もしない
    }

    // ========================================
    // 結果発表（オンラインではscoringにバンドル済み）
    // ========================================

    startResult() {
        // オンラインではscoring_resultsにバンドル済みのため何もしない
        this.room.phase = 'result';
    }

    // ========================================
    // ヘルパー
    // ========================================

    allPlayersSelected(field) {
        return this.room.players.every(p =>
            this.state.selections[p.id] && this.state.selections[p.id][field]
        );
    }

    allPlayersSubmittedGrids() {
        return this.room.players.every(p => this.state.grids[p.id]);
    }

    getSelectionMap(field) {
        const map = {};
        this.room.players.forEach(p => {
            map[p.id] = this.state.selections[p.id]?.[field];
        });
        return map;
    }
}

module.exports = GameLogic;
