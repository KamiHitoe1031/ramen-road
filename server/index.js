/**
 * サーバーエントリーポイント
 * Phase 3で本格実装。Phase 1-2では静的ファイル配信のみ。
 */
const express = require('express');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Phase 3で有効化:
// const { Server } = require('socket.io');
// const io = new Server(server);
// const GameManager = require('./gameManager');
// const gameManager = new GameManager(io);

const PORT = process.env.PORT || 3000;

// 静的ファイル配信
app.use(express.static(path.join(__dirname, '..', 'public')));

// データファイルもアクセス可能にする
app.use('/assets/data', express.static(path.join(__dirname, '..', 'data')));

// ヘルスチェック（Railway用）
app.get('/health', (req, res) => {
    res.json({ status: 'ok', version: '0.1.0' });
});

// Phase 3で有効化:
// io.on('connection', (socket) => {
//     console.log(`Player connected: ${socket.id}`);
//     gameManager.handleConnection(socket);
// });

server.listen(PORT, () => {
    console.log(`🍜 らーめん道サーバー起動: http://localhost:${PORT}`);
});
