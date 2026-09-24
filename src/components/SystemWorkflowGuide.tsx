import React, { useState } from 'react';
import { 
  ArrowRight, 
  Fish, 
  Scale, 
  Gavel, 
  Wallet, 
  Receipt, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { UserRole } from '../types';

interface SystemWorkflowGuideProps {
  activeRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  onOpenCalculator: () => void;
}

export const SystemWorkflowGuide: React.FC<SystemWorkflowGuideProps> = ({
  activeRole,
  onSelectRole,
  onOpenCalculator,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);

  const steps = [
    {
      num: 1,
      role: 'petani' as UserRole,
      title: 'Panen & Registrasi',
      desc: 'Petani membawa hasil tambak ke TPI Koperasi.',
      actor: 'Petani (Penjual)',
      color: 'from-amber-500 to-orange-600',
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: <Fish className="w-4 h-4 text-amber-600" />,
    },
    {
      num: 2,
      role: 'karyawan' as UserRole,
      title: 'Timbang & Buka Lelang',
      desc: 'Kasir input bobot, mutu, tier jasa (8/6/3%) & buka lelang.',
      actor: 'Karyawan (Kasir Lapangan)',
      color: 'from-emerald-500 to-teal-600',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: <Scale className="w-4 h-4 text-emerald-600" />,
    },
    {
      num: 3,
      role: 'bakul' as UserRole,
      title: 'Bidding Live Bakul',
      desc: 'Bakul menawar harga per kg secara real-time.',
      actor: 'Bakul (Pembeli)',
      color: 'from-indigo-500 to-blue-600',
      badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      icon: <Gavel className="w-4 h-4 text-indigo-600" />,
    },
    {
      num: 4,
      role: 'karyawan' as UserRole,
      title: 'Ketok Palu & Ledger',
      desc: 'Operator mengunci pemenang. Sistem menghitung rumus otomatis.',
      actor: 'Karyawan / Kasir',
      color: 'from-rose-500 to-red-600',
      badge: 'bg-rose-100 text-rose-800 border-rose-200',
      icon: <Sparkles className="w-4 h-4 text-rose-600" />,
    },
    {
      num: 5,
      role: 'manager' as UserRole,
      title: 'Bagi Hasil & Otorisasi',
      desc: 'Retensi 1% cair 3 bln, tagihan 3% bakul direkap 1 bln.',
      actor: 'Manager & Admin',
      color: 'from-blue-500 to-cyan-600',
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: <TrendingUp className="w-4 h-4 text-blue-600" />,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mb-6 transition-all">
      {/* Header Bar */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-3 sm:px-6 bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 text-white flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs sm:text-sm tracking-tight text-white">
                Panduan Cepat & Alur Kerja Koperasi
              </span>
              <span className="hidden sm:inline-block text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                5 Tahapan Utama
              </span>
            </div>
            <p className="text-[11px] text-slate-300 hidden md:block">
              Klik tahapan di bawah untuk beralih peran dan melihat simulasi proses secara langsung
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenCalculator();
            }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 rounded-lg text-xs font-semibold transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kalkulator Rumus (X)</span>
          </button>

          <button 
            type="button" 
            className="p-1 rounded-md text-slate-400 hover:text-white"
            aria-label={isOpen ? 'Tutup panduan' : 'Buka panduan'}
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Collapsible Steps Content */}
      {isOpen && (
        <div className="p-4 sm:p-5 bg-slate-50/70 border-t border-slate-200 space-y-4">
          {/* Horizontal Stepper Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {steps.map((step) => {
              const isCurrentRole = activeRole === step.role;
              return (
                <div
                  key={step.num}
                  onClick={() => onSelectRole(step.role)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-200 relative group flex flex-col justify-between ${
                    isCurrentRole
                      ? 'bg-white border-cyan-500 ring-2 ring-cyan-500/20 shadow-sm'
                      : 'bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-2xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-6 h-6 rounded-full bg-slate-100 font-bold text-xs text-slate-700 flex items-center justify-center font-mono">
                        {step.num}
                      </span>
                      <div className="flex items-center gap-1">
                        {step.icon}
                        {isCurrentRole && (
                          <span className="w-2 h-2 rounded-full bg-cyan-600 animate-pulse" />
                        )}
                      </div>
                    </div>

                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">
                      {step.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>

                  <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-slate-600 truncate max-w-[120px]">
                      {step.actor}
                    </span>
                    <span className="text-cyan-700 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Lihat <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Business Logic Formula Pill Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-xl p-3 sm:p-4 text-xs shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 block">
                  Ringkasan Rumus Finansial Koperasi (Harga Menang = X):
                </span>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-200">
                  <span>
                    🌾 <strong>Petani:</strong> Potong {activeRole === 'petani' ? 'Tier Terpilih' : '8%/6%/3%'} &bull; 
                    <span className="text-amber-300 font-semibold"> Hak 1% Retensi (3 Bln)</span> &bull; 
                    <span className="text-emerald-300 font-semibold"> Sisa Cair Segera</span>
                  </span>
                  <span>
                    🛍️ <strong>Bakul:</strong> Bayar <span className="text-indigo-300 font-semibold">X + 6%</span> (3% Koperasi + 3% Tagihan Bulanan)
                  </span>
                  <span>
                    🏢 <strong>Laba Koperasi:</strong> (Potongan Petani - 1%) + (3% Bakul)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start lg:self-auto shrink-0">
                <button
                  type="button"
                  onClick={onOpenCalculator}
                  className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Uji Simulasi Hitung</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
