'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { MareWithCoverRecord } from '@/lib/types';
import { formatDate, formatPrize, formatNumber } from '@/lib/utils/format';
import { ExternalLink } from 'lucide-react';

interface MaresCardsProps {
  mares: MareWithCoverRecord[];
}

export function MaresCards({ mares }: MaresCardsProps) {
  if (mares.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center md:hidden">
        <p className="text-gray-500">該当するデータがありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:hidden">
      {mares.map((mare) => (
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
  );
}