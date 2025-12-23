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