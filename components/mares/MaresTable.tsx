'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { MareWithCoverRecord } from '@/lib/types';
import { formatDate, formatPrize, formatNumber } from '@/lib/utils/format';
import { ExternalLink } from 'lucide-react';

interface MaresTableProps {
  mares: MareWithCoverRecord[];
}

export function MaresTable({ mares }: MaresTableProps) {
  if (mares.length === 0) {
    return (
      <div className="hidden rounded-lg border bg-white p-8 text-center md:block">
        <p className="text-gray-500">該当するデータがありません</p>
      </div>
    );
  }

  return (
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
          {mares.map((mare) => (
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
  );
}