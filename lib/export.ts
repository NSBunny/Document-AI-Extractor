import type { ExtractionResult } from './types';

/**
 * Triggers a file download in the browser.
 */
export function downloadFile(
  content: string,
  fileName: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();

  // Clean up
  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Exports the extraction result as a formatted JSON file.
 */
export function exportAsJSON(result: ExtractionResult): void {
  const json = JSON.stringify(result, null, 2);
  const timestamp = new Date().toISOString().slice(0, 10);
  downloadFile(
    json,
    `extraction-${result.metadata.fileName}-${timestamp}.json`,
    'application/json',
  );
}

/**
 * Escapes a value for safe inclusion in a CSV cell.
 */
function csvEscape(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Exports the extracted fields as a CSV file.
 * Columns: Label, Value, Category, Confidence
 */
export function exportAsCSV(result: ExtractionResult): void {
  const headers = ['Label', 'Value', 'Category', 'Confidence'];

  const rows = result.fields.map((field) => [
    csvEscape(field.label),
    csvEscape(field.value),
    csvEscape(field.category),
    csvEscape(Math.round(field.confidence * 100) + '%'),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  const timestamp = new Date().toISOString().slice(0, 10);
  downloadFile(
    csvContent,
    `extraction-${result.metadata.fileName}-${timestamp}.csv`,
    'text/csv;charset=utf-8',
  );
}

/**
 * Triggers the browser print dialog for PDF export of the extraction result.
 */
export function exportAsPDF(result: ExtractionResult): void {
  // Set a temporary document title for the PDF filename
  const originalTitle = document.title;
  const timestamp = new Date().toISOString().slice(0, 10);
  document.title = `DocAI-Extraction-Report-${result.metadata.fileName}-${timestamp}`;

  window.print();

  // Restore original title after a short delay
  setTimeout(() => {
    document.title = originalTitle;
  }, 1000);
}

