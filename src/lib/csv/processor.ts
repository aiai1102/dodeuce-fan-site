import Papa from 'papaparse';
import type { CSVRow, ValidationResult, UploadResult } from '@/lib/types';
import { upsertMare, upsertCoverRecord } from '@/lib/supabase/queries';

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

  if (row.season_year && isNaN(parseInt(row.season_year))) {
    errors.push(`${rowNumber}行目: season_yearは数値である必要があります`);
  }

  if (row.season_year) {
    const year = parseInt(row.season_year);
    if (year < 1900 || year > 2100) {
      errors.push(`${rowNumber}行目: season_yearは1900〜2100の範囲である必要があります`);
    }
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

      const mare = await upsertMare({
        netkeiba_id: row.netkeiba_id,
        name: row.mare_name,
        birth_year: row.mare_birth_year ? parseInt(row.mare_birth_year) : null,
        sire_name: row.mare_sire_name || null,
        netkeiba_url: row.mare_netkeiba_url || null,
        total_prize: row.total_prize ? parseInt(row.total_prize) : null,
        best_win_class: row.best_win_class || null,
      });

      await upsertCoverRecord({
        stallion_name: 'ドウデュース',
        mare_id: mare.id,
        season_year: parseInt(row.season_year),
        cover_date: row.cover_date || null,
        expected_foaling_date: row.expected_foaling_date || null,
        offsprings_started: row.offsprings_started ? parseInt(row.offsprings_started) : null,
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