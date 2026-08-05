/**
 * exportCsv.js — CSV download helpers.
 * Opening a CSV in Excel automatically renders it as a spreadsheet.
 */

const escape = (v) => {
  const s = v == null ? '' : String(v);
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s;
};

function rowsToCsv(rows) {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  return [
    headers.join(','),
    ...rows.map(row => headers.map(h => escape(row[h])).join(',')),
  ].join('\r\n');
}

function triggerDownload(csvString, filename) {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Download a single dataset as its own CSV file.
 * @param {Object[]} rows
 * @param {string}   filename - without extension
 */
export function exportCsv(rows, filename) {
  if (!rows || rows.length === 0) return;
  triggerDownload(rowsToCsv(rows), filename);
}

/**
 * Download multiple named datasets as one combined CSV file.
 * Each section is separated by a blank line and a section-header row.
 *
 * @param {{ label: string, rows: Object[] }[]} sections
 * @param {string} filename - without extension
 */
export function exportCsvCombined(sections, filename) {
  const parts = sections
    .filter(s => s.rows && s.rows.length > 0)
    .map(s => `${s.label}\r\n${rowsToCsv(s.rows)}`);

  if (parts.length === 0) return;
  triggerDownload(parts.join('\r\n\r\n'), filename);
}
