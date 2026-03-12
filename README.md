# TeamPulse (ResourceFlow)

エンジニア組織向けのリソース・プロジェクト管理SaaS。
メンバーの稼働率、プロジェクトへのアサイン状況、タスク進捗、工数実績を統合管理し、組織のリソース状況を可視化します。

## 技術構成

| 項目 | 技術 |
|---|---|
| Frontend | Next.js 14 (App Router) + React + TypeScript |
| Backend | Python FastAPI |
| DB | PostgreSQL 15 |
| ORM | SQLAlchemy 2.0 |
| マイグレーション | Alembic |
| 認証 | JWT (python-jose + passlib) |
| 開発環境 | Docker Compose |

## システム構成

```
[ Browser ]
    │
    │ HTTP (port 3000)
    ▼
[ Frontend Container ]  Next.js
    │
    │ REST API (port 8000)
    ▼
[ Backend Container ]   FastAPI
    │
    ▼
[ DB Container ]        PostgreSQL (port 5432)
```

## ディレクトリ構成

```
TeamPulse/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # APIエンドポイント
│   │   ├── core/               # 設定・認証・共通処理
│   │   ├── db/                 # DB接続・Base定義
│   │   ├── models/             # SQLAlchemyモデル
│   │   ├── schemas/            # Pydanticスキーマ
│   │   ├── services/           # ビジネスロジック
│   │   └── main.py             # FastAPIアプリ
│   ├── alembic/                # マイグレーション
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── app/                    # Next.js App Router
│   │   ├── (authenticated)/    # 認証後レイアウト
│   │   └── login/              # ログイン画面
│   ├── components/             # 共通コンポーネント
│   ├── lib/                    # APIクライアント等
│   ├── Dockerfile
│   └── package.json
├── docs/                       # 設計書
├── docker-compose.yml
└── README.md
```

## セットアップ

### 前提条件

- Docker Desktop がインストール済みであること

### 起動手順

```bash
# 1. リポジトリをクローン
git clone <repository-url>
cd TeamPulse

# 2. Docker Compose でビルド・起動
docker compose up --build

# 3. 初回のDBマイグレーション（別ターミナルで実行）
docker compose exec backend alembic upgrade head
```

### アクセス先

| 対象 | URL |
|---|---|
| フロントエンド | http://localhost:3000 |
| バックエンドAPI | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| ヘルスチェック | http://localhost:8000/health |

### 停止

```bash
docker compose down
```

DBデータを含めて完全にリセットする場合:

```bash
docker compose down -v
```

## 主要機能 (MVP)

- **認証** - ログイン / ログアウト / JWT認証
- **メンバー管理** - 部署・役職・スキル・稼働上限の管理
- **プロジェクト管理** - ステータス・進捗率・期間の管理
- **アサイン管理** - メンバーの配属率可視化・警告
- **タスク管理** - ステータス・優先度・コメント・工数
- **工数管理** - 作業ログの記録・集計
- **ダッシュボード** - KPI・稼働率・遅延タスクの俯瞰

## データモデル

主要テーブル:

- `organizations` - 組織（マルチテナント対応）
- `users` - ログインユーザー
- `members` - 業務メンバー
- `projects` - プロジェクト
- `project_assignments` - アサイン（配属率管理）
- `tasks` - タスク
- `work_logs` - 工数ログ
- `task_comments` - タスクコメント
- `skills` / `member_skills` - スキル管理

## 環境変数

### Backend (`backend/.env`)

| 変数名 | 説明 | デフォルト値 |
|---|---|---|
| DATABASE_URL | DB接続文字列 | postgresql://postgres:postgres@db:5432/resourceflow |
| APP_ENV | 実行環境 | local |
| JWT_SECRET | JWT署名キー | dev-secret-key-change-in-production |
| JWT_ALGORITHM | JWTアルゴリズム | HS256 |
| ACCESS_TOKEN_EXPIRE_MINUTES | トークン有効期限(分) | 60 |
| CORS_ALLOW_ORIGINS | CORS許可オリジン | http://localhost:3000 |

### Frontend (`frontend/.env.local`)

| 変数名 | 説明 | デフォルト値 |
|---|---|---|
| NEXT_PUBLIC_API_BASE_URL | APIベースURL | http://localhost:8000 |
