import React, { useState } from 'react';
import { 
  Fish, 
  Wallet, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ArrowUpRight, 
  Calendar, 
  ChevronRight, 
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { User, UserRole, TransactionLedger } from '../../types';
import { formatIDR, formatIndoDate } from '../../services/calculationEngine';

interface PetaniViewProps {
  currentUser: User;
  allFarmers: User[];
  onSelectFarmer: (farmerId: string) => void;
  ledgers: TransactionLedger[];
  onClaimRetention: (ledgerId: string) => void;
  loggedInRole?: UserRole;
}

export const PetaniView: React.FC<PetaniViewProps> = ({
  currentUser,
  allFarmers,
  onSelectFarmer,
  ledgers,
  onClaimRetention,
  loggedInRole = 'petani',
}) => {
  // Filter transactions belonging to active farmer
  const farmerLedgers = ledgers.filter((l) => l.farmerId === currentUser.id);

  // Financial metrics for this farmer
  const totalGrossSold = farmerLedgers.reduce((acc, curr) => acc + curr.grossPrice, 0);
  const totalNetReceived = farmerLedgers.reduce((acc, curr) => acc + curr.netFarmerAmount, 0);

  // Retention amounts
  const retentionHeld = farmerLedgers
    .filter((l) => l.statusRetention === 'held')
    .reduce((acc, curr) => acc + curr.farmerRetention1Percent, 0);

  const retentionReady = farmerLedgers
    .filter((l) => l.statusRetention === 'ready_to_release')
    .reduce((acc, curr) => acc + curr.farmerRetention1Percent, 0);

  const retentionReleased = farmerLedgers
    .filter((l) => l.statusRetention === 'released')
    .reduce((acc, curr) => acc + curr.farmerRetention1Percent, 0);

  const [filterStatus, setFilterStatus] = useState<'all' | 'ready' | 'held' | 'released'>('all');

  const displayedLedgers = farmerLedgers.filter((l) => {
    if (filterStatus === 'ready') return l.statusRetention === 'ready_to_release';
    if (filterStatus === 'held') return l.statusRetention === 'held';
    if (filterStatus === 'released') return l.statusRetention === 'released';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Farmer Identity */}
      <div className="bg-gradient-to-r from-amber-900 via-orange-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-amber-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Fish className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">Portal Hasil Panen & Dompet Petani</h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Petambak Terdaftar
                </span>
              </div>
              <p className="text-xs text-amber-200/80 mt-0.5">
                {currentUser.name} &bull; {currentUser.tambakLocation || 'Tambak Pantura'}
              </p>
            </div>
          </div>

          {/* Quick Switch between Petani users (Only visible to admin / manager supervising) */}
          {loggedInRole === 'admin' || loggedInRole === 'manager' ? (
            <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-xl border border-white/10 text-xs">
              <span className="text-slate-300 text-[11px] pl-1">Pratinjau Petani:</span>
              <select
                value={currentUser.id}
                onChange={(e) => onSelectFarmer(e.target.value)}
                className="bg-slate-900 text-white border border-slate-700 rounded-lg px-2 py-1 text-xs focus:outline-hidden"
              >
                {allFarmers.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex flex-col sm:items-end gap-1 text-xs">
              {currentUser.bankAccount && (
                <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-right">
                  <span className="text-[10px] text-amber-200 block uppercase font-bold">Rekening Penerimaan Dana:</span>
                  <span className="font-mono text-white text-[11px] font-bold">
                    {currentUser.bankAccount.bankName} - {currentUser.bankAccount.accountNumber}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* KPI Dompet & Saldo Petani */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Dana Bersih Cair Segera */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-200 bg-emerald-50/20 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-emerald-800 text-xs">
            <span className="font-bold uppercase tracking-wider">Dana Bersih Diterima Segera</span>
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-800 font-mono">
            {formatIDR(totalNetReceived)}
          </div>
          <p className="text-[11px] text-slate-500">
            Total penerimaan tunai setelah potongan jasa ({farmerLedgers.length} kali panen)
          </p>
        </div>

        {/* Card 2: Saldo Retensi Siap Cair (>= 3 Bulan) */}
        <div className="bg-gradient-to-br from-amber-600 via-amber-700 to-orange-700 text-white rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-amber-100 text-xs">
            <span className="font-bold uppercase tracking-wider">Hak 1% Siap Dicairkan!</span>
            <div className="p-1.5 rounded-lg bg-white/20 text-white">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {formatIDR(retentionReady)}
          </div>
          <p className="text-[11px] text-amber-100/90">
            {retentionReady > 0
              ? 'Telah melewati masa tahan 3 bulan dan siap dicairkan ke rekening'
              : 'Belum ada retensi yang jatuh tempo saat ini'}
          </p>
        </div>

        {/* Card 3: Saldo Retensi Sedang Ditahan */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-slate-600 text-xs">
            <span className="font-bold uppercase tracking-wider">Retensi 1% Sedang Ditahan</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800 font-mono">
            {formatIDR(retentionHeld)}
          </div>
          <p className="text-[11px] text-slate-500">
            Menunggu genap 3 bulan dari tanggal lelang masing-masing
          </p>
        </div>
      </div>

      {/* Info Card: Transparansi Aturan 1% Retensi */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 space-y-1">
          <span className="font-bold text-sm block">Bagaimana Cara Kerja Hak Petani (Retensi 1%)?</span>
          <p className="leading-relaxed">
            Dari setiap panen yang Anda lelangkan, koperasi memotong jasa (8%, 6%, atau 3%). 
            Sebesar <strong>1% dari total nilai lelang (X)</strong> adalah hak mutlak Anda yang disimpan sebagai dana tabungan cadangan lelang dan dijadwalkan cair otomatis <strong>tepat 3 bulan</strong> setelah tanggal lelang.
          </p>
        </div>
      </div>

      {/* Tabel Riwayat Lelang & Status Retensi */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Riwayat Hasil Lelang & Potongan Panen
            </h3>
            <p className="text-xs text-slate-500">
              Rincian transparan potongan jasa koperasi dan status penundaan dana 3 bulan
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                filterStatus === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({farmerLedgers.length})
            </button>
            <button
              onClick={() => setFilterStatus('ready')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                filterStatus === 'ready'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Siap Cair
            </button>
            <button
              onClick={() => setFilterStatus('held')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                filterStatus === 'held'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Ditahan (3 Bln)
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {displayedLedgers.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Tidak ada catatan transaksi untuk kategori ini.
            </div>
          ) : (
            displayedLedgers.map((tx) => (
              <div
                key={tx.id}
                className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all space-y-4 bg-slate-50/40"
              >
                {/* Header per transaksi */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {tx.id}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{tx.commodityCategory}</span>
                      <span className="text-xs text-slate-500 block">
                        {tx.weightKg} Kg &bull; Pemenang Lelang: <strong>{tx.bakulName}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Tgl Lelang: {formatIndoDate(tx.createdAt)}</span>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      Nilai Lelang (X): {formatIDR(tx.grossPrice)}
                    </span>
                  </div>
                </div>

                {/* Grid Rincian Keuangan Petani */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  {/* Kolom 1: Total Potongan */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Total Potongan ({tx.discountTier}%):</span>
                      <span className="font-bold text-red-600 font-mono text-sm sm:text-base">
                        -{formatIDR(tx.farmerCutAmount)}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1 pt-1 border-t border-slate-100">
                      Bagian Koperasi ({tx.discountTier - 1}%): {formatIDR(tx.koperasiFarmerIncome)}
                    </span>
                  </div>

                  {/* Kolom 2: Cair Segera */}
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col justify-between">
                    <div>
                      <span className="text-emerald-800 font-semibold block text-[11px]">Cair Segera (Tunai / Rekening):</span>
                      <span className="font-black text-emerald-700 font-mono text-sm sm:text-base">
                        {formatIDR(tx.netFarmerAmount)}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-700 block mt-1 pt-1 border-t border-emerald-100 font-medium">
                      ✓ Telah ditransfer ke rekening bank
                    </span>
                  </div>

                  {/* Kolom 3: Retensi 1% */}
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex flex-col justify-between">
                    <div>
                      <span className="text-amber-800 font-semibold block text-[11px]">Hak Retensi 1% (Tabungan):</span>
                      <span className="font-bold text-amber-700 font-mono text-sm sm:text-base">
                        {formatIDR(tx.farmerRetention1Percent)}
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-800 block mt-1 pt-1 border-t border-amber-100 font-mono">
                      Jatuh Tempo: {tx.retentionDueDate}
                    </span>
                  </div>

                  {/* Kolom 4: Status & Tombol Cairkan */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col justify-between gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-slate-500 font-medium">Status Retensi:</span>
                      {tx.statusRetention === 'released' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Sudah Cair
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
                    </div>

                    {tx.statusRetention === 'ready_to_release' ? (
                      <button
                        onClick={() => onClaimRetention(tx.id)}
                        className="w-full min-h-[38px] py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-600/20 flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                        <span>Klaim Saldo Retensi</span>
                      </button>
                    ) : tx.statusRetention === 'released' ? (
                      <span className="text-[11px] text-emerald-600 text-center font-bold py-1 bg-emerald-50 rounded-lg">
                        ✓ Berhasil dicairkan
                      </span>
                    ) : (
                      <div className="text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded-lg text-center font-mono">
                        Menunggu s.d {tx.retentionDueDate}
                      </div>
                    )}
                  </div>
                </div>

                {/* Visual Progress Timeline 3 Bulan Retensi */}
                <div className="pt-2 px-3 pb-1 bg-white rounded-xl border border-slate-200 text-[10px] space-y-1.5">
                  <div className="flex items-center justify-between text-slate-500 font-medium">
                    <span>Linimasa Penahanan Retensi 1% (3 Bulan):</span>
                    <span className="font-bold">
                      {tx.statusRetention === 'released'
                        ? '100% (Dicairkan)'
                        : tx.statusRetention === 'ready_to_release'
                        ? '100% (Jatuh Tempo - Siap Cair)'
                        : 'Masa Tunggu (Ditahan Koperasi)'}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-500 ${
                        tx.statusRetention === 'released'
                          ? 'bg-emerald-500 w-full'
                          : tx.statusRetention === 'ready_to_release'
                          ? 'bg-amber-500 w-full animate-pulse'
                          : 'bg-cyan-600 w-1/3'
                      }`}
                    />
                  </div>

                  <div className="flex justify-between text-[9px] text-slate-400">
                    <span>Tgl Panen: {formatIndoDate(tx.createdAt)}</span>
                    <span className="font-mono">Jatuh Tempo: {tx.retentionDueDate}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
