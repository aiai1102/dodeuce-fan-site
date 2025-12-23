'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const YEARS = [2023, 2024, 2025];

export function YearTabs() {
  const pathname = usePathname();
  const currentYear = pathname?.split('/').pop() || '2025';

  return (
    <div className="mb-6">
      <Tabs value={currentYear} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-auto">
          {YEARS.map((year) => (
            <Link key={year} href={`/mares/${year}`}>
              <TabsTrigger value={year.toString()} className="w-full md:w-auto">
                {year}年
              </TabsTrigger>
            </Link>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}