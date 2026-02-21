/**
 * らーめん道 管理画面 JavaScript
 */
(function () {
    'use strict';

    let adminToken = null;

    // データキャッシュ
    const cache = {};

    // 具材IDリスト（ペア選択用）
    let ingredientIds = [];

    // === API ===
    async function api(method, url, body) {
        const opts = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (adminToken) opts.headers['X-Admin-Token'] = adminToken;
        if (body) opts.body = JSON.stringify(body);

        const res = await fetch(url, opts);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'APIエラー');
        return data;
    }

    async function uploadImage(category, id, file) {
        const form = new FormData();
        form.append('image', file);

        const res = await fetch(`/api/admin/upload/${category}/${id}`, {
            method: 'POST',
            headers: { 'X-Admin-Token': adminToken },
            body: form,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'アップロードエラー');
        return data;
    }

    // === トースト ===
    function showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        setTimeout(() => { toast.className = 'toast'; }, 3000);
    }

    // === ログイン ===
    document.getElementById('login-btn').addEventListener('click', doLogin);
    document.getElementById('login-password').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doLogin();
    });

    async function doLogin() {
        const pw = document.getElementById('login-password').value;
        const errEl = document.getElementById('login-error');
        errEl.textContent = '';

        try {
            const result = await api('POST', '/api/admin/login', { password: pw });
            adminToken = result.token;
            sessionStorage.setItem('adminToken', adminToken);
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('admin-main').style.display = 'block';
            loadAllData();
        } catch (e) {
            errEl.textContent = e.message;
        }
    }

    // セッション復元
    const savedToken = sessionStorage.getItem('adminToken');
    if (savedToken) {
        adminToken = savedToken;
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('admin-main').style.display = 'block';
        loadAllData();
    }

    // URLパラメータからのトークン取得（RuleSceneからの遷移）
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    if (tokenParam && !savedToken) {
        adminToken = tokenParam;
        sessionStorage.setItem('adminToken', adminToken);
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('admin-main').style.display = 'block';
        // URLからトークンを消す
        window.history.replaceState({}, '', '/admin.html');
        loadAllData();
    }

    // ログアウト
    document.getElementById('logout-btn').addEventListener('click', async () => {
        try { await api('POST', '/api/admin/logout'); } catch (_) {}
        adminToken = null;
        sessionStorage.removeItem('adminToken');
        location.reload();
    });

    // === タブ切り替え ===
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
        });
    });

    // === データロード ===
    async function loadAllData() {
        try {
            const types = ['scoring', 'ingredients', 'soups', 'noodles', 'characters', 'customers', 'titles'];
            const results = await Promise.all(types.map(t => api('GET', `/api/admin/data/${t}`)));
            types.forEach((t, i) => { cache[t] = results[i]; });

            ingredientIds = cache.ingredients.map(i => i.id);

            renderScoring();
            renderIngredients();
            renderSoups();
            renderNoodles();
            renderCharacters();
            renderCustomers();
            renderTitles();
        } catch (e) {
            showToast('データ読み込みエラー: ' + e.message, 'error');
            // トークン切れの場合
            if (e.message.includes('認証')) {
                sessionStorage.removeItem('adminToken');
                location.reload();
            }
        }
    }

    // === スコア設定 ===
    function renderScoring() {
        const s = cache.scoring;

        // スープ×麺テーブル
        const tbody = document.querySelector('#soup-noodle-table tbody');
        tbody.innerHTML = '';
        const soupNames = { tonkotsu: '豚骨', shoyu: '醤油', miso: '味噌', shio: '塩' };
        const noodleIds = ['thin', 'curly', 'thick'];
        const noodleNames = { thin: '細麺', curly: 'ちぢれ麺', thick: '太麺' };

        Object.keys(s.soupNoodleCompatibility).forEach(soupId => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td class="row-label">${soupNames[soupId] || soupId}</td>`;
            noodleIds.forEach(nid => {
                const val = s.soupNoodleCompatibility[soupId][nid];
                tr.innerHTML += `<td><input type="number" min="0" max="10"
                    data-soup="${soupId}" data-noodle="${nid}" value="${val}"></td>`;
            });
            tbody.appendChild(tr);
        });

        // 彩りボーナス
        const colorDiv = document.getElementById('color-bonus-fields');
        colorDiv.innerHTML = '';
        for (let i = 1; i <= 7; i++) {
            colorDiv.innerHTML += `<label>${i}色: <input type="number" class="inline-input"
                data-colors="${i}" value="${s.colorBonus[i]}" min="0" max="20">点</label>`;
        }

        // 隣接ボーナス
        document.getElementById('good-pair-points').value = s.adjacencyGoodPairs.pointsPerPair;
        renderPairList('good-pairs-list', s.adjacencyGoodPairs.pairs);

        document.getElementById('bad-pair-points').value = s.adjacencyBadPairs.pointsPerPair;
        renderPairList('bad-pairs-list', s.adjacencyBadPairs.pairs);

        // 中央・重複
        document.getElementById('center-bonus').value = s.centerBonus;
        document.getElementById('duplicate-penalty').value = s.duplicatePenalty;

        // タイマー
        const timerDiv = document.getElementById('timer-fields');
        timerDiv.innerHTML = '';
        const timerLabels = {
            charSelect: 'キャラ選択',
            soupSelect: 'スープ選択',
            noodleSelect: '麺選択',
            draftTurn: 'ドラフト（1手）',
            placement: '盛り付け',
        };
        Object.entries(s.timers).forEach(([key, val]) => {
            timerDiv.innerHTML += `<label>${timerLabels[key] || key}: <input type="number"
                class="inline-input" data-timer="${key}" value="${val}" min="5" max="300">秒</label>`;
        });
    }

    function renderPairList(containerId, pairs) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        pairs.forEach((pair, idx) => {
            const row = document.createElement('div');
            row.className = 'pair-row';
            row.innerHTML = `
                <select data-pair-idx="${idx}" data-side="0">${ingredientOptions(pair[0])}</select>
                <span class="pair-sep">↔</span>
                <select data-pair-idx="${idx}" data-side="1">${ingredientOptions(pair[1])}</select>
                <button class="btn-remove" data-pair-idx="${idx}">✕</button>
            `;
            container.appendChild(row);
        });

        // 削除ボタン
        container.querySelectorAll('.btn-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.pairIdx);
                pairs.splice(idx, 1);
                renderPairList(containerId, pairs);
            });
        });
    }

    function ingredientOptions(selected) {
        return ingredientIds.map(id =>
            `<option value="${id}" ${id === selected ? 'selected' : ''}>${getIngredientName(id)}</option>`
        ).join('');
    }

    function getIngredientName(id) {
        const ing = cache.ingredients.find(i => i.id === id);
        return ing ? ing.name : id;
    }

    // ペア追加
    document.getElementById('add-good-pair').addEventListener('click', () => {
        cache.scoring.adjacencyGoodPairs.pairs.push([ingredientIds[0], ingredientIds[1]]);
        renderPairList('good-pairs-list', cache.scoring.adjacencyGoodPairs.pairs);
    });
    document.getElementById('add-bad-pair').addEventListener('click', () => {
        cache.scoring.adjacencyBadPairs.pairs.push([ingredientIds[0], ingredientIds[1]]);
        renderPairList('bad-pairs-list', cache.scoring.adjacencyBadPairs.pairs);
    });

    // スコア保存
    document.getElementById('save-scoring').addEventListener('click', async () => {
        const s = cache.scoring;

        // スープ×麺
        document.querySelectorAll('#soup-noodle-table input').forEach(input => {
            s.soupNoodleCompatibility[input.dataset.soup][input.dataset.noodle] = parseInt(input.value) || 0;
        });

        // 彩りボーナス
        document.querySelectorAll('#color-bonus-fields input').forEach(input => {
            s.colorBonus[input.dataset.colors] = parseInt(input.value) || 0;
        });

        // 隣接ペア値を読み取り
        readPairsFromDOM('good-pairs-list', s.adjacencyGoodPairs.pairs);
        s.adjacencyGoodPairs.pointsPerPair = parseInt(document.getElementById('good-pair-points').value) || 2;

        readPairsFromDOM('bad-pairs-list', s.adjacencyBadPairs.pairs);
        s.adjacencyBadPairs.pointsPerPair = parseInt(document.getElementById('bad-pair-points').value) || -1;

        // 中央・重複
        s.centerBonus = parseInt(document.getElementById('center-bonus').value) || 0;
        s.duplicatePenalty = parseInt(document.getElementById('duplicate-penalty').value) || 0;

        // タイマー
        document.querySelectorAll('#timer-fields input').forEach(input => {
            s.timers[input.dataset.timer] = parseInt(input.value) || 10;
        });

        try {
            await api('POST', '/api/admin/data/scoring', s);
            showToast('スコア設定を保存しました');
        } catch (e) {
            showToast('保存エラー: ' + e.message, 'error');
        }
    });

    function readPairsFromDOM(containerId, pairs) {
        const selects = document.querySelectorAll(`#${containerId} select`);
        const newPairs = [];
        for (let i = 0; i < selects.length; i += 2) {
            if (selects[i + 1]) {
                newPairs.push([selects[i].value, selects[i + 1].value]);
            }
        }
        pairs.length = 0;
        newPairs.forEach(p => pairs.push(p));
    }

    // === 具材管理 ===
    function renderIngredients() {
        const container = document.getElementById('ingredients-list');
        container.innerHTML = '';
        const colorOptions = ['red', 'green', 'yellow', 'white', 'brown', 'black', 'pink'];
        const catOptions = ['meat', 'egg', 'vegetable', 'seafood', 'topping'];

        cache.ingredients.forEach((ing, idx) => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.innerHTML = `
                <div class="item-header">
                    <img class="item-img" src="assets/images/ingredients/${ing.spriteKey}.png"
                         data-category="ingredients" data-id="${ing.spriteKey}"
                         title="クリックで画像変更" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22/>'">
                    <div>
                        <div class="item-name">${ing.name}</div>
                        <div class="item-id">${ing.id}</div>
                    </div>
                </div>
                <label>名前</label>
                <input type="text" data-idx="${idx}" data-field="name" value="${ing.name}">
                <label>カテゴリ</label>
                <select data-idx="${idx}" data-field="category">
                    ${catOptions.map(c => `<option value="${c}" ${c === ing.category ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
                <label>色タグ</label>
                <select data-idx="${idx}" data-field="colorTag">
                    ${colorOptions.map(c => `<option value="${c}" ${c === ing.colorTag ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
                <label>カード枚数</label>
                <input type="number" data-idx="${idx}" data-field="cardCount" value="${ing.cardCount}" min="1" max="9">
                <label>画像差し替え</label>
                <input type="file" accept="image/*" data-category="ingredients" data-id="${ing.spriteKey}">
            `;
            container.appendChild(card);
        });

        // 画像クリックでファイル選択
        container.querySelectorAll('.item-img').forEach(img => {
            img.addEventListener('click', () => {
                const card = img.closest('.item-card');
                card.querySelector('input[type="file"]').click();
            });
        });

        // ファイルアップロード
        container.querySelectorAll('input[type="file"]').forEach(input => {
            input.addEventListener('change', async () => {
                if (!input.files[0]) return;
                try {
                    await uploadImage(input.dataset.category, input.dataset.id, input.files[0]);
                    // 画像更新
                    const img = input.closest('.item-card').querySelector('.item-img');
                    img.src = `assets/images/${input.dataset.category}/${input.dataset.id}.png?t=${Date.now()}`;
                    showToast('画像をアップロードしました');
                } catch (e) {
                    showToast('アップロードエラー: ' + e.message, 'error');
                }
            });
        });
    }

    document.getElementById('save-ingredients').addEventListener('click', async () => {
        // DOMから値を収集
        document.querySelectorAll('#ingredients-list input[data-field], #ingredients-list select[data-field]').forEach(el => {
            const idx = parseInt(el.dataset.idx);
            const field = el.dataset.field;
            cache.ingredients[idx][field] = field === 'cardCount' ? parseInt(el.value) || 1 : el.value;
        });

        try {
            await api('POST', '/api/admin/data/ingredients', cache.ingredients);
            showToast('具材データを保存しました');
        } catch (e) {
            showToast('保存エラー: ' + e.message, 'error');
        }
    });

    // === スープ ===
    function renderSoups() {
        const container = document.getElementById('soups-list');
        container.innerHTML = '';

        cache.soups.forEach((soup, idx) => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.innerHTML = `
                <div class="item-header">
                    <img class="item-img" src="assets/images/soup/${soup.spriteKey}.png"
                         data-category="soup" data-id="${soup.spriteKey}"
                         title="クリックで画像変更" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22/>'">
                    <div>
                        <div class="item-name">${soup.name}</div>
                        <div class="item-id">${soup.id}</div>
                    </div>
                </div>
                <label>名前</label>
                <input type="text" data-idx="${idx}" data-field="name" data-type="soups" value="${soup.name}">
                <label>説明</label>
                <input type="text" data-idx="${idx}" data-field="description" data-type="soups" value="${soup.description}">
                <label>色（HEX）</label>
                <input type="color" data-idx="${idx}" data-field="color" data-type="soups" value="${soup.color}">
                <label>画像差し替え</label>
                <input type="file" accept="image/*" data-category="soup" data-id="${soup.spriteKey}">
            `;
            container.appendChild(card);
        });

        setupImageUploads(container);
    }

    document.getElementById('save-soups').addEventListener('click', async () => {
        document.querySelectorAll('#soups-list input[data-field]').forEach(el => {
            const idx = parseInt(el.dataset.idx);
            cache.soups[idx][el.dataset.field] = el.value;
        });
        try {
            await api('POST', '/api/admin/data/soups', cache.soups);
            showToast('スープデータを保存しました');
        } catch (e) {
            showToast('保存エラー: ' + e.message, 'error');
        }
    });

    // === 麺 ===
    function renderNoodles() {
        const container = document.getElementById('noodles-list');
        container.innerHTML = '';

        cache.noodles.forEach((noodle, idx) => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.innerHTML = `
                <div class="item-header">
                    <div class="item-name">${noodle.name}</div>
                    <div class="item-id">${noodle.id}</div>
                </div>
                <label>名前</label>
                <input type="text" data-idx="${idx}" data-field="name" value="${noodle.name}">
                <label>説明</label>
                <input type="text" data-idx="${idx}" data-field="description" value="${noodle.description}">
            `;
            container.appendChild(card);
        });
    }

    document.getElementById('save-noodles').addEventListener('click', async () => {
        document.querySelectorAll('#noodles-list input[data-field]').forEach(el => {
            const idx = parseInt(el.dataset.idx);
            cache.noodles[idx][el.dataset.field] = el.value;
        });
        try {
            await api('POST', '/api/admin/data/noodles', cache.noodles);
            showToast('麺データを保存しました');
        } catch (e) {
            showToast('保存エラー: ' + e.message, 'error');
        }
    });

    // === キャラクター ===
    function renderCharacters() {
        const container = document.getElementById('characters-list');
        container.innerHTML = '';

        cache.characters.forEach((char, idx) => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <div class="list-header">
                    <img src="assets/images/characters/${char.spriteKey}.png"
                         data-category="characters" data-id="${char.spriteKey}"
                         title="クリックで画像変更" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22/>'">
                    <div class="list-info">
                        <div class="name-row">
                            <input class="name-input" data-idx="${idx}" data-field="name" value="${char.name}">
                            <input data-idx="${idx}" data-field="playstyle" value="${char.playstyle}" placeholder="プレイスタイル" style="width:200px;">
                        </div>
                        <input class="quote-input" data-idx="${idx}" data-field="quote" value="${char.quote}" placeholder="セリフ">
                        <label style="margin-top:4px;">最大ボーナス: <input type="number" data-idx="${idx}" data-field="maxBonus" value="${char.maxBonus}" min="0" max="30" style="width:60px;"></label>
                    </div>
                    <input type="file" accept="image/*" data-category="characters" data-id="${char.spriteKey}" class="hidden-file-input">
                </div>
                <div class="bonus-section" data-idx="${idx}">
                    <h4>ボーナス条件</h4>
                    ${renderBonuses(char.bonuses, idx, 'char')}
                    <button class="btn-add-bonus" data-idx="${idx}" data-src="char">+ ボーナス追加</button>
                </div>
            `;
            container.appendChild(item);
        });

        setupImageUploads(container);
        setupBonusButtons(container, cache.characters, 'char');
    }

    document.getElementById('save-characters').addEventListener('click', async () => {
        collectCharOrCustomerData('characters-list', cache.characters, 'char');
        try {
            await api('POST', '/api/admin/data/characters', cache.characters);
            showToast('キャラデータを保存しました');
        } catch (e) {
            showToast('保存エラー: ' + e.message, 'error');
        }
    });

    // === お客さん ===
    function renderCustomers() {
        const container = document.getElementById('customers-list');
        container.innerHTML = '';

        cache.customers.forEach((cust, idx) => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <div class="list-header">
                    <img src="assets/images/customers/${cust.spriteKey}.png"
                         data-category="customers" data-id="${cust.spriteKey}"
                         title="クリックで画像変更" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22/>'">
                    <div class="list-info">
                        <div class="name-row">
                            <input class="name-input" data-idx="${idx}" data-field="name" value="${cust.name}">
                            <input data-idx="${idx}" data-field="type" value="${cust.type}" placeholder="タイプ" style="width:120px;">
                        </div>
                        <input class="quote-input" data-idx="${idx}" data-field="quote" value="${cust.quote}" placeholder="セリフ">
                        <label style="margin-top:4px;">最大ボーナス: <input type="number" data-idx="${idx}" data-field="maxBonus" value="${cust.maxBonus}" min="0" max="30" style="width:60px;"></label>
                    </div>
                    <input type="file" accept="image/*" data-category="customers" data-id="${cust.spriteKey}" class="hidden-file-input">
                </div>
                <div class="bonus-section" data-idx="${idx}">
                    <h4>ボーナス条件</h4>
                    ${renderBonuses(cust.bonuses, idx, 'cust')}
                    <button class="btn-add-bonus" data-idx="${idx}" data-src="cust">+ ボーナス追加</button>
                </div>
            `;
            container.appendChild(item);
        });

        setupImageUploads(container);
        setupBonusButtons(container, cache.customers, 'cust');
    }

    document.getElementById('save-customers').addEventListener('click', async () => {
        collectCharOrCustomerData('customers-list', cache.customers, 'cust');
        try {
            await api('POST', '/api/admin/data/customers', cache.customers);
            showToast('お客さんデータを保存しました');
        } catch (e) {
            showToast('保存エラー: ' + e.message, 'error');
        }
    });

    // === ボーナス共通 ===
    const CONDITION_TYPES = [
        'soup_is', 'noodle_is', 'has_ingredient', 'has_both_ingredients',
        'placed_count_eq', 'placed_count_gte', 'placed_count_lte',
        'color_count_gte', 'unique_ingredients_gte',
        'category_count_gte', 'symmetrical_blanks',
        'adjacency_pairs_gte', 'adjacency_good_pairs_gte',
        'adjacency_bad_pairs_eq', 'has_blanks',
        'regional_set_complete', 'soup_noodle_max_compatibility',
        'center_ingredient_is', 'not_has_ingredient', 'soup_in',
    ];

    function renderBonuses(bonuses, parentIdx, src) {
        return bonuses.map((b, bIdx) => `
            <div class="bonus-row" data-parent="${parentIdx}" data-bidx="${bIdx}">
                <select data-field="condition">
                    ${CONDITION_TYPES.map(c => `<option value="${c}" ${c === b.condition ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
                <input class="value-input" data-field="value" value='${JSON.stringify(b.value)}' placeholder="値">
                <input class="pts-input" data-field="points" type="number" value="${b.points}" min="-10" max="20">点
                <input class="label-input" data-field="label" value="${b.label}" placeholder="ラベル">
                <button class="btn-remove" data-bidx="${bIdx}">✕</button>
            </div>
        `).join('');
    }

    function setupBonusButtons(container, dataArray, src) {
        // 追加ボタン
        container.querySelectorAll('.btn-add-bonus').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.idx);
                dataArray[idx].bonuses.push({
                    condition: 'has_ingredient', value: 'chashu', points: 2, label: '新しいボーナス',
                });
                if (src === 'char') renderCharacters();
                else renderCustomers();
            });
        });

        // 削除ボタン
        container.querySelectorAll('.bonus-row .btn-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const row = btn.closest('.bonus-row');
                const parentIdx = parseInt(row.dataset.parent);
                const bIdx = parseInt(btn.dataset.bidx);
                dataArray[parentIdx].bonuses.splice(bIdx, 1);
                if (src === 'char') renderCharacters();
                else renderCustomers();
            });
        });
    }

    function collectCharOrCustomerData(containerId, dataArray, src) {
        const container = document.getElementById(containerId);

        // 基本フィールド
        container.querySelectorAll('.list-info input[data-field]').forEach(el => {
            const idx = parseInt(el.dataset.idx);
            const field = el.dataset.field;
            if (field === 'maxBonus') {
                dataArray[idx][field] = parseInt(el.value) || 0;
            } else {
                dataArray[idx][field] = el.value;
            }
        });

        // ボーナス
        container.querySelectorAll('.bonus-row').forEach(row => {
            const parentIdx = parseInt(row.dataset.parent);
            const bIdx = parseInt(row.dataset.bidx);
            const bonus = dataArray[parentIdx].bonuses[bIdx];
            if (!bonus) return;

            bonus.condition = row.querySelector('[data-field="condition"]').value;
            const rawValue = row.querySelector('[data-field="value"]').value;
            try { bonus.value = JSON.parse(rawValue); } catch (_) { bonus.value = rawValue; }
            bonus.points = parseInt(row.querySelector('[data-field="points"]').value) || 0;
            bonus.label = row.querySelector('[data-field="label"]').value;
        });
    }

    // === 称号 ===
    function renderTitles() {
        renderTitleSection('titles-comparative', cache.titles.comparative);
        renderTitleSection('titles-achievement', cache.titles.achievement);
    }

    function renderTitleSection(containerId, titles) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        titles.forEach((t, idx) => {
            const item = document.createElement('div');
            item.className = 'title-item';
            item.innerHTML = `
                <span class="title-emoji">${t.emoji || '🏆'}</span>
                <div>
                    <label>名前</label>
                    <input class="name-input" data-idx="${idx}" data-field="name" value="${t.name}">
                </div>
                <div>
                    <label>ポイント</label>
                    <input class="pts-input" data-idx="${idx}" data-field="points" type="number" value="${t.points}" min="0" max="20">
                </div>
                <div>
                    <label>アナウンス</label>
                    <input class="announce-input" data-idx="${idx}" data-field="announcement" value="${t.announcement}">
                </div>
            `;
            container.appendChild(item);
        });
    }

    document.getElementById('save-titles').addEventListener('click', async () => {
        collectTitleData('titles-comparative', cache.titles.comparative);
        collectTitleData('titles-achievement', cache.titles.achievement);
        try {
            await api('POST', '/api/admin/data/titles', cache.titles);
            showToast('称号データを保存しました');
        } catch (e) {
            showToast('保存エラー: ' + e.message, 'error');
        }
    });

    function collectTitleData(containerId, titles) {
        document.querySelectorAll(`#${containerId} input[data-field]`).forEach(el => {
            const idx = parseInt(el.dataset.idx);
            const field = el.dataset.field;
            titles[idx][field] = field === 'points' ? parseInt(el.value) || 0 : el.value;
        });
    }

    // === 画像アップロード共通 ===
    function setupImageUploads(container) {
        // 画像クリック→ファイル選択
        container.querySelectorAll('img[data-category]').forEach(img => {
            img.addEventListener('click', () => {
                const parent = img.closest('.list-item, .item-card');
                const fileInput = parent.querySelector('input[type="file"]');
                if (fileInput) fileInput.click();
            });
        });

        // ファイル変更→アップロード
        container.querySelectorAll('input[type="file"]').forEach(input => {
            input.addEventListener('change', async () => {
                if (!input.files[0]) return;
                try {
                    await uploadImage(input.dataset.category, input.dataset.id, input.files[0]);
                    const parent = input.closest('.list-item, .item-card');
                    const img = parent.querySelector('img[data-category]');
                    if (img) img.src = `assets/images/${input.dataset.category}/${input.dataset.id}.png?t=${Date.now()}`;
                    showToast('画像をアップロードしました');
                } catch (e) {
                    showToast('アップロードエラー: ' + e.message, 'error');
                }
            });
        });
    }

    // === パスワード変更 ===
    document.getElementById('change-password-btn').addEventListener('click', async () => {
        const current = document.getElementById('current-password').value;
        const newPw = document.getElementById('new-password').value;
        const confirm = document.getElementById('confirm-password').value;
        const msgEl = document.getElementById('password-message');
        msgEl.textContent = '';
        msgEl.className = 'message';

        if (!current || !newPw) {
            msgEl.textContent = '全項目を入力してください';
            msgEl.className = 'message error';
            return;
        }
        if (newPw !== confirm) {
            msgEl.textContent = '新しいパスワードが一致しません';
            msgEl.className = 'message error';
            return;
        }
        if (newPw.length < 4) {
            msgEl.textContent = 'パスワードは4文字以上にしてください';
            msgEl.className = 'message error';
            return;
        }

        try {
            await api('POST', '/api/admin/password', { currentPassword: current, newPassword: newPw });
            msgEl.textContent = 'パスワードを変更しました！';
            msgEl.className = 'message success';
            document.getElementById('current-password').value = '';
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-password').value = '';
        } catch (e) {
            msgEl.textContent = e.message;
            msgEl.className = 'message error';
        }
    });

})();
