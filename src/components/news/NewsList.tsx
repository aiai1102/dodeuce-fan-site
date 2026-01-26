import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import type { News } from '@/lib/types';
import { formatDate } from '@/lib/utils/format';

interface NewsListProps {
  news: News[];
  loading?: boolean;
}

export function NewsList({ news, loading }: NewsListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-24 mb-3" />
              <div className="h-6 bg-muted rounded w-3/4 mb-3" />
              <div className="h-4 bg-muted rounded w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          ニュースはまだありません
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {news.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
        >
          <Card className="hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <time dateTime={item.published_at}>
                  {formatDate(item.published_at)}
                </time>
                <span className="text-xs px-2 py-0.5 bg-secondary rounded">
                  {item.source_name}
                </span>
              </div>

              <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                {item.title}
              </h3>

              {item.quote && (
                <blockquote className="border-l-4 border-primary/30 pl-4 my-3 text-muted-foreground italic">
                  {item.quote}
                </blockquote>
              )}

              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline text-sm font-medium"
              >
                記事を読む
                <ExternalLink className="w-4 h-4" />
              </a>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
