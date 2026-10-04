import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getOffspring } from '@/lib/supabase/queries';
import type { Offspring } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ExternalLink, X } from 'lucide-react';
import { formatDate } from '@/lib/utils/format';

const NOT_LISTED_NOTE = '掲載がないことは、産駒がいないことや未誕生であることを意味しません。';

function motherNetkeibaUrl(netkeibaId: string): string {
  return `https://own.netkeiba.com/db/horse.html?id=${netkeibaId}`;
}

function OffspringName({ offspring, iconClassName }: { offspring: Offspring; iconClassName: string }) {
  if (!offspring.netkeiba_url) return <>{offspring.name}</>;
  return (
    <a
      href={offspring.netkeiba_url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center text-blue-600 hover:underline"
    >
      {offspring.name}
      <ExternalLink className={`ml-1 ${iconClassName}`} />
    </a>
  );
}

// 母名はこの母のドウデュース産駒一覧へ、アイコンはnetkeibaの母のページへリンクする
function MotherCell({ offspring }: { offspring: Offspring }) {
  const name = offspring.mother_name || '-';
  if (!offspring.mother_netkeiba_id) return <>{name}</>;
  return (
    <span className="inline-flex items-center gap-1">
      <Link
        to={`/offspring?mother=${encodeURIComponent(offspring.mother_netkeiba_id)}`}
        className="text-blue-600 hover:underline"
      >
        {name}
      </Link>
      <a
        href={motherNetkeibaUrl(offspring.mother_netkeiba_id)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600"
        aria-label={`${name}のnetkeibaページ`}
      >
        <ExternalLink className="h-3 w-3" />
      </a>
    </span>
  );
}

export default function OffspringListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const yearParam = searchParams.get('year');
  const motherParam = searchParams.get('mother');
  const selectedYear = yearParam && /^\d{4}$/.test(yearParam) ? Number(yearParam) : null;

  const [offspring, setOffspring] = useState<Offspring[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOffspring() {
      try {
        setLoading(true);
        setError(null);
        setOffspring(await getOffspring());
      } catch (err) {
        console.error('Error fetching offspring:', err);
        setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    }

    fetchOffspring();
  }, []);

  // 登録データから生年を集めるため、2026年・2027年…と自動で増える
  const years = useMemo(
    () =>
      [...new Set(offspring.map((o) => o.birth_year).filter((y): y is number => y !== null))].sort((a, b) => b - a),
    [offspring]
  );

  const motherName = useMemo(() => {
    if (!motherParam) return null;
    return offspring.find((o) => o.mother_netkeiba_id === motherParam)?.mother_name || motherParam;
  }, [offspring, motherParam]);

  const filteredOffspring = useMemo(
    () =>
      offspring.filter(
        (o) =>
          (selectedYear === null || o.birth_year === selectedYear) &&
          (!motherParam || o.mother_netkeiba_id === motherParam)
      ),
    [offspring, selectedYear, motherParam]
  );

  const updateParam = (key: 'year' | 'mother', value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value === null) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next);
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">産駒一覧</h1>
        <p className="text-gray-600">ドウデュース産駒の情報を生年別に閲覧できます</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>産駒データの取得に失敗しました: {error}</AlertDescription>
        </Alert>
      )}

      {!loading && !error && (
        <>
          {years.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedYear === null ? 'default' : 'outline'}
                  onClick={() => updateParam('year', null)}
                  className="flex-1 md:flex-none"
                >
                  すべて
                </Button>
                {years.map((y) => (
                  <Button
                    key={y}
                    variant={y === selectedYear ? 'default' : 'outline'}
                    onClick={() => updateParam('year', String(y))}
                    className="flex-1 md:flex-none"
                  >
                    {y}年産
                  </Button>
                ))}
              </div>
            </div>
          )}

          {motherParam && (
            <div className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border bg-white p-4 shadow-sm">
              <span className="text-gray-700">
                母: <span className="font-semibold">{motherName}</span> のドウデュース産駒を表示中
              </span>
              <Button variant="outline" size="sm" onClick={() => updateParam('mother', null)}>
                <X className="mr-1 h-4 w-4" />
                解除
              </Button>
            </div>
          )}

          {filteredOffspring.length === 0 ? (
            <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
              <p className="font-semibold text-gray-900">
                {offspring.length === 0 ? '現在、掲載している産駒はありません' : '条件に該当する産駒は掲載されていません'}
              </p>
              <p className="mt-2 text-sm text-gray-600">{NOT_LISTED_NOTE}</p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-600">{filteredOffspring.length}頭の産駒が見つかりました</div>

              {/* PC版テーブル */}
              <div className="hidden overflow-x-auto rounded-lg border bg-white shadow-sm md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">産駒名</TableHead>
                      <TableHead className="w-[60px]">性別</TableHead>
                      <TableHead className="w-[70px]">生年</TableHead>
                      <TableHead className="w-[110px]">生年月日</TableHead>
                      <TableHead className="w-[170px]">母</TableHead>
                      <TableHead className="w-[150px]">母父</TableHead>
                      <TableHead className="w-[150px]">生産者</TableHead>
                      <TableHead className="w-[150px]">馬主</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOffspring.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-medium">
                          <OffspringName offspring={o} iconClassName="h-3 w-3" />
                        </TableCell>
                        <TableCell>{o.sex || '-'}</TableCell>
                        <TableCell>{o.birth_year || '-'}</TableCell>
                        <TableCell>{formatDate(o.birth_date)}</TableCell>
                        <TableCell>
                          <MotherCell offspring={o} />
                        </TableCell>
                        <TableCell>{o.maternal_grandsire || '-'}</TableCell>
                        <TableCell>{o.breeder || '-'}</TableCell>
                        <TableCell>{o.owner || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* スマホ版カード */}
              <div className="space-y-4 md:hidden">
                {filteredOffspring.map((o) => (
                  <Card key={o.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        <OffspringName offspring={o} iconClassName="h-4 w-4" />
                      </CardTitle>
                      <CardDescription>
                        性別: {o.sex || '-'} / 生年: {o.birth_year || '-'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between gap-4">
                          <dt className="shrink-0 font-semibold text-gray-700">生年月日:</dt>
                          <dd className="text-right text-gray-900">{formatDate(o.birth_date)}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="shrink-0 font-semibold text-gray-700">母:</dt>
                          <dd className="text-right text-gray-900">
                            <MotherCell offspring={o} />
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="shrink-0 font-semibold text-gray-700">母父:</dt>
                          <dd className="text-right text-gray-900">{o.maternal_grandsire || '-'}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="shrink-0 font-semibold text-gray-700">生産者:</dt>
                          <dd className="text-right text-gray-900">{o.breeder || '-'}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="shrink-0 font-semibold text-gray-700">馬主:</dt>
                          <dd className="text-right text-gray-900">{o.owner || '-'}</dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          <p className="mt-6 text-xs text-gray-500">
            ※ 母父は母馬の父です。情報はnetkeibaの公開情報をもとに掲載しており、未掲載の項目は「-」で表示しています。
            {NOT_LISTED_NOTE}
          </p>
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
