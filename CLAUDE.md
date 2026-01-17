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
│   └── data.json              # 論文データ (静的JSON)
├── src/
│   ├── components/
│   │   ├── PaperCard.tsx      # 論文カード表示
│   │   ├── SearchBar.tsx      # 検索バー
│   │   └── Sidebar.tsx        # タグフィルターサイドバー
│   ├── services/
│   │   └── paperApi.ts        # 外部API統合 (Semantic Scholar, OpenAlex)
│   ├── utils/
│   │   ├── parseResearch.ts   # Markdownパーサー
│   │   └── deduplication.ts   # 重複チェック
│   ├── App.tsx                # メインアプリケーション
│   ├── types.ts               # 型定義
│   ├── main.tsx               # エントリポイント
│   ├── index.css              # グローバルスタイル
│   └── vite-env.d.ts          # Vite型定義
├── scripts/
│   └── add-papers.ts          # CLIインポートツール (--enrich対応)
├── .env.example               # 環境変数テンプレート
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

## Data Schema

### Paper Type (src/types.ts) - Phase 1 完了
```typescript
// 読書ステータス
type ReadingStatus = 'to-read' | 'reading' | 'read' | 'posted';

// ジャーナル/会議情報
interface Journal {
  name: string;
  issn?: string;
  hIndex?: number;
  twoYearCitedness?: number;  // IF代替指標
}

// 論文データ型
interface Paper {
  // 基本情報
  id: string;
  title: string;
  authors: string[];
  year: number;
  doi?: string;
  url?: string;
  abstract?: string;

  // タグ・カテゴリ
  tags: string[];

  // 読書管理
  status: ReadingStatus;
  addedDate: string;      // ISO 8601 (YYYY-MM-DD)
  readDate?: string;      // ISO 8601

  // 引用メタデータ
  citationCount?: number;
  influentialCitations?: number;
  journal?: Journal;

  // ツイート管理
  tweetDraft?: string;
  tweetedAt?: string;

  // 後方互換性 (deprecated)
  summary?: string;        // Use abstract instead
  publishedDate?: string;  // Use year instead
}
```

### 移行関数
```typescript
// 後方互換性ヘルパー: 旧データを新形式に変換
function migratePaper(oldPaper: Partial<Paper>): Paper
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

## Phase 1: データスキーマ拡張と読書管理機能 ✅ 完了
**目標**: 基本的な読書ステータス管理をUIに追加

### 完了したタスク
1. ✅ **types.ts の拡張**
   - `ReadingStatus` 型の追加
   - `Journal` 型の追加
   - `Paper` 型の完全再定義 (後方互換性維持)
   - `migratePaper()` ヘルパー関数追加

2. ✅ **data.json のスキーマ移行**
   - 既存6件に新フィールド追加 (`status`, `addedDate`, `year`, `doi`, `abstract`, `citationCount`, `influentialCitations`, `journal`)
   - サンプルデータ1件追加 (Chain-of-Thought論文、`status: 'to-read'`)

3. ✅ **コンポーネント互換性対応**
   - `App.tsx`: `year` ベースのソートに変更、検索キーに `abstract` 追加
   - `PaperCard.tsx`: `abstract` 優先表示、`year` 表示

### 未実装 (Phase 4で実装予定)
- ステータスバッジ表示
- 被引用数・ジャーナル情報の表示
- Sidebar.tsxのステータスフィルター

### Dependencies
- なし (独立して実装可能)

---

## Phase 2: メタデータ自動取得ツール (CLI) ✅ 完了
**目標**: 外部APIから論文メタデータを取得するCLIツール

### 完了したタスク
1. ✅ **src/services/paperApi.ts 作成**
   - Semantic Scholar API連携 (`getSemanticScholarData()`)
   - OpenAlex API連携 (`getOpenAlexData()`)
   - DOI/arXiv ID/タイトルからの検索
   - エラーハンドリング・リトライ（3回まで）
   - レートリミット対応（バッチ処理、遅延）

2. ✅ **API統合ロジック**
   - `enrichPaper()` - 単一論文のメタデータ取得
   - `enrichPapers()` - バッチ処理（並列10件、バッチ間遅延）
   - `applyEnrichment()` - 取得データの適用
   - `getEnrichmentSummary()` - 統計サマリー生成

3. ✅ **CLIツール統合**
   - `--enrich` フラグで add-papers.ts に統合
   - プログレスバー表示
   - 取得結果サマリー表示

### 使用方法
```bash
npm run add-papers -- research.md --enrich    # メタデータ取得付きインポート
```
**注意**: npmスクリプトへの引数は `--` の後に指定する

### 環境設定 (.env)
```
OPENALEX_EMAIL=your-email@example.com
```

### Dependencies
- Phase 1 (ExtendedPaper型が必要) ✅

---

## Phase 3: ディープリサーチインポート機能 ✅ 完了
**目標**: Markdown/テキストから論文情報を抽出

### 完了したタスク
1. ✅ **src/utils/parseResearch.ts 作成**
   - DOI正規表現抽出 (`extractDOIs()`)
   - arXiv ID正規表現抽出 (`extractArxivIds()`)
   - タイトル・著者のヒューリスティック抽出
   - Markdown記法のクリーンアップ
   - `parseResearchMarkdown()` メイン関数
   - `toPaper()` 変換関数

2. ✅ **src/utils/deduplication.ts 作成**
   - Levenshtein距離による類似度計算
   - DOI完全一致チェック
   - arXiv ID完全一致チェック
   - タイトル類似度チェック（閾値: 0.9）
   - `checkDuplicates()` バッチ重複チェック
   - `formatDuplicateReport()` レポート生成

3. ✅ **scripts/add-papers.ts 作成**
   - CLIツール実装
   - `npm run add-papers <filepath>` で実行
   - `--check` オプション（ドライラン）
   - `--tags` オプション（タグ付与）
   - `--status` オプション（ステータス指定）

### 使用方法
```bash
npm run add-papers -- research.md           # マークダウンからインポート
npm run add-papers -- --check research.md   # 重複チェックのみ
npm run add-papers -- --tags "LLM,NLP" research.md  # タグ付きでインポート
npm run add-papers -- --enrich --tags "LLM" research.md  # メタデータ取得+タグ付き
```
**注意**: npmスクリプトへの引数は `--` の後に指定する

### Dependencies
- Phase 1 (データスキーマ) ✅

### 動作確認結果 (2026-01-16)
- ✅ CLIツール正常動作: 論文抽出・インポート成功
- ✅ 重複検出機能: DOI一致、arXiv ID一致を正しく検出
- ✅ プログレスバー表示: 正常動作
- ✅ エラーハンドリング: API失敗時も論文追加は継続（graceful degradation）
- ⚠️ 外部API: ローカル環境からは正常動作（サンドボックス環境ではネットワーク制限あり）

---

## Phase 4: UI拡張と表示改善 ✅ 完了
**目標**: 取得したメタデータをUIで活用

### 完了したタスク
1. ✅ **PaperCard.tsx 拡張**
   - ステータスバッジ表示 (to-read: 青, reading: 黄, read: 緑, posted: 紫)
   - 被引用数バッジ (Quote アイコン付き、K/M形式で表示)
   - 影響力のある引用数 (括弧内に表示)
   - ジャーナル/カンファレンス表示 (BookOpen アイコン)
   - h-index、2yr citedness 表示

2. ✅ **Sidebar.tsx 拡張**
   - ステータスフィルターセクション追加 (アイコン付き)
   - ステータス別件数表示
   - フィルタークリア機能

3. ✅ **App.tsx 拡張**
   - ソートドロップダウン追加
     - 出版年（新しい/古い順）
     - 被引用数（多い/少ない順）
     - 追加日（新しい/古い順）
   - ステータスフィルターstate管理
   - レスポンシブ対応（モバイル用短縮表示）

4. **統計ダッシュボード** (未実装 - オプション)
   - 総論文数
   - ステータス別グラフ
   - タグ分布

### 実装したUIコンポーネント構成
```
src/components/
├── PaperCard.tsx   # 論文カード (Calendar, Users, Quote, BookOpen, Clock, BookMarked, CheckCircle, Share2)
├── SearchBar.tsx   # 検索バー (Search)
└── Sidebar.tsx     # フィルター (Filter, Tag, Clock, BookMarked, CheckCircle, Share2)
```

### 使用したLucide Reactアイコン
- `Quote`: 被引用数
- `BookOpen`: ジャーナル/会議
- `Clock`: 未読ステータス
- `BookMarked`: 読書中ステータス
- `CheckCircle`: 読了ステータス
- `Share2`: 投稿済ステータス
- `Filter`: フィルターセクション
- `ArrowUpDown`, `ChevronDown`: ソートUI

### Dependencies
- Phase 1, 2 (メタデータが必要) ✅

---

## Phase 5: Claude API推薦機能 ✅ 完了
**目標**: AIによる今日読むべき論文の提案

### 完了したタスク
1. ✅ **src/services/recommendation.ts 作成**
   - Claude API連携 (claude-sonnet-4-20250514)
   - 未読論文リストをプロンプトに含める
   - 推薦理由・関連度スコア・読む順序を返す
   - クイック推薦モード（API不要のフォールバック）

2. ✅ **推薦ロジック**
   - ユーザープロファイル定義（研究分野: 教育工学、計量経済学）
   - 被引用数・影響力のある引用を考慮
   - ジャーナルh-index・2年間被引用率を考慮
   - 研究分野との関連性を分析

3. ✅ **推薦UIコンポーネント**
   - ヘッダーに「推薦」ボタン追加（未読数バッジ付き）
   - モーダルダイアログで推薦結果を表示
   - Claude AI推薦 / クイック推薦の切り替え
   - 推薦論文へのスクロール＆ハイライト機能

### 使用方法
1. `.env.example` を `.env` にコピー
2. `VITE_ANTHROPIC_API_KEY` にClaude APIキーを設定
3. ヘッダーの「推薦」ボタンをクリック
4. 「Claude AI推薦」または「クイック推薦」を選択
5. 「推薦を取得」をクリック

### 環境設定 (.env)
```bash
# Claude API推薦機能用（必須）
VITE_ANTHROPIC_API_KEY=your-anthropic-api-key

# OpenAlex polite pool用（推奨）
VITE_OPENALEX_EMAIL=your-email@example.com
```

### 推薦モード
| モード | 説明 | APIキー |
|--------|------|---------|
| Claude AI推薦 | Claude APIで高度な推薦理由を生成 | 必要 |
| クイック推薦 | 被引用数・タグ関連性でヒューリスティック推薦 | 不要 |

### 実装したコンポーネント
```
src/
├── services/
│   └── recommendation.ts    # 推薦ロジック
└── components/
    └── RecommendationModal.tsx  # 推薦UIモーダル
```

### セキュリティに関する注意
⚠️ `VITE_ANTHROPIC_API_KEY` はクライアントサイドで使用されます。
- 開発/個人利用では問題ありませんが、公開サイトでは注意が必要です
- プロダクション環境ではバックエンドプロキシの使用を推奨
- APIキーは `.gitignore` に含まれる `.env` ファイルで管理

### Dependencies
- Phase 1-4 (全データが揃った状態) ✅
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

# CLI Tools

## 実装済み (Phase 2-3)

```bash
# 論文インポート (Markdownから)
npm run add-papers -- research.md           # 基本インポート
npm run add-papers -- --check research.md   # 重複チェックのみ（ドライラン）
npm run add-papers -- --enrich research.md  # メタデータ取得付き
npm run add-papers -- --tags "LLM,NLP" research.md  # タグ付与
npm run add-papers -- --status reading research.md  # ステータス指定
npm run add-papers -- --enrich --tags "LLM" --status to-read research.md  # 組み合わせ
```

## UI機能 (Phase 5)

推薦機能はCLIではなくUI内で実装されました:
- ヘッダーの「推薦」ボタンからアクセス
- Claude AI推薦（APIキー必要）またはクイック推薦（APIキー不要）を選択可能

---

# Notes

## 後方互換性
- 既存の `Paper` 型のデータは引き続き動作する
- 新フィールドはすべてオプショナル
- UIは未設定フィールドを適切に非表示

## セキュリティ
- CLIツール用APIキーは `.env` ファイルで管理 (gitignore済み)
- フロントエンド用変数は `VITE_` プレフィックス付きで `.env` に設定
- ⚠️ `VITE_ANTHROPIC_API_KEY` はクライアントに露出するため、公開サイトでは注意
- 本番環境ではバックエンドプロキシの使用を推奨

## パフォーマンス
- data.jsonは1000件程度まで許容
- それ以上はページネーション検討
- Fuse.jsの検索は十分高速
