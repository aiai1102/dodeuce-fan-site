export function formatDate(dateString: string | null): string {
  if (!dateString) return '-';

  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}/${month}/${day}`;
}

export function formatPrize(prize: number | null): string {
  if (prize === null || prize === undefined) return '-';
  return `${prize.toLocaleString()}万円`;
}

export function formatNumber(num: number | null): string {
  if (num === null || num === undefined) return '-';
  return num.toString();
}