import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createClient } from '@/lib/supabase/client';
import { getAllMares, importOffspring } from '@/lib/supabase/queries';
import { parseOffspringCSV } from '@/lib/csv/processor';
import {
  normalizeHorseName,
  validateOffspringRows,
  type ValidatedOffspringRow,
} from '@/lib/csv/offspringValidation';
import type { Mare } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, CheckCircle2, Upload, LogOut, List, FileSpreadsheet } from 'lucide-react';

type MotherStatus = 'linked' | 'unregistered' | 'name_mismatch' | 'no_id';

interface PreviewRow extends ValidatedOffspringRow {
  motherStatus: MotherStatus;
  registeredMotherName?: string;
  // 同名で別IDの牝馬がマスタにある（紐付けはIDで行うため誤紐付けはしない）
  sameNameOtherIds: string[];
}

interface Preview {
  rows: PreviewRow[];
  errors: Array<{ row: number; message: string }>;
  maresCheckError: string | null;
}

const MOTHER_STATUS_LABEL: Record<MotherStatus, string> = {
  linked: '登録済み',
  unregistered: '未登録（後から登録すると自動で紐付け）',
  name_mismatch: '登録済み（馬名が異なる）',
  no_id: '母IDなし（紐付けなし）',
};

function buildPreviewRows(rows: ValidatedOffspringRow[], mares: Mare[] | null): PreviewRow[] {
  const byId = new Map((mares || []).map((m) => [m.netkeiba_id, m]));
  return rows.map((row) => {
    const { mother_netkeiba_id: motherId, mother_name: motherName } = row.values;
    const mare = motherId ? byId.get(motherId) : undefined;
    let motherStatus: MotherStatus = 'no_id';
    if (motherId) {
      if (!mare) {
        motherStatus = 'unregistered';
      } else if (motherName && normalizeHorseName(mare.name) !== normalizeHorseName(motherName)) {
        motherStatus = 'name_mismatch';
      } else {
        motherStatus = 'linked';
      }
    }
    const sameNameOtherIds = motherName
      ? (mares || [])
          .filter((m) => m.netkeiba_id !== motherId && normalizeHorseName(m.name) === normalizeHorseName(motherName))
          .map((m) => m.netkeiba_id)
      : [];
    return { ...row, motherStatus, registeredMotherName: mare?.name, sameNameOtherIds };
  });
}

export default function AdminOffspringImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [checking, setChecking] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreview(null);
      setResult(null);
    }
  };

  const handleCheck = async () => {
    if (!file) return;
    setChecking(true);
    setPreview(null);
    setResult(null);

    try {
      const { rows, headers } = await parseOffspringCSV(file);
      const validation = validateOffspringRows(rows, headers);

      let mares: Mare[] | null = null;
      let maresCheckError: string | null = null;
      try {
        mares = await getAllMares();
      } catch (error) {
        maresCheckError = error instanceof Error ? error.message : '母マスタの確認に失敗しました';
      }

      setPreview({
        rows: buildPreviewRows(validation.rows, mares),
        errors: validation.errors,
        maresCheckError,
      });
    } catch (error) {
      setResult({ success: false, message: error instanceof Error ? error.message : 'CSVの読み込みに失敗しました' });
    } finally {
      setChecking(false);
    }
  };

  const handleImport = async () => {
    if (!preview || preview.errors.length > 0 || preview.rows.length === 0) return;
    setImporting(true);
    setResult(null);

    try {
      const counts = await importOffspring(preview.rows.map((row) => ({ ...row.values })));
      setResult({
        success: true,
        message: `全${preview.rows.length}件を取り込みました（新規: ${counts.inserted_count}件 / 更新: ${counts.updated_count}件）`,
      });
      setPreview(null);
    } catch (error) {
      setResult({
        success: false,
        message:
          '取り込みに失敗しました。1件も登録・更新されていません: ' +
          (error instanceof Error ? error.message : '不明なエラー'),
      });
    } finally {
      setImporting(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    navigate('/');
  };

  const warnings = preview
    ? preview.rows.filter((row) => row.motherStatus === 'name_mismatch' || row.sameNameOtherIds.length > 0)
    : [];
  const canImport = !!preview && preview.errors.length === 0 && preview.rows.length > 0 && !importing;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">管理画面</h1>
        <p className="text-gray-600">ドウデュース産駒データの管理</p>
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
              管理用一覧
            </Button>
          </Link>
          <Link to="/admin/offspring-import">
            <Button variant="default" size="sm">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              産駒CSV
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
          <CardTitle>産駒CSVの取り込み</CardTitle>
          <CardDescription>
            scripts/offspring/scrape_offspring.py で生成したCSVを確認してから取り込みます。
            同じnetkeiba IDの産駒は更新され（改名しても重複登録されません）、空欄の項目は既存の値を消しません。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={checking || importing}
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

          <Button onClick={handleCheck} disabled={!file || checking || importing} variant="outline" className="w-full">
            {checking ? '確認中...' : '内容を確認'}
          </Button>

          {result && (
            <Alert variant={result.success ? 'default' : 'destructive'}>
              {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle>{result.success ? '取り込み完了' : 'エラー'}</AlertTitle>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}

          {preview && (
            <div className="space-y-4">
              {preview.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>CSVにエラーがあるため取り込めません（{preview.errors.length}件）</AlertTitle>
                  <AlertDescription>
                    <ul className="mt-2 max-h-40 overflow-y-auto text-sm">
                      {preview.errors.map((error, i) => (
                        <li key={i} className="mt-1">
                          {error.row}行目: {error.message}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {preview.maresCheckError && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>母マスタを確認できませんでした</AlertTitle>
                  <AlertDescription>{preview.maresCheckError}</AlertDescription>
                </Alert>
              )}

              {warnings.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>母マスタの確認が必要な行があります（{warnings.length}件）</AlertTitle>
                  <AlertDescription>
                    <p className="mt-1 text-sm">
                      母との紐付けは母のnetkeiba IDで行います（馬名では紐付けません）。
                      馬名が異なる場合は、母マスタに誤ったID（サンプルデータ等）が登録されていないか確認してください。
                    </p>
                    <ul className="mt-2 max-h-40 overflow-y-auto text-sm">
                      {warnings.map((row) => (
                        <li key={row.rowNumber} className="mt-1">
                          {row.rowNumber}行目 {row.values.name}:{' '}
                          {row.motherStatus === 'name_mismatch' &&
                            `CSVの母「${row.values.mother_name}」とマスタの「${row.registeredMotherName}」（ID ${row.values.mother_netkeiba_id}）が異なります。`}
                          {row.sameNameOtherIds.length > 0 &&
                            `同名の別IDの牝馬（${row.sameNameOtherIds.join(', ')}）がマスタにあります。`}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <p className="text-sm text-gray-600">取り込み可能な行: {preview.rows.length}件</p>

              {preview.rows.length > 0 && (
                <div className="max-h-[480px] overflow-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>行</TableHead>
                        <TableHead>netkeiba ID</TableHead>
                        <TableHead>産駒名</TableHead>
                        <TableHead>性別</TableHead>
                        <TableHead>生年月日</TableHead>
                        <TableHead>母（ID）</TableHead>
                        <TableHead>母マスタ</TableHead>
                        <TableHead>母父</TableHead>
                        <TableHead>生産者</TableHead>
                        <TableHead>馬主</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.rows.map((row) => (
                        <TableRow key={row.rowNumber}>
                          <TableCell>{row.rowNumber}</TableCell>
                          <TableCell className="font-mono text-sm">{row.values.netkeiba_id}</TableCell>
                          <TableCell className="font-medium">{row.values.name}</TableCell>
                          <TableCell>{row.values.sex || '-'}</TableCell>
                          <TableCell>{row.values.birth_date || row.values.birth_year || '-'}</TableCell>
                          <TableCell>
                            {row.values.mother_name || '-'}
                            {row.values.mother_netkeiba_id && (
                              <span className="ml-1 font-mono text-xs text-gray-500">
                                ({row.values.mother_netkeiba_id})
                              </span>
                            )}
                          </TableCell>
                          <TableCell
                            className={row.motherStatus === 'name_mismatch' ? 'font-semibold text-red-600' : ''}
                          >
                            {MOTHER_STATUS_LABEL[row.motherStatus]}
                          </TableCell>
                          <TableCell>{row.values.maternal_grandsire || '-'}</TableCell>
                          <TableCell>{row.values.breeder || '-'}</TableCell>
                          <TableCell>{row.values.owner || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <Button onClick={handleImport} disabled={!canImport} className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                {importing ? '取り込み中...' : `${preview.rows.length}件を取り込む`}
              </Button>
            </div>
          )}

          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
            <p className="mb-2 font-semibold">CSVフォーマット:</p>
            <p className="mb-1">
              netkeiba_id, name, sex, birth_year, birth_date, mother_netkeiba_id, mother_name, maternal_grandsire,
              breeder, owner, netkeiba_url
            </p>
            <p className="mt-2 text-xs text-gray-600">
              ※ netkeiba_id, nameは必須項目です。1件でもエラーがある場合は取り込みません。
              maternal_grandsire（母父）は産駒の母の父です。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
