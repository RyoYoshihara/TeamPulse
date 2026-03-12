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
| 認証 | JWT (python-jose + passlib/bcrypt) |
| テスト | pytest + httpx (SQLite) |
| 開発環境 | Docker Compose |

## システム構成

```
[ Browser ]
    │
    │ HTTP (port 3000)
    ▼
[ Frontend Container ]  Next.js 14
    │
    │ REST API (port 8000)
    ▼
[ Backend Container ]   FastAPI + SQLAlchemy
    │
    ▼
[ DB Container ]        PostgreSQL 15 (port 5432)
```

## 画面一覧

| 画面 | パス | 説明 |
|---|---|---|
| ログイン | `/login` | メール・パスワードでの認証 |
| ダッシュボード | `/dashboard` | KPI・稼働率・遅延タスクの俯瞰表示 |
| メンバー一覧 | `/members` | 部署・雇用形態フィルタ、検索 |
| メンバー詳細 | `/members/[id]` | 情報編集・削除 |
| プロジェクト一覧 | `/projects` | ステータスフィルタ、進捗バー表示 |
| プロジェクト詳細 | `/projects/[id]` | 情報編集・進捗管理 |
| アサイン管理 | `/assignments` | メンバー×プロジェクトの配属率管理 |
| タスク一覧 | `/tasks` | ステータス・優先度・期限の複合フィルタ |
| タスク詳細 | `/tasks/[id]` | ステータス即時変更・インライン編集 |
| 工数ログ | `/work-logs` | 日付範囲・プロジェクト・メンバーフィルタ |

## 主要機能

### 認証・認可
- JWT ベースのトークン認証
- ロールベースアクセス制御 (admin / manager / member)
- 認証ガード付きルートグループ

### メンバー管理
- CRUD + キーワード検索
- 部署・役職・雇用形態・稼働上限の管理
- アクティブ/非アクティブ切り替え

### プロジェクト管理
- CRUD + ステータスフィルタ (planning / active / on_hold / completed / cancelled)
- 進捗率の可視化（プログレスバー）
- アサイン人数の自動集計表示

### アサイン管理
- メンバー×プロジェクトの配属率（%）管理
- メンバー別稼働率サマリー API
- 100%超過の警告表示

### タスク管理
- CRUD + 複合フィルタ（プロジェクト/ステータス/優先度/担当者/期限）
- ステータス即時変更（ワンクリック）
- 期限超過の赤色ハイライト
- 見積工数・実績工数の管理

### 工数ログ管理
- タスクに紐づく作業時間の記録
- タスクの実績工数を自動集計・同期
- 日付範囲・プロジェクト・メンバーでのフィルタ
- 合計時間のサマリー表示

### ダッシュボード
- KPI カード（アクティブプロジェクト数/未完了タスク数/遅延タスク数/キャパ超過メンバー数）
- メンバー稼働率一覧（色分けプログレスバー）
- プロジェクト進捗一覧
- 遅延タスク一覧

## API エンドポイント

| メソッド | パス | 説明 |
|---|---|---|
| POST | `/api/v1/auth/login` | ログイン |
| GET | `/api/v1/auth/me` | 現在ユーザー取得 |
| GET/POST | `/api/v1/members` | メンバー一覧/作成 |
| GET/PATCH/DELETE | `/api/v1/members/{id}` | メンバー詳細/更新/削除 |
| GET | `/api/v1/members/{id}/allocation-summary` | 稼働率サマリー |
| GET/POST | `/api/v1/projects` | プロジェクト一覧/作成 |
| GET/PATCH/DELETE | `/api/v1/projects/{id}` | プロジェクト詳細/更新/削除 |
| GET/POST | `/api/v1/project-assignments` | アサイン一覧/作成 |
| GET/PATCH/DELETE | `/api/v1/project-assignments/{id}` | アサイン詳細/更新/削除 |
| GET/POST | `/api/v1/tasks` | タスク一覧/作成 |
| GET/PATCH/DELETE | `/api/v1/tasks/{id}` | タスク詳細/更新/削除 |
| PATCH | `/api/v1/tasks/{id}/status` | タスクステータス変更 |
| GET/POST | `/api/v1/work-logs` | 工数ログ一覧/作成 |
| GET/PATCH/DELETE | `/api/v1/work-logs/{id}` | 工数ログ詳細/更新/削除 |
| GET | `/api/v1/dashboard/summary` | ダッシュボードサマリー |
| GET | `/api/v1/dashboard/member-utilizations` | メンバー稼働率 |
| GET | `/api/v1/dashboard/project-progress` | プロジェクト進捗 |
| GET | `/api/v1/dashboard/delayed-tasks` | 遅延タスク |
| GET | `/api/v1/health` | ヘルスチェック |

## ディレクトリ構成

```
TeamPulse/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # APIエンドポイント (8モジュール)
│   │   ├── core/               # 設定・認証・共通処理
│   │   ├── db/                 # DB接続・Base定義
│   │   ├── models/             # SQLAlchemyモデル (7テーブル)
│   │   ├── schemas/            # Pydanticスキーマ
│   │   ├── services/           # ビジネスロジック
│   │   └── main.py             # FastAPIアプリ
│   ├── alembic/                # マイグレーション
│   ├── tests/                  # pytest テスト (38テスト)
│   ├── seed.py                 # デモデータ投入
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── app/                    # Next.js App Router
│   │   ├── (authenticated)/    # 認証後レイアウト (10画面)
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

# 4. デモデータ投入
docker compose exec backend python seed.py
```

### デモアカウント

| Email | Password | ロール | 名前 |
|---|---|---|---|
| `tanaka@example.com` | `password123` | admin | 田中 太郎 |
| `sato@example.com` | `password123` | manager | 佐藤 花子 |
| `suzuki@example.com` | `password123` | member | 鈴木 一郎 |

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

### テスト実行

```bash
docker compose exec backend python -m pytest tests/ -v
```

## データモデル

主要テーブル:

- `organizations` - 組織（マルチテナント対応）
- `users` - ログインユーザー (admin/manager/member)
- `members` - 業務メンバー（部署・役職・稼働上限）
- `projects` - プロジェクト（ステータス・進捗率）
- `project_assignments` - アサイン（配属率管理）
- `tasks` - タスク（ステータス・優先度・見積/実績工数）
- `work_logs` - 工数ログ（作業時間記録）

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
