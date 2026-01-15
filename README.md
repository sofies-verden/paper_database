# AI Paper Database

AI論文を管理・公開するための個人向けデータベースサイトです。

## 目次

1. [はじめに](#はじめに)
2. [必要な環境](#必要な環境)
3. [セットアップ手順](#セットアップ手順)
4. [開発サーバーの起動](#開発サーバーの起動)
5. [論文データの追加・編集](#論文データの追加編集)
6. [本番ビルド](#本番ビルド)
7. [GitHub Pagesへのデプロイ](#github-pagesへのデプロイ)
8. [プロジェクト構成](#プロジェクト構成)
9. [トラブルシューティング](#トラブルシューティング)

---

## はじめに

このプロジェクトは、自分が読んだAI関連の論文を整理・公開するためのWebアプリケーションです。

**主な機能:**
- 論文の一覧表示（カード形式）
- キーワード検索（タイトル、要約、著者、タグを横断検索）
- タグによるフィルタリング
- モバイル対応のレスポンシブデザイン

**使用技術:**
- React + TypeScript（UIフレームワーク）
- Vite（ビルドツール）
- Tailwind CSS（スタイリング）
- Fuse.js（あいまい検索）
- Lucide React（アイコン）

---

## 必要な環境

開発を始める前に、以下のソフトウェアをインストールしてください。

### Node.js（必須）

Node.js はJavaScriptをPC上で実行するための環境です。

1. [Node.js公式サイト](https://nodejs.org/) にアクセス
2. **LTS版**（推奨版）をダウンロード
3. インストーラーを実行し、指示に従ってインストール

インストール確認:
```bash
node --version
# v18.0.0 以上が表示されればOK

npm --version
# 9.0.0 以上が表示されればOK
```

### Git（推奨）

バージョン管理とGitHub Pagesへのデプロイに使用します。

- Windows: [Git for Windows](https://gitforwindows.org/)
- Mac: `brew install git` または Xcode Command Line Tools
- Linux: `sudo apt install git`

---

## セットアップ手順

### 1. リポジトリをクローン

```bash
git clone https://github.com/あなたのユーザー名/paper_database.git
cd paper_database
```

または、ZIPファイルをダウンロードして展開してもOKです。

### 2. 依存パッケージをインストール

プロジェクトフォルダ内で以下のコマンドを実行します:

```bash
npm install
```

このコマンドは `package.json` に記載されたライブラリを自動でダウンロードします。
初回は数分かかることがあります。

**成功すると:**
- `node_modules` フォルダが作成されます
- 「added XXX packages」のようなメッセージが表示されます

---

## 開発サーバーの起動

以下のコマンドで開発用サーバーを起動します:

```bash
npm run dev
```

**成功すると:**
```
VITE v6.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

ブラウザで `http://localhost:5173/` を開くと、サイトが表示されます。

**便利な機能:**
- ファイルを保存すると、ブラウザが自動でリロードされます（ホットリロード）
- エラーがあると画面上に表示されます

**サーバーを停止するには:**
ターミナルで `Ctrl + C` を押します。

---

## 論文データの追加・編集

論文データは `public/data.json` ファイルで管理しています。

### データ構造

```json
[
  {
    "id": "一意のID（重複不可）",
    "title": "論文タイトル",
    "summary": "論文の要約・説明文",
    "tags": ["タグ1", "タグ2", "タグ3"],
    "publishedDate": "YYYY-MM-DD形式の日付",
    "url": "論文へのリンク（arXivなど）",
    "authors": ["著者1", "著者2"]
  }
]
```

### 新しい論文を追加する手順

1. `public/data.json` をテキストエディタで開く

2. 配列の最後に新しいオブジェクトを追加:

```json
[
  {
    "id": "1",
    "title": "既存の論文...",
    ...
  },
  {
    "id": "7",
    "title": "新しく追加する論文のタイトル",
    "summary": "この論文では〇〇について述べています。主な貢献は...",
    "tags": ["Deep Learning", "Computer Vision"],
    "publishedDate": "2024-01-15",
    "url": "https://arxiv.org/abs/XXXX.XXXXX",
    "authors": ["山田太郎", "John Smith"]
  }
]
```

3. ファイルを保存

4. 開発サーバーが起動していれば、自動でブラウザに反映されます

### 注意点

- **IDは必ず一意にする**: 他の論文と重複しないようにしてください
- **JSON形式を正しく**: カンマの有無、引用符などに注意
- **日付形式**: `YYYY-MM-DD`（例: `2024-01-15`）

### JSONの文法エラーを防ぐコツ

- 最後の要素の後にはカンマを付けない
- 文字列は必ずダブルクォート `"` で囲む
- [JSONLint](https://jsonlint.com/) などのツールで検証できます

---

## 本番ビルド

GitHub Pagesなどにデプロイする前に、最適化されたファイルを生成します。

```bash
npm run build
```

**成功すると:**
- `dist` フォルダが作成されます
- HTML、CSS、JavaScriptが圧縮・最適化されます

### ビルド結果をローカルで確認

```bash
npm run preview
```

`http://localhost:4173/` でビルド後のサイトを確認できます。

---

## GitHub Pagesへのデプロイ

### 方法1: 手動デプロイ

1. ビルドを実行:
   ```bash
   npm run build
   ```

2. `dist` フォルダの中身をGitHubリポジトリの `gh-pages` ブランチにプッシュ

### 方法2: GitHub Actionsで自動デプロイ（推奨）

`.github/workflows/deploy.yml` を作成:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### GitHub Pages設定

1. GitHubリポジトリの **Settings** → **Pages** を開く
2. **Source** で `gh-pages` ブランチを選択
3. 数分後、`https://ユーザー名.github.io/paper_database/` でアクセス可能に

### サブディレクトリでの運用

リポジトリ名がURLのパスになるため、`vite.config.ts` で `base` を設定しています:

```typescript
export default defineConfig({
  base: '/paper_database/',
  // ...
})
```

リポジトリ名を変更した場合は、この値も合わせて変更してください。

---

## プロジェクト構成

```
paper_database/
├── public/
│   ├── data.json        # 論文データ（ここを編集）
│   └── favicon.svg      # サイトアイコン
├── src/
│   ├── components/
│   │   ├── PaperCard.tsx    # 論文カードコンポーネント
│   │   ├── SearchBar.tsx    # 検索バーコンポーネント
│   │   └── Sidebar.tsx      # サイドバーコンポーネント
│   ├── App.tsx          # メインアプリケーション
│   ├── main.tsx         # エントリーポイント
│   ├── index.css        # グローバルスタイル
│   └── types.ts         # TypeScript型定義
├── index.html           # HTMLテンプレート
├── package.json         # 依存関係とスクリプト
├── vite.config.ts       # Vite設定
├── tailwind.config.js   # Tailwind CSS設定
├── tsconfig.json        # TypeScript設定
├── CLAUDE.md            # AI向けプロジェクトガイドライン
└── REQUIREMENTS.md      # 要件定義書
```

### 各ファイルの役割

| ファイル | 説明 |
|---------|------|
| `public/data.json` | 論文データを格納。このファイルを編集して論文を追加 |
| `src/App.tsx` | アプリ全体の状態管理とレイアウト |
| `src/components/PaperCard.tsx` | 個々の論文カードの表示 |
| `src/components/SearchBar.tsx` | 検索入力フィールド |
| `src/components/Sidebar.tsx` | タグフィルター用サイドバー |

---

## トラブルシューティング

### npm install でエラーが出る

**症状:** `EACCES` や `permission denied` エラー

**解決策:**
```bash
# Macの場合
sudo chown -R $(whoami) ~/.npm

# または npx を使用
npx create-vite@latest
```

### 開発サーバーが起動しない

**症状:** `EADDRINUSE` エラー（ポートが使用中）

**解決策:**
```bash
# 別のポートで起動
npm run dev -- --port 3000
```

### ビルドでTypeScriptエラー

**症状:** `error TS2307: Cannot find module` など

**解決策:**
```bash
# node_modulesを再インストール
rm -rf node_modules
npm install
```

### GitHub Pagesで404エラー

**症状:** デプロイ後、ページが表示されない

**チェックポイント:**
1. `vite.config.ts` の `base` がリポジトリ名と一致しているか
2. GitHub Pages設定で正しいブランチが選択されているか
3. ビルドが正常に完了しているか

### data.jsonの変更が反映されない

**症状:** 論文を追加したのに表示されない

**解決策:**
1. JSONの文法エラーがないか確認（[JSONLint](https://jsonlint.com/)で検証）
2. ブラウザのキャッシュをクリア（`Ctrl + Shift + R` でハードリロード）
3. 開発サーバーを再起動

---

## よくある質問

### Q: プログラミング初心者でも使えますか？

A: はい。論文を追加するだけなら、`public/data.json` を編集するだけでOKです。JSONの基本的な書き方さえ覚えれば問題ありません。

### Q: 論文データはどこに保存されますか？

A: `public/data.json` ファイルに保存されます。データベースサーバーは使用していないため、このファイルを直接編集します。

### Q: 検索はどのように動作しますか？

A: Fuse.js というライブラリを使用したあいまい検索です。タイトル、要約、著者名、タグを横断して検索できます。完全一致でなくても、似た文字列があればヒットします。

### Q: デザインをカスタマイズしたい

A: Tailwind CSSを使用しています。各コンポーネントの `className` を編集することで、色やレイアウトを変更できます。[Tailwind CSS公式ドキュメント](https://tailwindcss.com/docs)を参照してください。

---

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
