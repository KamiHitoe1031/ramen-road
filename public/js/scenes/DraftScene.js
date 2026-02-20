/**
 * DraftScene - 寿司ゴー方式のドラフト
 * Phase 1ではスキップされる。Phase 2で実装。
 */
class DraftScene extends Phaser.Scene {
    constructor() {
        super(SCENES.DRAFT);
    }

    init(data) {
        this.round = 1;
        this.totalRounds = 9;
        this.myPicks = [];
    }

    create() {
        // Phase 2で実装
        // 現在はSoupNoodleSceneから直接PlacementSceneに遷移
        this.add.text(400, 300, 'ドラフト画面（Phase 2で実装）', {
            fontSize: '20px',
            color: '#ffffff',
        }).setOrigin(0.5);
    }
}
