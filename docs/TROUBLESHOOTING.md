# 🛠 開発環境トラブルシューティングガイド

本ドキュメントでは、DevTaskPro の開発環境（Windows 11 + Docker Desktop + Vite）において発生しやすいネットワーク通信エラーや Docker 関連の問題と、その解決策（ワークアラウンド）を記録・共有します。

---

## 1. `ERR_CONNECTION_RESET`（ブラウザ通信のリセット・画面真っ白エラー）

### 🚨 現象
* ブラウザで `http://localhost:5173/` にアクセスした際、「このサイトにアクセスできません / 接続がリセットされました (ERR_CONNECTION_RESET)」と表示される。
* コンソールに `[vite] failed to connect to websocket (Error: WebSocket closed without opened.)` や `main.tsx:1 Failed to load resource: net::ERR_CONNECTION_RESET` が出力される。

### 💡 原因
* **Windows 11 の DNS 優先度問題**: Windows 11 では `localhost` へのアクセス時に IPv6（`::1`）が優先して解決されます。
* **Docker Desktop のポート転送限界**: Docker Desktop on Windows はデフォルトで IPv4（`0.0.0.0` / `127.0.0.1`）のポートフォワーディングを行うため、IPv6 経由でリクエストが届いた場合にソケット接続を切断（リセット）してしまいます。

### 🔧 解決策・予防コード（設定済み）

#### ① `docker-compose.yml` での IPv4 ループバック明示固定
ホスト側のポートバインディングを `127.0.0.1` に直接バインドすることで、Windows のループバックポート転送を安定化させています。

```yaml
services:
  frontend:
    ports:
      - "127.0.0.1:5173:5173" # 👈 127.0.0.1 へ明示バインド
  backend:
    ports:
      - "127.0.0.1:3000:3000"
  db:
    ports:
      - "127.0.0.1:5432:5432"
```

#### ② `vite.config.ts` での Node.js DNS 優先順位設定
Vite サーバー内の DNS 解決順序を IPv4 優先 (`ipv4first`) に固定しています。

```typescript
import dns from 'node:dns';

// Windows 環境での IPv6 (::1) 優先による接続リセットを防ぎ、IPv4 (127.0.0.1) を優先解決
dns.setDefaultResultOrder('ipv4first');
```

#### ③ `vite.config.ts` での HMR (WebSocket) ホスト固定
ブラウザ上の Vite ホットリロード通信（WebSocket）が IPv6 へ迂回しないよう `127.0.0.1` に固定しています。

```typescript
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: {
      host: '127.0.0.1', // 👈 WebSocket 通信先を IPv4 に固定
      clientPort: 5173,
    },
  },
});
```

---

## 2. PC 再起動後の Docker ポート断線

### 🚨 現象
* Windows をシャットダウン・再起動した直後、Docker コンテナは起動しているのにブラウザからアクセスできない。

### 🔧 解決策
Windows のシャットダウンにより WSL2 / Docker Desktop のポートマッピング情報が一時的に解除されたためです。以下のコマンドでフロントエンド/バックエンドコンテナを再起動してください。

```bash
docker compose restart frontend
```
