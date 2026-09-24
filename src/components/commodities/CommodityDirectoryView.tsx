import React, { useState, useMemo } from 'react';
import { 
  Fish, 
  PlusCircle, 
  Search, 
  TrendingUp, 
  Scale, 
  DollarSign, 
  Layers, 
  PieChart, 
  ChevronRight, 
  ChevronDown, 
  Filter, 
  ExternalLink,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  FileSpreadsheet
} from 'lucide-react';
import { CommodityMaster, Commodity, Auction, TransactionLedger } from '../../types';

interface CommodityDirectoryViewProps {
  commodityMasters: CommodityMaster[];
  commodities: Commodity[];
  auctions: Auction[];
  ledgers: TransactionLedger[];
  onOpenAddModal: () => void;
  onSelectCommodityForWeighing?: (commodityName: string) => void;
}

export const CommodityDirectoryView: React.FC<CommodityDirectoryViewProps> = ({
  commodityMasters,
  commodities,
  auctions,
  ledgers,
  onOpenAddModal,
  onSelectCommodityForWeighing,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'weight' | 'value' | 'txCount' | 'name'>('weight');
  const [expandedCommodity, setExpandedCommodity] = useState<string | null>(null);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Aggregate stats per commodity
  const statsPerCommodity = useMemo(() => {
    // Map of commodity name -> stats
    const statsMap: Record<string, {
      name: string;
      totalWeightKg: number;
      totalGrossValue: number;
      totalFarmerNet: number;
      totalRetention1Percent: number;
      totalKoperasiIncome: number;
      txCount: number;
      activeAuctionsCount: number;
      batches: {
        id: string;
        date: string;
        farmerName: string;
        bakulName?: string;
        weightKg: number;
        pricePerKg: number;
        grossPrice: number;
        status: string;
      }[];
    }> = {};

    // Initialize with all masters
    commodityMasters.forEach((m) => {
      statsMap[m.name] = {
        name: m.name,
        totalWeightKg: 0,
        totalGrossValue: 0,
        totalFarmerNet: 0,
        totalRetention1Percent: 0,
        totalKoperasiIncome: 0,
        txCount: 0,
        activeAuctionsCount: 0,
        batches: [],
      };
    });

    // Process all transaction ledgers (completed sales)
    ledgers.forEach((l) => {
      const cat = l.commodityCategory;
      if (!statsMap[cat]) {
        statsMap[cat] = {
          name: cat,
          totalWeightKg: 0,
          totalGrossValue: 0,
          totalFarmerNet: 0,
          totalRetention1Percent: 0,
          totalKoperasiIncome: 0,
          txCount: 0,
          activeAuctionsCount: 0,
          batches: [],
        };
      }

      statsMap[cat].totalWeightKg += l.weightKg;
      statsMap[cat].totalGrossValue += l.grossPrice;
      statsMap[cat].totalFarmerNet += l.netFarmerAmount;
      statsMap[cat].totalRetention1Percent += l.farmerRetention1Percent;
      statsMap[cat].totalKoperasiIncome += l.koperasiFarmerIncome + l.bakulMonthlyBill3Percent;
      statsMap[cat].txCount += 1;

      statsMap[cat].batches.push({
        id: l.id,
        date: l.createdAt.split('T')[0],
        farmerName: l.farmerName,
        bakulName: l.bakulName,
        weightKg: l.weightKg,
        pricePerKg: l.pricePerKg,
        grossPrice: l.grossPrice,
        status: 'Terjual (Lunas)',
      });
    });

    // Check active auctions in progress that haven't entered ledgers yet
    auctions.forEach((a) => {
      if (a.status === 'live' || a.status === 'scheduled') {
        const cat = a.commodity.category;
        if (!statsMap[cat]) {
          statsMap[cat] = {
            name: cat,
            totalWeightKg: 0,
            totalGrossValue: 0,
            totalFarmerNet: 0,
            totalRetention1Percent: 0,
            totalKoperasiIncome: 0,
            txCount: 0,
            activeAuctionsCount: 0,
            batches: [],
          };
        }

        statsMap[cat].activeAuctionsCount += 1;
        // Also account in ongoing weight
        statsMap[cat].totalWeightKg += a.commodity.initialWeightKg;
        const estGross = a.commodity.initialWeightKg * a.currentBidPerKg;
        statsMap[cat].totalGrossValue += estGross;
        statsMap[cat].txCount += 1;

        statsMap[cat].batches.push({
          id: a.id,
          date: a.createdAt.split('T')[0],
          farmerName: a.commodity.farmerName,
          bakulName: a.winningBakulName ? `${a.winningBakulName} (Memimpin)` : 'Belum Ada Penawar',
          weightKg: a.commodity.initialWeightKg,
          pricePerKg: a.currentBidPerKg,
          grossPrice: estGross,
          status: 'Sedang Berjalan di TPI',
        });
      }
    });

    return statsMap;
  }, [commodityMasters, ledgers, auctions]);

  // Overall totals across ALL commodities
  const grandTotals = useMemo(() => {
    let totalKg = 0;
    let totalRp = 0;
    let totalFarmerCair = 0;
    let totalRetensi = 0;
    let totalKoperasi = 0;
    let totalBatches = 0;

    Object.values(statsPerCommodity).forEach((s) => {
      totalKg += s.totalWeightKg;
      totalRp += s.totalGrossValue;
      totalFarmerCair += s.totalFarmerNet;
      totalRetensi += s.totalRetention1Percent;
      totalKoperasi += s.totalKoperasiIncome;
      totalBatches += s.txCount;
    });

    const avgPricePerKg = totalKg > 0 ? Math.round(totalRp / totalKg) : 0;

    return {
      totalKg,
      totalRp,
      totalFarmerCair,
      totalRetensi,
      totalKoperasi,
      totalBatches,
      avgPricePerKg,
    };
  }, [statsPerCommodity]);

  // Filtered & sorted masters
  const processedMasters = useMemo(() => {
    return commodityMasters
      .filter((m) => {
        const query = searchTerm.toLowerCase();
        return (
          m.name.toLowerCase().includes(query) ||
          m.code.toLowerCase().includes(query) ||
          m.defaultVariety.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        const statA = statsPerCommodity[a.name] || { totalWeightKg: 0, totalGrossValue: 0, txCount: 0 };
        const statB = statsPerCommodity[b.name] || { totalWeightKg: 0, totalGrossValue: 0, txCount: 0 };

        if (sortBy === 'weight') return statB.totalWeightKg - statA.totalWeightKg;
        if (sortBy === 'value') return statB.totalGrossValue - statA.totalGrossValue;
        if (sortBy === 'txCount') return statB.txCount - statA.txCount;
        return a.name.localeCompare(b.name);
      });
  }, [commodityMasters, searchTerm, sortBy, statsPerCommodity]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-teal-100 text-teal-800 border border-teal-200 flex items-center gap-1.5">
                <Fish className="w-3.5 h-3.5 text-teal-700" />
                <span>Master & Rekapitulasi Komoditas TPI</span>
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">
                {commodityMasters.length} Komoditas Aktif
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Katalog Komoditas & Rekap Total Penimbangan
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Lihat ringkasan total volume bobot (Kg), omzet lelang (Rp), dan sebaran bagi hasil koperasi untuk setiap komoditas udang, ikan, dan biota tambak.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenAddModal}
              className="px-5 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-2xl text-sm font-bold shadow-md shadow-cyan-600/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tambah Komoditas Baru</span>
            </button>
          </div>
        </div>

        {/* Global Summary KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Tonase Masuk
              </span>
              <Scale className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-slate-900">
              {grandTotals.totalKg.toLocaleString('id-ID', { maximumFractionDigits: 2 })} <span className="text-sm font-bold text-slate-500">Kg</span>
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
              {(grandTotals.totalKg / 1000).toFixed(2)} Ton dari {grandTotals.totalBatches} batch panen
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-800">
                Total Omzet Lelang (Bruto)
              </span>
              <TrendingUp className="w-4 h-4 text-cyan-700" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-cyan-950">
              {formatIDR(grandTotals.totalRp)}
            </div>
            <span className="text-[11px] text-cyan-700 font-semibold block mt-0.5">
              Rata-rata: {formatIDR(grandTotals.avgPricePerKg)} / Kg
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                Total Retensi 1% Tersimpan
              </span>
              <PieChart className="w-4 h-4 text-amber-700" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-amber-950">
              {formatIDR(grandTotals.totalRetensi)}
            </div>
            <span className="text-[11px] text-amber-700 font-semibold block mt-0.5">
              Tabungan aman 3 bulan petani
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">
                Total Kas Jasa Koperasi
              </span>
              <DollarSign className="w-4 h-4 text-indigo-700" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-indigo-950">
              {formatIDR(grandTotals.totalKoperasi)}
            </div>
            <span className="text-[11px] text-indigo-700 font-semibold block mt-0.5">
              Potongan penjual + tagihan 3% bakul
            </span>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari nama komoditas, kode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Urutkan:</span>
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
          >
            <option value="weight">Bobot Terbanyak (Kg)</option>
            <option value="value">Nilai Omzet Tertinggi (Rp)</option>
            <option value="txCount">Jumlah Transaksi Terbanyak</option>
            <option value="name">Nama Komoditas (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Cards Grid: Each Commodity Detail & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {processedMasters.map((master) => {
          const stats = statsPerCommodity[master.name] || {
            name: master.name,
            totalWeightKg: 0,
            totalGrossValue: 0,
            totalFarmerNet: 0,
            totalRetention1Percent: 0,
            totalKoperasiIncome: 0,
            txCount: 0,
            activeAuctionsCount: 0,
            batches: [],
          };

          const avgPrice = stats.totalWeightKg > 0 ? Math.round(stats.totalGrossValue / stats.totalWeightKg) : master.defaultPricePerKg;
          const sharePercent = grandTotals.totalKg > 0 ? ((stats.totalWeightKg / grandTotals.totalKg) * 100).toFixed(1) : '0';
          const isExpanded = expandedCommodity === master.id;

          return (
            <div
              key={master.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              <div className="p-5 space-y-4">
                {/* Header Card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-2xl shadow-inner shrink-0">
                      {master.icon || '🐟'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                          {master.name}
                        </h3>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-mono text-[10px] font-bold">
                          {master.code}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 block mt-0.5">
                        {master.defaultVariety}
                      </span>
                    </div>
                  </div>

                  {stats.activeAuctionsCount > 0 ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-xs animate-pulse flex items-center gap-1 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      <span>{stats.activeAuctionsCount} Lelang Live</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500 shrink-0">
                      {stats.txCount} Batch
                    </span>
                  )}
                </div>

                {/* Primary Metrics: Total Bobot & Total Nilai */}
                <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                      Total Bobot Ditimbang
                    </span>
                    <div className="text-lg font-black font-mono text-slate-900">
                      {stats.totalWeightKg.toLocaleString('id-ID', { maximumFractionDigits: 2 })} <span className="text-xs font-bold text-slate-500">{master.unit}</span>
                    </div>
                    <span className="text-[10px] font-bold text-teal-700">
                      {sharePercent}% dari total panen TPI
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                      Total Nilai Omzet
                    </span>
                    <div className="text-lg font-black font-mono text-cyan-900">
                      {formatIDR(stats.totalGrossValue)}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      Rata-rata: {formatIDR(avgPrice)}/{master.unit}
                    </span>
                  </div>
                </div>

                {/* Breakdown Bagi Hasil Komoditas */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Cair Bersih ke Petani:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {formatIDR(stats.totalFarmerNet)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Simpanan Retensi 1% Petani:</span>
                    <span className="font-mono font-bold text-amber-700">
                      {formatIDR(stats.totalRetention1Percent)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500">Kontribusi Kas Koperasi:</span>
                    <span className="font-mono font-bold text-indigo-700">
                      {formatIDR(stats.totalKoperasiIncome)}
                    </span>
                  </div>
                </div>

                {master.description && (
                  <p className="text-[11px] text-slate-500 italic bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                    {master.description}
                  </p>
                )}

                {/* Expandable Batch History for this commodity */}
                {isExpanded && (
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-teal-600" />
                        <span>Riwayat Lot Panen ({stats.batches.length}):</span>
                      </span>
                    </div>

                    {stats.batches.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                        Belum ada riwayat transaksi lelang untuk komoditas ini.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {stats.batches.map((batch, idx) => (
                          <div
                            key={batch.id + idx}
                            className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between font-semibold">
                              <span className="text-slate-900">{batch.farmerName}</span>
                              <span className="font-mono font-bold text-emerald-700">
                                {formatIDR(batch.grossPrice)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                              <span>
                                {batch.weightKg} Kg @ {formatIDR(batch.pricePerKg)}
                              </span>
                              <span className="text-[10px] font-bold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                {batch.status}
                              </span>
                            </div>
                            {batch.bakulName && (
                              <span className="text-[10px] text-indigo-700 block">
                                Pembeli: {batch.bakulName}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Actions Card */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setExpandedCommodity(isExpanded ? null : master.id)}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 py-1"
                >
                  <span>{isExpanded ? 'Tutup Rincian' : `Lihat Lot (${stats.batches.length})`}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {onSelectCommodityForWeighing && (
                  <button
                    type="button"
                    onClick={() => onSelectCommodityForWeighing(master.name)}
                    className="px-3 py-1.5 bg-white hover:bg-teal-50 text-teal-700 border border-teal-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Timbang Ini</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Comprehensive Comparison & Recap Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 md:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-teal-600" />
              <span>Tabel Rekapitulasi Total Komoditas Terpadu</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Perbandingan total bobot, omzet, rata-rata harga, serta pembagian kas antar komoditas di KUD Mina Karya Bhukti
            </p>
          </div>
          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold self-start sm:self-auto font-mono">
            {commodityMasters.length} Komoditas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Komoditas & Kode</th>
                <th className="py-3 px-4 text-right">Total Bobot (Kg)</th>
                <th className="py-3 px-4 text-center">Share (%)</th>
                <th className="py-3 px-4 text-right">Total Omzet Lelang</th>
                <th className="py-3 px-4 text-right">Rata-rata /Kg</th>
                <th className="py-3 px-4 text-right">Cair Petani</th>
                <th className="py-3 px-4 text-right">Retensi 1%</th>
                <th className="py-3 px-4 text-right">Kas Koperasi</th>
                <th className="py-3 px-4 text-center">Batch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {processedMasters.map((m) => {
                const s = statsPerCommodity[m.name] || {
                  totalWeightKg: 0,
                  totalGrossValue: 0,
                  totalFarmerNet: 0,
                  totalRetention1Percent: 0,
                  totalKoperasiIncome: 0,
                  txCount: 0,
                };

                const avg = s.totalWeightKg > 0 ? Math.round(s.totalGrossValue / s.totalWeightKg) : m.defaultPricePerKg;
                const share = grandTotals.totalKg > 0 ? ((s.totalWeightKg / grandTotals.totalKg) * 100).toFixed(1) : '0';

                return (
                  <tr key={m.id} className="hover:bg-teal-50/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{m.icon}</span>
                        <div>
                          <span className="font-extrabold text-slate-900 block">{m.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{m.code} &bull; {m.defaultVariety}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {s.totalWeightKg.toLocaleString('id-ID', { maximumFractionDigits: 2 })} Kg
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-semibold text-teal-800">
                      <span className="px-2 py-0.5 bg-teal-50 border border-teal-200 rounded-lg">
                        {share}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-cyan-900">
                      {formatIDR(s.totalGrossValue)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                      {formatIDR(avg)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-700 font-semibold">
                      {formatIDR(s.totalFarmerNet)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-amber-700 font-semibold">
                      {formatIDR(s.totalRetention1Percent)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-indigo-700 font-semibold">
                      {formatIDR(s.totalKoperasiIncome)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-600">
                      {s.txCount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900 text-white font-black">
                <td className="py-4 px-4 font-bold text-sm">
                  TOTAL REKAPITULASI (SEMUA KOMODITAS)
                </td>
                <td className="py-4 px-4 text-right font-mono text-emerald-400 text-sm">
                  {grandTotals.totalKg.toLocaleString('id-ID', { maximumFractionDigits: 2 })} Kg
                </td>
                <td className="py-4 px-4 text-center font-mono text-xs text-teal-300">
                  100%
                </td>
                <td className="py-4 px-4 text-right font-mono text-cyan-300 text-sm">
                  {formatIDR(grandTotals.totalRp)}
                </td>
                <td className="py-4 px-4 text-right font-mono text-xs text-slate-300">
                  {formatIDR(grandTotals.avgPricePerKg)}
                </td>
                <td className="py-4 px-4 text-right font-mono text-emerald-300 text-xs">
                  {formatIDR(grandTotals.totalFarmerCair)}
                </td>
                <td className="py-4 px-4 text-right font-mono text-amber-300 text-xs">
                  {formatIDR(grandTotals.totalRetensi)}
                </td>
                <td className="py-4 px-4 text-right font-mono text-indigo-300 text-xs">
                  {formatIDR(grandTotals.totalKoperasi)}
                </td>
                <td className="py-4 px-4 text-center font-mono text-xs">
                  {grandTotals.totalBatches}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
