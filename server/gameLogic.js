/**
 * GameLogic - ゲームフェーズ管理のステートマシン
 * Phase 3で本格実装
 *
 * フェーズ順序:
 *   char_select → soup_select → noodle_select → draft → placement → scoring → ceremony → result
 */

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

class GameLogic {
    constructor(room, io) {
        this.room = room;
        this.io = io;
        this.phase = null;
        this.phaseIndex = -1;
    }

    nextPhase() {
        this.phaseIndex++;
        if (this.phaseIndex >= PHASES.length) {
            this.phase = 'finished';
            return;
        }
        this.phase = PHASES[this.phaseIndex];
        this.startPhase();
    }

    startPhase() {
        switch (this.phase) {
            case 'char_select':
                // Phase 3で実装
                break;
            case 'soup_select':
                break;
            case 'noodle_select':
                break;
            case 'draft':
                break;
            case 'placement':
                break;
            case 'scoring':
                break;
            case 'ceremony':
                break;
            case 'result':
                break;
        }
    }
}

module.exports = GameLogic;
