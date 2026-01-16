# AI Paper Database Project Guidelines

## Project Overview
- **目的**: 自分の読んだ論文を管理・公開するための個人的なデータベースサイト
- **参考サイト**: AIDB (https://ai-data-base.com/) のようなUI/UXを目指す
- **デプロイ先**: GitHub Pages (静的ホスティング)
- **リポジトリ**: sofies-verden/paper_database

## Tech Stack
| Category | Technology |
|----------|------------|
| Framework | React 18 + Vite 6 (TypeScript) |
| Styling | Tailwind CSS 3.4 (モバイルレスポンシブ対応) |
| Database | public/data.json (ローカルJSONファイルのみ) |
| Search Engine | Fuse.js 7.0 (クライアントサイド全文検索) |
| Icons | Lucide React |
| Build | TypeScript 5.6, PostCSS, Autoprefixer |

## Directory Structure
```
paper_database/
├── public/
│   └── data.json           # 論文データ (静的JSON)
├── src/
│   ├── components/
│   │   ├── PaperCard.tsx   # 論文カード表示
│   │   ├── SearchBar.tsx   # 検索バー
│   │   └── Sidebar.tsx     # タグフィルターサイドバー
│   ├── App.tsx             # メインアプリケーション
│   ├── types.ts            # 型定義
│   ├── main.tsx            # エントリポイント
│   ├── index.css           # グローバルスタイル
│   └── vite-env.d.ts       # Vite型定義
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

## Data Schema

### Current Paper Type (src/types.ts)
```typescript
interface Paper {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  publishedDate: string;  // "YYYY-MM-DD"
  url: string;            // arXiv URL等
  authors: string[];
}
```

### Extended Paper Type (実装予定)
```typescript
type ReadingStatus = 'to-read' | 'reading' | 'read' | 'posted';

interface ExtendedPaper extends Paper {
  // 識別子
  doi?: string;                    // DOI (例: "10.48550/arXiv.1706.03762")
  arxivId?: string;                // arXiv ID (例: "1706.03762")

  // 読書管理
  status: ReadingStatus;           // 読書ステータス
  addedDate: string;               // データベース追加日
  readDate?: string;               // 読了日

  // メタデータ (API取得)
  citationCount?: number;          // 被引用数 (Semantic Scholar)
  influentialCitationCount?: number; // 影響力のある引用数 (Semantic Scholar)
  venue?: string;                  // 掲載ジャーナル/カンファレンス
  year?: number;                   // 出版年

  // OpenAlex指標
  openalexId?: string;             // OpenAlex ID
  citedByCount2Year?: number;      // 過去2年の被引用数 (IF代替)
  hIndex?: number;                 // 著者のh-index平均

  // インポート元
  source?: 'manual' | 'deep-research' | 'api';
}
```

## Architecture Rules

1. **No Backend**: サーバーサイドの処理は一切書かない。全てのデータは `fetch(import.meta.env.BASE_URL + 'data.json')` で取得する。

2. **Component Design**:
   - components フォルダに機能ごとに分割する
   - デザインはシンプルでモダンなカード型レイアウトを採用する
   - 各コンポーネントはTypeScriptの型を厳密に定義する

3. **Data Management**:
   - 論文データは全て public/data.json に集約する
   - IDは一意の文字列とする (DOIベースを推奨)
   - データ更新はCLIツール経由で行う (Webサイトからは読み取り専用)

4. **Static Site Constraints**:
   - GitHub Pagesは静的ホスティングのため、API呼び出しはローカルツールで実行
   - data.jsonの更新は手動コミット or GitHub Actions経由

## Build & Run Commands
```bash
npm run dev      # 開発サーバー起動 (localhost:5173)
npm run build    # プロダクションビルド (dist/)
npm run preview  # ビルド結果プレビュー
```

---

# Implementation Plan

## Phase 1: データスキーマ拡張と読書管理機能
**目標**: 基本的な読書ステータス管理をUIに追加

### Tasks
1. **types.ts の拡張**
   - `ReadingStatus` 型の追加
   - `ExtendedPaper` 型の定義 (後方互換性維持)

2. **data.json のスキーマ移行**
   - 既存データに `status: 'read'`, `addedDate` を追加
   - 移行スクリプト作成 (Node.js CLI)

3. **PaperCard.tsx の更新**
   - ステータスバッジ表示
   - 被引用数・ジャーナル情報の表示領域追加

4. **Sidebar.tsx の更新**
   - ステータスフィルター追加 ('to-read', 'reading', 'read', 'posted')
   - 未読件数バッジ

### Dependencies
- なし (独立して実装可能)

---

## Phase 2: メタデータ自動取得ツール (CLI)
**目標**: 外部APIから論文メタデータを取得するCLIツール

### Tasks
1. **scripts/fetch-metadata.ts 作成**
   - Semantic Scholar API連携
   - OpenAlex API連携
   - Crossref API連携 (フォールバック)

2. **API統合ロジック**
   - DOI/arXiv IDからの検索
   - タイトルからのファジー検索
   - レートリミット対応

3. **data.json 更新機能**
   - 既存エントリへのメタデータ追記
   - 差分更新 (上書き防止)

### Dependencies
- Phase 1 (ExtendedPaper型が必要)

---

## Phase 3: ディープリサーチインポート機能
**目標**: Markdown/テキストから論文情報を抽出

### Tasks
1. **scripts/import-papers.ts 作成**
   - Markdownパーサー
   - DOI/arXivリンクの正規表現抽出
   - タイトル・著者のヒューリスティック抽出

2. **重複チェック機能**
   - DOI完全一致チェック
   - タイトル類似度 (Levenshtein距離 or Fuse.js)
   - 重複候補の対話的確認

3. **バッチインポート**
   - 複数論文の一括追加
   - インポート結果レポート

### Dependencies
- Phase 1 (データスキーマ)
- Phase 2 (メタデータ取得でエンリッチ)

---

## Phase 4: UI拡張と表示改善
**目標**: 取得したメタデータをUIで活用

### Tasks
1. **PaperCard.tsx 拡張**
   - 被引用数バッジ (アイコン付き)
   - ジャーナル/カンファレンス表示
   - インパクト指標の視覚化

2. **ソート機能追加**
   - 被引用数順
   - 出版日順 (既存)
   - 追加日順

3. **統計ダッシュボード** (オプション)
   - 総論文数
   - ステータス別グラフ
   - タグ分布

### Dependencies
- Phase 1, 2 (メタデータが必要)

---

## Phase 5: Claude API推薦機能
**目標**: AIによる今日読むべき論文の提案

### Tasks
1. **scripts/recommend.ts 作成**
   - Claude API連携
   - 未読論文リストの送信
   - 推薦理由の生成

2. **推薦ロジック**
   - 被引用数・影響力を考慮
   - 最近の興味タグを分析
   - 読書履歴からの傾向分析

3. **出力フォーマット**
   - ターミナル表示
   - Markdown出力 (オプション)

### Dependencies
- Phase 1-4 (全データが揃った状態)
- Claude API キー設定

---

# External API Specifications

## Semantic Scholar API
- **Endpoint**: `https://api.semanticscholar.org/graph/v1/paper/`
- **認証**: API Key (オプション、レートリミット緩和)
- **取得フィールド**:
  - `citationCount`: 被引用数
  - `influentialCitationCount`: 影響力のある引用数
  - `venue`: 掲載先
  - `year`: 出版年
  - `authors`: 著者詳細
- **検索方法**:
  - DOI: `/paper/DOI:{doi}`
  - arXiv: `/paper/arXiv:{arxiv_id}`
  - タイトル: `/paper/search?query={title}`
- **レートリミット**: 100 requests/5分 (キーなし)

## OpenAlex API
- **Endpoint**: `https://api.openalex.org/works/`
- **認証**: 不要 (polite poolはメール設定推奨)
- **取得フィールド**:
  - `cited_by_count`: 被引用数
  - `cited_by_count_2year`: 過去2年の被引用数 (IF代替)
  - `primary_location.source`: ジャーナル情報
  - `authorships[].author.summary_stats.h_index`: 著者h-index
- **検索方法**:
  - DOI: `/works/doi:{doi}`
  - タイトル: `/works?filter=title.search:{title}`
- **レートリミット**: 100,000 requests/日

## Crossref API
- **Endpoint**: `https://api.crossref.org/works/`
- **認証**: 不要 (polite poolはメール設定推奨)
- **取得フィールド**:
  - `title`: タイトル
  - `author`: 著者リスト
  - `published-print` / `published-online`: 出版日
  - `container-title`: ジャーナル名
  - `is-referenced-by-count`: 被引用数
- **検索方法**:
  - DOI: `/works/{doi}`
  - タイトル: `/works?query.title={title}`
- **レートリミット**: 50 requests/秒

---

# CLI Tools (実装予定)

```bash
# Phase 2: メタデータ取得
npm run fetch-metadata              # 全論文のメタデータ更新
npm run fetch-metadata -- --id=123  # 特定論文のみ

# Phase 3: インポート
npm run import -- input.md          # Markdownからインポート
npm run import -- --check-only      # 重複チェックのみ

# Phase 5: 推薦
npm run recommend                   # 今日の推薦論文を表示
npm run recommend -- --count=3      # 3件推薦
```

---

# Notes

## 後方互換性
- 既存の `Paper` 型のデータは引き続き動作する
- 新フィールドはすべてオプショナル
- UIは未設定フィールドを適切に非表示

## セキュリティ
- APIキーは `.env` ファイルで管理 (gitignore済み)
- クライアントサイドにAPIキーを埋め込まない
- CLIツールはローカル実行のみ

## パフォーマンス
- data.jsonは1000件程度まで許容
- それ以上はページネーション検討
- Fuse.jsの検索は十分高速
