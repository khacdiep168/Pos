/**
 * Export utilities for generating Excel-compatible CSV files with UTF-8 BOM (\uFEFF)
 * Ensures Vietnamese diacritics and special characters render cleanly in Microsoft Excel.
 */

export function exportToCSV(
  filename: string,
  headers: string[],
  rows: (string | number | undefined | null)[][]
): void {
  if (typeof window === 'undefined') return;

  // Escape cell content for CSV (wrap in quotes if contains comma, quote, or newline)
  const formatCell = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map(formatCell).join(',');
  const rowLines = rows.map((r) => r.map(formatCell).join(','));
  const csvContent = [headerLine, ...rowLines].join('\r\n');

  // \uFEFF is the UTF-8 Byte Order Mark (BOM) needed by Excel to recognize UTF-8 encoding
  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
