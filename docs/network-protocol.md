# 通信プロトコル仕様（Socket.io）

## 概要

ターンベースなので通信量は少ない。サーバーが全ロジック管理、クライアントは操作送信→結果受信→表示。

---

## ルーム管理

### Client → Server

| Event | Data | Description |
|-------|------|-------------|
| `create_room` | `{ playerName, playerCount: 3\|4 }` | 部屋作成 |
| `join_room` | `{ roomCode, playerName }` | 部屋参加 |
| `leave_room` | `{}` | 退出 |
| `start_game` | `{}` | 開始（ホストのみ） |

### Server → Client

| Event | Data | Description |
|-------|------|-------------|
| `room_created` | `{ roomCode }` | 作成成功 |
| `room_joined` | `{ roomCode, players }` | 参加成功 |
| `player_joined` | `{ player }` | 他者参加通知 |
| `player_left` | `{ playerId }` | 他者退出通知 |
| `room_error` | `{ message }` | エラー |

---

## ゲームフェーズ

### キャラ選択
```
S→All:  phase_char_select  { availableCharacters, timeLimit: 15 }
C→S:    select_character    { characterId }
S→All:  character_selected  { playerId, characterId }
S→All:  phase_char_done     { selections }
```

### お客さん公開
```
S→All:  phase_customers_reveal  { customers: [id, id] }
```

### スープ選択
```
S→All:  phase_soup_select   { timeLimit: 10 }
C→S:    select_soup         { soupId }
S→All:  soup_results        { selections: { playerId: soupId } }
```

### 麺選択（スープと同構造）
```
S→All:  phase_noodle_select { timeLimit: 10 }
C→S:    select_noodle       { noodleId }
S→All:  noodle_results      { selections }
```

### ドラフト
```
S→Each: draft_hand          { hand: [ids], round, totalRounds, timeLimit: 15 }
C→S:    draft_pick          { ingredientId }
S→All:  draft_round_done    { round, picks: { playerId: ingId } }
（9ラウンド繰り返し）
S→Each: draft_complete      { yourIngredients: [ids] }
```

### 盛り付け
```
S→All:  phase_placement     { timeLimit: 60 }
C→S:    submit_placement    { grid: (string|null)[3][3] }
S→All:  all_placed          {}
```

### 採点
```
S→All:  scoring_results     { players: [{ playerId, scores, grid, ... }] }
```

### 称号セレモニー
```
S→All:  ceremony_results    { titles: [...], finalScores: [...] }
```

---

## タイムアウト処理

| フェーズ | タイムアウト時 |
|---------|-------------|
| キャラ選択 | ランダム未選択キャラ割り当て |
| スープ/麺 | ランダム選択 |
| ドラフト | 手札の先頭を自動選択 |
| 盛り付け | 現在の配置状態で確定 |

## 切断処理

- Socket.io自動再接続
- サーバー側で30秒セッション保持
- 30秒以内の再接続 → ゲーム状態再送
- 30秒超過 → AI差し替え（Phase 4）
