// 産駒CSVの検証（DBに送る前に全行を検証し、1件でもエラーがあれば取り込まない）
import type { OffspringCSVRow } from '@/lib/types';
import { parseNonNegativeInt } from './number';

export const OFFSPRING_CSV_COLUMNS: (keyof OffspringCSVRow)[] = [
  'netkeiba_id',
  'name',
  'sex',
  'birth_year',
  'birth_date',
  'mother_netkeiba_id',
  'mother_name',
  'maternal_grandsire',
  'breeder',
  'owner',
  'netkeiba_url',
];

const NETKEIBA_ID = /^[0-9a-z]{10}$/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const SEX_VALUES = ['牡', '牝', 'セ'];

export interface ValidatedOffspringRow {
  rowNumber: number;
  // DB取込関数にそのまま渡す値（空欄は空文字。DB側で既存値を保持する）
  values: OffspringCSVRow;
}

export interface OffspringValidationResult {
  rows: ValidatedOffspringRow[];
  errors: Array<{ row: number; message: string }>;
}

function isValidDate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function validateOffspringRows(
  rawRows: Partial<Record<string, string>>[],
  headers: string[]
): OffspringValidationResult {
  const errors: Array<{ row: number; message: string }> = [];
  const rows: ValidatedOffspringRow[] = [];

  const missing = OFFSPRING_CSV_COLUMNS.filter((column) => !headers.includes(column));
  if (missing.length > 0) {
    errors.push({ row: 1, message: `CSVの列が不足しています: ${missing.join(', ')}` });
    return { rows, errors };
  }

  const seen = new Map<string, number>();

  rawRows.forEach((raw, index) => {
    const rowNumber = index + 2;
    const values = Object.fromEntries(
      OFFSPRING_CSV_COLUMNS.map((column) => [column, (raw[column] ?? '').trim()])
    ) as unknown as OffspringCSVRow;
    const rowErrors: string[] = [];

    if (!NETKEIBA_ID.test(values.netkeiba_id)) {
      rowErrors.push(`netkeiba_id「${values.netkeiba_id}」は10文字の英小文字・数字である必要があります`);
    } else if (seen.has(values.netkeiba_id)) {
      rowErrors.push(`netkeiba_id ${values.netkeiba_id} が${seen.get(values.netkeiba_id)}行目と重複しています`);
    } else {
      seen.set(values.netkeiba_id, rowNumber);
    }

    if (!values.name) {
      rowErrors.push('nameが必須です');
    }

    if (values.sex && !SEX_VALUES.includes(values.sex)) {
      rowErrors.push(`sex「${values.sex}」は牡・牝・セのいずれかである必要があります`);
    }

    const birthYear = parseNonNegativeInt(values.birth_year, 'birth_year');
    if (birthYear.error !== null) {
      rowErrors.push(birthYear.error);
    } else if (birthYear.value !== null) {
      if (birthYear.value < 1900 || birthYear.value > 2100) {
        rowErrors.push('birth_yearは1900〜2100の範囲である必要があります');
      }
      // カンマ区切りなどを正規化した値をDBに渡す
      values.birth_year = String(birthYear.value);
    }

    if (values.birth_date) {
      if (!isValidDate(values.birth_date)) {
        rowErrors.push(`birth_date「${values.birth_date}」はYYYY-MM-DD形式の日付である必要があります`);
      } else if (values.birth_year && values.birth_date.slice(0, 4) !== values.birth_year) {
        rowErrors.push(`birth_year ${values.birth_year} と birth_date ${values.birth_date} が一致しません`);
      }
    }

    if (values.mother_netkeiba_id && !NETKEIBA_ID.test(values.mother_netkeiba_id)) {
      rowErrors.push(`mother_netkeiba_id「${values.mother_netkeiba_id}」は10文字の英小文字・数字である必要があります`);
    }

    if (values.netkeiba_url && !/^https:\/\//.test(values.netkeiba_url)) {
      rowErrors.push('netkeiba_urlはhttps://で始まる必要があります');
    }

    if (rowErrors.length > 0) {
      errors.push({ row: rowNumber, message: rowErrors.join(' / ') });
    } else {
      rows.push({ rowNumber, values });
    }
  });

  return { rows, errors };
}

/** 母マスタとの照合用。全角半角・空白の違いを無視して比較する */
export function normalizeHorseName(name: string | null | undefined): string {
  return (name ?? '').normalize('NFKC').replace(/\s+/g, '');
}
