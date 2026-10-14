/**
 * Export utilities for generating Excel-compatible CSV files with UTF-8 BOM (\uFEFF)
 * Ensures Vietnamese diacritics and special characters render cleanly in Microsoft Excel.
 * Formatted to meet official Ministry of Finance (Bộ Tài chính) legal accounting standards.
 */

import { adminService } from '@/services/adminService';

export interface OfficialReportMetadata {
  reportTitle?: string; // Tên sổ kế toán hoặc báo cáo thuế
  periodText?: string; // Kỳ báo cáo: "Kỳ tính thuế: Tháng 10/2026" hoặc "Từ ngày ... Đến ngày ..."
  businessName?: string; // Tên Hộ kinh doanh / Công ty
  taxCode?: string; // Mã số thuế (MST)
  address?: string; // Địa chỉ kinh doanh chính thức
  ownerName?: string; // Tên chủ hộ kinh doanh / Đại diện pháp luật
  createdByName?: string; // Người lập sổ
  reportDateText?: string; // Ngày lập báo cáo
}

export function exportToCSV(
  filename: string,
  headers: string[],
  rows: (string | number | undefined | null)[][],
  metadata?: OfficialReportMetadata
): void {
  if (typeof window === 'undefined') return;

  // Escape cell content for CSV (wrap in quotes if contains comma, quote, or newline)
  const formatCell = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const colCount = Math.max(headers.length, 4);

  // Helper to build a padded row
  const makePaddedRow = (firstCell: string): string => {
    const cells = new Array(colCount).fill('');
    cells[0] = firstCell;
    return cells.map(formatCell).join(',');
  };

  const lines: string[] = [];

  // If metadata is provided (or reportTitle is present), generate official 5-line Ministry of Finance header
  if (metadata && metadata.reportTitle) {
    let settings: any = null;
    try {
      settings = adminService.getSettings();
    } catch {
      // Fallback if adminService is not initialized
    }

    const businessName = (
      metadata.businessName ||
      settings?.business_name ||
      settings?.store_name ||
      'HỘ KINH DOANH VIBE BISTRO'
    ).toUpperCase();

    const taxCode = metadata.taxCode || settings?.tax_code || '---';
    const address = metadata.address || settings?.address || '---';
    const ownerName = metadata.ownerName || settings?.owner_name || 'Chủ hộ kinh doanh';
    const createdByName = metadata.createdByName || 'Người lập sổ';

    const now = new Date();
    const defaultDateText = `Ngày ${now.getDate().toString().padStart(2, '0')} tháng ${(now.getMonth() + 1).toString().padStart(2, '0')} năm ${now.getFullYear()}`;
    const reportDateText = metadata.reportDateText || defaultDateText;

    // Dòng 1: CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM (In hoa, căn giữa)
    lines.push(makePaddedRow('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM'));
    // Dòng 2: Độc lập - Tự do - Hạnh phúc (In đậm, căn giữa)
    lines.push(makePaddedRow('Độc lập - Tự do - Hạnh phúc'));
    // Dòng 3: [Tên Hộ kinh doanh / Công ty lấy từ StoreSettings] (In hoa, đậm)
    lines.push(makePaddedRow(`Đơn vị: ${businessName}`));
    // Dòng 4: Mã số thuế: [MST] | Địa chỉ: [Địa chỉ quán] (Thông tin liên hệ)
    lines.push(makePaddedRow(`Mã số thuế: ${taxCode} | Địa chỉ: ${address}`));
    // Dòng 5: [TÊN SỔ KẾ TOÁN HOẶC BÁO CÁO THUẾ] (Kỳ báo cáo: Từ ngày ... Đến ngày ...) (In hoa, cỡ chữ lớn, đậm)
    const periodSuffix = metadata.periodText ? ` (${metadata.periodText})` : '';
    lines.push(makePaddedRow(`${metadata.reportTitle.toUpperCase()}${periodSuffix}`));
    // Dòng 6: Dòng trống phân cách
    lines.push(new Array(colCount).fill('').map(formatCell).join(','));

    // Dòng 7: Tiêu đề cột
    lines.push(headers.map(formatCell).join(','));

    // Dòng 8 trở đi: Dữ liệu
    rows.forEach((r) => {
      lines.push(r.map(formatCell).join(','));
    });

    // Cuối file: Dòng trống + Ngày tháng + Khung chữ ký (Căn lề chuẩn)
    lines.push(new Array(colCount).fill('').map(formatCell).join(','));

    // Dòng Ngày lập báo cáo (căn góc phải)
    const dateRow = new Array(colCount).fill('');
    dateRow[colCount - 1] = reportDateText;
    lines.push(dateRow.map(formatCell).join(','));

    // Dòng Chức danh ký
    const titleRow = new Array(colCount).fill('');
    titleRow[0] = 'Người lập sổ';
    titleRow[colCount - 1] = 'Chủ hộ kinh doanh';
    lines.push(titleRow.map(formatCell).join(','));

    // Dòng Hướng dẫn ký
    const subTitleRow = new Array(colCount).fill('');
    subTitleRow[0] = '(Ký, ghi rõ họ tên)';
    subTitleRow[colCount - 1] = '(Ký, đóng dấu nếu có)';
    lines.push(subTitleRow.map(formatCell).join(','));

    // 2 Dòng trống cách để chừa khoảng trống ký tay
    lines.push(new Array(colCount).fill('').map(formatCell).join(','));
    lines.push(new Array(colCount).fill('').map(formatCell).join(','));

    // Dòng Tên người ký
    const nameRow = new Array(colCount).fill('');
    nameRow[0] = createdByName;
    nameRow[colCount - 1] = ownerName;
    lines.push(nameRow.map(formatCell).join(','));
  } else {
    // Standard table export without formal header metadata
    const headerLine = headers.map(formatCell).join(',');
    const rowLines = rows.map((r) => r.map(formatCell).join(','));
    lines.push(headerLine, ...rowLines);
  }

  const csvContent = lines.join('\r\n');

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
