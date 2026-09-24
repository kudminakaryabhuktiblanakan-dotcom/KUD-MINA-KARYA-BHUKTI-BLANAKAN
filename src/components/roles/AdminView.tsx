import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Settings, 
  Database, 
  FileText, 
  CheckCircle, 
  RefreshCw, 
  Scale, 
  Search, 
  Sliders, 
  Clock,
  AlertCircle,
  LayoutGrid,
  List,
  Package,
  FileSpreadsheet
} from 'lucide-react';
import { User, Commodity, CommodityMaster, Auction, TransactionLedger, DiscountTier } from '../../types';
import { formatIDR, formatIndoDate } from '../../services/calculationEngine';
import { CommodityDirectoryView } from '../commodities/CommodityDirectoryView';
import { PeriodReportView } from '../reports/PeriodReportView';
import { UserAccessManagement } from '../users/UserAccessManagement';

interface AdminViewProps {
  users: User[];
  currentLoggedInUser?: User;
  commodities: Commodity[];
  commodityMasters?: CommodityMaster[];
  auctions: Auction[];
  ledgers: TransactionLedger[];
  currentSimulatedDate?: Date;
  onTriggerRetentionCron: () => void;
  onTriggerMonthlyBillCron: () => void;
  onResetData: () => void;
  onApproveLedger: (ledgerId: string) => void;
  onOpenAddCommodityModal?: () => void;
  onUpdateLedger?: (updatedLedger: TransactionLedger) => void;
  onDeleteLedger?: (ledgerId: string) => void;
  onDeleteAllLedgers?: () => void;
  onImportLedgers?: (newLedgers: TransactionLedger[]) => void;
  onAddUser?: (user: User) => void;
  onUpdateUser?: (user: User) => void;
  onDeleteUser?: (userId: string) => void;
  onToggleUserStatus?: (userId: string) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  users,
  currentLoggedInUser,
  commodities,
  commodityMasters = [],
  auctions,
  ledgers,
  currentSimulatedDate,
  onTriggerRetentionCron,
  onTriggerMonthlyBillCron,
  onResetData,
  onApproveLedger,
  onOpenAddCommodityModal,
  onUpdateLedger,
  onDeleteLedger,
  onDeleteAllLedgers,
  onImportLedgers,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onToggleUserStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'ledgers' | 'laporan' | 'tiers' | 'commodities' | 'maintenance'>('ledgers');
  const [ledgerViewMode, setLedgerViewMode] = useState<'cards' | 'table'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.phone.includes(searchQuery);
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-purple-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">Admin Master Console</h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Full Authority
                </span>
              </div>
              <p className="text-xs text-purple-200/80 mt-0.5">
                Konfigurasi master pengguna, komoditas tambak, persentase jasa, dan pengawasan audit transaksi.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onTriggerRetentionCron}
              className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              title="Jalankan Worker Retensi 3 Bulan"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Cron Retensi 3 Bln</span>
            </button>
            <button
              onClick={onTriggerMonthlyBillCron}
              className="px-3 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-indigo-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              title="Jalankan Worker Rekap Tagihan Bulanan 3% Bakul"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Cron Tagihan 3% Bakul</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none flex-nowrap">
        <button
          onClick={() => setActiveTab('ledgers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'ledgers'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Audit Buku Besar (Ledger) ({ledgers.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('laporan')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'laporan'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Laporan H/B/T & Olah Data (.xlsx / PDF)</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'users'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4 text-cyan-400" />
          <span>Pengaturan Akses Pengguna ({users.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('tiers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'tiers'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Aturan Tier & Potongan Jasa</span>
        </button>
        <button
          onClick={() => setActiveTab('commodities')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'commodities'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4 text-teal-400" />
          <span>Master Komoditas & Rekap Total ({commodityMasters.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'maintenance'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Sistem & Maintenance</span>
        </button>
      </div>

      {/* Tab 1: Ledgers Master Audit */}
      {activeTab === 'ledgers' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Audit Buku Besar Transaksi (Ledger)</h3>
              <p className="text-xs text-slate-500">
                Pencatatan lelang terpusat: harga menang (X), potongan petani, retensi 1%, +6% bakul, dan margin koperasi
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Card vs Table toggle */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setLedgerViewMode('cards')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
                    ledgerViewMode === 'cards'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Kartu</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLedgerViewMode('table')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
                    ledgerViewMode === 'table'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Tabel</span>
                </button>
              </div>

              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                {ledgers.length} Transaksi
              </span>
            </div>
          </div>

          {/* Cards Layout */}
          {ledgerViewMode === 'cards' ? (
            <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {ledgers.map((tx) => (
                <div
                  key={tx.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-200">
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {tx.id}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1">{tx.commodityCategory}</h4>
                      <span className="text-xs text-slate-500">
                        {tx.weightKg} kg &bull; Petani: <strong>{tx.farmerName}</strong> &bull; Bakul: <strong>{tx.bakulName}</strong>
                      </span>
                    </div>

                    <div className="text-right">
                      {tx.statusRetention === 'released' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle className="w-3 h-3" />
                          Sudah Cair
                        </span>
                      ) : tx.statusRetention === 'ready_to_release' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                          <Clock className="w-3 h-3" />
                          Siap Dicairkan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          Ditahan (3 Bln)
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 block mt-1">
                        {formatIndoDate(tx.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-sans">Nilai Lelang (X)</span>
                      <span className="font-bold text-slate-900">{formatIDR(tx.grossPrice)}</span>
                    </div>

                    <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                      <span className="text-[10px] text-emerald-700 block font-sans">Cair Petani ({tx.discountTier}%)</span>
                      <span className="font-bold text-emerald-800">{formatIDR(tx.netFarmerAmount)}</span>
                    </div>

                    <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
                      <span className="text-[10px] text-amber-800 block font-sans">Retensi 1% (3 Bln)</span>
                      <span className="font-bold text-amber-900">{formatIDR(tx.farmerRetention1Percent)}</span>
                    </div>

                    <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-200">
                      <span className="text-[10px] text-indigo-700 block font-sans">Total Bakul (+6%)</span>
                      <span className="font-bold text-indigo-900">{formatIDR(tx.totalBakulPayable)}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100">
                    <span className="text-[11px] text-slate-500">
                      Laba Bersih Koperasi: <strong className="text-cyan-800 font-mono">{formatIDR(tx.totalKoperasiIncome)}</strong>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Jatuh Tempo Retensi: {tx.retentionDueDate}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Table Layout */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">No. Transaksi</th>
                    <th className="py-3 px-4">Petani (Penjual)</th>
                    <th className="py-3 px-4">Bakul (Pembeli)</th>
                    <th className="py-3 px-4">Komoditas & Bobot</th>
                    <th className="py-3 px-4 text-right">Nilai Lelang (X)</th>
                    <th className="py-3 px-4 text-center">Tier</th>
                    <th className="py-3 px-4 text-right">Cair Petani</th>
                    <th className="py-3 px-4 text-right">Retensi 1%</th>
                    <th className="py-3 px-4 text-right">Tagihan Bakul (+6%)</th>
                    <th className="py-3 px-4 text-right">Profit Koperasi</th>
                    <th className="py-3 px-4 text-center">Status Retensi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledgers.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        <div>{tx.id}</div>
                        <span className="text-[10px] text-slate-400">{formatIndoDate(tx.createdAt)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{tx.farmerName}</div>
                        <span className="text-[10px] text-slate-400">ID: {tx.farmerId}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{tx.bakulName}</div>
                        <span className="text-[10px] text-slate-400">ID: {tx.bakulId}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{tx.commodityCategory}</span>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {tx.weightKg} kg @ {formatIDR(tx.pricePerKg)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                        {formatIDR(tx.grossPrice)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                          {tx.discountTier}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-700 font-mono">
                        {formatIDR(tx.netFarmerAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-amber-700 font-mono">
                        <div>{formatIDR(tx.farmerRetention1Percent)}</div>
                        <span className="text-[9px] text-slate-400">Jatuh Tempo: {tx.retentionDueDate}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-indigo-700 font-mono">
                        <div>{formatIDR(tx.totalBakulPayable)}</div>
                        <span className="text-[9px] text-slate-400">+{formatIDR(tx.bakulAdditional6Percent)}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-cyan-800 font-mono">
                        {formatIDR(tx.totalKoperasiIncome)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {tx.statusRetention === 'released' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle className="w-3 h-3" />
                            Sudah Cair
                          </span>
                        ) : tx.statusRetention === 'ready_to_release' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                            <Clock className="w-3 h-3" />
                            Siap Dicairkan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            Ditahan (3 Bln)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Laporan Harian, Bulanan, Tahunan & Impor Ekspor Data */}
      {activeTab === 'laporan' && (
        <PeriodReportView
          ledgers={ledgers}
          users={users}
          commodityMasters={commodityMasters}
          currentSimulatedDate={currentSimulatedDate || new Date('2026-09-24T08:00:00Z')}
          onUpdateLedger={onUpdateLedger || (() => {})}
          onDeleteLedger={onDeleteLedger || (() => {})}
          onDeleteAllLedgers={onDeleteAllLedgers || (() => {})}
          onImportLedgers={onImportLedgers || (() => {})}
        />
      )}

      {/* Tab 2: Users & Permissions Access Management */}
      {activeTab === 'users' && (
        <UserAccessManagement
          users={users}
          currentLoggedInUser={currentLoggedInUser || users[0]}
          onAddUser={onAddUser || (() => {})}
          onUpdateUser={onUpdateUser || (() => {})}
          onDeleteUser={onDeleteUser || (() => {})}
          onToggleUserStatus={onToggleUserStatus || (() => {})}
        />
      )}

      {/* Tab 3: Tiers & Business Rules */}
      {activeTab === 'tiers' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Konfigurasi Master Persentase Jasa & Bagi Hasil</h3>
            <p className="text-xs text-slate-500">
              Pengaturan tier potongan petani dan penambahan biaya bakul sesuai AD/ART Koperasi Tambak
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="p-4 rounded-xl border-2 border-purple-200 bg-purple-50/30 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-purple-900 text-base">Tier 8% (Standar)</span>
                  <span className="px-2 py-0.5 rounded bg-purple-200 text-purple-900 text-xs font-bold">Default</span>
                </div>
                <p className="text-xs text-slate-600">
                  Diterapkan untuk petani umum / panen non-kontrak.
                </p>
                <div className="text-xs space-y-1.5 pt-2 border-t border-purple-200 font-mono">
                  <div className="flex justify-between">
                    <span>Total Potongan:</span>
                    <span className="font-bold">8% dari X</span>
                  </div>
                  <div className="flex justify-between text-amber-700">
                    <span>Hak Petani (Retensi):</span>
                    <span className="font-bold">1% (3 Bulan)</span>
                  </div>
                  <div className="flex justify-between text-cyan-800">
                    <span>Bersih Koperasi:</span>
                    <span className="font-bold">7% dari X</span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>Cair Segera Petani:</span>
                    <span className="font-bold">92% dari X</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border-2 border-blue-200 bg-blue-50/30 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-blue-900 text-base">Tier 6% (Anggota)</span>
                  <span className="px-2 py-0.5 rounded bg-blue-200 text-blue-900 text-xs font-bold">Anggota</span>
                </div>
                <p className="text-xs text-slate-600">
                  Diterapkan untuk petani terdaftar yang telah melunasi simpanan pokok.
                </p>
                <div className="text-xs space-y-1.5 pt-2 border-t border-blue-200 font-mono">
                  <div className="flex justify-between">
                    <span>Total Potongan:</span>
                    <span className="font-bold">6% dari X</span>
                  </div>
                  <div className="flex justify-between text-amber-700">
                    <span>Hak Petani (Retensi):</span>
                    <span className="font-bold">1% (3 Bulan)</span>
                  </div>
                  <div className="flex justify-between text-cyan-800">
                    <span>Bersih Koperasi:</span>
                    <span className="font-bold">5% dari X</span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>Cair Segera Petani:</span>
                    <span className="font-bold">94% dari X</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50/30 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-900 text-base">Tier 3% (Prioritas)</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 text-xs font-bold">Mitra Inti</span>
                </div>
                <p className="text-xs text-slate-600">
                  Diterapkan untuk mitra plasma atau pasokan tambak skala besar (&gt;1 ton).
                </p>
                <div className="text-xs space-y-1.5 pt-2 border-t border-emerald-200 font-mono">
                  <div className="flex justify-between">
                    <span>Total Potongan:</span>
                    <span className="font-bold">3% dari X</span>
                  </div>
                  <div className="flex justify-between text-amber-700">
                    <span>Hak Petani (Retensi):</span>
                    <span className="font-bold">1% (3 Bulan)</span>
                  </div>
                  <div className="flex justify-between text-cyan-800">
                    <span>Bersih Koperasi:</span>
                    <span className="font-bold">2% dari X</span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>Cair Segera Petani:</span>
                    <span className="font-bold">97% dari X</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-slate-900 text-white rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-sm text-cyan-300">Skema Biaya Bakul (Pembeli): +6% Fixed</h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Setiap transaksi lelang dimenangkan bakul dikenakan tambahan 6% (3% Kas Koperasi langsung + 3% Tagihan Berkala Bulanan).
                </p>
              </div>
              <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 rounded-lg text-xs font-mono font-bold">
                Formula: X + (X × 6%)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Master Komoditas & Rekapitulasi Total */}
      {activeTab === 'commodities' && (
        <CommodityDirectoryView
          commodityMasters={commodityMasters}
          commodities={commodities}
          auctions={auctions}
          ledgers={ledgers}
          onOpenAddModal={onOpenAddCommodityModal || (() => {})}
        />
      )}

      {/* Tab 4: Maintenance */}
      {activeTab === 'maintenance' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Operasional & Pemeliharaan Sistem</h3>
            <p className="text-xs text-slate-500">
              Simulasi trigger worker, background jobs, dan reset database ke kondisi awal
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <h4 className="font-bold text-xs uppercase text-slate-700 tracking-wider">
                1. Background Job: Retensi Hak Petani 1%
              </h4>
              <p className="text-xs text-slate-600">
                Memindai tabel <code>transaction_ledgers</code> yang berstatus <code>held</code> dan memiliki <code>retention_due_date &lt;= NOW()</code>, lalu mengubah statusnya menjadi <code>ready_to_release</code>.
              </p>
              <button
                onClick={onTriggerRetentionCron}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Clock className="w-4 h-4" />
                Jalankan Job: ProcessRetentionRelease
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <h4 className="font-bold text-xs uppercase text-slate-700 tracking-wider">
                2. Background Job: Tagihan Bulanan 3% Bakul
              </h4>
              <p className="text-xs text-slate-600">
                Mengelompokkan transaksi bakul yang belum ditagihkan (<code>status_bakul_bill = 'unpaid'</code>) per bulan untuk menerbitkan <code>monthly_bakul_invoices</code>.
              </p>
              <button
                onClick={onTriggerMonthlyBillCron}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Jalankan Job: GenerateMonthlyBakulInvoice
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
            <div>
              <span className="text-xs font-bold text-slate-700 block">Reset Data Simulasi</span>
              <span className="text-[11px] text-slate-500">Kembalikan data transaksi, komoditas, dan invoice ke kondisi awal</span>
            </div>
            <button
              onClick={onResetData}
              className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold transition-colors"
            >
              Reset Data Default
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
