import React, { useState, useEffect } from 'react';
import { X, Check, Scale, DollarSign, Calculator, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import { TransactionLedger, DiscountTier, User, CommodityMaster } from '../../types';
import { calculateAuctionFinancials, formatIDR } from '../../services/calculationEngine';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionLedger | null;
  users: User[];
  commodityMasters: CommodityMaster[];
  onSave: (updatedLedger: TransactionLedger) => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  users,
  commodityMasters,
  onSave,
}) => {
  const [farmerName, setFarmerName] = useState('');
  const [farmerId, setFarmerId] = useState('');
  const [bakulName, setBakulName] = useState('');
  const [bakulId, setBakulId] = useState('');
  const [commodityCategory, setCommodityCategory] = useState('');
  const [weightKgInput, setWeightKgInput] = useState('0');
  const [pricePerKg, setPricePerKg] = useState(0);
  const [discountTier, setDiscountTier] = useState<DiscountTier>(8);
  const [dateStr, setDateStr] = useState('');

  const farmers = users.filter((u) => u.role === 'petani');
  const bakuls = users.filter((u) => u.role === 'bakul');

  useEffect(() => {
    if (transaction) {
      setFarmerName(transaction.farmerName);
      setFarmerId(transaction.farmerId);
      setBakulName(transaction.bakulName);
      setBakulId(transaction.bakulId);
      setCommodityCategory(transaction.commodityCategory);
      setWeightKgInput(String(transaction.weightKg));
      setPricePerKg(transaction.pricePerKg);
      setDiscountTier(transaction.discountTier);
      setDateStr(transaction.createdAt.split('T')[0]);
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const parsedWeight = parseFloat(weightKgInput.replace(',', '.')) || 0;
  const currentGross = Math.round(parsedWeight * pricePerKg);
  const previewFinancials = calculateAuctionFinancials(currentGross, discountTier);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedWeight <= 0 || pricePerKg <= 0) return;

    // Recalculate all ledger fields cleanly
    const updated: TransactionLedger = {
      ...transaction,
      farmerId: farmerId || transaction.farmerId,
      farmerName: farmerName || transaction.farmerName,
      bakulId: bakulId || transaction.bakulId,
      bakulName: bakulName || transaction.bakulName,
      commodityCategory,
      weightKg: parsedWeight,
      pricePerKg,
      discountTier,
      grossPrice: currentGross,
      farmerCutPercent: previewFinancials.farmerCutPercent,
      farmerCutAmount: previewFinancials.farmerCutAmount,
      farmerRetention1Percent: previewFinancials.farmerRetention1Percent,
      koperasiFarmerIncome: previewFinancials.koperasiFarmerIncome,
      netFarmerAmount: previewFinancials.netFarmerAmount,
      bakulAdditional6Percent: previewFinancials.bakulAdditional6Percent,
      koperasiBakulIncome3Percent: previewFinancials.koperasiBakulIncome3Percent,
      bakulMonthlyBill3Percent: previewFinancials.bakulMonthlyBill3Percent,
      totalBakulPayable: previewFinancials.totalBakulPayable,
      totalKoperasiIncome: previewFinancials.totalKoperasiIncome,
      createdAt: `${dateStr}T${transaction.createdAt.split('T')[1] || '08:00:00Z'}`,
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">Edit Data Transaksi Lelang</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/20 text-cyan-300">
                  {transaction.id}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Koreksi bobot, harga, komoditas, atau pembeli. Nilai bagi hasil akan dikalkulasi ulang otomatis.
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tanggal Transaksi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Transaksi (YYYY-MM-DD)
              </label>
              <input
                type="date"
                required
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
              />
            </div>

            {/* Komoditas */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jenis Komoditas
              </label>
              <select
                value={commodityCategory}
                onChange={(e) => setCommodityCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
              >
                {commodityMasters.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.icon || '🐟'} {m.name} ({m.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Petani (Penjual) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Petani (Penjual)
              </label>
              <select
                value={farmerId}
                onChange={(e) => {
                  setFarmerId(e.target.value);
                  const found = farmers.find((f) => f.id === e.target.value);
                  if (found) setFarmerName(found.name);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
              >
                {farmers.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.phone})
                  </option>
                ))}
              </select>
            </div>

            {/* Bakul (Pembeli) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bakul (Pembeli Pemenang)
              </label>
              <select
                value={bakulId}
                onChange={(e) => {
                  setBakulId(e.target.value);
                  const found = bakuls.find((b) => b.id === e.target.value);
                  if (found) setBakulName(found.name);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
              >
                {bakuls.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.phone})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Bobot Kg */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bobot Timbang (Kg) <span className="text-slate-400 font-normal">(bisa 0.5)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={weightKgInput}
                  onChange={(e) => setWeightKgInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-bold">Kg</span>
              </div>
            </div>

            {/* Harga / Kg */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Harga Menang / Kg (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono font-bold">Rp</span>
                <input
                  type="number"
                  step={500}
                  min={1000}
                  required
                  value={pricePerKg}
                  onChange={(e) => setPricePerKg(Number(e.target.value))}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Tier Jasa Petani */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tier Potongan Petani
              </label>
              <select
                value={discountTier}
                onChange={(e) => setDiscountTier(Number(e.target.value) as DiscountTier)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
              >
                <option value={8}>Tier 8% (Standar / Non-Anggota)</option>
                <option value={6}>Tier 6% (Semi-Mitra / Kontrak)</option>
                <option value={3}>Tier 3% (Mitra Inti / Plasma)</option>
              </select>
            </div>
          </div>

          {/* Live Recalculation Preview */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-cyan-600" />
                <span>Kalkulasi Ulang Nilai Transaksi:</span>
              </span>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-semibold">NILAI KOTOR (X)</span>
                <span className="text-sm font-black font-mono text-slate-900">
                  {formatIDR(currentGross)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1 p-2.5 rounded-xl bg-white border border-slate-200">
                <span className="font-bold text-slate-700 block text-[11px]">SISI PETANI:</span>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Potongan ({discountTier}%):</span>
                  <span className="font-mono text-red-600 font-bold">-{formatIDR(previewFinancials.farmerCutAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Retensi 1%:</span>
                  <span className="font-mono text-amber-700 font-bold">{formatIDR(previewFinancials.farmerRetention1Percent)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700 pt-1 border-t border-slate-100">
                  <span>Cair Petani:</span>
                  <span className="font-mono">{formatIDR(previewFinancials.netFarmerAmount)}</span>
                </div>
              </div>

              <div className="space-y-1 p-2.5 rounded-xl bg-white border border-slate-200">
                <span className="font-bold text-slate-700 block text-[11px]">SISI BAKUL & KAS:</span>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Biaya Tambahan (+6%):</span>
                  <span className="font-mono text-indigo-600 font-bold">+{formatIDR(previewFinancials.bakulAdditional6Percent)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Kas Bersih Koperasi:</span>
                  <span className="font-mono text-cyan-800 font-bold">{formatIDR(previewFinancials.totalKoperasiIncome)}</span>
                </div>
                <div className="flex justify-between font-bold text-indigo-900 pt-1 border-t border-slate-100">
                  <span>Tagihan Bakul:</span>
                  <span className="font-mono">{formatIDR(previewFinancials.totalBakulPayable)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-md shadow-cyan-600/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
