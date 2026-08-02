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

---

## 3. Docker コンテナ内 NestJS ルートの未同期・ビルド差分（新設 API の 404 / 400 エラー）

### 🚨 現象
* 新しくバックエンドコントローラーに追加した API エンドポイント（例: `POST /api/tasks/dependencies`）をフロントエンドから呼び出した際、`404 Not Found` または `400 Bad Request`（例: `Task with id dependencies not found`）のエラーが発生する。
* バックエンドの TypeScript コード上には定義が存在するにもかかわらず、リクエストが想定と異なるルート（例: `POST /api/tasks/:id`）に割り当てられて失敗する。

### 💡 原因
* Docker コンテナ環境において、コンテナ起動時（`nest start --watch`）に古いコンパイル結果（`dist` ディレクトリやビルド済みイメージ）が参照され続けている場合、ローカル環境で新規作成したコントローラーのルーティングが Docker 内の NestJS ルータにマッピング（認識）されない現象が発生します。

### 🔧 解決策

#### ① バックエンドコンテナの明示的な再ビルドと再起動
コンテナをイメージから再ビルドして起動し、コンパイル成果物を完全に更新します。

```bash
docker compose up -d --build backend
```

#### ② Docker コンテナログによるルーティングマッピングの確認
以下のコマンドを実行し、新しい API エンドポイントが NestJS の `RouterExplorer` に正常にマッピングされていることを確認します。

```bash
docker logs --tail 50 dev-task-management-app-backend-1
```

**【正常時のログ出力例】**
```log
[Nest] LOG [RouterExplorer] Mapped {/api/tasks/dependencies, GET} route
[Nest] LOG [RouterExplorer] Mapped {/api/tasks/dependencies, POST} route
[Nest] LOG [RouterExplorer] Mapped {/api/tasks/dependencies/:id, PUT} route
[Nest] LOG [RouterExplorer] Mapped {/api/tasks/dependencies/:id, DELETE} route
```

