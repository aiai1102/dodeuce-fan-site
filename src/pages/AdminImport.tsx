import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { parseCSV, uploadCSVToDatabase } from '@/lib/csv/processor';
import type { UploadResult } from '@/lib/types';
import { AlertCircle, CheckCircle2, Upload, LogOut, List } from 'lucide-react';

export default function AdminImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);
    setProgress(10);

    try {
      const rows = await parseCSV(file);
      setProgress(30);

      const uploadResult = await uploadCSVToDatabase(rows);
      setProgress(100);
      setResult(uploadResult);
    } catch (error) {
      setResult({
        success: false,
        totalRows: 0,
        successRows: 0,
        errorRows: 0,
        errors: [{ row: 0, message: error instanceof Error ? error.message : 'アップロードエラー' }],
      });
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">管理画面</h1>
        <p className="text-gray-600">交配牝馬データの管理</p>
      </div>

      <nav className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/import">
            <Button variant="default" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              CSVアップロード
            </Button>
          </Link>
          <Link to="/admin/mares">
            <Button variant="outline" size="sm">
              <List className="mr-2 h-4 w-4" />
              管理用一覧
            </Button>
          </Link>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          ログアウト
        </Button>
      </nav>

      <Card>
        <CardHeader>
          <CardTitle>CSVアップロード</CardTitle>
          <CardDescription>交配牝馬データのCSVファイルをアップロードしてデータベースに登録します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={uploading}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:rounded-md file:border-0
                file:bg-blue-50 file:px-4
                file:py-2 file:text-sm
                file:font-semibold file:text-blue-700
                hover:file:bg-blue-100"
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                選択されたファイル: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <Button onClick={handleUpload} disabled={!file || uploading} className="w-full">
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? 'アップロード中...' : 'アップロード'}
          </Button>

          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-center text-sm text-gray-600">処理中... {progress}%</p>
            </div>
          )}

          {result && (
            <Alert variant={result.success ? 'default' : 'destructive'}>
              {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle>{result.success ? 'アップロード完了' : 'アップロードエラー'}</AlertTitle>
              <AlertDescription>
                <div className="mt-2">
                  <p className="font-semibold">
                    全{result.totalRows}件中 成功: {result.successRows}件 / エラー: {result.errorRows}件
                  </p>
                  {result.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="font-semibold">エラー詳細:</p>
                      <ul className="mt-2 max-h-40 overflow-y-auto text-sm">
                        {result.errors.slice(0, 10).map((error, i) => (
                          <li key={i} className="mt-1">
                            {error.row}行目: {error.message}
                          </li>
                        ))}
                        {result.errors.length > 10 && (
                          <li className="mt-1 font-semibold">...他{result.errors.length - 10}件のエラー</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
            <p className="mb-2 font-semibold">CSVフォーマット:</p>
            <p className="mb-1">
              season_year, netkeiba_id, mare_name, mare_birth_year, mare_sire_name, cover_date,
              expected_foaling_date, total_prize, best_win_class, offsprings_started, representative_offspring_name,
              representative_offspring_url, mare_netkeiba_url
            </p>
            <p className="mt-2 text-xs text-gray-600">※ season_year, netkeiba_id, mare_nameは必須項目です</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}