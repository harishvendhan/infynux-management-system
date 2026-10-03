import * as XLSX from 'xlsx';

export interface ExcelSheetData {
  name: string;
  data: Record<string, any>[];
  colWidths?: number[];
}

/**
 * Exports data to a genuine Microsoft Excel (.xlsx) file with one or multiple worksheets.
 */
export function exportToExcel(sheets: ExcelSheetData[], filename: string): void {
  const wb = XLSX.utils.book_new();

  for (const sheet of sheets) {
    if (!sheet.data || sheet.data.length === 0) {
      const emptyWs = XLSX.utils.aoa_to_sheet([['No data available']]);
      XLSX.utils.book_append_sheet(wb, emptyWs, sheet.name.slice(0, 31));
      continue;
    }

    const ws = XLSX.utils.json_to_sheet(sheet.data);

    // Compute automatic column widths if not provided
    if (sheet.colWidths && sheet.colWidths.length > 0) {
      ws['!cols'] = sheet.colWidths.map((w) => ({ wch: w }));
    } else {
      const keys = Object.keys(sheet.data[0]);
      ws['!cols'] = keys.map((key) => {
        let maxLen = key.length;
        for (const row of sheet.data) {
          const val = row[key];
          if (val !== null && val !== undefined) {
            maxLen = Math.max(maxLen, String(val).length);
          }
        }
        return { wch: Math.min(Math.max(maxLen + 3, 12), 40) };
      });
    }

    // Sheet names in Excel cannot exceed 31 characters
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
  }

  const cleanFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(wb, cleanFilename);
}
