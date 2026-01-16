#!/usr/bin/env npx tsx
/**
 * CLI tool to add papers from deep research markdown files
 * Usage: npm run add-papers <filepath>
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { parseResearchMarkdown, toPaper } from '../src/utils/parseResearch.js';
import { checkDuplicates, formatDuplicateReport } from '../src/utils/deduplication.js';
import type { Paper } from '../src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../public/data.json');

function loadExistingPapers(): Paper[] {
  try {
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(content) as Paper[];
  } catch (error) {
    console.error('⚠️  data.jsonの読み込みに失敗しました。新規作成します。');
    return [];
  }
}

function savePapers(papers: Paper[]): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(papers, null, 2) + '\n', 'utf-8');
}

function generateId(papers: Paper[]): string {
  const existingIds = new Set(papers.map(p => p.id));
  let maxNumericId = 0;

  for (const id of existingIds) {
    const num = parseInt(id, 10);
    if (!isNaN(num) && num > maxNumericId) {
      maxNumericId = num;
    }
  }

  return String(maxNumericId + 1);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
📚 Deep Research Paper Importer

Usage:
  npm run add-papers <filepath>     マークダウンから論文をインポート
  npm run add-papers --check <filepath>  重複チェックのみ（追加しない）
  npm run add-papers --help         このヘルプを表示

Options:
  --check      重複チェックのみ実行
  --tags <t1,t2>  追加する論文にタグを付与
  --status <s>    ステータスを指定 (to-read, reading, read, posted)

Examples:
  npm run add-papers research.md
  npm run add-papers --check research.md
  npm run add-papers --tags "LLM,Transformer" research.md
`);
    process.exit(0);
  }

  // Parse arguments
  let checkOnly = false;
  let tags: string[] = [];
  let status: 'to-read' | 'reading' | 'read' | 'posted' = 'to-read';
  let filepath = '';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--check') {
      checkOnly = true;
    } else if (arg === '--help') {
      // Re-run with no args to show help
      process.argv = process.argv.slice(0, 2);
      main();
      return;
    } else if (arg === '--tags' && args[i + 1]) {
      tags = args[i + 1].split(',').map(t => t.trim());
      i++;
    } else if (arg === '--status' && args[i + 1]) {
      const s = args[i + 1] as typeof status;
      if (['to-read', 'reading', 'read', 'posted'].includes(s)) {
        status = s;
      }
      i++;
    } else if (!arg.startsWith('--')) {
      filepath = arg;
    }
  }

  if (!filepath) {
    console.error('❌ ファイルパスを指定してください');
    process.exit(1);
  }

  // Resolve filepath
  const resolvedPath = path.isAbsolute(filepath)
    ? filepath
    : path.join(process.cwd(), filepath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ ファイルが見つかりません: ${resolvedPath}`);
    process.exit(1);
  }

  console.log(`\n📄 読み込み中: ${resolvedPath}`);

  // Read and parse markdown
  const markdown = fs.readFileSync(resolvedPath, 'utf-8');
  const extractedPapers = parseResearchMarkdown(markdown);

  if (extractedPapers.length === 0) {
    console.log('⚠️  論文情報が見つかりませんでした。');
    console.log('   MarkdownにDOI、arXiv ID、または論文タイトルが含まれていることを確認してください。');
    process.exit(0);
  }

  console.log(`📊 ${extractedPapers.length}件の論文情報を抽出しました`);

  // Load existing papers and check for duplicates
  const existingPapers = loadExistingPapers();
  const report = checkDuplicates(extractedPapers, existingPapers);

  // Show report
  console.log(formatDuplicateReport(report));

  if (checkOnly) {
    console.log('\n📋 チェックモード: 変更は保存されません');
    process.exit(0);
  }

  if (report.newPapers.length === 0) {
    console.log('\n✨ 追加する新規論文はありません');
    process.exit(0);
  }

  // Convert to Paper type and add
  const newPapers: Paper[] = report.newPapers.map((extracted, index) => {
    const paper = toPaper(extracted, { status, tags });
    // Generate sequential ID if DOI/arXiv not available
    if (!extracted.doi && !extracted.arxivId) {
      const baseId = parseInt(generateId(existingPapers), 10);
      paper.id = String(baseId + index);
    }
    return paper;
  });

  // Merge and save
  const allPapers = [...existingPapers, ...newPapers];
  savePapers(allPapers);

  console.log(`\n✅ ${newPapers.length}件の新規論文を追加しました`);
  console.log(`📊 合計: ${allPapers.length}件`);
}

main().catch((error) => {
  console.error('❌ エラーが発生しました:', error);
  process.exit(1);
});
