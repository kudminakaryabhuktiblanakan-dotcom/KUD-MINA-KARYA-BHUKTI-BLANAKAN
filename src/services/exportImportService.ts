import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { TransactionLedger, DiscountTier, CommodityCategory } from '../types';
import { formatIDR, formatIndoDate, calculateAuctionFinancials } from './calculationEngine';

export interface ReportSummaryData {
  periodType: 'harian' | 'bulanan' | 'tahunan' | 'kustom';
  periodLabel: string;
  totalTransactions: number;
  totalWeightKg: number;
  totalGrossPrice: number;
  avgPricePerKg: number;
  // Sisi Petani
  totalFarmerCut: number;
  totalFarmerRetention: number;
  totalFarmerNetPaid: number;
  // Sisi Bakul
  totalBakulAdditional6Percent: number;
  totalKoperasiBakulDirect3Percent: number;
  totalBakulMonthlyBill3Percent: number;
  totalBakulPayable: number;
  // Sisi Koperasi
  totalKoperasiGrossRevenue: number;
  // Per Commodity Breakdown
  commodityStats: {
    category: string;
    weightKg: number;
    grossPrice: number;
    txCount: number;
    avgPrice: number;
  }[];
}

/**
 * Export transactions and summary to Excel (.xlsx) file
 */
export const exportReportToExcel = (
  ledgers: TransactionLedger[],
  summary: ReportSummaryData,
  fileNamePrefix: string = 'Laporan_Lelang_KUD'
) => {
  // 1. Prepare Summary Sheet Data
  const summarySheetData: any[][] = [
    ['KOPERASI UNIT DESA (KUD) MINA KARYA BHUKTI'],
    ['TEMPAT PELELANGAN IKAN & UDANG (TPI) BLANAKAN - SUBANG'],
    ['LAPORAN REKAPITULASI HASIL TIMBANGAN & LELANG KOMODITAS'],
    [''],
    ['Periode Laporan:', summary.periodLabel],
    ['Tipe Periode:', summary.periodType.toUpperCase()],
    ['Tanggal Cetak:', new Date().toLocaleString('id-ID')],
    ['Total Transaksi:', `${summary.totalTransactions} transaksi`],
    [''],
    ['RINGKASAN REKAPITULASI FINANSIAL', 'NILAI (RP / KG)'],
    ['Total Volume Ditimbang (Kg):', summary.totalWeightKg],
    ['Total Nilai Transaksi Kotor (X):', summary.totalGrossPrice],
    ['Rata-rata Harga Lelang / Kg:', summary.avgPricePerKg],
    [''],
    ['SISI PETANI (PENJUAL)', 'NILAI (RP)'],
    ['Total Potongan Jasa Petani (Tier):', summary.totalFarmerCut],
    ['Total Simpanan Retensi 1% Petani (3 Bulan):', summary.totalFarmerRetention],
    ['Total Bersih Diterima Petani Segera (Hari H):', summary.totalFarmerNetPaid],
    [''],
    ['SISI BAKUL (PEMBELI)', 'NILAI (RP)'],
    ['Total Biaya Tambahan 6% Bakul:', summary.totalBakulAdditional6Percent],
    ['Total Kas Koperasi Langsung 3% Bakul:', summary.totalKoperasiBakulDirect3Percent],
    ['Total Rekap Tagihan Berkala Bulanan 3% Bakul:', summary.totalBakulMonthlyBill3Percent],
    ['Total Yang Harus Dibayarkan Bakul:', summary.totalBakulPayable],
    [''],
    ['SISI KOPERASI', 'NILAI (RP)'],
    ['Total Pendapatan Kas Koperasi Bersih:', summary.totalKoperasiGrossRevenue],
    [''],
    ['REKAPITULASI PER JENIS KOMODITAS'],
    ['No', 'Nama Komoditas', 'Total Bobot (Kg)', 'Total Nilai (Rp)', 'Rata-rata (Rp/Kg)', 'Jumlah Batch']
  ];

  summary.commodityStats.forEach((com, idx) => {
    summarySheetData.push([
      idx + 1,
      com.category,
      com.weightKg,
      com.grossPrice,
      com.avgPrice,
      com.txCount
    ]);
  });

  // 2. Prepare Detail Transactions Sheet Data
  const detailSheetData: any[][] = [
    ['KUD MINA KARYA BHUKTI - DAFTAR DETAIL TRANSAKSI LELANG'],
    ['Periode:', summary.periodLabel],
    [''],
    [
      'ID Transaksi',
      'Tanggal',
      'Petani (Penjual)',
      'Bakul (Pembeli)',
      'Komoditas',
      'Bobot (Kg)',
      'Harga / Kg (Rp)',
      'Nilai Kotor (X) (Rp)',
      'Tier Jasa Petani (%)',
      'Potongan Jasa Petani (Rp)',
      'Retensi 1% Petani (Rp)',
      'Bersih Diterima Petani (Rp)',
      'Biaya Tambahan Bakul 6% (Rp)',
      'Kas Koperasi Bakul 3% (Rp)',
      'Tagihan Bulanan Bakul 3% (Rp)',
      'Total Tagihan Bakul (Rp)',
      'Kas Koperasi Total (Rp)',
      'Status Retensi',
      'Status Tagihan Bakul'
    ]
  ];

  ledgers.forEach((l) => {
    detailSheetData.push([
      l.id,
      l.createdAt.split('T')[0],
      l.farmerName,
      l.bakulName,
      l.commodityCategory,
      l.weightKg,
      l.pricePerKg,
      l.grossPrice,
      `${l.discountTier}%`,
      l.farmerCutAmount,
      l.farmerRetention1Percent,
      l.netFarmerAmount,
      l.bakulAdditional6Percent,
      l.koperasiBakulIncome3Percent,
      l.bakulMonthlyBill3Percent,
      l.totalBakulPayable,
      l.totalKoperasiIncome,
      l.statusRetention,
      l.statusBakulBill
    ]);
  });

  // Create workbook
  const wb = XLSX.utils.book_new();

  const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetData);
  const wsDetail = XLSX.utils.aoa_to_sheet(detailSheetData);

  // Set column widths
  wsSummary['!cols'] = [
    { wch: 45 },
    { wch: 25 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 15 }
  ];

  wsDetail['!cols'] = [
    { wch: 16 }, // ID
    { wch: 12 }, // Tanggal
    { wch: 22 }, // Petani
    { wch: 22 }, // Bakul
    { wch: 18 }, // Komoditas
    { wch: 12 }, // Bobot
    { wch: 15 }, // Harga
    { wch: 18 }, // Nilai Kotor
    { wch: 15 }, // Tier
    { wch: 18 }, // Potongan
    { wch: 16 }, // Retensi
    { wch: 20 }, // Bersih Petani
    { wch: 18 }, // Biaya Bakul
    { wch: 18 }, // Kas Bakul
    { wch: 18 }, // Tagihan Bulanan
    { wch: 20 }, // Total Bakul
    { wch: 18 }, // Kas Total
    { wch: 16 }, // Status Retensi
    { wch: 18 }  // Status Tagihan
  ];

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Laporan');
  XLSX.utils.book_append_sheet(wb, wsDetail, 'Detail Transaksi');

  const cleanPeriod = summary.periodLabel.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${fileNamePrefix}_${cleanPeriod}.xlsx`;

  XLSX.writeFile(wb, filename);
};

/**
 * Export official report to printable formatted PDF
 */
export const exportReportToPdf = (
  ledgers: TransactionLedger[],
  summary: ReportSummaryData,
  fileNamePrefix: string = 'Laporan_Lelang_KUD'
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 14;

  // Header / Kop Surat
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('KOPERASI UNIT DESA (KUD) MINA KARYA BHUKTI', pageWidth / 2, y, { align: 'center' });

  y += 5.5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text('Balai Pelelangan Ikan & Udang (TPI) Muara Blanakan - Subang, Jawa Barat', pageWidth / 2, y, { align: 'center' });

  y += 4.5;
  doc.text('Sistem Informasi Manajemen Lelang, Kas Koperasi & Retensi Terpadu', pageWidth / 2, y, { align: 'center' });

  y += 4;
  doc.setLineWidth(0.6);
  doc.setDrawColor(15, 23, 42);
  doc.line(14, y, pageWidth - 14, y);
  doc.setLineWidth(0.2);
  doc.line(14, y + 0.8, pageWidth - 14, y + 0.8);

  y += 7;
  // Report Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(13, 148, 136); // teal-600
  const titleText = `BERITA ACARA REKAPITULASI LELANG ${summary.periodType.toUpperCase()}`;
  doc.text(titleText, pageWidth / 2, y, { align: 'center' });

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Periode: ${summary.periodLabel}`, pageWidth / 2, y, { align: 'center' });

  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB`, pageWidth / 2, y, { align: 'center' });

  y += 7;

  // Financial Highlights Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, pageWidth - 28, 38, 2, 2, 'FD');

  const col1X = 18;
  const col2X = 110;
  let textY = y + 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('RINGKASAN VOLUME & OMZET:', col1X, textY);
  doc.text('PEMBAGIAN HASIL KOPERASI & PETANI:', col2X, textY);

  textY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(`• Total Volume Ditimbang: ${summary.totalWeightKg.toLocaleString('id-ID')} Kg (${(summary.totalWeightKg / 1000).toFixed(2)} Ton)`, col1X, textY);
  doc.text(`• Bersih Diterima Petani: ${formatIDR(summary.totalFarmerNetPaid)}`, col2X, textY);

  textY += 4.5;
  doc.text(`• Total Nilai Lelang Kotor (X): ${formatIDR(summary.totalGrossPrice)}`, col1X, textY);
  doc.text(`• Simpanan Retensi 1% Petani: ${formatIDR(summary.totalFarmerRetention)}`, col2X, textY);

  textY += 4.5;
  doc.text(`• Rata-rata Harga Realisasi: ${formatIDR(summary.avgPricePerKg)} / Kg`, col1X, textY);
  doc.text(`• Total Kas Koperasi Bersih: ${formatIDR(summary.totalKoperasiGrossRevenue)}`, col2X, textY);

  textY += 4.5;
  doc.text(`• Total Transaksi Selesai: ${summary.totalTransactions} Transaksi Lot`, col1X, textY);
  doc.text(`• Total Tagihan Masuk Bakul: ${formatIDR(summary.totalBakulPayable)}`, col2X, textY);

  y += 43;

  // Breakdown Per Komoditas Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('REKAPITULASI PER JENIS KOMODITAS', 14, y);
  y += 4;

  // Table Header
  doc.setFillColor(15, 23, 42);
  doc.rect(14, y, pageWidth - 28, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('No', 17, y + 4.2);
  doc.text('Komoditas', 26, y + 4.2);
  doc.text('Total Bobot', 85, y + 4.2, { align: 'right' });
  doc.text('Pangsa %', 110, y + 4.2, { align: 'center' });
  doc.text('Rata-rata/Kg', 140, y + 4.2, { align: 'right' });
  doc.text('Total Omzet (Rp)', pageWidth - 18, y + 4.2, { align: 'right' });

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  summary.commodityStats.forEach((com, idx) => {
    const isEven = idx % 2 === 0;
    if (isEven) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, pageWidth - 28, 5, 'F');
    }
    doc.setTextColor(30, 41, 59);
    doc.text((idx + 1).toString(), 17, y + 3.7);
    doc.text(com.category, 26, y + 3.7);
    doc.text(`${com.weightKg.toLocaleString('id-ID')} Kg`, 85, y + 3.7, { align: 'right' });
    const share = summary.totalWeightKg > 0 ? ((com.weightKg / summary.totalWeightKg) * 100).toFixed(1) + '%' : '0%';
    doc.text(share, 110, y + 3.7, { align: 'center' });
    doc.text(formatIDR(com.avgPrice), 140, y + 3.7, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(formatIDR(com.grossPrice), pageWidth - 18, y + 3.7, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    y += 5;
  });

  y += 5;

  // Daftar Transaksi Terakhir dalam Periode
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`RINCIAN TRANSAKSI LOT (${ledgers.length} TRANSAKSI)`, 14, y);
  y += 4;

  // Transaction Table Header
  doc.setFillColor(30, 41, 59);
  doc.rect(14, y, pageWidth - 28, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('ID & Tgl', 17, y + 4.2);
  doc.text('Petani (Penjual)', 44, y + 4.2);
  doc.text('Bakul (Pembeli)', 74, y + 4.2);
  doc.text('Komoditas', 104, y + 4.2);
  doc.text('Bobot', 135, y + 4.2, { align: 'right' });
  doc.text('Cair Petani', 162, y + 4.2, { align: 'right' });
  doc.text('Total Tagihan', pageWidth - 18, y + 4.2, { align: 'right' });

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);

  const maxTxToPrint = Math.min(ledgers.length, 14);
  for (let i = 0; i < maxTxToPrint; i++) {
    const l = ledgers[i];
    const isEven = i % 2 === 0;
    if (isEven) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, pageWidth - 28, 4.8, 'F');
    }
    doc.setTextColor(51, 65, 85);
    doc.text(`${l.id.substring(0, 10)} (${l.createdAt.split('T')[0]})`, 17, y + 3.4);
    doc.text(l.farmerName.substring(0, 18), 44, y + 3.4);
    doc.text(l.bakulName.substring(0, 18), 74, y + 3.4);
    doc.text(l.commodityCategory.substring(0, 16), 104, y + 3.4);
    doc.text(`${l.weightKg} Kg`, 135, y + 3.4, { align: 'right' });
    doc.text(formatIDR(l.netFarmerAmount), 162, y + 3.4, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(formatIDR(l.totalBakulPayable), pageWidth - 18, y + 3.4, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    y += 4.8;
  }

  if (ledgers.length > maxTxToPrint) {
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`* Menampilkan ${maxTxToPrint} dari total ${ledgers.length} transaksi. Silakan unduh format Excel (.xlsx) untuk rincian lembar lengkap tak terbatas.`, 14, y + 3.5);
    y += 6;
  } else {
    y += 4;
  }

  // Tanda Tangan Pengesahan (Signature Blocks)
  y = Math.max(y + 6, 240);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);

  const sigY = y;
  const colSig1 = 30;
  const colSig2 = pageWidth / 2;
  const colSig3 = pageWidth - 30;

  doc.text('Dibuat & Ditimbang Oleh,', colSig1, sigY, { align: 'center' });
  doc.text('Kasir / Petugas Timbang', colSig1, sigY + 4, { align: 'center' });
  doc.line(colSig1 - 20, sigY + 22, colSig1 + 20, sigY + 22);
  doc.setFont('helvetica', 'bold');
  doc.text('( Petugas TPI Blanakan )', colSig1, sigY + 26, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.text('Diperiksa & Dibukukan Oleh,', colSig2, sigY, { align: 'center' });
  doc.text('Bendahara / Manager Keuangan', colSig2, sigY + 4, { align: 'center' });
  doc.line(colSig2 - 20, sigY + 22, colSig2 + 20, sigY + 22);
  doc.setFont('helvetica', 'bold');
  doc.text('( Ibu Siti Aminah, S.E. )', colSig2, sigY + 26, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.text('Mengetahui & Menyetujui,', colSig3, sigY, { align: 'center' });
  doc.text('Ketua KUD Mina Karya Bhukti', colSig3, sigY + 4, { align: 'center' });
  doc.line(colSig3 - 20, sigY + 22, colSig3 + 20, sigY + 22);
  doc.setFont('helvetica', 'bold');
  doc.text('( H. Mahmud Syafei )', colSig3, sigY + 26, { align: 'center' });

  const cleanPeriod = summary.periodLabel.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${fileNamePrefix}_${cleanPeriod}.pdf`;

  doc.save(filename);
};

/**
 * Generate blank template Excel for easy bulk importing
 */
export const downloadImportTemplateExcel = () => {
  const templateData = [
    ['TEMPLATE IMPOR DATA TRANSAKSI LELANG & TIMBANGAN - KUD MINA KARYA BHUKTI'],
    ['Petunjuk: Isi baris data mulai dari baris ke-5. Kolom yang bertanda bintang (*) wajib diisi.'],
    ['Tier Diskon Petani: 8 (Standar), 6 (Semi-Mitra), atau 3 (Mitra Inti)'],
    [''],
    [
      'Tanggal (YYYY-MM-DD)*',
      'Nama Petani*',
      'Nama Bakul*',
      'Nama Komoditas*',
      'Bobot Timbang (Kg)*',
      'Harga Lelang Menang / Kg (Rp)*',
      'Tier Potongan Petani (8/6/3)*',
      'Catatan Mutu / Keterangan'
    ],
    ['2026-09-24', 'H. Sulaeman (Blok A)', 'H. Dahlan (Bos Udang)', 'Udang Vaname', 320, 85000, 8, 'Size 40 Segar'],
    ['2026-09-24', 'Pak Subur Santoso', 'Cik Lily Seafood', 'Ikan Bandeng', 150.5, 34000, 8, 'Super 1kg/3ekor'],
    ['2026-09-24', 'Ibu Nurhayati Tambak', 'Pak Kumis Fresh Fish', 'Kepiting Bakau', 45.2, 95000, 6, 'Jantan Super']
  ];

  const ws = XLSX.utils.aoa_to_sheet(templateData);
  ws['!cols'] = [
    { wch: 20 },
    { wch: 25 },
    { wch: 25 },
    { wch: 22 },
    { wch: 18 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Impor Transaksi');
  XLSX.writeFile(wb, 'Template_Impor_Lelang_KUD.xlsx');
};

export interface ParsedImportRow {
  date: string;
  farmerName: string;
  bakulName: string;
  commodityCategory: string;
  weightKg: number;
  pricePerKg: number;
  discountTier: DiscountTier;
  notes: string;
  isValid: boolean;
  errors: string[];
}

/**
 * Parse uploaded .xlsx file into structured transaction rows with validation
 */
export const parseExcelFile = async (file: File): Promise<ParsedImportRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Find header row: look for row containing 'Nama Petani' or 'Bobot'
        let headerRowIdx = -1;
        for (let i = 0; i < Math.min(jsonRows.length, 10); i++) {
          const rowStr = JSON.stringify(jsonRows[i] || '').toLowerCase();
          if (rowStr.includes('petani') && (rowStr.includes('bobot') || rowStr.includes('harga'))) {
            headerRowIdx = i;
            break;
          }
        }

        const parsedRows: ParsedImportRow[] = [];
        const startIdx = headerRowIdx !== -1 ? headerRowIdx + 1 : 0;

        for (let i = startIdx; i < jsonRows.length; i++) {
          const row = jsonRows[i];
          if (!row || row.length === 0) continue;

          // Skip empty rows or title rows
          const firstCell = String(row[0] || '').trim();
          if (!firstCell && !row[1]) continue;

          const dateRaw = String(row[0] || '').trim();
          const farmerName = String(row[1] || '').trim();
          const bakulName = String(row[2] || '').trim();
          const category = String(row[3] || '').trim();
          const weightKgRaw = row[4];
          const priceRaw = row[5];
          const tierRaw = row[6];
          const notes = String(row[7] || '').trim();

          const errors: string[] = [];

          if (!farmerName) errors.push('Nama petani wajib diisi');
          if (!bakulName) errors.push('Nama bakul wajib diisi');
          if (!category) errors.push('Komoditas wajib diisi');

          const weightKg = Number(String(weightKgRaw).replace(',', '.'));
          if (isNaN(weightKg) || weightKg <= 0) {
            errors.push('Bobot timbangan harus angka > 0');
          }

          const pricePerKg = Number(String(priceRaw).replace(/[^0-9.]/g, ''));
          if (isNaN(pricePerKg) || pricePerKg <= 0) {
            errors.push('Harga per Kg harus angka valid > 0');
          }

          let tier: DiscountTier = 8;
          const tierNum = Number(tierRaw);
          if (tierNum === 3 || tierNum === 6 || tierNum === 8) {
            tier = tierNum as DiscountTier;
          }

          // Date format validation
          let dateStr = new Date().toISOString().split('T')[0];
          if (dateRaw && dateRaw.match(/^\d{4}-\d{2}-\d{2}$/)) {
            dateStr = dateRaw;
          }

          parsedRows.push({
            date: dateStr,
            farmerName: farmerName || 'Petani',
            bakulName: bakulName || 'Bakul',
            commodityCategory: category || 'Komoditas',
            weightKg: isNaN(weightKg) ? 0 : weightKg,
            pricePerKg: isNaN(pricePerKg) ? 0 : pricePerKg,
            discountTier: tier,
            notes,
            isValid: errors.length === 0,
            errors,
          });
        }

        resolve(parsedRows);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
