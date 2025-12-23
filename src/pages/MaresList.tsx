import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getMaresByYear } from '@/lib/supabase/queries';
import type { MareWithCoverRecord, MareFilters, SortField, SortOrder } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { formatDate, formatPrize, formatNumber } from '@/lib/utils/format';

const YEARS = [2023, 2024, 2025];

export default function MaresListPage() {
  const { year } = useParams<{ year: string }>();
  const navigate = useNavigate();
  const currentYear = year ? parseInt(year) : 2025;

  const [mares, setMares] = useState<MareWithCoverRecord[]>([]);
  const [filteredMares, setFilteredMares] = useState<MareWithCoverRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MareFilters>({});
  const [sortField, setSortField] = useState<SortField>('cover_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    async function fetchMares() {
      try {
        setLoading(true);
        setError(null);
        const data = await getMaresByYear(currentYear);
        setMares(data);
        setFilteredMares(data);
      } catch (err) {
        console.error('Error fetching mares:', err);
        setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    }

    fetchMares();
  }, [currentYear]);

  useEffect(() => {
    let result = [...mares];

    if (filters.mareName) {
      result = result.filter((mare) =>
        mare.mares.name.toLowerCase().includes(filters.mareName!.toLowerCase())
      );
    }

    if (filters.sireName) {
      result = result.filter(
        (mare) =>
          mare.mares.sire_name &&
          mare.mares.sire_name.toLowerCase().includes(filters.sireName!.toLowerCase())
      );
    }

    result.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

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
      } else {
        aValue = '';
        bValue = '';
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredMares(result);
  }, [mares, filters, sortField, sortOrder]);

  const handleSortChange = (value: string) => {
    const [field, order] = value.split('-') as [SortField, SortOrder];
    setSortField(field);
    setSortOrder(order);
  };

  const handleYearChange = (selectedYear: number) => {
    navigate(`/mares/${selectedYear}`);
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">交配牝馬一覧</h1>
        <p className="text-gray-600">ドウデュースが交配した牝馬の情報を年別に閲覧できます</p>
      </div>

      <div className="mb-6">
        <div className="flex gap-2">
          {YEARS.map((y) => (
            <Button
              key={y}
              variant={y === currentYear ? 'default' : 'outline'}
              onClick={() => handleYearChange(y)}
              className="flex-1 md:flex-none"
            >
              {y}年
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!loading && !error && (
        <>
          <div className="mb-6 space-y-4 rounded-lg border bg-white p-4 shadow-sm">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="mareName">牝馬名で検索</Label>
                <Input
                  id="mareName"
                  placeholder="例: アール"
                  value={filters.mareName || ''}
                  onChange={(e) => setFilters({ ...filters, mareName: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="sireName">父馬名で検索</Label>
                <Input
                  id="sireName"
                  placeholder="例: キングカメハメハ"
                  value={filters.sireName || ''}
                  onChange={(e) => setFilters({ ...filters, sireName: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="sort">並び替え</Label>
                <Select value={`${sortField}-${sortOrder}`} onValueChange={handleSortChange}>
                  <SelectTrigger id="sort">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cover_date-desc">種付け日（新しい順）</SelectItem>
                    <SelectItem value="cover_date-asc">種付け日（古い順）</SelectItem>
                    <SelectItem value="name-asc">牝馬名（あいうえお順）</SelectItem>
                    <SelectItem value="name-desc">牝馬名（逆順）</SelectItem>
                    <SelectItem value="total_prize-desc">獲得賞金（高い順）</SelectItem>
                    <SelectItem value="total_prize-asc">獲得賞金（低い順）</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="mb-4 text-sm text-gray-600">{filteredMares.length}件の牝馬が見つかりました</div>

          {/* PC版テーブル */}
          <div className="hidden overflow-x-auto rounded-lg border bg-white shadow-sm md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">牝馬名</TableHead>
                  <TableHead className="w-[80px]">生年</TableHead>
                  <TableHead className="w-[150px]">父</TableHead>
                  <TableHead className="w-[120px]">種付け日</TableHead>
                  <TableHead className="w-[120px]">生産予定日</TableHead>
                  <TableHead className="w-[120px] text-right">獲得賞金</TableHead>
                  <TableHead className="w-[120px]">勝鞍クラス</TableHead>
                  <TableHead className="w-[100px] text-center">既出走産駒</TableHead>
                  <TableHead className="w-[180px]">代表産駒</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMares.map((mare) => (
                  <TableRow key={mare.id}>
                    <TableCell className="font-medium">
                      {mare.mares.netkeiba_url ? (
                        <a
                          href={mare.mares.netkeiba_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:underline"
                        >
                          {mare.mares.name}
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      ) : (
                        mare.mares.name
                      )}
                    </TableCell>
                    <TableCell>{mare.mares.birth_year || '-'}</TableCell>
                    <TableCell>{mare.mares.sire_name || '-'}</TableCell>
                    <TableCell>{formatDate(mare.cover_date)}</TableCell>
                    <TableCell>{formatDate(mare.expected_foaling_date)}</TableCell>
                    <TableCell className="text-right">{formatPrize(mare.mares.total_prize)}</TableCell>
                    <TableCell>{mare.mares.best_win_class || '-'}</TableCell>
                    <TableCell className="text-center">{formatNumber(mare.offsprings_started)}</TableCell>
                    <TableCell>
                      {mare.representative_offspring_name ? (
                        mare.representative_offspring_url ? (
                          <a
                            href={mare.representative_offspring_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 hover:underline"
                          >
                            {mare.representative_offspring_name}
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        ) : (
                          mare.representative_offspring_name
                        )
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* スマホ版カード */}
          <div className="space-y-4 md:hidden">
            {filteredMares.map((mare) => (
              <Card key={mare.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {mare.mares.netkeiba_url ? (
                      <a
                        href={mare.mares.netkeiba_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:underline"
                      >
                        {mare.mares.name}
                        <ExternalLink className="ml-1 h-4 w-4" />
                      </a>
                    ) : (
                      mare.mares.name
                    )}
                  </CardTitle>
                  <CardDescription>
                    父: {mare.mares.sire_name || '-'} / 生年: {mare.mares.birth_year || '-'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="font-semibold text-gray-700">種付け日:</dt>
                      <dd className="text-gray-900">{formatDate(mare.cover_date)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-semibold text-gray-700">生産予定日:</dt>
                      <dd className="text-gray-900">{formatDate(mare.expected_foaling_date)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-semibold text-gray-700">獲得賞金:</dt>
                      <dd className="text-gray-900">{formatPrize(mare.mares.total_prize)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-semibold text-gray-700">勝鞍クラス:</dt>
                      <dd className="text-gray-900">{mare.mares.best_win_class || '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-semibold text-gray-700">既出走産駒:</dt>
                      <dd className="text-gray-900">{formatNumber(mare.offsprings_started)}頭</dd>
                    </div>
                    {mare.representative_offspring_name && (
                      <div className="flex justify-between">
                        <dt className="font-semibold text-gray-700">代表産駒:</dt>
                        <dd className="text-gray-900">
                          {mare.representative_offspring_url ? (
                            <a
                              href={mare.representative_offspring_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-blue-600 hover:underline"
                            >
                              {mare.representative_offspring_name}
                              <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                          ) : (
                            mare.representative_offspring_name
                          )}
                        </dd>
                      </div>
                    )}
                  </dl>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </div>
      )}
    </div>
  );
}