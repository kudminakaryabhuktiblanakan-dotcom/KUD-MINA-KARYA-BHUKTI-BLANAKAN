import React, { useState } from 'react';
import { X, Calculator, ArrowRight, ShieldAlert, Sparkles, CheckCircle2, Info } from 'lucide-react';
import { DiscountTier } from '../types';
import { calculateAuctionFinancials, formatIDR } from '../services/calculationEngine';

interface FinancialCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FinancialCalculatorModal: React.FC<FinancialCalculatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [grossPrice, setGrossPrice] = useState<number>(25000000); // 25 Juta default
  const [weightKg, setWeightKg] = useState<number | string>(300);
  const [pricePerKg, setPricePerKg] = useState<number>(85000);
  const [useKgCalculator, setUseKgCalculator] = useState<boolean>(true);
  const [selectedTier, setSelectedTier] = useState<DiscountTier>(8);

  if (!isOpen) return null;

  const parsedWeight = typeof weightKg === 'number' 
    ? weightKg 
    : (parseFloat(String(weightKg).replace(',', '.')) || 0);

  const currentGross = useKgCalculator ? Math.round(parsedWeight * pricePerKg) : grossPrice;
  const result = calculateAuctionFinancials(currentGross, selectedTier, new Date());

  const presetPrices = [
    { label: '5 Juta', value: 5000000 },
    { label: '15 Juta', value: 15000000 },
    { label: '30 Juta', value: 30000000 },
    { label: '60 Juta', value: 60000000 },
    { label: '100 Juta', value: 100000000 },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-cyan-950 text-white p-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Simulator & Sandbox Logika Finansial</h2>
              <p className="text-xs text-slate-300">
                Verifikasi real-time rumus potongan berjenjang, retensi 1%, dan tagihan +6% bakul
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Controls: Price and Tier Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {/* Input Left */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Metode Perhitungan Nilai Lelang (X)
                </label>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => setUseKgCalculator(true)}
                    className={`px-2 py-0.5 rounded font-medium ${
                      useKgCalculator ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Kg × Rp/Kg
                  </button>
                  <button
                    onClick={() => setUseKgCalculator(false)}
                    className={`px-2 py-0.5 rounded font-medium ${
                      !useKgCalculator ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Total Nominal (X)
                  </button>
                </div>
              </div>

              {useKgCalculator ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Berat Hasil Timbang (Kg)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={weightKg}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^[0-9]*[.,]?[0-9]*$/.test(val) || val === '') {
                          setWeightKg(val);
                        }
                      }}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-cyan-500 focus:outline-hidden font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Harga Lelang/Kg (Rp)</label>
                    <input
                      type="number"
                      step={1000}
                      value={pricePerKg}
                      onChange={(e) => setPricePerKg(Math.max(1000, Number(e.target.value)))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Nominal Harga Lelang Menang (X)</label>
                  <input
                    type="number"
                    step={100000}
                    value={grossPrice}
                    onChange={(e) => setGrossPrice(Math.max(100000, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold font-mono focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {presetPrices.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => setGrossPrice(p.value)}
                        className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[11px]"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                <span className="text-slate-500">Harga Menang Lelang (X):</span>
                <span className="font-extrabold text-slate-900 text-base font-mono">
                  {formatIDR(currentGross)}
                </span>
              </div>
            </div>

            {/* Input Right: Tier Selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Pilih Tier Jasa Koperasi untuk Petani
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([8, 6, 3] as DiscountTier[]).map((tier) => {
                  const isSelected = selectedTier === tier;
                  return (
                    <button
                      key={tier}
                      onClick={() => setSelectedTier(tier)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'border-cyan-600 bg-cyan-50 ring-2 ring-cyan-500/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xl font-black block text-slate-900">{tier}%</span>
                      <span className="text-[11px] text-slate-500 block font-medium">
                        {tier === 8 ? 'Tier Standar' : tier === 6 ? 'Tier Anggota' : 'Tier Prioritas'}
                      </span>
                      <span className="text-[10px] text-cyan-700 font-semibold block mt-1">
                        Kop: {tier - 1}% | Ret: 1%
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-start gap-2 text-xs text-amber-800">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Hak Petani <strong>1% Retensi</strong> selalu dipisahkan dan dijadwalkan cair otomatis setelah <strong>3 bulan</strong>.
                </span>
              </div>
            </div>
          </div>

          {/* Dual Column Financial Breakdown: Petani vs Bakul */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sisi Petani */}
            <div className="bg-white border-2 border-emerald-100 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                <div>
                  <span className="text-xs uppercase font-extrabold text-emerald-700 tracking-wider">
                    Sisi Petani (Penjual)
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm">Distribusi & Payout Petani</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                  Tier {selectedTier}%
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Nilai Kotor Hasil Lelang (X)</span>
                  <span className="font-semibold text-slate-900 font-mono">{formatIDR(currentGross)}</span>
                </div>

                <div className="flex justify-between py-1 text-red-600 bg-red-50/50 px-2 rounded">
                  <span>Total Potongan ({selectedTier}%):</span>
                  <span className="font-bold font-mono">-{formatIDR(result.farmerCutAmount)}</span>
                </div>

                <div className="pl-3 space-y-1.5 border-l-2 border-slate-200 text-[11px] text-slate-500">
                  <div className="flex justify-between">
                    <span>• Hak Petani (Retensi 1% - Tahan 3 Bln):</span>
                    <span className="font-semibold text-amber-700 font-mono">
                      {formatIDR(result.farmerRetention1Percent)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Bagian Bersih Jasa Koperasi ({selectedTier - 1}%):</span>
                    <span className="font-semibold text-cyan-700 font-mono">
                      {formatIDR(result.koperasiFarmerIncome)}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-emerald-800 font-semibold block">
                        Diterima Petani Segera (Tunai/Transfer)
                      </span>
                      <span className="text-[10px] text-emerald-600">Rumus: X - Total Potongan</span>
                    </div>
                    <span className="text-lg font-black text-emerald-700 font-mono">
                      {formatIDR(result.netFarmerAmount)}
                    </span>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-amber-900 font-semibold block">
                        Saldo Retensi 1% (Jatuh Tempo 3 Bulan)
                      </span>
                      <span className="text-[10px] text-amber-700">Tanggal Jatuh Tempo: {result.retentionDueDate}</span>
                    </div>
                    <span className="text-sm font-bold text-amber-800 font-mono">
                      {formatIDR(result.farmerRetention1Percent)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sisi Bakul */}
            <div className="bg-white border-2 border-indigo-100 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
                <div>
                  <span className="text-xs uppercase font-extrabold text-indigo-700 tracking-wider">
                    Sisi Bakul (Pembeli)
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm">Biaya Tambahan +6% & Tagihan</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-xs">
                  Biaya +6%
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Harga Menang Lelang (X)</span>
                  <span className="font-semibold text-slate-900 font-mono">{formatIDR(currentGross)}</span>
                </div>

                <div className="flex justify-between py-1 text-indigo-600 bg-indigo-50/50 px-2 rounded">
                  <span>Total Tambahan Biaya (+6%):</span>
                  <span className="font-bold font-mono">+{formatIDR(result.bakulAdditional6Percent)}</span>
                </div>

                <div className="pl-3 space-y-1.5 border-l-2 border-slate-200 text-[11px] text-slate-500">
                  <div className="flex justify-between">
                    <span>• Bagian Koperasi (3% Langsung):</span>
                    <span className="font-semibold text-cyan-700 font-mono">
                      {formatIDR(result.koperasiBakulIncome3Percent)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Bagian Simpanan/Tagihan Bakul (3% Berkala):</span>
                    <span className="font-semibold text-purple-700 font-mono">
                      {formatIDR(result.bakulMonthlyBill3Percent)}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-indigo-800 font-semibold block">
                        Total Tagihan Akhir Bakul
                      </span>
                      <span className="text-[10px] text-indigo-600">Rumus: X + (X × 6%)</span>
                    </div>
                    <span className="text-lg font-black text-indigo-700 font-mono">
                      {formatIDR(result.totalBakulPayable)}
                    </span>
                  </div>

                  <div className="bg-purple-500/10 border border-purple-500/20 p-2.5 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-purple-900 font-semibold block">
                        Komponen 3% Direkap Bulanan
                      </span>
                      <span className="text-[10px] text-purple-700">Dikeluarkan per 1 bulan pada invoice</span>
                    </div>
                    <span className="text-sm font-bold text-purple-800 font-mono">
                      {formatIDR(result.bakulMonthlyBill3Percent)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Consolidated Box: Total Keuntungan Koperasi */}
          <div className="bg-gradient-to-r from-cyan-900 to-blue-900 text-white rounded-2xl p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[11px] uppercase tracking-widest text-cyan-300 font-bold">
                  Rekap Keuntungan Koperasi per Transaksi
                </span>
                <p className="text-xs text-slate-300">
                  Rumus: (Pendapatan Bersih dari Petani: {selectedTier - 1}%) + (Bagian Koperasi dari Bakul: 3%)
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-cyan-200 font-mono">
                  <span>{formatIDR(result.koperasiFarmerIncome)}</span>
                  <span>+</span>
                  <span>{formatIDR(result.koperasiBakulIncome3Percent)}</span>
                  <span>=</span>
                  <span className="text-amber-300 font-bold">Margin Koperasi {selectedTier - 1 + 3}%</span>
                </div>
              </div>

              <div className="bg-white/10 px-5 py-3 rounded-xl border border-white/20 text-center sm:text-right">
                <span className="text-xs text-slate-300 block">Total Profit Bersih Koperasi:</span>
                <span className="text-2xl font-black text-amber-300 font-mono">
                  {formatIDR(result.totalKoperasiIncome)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl transition-all shadow-xs"
          >
            Tutup Simulator
          </button>
        </div>
      </div>
    </div>
  );
};
