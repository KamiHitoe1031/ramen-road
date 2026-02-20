/**
 * デバッグログシステム
 * - console.log / warn / error を自動キャプチャ
 * - 画面上にオーバーレイ表示
 * - ワンクリックでクリップボードにコピー
 * - F12キーで表示/非表示切替
 */
class DebugLogger {
    constructor() {
        this.logs = [];
        this.maxLogs = 200;
        this.visible = false;
        this.overlay = null;
        this.logContainer = null;

        this._hookConsole();
        this._createOverlay();
        this._bindKeys();

        // 未捕捉エラーもキャプチャ
        window.addEventListener('error', (e) => {
            this.add('ERROR', `${e.message} (${e.filename}:${e.lineno}:${e.colno})`);
        });
        window.addEventListener('unhandledrejection', (e) => {
            this.add('ERROR', `Unhandled Promise: ${e.reason}`);
        });
    }

    /** console.log / warn / error をフック */
    _hookConsole() {
        const self = this;
        const origLog = console.log.bind(console);
        const origWarn = console.warn.bind(console);
        const origError = console.error.bind(console);

        console.log = function(...args) {
            origLog(...args);
            self.add('LOG', args.map(a => self._stringify(a)).join(' '));
        };
        console.warn = function(...args) {
            origWarn(...args);
            self.add('WARN', args.map(a => self._stringify(a)).join(' '));
        };
        console.error = function(...args) {
            origError(...args);
            self.add('ERROR', args.map(a => self._stringify(a)).join(' '));
        };
    }

    _stringify(val) {
        if (val === null) return 'null';
        if (val === undefined) return 'undefined';
        if (typeof val === 'object') {
            try { return JSON.stringify(val, null, 0); } catch { return String(val); }
        }
        return String(val);
    }

    add(level, message) {
        const now = new Date();
        const time = now.toTimeString().slice(0, 8) + '.' + String(now.getMilliseconds()).padStart(3, '0');
        const entry = { time, level, message };
        this.logs.push(entry);

        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        if (this.visible) {
            this._renderLogs();
        }
    }

    /** オーバーレイ DOM を生成 */
    _createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'debug-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; right: 0; width: 420px; height: 100vh;
            background: rgba(0,0,0,0.92); color: #eee; font-family: 'Consolas','Courier New',monospace;
            font-size: 11px; z-index: 99999; display: none; flex-direction: column;
            border-left: 2px solid #ff6b35;
        `;

        // ヘッダー
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 8px 12px; background: #1a1a1a; display: flex; justify-content: space-between;
            align-items: center; border-bottom: 1px solid #333; flex-shrink: 0;
        `;
        header.innerHTML = `
            <span style="color:#ff6b35;font-weight:bold;">Debug Log (F12)</span>
            <span>
                <button id="debug-copy-btn" style="background:#ff6b35;color:#fff;border:none;padding:4px 10px;
                    cursor:pointer;border-radius:3px;font-size:11px;margin-right:6px;">Copy All</button>
                <button id="debug-clear-btn" style="background:#555;color:#fff;border:none;padding:4px 10px;
                    cursor:pointer;border-radius:3px;font-size:11px;margin-right:6px;">Clear</button>
                <button id="debug-close-btn" style="background:#333;color:#fff;border:none;padding:4px 10px;
                    cursor:pointer;border-radius:3px;font-size:11px;">X</button>
            </span>
        `;

        // フィルター
        const filterBar = document.createElement('div');
        filterBar.style.cssText = `padding: 4px 12px; background: #222; display: flex; gap: 8px; flex-shrink: 0;`;
        filterBar.innerHTML = `
            <label style="color:#aaa;cursor:pointer;"><input type="checkbox" id="debug-filter-log" checked> LOG</label>
            <label style="color:#f1c40f;cursor:pointer;"><input type="checkbox" id="debug-filter-warn" checked> WARN</label>
            <label style="color:#e74c3c;cursor:pointer;"><input type="checkbox" id="debug-filter-error" checked> ERROR</label>
        `;

        // ログコンテナ
        const logContainer = document.createElement('div');
        logContainer.id = 'debug-log-container';
        logContainer.style.cssText = `
            flex: 1; overflow-y: auto; padding: 4px 0;
            scrollbar-width: thin; scrollbar-color: #555 #1a1a1a;
        `;

        overlay.appendChild(header);
        overlay.appendChild(filterBar);
        overlay.appendChild(logContainer);
        document.body.appendChild(overlay);

        this.overlay = overlay;
        this.logContainer = logContainer;

        // イベント
        document.getElementById('debug-copy-btn').addEventListener('click', () => this.copyToClipboard());
        document.getElementById('debug-clear-btn').addEventListener('click', () => this.clear());
        document.getElementById('debug-close-btn').addEventListener('click', () => this.toggle());

        // フィルターチェックボックス
        ['log', 'warn', 'error'].forEach(level => {
            document.getElementById(`debug-filter-${level}`).addEventListener('change', () => this._renderLogs());
        });
    }

    _renderLogs() {
        const showLog = document.getElementById('debug-filter-log').checked;
        const showWarn = document.getElementById('debug-filter-warn').checked;
        const showError = document.getElementById('debug-filter-error').checked;

        const filtered = this.logs.filter(entry => {
            if (entry.level === 'LOG' && !showLog) return false;
            if (entry.level === 'WARN' && !showWarn) return false;
            if (entry.level === 'ERROR' && !showError) return false;
            return true;
        });

        const html = filtered.map(entry => {
            const levelColor = entry.level === 'ERROR' ? '#e74c3c' :
                               entry.level === 'WARN' ? '#f1c40f' : '#aaa';
            const levelBg = entry.level === 'ERROR' ? 'rgba(231,76,60,0.1)' :
                            entry.level === 'WARN' ? 'rgba(241,196,15,0.05)' : 'transparent';
            return `<div style="padding:2px 12px;border-bottom:1px solid #1a1a1a;background:${levelBg};word-break:break-all;">` +
                   `<span style="color:#666;">${entry.time}</span> ` +
                   `<span style="color:${levelColor};font-weight:bold;">[${entry.level}]</span> ` +
                   `<span>${this._escapeHtml(entry.message)}</span></div>`;
        }).join('');

        this.logContainer.innerHTML = html;

        // 自動スクロール
        this.logContainer.scrollTop = this.logContainer.scrollHeight;
    }

    _escapeHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    _bindKeys() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F12') {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    toggle() {
        this.visible = !this.visible;
        this.overlay.style.display = this.visible ? 'flex' : 'none';
        if (this.visible) this._renderLogs();
    }

    clear() {
        this.logs = [];
        this._renderLogs();
    }

    copyToClipboard() {
        const text = this.logs.map(e => `[${e.time}] [${e.level}] ${e.message}`).join('\n');

        navigator.clipboard.writeText(text).then(() => {
            const btn = document.getElementById('debug-copy-btn');
            btn.textContent = 'Copied!';
            btn.style.background = '#27ae60';
            setTimeout(() => {
                btn.textContent = 'Copy All';
                btn.style.background = '#ff6b35';
            }, 1500);
        }).catch(() => {
            // フォールバック: テキストエリア経由
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.cssText = 'position:fixed;top:-9999px;';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        });
    }
}

// ページ読み込み時に自動起動
const debugLogger = new DebugLogger();
