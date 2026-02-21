/**
 * DraftScene - 寿司ゴー方式のドラフト
 * 手札から1枚選び、残りを左隣に回す。9巡で完了。
 */
class DraftScene extends Phaser.Scene {
    constructor() {
        super(SCENES.DRAFT);
    }

    init(data) {
        const playerCount = this.registry.get(REGISTRY.PLAYER_COUNT) || 3;
        this.playerCount = playerCount;
        this.round = 0;               // 現在のラウンド（0-indexed）
        this.totalRounds = GAME_CONFIG.DRAFT_PICKS; // 9
        this.picks = [];               // プレイヤーの獲得済みカード
        this.aiPicks = [];             // AI各々の獲得済み [[], []]
        this.selectedCard = null;
        this.timer = GAME_CONFIG.TIMER_DRAFT_TURN;
        this.decided = false;
        this.isOnline = this.registry.get('onlineMode') || false;

        if (this.isOnline) {
            // オンライン: サーバーからの初期手札
            this.currentHand = data.hand || [];
            this.round = (data.round || 1) - 1;
            this.totalRounds = data.totalRounds || 9;
            this.picks = data.picked || [];
        } else {
            // オフライン: 全員分の手札
            this.hands = data.hands || [];
            for (let i = 1; i < this.playerCount; i++) {
                this.aiPicks.push([]);
            }
        }
    }

    create() {
        const { width, height } = this.cameras.main;

        // BGM（ドラフトBGM継続）
        window.bgmManager.play(this, BGM_MAP[SCENES.DRAFT]);

        // 背景
        this.add.image(width / 2, height / 2, 'bg_table').setDisplaySize(width, height).setAlpha(0.3);

        // 具材マップ構築
        const ingredients = this.registry.get('data_ingredients');
        this.ingMap = {};
        ingredients.forEach(ing => { this.ingMap[ing.id] = ing; });

        if (this.isOnline) {
            this.setupOnlineEvents();
        }

        this.showRound();
    }

    setupOnlineEvents() {
        const client = window.socketClient;
        if (!client || !client.socket) return;

        client.on('draft_hand', (data) => {
            // 次のラウンドの手札を受け取る
            this.currentHand = data.hand;
            this.round = (data.round || 1) - 1;
            this.picks = data.picked || this.picks;
            this.showRound();
        });

        client.on('draft_round_done', (data) => {
            // 各プレイヤーのピック結果（ログ表示等に使える）
            console.log(`[Draft Online] Round ${data.round} done`, data.picks);
        });

        client.on('draft_complete', (data) => {
            // ドラフト完了 → 盛り付けへ
            console.log('[Draft Online] Draft complete:', data.yourIngredients);
            this.registry.set(REGISTRY.PLAYER_HAND, data.yourIngredients);
            this.sound.play('sfx_bonus');
            this.scene.start(SCENES.PLACEMENT);
        });
    }

    showRound() {
        const { width, height } = this.cameras.main;

        // 前のUIをクリア（背景以外）
        this.children.removeAll();
        this.time.removeAllEvents();
        this.decided = false;
        this.selectedCard = null;
        this.timer = GAME_CONFIG.TIMER_DRAFT_TURN;

        // 背景再描画
        this.add.image(width / 2, height / 2, 'bg_table').setDisplaySize(width, height).setAlpha(0.3);

        // ラウンド表示
        this.add.text(width / 2, 20, `🥩 ドラフト ${this.round + 1}/${this.totalRounds}巡目`, {
            fontSize: GAME_CONFIG.FONT.HEADING_SIZE,
            color: GAME_CONFIG.COLORS.TEXT_PRIMARY,
        }).setOrigin(0.5);

        // タイマー
        this.timerText = this.add.text(width - 20, 20, `${this.timer}秒`, {
            fontSize: '22px',
            color: GAME_CONFIG.COLORS.TEXT_ACCENT,
        }).setOrigin(1, 0);

        this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (this.decided) return;
                this.timer--;
                this.timerText.setText(`${this.timer}秒`);
                if (this.timer <= 5) {
                    this.timerText.setColor('#ff0000');
                    this.sound.play('sfx_timer_warn');
                }
                if (this.timer <= 0 && !this.isOnline) {
                    // タイムアウト：先頭のカードを自動選択（オフラインのみ、オンラインはサーバーが処理）
                    this.confirmPick(this.hands[0][0]);
                }
            },
            loop: true,
        });

        // お客さん情報ミニ表示
        const customerIds = this.registry.get(REGISTRY.ACTIVE_CUSTOMERS);
        const allCustomers = this.registry.get('data_customers');
        const activeCustomers = customerIds.map(id => allCustomers.find(c => c.id === id));

        activeCustomers.forEach((cust, i) => {
            this.add.image(width - 50, 65 + i * 45, cust.spriteKey).setDisplaySize(32, 32);
            this.add.text(width - 70, 55 + i * 45, cust.name, {
                fontSize: '11px',
                color: '#cccccc',
            }).setOrigin(1, 0);
        });

        // --- 手札カード表示 ---
        const myHand = this.isOnline ? this.currentHand : this.hands[0];
        const cardW = 70, cardH = 90, gap = 6;
        const totalW = myHand.length * (cardW + gap) - gap;
        const startX = (width - totalW) / 2 + cardW / 2;
        const handY = 300;

        this.cardContainers = [];

        myHand.forEach((ingId, i) => {
            const ing = this.ingMap[ingId];
            const x = startX + i * (cardW + gap);

            const container = this.add.container(x, handY);

            // カード背景
            const bg = this.add.rectangle(0, 0, cardW, cardH, GAME_CONFIG.COLORS.CARD_BG)
                .setStrokeStyle(2, GAME_CONFIG.COLORS.CARD_BORDER);
            container.add(bg);

            // 色タグ帯
            const colorHex = GAME_CONFIG.COLOR_TAG_MAP[ing.colorTag] || 0x888888;
            const colorBar = this.add.rectangle(0, -cardH / 2 + 8, cardW - 4, 14, colorHex);
            container.add(colorBar);

            // 具材画像
            const ingImg = this.add.image(0, -10, ing.spriteKey).setDisplaySize(40, 40);
            container.add(ingImg);

            // 具材名
            const nameText = this.add.text(0, 20, ing.name, {
                fontSize: '10px',
                color: '#333333',
                fontFamily: GAME_CONFIG.FONT.FAMILY,
            }).setOrigin(0.5);
            container.add(nameText);

            // カテゴリアイコン
            const catEmoji = GAME_CONFIG.CATEGORY_EMOJI[ing.category] || '';
            const catText = this.add.text(0, 34, catEmoji, { fontSize: '12px' }).setOrigin(0.5);
            container.add(catText);

            container.setSize(cardW, cardH);
            container.setInteractive({ useHandCursor: true });
            container.setData('ingredientId', ingId);
            container.setData('index', i);

            // カード選択
            container.on('pointerdown', () => {
                if (this.decided) return;
                this.sound.play('sfx_card_pick');
                this.selectCard(container, ingId);
            });

            container.on('pointerover', () => {
                if (this.decided) return;
                container.y = handY - 10;
            });
            container.on('pointerout', () => {
                if (this.selectedCard !== ingId) {
                    container.y = handY;
                }
            });

            this.cardContainers.push(container);
        });

        // --- 獲得済みカード表示 ---
        this.add.text(20, 450, '【獲得済み】', {
            fontSize: '14px',
            color: GAME_CONFIG.COLORS.TEXT_ACCENT,
        });

        if (this.picks.length > 0) {
            const pickStartX = 30;
            this.picks.forEach((ingId, i) => {
                const ing = this.ingMap[ingId];
                const px = pickStartX + i * 52;

                const miniContainer = this.add.container(px, 490);
                const miniBg = this.add.rectangle(0, 0, 46, 56, GAME_CONFIG.COLORS.CARD_BG, 0.7)
                    .setStrokeStyle(1, GAME_CONFIG.COLORS.CARD_BORDER);
                miniContainer.add(miniBg);

                const miniImg = this.add.image(0, -6, ing.spriteKey).setDisplaySize(30, 30);
                miniContainer.add(miniImg);

                const miniName = this.add.text(0, 18, ing.name, {
                    fontSize: '8px', color: '#333',
                }).setOrigin(0.5);
                miniContainer.add(miniName);
            });
        } else {
            this.add.text(20, 475, 'まだなし', {
                fontSize: '12px', color: '#666',
            });
        }

        // --- 確定ボタン ---
        this.confirmBtn = this.add.rectangle(width / 2, height - 35, 200, 44, 0x555555)
            .setInteractive({ useHandCursor: true });
        this.confirmBtnText = this.add.text(width / 2, height - 35, 'カードを選んでね', {
            fontSize: '16px', color: '#999',
        }).setOrigin(0.5);

        this.confirmBtn.on('pointerdown', () => {
            if (this.decided || !this.selectedCard) return;
            this.confirmPick(this.selectedCard);
        });

        // AI他プレイヤー情報（オフラインのみ）
        if (!this.isOnline) {
            const characters = this.registry.get('data_characters');
            const selectedCharId = this.registry.get(REGISTRY.SELECTED_CHARACTER);
            const availChars = characters.filter(c => c.id !== selectedCharId);

            for (let ai = 0; ai < this.playerCount - 1; ai++) {
                const charData = availChars[ai] || {};
                this.add.text(width - 10, height - 80 + ai * 22,
                    `${charData.name || 'AI'}: ${this.aiPicks[ai].length}枚獲得 🤔`, {
                        fontSize: '12px', color: '#888',
                    }).setOrigin(1, 0);
            }
        } else {
            this.add.text(width - 10, height - 50,
                '他プレイヤーの選択を待機中…', {
                    fontSize: '12px', color: '#888',
                }).setOrigin(1, 0);
        }
    }

    selectCard(container, ingId) {
        // 前の選択をリセット
        this.cardContainers.forEach(c => {
            c.y = 300;
            const bg = c.getAt(0);
            bg.setStrokeStyle(2, GAME_CONFIG.COLORS.CARD_BORDER);
        });

        // 新しい選択
        this.selectedCard = ingId;
        container.y = 290;
        const bg = container.getAt(0);
        bg.setStrokeStyle(3, 0x00ff00);

        // 確定ボタン有効化
        this.confirmBtn.setFillStyle(GAME_CONFIG.COLORS.BTN_PRIMARY);
        const ing = this.ingMap[ingId];
        this.confirmBtnText.setText(`✅ ${ing.name} を取る！`);
        this.confirmBtnText.setColor('#ffffff');
    }

    confirmPick(ingId) {
        if (this.decided) return;
        this.decided = true;

        this.sound.play('sfx_card_pick');
        console.log(`[Draft] Round ${this.round + 1}: Player picks ${ingId}`);

        if (this.isOnline) {
            // オンライン: サーバーにピックを送信、次の手札はdraft_handイベントで届く
            this.picks.push(ingId);
            window.socketClient.draftPick(ingId);
            return;
        }

        // オフライン: ローカル処理
        this.picks.push(ingId);
        const playerHandIdx = this.hands[0].indexOf(ingId);
        if (playerHandIdx !== -1) this.hands[0].splice(playerHandIdx, 1);

        // AIのピック
        for (let ai = 0; ai < this.playerCount - 1; ai++) {
            const aiHand = this.hands[ai + 1];
            const aiPick = this.aiSelectCard(aiHand, this.aiPicks[ai], ai);
            this.aiPicks[ai].push(aiPick);
            const aiIdx = aiHand.indexOf(aiPick);
            if (aiIdx !== -1) aiHand.splice(aiIdx, 1);
            console.log(`[Draft] Round ${this.round + 1}: AI${ai} picks ${aiPick}`);
        }

        // 手札を左隣に回す
        this.sound.play('sfx_card_pass');
        const firstHand = this.hands.shift();
        this.hands.push(firstHand);

        this.round++;

        // 次のラウンドか終了
        if (this.round >= this.totalRounds) {
            this.finishDraft();
        } else {
            // 少し待ってから次のラウンド表示
            this.time.delayedCall(500, () => this.showRound());
        }
    }

    /** AI選択ロジック: キャラの得意分野を考慮した重み付きランダム */
    aiSelectCard(hand, alreadyPicked, aiIndex) {
        if (hand.length === 0) return null;

        const characters = this.registry.get('data_characters');
        const selectedCharId = this.registry.get(REGISTRY.SELECTED_CHARACTER);
        const availChars = characters.filter(c => c.id !== selectedCharId);
        const charData = availChars[aiIndex];

        // スコア計算
        const scored = hand.map(ingId => {
            const ing = this.ingMap[ingId];
            let score = 1; // 基本スコア

            // 色の多様性ボーナス
            const pickedColors = new Set(alreadyPicked.map(id => this.ingMap[id]?.colorTag));
            if (!pickedColors.has(ing.colorTag)) score += 2;

            // カテゴリ多様性
            const pickedCats = new Set(alreadyPicked.map(id => this.ingMap[id]?.category));
            if (!pickedCats.has(ing.category)) score += 1;

            // 重複ペナルティ
            if (alreadyPicked.includes(ingId)) score -= 3;

            // キャラボーナス条件をチェック
            if (charData && charData.bonuses) {
                for (const bonus of charData.bonuses) {
                    if (this.aiCheckBonusRelevance(bonus, ing, alreadyPicked)) {
                        score += bonus.points;
                    }
                }
            }

            return { ingId, score };
        });

        // スコアでソートして上位からやや確率的に選択
        scored.sort((a, b) => b.score - a.score);

        // 上位3つからランダムに選ぶ（完全最適化を避けて人間っぽくする）
        const topN = Math.min(3, scored.length);
        const pick = scored[Math.floor(Math.random() * topN)];
        return pick.ingId;
    }

    /** AIのボーナス条件との関連性チェック（簡易版） */
    aiCheckBonusRelevance(bonus, ing, alreadyPicked) {
        const cond = bonus.condition;
        if (!cond) return false;

        switch (cond.type) {
            case 'has_ingredient':
                return cond.ingredient === ing.id;
            case 'has_both_ingredients':
                return cond.ingredients.includes(ing.id);
            case 'category_count_gte': {
                if (ing.category !== cond.category) return false;
                const count = alreadyPicked.filter(id => this.ingMap[id]?.category === cond.category).length;
                return count < cond.count; // まだ足りない場合はほしい
            }
            case 'color_count_gte':
                return true; // 色の多様性は常に歓迎
            default:
                return false;
        }
    }

    finishDraft() {
        console.log('[Draft] Draft complete! Player picks:', this.picks);

        // プレイヤー手札をセット
        this.registry.set(REGISTRY.PLAYER_HAND, this.picks);

        // AI情報もレジストリに保存（PlacementSceneで使う）
        this.registry.set('aiDraftPicks', this.aiPicks);

        this.sound.play('sfx_bonus');

        // PlacementSceneへ
        this.scene.start(SCENES.PLACEMENT);
    }
}
