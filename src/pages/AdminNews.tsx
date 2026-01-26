import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createClient } from '@/lib/supabase/client';
import { getNews, createNews, deleteNews } from '@/lib/supabase/queries';
import type { News } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { ExternalLink, Trash2, Upload, LogOut, List, Newspaper, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils/format';

export default function AdminNewsPage() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newsToDelete, setNewsToDelete] = useState<News | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // フォーム状態
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    quote: '',
    source_name: '',
    published_at: '',
  });

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const data = await getNews();
      setNews(data);
    } catch (error) {
      toast.error('データの取得に失敗しました: ' + (error instanceof Error ? error.message : '不明なエラー'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.url || !formData.source_name || !formData.published_at) {
      toast.error('必須項目を入力してください');
      return;
    }

    try {
      setIsSubmitting(true);
      await createNews({
        title: formData.title,
        url: formData.url,
        quote: formData.quote || null,
        source_name: formData.source_name,
        published_at: formData.published_at,
      });
      toast.success('ニュースを登録しました');
      setFormData({ title: '', url: '', quote: '', source_name: '', published_at: '' });
      fetchNews();
    } catch (error) {
      toast.error('登録に失敗しました: ' + (error instanceof Error ? error.message : '不明なエラー'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (item: News) => {
    setNewsToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!newsToDelete) return;

    try {
      await deleteNews(newsToDelete.id);
      toast.success('ニュースを削除しました');
      fetchNews();
    } catch (error) {
      toast.error('削除に失敗しました: ' + (error instanceof Error ? error.message : '不明なエラー'));
    } finally {
      setDeleteDialogOpen(false);
      setNewsToDelete(null);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">管理画面</h1>
        <p className="text-gray-600">ニュース管理</p>
      </div>

      <nav className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/import">
            <Button variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              CSVアップロード
            </Button>
          </Link>
          <Link to="/admin/mares">
            <Button variant="outline" size="sm">
              <List className="mr-2 h-4 w-4" />
              牝馬管理
            </Button>
          </Link>
          <Link to="/admin/news">
            <Button variant="default" size="sm">
              <Newspaper className="mr-2 h-4 w-4" />
              ニュース管理
            </Button>
          </Link>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          ログアウト
        </Button>
      </nav>

      {/* ニュース登録フォーム */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            ニュース登録
          </CardTitle>
          <CardDescription>ドウデュース産駒に関するニュースを登録します</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">タイトル *</Label>
                <Input
                  id="title"
                  placeholder="記事のタイトル"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">URL *</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://..."
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="source_name">出典元 *</Label>
                <Input
                  id="source_name"
                  placeholder="例: netkeiba.com"
                  value={formData.source_name}
                  onChange={(e) => setFormData({ ...formData, source_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="published_at">記事公開日 *</Label>
                <Input
                  id="published_at"
                  type="date"
                  value={formData.published_at}
                  onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quote">引用文（任意・50文字程度）</Label>
              <Textarea
                id="quote"
                placeholder="記事から引用する一文（著作権に配慮し、短い引用に留めてください）"
                value={formData.quote}
                onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                rows={2}
              />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '登録中...' : 'ニュースを登録'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ニュース一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>登録済ニュース一覧</CardTitle>
          <CardDescription>登録されているニュースの一覧です</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex justify-end">
            <Button onClick={fetchNews} variant="outline">
              更新
            </Button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-gray-500">読み込み中...</div>
          ) : news.length === 0 ? (
            <div className="py-8 text-center text-gray-500">登録されているニュースはありません</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>公開日</TableHead>
                    <TableHead>タイトル</TableHead>
                    <TableHead>出典</TableHead>
                    <TableHead>引用</TableHead>
                    <TableHead className="text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {news.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="whitespace-nowrap">{formatDate(item.published_at)}</TableCell>
                      <TableCell className="max-w-xs">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:underline"
                        >
                          <span className="line-clamp-2">{item.title}</span>
                          <ExternalLink className="ml-1 h-3 w-3 flex-shrink-0" />
                        </a>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{item.source_name}</TableCell>
                      <TableCell className="max-w-xs">
                        <span className="line-clamp-2 text-sm text-gray-600">{item.quote || '-'}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(item)}
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

          <div className="mt-4 text-sm text-gray-600">全{news.length}件</div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ニュースの削除</AlertDialogTitle>
            <AlertDialogDescription>
              このニュースを削除しますか？
              <br />
              この操作は取り消せません。
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
    </div>
  );
}
