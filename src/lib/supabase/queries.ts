import { createClient } from './client';
import type { MareWithCoverRecord, Mare, CoverRecord, Offspring } from '@/lib/types';

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

// 交配記録が登録されている年度（新しい順）
export async function getCoverSeasonYears(): Promise<number[]> {
  const supabase = createClient();

  const { data, error } = await supabase.from('cover_records').select('season_year');

  if (error) {
    console.error('Error fetching season years:', error);
    throw error;
  }

  const years = new Set((data || []).map((row: { season_year: number }) => row.season_year));
  return [...years].sort((a, b) => b - a);
}

export async function getOffspring(): Promise<Offspring[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('offspring')
    .select('*')
    .order('birth_year', { ascending: false, nullsFirst: false })
    .order('birth_date', { ascending: true, nullsFirst: false })
    .order('name');

  if (error) {
    console.error('Error fetching offspring:', error);
    throw error;
  }

  return data || [];
}

// 母のnetkeiba IDごとの産駒頭数（繁殖牝馬一覧からのリンク用）
export async function getOffspringCountsByMother(): Promise<Map<string, number>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('offspring')
    .select('mother_netkeiba_id')
    .not('mother_netkeiba_id', 'is', null);

  if (error) {
    console.error('Error fetching offspring counts:', error);
    throw error;
  }

  const counts = new Map<string, number>();
  (data || []).forEach((row: { mother_netkeiba_id: string }) => {
    counts.set(row.mother_netkeiba_id, (counts.get(row.mother_netkeiba_id) || 0) + 1);
  });
  return counts;
}

// 産駒CSVを1トランザクションで取り込む（1件でもエラーがあれば全件ロールバック）
export async function importOffspring(
  rows: Record<string, string>[]
): Promise<{ inserted_count: number; updated_count: number }> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('import_offspring', { rows });

  if (error) {
    console.error('Error importing offspring:', error);
    throw error;
  }

  const result = Array.isArray(data) ? data[0] : data;
  return result || { inserted_count: 0, updated_count: 0 };
}
