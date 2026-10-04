// Database Types
export interface Mare {
  id: string;
  netkeiba_id: string;
  name: string;
  birth_year: number | null;
  sire_name: string | null;
  netkeiba_url: string | null;
  total_prize: number | null;
  best_win_class: string | null;
  created_at: string;
}

export interface CoverRecord {
  id: string;
  stallion_name: string;
  mare_id: string;
  season_year: number;
  cover_date: string | null;
  expected_foaling_date: string | null;
  offsprings_started: number | null;
  representative_offspring_name: string | null;
  representative_offspring_url: string | null;
  created_at: string;
}

export interface MareWithCoverRecord extends CoverRecord {
  mares: Mare;
}

// CSV Types
export interface CSVRow {
  season_year: string;
  netkeiba_id: string;
  mare_name: string;
  mare_birth_year: string;
  mare_sire_name: string;
  cover_date: string;
  expected_foaling_date: string;
  total_prize: string;
  best_win_class: string;
  offsprings_started: string;
  representative_offspring_name: string;
  representative_offspring_url: string;
  mare_netkeiba_url: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface UploadResult {
  success: boolean;
  totalRows: number;
  successRows: number;
  errorRows: number;
  errors: Array<{ row: number; message: string }>;
}

// Filter & Sort Types
export interface MareFilters {
  mareName?: string;
  sireName?: string;
  minPrize?: number;
  maxPrize?: number;
}

export type SortField = 'cover_date' | 'name' | 'total_prize' | 'birth_year';
export type SortOrder = 'asc' | 'desc';

// 産駒（offspringテーブル）
// 戦績・勝数・賞金・主な勝鞍・厩舎などは将来この型とテーブルに列を追加する
export type OffspringSex = '牡' | '牝' | 'セ';

export interface Offspring {
  id: string;
  netkeiba_id: string;
  name: string;
  birth_year: number | null;
  birth_date: string | null;
  sex: OffspringSex | null;
  mother_id: string | null;
  mother_netkeiba_id: string | null;
  mother_name: string | null;
  maternal_grandsire: string | null;
  breeder: string | null;
  owner: string | null;
  netkeiba_url: string | null;
  created_at: string;
  updated_at: string;
}

// 産駒CSV（scripts/offspring/scrape_offspring.py の出力）
export interface OffspringCSVRow {
  netkeiba_id: string;
  name: string;
  sex: string;
  birth_year: string;
  birth_date: string;
  mother_netkeiba_id: string;
  mother_name: string;
  maternal_grandsire: string;
  breeder: string;
  owner: string;
  netkeiba_url: string;
}
