# AI Paper Database Project Guidelines
## Project Overview
- **目的**: 自分の読んだ論文を管理・公開するための個人的なデータベースサイト。
- **参考サイト**: AIDB (https://ai-data-base.com/) のようなUI/UXを目指す。
- **デプロイ先**: GitHub Pages (静的ホスティング)。
## Tech Stack
- **Framework**: React + Vite (TypeScript)
- **Styling**: Tailwind CSS (モバイルレスポンシブ対応)
- **Database**: public/data.json (ローカルJSONファイルのみを使用。サーバーサイドDBは使用しない)
- **Search Engine**: Fuse.js (クライアントサイドでの全文検索・フィルタリング)
- **Icons**: Lucide React
## Architecture Rules
1. **No Backend**: サーバーサイドの処理は一切書かない。全てのデータは fetch('/data.json') で取得する。
2. **Component Design**: 
   - components フォルダに機能ごとに分割する (例: PaperCard.tsx, Sidebar.tsx, SearchBar.tsx)。
   - デザインはシンプルでモダンなカード型レイアウトを採用する。
3. **Data Management**:
   - 論文データは全て public/data.json に集約する。
   - IDは一意の文字列とする。
## Build & Run Commands
- Dev Server: npm run dev
- Build: npm run build
- Preview: npm run preview
