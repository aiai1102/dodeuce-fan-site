import { createClient } from './client';
import type { MareWithCoverRecord, Mare, MareFilters, SortField, SortOrder } from '@/lib/types';

export async function getMaresByYear(year: number): Promise<MareWithCoverRecord[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('cover_records')
    .select(`
      *,
      mares (
        id,
        netkeiba_id,
        name,
        birth_year,
        sire_name,
        netkeiba_url,
        total_prize,
        best_win_class
      )
    `)
    .eq('season_year', year)
    .order('cover_date', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('Error fetching mares:', error);
    throw error;
  }

  return (data as MareWithCoverRecord[]) || [];
}

export async function getMaresByYearWithFilters(
  year: number,
  filters?: MareFilters,
  sortField: SortField = 'cover_date',
  sortOrder: SortOrder = 'desc'
): Promise<MareWithCoverRecord[]> {
  const supabase = createClient();

  let query = supabase
    .from('cover_records')
    .select(`
      *,
      mares (*)
    `)
    .eq('season_year', year);

  // フィルタ適用（クライアントサイドでフィルタリング）
  const { data, error } = await query;

  if (error) {
    console.error('Error fetching filtered mares:', error);
    throw error;
  }

  let filteredData = (data as MareWithCoverRecord[]) || [];

  // クライアントサイドフィルタリング
  if (filters?.mareName) {
    filteredData = filteredData.filter((item) =>
      item.mares.name.toLowerCase().includes(filters.mareName!.toLowerCase())
    );
  }

  if (filters?.sireName) {
    filteredData = filteredData.filter(
      (item) =>
        item.mares.sire_name &&
        item.mares.sire_name.toLowerCase().includes(filters.sireName!.toLowerCase())
    );
  }

  if (filters?.minPrize !== undefined) {
    filteredData = filteredData.filter(
      (item) => item.mares.total_prize !== null && item.mares.total_prize >= filters.minPrize!
    );
  }

  if (filters?.maxPrize !== undefined) {
    filteredData = filteredData.filter(
      (item) => item.mares.total_prize !== null && item.mares.total_prize <= filters.maxPrize!
    );
  }

  // ソート
  filteredData.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    if (sortField === 'cover_date') {
      aValue = a.cover_date || '';
      bValue = b.cover_date || '';
    } else if (sortField === 'name') {
      aValue = a.mares.name;
      bValue = b.mares.name;
    } else if (sortField === 'total_prize') {
      aValue = a.mares.total_prize || 0;
      bValue = b.mares.total_prize || 0;
    } else if (sortField === 'birth_year') {
      aValue = a.mares.birth_year || 0;
      bValue = b.mares.birth_year || 0;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return filteredData;
}

export async function getAllMares(): Promise<Mare[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('mares')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching all mares:', error);
    throw error;
  }

  return data || [];
}

export async function searchMares(query: string): Promise<Mare[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('mares')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('name');

  if (error) {
    console.error('Error searching mares:', error);
    throw error;
  }

  return data || [];
}

export async function upsertMare(mare: Partial<Mare>): Promise<Mare> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('mares')
    .upsert(
      {
        netkeiba_id: mare.netkeiba_id,
        name: mare.name,
        birth_year: mare.birth_year,
        sire_name: mare.sire_name,
        netkeiba_url: mare.netkeiba_url,
        total_prize: mare.total_prize,
        best_win_class: mare.best_win_class,
      },
      { onConflict: 'netkeiba_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('Error upserting mare:', error);
    throw error;
  }

  return data;
}

export async function upsertCoverRecord(record: Partial<CoverRecord>): Promise<CoverRecord> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('cover_records')
    .upsert(
      {
        stallion_name: record.stallion_name || 'ドウデュース',
        mare_id: record.mare_id,
        season_year: record.season_year,
        cover_date: record.cover_date,
        expected_foaling_date: record.expected_foaling_date,
        offsprings_started: record.offsprings_started,
        representative_offspring_name: record.representative_offspring_name,
        representative_offspring_url: record.representative_offspring_url,
      },
      { onConflict: 'season_year,mare_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('Error upserting cover record:', error);
    throw error;
  }

  return data;
}

export async function deleteMare(mareId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from('mares').delete().eq('id', mareId);

  if (error) {
    console.error('Error deleting mare:', error);
    throw error;
  }
}