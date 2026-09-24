import React, { useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  PieChart, 
  CheckCircle, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Building, 
  FileCheck2, 
  Receipt,
  Download,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { TransactionLedger, MonthlyBakulInvoice, User } from '../../types';
import { formatIDR, formatIndoDate } from '../../services/calculationEngine';
import { UserAccessManagement } from '../users/UserAccessManagement';

interface ManagerViewProps {
  ledgers: TransactionLedger[];
  invoices: MonthlyBakulInvoice[];
  users?: User[];
  currentLoggedInUser?: User;
  onReleaseRetention: (ledgerId: string) => void;
  onApproveInvoice: (invoiceId: string) => void;
  onOpenReports?: () => void;
  onAddUser?: (user: User) => void;
  onUpdateUser?: (user: User) => void;
  onDeleteUser?: (userId: string) => void;
  onToggleUserStatus?: (userId: string) => void;
}

export const ManagerView: React.FC<ManagerViewProps> = ({
  ledgers,
  invoices,
  users,
  currentLoggedInUser,
  onReleaseRetention,
  onApproveInvoice,
  onOpenReports,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onToggleUserStatus,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [subTab, setSubTab] = useState<'overview' | 'retention' | 'invoices' | 'users'>('overview');

  // Aggregated Financial Metrics
  const totalGross = ledgers.reduce((acc, curr) => acc + curr.grossPrice, 0);
  const totalKoperasiFromFarmers = ledgers.reduce((acc, curr) => acc + curr.koperasiFarmerIncome, 0);
  const totalKoperasiFromBakuls = ledgers.reduce((acc, curr) => acc + curr.koperasiBakulIncome3Percent, 0);
  const totalKoperasiProfit = totalKoperasiFromFarmers + totalKoperasiFromBakuls;

  const totalFarmerPaidInstant = ledgers.reduce((acc, curr) => acc + curr.netFarmerAmount, 0);
  
  // Retention liabilities
  const totalRetentionHeld = ledgers
    .filter((l) => l.statusRetention === 'held')
    .reduce((acc, curr) => acc + curr.farmerRetention1Percent, 0);

  const totalRetentionReady = ledgers
    .filter((l) => l.statusRetention === 'ready_to_release')
    .reduce((acc, curr) => acc + curr.farmerRetention1Percent, 0);

  const totalRetentionReleased = ledgers
    .filter((l) => l.statusRetention === 'released')
    .reduce((acc, curr) => acc + curr.farmerRetention1Percent, 0);

  // Bakul Monthly 3% Receivables
  const totalBakulReceivablePending = ledgers
    .filter((l) => l.statusBakulBill !== 'paid')
    .reduce((acc, curr) => acc + curr.bakulMonthlyBill3Percent, 0);

  const totalBakulCollected = ledgers
    .filter((l) => l.statusBakulBill === 'paid')
    .reduce((acc, curr) => acc + curr.bakulMonthlyBill3Percent, 0);

  // Items ready for approval
  const readyRetentionList = ledgers.filter((l) => l.statusRetention === 'ready_to_release');
  const pendingInvoices = invoices.filter((inv) => inv.status === 'issued');

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-blue-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">Executive Financial Dashboard</h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Manajer Keuangan
                </span>
              </div>
              <p className="text-xs text-blue-200/80 mt-0.5">
                Pengawasan komprehensif bagi hasil, margin bersih koperasi, kewajiban retensi, dan piutang bulanan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {onOpenReports && (
              <button
                type="button"
                onClick={onOpenReports}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Buka Laporan (H/B/T) & Ekspor</span>
              </button>
            )}
            <div className="bg-white/10 px-3 py-2 rounded-xl border border-white/10">
              <span className="text-[11px] text-blue-300 block">Status Tutup Buku</span>
              <span className="font-bold text-white">September 2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards: Revenue & Profit Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Gross Volume */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider">Total Omset Lelang (X)</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {formatIDR(totalGross)}
          </div>
          <p className="text-[11px] text-slate-500">
            Dari {ledgers.length} transaksi lelang komoditas
          </p>
        </div>

        {/* Card 2: Keuntungan Bersih Koperasi */}
        <div className="bg-gradient-to-br from-cyan-900 to-blue-950 text-white rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-cyan-200 text-xs">
            <span className="font-bold uppercase tracking-wider">Total Laba Koperasi</span>
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">
            {formatIDR(totalKoperasiProfit)}
          </div>
          <div className="flex justify-between text-[11px] text-cyan-200/90 pt-1 border-t border-cyan-800">
            <span>Dari Petani: {formatIDR(totalKoperasiFromFarmers)}</span>
            <span>Dari Bakul: {formatIDR(totalKoperasiFromBakuls)}</span>
          </div>
        </div>

        {/* Card 3: Retensi Petani (Kewajiban 3 Bulan) */}
        <div className="bg-white rounded-2xl p-5 border border-amber-200 bg-amber-50/20 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-amber-800 text-xs">
            <span className="font-bold uppercase tracking-wider">Retensi 1% Petani</span>
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 font-mono">
            {formatIDR(totalRetentionHeld + totalRetentionReady)}
          </div>
          <div className="flex justify-between text-[11px] text-slate-600">
            <span className="text-slate-500">Ditahan: {formatIDR(totalRetentionHeld)}</span>
            <span className="text-amber-700 font-bold">Siap Cair: {formatIDR(totalRetentionReady)}</span>
          </div>
        </div>

        {/* Card 4: Piutang Bulanan 3% Bakul */}
        <div className="bg-white rounded-2xl p-5 border border-indigo-200 bg-indigo-50/20 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-indigo-800 text-xs">
            <span className="font-bold uppercase tracking-wider">Piutang 3% Bakul</span>
            <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-800">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-700 font-mono">
            {formatIDR(totalBakulReceivablePending)}
          </div>
          <div className="flex justify-between text-[11px] text-slate-600">
            <span className="text-emerald-700 font-semibold">Terkumpul: {formatIDR(totalBakulCollected)}</span>
            <span className="text-indigo-600 font-medium">Bulan Berjalan</span>
          </div>
        </div>
      </div>

      {/* Action Banners if approvals are pending */}
      {readyRetentionList.length > 0 && (
        <div className="bg-amber-500/10 border-2 border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-amber-900 text-sm">
                Ada {readyRetentionList.length} Dana Retensi Petani yang Sudah Genap 3 Bulan!
              </h4>
              <p className="text-xs text-amber-800">
                Total nominal <strong>{formatIDR(totalRetentionReady)}</strong> berstatus "Siap Dicairkan" dan menunggu otorisasi pencairan manajer.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSubTab('retention')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0"
          >
            Tinjau & Otorisasi Pencairan
          </button>
        </div>
      )}

      {/* Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none flex-nowrap">
        <button
          onClick={() => setSubTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            subTab === 'overview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>Rekap Keuntungan & Arus Kas</span>
        </button>
        <button
          onClick={() => setSubTab('retention')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            subTab === 'retention'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>Otorisasi Retensi 1% Petani</span>
          {readyRetentionList.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
              {readyRetentionList.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setSubTab('invoices')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            subTab === 'invoices'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>Invoice Tagihan Bulanan 3% Bakul ({invoices.length})</span>
          {pendingInvoices.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center font-bold">
              {pendingInvoices.length}
            </span>
          )}
        </button>
        {users && (
          <button
            onClick={() => setSubTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              subTab === 'users'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Pengaturan Akses & Anggota ({users.length})</span>
          </button>
        )}
      </div>

      {/* Content 1: Overview & Keuntungan Terperinci */}
      {subTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kolom 1 & 2: Rincian Sumber Keuntungan Koperasi */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Breakdown Komposisi Pendapatan Jasa Koperasi
                </h3>
                <p className="text-xs text-slate-500">
                  Struktur penerimaan koperasi dari sisi petani (penjual) dan sisi bakul (pembeli)
                </p>
              </div>
              <span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
                Total: {formatIDR(totalKoperasiProfit)}
              </span>
            </div>

            {/* Visual Split Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-slate-600">
                <span>Dari Petani ({Math.round((totalKoperasiFromFarmers / (totalKoperasiProfit || 1)) * 100)}%)</span>
                <span>Dari Bakul 3% ({Math.round((totalKoperasiFromBakuls / (totalKoperasiProfit || 1)) * 100)}%)</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
                <div
                  className="bg-cyan-600 h-full transition-all"
                  style={{ width: `${(totalKoperasiFromFarmers / (totalKoperasiProfit || 1)) * 100}%` }}
                  title="Bagian dari Petani"
                />
                <div
                  className="bg-indigo-600 h-full transition-all"
                  style={{ width: `${(totalKoperasiFromBakuls / (totalKoperasiProfit || 1)) * 100}%` }}
                  title="Bagian dari Bakul"
                />
              </div>
            </div>

            {/* Dua Kartu Komparasi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Petani Side Details */}
              <div className="p-4 rounded-xl border border-cyan-200 bg-cyan-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-900 text-xs uppercase tracking-wider">
                    Sisi Petani (Penjual)
                  </span>
                  <span className="text-xs font-bold text-cyan-700 font-mono">
                    {formatIDR(totalKoperasiFromFarmers)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Berasal dari total potongan (Tier 8%, 6%, atau 3%) setelah dikurangi hak retensi 1% milik petani.
                </p>
                <div className="text-xs space-y-1 pt-2 border-t border-cyan-200 text-slate-700 font-mono">
                  <div className="flex justify-between">
                    <span>• Tier 8% (Koperasi 7%):</span>
                    <span className="font-semibold">Aktif dominan</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Tier 6% (Koperasi 5%):</span>
                    <span className="font-semibold">Khusus anggota</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Tier 3% (Koperasi 2%):</span>
                    <span className="font-semibold">Mitra plasma</span>
                  </div>
                </div>
              </div>

              {/* Bakul Side Details */}
              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-900 text-xs uppercase tracking-wider">
                    Sisi Bakul (Pembeli)
                  </span>
                  <span className="text-xs font-bold text-indigo-700 font-mono">
                    {formatIDR(totalKoperasiFromBakuls)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Berasal dari komponen 3% langsung dari tambahan biaya +6% yang dibayarkan oleh bakul pemenang lelang.
                </p>
                <div className="text-xs space-y-1 pt-2 border-t border-indigo-200 text-slate-700 font-mono">
                  <div className="flex justify-between">
                    <span>• Komponen Koperasi Langsung:</span>
                    <span className="font-semibold">3% dari X</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Komponen Tagihan Berkala:</span>
                    <span className="font-semibold">3% (Invoice 1 Bln)</span>
                  </div>
                  <div className="flex justify-between text-indigo-800 font-bold">
                    <span>• Total Beban Bakul:</span>
                    <span>+6% dari X</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Arus Kas & Saldo Payout */}
            <div className="pt-4 border-t border-slate-200 space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Ringkasan Arus Kas Cair Cepat (Disbursement)
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block">Total Dana Ditransfer Segera ke Petani:</span>
                  <span className="text-lg font-bold text-emerald-700 font-mono">
                    {formatIDR(totalFarmerPaidInstant)}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block">Total Realisasi Retensi yang Sudah Cair:</span>
                  <span className="text-lg font-bold text-blue-700 font-mono">
                    {formatIDR(totalRetentionReleased)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Kolom 3: Kebijakan Likuiditas & Kepatuhan */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <h3 className="font-bold text-slate-900 text-base">Kepatuhan & Pengendalian Resiko</h3>
            
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-cyan-600" />
                Ketentuan Dana Retensi 1%
              </span>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Dana 1% retensi bukan pendapatan koperasi, melainkan titipan hak petani yang wajib diparkir di rekening penampungan likuid (Escrow Account Koperasi) hingga jatuh tempo tepat 3 bulan dari tanggal lelang.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-indigo-600" />
                Ketentuan Piutang 3% Bakul
              </span>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Bakul wajib melunasi akumulasi invoice bulanan maksimal tanggal 10 bulan berikutnya. Keterlambatan dapat menonaktifkan hak penawaran di lelang harian.
              </p>
            </div>

            <div className="pt-2">
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-900 to-teal-950 text-white space-y-2 text-xs">
                <span className="font-bold text-emerald-300 block">Rasio Kesehatan Kas</span>
                <div className="text-xl font-extrabold text-white font-mono">
                  100% Likuid
                </div>
                <p className="text-[11px] text-emerald-200/80">
                  Semua simpanan retensi tergaransi cadangan kas fisik koperasi.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content 2: Otorisasi Retensi Petani 3 Bulan */}
      {subTab === 'retention' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Otorisasi & Manajemen Pencairan Hak Petani (Retensi 1%)
            </h3>
            <p className="text-xs text-slate-500">
              Dana yang telah genap 3 bulan masa penahanan dapat disetujui pencairannya langsung ke rekening bank petani.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">No. Transaksi</th>
                  <th className="py-3 px-4">Petani & Rekening</th>
                  <th className="py-3 px-4">Tgl Lelang</th>
                  <th className="py-3 px-4">Jatuh Tempo (3 Bln)</th>
                  <th className="py-3 px-4 text-right">Nilai Kotor (X)</th>
                  <th className="py-3 px-4 text-right">Saldo Retensi 1%</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Tindakan Otorisasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledgers.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {tx.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{tx.farmerName}</div>
                      <span className="text-[10px] text-slate-500">Koperasi Mina Karya</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {formatIndoDate(tx.createdAt)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-800">
                      {tx.retentionDueDate}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      {formatIDR(tx.grossPrice)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-amber-700 font-mono">
                      {formatIDR(tx.farmerRetention1Percent)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {tx.statusRetention === 'released' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Sudah Ditransfer
                        </span>
                      ) : tx.statusRetention === 'ready_to_release' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                          Siap Dicairkan
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                          Ditahan
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {tx.statusRetention === 'ready_to_release' ? (
                        <button
                          onClick={() => onReleaseRetention(tx.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                        >
                          Setujui & Cairkan
                        </button>
                      ) : tx.statusRetention === 'released' ? (
                        <span className="text-[11px] text-slate-400 font-mono">
                          {tx.retentionReleasedAt ? formatIndoDate(tx.retentionReleasedAt) : 'Selesai'}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          Menunggu Jatuh Tempo
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Content 3: Invoices Bulanan 3% Bakul */}
      {subTab === 'invoices' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Daftar Tagihan Bulanan Komponen 3% Bakul
              </h3>
              <p className="text-xs text-slate-500">
                Rekapitulasi berkala setiap 1 bulan untuk ditagihkan kepada bakul pembeli
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
              {invoices.length} Invoice Diterbitkan
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/40 hover:bg-slate-50 transition-all space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 block">{inv.id}</span>
                    <h4 className="font-bold text-slate-900 text-base">{inv.bakulName}</h4>
                    <span className="text-xs text-indigo-700 font-semibold">
                      Periode: {inv.periodLabel} ({inv.transactionCount} Transaksi)
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                      inv.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-900 border border-amber-200'
                    }`}
                  >
                    {inv.status === 'paid' ? 'Lunas' : 'Belum Dibayar'}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Gross Pembelian:</span>
                    <span>{formatIDR(inv.totalAuctionGross)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-indigo-800 text-sm pt-1 border-t border-slate-100">
                    <span>Tagihan 3% Bulanan:</span>
                    <span>{formatIDR(inv.totalBakul3PercentBill)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                    <span>Batas Pembayaran:</span>
                    <span>{inv.dueDate}</span>
                  </div>
                </div>

                {inv.status !== 'paid' ? (
                  <button
                    onClick={() => onApproveInvoice(inv.id)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Tandai Lunas / Verifikasi Pembayaran
                  </button>
                ) : (
                  <div className="text-center py-2 text-xs text-emerald-700 font-semibold bg-emerald-50 rounded-xl border border-emerald-200">
                    ✓ Lunas Diterima pada {inv.paidAt ? formatIndoDate(inv.paidAt) : 'Sistem'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content 4: Users & Access Management */}
      {subTab === 'users' && users && (
        <UserAccessManagement
          users={users}
          currentLoggedInUser={currentLoggedInUser || users[1]}
          onAddUser={onAddUser || (() => {})}
          onUpdateUser={onUpdateUser || (() => {})}
          onDeleteUser={onDeleteUser || (() => {})}
          onToggleUserStatus={onToggleUserStatus || (() => {})}
        />
      )}
    </div>
  );
};
