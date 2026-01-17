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
import {
  enrichPapers,
  applyEnrichment,
  getEnrichmentSummary,
  type EnrichmentResult,
} from '../src/services/paperApi.js';
import type { Paper } from '../src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../public/data.json');
const ENV_FILE = path.join(__dirname, '../.env');

// Load environment variables
function loadEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  try {
    if (fs.existsSync(ENV_FILE)) {
      const content = fs.readFileSync(ENV_FILE, 'utf-8');
      for (const line of content.split('\n')) {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
          env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
        }
      }
    }
  } catch {
    // Ignore errors
  }
  return env;
}

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

/**
 * Render a progress bar
 */
function renderProgressBar(current: number, total: number, width: number = 30): string {
  const percent = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `[${bar}] ${percent}% (${current}/${total})`;
}

/**
 * Clear current line and move cursor to start
 */
function clearLine(): void {
  process.stdout.write('\r\x1b[K');
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
  --check         重複チェックのみ実行
  --enrich        メタデータを外部APIから取得（Semantic Scholar, OpenAlex）
  --tags <t1,t2>  追加する論文にタグを付与
  --status <s>    ステータスを指定 (to-read, reading, read, posted)

Examples:
  npm run add-papers research.md
  npm run add-papers --enrich research.md
  npm run add-papers --check research.md
  npm run add-papers --tags "LLM,Transformer" --enrich research.md

Environment:
  OPENALEX_EMAIL  OpenAlex APIの連絡先メール（.envファイルに設定）
`);
    process.exit(0);
  }

  // Parse arguments
  let checkOnly = false;
  let enrich = false;
  let tags: string[] = [];
  let status: 'to-read' | 'reading' | 'read' | 'posted' = 'to-read';
  let filepath = '';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--check') {
      checkOnly = true;
    } else if (arg === '--enrich') {
      enrich = true;
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

  // Convert to Paper type
  let newPapers: Paper[] = report.newPapers.map((extracted, index) => {
    const paper = toPaper(extracted, { status, tags });
    // Generate sequential ID if DOI/arXiv not available
    if (!extracted.doi && !extracted.arxivId) {
      const baseId = parseInt(generateId(existingPapers), 10);
      paper.id = String(baseId + index);
    }
    return paper;
  });

  // Enrich with metadata if requested
  let enrichmentResults: Map<string, EnrichmentResult> | undefined;

  if (enrich) {
    const env = loadEnv();
    const email = env.OPENALEX_EMAIL || process.env.OPENALEX_EMAIL;

    console.log('\n🔍 メタデータ取得中...');

    if (email) {
      console.log(`   OpenAlex連絡先: ${email}`);
    } else {
      console.log('   ⚠️  OPENALEX_EMAILが設定されていません（.envファイルで設定推奨）');
    }

    enrichmentResults = await enrichPapers(newPapers, {
      email,
      onProgress: (current, total) => {
        clearLine();
        process.stdout.write(`   ${renderProgressBar(current, total)}`);
      },
    });

    // Clear progress line and show results
    clearLine();

    // Apply enrichment
    newPapers = applyEnrichment(newPapers, enrichmentResults);

    // Show summary
    const summary = getEnrichmentSummary(enrichmentResults, newPapers);
    console.log(`\n📈 メタデータ取得結果:`);
    console.log(`   成功: ${summary.enriched}件 / 失敗: ${summary.failed}件`);
    console.log(`   ソース: Semantic Scholar ${summary.sources.semantic_scholar}件, OpenAlex ${summary.sources.openalex}件`);

    if (summary.averageCitations > 0) {
      console.log(`   平均被引用数: ${summary.averageCitations}件`);
    }
  }

  // Merge and save
  const allPapers = [...existingPapers, ...newPapers];
  savePapers(allPapers);

  // Final summary
  console.log(`\n✅ ${newPapers.length}件の新規論文を追加しました`);

  if (enrich && enrichmentResults) {
    const summary = getEnrichmentSummary(enrichmentResults, newPapers);
    if (summary.averageCitations > 0) {
      console.log(`   （被引用数平均: ${summary.averageCitations}件）`);
    }
  }

  console.log(`📊 合計: ${allPapers.length}件`);
}

main().catch((error) => {
  console.error('❌ エラーが発生しました:', error);
  process.exit(1);
});
