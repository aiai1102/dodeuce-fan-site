import Papa from 'papaparse';
import type { CSVRow, ValidationResult, UploadResult } from '@/lib/types';
import { upsertMare, upsertCoverRecord } from '@/lib/supabase/queries';
import { parseNonNegativeInt, parsePrize, type IntParseResult } from './number';

// 数値項目を厳密に変換した結果（不正値は途中で切り捨てずエラーにする）
interface ParsedNumbers {
  seasonYear: number | null;
  mareBirthYear: number | null;
  totalPrize: number | null;
  offspringsStarted: number | null;
}

function parseRowNumbers(row: CSVRow): { values: ParsedNumbers; errors: string[] } {
  const errors: string[] = [];
  const pick = (result: IntParseResult): number | null => {
    if (result.error !== null) {
      errors.push(result.error);
    }
    return result.value;
  };

  return {
    values: {
      seasonYear: pick(parseNonNegativeInt(row.season_year, 'season_year')),
      mareBirthYear: pick(parseNonNegativeInt(row.mare_birth_year, 'mare_birth_year')),
      totalPrize: pick(parsePrize(row.total_prize)),
      offspringsStarted: pick(parseNonNegativeInt(row.offsprings_started, 'offsprings_started')),
    },
    errors,
  };
}

export function parseCSV(file: File): Promise<CSVRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        resolve(results.data);
      },
      error: (error) => {
        reject(new Error('CSVパースエラー: ' + error.message));
      },
    });
  });
}

export function validateCSVRow(row: CSVRow, rowNumber: number): ValidationResult {
  const errors: string[] = [];

  if (!row.season_year) {
    errors.push(`${rowNumber}行目: season_yearが必須です`);
  }
  if (!row.netkeiba_id) {
    errors.push(`${rowNumber}行目: netkeiba_idが必須です`);
  }
  if (!row.mare_name) {
    errors.push(`${rowNumber}行目: mare_nameが必須です`);
  }

  const { values, errors: numberErrors } = parseRowNumbers(row);
  numberErrors.forEach((message) => errors.push(`${rowNumber}行目: ${message}`));

  if (values.seasonYear !== null && (values.seasonYear < 1900 || values.seasonYear > 2100)) {
    errors.push(`${rowNumber}行目: season_yearは1900〜2100の範囲である必要があります`);
  }

  if (row.netkeiba_id && !/^[a-z0-9]{10}$/.test(row.netkeiba_id)) {
    errors.push(`${rowNumber}行目: netkeiba_idは10文字の英数字である必要があります`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export async function uploadCSVToDatabase(rows: CSVRow[]): Promise<UploadResult> {
  const result: UploadResult = {
    success: true,
    totalRows: rows.length,
    successRows: 0,
    errorRows: 0,
    errors: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2;

    try {
      const validation = validateCSVRow(row, rowNumber);
      if (!validation.isValid) {
        result.errorRows++;
        result.errors.push({
          row: rowNumber,
          message: validation.errors.join(', '),
        });
        continue;
      }

      const { values } = parseRowNumbers(row);

      const mare = await upsertMare({
        netkeiba_id: row.netkeiba_id,
        name: row.mare_name,
        birth_year: values.mareBirthYear,
        sire_name: row.mare_sire_name || null,
        netkeiba_url: row.mare_netkeiba_url || null,
        total_prize: values.totalPrize,
        best_win_class: row.best_win_class || null,
      });

      await upsertCoverRecord({
        stallion_name: 'ドウデュース',
        mare_id: mare.id,
        season_year: values.seasonYear,
        cover_date: row.cover_date || null,
        expected_foaling_date: row.expected_foaling_date || null,
        offsprings_started: values.offspringsStarted,
        representative_offspring_name: row.representative_offspring_name || null,
        representative_offspring_url: row.representative_offspring_url || null,
      });

      result.successRows++;
    } catch (error) {
      result.errorRows++;
      result.errors.push({
        row: rowNumber,
        message: error instanceof Error ? error.message : 'アップロードエラー',
      });
    }
  }

  if (result.errorRows > 0) {
    result.success = false;
  }

  return result;
}

// 産駒CSVを読み込む（列名の前後空白・BOMを除去）
export function parseOffspringCSV(
  file: File
): Promise<{ rows: Partial<Record<string, string>>[]; headers: string[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse<Partial<Record<string, string>>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      encoding: 'UTF-8',
      transformHeader: (header) => header.replace(/^\uFEFF/, '').trim(),
      complete: (results) => {
        resolve({ rows: results.data, headers: results.meta.fields || [] });
      },
      error: (error) => {
        reject(new Error('CSVパースエラー: ' + error.message));
      },
    });
  });
}
