import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Gavel, 
  Receipt, 
  FileText, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  CreditCard,
  Building,
  AlertCircle
} from 'lucide-react';
import { User, UserRole, Auction, TransactionLedger, MonthlyBakulInvoice } from '../../types';
import { formatIDR, formatIndoDate } from '../../services/calculationEngine';

interface BakulViewProps {
  currentUser: User;
  allBakuls: User[];
  onSelectBakul: (bakulId: string) => void;
  auctions: Auction[];
  ledgers: TransactionLedger[];
  invoices: MonthlyBakulInvoice[];
  onPlaceBid: (auctionId: string, bakulId: string, bidPricePerKg: number) => void;
  onPayInvoice: (invoiceId: string) => void;
  loggedInRole?: UserRole;
}

export const BakulView: React.FC<BakulViewProps> = ({
  currentUser,
  allBakuls,
  onSelectBakul,
  auctions,
  ledgers,
  invoices,
  onPlaceBid,
  onPayInvoice,
  loggedInRole = 'bakul',
}) => {
  const [activeTab, setActiveTab] = useState<'bidding' | 'history' | 'monthly_bill'>('bidding');

  // Filter for this active bakul
  const bakulLedgers = ledgers.filter((l) => l.bakulId === currentUser.id);
  const bakulInvoices = invoices.filter((inv) => inv.bakulId === currentUser.id);

  // Totals
  const totalPurchasedGross = bakulLedgers.reduce((acc, curr) => acc + curr.grossPrice, 0);
  const totalPaidAdditional6 = bakulLedgers.reduce((acc, curr) => acc + curr.bakulAdditional6Percent, 0);

  // Pending 3% monthly bills
  const unbilled3PercentAmount = bakulLedgers
    .filter((l) => l.statusBakulBill === 'unpaid')
    .reduce((acc, curr) => acc + curr.bakulMonthlyBill3Percent, 0);

  const activeAuction = auctions.find((a) => a.status === 'live');
  const [customBidStep, setCustomBidStep] = useState<number>(1000);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-indigo-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">Portal Bakul & Pembeli Lelang</h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Pembeli Terverifikasi
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                {currentUser.name} &bull; {currentUser.bakulMarketArea || 'Juragan Pasar Ikan'}
              </p>
            </div>
          </div>

          {/* Quick Switch Bakul Profile (Only for admin/manager previewing) */}
          {loggedInRole === 'admin' || loggedInRole === 'manager' ? (
            <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-xl border border-white/10 text-xs">
              <span className="text-slate-300 text-[11px] pl-1">Pratinjau Bakul:</span>
              <select
                value={currentUser.id}
                onChange={(e) => onSelectBakul(e.target.value)}
                className="bg-slate-900 text-white border border-slate-700 rounded-lg px-2 py-1 text-xs focus:outline-hidden"
              >
                {allBakuls.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex flex-col sm:items-end gap-1 text-xs">
              {currentUser.creditLimit !== undefined && (
                <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-right">
                  <span className="text-[10px] text-indigo-200 block uppercase font-bold">Plafon Kredit Lelang:</span>
                  <span className="font-mono text-white text-[11px] font-bold">
                    {formatIDR(currentUser.creditLimit)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Pembelian Bruto */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider">Total Menang Lelang (X)</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {formatIDR(totalPurchasedGross)}
          </div>
          <p className="text-[11px] text-slate-500">
            Total {bakulLedgers.length} transaksi lelang selesai
          </p>
        </div>

        {/* Card 2: Biaya Tambahan 6% */}
        <div className="bg-white rounded-2xl p-5 border border-indigo-200 bg-indigo-50/20 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-indigo-800 text-xs">
            <span className="font-bold uppercase tracking-wider">Komponen Tambahan (+6%)</span>
            <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-800">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-700 font-mono">
            {formatIDR(totalPaidAdditional6)}
          </div>
          <p className="text-[11px] text-indigo-600">
            3% Kas Koperasi Langsung + 3% Tagihan Bulanan
          </p>
        </div>

        {/* Card 3: Tagihan Bulanan 3% Berjalan */}
        <div className="bg-gradient-to-br from-purple-800 to-indigo-900 text-white rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-purple-200 text-xs">
            <span className="font-bold uppercase tracking-wider">Akumulasi 3% Bulan Ini</span>
            <div className="p-1.5 rounded-lg bg-white/20 text-white">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">
            {formatIDR(unbilled3PercentAmount)}
          </div>
          <p className="text-[11px] text-purple-200">
            Akan direkap otomatis pada invoice akhir bulan
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none flex-nowrap">
        <button
          onClick={() => setActiveTab('bidding')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'bidding'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Gavel className="w-4 h-4" />
          <span>Jadwal & Bidding Lelang Hari Ini</span>
          {activeAuction && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'history'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Riwayat Pembelian & Tagihan (+6%)</span>
        </button>
        <button
          onClick={() => setActiveTab('monthly_bill')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'monthly_bill'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Invoice Tagihan Bulanan Komponen 3%</span>
        </button>
      </div>

      {/* Tab 1: Live Bidding */}
      {activeTab === 'bidding' && (
        <div className="space-y-6">
          {activeAuction ? (
            <div className="bg-white rounded-2xl border-2 border-indigo-500 p-5 sm:p-6 shadow-md space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <h3 className="font-extrabold text-slate-900 text-lg">
                      Sesi Lelang Terbuka: {activeAuction.commodity.category}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Bobot: <strong>{activeAuction.commodity.initialWeightKg} Kg</strong> &bull; Varietas: {activeAuction.commodity.variety} &bull; Mutu: {activeAuction.commodity.qualityNotes}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[11px] text-slate-400 block">Harga Tawaran Tertinggi Saat Ini:</span>
                  <span className="text-2xl sm:text-3xl font-black text-indigo-700 font-mono">
                    {formatIDR(activeAuction.currentBidPerKg)} <span className="text-xs font-sans text-slate-500">/ kg</span>
                  </span>
                </div>
              </div>

              {/* Status Pemimpin */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-500">Penawar Tertinggi Saat Ini: </span>
                  <strong className="text-slate-900 text-sm">
                    {activeAuction.winningBakulName === currentUser.name ? (
                      <span className="text-emerald-700 font-extrabold">Anda ({currentUser.name}) - Sedang Memimpin!</span>
                    ) : (
                      activeAuction.winningBakulName || 'Belum Ada Penawar'
                    )}
                  </strong>
                </div>

                <div className="text-right">
                  <span className="text-slate-500">Estimasi Total Tagihan Anda (+6%): </span>
                  <span className="font-bold text-slate-900 font-mono text-sm">
                    {formatIDR((activeAuction.commodity.initialWeightKg * activeAuction.currentBidPerKg) * 1.06)}
                  </span>
                </div>
              </div>

              {/* Rincian Rumus +6% Bakul Transparan */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2 text-xs">
                <span className="font-bold text-indigo-900 block flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-indigo-600" />
                  Rincian Skema Biaya Pembeli (+6% dari Nilai Lelang X):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                  <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                    <span className="text-[10px] text-slate-500 block font-sans">Harga Menang (X)</span>
                    <span className="font-bold text-slate-900">
                      {formatIDR(activeAuction.commodity.initialWeightKg * activeAuction.currentBidPerKg)}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                    <span className="text-[10px] text-slate-500 block font-sans">Bagian Koperasi (3% Langsung)</span>
                    <span className="font-bold text-indigo-700">
                      +{formatIDR((activeAuction.commodity.initialWeightKg * activeAuction.currentBidPerKg) * 0.03)}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                    <span className="text-[10px] text-slate-500 block font-sans">Simpanan/Tagihan (3% Bulanan)</span>
                    <span className="font-bold text-purple-700">
                      +{formatIDR((activeAuction.commodity.initialWeightKg * activeAuction.currentBidPerKg) * 0.03)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tombol Ajukan Tawaran Langsung */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Ajukan Tawaran Cepat Sebagai {currentUser.name}:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => onPlaceBid(activeAuction.id, currentUser.id, activeAuction.currentBidPerKg + 500)}
                    className="p-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-left transition-all active:scale-98"
                  >
                    <span className="text-xs text-indigo-600 font-bold block">+Rp 500 / kg</span>
                    <span className="text-base sm:text-lg font-black text-indigo-950 font-mono block">
                      {formatIDR(activeAuction.currentBidPerKg + 500)}
                    </span>
                    <span className="text-[10px] text-slate-500">Klik untuk menawar</span>
                  </button>

                  <button
                    onClick={() => onPlaceBid(activeAuction.id, currentUser.id, activeAuction.currentBidPerKg + 1000)}
                    className="p-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-left transition-all shadow-md shadow-indigo-600/20 active:scale-98"
                  >
                    <span className="text-xs text-indigo-200 font-bold block">+Rp 1.000 / kg</span>
                    <span className="text-base sm:text-lg font-black text-white font-mono block">
                      {formatIDR(activeAuction.currentBidPerKg + 1000)}
                    </span>
                    <span className="text-[10px] text-indigo-200">Loncatan rekomendasi</span>
                  </button>

                  <button
                    onClick={() => onPlaceBid(activeAuction.id, currentUser.id, activeAuction.currentBidPerKg + 2000)}
                    className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-left transition-all shadow-md active:scale-98"
                  >
                    <span className="text-xs text-amber-400 font-bold block">+Rp 2.000 / kg</span>
                    <span className="text-base sm:text-lg font-black text-amber-300 font-mono block">
                      {formatIDR(activeAuction.currentBidPerKg + 2000)}
                    </span>
                    <span className="text-[10px] text-slate-400">Tawaran agresif</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Belum Ada Sesi Lelang Terbuka</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Silakan tunggu petugas lapangan menimbang hasil tambak petani baru. Anda akan mendapat pemberitahuan saat bidding dibuka.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: History & Tagihan +6% */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Riwayat Lelang Dimenangkan & Rincian Tagihan (+6%)
            </h3>
            <p className="text-xs text-slate-500">
              Rincian kewajiban pembayaran harga menang lelang (X) ditambah biaya 6% (3% tunai + 3% berkala)
            </p>
          </div>

          <div className="space-y-4">
            {bakulLedgers.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Belum ada transaksi lelang atas nama akun Anda.
              </div>
            ) : (
              bakulLedgers.map((tx) => (
                <div
                  key={tx.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 text-xs">
                    <div>
                      <span className="font-mono text-slate-500 block">{tx.id}</span>
                      <span className="font-bold text-slate-900 text-sm">{tx.commodityCategory} ({tx.weightKg} Kg)</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block">{formatIndoDate(tx.createdAt)}</span>
                      <span className="font-bold text-slate-800">Petani: {tx.farmerName}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-slate-500 text-[11px] block">Harga Menang (X):</span>
                      <span className="font-bold text-slate-900 font-mono text-sm">
                        {formatIDR(tx.grossPrice)}
                      </span>
                    </div>

                    <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                      <span className="text-indigo-800 text-[11px] block">Biaya Tambahan (+6%):</span>
                      <span className="font-bold text-indigo-700 font-mono text-sm">
                        +{formatIDR(tx.bakulAdditional6Percent)}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-1">
                        3% Koperasi Langsung: {formatIDR(tx.koperasiBakulIncome3Percent)} <br />
                        3% Tagihan Bulanan: {formatIDR(tx.bakulMonthlyBill3Percent)}
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-slate-500 text-[11px] block">Total Tagihan Akhir:</span>
                      <span className="font-black text-slate-900 font-mono text-sm">
                        {formatIDR(tx.totalBakulPayable)}
                      </span>
                      <span className="text-[10px] text-emerald-600 block mt-1">
                        Status Pelunasan Harian: Terbayar
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Monthly Invoices */}
      {activeTab === 'monthly_bill' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Tagihan Bulanan Komponen 3%
            </h3>
            <p className="text-xs text-slate-500">
              Koperasi merekap seluruh komponen 3% dari setiap transaksi pembelian Anda selama 1 bulan kalender
            </p>
          </div>

          <div className="space-y-4">
            {bakulInvoices.map((inv) => (
              <div
                key={inv.id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs text-slate-400 block">{inv.id}</span>
                    <h4 className="font-bold text-slate-900 text-base">Invoice Periode: {inv.periodLabel}</h4>
                    <span className="text-xs text-slate-600">
                      Total {inv.transactionCount} Transaksi Pembelian Lelang
                    </span>
                  </div>

                  <div>
                    {inv.status === 'paid' ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Lunas
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Menunggu Pembayaran
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 text-[11px] block">Akumulasi Pembelian (X):</span>
                    <span className="font-bold text-slate-800">{formatIDR(inv.totalAuctionGross)}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 text-[11px] block">Tagihan 3% Simpanan:</span>
                    <span className="font-bold text-indigo-700 text-sm">{formatIDR(inv.totalBakul3PercentBill)}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 text-[11px] block">Batas Waktu Pelunasan:</span>
                    <span className="font-bold text-slate-800">{inv.dueDate}</span>
                  </div>
                </div>

                {inv.status !== 'paid' && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => onPayInvoice(inv.id)}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      Bayar Tagihan Bulanan ({formatIDR(inv.totalBakul3PercentBill)})
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
