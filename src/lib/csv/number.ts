// CSVの数値項目を厳密に整数へ変換する
// parseIntは "8,197" を 8 に、"12abc" を 12 に切り捨てるため使わない

// error が null なら成功（value が null の場合は空欄）。error がある場合 value は常に null
export interface IntParseResult {
  value: number | null;
  error: string | null;
}

const PLAIN_DIGITS = /^\d+$/;
// 3桁ごとのカンマ区切り（例: 8,197 / 1,234,567）
const COMMA_GROUPED = /^\d{1,3}(,\d{3})+$/;

/**
 * 0以上の整数を厳密に変換する。
 * - 空欄は null（未掲載）
 * - "8,197" のような3桁区切りカンマは許可
 * - 小数・負数・単位付き・区切り位置の誤りなどは途中で切り捨てずエラー
 */
export function parseNonNegativeInt(raw: string | null | undefined, label: string): IntParseResult {
  const value = (raw ?? '').trim();
  if (value === '') {
    return { value: null, error: null };
  }

  if (!PLAIN_DIGITS.test(value) && !COMMA_GROUPED.test(value)) {
    return { value: null, error: `${label}「${value}」は整数として読み取れません（カンマ区切りの整数のみ可）` };
  }

  const parsed = Number(value.replace(/,/g, ''));
  // DBのint型（最大2,147,483,647）に収まるか確認
  if (!Number.isSafeInteger(parsed) || parsed > 2147483647) {
    return { value: null, error: `${label}「${value}」が大きすぎます` };
  }

  return { value: parsed, error: null };
}

/** 獲得賞金（万円単位の整数）を変換する */
export function parsePrize(raw: string | null | undefined): IntParseResult {
  return parseNonNegativeInt(raw, '獲得賞金(total_prize)');
}
