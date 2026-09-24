import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  FileSpreadsheet, 
  FileText, 
  Upload, 
  Trash2, 
  Edit3, 
  Search, 
  TrendingUp, 
  Scale, 
  DollarSign, 
  Layers, 
  ChevronRight, 
  Download, 
  Filter, 
  RefreshCw,
  Printer,
  ShieldAlert,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import { 
  TransactionLedger, 
  User, 
  CommodityMaster, 
  DiscountTier 
} from '../../types';
import { formatIDR, formatIndoDate } from '../../services/calculationEngine';
import { 
  exportReportToExcel, 
  exportReportToPdf, 
  ReportSummaryData 
} from '../../services/exportImportService';
import { EditTransactionModal } from './EditTransactionModal';
import { ImportExcelModal } from './ImportExcelModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface PeriodReportViewProps {
  ledgers: TransactionLedger[];
  users: User[];
  commodityMasters: CommodityMaster[];
  currentSimulatedDate: Date;
  onUpdateLedger: (updatedLedger: TransactionLedger) => void;
  onDeleteLedger: (ledgerId: string) => void;
  onDeleteAllLedgers: () => void;
  onImportLedgers: (newLedgers: TransactionLedger[]) => void;
  onOpenReceipt?: (ledger: TransactionLedger) => void;
}

export const PeriodReportView: React.FC<PeriodReportViewProps> = ({
  ledgers,
  users,
  commodityMasters,
  currentSimulatedDate,
  onUpdateLedger,
  onDeleteLedger,
  onDeleteAllLedgers,
  onImportLedgers,
  onOpenReceipt,
}) => {
  // Period filter states
  const [periodType, setPeriodType] = useState<'harian' | 'bulanan' | 'tahunan' | 'kustom' | 'semua'>('harian');
  
  const currentDateStr = currentSimulatedDate.toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(currentDateStr);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentSimulatedDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentSimulatedDate.getFullYear());
  const [customStartDate, setCustomStartDate] = useState<string>(currentDateStr);
  const [customEndDate, setCustomEndDate] = useState<string>(currentDateStr);

  // Table search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [commodityFilter, setCommodityFilter] = useState<string>('all');

  // Modals state
  const [editingTransaction, setEditingTransaction] = useState<TransactionLedger | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    mode: 'single' | 'all';
    targetLedger?: TransactionLedger | null;
  }>({
    isOpen: false,
    mode: 'single',
    targetLedger: null,
  });

  // Filter ledgers by selected period
  const filteredByPeriod = useMemo(() => {
    return ledgers.filter((item) => {
      const itemDateStr = item.createdAt.split('T')[0];
      const itemDate = new Date(item.createdAt);

      if (periodType === 'harian') {
        return itemDateStr === selectedDate;
      }
      if (periodType === 'bulanan') {
        const itemMonth = itemDate.getMonth() + 1;
        const itemYear = itemDate.getFullYear();
        return itemMonth === selectedMonth && itemYear === selectedYear;
      }
      if (periodType === 'tahunan') {
        return itemDate.getFullYear() === selectedYear;
      }
      if (periodType === 'kustom') {
        return itemDateStr >= customStartDate && itemDateStr <= customEndDate;
      }
      return true; // 'semua'
    });
  }, [ledgers, periodType, selectedDate, selectedMonth, selectedYear, customStartDate, customEndDate]);

  // Secondary filter (search & commodity)
  const displayLedgers = useMemo(() => {
    return filteredByPeriod.filter((l) => {
      const matchesSearch = 
        l.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.bakulName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.commodityCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCom = commodityFilter === 'all' || l.commodityCategory === commodityFilter;

      return matchesSearch && matchesCom;
    });
  }, [filteredByPeriod, searchQuery, commodityFilter]);

  // Human-readable Period Label
  const periodLabel = useMemo(() => {
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    if (periodType === 'harian') {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        const d = parseInt(parts[2], 10);
        const m = monthNames[parseInt(parts[1], 10) - 1];
        const y = parts[0];
        return `${d} ${m} ${y}`;
      }
      return selectedDate;
    }
    if (periodType === 'bulanan') {
      return `${monthNames[selectedMonth - 1]} ${selectedYear}`;
    }
    if (periodType === 'tahunan') {
      return `Tahun ${selectedYear}`;
    }
    if (periodType === 'kustom') {
      return `${customStartDate} s/d ${customEndDate}`;
    }
    return 'Seluruh Riwayat Transaksi';
  }, [periodType, selectedDate, selectedMonth, selectedYear, customStartDate, customEndDate]);

  // Aggregate Metrics
  const summaryData: ReportSummaryData = useMemo(() => {
    const totalTransactions = filteredByPeriod.length;
    let totalWeightKg = 0;
    let totalGrossPrice = 0;
    let totalFarmerCut = 0;
    let totalFarmerRetention = 0;
    let totalFarmerNetPaid = 0;
    let totalBakulAdditional6Percent = 0;
    let totalKoperasiBakulDirect3Percent = 0;
    let totalBakulMonthlyBill3Percent = 0;
    let totalBakulPayable = 0;
    let totalKoperasiGrossRevenue = 0;

    const commodityMap: Record<string, { weightKg: number; grossPrice: number; txCount: number }> = {};

    filteredByPeriod.forEach((l) => {
      totalWeightKg += l.weightKg;
      totalGrossPrice += l.grossPrice;
      totalFarmerCut += l.farmerCutAmount;
      totalFarmerRetention += l.farmerRetention1Percent;
      totalFarmerNetPaid += l.netFarmerAmount;
      totalBakulAdditional6Percent += l.bakulAdditional6Percent;
      totalKoperasiBakulDirect3Percent += l.koperasiBakulIncome3Percent;
      totalBakulMonthlyBill3Percent += l.bakulMonthlyBill3Percent;
      totalBakulPayable += l.totalBakulPayable;
      totalKoperasiGrossRevenue += l.totalKoperasiIncome;

      const cat = l.commodityCategory;
      if (!commodityMap[cat]) {
        commodityMap[cat] = { weightKg: 0, grossPrice: 0, txCount: 0 };
      }
      commodityMap[cat].weightKg += l.weightKg;
      commodityMap[cat].grossPrice += l.grossPrice;
      commodityMap[cat].txCount += 1;
    });

    const avgPricePerKg = totalWeightKg > 0 ? Math.round(totalGrossPrice / totalWeightKg) : 0;

    const commodityStats = Object.entries(commodityMap).map(([category, stats]) => ({
      category,
      weightKg: stats.weightKg,
      grossPrice: stats.grossPrice,
      txCount: stats.txCount,
      avgPrice: stats.weightKg > 0 ? Math.round(stats.grossPrice / stats.weightKg) : 0,
    })).sort((a, b) => b.weightKg - a.weightKg);

    return {
      periodType: periodType === 'semua' ? 'kustom' : periodType,
      periodLabel,
      totalTransactions,
      totalWeightKg,
      totalGrossPrice,
      avgPricePerKg,
      totalFarmerCut,
      totalFarmerRetention,
      totalFarmerNetPaid,
      totalBakulAdditional6Percent,
      totalKoperasiBakulDirect3Percent,
      totalBakulMonthlyBill3Percent,
      totalBakulPayable,
      totalKoperasiGrossRevenue,
      commodityStats,
    };
  }, [filteredByPeriod, periodType, periodLabel]);

  // Handlers for quick period shifts
  const handleShiftDay = (deltaDays: number) => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + deltaDays);
    setSelectedDate(cur.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Export/Import Action Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-teal-800/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-400/30 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Modul Laporan & Data Center</span>
              </span>
              <span className="text-xs text-slate-400">&bull;</span>
              <span className="text-xs font-mono text-emerald-400">TPI Muara Blanakan</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Laporan Harian, Bulanan & Tahunan
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Pantau rekapitulasi volume timbangan, omzet lelang kotor (X), bagi hasil bertingkat petani, retensi 1%, serta biaya bakul +6% secara terperinci.
            </p>
          </div>

          {/* Quick Action Tools: Export Excel, Export PDF, Import, Delete All */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Export Excel */}
            <button
              type="button"
              onClick={() => exportReportToExcel(filteredByPeriod, summaryData)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md shadow-emerald-900/30 transition-all cursor-pointer"
              title="Unduh Laporan Format Microsoft Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor .xlsx</span>
            </button>

            {/* Export PDF */}
            <button
              type="button"
              onClick={() => exportReportToPdf(filteredByPeriod, summaryData)}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md shadow-rose-900/30 transition-all cursor-pointer"
              title="Cetak & Unduh Dokumen Berita Acara PDF Resmi"
            >
              <FileText className="w-4 h-4" />
              <span>Ekspor PDF</span>
            </button>

            {/* Import Excel */}
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md shadow-teal-900/30 transition-all cursor-pointer"
              title="Impor Data Massal dari file .xlsx"
            >
              <Upload className="w-4 h-4" />
              <span>Impor .xlsx</span>
            </button>

            {/* Hapus Semua Data Transaksi */}
            <button
              type="button"
              onClick={() => setDeleteModalState({ isOpen: true, mode: 'all' })}
              className="px-4 py-2.5 bg-red-600/30 hover:bg-red-600 border border-red-500/50 active:scale-95 text-red-200 hover:text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
              title="Kosongkan seluruh data transaksi lelang"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus Semua</span>
            </button>
          </div>
        </div>
      </div>

      {/* Period Selector Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl overflow-x-auto">
            {(['harian', 'bulanan', 'tahunan', 'kustom', 'semua'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setPeriodType(mode)}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap cursor-pointer ${
                  periodType === mode
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {mode === 'harian' && '📅 Laporan Harian'}
                {mode === 'bulanan' && '🗓️ Laporan Bulanan'}
                {mode === 'tahunan' && '📊 Laporan Tahunan'}
                {mode === 'kustom' && '⚙️ Rentang Kustom'}
                {mode === 'semua' && '🌐 Semua Riwayat'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Periode Aktif:</span>
            <span className="px-3 py-1 bg-teal-50 border border-teal-200 text-teal-900 font-bold rounded-lg font-mono">
              {periodLabel}
            </span>
          </div>
        </div>

        {/* Dynamic Period Inputs */}
        <div className="flex flex-wrap items-center gap-3">
          {periodType === 'harian' && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleShiftDay(-1)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                &larr; Hari Sebelumnya
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => handleShiftDay(1)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                Hari Berikutnya &rarr;
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(currentDateStr)}
                className="px-3 py-2 bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Hari Ini ({currentDateStr})
              </button>
            </div>
          )}

          {periodType === 'bulanan' && (
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              >
                {[
                  { m: 1, name: 'Januari' },
                  { m: 2, name: 'Februari' },
                  { m: 3, name: 'Maret' },
                  { m: 4, name: 'April' },
                  { m: 5, name: 'Mei' },
                  { m: 6, name: 'Juni' },
                  { m: 7, name: 'Juli' },
                  { m: 8, name: 'Agustus' },
                  { m: 9, name: 'September' },
                  { m: 10, name: 'Oktober' },
                  { m: 11, name: 'November' },
                  { m: 12, name: 'Desember' },
                ].map((item) => (
                  <option key={item.m} value={item.m}>
                    {item.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              >
                {[2024, 2025, 2026, 2027, 2028].map((yr) => (
                  <option key={yr} value={yr}>
                    Tahun {yr}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setSelectedMonth(currentSimulatedDate.getMonth() + 1);
                  setSelectedYear(currentSimulatedDate.getFullYear());
                }}
                className="px-3 py-2 bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Bulan Ini
              </button>
            </div>
          )}

          {periodType === 'tahunan' && (
            <div className="flex items-center gap-2">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              >
                {[2024, 2025, 2026, 2027, 2028].map((yr) => (
                  <option key={yr} value={yr}>
                    Tahun Buku {yr}
                  </option>
                ))}
              </select>
            </div>
          )}

          {periodType === 'kustom' && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Mulai:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold bg-white focus:outline-hidden"
              />
              <span className="text-xs font-semibold text-slate-500">Sampai:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold bg-white focus:outline-hidden"
              />
            </div>
          )}
        </div>
      </div>

      {/* Executive Financial Highlights (6 Metric Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Total Volume & Transaksi */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Volume Hasil Tambak</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {summaryData.totalWeightKg.toLocaleString('id-ID')} <span className="text-sm font-bold text-slate-500">Kg</span>
            </div>
            <div className="text-xs text-teal-700 font-semibold mt-1">
              ≈ {(summaryData.totalWeightKg / 1000).toFixed(2)} Ton &bull; {summaryData.totalTransactions} Transaksi Lot
            </div>
          </div>
        </div>

        {/* Card 2: Total Nilai Kotor X */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Omzet Lelang Kotor (X)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-slate-900 tracking-tight">
              {formatIDR(summaryData.totalGrossPrice)}
            </div>
            <div className="text-xs text-slate-500 font-semibold mt-1">
              Rata-rata: {formatIDR(summaryData.avgPricePerKg)} / Kg
            </div>
          </div>
        </div>

        {/* Card 3: Cair Bersih Petani */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Cair Petani Segera (Hari H)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-emerald-700 tracking-tight">
              {formatIDR(summaryData.totalFarmerNetPaid)}
            </div>
            <div className="text-xs text-emerald-800 font-semibold mt-1">
              Setelah dipotong jasa tier (8%/6%/3%)
            </div>
          </div>
        </div>

        {/* Card 4: Retensi 1% Petani (3 Bulan) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Hak Retensi 1% Petani</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-amber-700 tracking-tight">
              {formatIDR(summaryData.totalFarmerRetention)}
            </div>
            <div className="text-xs text-amber-800 font-semibold mt-1">
              Simpanan wajib 3 bulan yang dikembalikan ke petani
            </div>
          </div>
        </div>

        {/* Card 5: Kas Koperasi Bersih */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Pendapatan Bersih Kas Koperasi</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-800 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-cyan-900 tracking-tight">
              {formatIDR(summaryData.totalKoperasiGrossRevenue)}
            </div>
            <div className="text-xs text-cyan-800 font-semibold mt-1">
              Bagian jasa bersih petani + bagian kas pembeli
            </div>
          </div>
        </div>

        {/* Card 6: Tagihan Masuk Bakul */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Tagihan Bakul (+6%)</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-indigo-950 tracking-tight">
              {formatIDR(summaryData.totalBakulPayable)}
            </div>
            <div className="text-xs text-indigo-800 font-semibold mt-1">
              Biaya tambahan +6%: {formatIDR(summaryData.totalBakulAdditional6Percent)}
            </div>
          </div>
        </div>
      </div>

      {/* Commodity Breakdown Table */}
      {summaryData.commodityStats.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Rekapitulasi Menurut Jenis Komoditas
              </h3>
              <p className="text-xs text-slate-500">
                Pangsa pasar, volume, dan omzet lelang per komoditas dalam periode {periodLabel}
              </p>
            </div>
            <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-700">
              {summaryData.commodityStats.length} Komoditas Aktif
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nama Komoditas</th>
                  <th className="py-3 px-4 text-right">Total Bobot (Kg)</th>
                  <th className="py-3 px-4 text-center">Pangsa Volume</th>
                  <th className="py-3 px-4 text-right">Rata-rata Harga / Kg</th>
                  <th className="py-3 px-4 text-right">Total Omzet Bruto</th>
                  <th className="py-3 px-4 text-center">Jumlah Batch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summaryData.commodityStats.map((item) => {
                  const sharePercent = summaryData.totalWeightKg > 0 
                    ? ((item.weightKg / summaryData.totalWeightKg) * 100).toFixed(1)
                    : '0';
                  return (
                    <tr key={item.category} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                        <span>{commodityMasters.find((m) => m.name === item.category)?.icon || '🐟'}</span>
                        <span>{item.category}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {item.weightKg.toLocaleString('id-ID')} Kg
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800">
                          {sharePercent}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {formatIDR(item.avgPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-teal-900">
                        {formatIDR(item.grossPrice)}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">
                        {item.txCount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Detail Transactions Table with Search, Edit, and Delete */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Controls */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Daftar Detail Transaksi Lelang
              </h3>
              <span className="px-2.5 py-0.5 bg-slate-900 text-white rounded-full text-xs font-bold">
                {displayLedgers.length} Transaksi
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Gunakan tombol aksi di setiap baris untuk melakukan koreksi (edit) atau menghapus data lelang.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari petani, bakul, komoditas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            {/* Commodity Filter */}
            <select
              value={commodityFilter}
              onChange={(e) => setCommodityFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-hidden"
            >
              <option value="all">Semua Komoditas</option>
              {commodityMasters.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Content */}
        {displayLedgers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">Tidak ada data transaksi lelang pada periode ini</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Coba ganti rentang tanggal di bagian atas atau gunakan tombol "Impor .xlsx" untuk memasukkan data.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">No. Timbang & Tgl</th>
                  <th className="py-3 px-4">Petani (Penjual)</th>
                  <th className="py-3 px-4">Bakul (Pembeli)</th>
                  <th className="py-3 px-4">Komoditas</th>
                  <th className="py-3 px-4 text-right">Bobot</th>
                  <th className="py-3 px-4 text-right">Harga / Kg</th>
                  <th className="py-3 px-4 text-right">Nilai Kotor (X)</th>
                  <th className="py-3 px-4 text-right">Cair Petani</th>
                  <th className="py-3 px-4 text-right">Tagihan Bakul</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayLedgers.map((l) => (
                  <tr key={l.id} className="hover:bg-teal-50/30 transition-colors">
                    <td className="py-3 px-4 font-mono">
                      <span className="font-bold text-slate-900 block">{l.id}</span>
                      <span className="text-[10px] text-slate-400">{l.createdAt.split('T')[0]}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800 block">{l.farmerName}</span>
                      <span className="text-[10px] text-slate-500">Tier Potongan: {l.discountTier}%</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-indigo-950 block">{l.bakulName}</span>
                      <span className="text-[10px] text-indigo-600">+6% Tambahan</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {l.commodityCategory}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {l.weightKg} Kg
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {formatIDR(l.pricePerKg)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatIDR(l.grossPrice)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      {formatIDR(l.netFarmerAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-indigo-900">
                      {formatIDR(l.totalBakulPayable)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => setEditingTransaction(l)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-cyan-700 hover:bg-cyan-50 transition-colors cursor-pointer"
                          title="Edit transaksi ini"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Print Receipt Button */}
                        {onOpenReceipt && (
                          <button
                            type="button"
                            onClick={() => onOpenReceipt(l)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                            title="Cetak nota timbang"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => setDeleteModalState({ isOpen: true, mode: 'single', targetLedger: l })}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Hapus transaksi ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        transaction={editingTransaction}
        users={users}
        commodityMasters={commodityMasters}
        onSave={onUpdateLedger}
      />

      {/* Import Excel Modal */}
      <ImportExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={onImportLedgers}
      />

      {/* Delete / Delete All Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, mode: 'single', targetLedger: null })}
        mode={deleteModalState.mode}
        targetLedger={deleteModalState.targetLedger}
        totalCount={ledgers.length}
        onConfirmSingle={onDeleteLedger}
        onConfirmDeleteAll={onDeleteAllLedgers}
      />
    </div>
  );
};
