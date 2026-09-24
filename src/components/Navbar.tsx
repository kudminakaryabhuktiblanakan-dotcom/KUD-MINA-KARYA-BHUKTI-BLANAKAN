import React, { useState } from 'react';
import { 
  Waves, 
  ShieldCheck, 
  TrendingUp, 
  Scale, 
  Fish, 
  ShoppingBag, 
  Calendar, 
  FastForward, 
  RotateCcw,
  Calculator,
  Code2,
  Layers,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  Info,
  FileBarChart,
  LogOut,
  UserCheck
} from 'lucide-react';
import { UserRole, User } from '../types';

interface NavbarProps {
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  currentUser: User;
  users: User[];
  currentSimulatedDate: Date;
  onAdvanceDays: (days: number) => void;
  onResetDate: () => void;
  activeViewMode: 'app' | 'commodities' | 'reports' | 'architecture';
  setActiveViewMode: (mode: 'app' | 'commodities' | 'reports' | 'architecture') => void;
  onOpenCalculator: () => void;
  dueRetentionCount: number;
  unbilledBakulCount: number;
  commoditiesCount?: number;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeRole,
  setActiveRole,
  currentUser,
  users,
  currentSimulatedDate,
  onAdvanceDays,
  onResetDate,
  activeViewMode,
  setActiveViewMode,
  onOpenCalculator,
  dueRetentionCount,
  unbilledBakulCount,
  commoditiesCount = 6,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const roleConfigs: Record<UserRole, { label: string; shortLabel: string; icon: React.ReactNode; color: string; desc: string }> = {
    admin: {
      label: 'Admin (Master)',
      shortLabel: 'Admin',
      icon: <ShieldCheck className="w-4 h-4 text-purple-600" />,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      desc: 'Master Data & Pengawasan',
    },
    manager: {
      label: 'Manager (Keuangan)',
      shortLabel: 'Manager',
      icon: <TrendingUp className="w-4 h-4 text-blue-600" />,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      desc: 'Laporan Keuangan & Otorisasi',
    },
    karyawan: {
      label: 'Kasir Lapangan',
      shortLabel: 'Kasir/Timbang',
      icon: <Scale className="w-4 h-4 text-emerald-600" />,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      desc: 'Timbangan & Operator Lelang',
    },
    petani: {
      label: 'Petani (Penjual)',
      shortLabel: 'Petani',
      icon: <Fish className="w-4 h-4 text-amber-600" />,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      desc: 'Hasil Lelang & Retensi 1%',
    },
    bakul: {
      label: 'Bakul (Pembeli)',
      shortLabel: 'Bakul',
      icon: <ShoppingBag className="w-4 h-4 text-indigo-600" />,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      desc: 'Bidding, Nota +6% & Tagihan 3%',
    },
  };

  const formattedDate = currentSimulatedDate.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Banner: Navigation between Live Interactive App & Architecture / Code Docs */}
      <div className="bg-slate-900 text-slate-100 text-xs py-2 px-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] sm:text-xs">
              KOPERASI TAMBAK
            </span>
            <span className="text-[11px] sm:text-xs text-slate-300 font-medium truncate max-w-[220px] sm:max-w-none">
              Sistem Lelang & Bagi Hasil Berjenjang
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher: Filtered according to user role capacity */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              <button
                onClick={() => setActiveViewMode('app')}
                className={`px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeViewMode === 'app'
                    ? 'bg-cyan-500 text-slate-950 shadow-xs font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>
                  {currentUser.role === 'petani'
                    ? 'Portal Petani'
                    : currentUser.role === 'bakul'
                    ? 'Portal Bakul'
                    : currentUser.role === 'karyawan'
                    ? 'Meja Timbang & Lelang'
                    : 'Simulasi App'}
                </span>
              </button>

              {currentUser.role !== 'petani' && currentUser.role !== 'bakul' && (
                <>
                  <button
                    onClick={() => setActiveViewMode('commodities')}
                    className={`px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      activeViewMode === 'commodities'
                        ? 'bg-teal-400 text-slate-950 shadow-xs font-bold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Fish className="w-3.5 h-3.5" />
                    <span>Menu Komoditas</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-900/60 text-teal-200 font-mono font-bold">
                      {commoditiesCount}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveViewMode('reports')}
                    className={`px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      activeViewMode === 'reports'
                        ? 'bg-emerald-400 text-slate-950 shadow-xs font-bold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <FileBarChart className="w-3.5 h-3.5" />
                    <span>Laporan H/B/T & Data</span>
                  </button>
                </>
              )}

              {(currentUser.role === 'admin' || currentUser.role === 'manager') && (
                <button
                  onClick={() => setActiveViewMode('architecture')}
                  className={`px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeViewMode === 'architecture'
                      ? 'bg-cyan-500 text-slate-950 shadow-xs font-bold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Kode Laravel</span>
                </button>
              )}
            </div>

            <button
              onClick={onOpenCalculator}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 rounded-md transition-colors font-medium text-[11px] sm:text-xs"
              title="Buka Sandbox Rumus Keuangan"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kalkulator</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-teal-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-cyan-600/20 shrink-0">
              <Waves className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-slate-900 text-sm sm:text-base md:text-lg tracking-tight leading-none">
                  KUD Mina Karya Bhukti
                </h1>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Lelang Aktif
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block mt-0.5">
                Balai Pelelangan Ikan & Udang Pantura
              </p>
            </div>
          </div>

          {/* Time Machine & Cron Simulator (Desktop) */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg shadow-2xs text-slate-700 font-semibold font-mono text-[11px]">
              <Calendar className="w-3.5 h-3.5 text-cyan-600" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onAdvanceDays(30)}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg flex items-center gap-1 transition-all hover:border-slate-300 text-[11px] font-semibold"
                title="Maju 1 bulan untuk merekap tagihan 3% bulanan bakul"
              >
                <FastForward className="w-3 h-3 text-indigo-600" />
                <span>+1 Bln (Bakul)</span>
                {unbilledBakulCount > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                )}
              </button>
              <button
                onClick={() => onAdvanceDays(90)}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg flex items-center gap-1 transition-all hover:border-slate-300 text-[11px] font-semibold"
                title="Maju 3 bulan untuk memicu jatuh tempo retensi 1% petani"
              >
                <FastForward className="w-3 h-3 text-amber-600" />
                <span>+3 Bln (Retensi)</span>
                {dueRetentionCount > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                )}
              </button>
              <button
                onClick={onResetDate}
                className="p-1.5 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors"
                title="Reset ke Tanggal Awal"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* User Identity, Role Switcher (Admin only), and Logout Button (Desktop) */}
          <div className="hidden md:flex items-center gap-2.5">
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="text-xs font-black text-slate-900 leading-tight">
                    {currentUser.name}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${roleConfigs[currentUser.role]?.color || 'bg-slate-100 text-slate-700'}`}>
                    {roleConfigs[currentUser.role]?.shortLabel || currentUser.role}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium block truncate max-w-[200px]">
                  {currentUser.role === 'petani' && currentUser.tambakLocation
                    ? currentUser.tambakLocation
                    : currentUser.role === 'bakul' && currentUser.bakulMarketArea
                    ? currentUser.bakulMarketArea
                    : currentUser.email}
                </span>
              </div>
            </div>

            {/* Admin Supervisor Preview Switcher */}
            {currentUser.role === 'admin' && (
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-purple-800 px-1.5 uppercase">Pratinjau:</span>
                {(['admin', 'manager', 'karyawan', 'petani', 'bakul'] as UserRole[]).map((role) => {
                  const config = roleConfigs[role];
                  const isActive = activeRole === role;
                  return (
                    <button
                      key={role}
                      onClick={() => setActiveRole(role)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all relative ${
                        isActive
                          ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                      title={`Pratinjau antarmuka ${config.label}`}
                    >
                      {config.icon}
                      <span>{config.shortLabel}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer ml-1"
              title="Keluar dari sesi akun saat ini"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span>Keluar</span>
            </button>
          </div>

          {/* Mobile User & Logout controls */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            >
              <span className="truncate max-w-[100px]">{currentUser.name.split(' ')[0]}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button
              onClick={onLogout}
              className="p-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl hover:bg-rose-100"
              title="Keluar"
            >
              <LogOut className="w-4 h-4 text-rose-600" />
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-200 space-y-3 bg-white animate-in slide-in-from-top-2 duration-150">
            {/* User Profile Card Mobile */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                <p className="text-[11px] text-slate-500">{currentUser.email}</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${roleConfigs[currentUser.role]?.color}`}>
                {roleConfigs[currentUser.role]?.shortLabel}
              </span>
            </div>

            {/* If Admin: can switch preview roles on mobile */}
            {currentUser.role === 'admin' && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Pratinjau Hak Akses (Mode Admin):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(['admin', 'manager', 'karyawan', 'petani', 'bakul'] as UserRole[]).map((role) => {
                    const config = roleConfigs[role];
                    const isActive = activeRole === role;
                    return (
                      <button
                        key={role}
                        onClick={() => {
                          setActiveRole(role);
                          setMobileMenuOpen(false);
                        }}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 text-xs font-bold transition-all ${
                          isActive
                            ? 'border-cyan-500 bg-cyan-50 text-cyan-950 ring-1 ring-cyan-500/20'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="p-1 rounded bg-white shadow-2xs">{config.icon}</div>
                        <div className="truncate">
                          <span className="block leading-tight">{config.shortLabel}</span>
                          <span className="text-[10px] text-slate-400 font-normal block truncate">
                            {config.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mobile View Mode Switcher in Menu */}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              {currentUser.role !== 'petani' && currentUser.role !== 'bakul' && (
                <>
                  <button
                    onClick={() => {
                      setActiveViewMode('commodities');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      activeViewMode === 'commodities'
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                    }`}
                  >
                    <Fish className="w-4 h-4" />
                    <span>Menu Komoditas & Rekap Total ({commoditiesCount})</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveViewMode('reports');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      activeViewMode === 'reports'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <FileBarChart className="w-4 h-4" />
                    <span>Laporan Harian, Bulanan, Tahunan (.xlsx & PDF)</span>
                  </button>
                </>
              )}

              {/* Mobile Logout Button */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar dari Akun (Logout)</span>
              </button>
            </div>

            {/* Mobile Time Simulator in Menu */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono font-medium">
                <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onAdvanceDays(30)}
                  className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold"
                >
                  +1 Bln
                </button>
                <button
                  onClick={() => onAdvanceDays(90)}
                  className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold"
                >
                  +3 Bln
                </button>
                <button
                  onClick={onResetDate}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Horizontal Quick Role Pills (When Menu is Closed, Admin only) */}
        {!mobileMenuOpen && currentUser.role === 'admin' && (
          <div className="md:hidden flex items-center gap-1.5 py-2 overflow-x-auto scrollbar-none border-t border-slate-100 text-xs">
            <span className="text-[10px] text-purple-700 font-bold px-1 shrink-0">Pratinjau:</span>
            {(['admin', 'manager', 'karyawan', 'petani', 'bakul'] as UserRole[]).map((role) => {
              const config = roleConfigs[role];
              const isActive = activeRole === role;
              return (
                <button
                  key={role}
                  onClick={() => setActiveRole(role)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap shrink-0 transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {config.icon}
                  <span>{config.shortLabel}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
