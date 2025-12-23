'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllMares, deleteMare } from '@/lib/supabase/queries';
import type { Mare } from '@/lib/types';
import { Search, ExternalLink, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function AdminMaresTable() {
  const [mares, setMares] = useState<Mare[]>([]);
  const [filteredMares, setFilteredMares] = useState<Mare[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mareToDelete, setMareToDelete] = useState<Mare | null>(null);

  useEffect(() => {
    fetchMares();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      setFilteredMares(
        mares.filter((mare) => mare.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    } else {
      setFilteredMares(mares);
    }
  }, [searchQuery, mares]);

  const fetchMares = async () => {
    try {
      setLoading(true);
      const data = await getAllMares();
      setMares(data);
      setFilteredMares(data);
    } catch (error: any) {
      toast.error('データの取得に失敗しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (mare: Mare) => {
    setMareToDelete(mare);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!mareToDelete) return;

    try {
      await deleteMare(mareToDelete.id);
      toast.success(`${mareToDelete.name}を削除しました`);
      fetchMares();
    } catch (error: any) {
      toast.error('削除に失敗しました: ' + error.message);
    } finally {
      setDeleteDialogOpen(false);
      setMareToDelete(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>登録済牝馬一覧</CardTitle>
          <CardDescription>データベースに登録されている牝馬の一覧です</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="牝馬名で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={fetchMares} variant="outline">
              更新
            </Button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-gray-500">読み込み中...</div>
          ) : filteredMares.length === 0 ? (
            <div className="py-8 text-center text-gray-500">該当するデータがありません</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>牝馬名</TableHead>
                    <TableHead>netkeiba ID</TableHead>
                    <TableHead>生年</TableHead>
                    <TableHead>父</TableHead>
                    <TableHead className="text-right">獲得賞金</TableHead>
                    <TableHead>勝鞍クラス</TableHead>
                    <TableHead className="text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMares.map((mare) => (
                    <TableRow key={mare.id}>
                      <TableCell className="font-medium">
                        {mare.netkeiba_url ? (
                          <a
                            href={mare.netkeiba_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 hover:underline"
                          >
                            {mare.name}
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        ) : (
                          mare.name
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{mare.netkeiba_id}</TableCell>
                      <TableCell>{mare.birth_year || '-'}</TableCell>
                      <TableCell>{mare.sire_name || '-'}</TableCell>
                      <TableCell className="text-right">
                        {mare.total_prize ? `${mare.total_prize.toLocaleString()}万円` : '-'}
                      </TableCell>
                      <TableCell>{mare.best_win_class || '-'}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(mare)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-4 text-sm text-gray-600">全{filteredMares.length}件</div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>牝馬の削除</AlertDialogTitle>
            <AlertDialogDescription>
              {mareToDelete?.name}を削除しますか？
              <br />
              この操作は取り消せません。関連する交配記録も全て削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}