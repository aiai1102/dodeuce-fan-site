'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { MareFilters, SortField, SortOrder } from '@/lib/types';

interface FilterBarProps {
  filters: MareFilters;
  onFilterChange: (filters: MareFilters) => void;
  sortField: SortField;
  sortOrder: SortOrder;
  onSortChange: (field: SortField, order: SortOrder) => void;
}

export function FilterBar({ filters, onFilterChange, sortField, sortOrder, onSortChange }: FilterBarProps) {
  return (
    <div className="mb-6 space-y-4 rounded-lg border bg-white p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Label htmlFor="mareName">牝馬名で検索</Label>
          <Input
            id="mareName"
            placeholder="例: アール"
            value={filters.mareName || ''}
            onChange={(e) => onFilterChange({ ...filters, mareName: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="sireName">父馬名で検索</Label>
          <Input
            id="sireName"
            placeholder="例: キングカメハメハ"
            value={filters.sireName || ''}
            onChange={(e) => onFilterChange({ ...filters, sireName: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="sort">並び替え</Label>
          <Select
            value={`${sortField}-${sortOrder}`}
            onValueChange={(value) => {
              const [field, order] = value.split('-') as [SortField, SortOrder];
              onSortChange(field, order);
            }}
          >
            <SelectTrigger id="sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cover_date-desc">種付け日（新しい順）</SelectItem>
              <SelectItem value="cover_date-asc">種付け日（古い順）</SelectItem>
              <SelectItem value="name-asc">牝馬名（あいうえお順）</SelectItem>
              <SelectItem value="name-desc">牝馬名（逆順）</SelectItem>
              <SelectItem value="total_prize-desc">獲得賞金（高い順）</SelectItem>
              <SelectItem value="total_prize-asc">獲得賞金（低い順）</SelectItem>
              <SelectItem value="birth_year-desc">生年（新しい順）</SelectItem>
              <SelectItem value="birth_year-asc">生年（古い順）</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}