import React, { useState } from 'react';
import { X, PlusCircle, Sparkles, Check, Package, Scale, DollarSign, Tag } from 'lucide-react';
import { CommodityMaster } from '../../types';

interface AddCommodityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCommodity: (commodity: Omit<CommodityMaster, 'id' | 'createdAt'>) => CommodityMaster;
}

const EMOJI_OPTIONS = ['🦐', '🐟', '🦀', '🦑', '🦞', '🦪', '🐠', '🐡', '🦈', '🐚'];

const SUGGESTED_TEMPLATES = [
  { name: 'Ikan Kakap Putih', code: 'KKP', icon: '🐟', variety: 'Size 600g - 1kg (Daging Tebal)', price: 75000, desc: 'Ikan tambak/muara air payau bernilai ekonomi tinggi, primadona restoran seafood.' },
  { name: 'Cumi-Cumi Sero', code: 'CMI', icon: '🦑', variety: 'Size 15-20cm (Segar Kristal)', price: 68000, desc: 'Tangkapan sero muara Blanakan segar, daging kenyal transparan belum kena air tawar.' },
  { name: 'Rajungan Karang', code: 'RJG', icon: '🦀', variety: 'Super Fresh Betina Telur', price: 110000, desc: 'Rajungan segar daging manis padat, standar pabrik pengolahan daging rajungan pasteurisasi.' },
  { name: 'Ikan Patin Tambak', code: 'PTN', icon: '🐟', variety: 'Size 1kg - 1.5kg', price: 26000, desc: 'Patin kolam budidaya pakan pelet apung, lemak gurih tidak bau tanah.' },
  { name: 'Kerang Dara', code: 'KRG', icon: '🦪', variety: 'Super Bersih Size Sedang', price: 22000, desc: 'Kerang tangkapan pesisir lumpur berpasir segar hidup.' },
  { name: 'Lobster Air Tawar', code: 'LBS', icon: '🦞', variety: 'Size 10-12 ekor/kg', price: 145000, desc: 'Lobster capit merah hasil budidaya kolam terpal/tanah, kondisi hidup segar.' },
];

export const AddCommodityModal: React.FC<AddCommodityModalProps> = ({
  isOpen,
  onClose,
  onAddCommodity,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [icon, setIcon] = useState('🐟');
  const [defaultVariety, setDefaultVariety] = useState('Grade Super Fresh');
  const [defaultPricePerKg, setDefaultPricePerKg] = useState<number>(50000);
  const [unit, setUnit] = useState('Kg');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleApplyTemplate = (tmpl: typeof SUGGESTED_TEMPLATES[0]) => {
    setName(tmpl.name);
    setCode(tmpl.code);
    setIcon(tmpl.icon);
    setDefaultVariety(tmpl.variety);
    setDefaultPricePerKg(tmpl.price);
    setDescription(tmpl.desc);
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Nama komoditas wajib diisi');
      return;
    }

    const generatedCode = code.trim().toUpperCase() || name.substring(0, 3).toUpperCase();

    onAddCommodity({
      name: name.trim(),
      code: generatedCode,
      icon,
      defaultVariety: defaultVariety.trim() || 'Grade Standar',
      defaultPricePerKg: defaultPricePerKg > 0 ? defaultPricePerKg : 30000,
      unit: unit.trim() || 'Kg',
      description: description.trim() || `Komoditas ${name} hasil tambak/tangkapan pesisir Pantura.`,
    });

    // Reset & close
    setName('');
    setCode('');
    setIcon('🐟');
    setDefaultVariety('Grade Super Fresh');
    setDefaultPricePerKg(50000);
    setDescription('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 via-cyan-800 to-blue-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner">
              {icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black tracking-tight">Tambah Master Komoditas Baru</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-400 text-slate-950 uppercase">
                  Katalog TPI
                </span>
              </div>
              <p className="text-xs text-cyan-100 mt-0.5">
                Daftarkan jenis ikan, udang, kepiting, atau biota tambak baru ke dalam sistem timbangan & lelang KUD
              </p>
            </div>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Contoh Cepat Komoditas Pesisir:</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {SUGGESTED_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.name}
                type="button"
                onClick={() => handleApplyTemplate(tmpl)}
                className="px-2.5 py-1 text-xs bg-white hover:bg-cyan-50 hover:border-cyan-300 border border-slate-200 rounded-lg text-slate-700 font-medium flex items-center gap-1 transition-all active:scale-95 shadow-2xs"
              >
                <span>{tmpl.icon}</span>
                <span>{tmpl.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Commodity Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Komoditas <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Misal: Ikan Kakap Putih, Cumi Sero..."
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!code) {
                      setCode(e.target.value.substring(0, 3).toUpperCase());
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Kode Singkatan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kode Singkat (3-4 Huruf)
              </label>
              <input
                type="text"
                maxLength={5}
                placeholder="KKP"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold uppercase focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pilih Simbol / Ikon Komoditas
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {EMOJI_OPTIONS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setIcon(em)}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                    icon === em
                      ? 'bg-cyan-600 text-white shadow-md ring-2 ring-cyan-400 scale-105'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Varietas Standar */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Varietas / Standar Ukuran Bawaan
              </label>
              <input
                type="text"
                placeholder="Misal: Size 40 / Super 500g"
                value={defaultVariety}
                onChange={(e) => setDefaultVariety(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
              />
            </div>

            {/* Estimasi Harga Acuan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Estimasi Harga Acuan Pasar (Rp/Kg)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400 font-mono">
                  Rp
                </span>
                <input
                  type="number"
                  step={1000}
                  min={1000}
                  value={defaultPricePerKg}
                  onChange={(e) => setDefaultPricePerKg(Number(e.target.value))}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan / Deskripsi Kualitas Standar
            </label>
            <textarea
              rows={2}
              placeholder="Misal: Daging segar dingin es, kulit keras, cocok untuk pasar ekspor / resto..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
            />
          </div>

          {/* Live Preview Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-cyan-50/50 border border-cyan-200/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white shadow-2xs border border-cyan-100 flex items-center justify-center text-xl">
                {icon}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-slate-900">
                    {name || 'Nama Komoditas'}
                  </span>
                  <span className="px-1.5 py-0.2 text-[10px] font-mono font-black bg-cyan-100 text-cyan-800 rounded">
                    {code || 'KOD'}
                  </span>
                </div>
                <span className="text-xs text-slate-500 block">
                  {defaultVariety} &bull; Acuan: Rp {defaultPricePerKg.toLocaleString('id-ID')} / {unit}
                </span>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
              Siap Dilelang
            </span>
          </div>

          {/* Actions */}
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
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white text-xs font-bold shadow-md shadow-cyan-600/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Simpan Komoditas ke Sistem</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
