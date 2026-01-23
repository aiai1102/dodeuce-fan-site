import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Trophy, Calendar, Award } from 'lucide-react';

export default function HomePage() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <>
      {/* ヒーローセクション */}
      <section className="relative h-[600px] sm:h-[700px] overflow-hidden">
        {/* 背景画像 */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(/images/tenno-sho-2024.jpg)',
            backgroundPosition: 'center 40%'
          }}
        />

        {/* グラデーションオーバーレイ */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/80 via-purple-800/70 to-purple-900/90" />

        {/* コンテンツ */}
        <motion.div
          className="relative z-10 container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center items-center text-center"
          initial="initial"
          animate="animate"
          variants={stagger}
        >
          <motion.div
            variants={fadeInUp}
            className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-accent/90 text-accent-foreground rounded-full text-sm font-semibold shadow-lg"
          >
            <Trophy className="w-4 h-4" />
            <span>第170回 天皇賞（秋）優勝</span>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="mb-6 text-5xl sm:text-6xl md:text-7xl font-bold text-white drop-shadow-2xl"
          >
            種牡馬 ドウデュース
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="mx-auto mb-10 max-w-3xl text-xl sm:text-2xl text-white/95 drop-shadow-lg leading-relaxed"
          >
            数々の大舞台を制し、時代を代表する名馬となったドウデュース。
            <br />
            種牡馬として新たなスタートを切った彼の歩みと、
            <br />
            交配牝馬の情報を中心にまとめています。
          </motion.p>

          <motion.div variants={fadeInUp}>
            <Link to="/mares/2025">
              <Button size="lg" className="text-lg px-8 py-6 shadow-2xl hover:scale-105 transition-transform">
                交配牝馬一覧を見る（2025年）
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <div className="container mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">

      {/* ドウデュースについて */}
      <motion.section
        className="mb-16"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-3xl">ドウデュースについて</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-foreground/90">
            <div className="grid md:grid-cols-2 gap-4 p-4 bg-secondary/50 rounded-lg">
              <div>
                <strong className="text-primary">父:</strong> ハーツクライ
              </div>
              <div>
                <strong className="text-primary">母:</strong> ダストアンドダイヤモンズ
              </div>
              <div>
                <strong className="text-primary">母父:</strong> Vindication
              </div>
              <div>
                <strong className="text-primary">馬主:</strong> キーファーズ
              </div>
              <div>
                <strong className="text-primary">生産:</strong> ノーザンファーム
              </div>
              <div>
                <strong className="text-primary">毛色:</strong> 鹿毛
              </div>
            </div>
            <p className="leading-relaxed">
              2019年生まれの鹿毛の牡馬。2歳時に朝日杯フューチュリティステークスを制し、
              早くから世代の頂点候補として注目を集めました。
            </p>
            <p className="leading-relaxed">
              その後、2022年の日本ダービーを制覇。さらに有馬記念、天皇賞（秋）、
              ジャパンカップといった最高峰の舞台で勝利を重ね、
              多くの競馬ファンの記憶に深く刻まれる存在となりました。
            </p>
            <p className="leading-relaxed">
              2024年をもって現役を引退し、現在は種牡馬として新たな物語を歩み始めています。
              その血を受け継ぐ産駒たちの未来に、大きな期待が寄せられています。
            </p>
          </CardContent>
        </Card>
      </motion.section>

      {/* 主要勝鞍 */}
      <motion.section
        className="mb-16"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <h2 className="mb-8 text-center text-4xl font-bold">主要勝鞍</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            { year: '2021', race: '朝日杯フューチュリティステークス', grade: 'G1', place: '阪神' },
            { year: '2022', race: '東京優駿（日本ダービー）', grade: 'G1', place: '東京' },
            { year: '2022', race: '有馬記念', grade: 'G1', place: '中山' },
            { year: '2023', race: '金鯱賞', grade: 'G2', place: '中京' },
            { year: '2024', race: 'ジャパンカップ', grade: 'G1', place: '東京' },
            { year: '2024', race: '天皇賞（秋）', grade: 'G1', place: '東京', featured: true },
          ].map((race, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className={`h-full hover:shadow-xl transition-all ${race.featured ? 'border-accent border-2 bg-accent/5' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      race.grade === 'G1' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                    }`}>
                      {race.grade}
                    </span>
                    {race.featured && (
                      <Trophy className="w-5 h-5 text-accent" />
                    )}
                  </div>
                  <CardTitle className="text-lg">{race.race}</CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {race.year}年
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      {race.place}
                    </span>
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* サイトの機能 */}
      <motion.section
        className="mb-16"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <h2 className="mb-8 text-center text-4xl font-bold">サイトの機能</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <Card className="h-full hover:shadow-xl transition-all">
              <CardHeader>
                <CardTitle>交配牝馬一覧</CardTitle>
                <CardDescription>年別表示・検索・ソート機能</CardDescription>
              </CardHeader>
              <CardContent>
                <p>2025年からの交配牝馬情報を年別に閲覧できます。</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <Card className="h-full hover:shadow-xl transition-all">
              <CardHeader>
                <CardTitle>詳細情報</CardTitle>
                <CardDescription>netkeibaへのリンク</CardDescription>
              </CardHeader>
              <CardContent>
                <p>各牝馬の名前をクリックすると、netkeibaの詳細ページへ遷移します。</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <Card className="h-full hover:shadow-xl transition-all">
              <CardHeader>
                <CardTitle>レスポンシブ対応</CardTitle>
                <CardDescription>PC・スマホ両対応</CardDescription>
              </CardHeader>
              <CardContent>
                <p>PCではテーブル形式、スマートフォンではカード形式で表示されます。</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.section>

      {/* 今後の予定 */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <h2 className="mb-8 text-center text-4xl font-bold">今後の予定</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          >
            <Card className="border-2 border-primary/30 bg-primary/5 h-full hover:shadow-xl transition-all">
              <CardHeader>
                <CardTitle className="text-primary text-2xl">Phase 2</CardTitle>
                <CardDescription className="text-base">牝馬詳細ページ・産駒データベース</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-inside list-disc space-y-2">
                  <li>牝馬ごとの詳細ページ</li>
                  <li>産駒データベース</li>
                  <li>レース結果リンク</li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          >
            <Card className="border-2 border-accent/50 bg-accent/10 h-full hover:shadow-xl transition-all">
              <CardHeader>
                <CardTitle className="text-accent-foreground text-2xl">Phase 3</CardTitle>
                <CardDescription className="text-base">コミュニティ機能</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-inside list-disc space-y-2">
                  <li>写真投稿機能</li>
                  <li>応援掲示板</li>
                  <li>ユーザーコメント機能</li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.section>
      </div>
    </>
  );
}