'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { LogOut, Upload, List } from 'lucide-react';

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/import">
          <Button variant={pathname === '/admin/import' ? 'default' : 'outline'} size="sm">
            <Upload className="mr-2 h-4 w-4" />
            CSVアップロード
          </Button>
        </Link>
        <Link href="/admin/mares">
          <Button variant={pathname === '/admin/mares' ? 'default' : 'outline'} size="sm">
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
  );
}