import { AccountAccessLevel } from '@/generated/prisma/enums';
import type { ImportedAccountRow } from '@/types/accounts';

// Reads the "Accounts and Secrets" sheet pasted as a Markdown table (from Google Docs) or as
// tab-separated rows (from Sheets). Columns are matched by header name, so order does not matter:
//   | Tool | What we use it for | Link | Login email | Access level |

type Column = 'name' | 'purpose' | 'url' | 'username' | 'access';

export interface ParsedAccountTable {
  rows: ImportedAccountRow[];
  skipped: { lineNumber: number; text: string }[];
}

const HEADER_PATTERNS: [Column, RegExp][] = [
  ['purpose', /use|purpose|descr/i],
  ['url', /link|url|website/i],
  ['username', /login|email|user/i],
  ['access', /access|level|role/i],
  ['name', /tool|name|service|account/i],
];
const SEPARATOR_ROW = /^\|?\s*:?-{3,}/;
const MARKDOWN_ESCAPE = /\\([\\`*_{}[\]()#+\-.!:|])/g;
const MARKDOWN_LINK = /\[([^\]]*)\]\([^)]*\)/g;
const BARE_DOMAIN = /^[\w-]+(\.[\w-]+)+(\/\S*)?$/;
const TWO_FACTOR = /2fa|two[- ]factor/i;

function cleanCell(cell: string): string {
  return cell
    .replace(MARKDOWN_LINK, '$1')
    .replace(MARKDOWN_ESCAPE, '$1')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitRow(line: string): string[] {
  if (line.includes('\t')) {
    return line.split('\t').map(cleanCell);
  }
  return line
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map(cleanCell);
}

function mapHeader(cells: string[]): Map<Column, number> | null {
  const columns = new Map<Column, number>();
  cells.forEach((cell, index) => {
    const match = HEADER_PATTERNS.find(
      ([column, pattern]) => !columns.has(column) && pattern.test(cell),
    );
    if (match) {
      columns.set(match[0], index);
    }
  });
  return columns.has('name') ? columns : null;
}

function toUrl(value: string): string | null {
  if (!value) {
    return null;
  }
  const candidate = BARE_DOMAIN.test(value) ? `https://${value}` : value;
  return URL.canParse(candidate) ? candidate : null;
}

function toAccessLevel(value: string): AccountAccessLevel | null {
  const lower = value.toLowerCase();
  if (lower.includes('master') || lower.includes('owner')) {
    return AccountAccessLevel.MASTER;
  }
  if (lower.includes('admin')) {
    return AccountAccessLevel.ADMIN;
  }
  return lower.includes('user') || lower.includes('member') ? AccountAccessLevel.USER : null;
}

function toRow(cells: string[], columns: Map<Column, number>): ImportedAccountRow {
  const cell = (column: Column) => {
    const index = columns.get(column);
    return index === undefined ? '' : (cells[index] ?? '');
  };
  const access = cell('access');
  return {
    name: cell('name'),
    purpose: cell('purpose') || null,
    url: toUrl(cell('url')),
    username: cell('username') || null,
    accessLevel: toAccessLevel(access),
    twoFactor: TWO_FACTOR.test(access) ? 'Enabled' : null,
  };
}

export function parseAccountTable(text: string): ParsedAccountTable {
  const result: ParsedAccountTable = { rows: [], skipped: [] };
  let columns: Map<Column, number> | null = null;

  text.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line || SEPARATOR_ROW.test(line) || line.startsWith('#')) {
      return;
    }
    const cells = splitRow(line);
    if (!columns) {
      columns = mapHeader(cells);
      if (!columns) {
        result.skipped.push({ lineNumber: index + 1, text: line });
      }
      return;
    }
    const row = toRow(cells, columns);
    if (row.name) {
      result.rows.push(row);
    } else {
      result.skipped.push({ lineNumber: index + 1, text: line });
    }
  });

  return result;
}
