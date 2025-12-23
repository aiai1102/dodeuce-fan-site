import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="mb-16 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900 sm:text-5xl">
          種牡馬 ドウデュース 応援サイト
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600">
          2022年 皐月賞・日本ダービー・有馬記念を制した三冠馬ドウデュース。
          <br />
          種牡馬として新たなスタートを切った彼の交配牝馬情報をまとめています。
        </p>
        <Link to="/mares/2025">
          <Button size="lg" className="bg-blue-700 hover:bg-blue-800">
            交配牝馬一覧を見る（2025年）
          </Button>
        </Link>
      </section>

      <section className="mb-16">
        <Card>
          <CardHeader>
            <CardTitle>ドウデュースについて</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700">
            <p>
              <strong>父:</strong> ハーツクライ <strong>母:</strong> ダンスディレクター <strong>母父:</strong> サンデーサイレンス
            </p>
            <p>
              2022年、皐月賞・日本ダービー・有馬記念を制し、無敗の三冠馬として競馬ファンの記憶に残る活躍を見せました。
              引退後は種牡馬として新たなキャリアをスタートし、その産駒たちの活躍が期待されています。
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="mb-16">
        <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">サイトの機能</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>交配牝馬一覧</CardTitle>
              <CardDescription>年別表示・検索・ソート機能</CardDescription>
            </CardHeader>
            <CardContent className="text-gray-700">
              <p>2023年〜2025年の交配牝馬情報を年別に閲覧できます。</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>詳細情報</CardTitle>
              <CardDescription>netkeibaへのリンク</CardDescription>
            </CardHeader>
            <CardContent className="text-gray-700">
              <p>各牝馬の名前をクリックすると、netkeibaの詳細ページへ遷移します。</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>レスポンシブ対応</CardTitle>
              <CardDescription>PC・スマホ両対応</CardDescription>
            </CardHeader>
            <CardContent className="text-gray-700">
              <p>PCではテーブル形式、スマートフォンではカード形式で表示されます。</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">今後の予定</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="text-purple-700">Phase 2</CardTitle>
              <CardDescription>牝馬詳細ページ・産駒データベース</CardDescription>
            </CardHeader>
            <CardContent className="text-gray-700">
              <ul className="list-inside list-disc space-y-2">
                <li>牝馬ごとの詳細ページ</li>
                <li>産駒データベース</li>
                <li>レース結果リンク</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="text-purple-700">Phase 3</CardTitle>
              <CardDescription>コミュニティ機能</CardDescription>
            </CardHeader>
            <CardContent className="text-gray-700">
              <ul className="list-inside list-disc space-y-2">
                <li>写真投稿機能</li>
                <li>応援掲示板</li>
                <li>ユーザーコメント機能</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}