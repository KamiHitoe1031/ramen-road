/**
 * サーバーエントリーポイント
 * Express + Socket.io によるオンライン対戦サーバー
 */
const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { Server } = require('socket.io');
const multer = require('multer');
const GameManager = require('./gameManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' },
});
const gameManager = new GameManager(io);

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, '..', 'data');
const ASSETS_DIR = path.join(__dirname, '..', 'public', 'assets');

// JSON body parser
app.use(express.json({ limit: '10mb' }));

// 画像アップロード設定（multer）
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const category = req.params.category;
        const dirMap = {
            characters: path.join(ASSETS_DIR, 'images', 'characters'),
            customers: path.join(ASSETS_DIR, 'images', 'customers'),
            ingredients: path.join(ASSETS_DIR, 'images', 'ingredients'),
            soup: path.join(ASSETS_DIR, 'images', 'soup'),
            backgrounds: path.join(ASSETS_DIR, 'images', 'backgrounds'),
            ui: path.join(ASSETS_DIR, 'images', 'ui'),
        };
        const dir = dirMap[category];
        if (!dir) return cb(new Error('Invalid category'));
        // ディレクトリ確認
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const id = req.params.id;
        const ext = path.extname(file.originalname) || '.png';
        cb(null, `${id}${ext}`);
    },
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = ['image/png', 'image/jpeg', 'image/webp'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('PNG/JPEG/WebP only'));
        }
    },
});

// === 管理者トークン管理 ===
const adminTokens = new Set();

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

function getAdminConfig() {
    const adminPath = path.join(DATA_DIR, 'admin.json');
    return JSON.parse(fs.readFileSync(adminPath, 'utf8'));
}

function saveAdminConfig(config) {
    const adminPath = path.join(DATA_DIR, 'admin.json');
    fs.writeFileSync(adminPath, JSON.stringify(config, null, 2) + '\n');
}

function requireAdmin(req, res, next) {
    const token = req.headers['x-admin-token'];
    if (!token || !adminTokens.has(token)) {
        return res.status(401).json({ error: '認証が必要です' });
    }
    next();
}

// 有効なデータファイル一覧
const VALID_DATA_FILES = ['scoring', 'ingredients', 'soups', 'noodles', 'characters', 'customers', 'titles'];

// 静的ファイル配信
app.use(express.static(path.join(__dirname, '..', 'public')));

// データファイルもアクセス可能にする
app.use('/assets/data', express.static(DATA_DIR));

// ヘルスチェック（Railway用）
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        version: '0.3.0',
        rooms: gameManager.rooms.size,
    });
});

// === 管理者API ===

// ログイン
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'パスワードが必要です' });

    const config = getAdminConfig();
    const hash = hashPassword(password);

    if (hash !== config.passwordHash) {
        return res.status(401).json({ error: 'パスワードが正しくありません' });
    }

    const token = generateToken();
    adminTokens.add(token);

    // 1時間で自動失効
    setTimeout(() => adminTokens.delete(token), 60 * 60 * 1000);

    res.json({ token });
});

// ログアウト
app.post('/api/admin/logout', requireAdmin, (req, res) => {
    const token = req.headers['x-admin-token'];
    adminTokens.delete(token);
    res.json({ ok: true });
});

// パスワード変更
app.post('/api/admin/password', requireAdmin, (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: '現在のパスワードと新しいパスワードが必要です' });
    }
    if (newPassword.length < 4) {
        return res.status(400).json({ error: 'パスワードは4文字以上にしてください' });
    }

    const config = getAdminConfig();
    if (hashPassword(currentPassword) !== config.passwordHash) {
        return res.status(401).json({ error: '現在のパスワードが正しくありません' });
    }

    config.passwordHash = hashPassword(newPassword);
    saveAdminConfig(config);

    res.json({ ok: true, message: 'パスワードを変更しました' });
});

// データ取得
app.get('/api/admin/data/:type', requireAdmin, (req, res) => {
    const { type } = req.params;
    if (!VALID_DATA_FILES.includes(type)) {
        return res.status(400).json({ error: `無効なデータ種別: ${type}` });
    }

    const filePath = path.join(DATA_DIR, `${type}.json`);
    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: `データ読み込みエラー: ${e.message}` });
    }
});

// データ更新
app.post('/api/admin/data/:type', requireAdmin, (req, res) => {
    const { type } = req.params;
    if (!VALID_DATA_FILES.includes(type)) {
        return res.status(400).json({ error: `無効なデータ種別: ${type}` });
    }

    const filePath = path.join(DATA_DIR, `${type}.json`);
    try {
        // バックアップ作成
        const backupDir = path.join(DATA_DIR, 'backup');
        fs.mkdirSync(backupDir, { recursive: true });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupDir, `${type}_${timestamp}.json`);
        if (fs.existsSync(filePath)) {
            fs.copyFileSync(filePath, backupPath);
        }

        // 保存
        fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2) + '\n');

        // GameManagerのデータも更新（ゲーム中のデータに反映）
        if (gameManager.dataFiles) {
            gameManager.dataFiles[type] = req.body;
        }

        res.json({ ok: true, message: `${type}を更新しました` });
    } catch (e) {
        res.status(500).json({ error: `保存エラー: ${e.message}` });
    }
});

// 画像アップロード
app.post('/api/admin/upload/:category/:id', requireAdmin, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: '画像ファイルが必要です' });
    }
    res.json({
        ok: true,
        message: '画像をアップロードしました',
        path: req.file.path,
        filename: req.file.filename,
    });
});

// 画像一覧取得
app.get('/api/admin/images/:category', requireAdmin, (req, res) => {
    const category = req.params.category;
    const dirMap = {
        characters: path.join(ASSETS_DIR, 'images', 'characters'),
        customers: path.join(ASSETS_DIR, 'images', 'customers'),
        ingredients: path.join(ASSETS_DIR, 'images', 'ingredients'),
        soup: path.join(ASSETS_DIR, 'images', 'soup'),
    };
    const dir = dirMap[category];
    if (!dir) return res.status(400).json({ error: '無効なカテゴリ' });

    try {
        const files = fs.readdirSync(dir).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
        res.json(files);
    } catch (e) {
        res.json([]);
    }
});

// Socket.io接続
io.on('connection', (socket) => {
    console.log(`[Server] Player connected: ${socket.id}`);
    gameManager.handleConnection(socket);
});

server.listen(PORT, () => {
    console.log(`🍜 らーめん道サーバー起動: http://localhost:${PORT}`);
});
