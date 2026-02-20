/**
 * PlacementScene - 3×3グリッドに具材を配置する盛り付け画面
 * ドラッグ＆ドロップで具材を丼に置く
 */
class PlacementScene extends Phaser.Scene {
    constructor() {
        super(SCENES.PLACEMENT);
    }

    init() {
        // 3×3グリッド（null = 空）
        this.grid = [
            [null, null, null],
            [null, null, null],
            [null, null, null],
        ];
        this.gridCells = [];     // グリッドセルのGameObject配列
        this.handCards = [];     // 手札カードのGameObject配列
        this.dragTarget = null;  // ドラッグ中の具材
        this.timer = GAME_CONFIG.TIMER_PLACEMENT;
    }

    create() {
        const { width, height } = this.cameras.main;
        const ingredients = this.registry.get('data_ingredients');
        const hand = this.registry.get(REGISTRY.PLAYER_HAND);
        const ingMap = {};
        ingredients.forEach(ing => { ingMap[ing.id] = ing; });
        this.ingMap = ingMap;

        // --- 背景 ---
        this.add.image(width / 2, height / 2, 'bg_table').setDisplaySize(width, height).setAlpha(0.3);

        this.add.text(width / 2, 20, '🎨 盛り付けタイム！', {
            fontSize: GAME_CONFIG.FONT.HEADING_SIZE,
            color: GAME_CONFIG.COLORS.TEXT_PRIMARY,
        }).setOrigin(0.5);

        // --- タイマー ---
        this.timerText = this.add.text(width - 20, 20, `${this.timer}秒`, {
            fontSize: '22px',
            color: GAME_CONFIG.COLORS.TEXT_ACCENT,
        }).setOrigin(1, 0);

        this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.timer--;
                this.timerText.setText(`${this.timer}秒`);
                if (this.timer <= 5) this.timerText.setColor('#ff0000');
                if (this.timer <= 0) this.submitPlacement();
            },
            loop: true,
        });

        // --- スープ丼画像 ---
        const soupId = this.registry.get(REGISTRY.SELECTED_SOUP);
        const soupData = this.registry.get('data_soups').find(s => s.id === soupId);

        this.add.image(width / 2, 230, soupData.spriteKey).setDisplaySize(270, 270).setAlpha(0.7);

        // --- 3×3 グリッド ---
        const cellSize = GAME_CONFIG.GRID_CELL_SIZE;
        const gap = GAME_CONFIG.GRID_PADDING;
        const gridTotalSize = cellSize * 3 + gap * 2;
        const gridStartX = (width - gridTotalSize) / 2;
        const gridStartY = 230 - gridTotalSize / 2;

        for (let row = 0; row < 3; row++) {
            this.gridCells[row] = [];
            for (let col = 0; col < 3; col++) {
                const cx = gridStartX + col * (cellSize + gap) + cellSize / 2;
                const cy = gridStartY + row * (cellSize + gap) + cellSize / 2;

                const cell = this.add.rectangle(cx, cy, cellSize, cellSize, GAME_CONFIG.COLORS.GRID_EMPTY, 0.6)
                    .setStrokeStyle(2, 0x8b6914, 0.5)
                    .setData('row', row)
                    .setData('col', col);

                // 中央マスをわずかに目立たせる
                if (row === 1 && col === 1) {
                    cell.setStrokeStyle(2, 0xffd700, 0.8);
                }

                this.gridCells[row][col] = { rect: cell, x: cx, y: cy, ingredientSprite: null };
            }
        }

        // --- 手札カード ---
        this.createHandCards(hand);

        // --- 完成ボタン ---
        const doneBtn = this.add.rectangle(width / 2, height - 30, 160, 44, GAME_CONFIG.COLORS.BTN_PRIMARY)
            .setInteractive({ useHandCursor: true });
        this.add.text(width / 2, height - 30, '✅ 完成！', {
            fontSize: '18px',
            color: '#ffffff',
        }).setOrigin(0.5);

        doneBtn.on('pointerdown', () => this.submitPlacement());

        // --- リアルタイムスコアプレビュー ---
        this.scorePreview = this.add.text(20, 60, '', {
            fontSize: '14px',
            color: '#aaaaaa',
            lineSpacing: 4,
        });
        this.updateScorePreview();

        // --- お客さん情報ミニ表示 ---
        const customerIds = this.registry.get(REGISTRY.ACTIVE_CUSTOMERS);
        const allCustomers = this.registry.get('data_customers');
        const activeCustomers = customerIds.map(id => allCustomers.find(c => c.id === id));

        activeCustomers.forEach((cust, i) => {
            const custY = 60 + i * 60;
            this.add.image(width - 120, custY + 15, cust.spriteKey).setDisplaySize(36, 36);
            this.add.text(width - 10, custY, `${cust.name}\n${cust.type}`, {
                fontSize: '12px',
                color: '#cccccc',
                align: 'right',
            }).setOrigin(1, 0);
        });
    }

    createHandCards(hand) {
        const { width } = this.cameras.main;
        const cardW = 70, cardH = 86, gap = 6;
        const totalW = hand.length * (cardW + gap) - gap;
        const startX = (width - totalW) / 2 + cardW / 2;
        const y = GAME_CONFIG.CARD_HAND_Y;

        hand.forEach((ingId, i) => {
            const ing = this.ingMap[ingId];
            const x = startX + i * (cardW + gap);

            // カードコンテナ
            const container = this.add.container(x, y);

            // カード背景
            const bg = this.add.rectangle(0, 0, cardW, cardH, GAME_CONFIG.COLORS.CARD_BG)
                .setStrokeStyle(2, GAME_CONFIG.COLORS.CARD_BORDER);
            container.add(bg);

            // 色タグ帯
            const colorHex = GAME_CONFIG.COLOR_TAG_MAP[ing.colorTag] || 0x888888;
            const colorBar = this.add.rectangle(0, -cardH / 2 + 8, cardW - 4, 14, colorHex);
            container.add(colorBar);

            // 具材画像
            const ingImg = this.add.image(0, -8, ing.spriteKey).setDisplaySize(40, 40);
            container.add(ingImg);

            // 具材名
            const nameText = this.add.text(0, 18, ing.name, {
                fontSize: '11px',
                color: '#333333',
                fontFamily: GAME_CONFIG.FONT.FAMILY,
            }).setOrigin(0.5);
            container.add(nameText);

            // インタラクション
            container.setSize(cardW, cardH);
            container.setInteractive({ draggable: true, useHandCursor: true });
            container.setData('ingredientId', ingId);
            container.setData('handIndex', i);
            container.setData('originalX', x);
            container.setData('originalY', y);
            container.setData('placed', false);

            this.handCards.push(container);
        });

        // --- ドラッグイベント ---
        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
            gameObject.setDepth(100);
        });

        this.input.on('dragend', (pointer, gameObject) => {
            gameObject.setDepth(0);
            const ingId = gameObject.getData('ingredientId');

            // グリッドセルにドロップしたか判定
            let placed = false;
            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 3; col++) {
                    const cell = this.gridCells[row][col];
                    const dist = Phaser.Math.Distance.Between(gameObject.x, gameObject.y, cell.x, cell.y);

                    if (dist < GAME_CONFIG.GRID_CELL_SIZE / 2 && this.grid[row][col] === null) {
                        // 以前のグリッド配置をクリア
                        this.removeFromGrid(ingId);

                        // グリッドに配置
                        this.grid[row][col] = ingId;
                        gameObject.x = cell.x;
                        gameObject.y = cell.y;
                        gameObject.setData('placed', true);
                        gameObject.setData('gridRow', row);
                        gameObject.setData('gridCol', col);
                        cell.ingredientSprite = gameObject;
                        placed = true;
                        break;
                    }
                }
                if (placed) break;
            }

            if (!placed) {
                // 元の手札位置に戻す
                this.removeFromGrid(ingId);
                gameObject.x = gameObject.getData('originalX');
                gameObject.y = gameObject.getData('originalY');
                gameObject.setData('placed', false);
            }

            this.updateScorePreview();
        });
    }

    removeFromGrid(ingId) {
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                if (this.grid[row][col] === ingId) {
                    this.grid[row][col] = null;
                    const cell = this.gridCells[row][col];
                    if (cell.ingredientSprite) {
                        cell.ingredientSprite.setData('placed', false);
                        cell.ingredientSprite = null;
                    }
                }
            }
        }
    }

    updateScorePreview() {
        const scoring = this.registry.get('data_scoring');
        const ingredients = this.registry.get('data_ingredients');
        const engine = new ScoringEngine(scoring, ingredients);

        const soup = this.registry.get(REGISTRY.SELECTED_SOUP);
        const noodle = this.registry.get(REGISTRY.SELECTED_NOODLE);

        const preview = engine.calcLayer1({ soup, noodle, grid: this.grid });

        let text = '--- スコアプレビュー ---\n';
        text += `スープ×麺: +${preview.soupNoodle}\n`;
        text += `彩り: +${preview.colorBonus}\n`;
        text += `隣接(良): +${preview.adjacencyGood}\n`;
        if (preview.adjacencyBad < 0) text += `隣接(悪): ${preview.adjacencyBad}\n`;
        text += `中央: +${preview.centerBonus}\n`;
        if (preview.duplicatePenalty < 0) text += `重複: ${preview.duplicatePenalty}\n`;
        text += `小計: ${preview.subtotal}`;

        this.scorePreview.setText(text);
    }

    submitPlacement() {
        this.registry.set(REGISTRY.PLAYER_GRID, this.grid);

        // Phase 1: AI分のデータを自動生成
        this.generateAIPlayers();

        this.scene.start(SCENES.SCORING);
    }

    generateAIPlayers() {
        const characters = this.registry.get('data_characters');
        const ingredients = this.registry.get('data_ingredients');
        const selectedChar = this.registry.get(REGISTRY.SELECTED_CHARACTER);

        // AIキャラ（プレイヤーが選んでないキャラから2人）
        const availableChars = characters.filter(c => c.id !== selectedChar);
        Phaser.Utils.Array.Shuffle(availableChars);
        const aiChars = availableChars.slice(0, 2);

        const soups = ['tonkotsu', 'shoyu', 'miso', 'shio'];
        const noodles = ['thin', 'curly', 'thick'];

        const allPlayers = [
            {
                playerId: 'player',
                name: 'あなた',
                characterId: selectedChar,
                soup: this.registry.get(REGISTRY.SELECTED_SOUP),
                noodle: this.registry.get(REGISTRY.SELECTED_NOODLE),
                grid: this.grid,
            },
        ];

        // AI2体分のランダム盛り付け
        aiChars.forEach((char, idx) => {
            let pool = [];
            ingredients.forEach(ing => {
                for (let i = 0; i < ing.cardCount; i++) pool.push(ing.id);
            });
            Phaser.Utils.Array.Shuffle(pool);
            const aiHand = pool.slice(0, 9);

            // ランダムに5-9個配置
            const placeCount = Phaser.Math.Between(5, 9);
            const aiGrid = [[null, null, null], [null, null, null], [null, null, null]];
            const positions = Phaser.Utils.Array.Shuffle([
                [0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[0,2],[1,2],[2,2],
            ]).slice(0, placeCount);

            positions.forEach((pos, i) => {
                if (i < aiHand.length) {
                    aiGrid[pos[1]][pos[0]] = aiHand[i];
                }
            });

            allPlayers.push({
                playerId: `ai_${idx}`,
                name: char.name,
                characterId: char.id,
                soup: Phaser.Utils.Array.GetRandom(soups),
                noodle: Phaser.Utils.Array.GetRandom(noodles),
                grid: aiGrid,
            });
        });

        this.registry.set(REGISTRY.ALL_PLAYERS, allPlayers);
    }
}
