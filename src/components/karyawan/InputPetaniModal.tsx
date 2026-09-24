import React, { useState } from 'react';
import { User, DiscountTier } from '../../types';
import { Fish, X, Check, Building, Phone, MapPin, CreditCard, ShieldCheck } from 'lucide-react';

interface InputPetaniModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveFarmer: (newFarmer: Omit<User, 'id'>) => User;
  onFarmerCreated?: (farmer: User) => void;
}

export const InputPetaniModal: React.FC<InputPetaniModalProps> = ({
  isOpen,
  onClose,
  onSaveFarmer,
  onFarmerCreated,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [tambakLocation, setTambakLocation] = useState('');
  const [bankName, setBankName] = useState('BRI Unit Blanakan');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [tierSuggestion, setTierSuggestion] = useState<DiscountTier>(6);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      return;
    }

    const created = onSaveFarmer({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '')}@petambak.id`,
      role: 'petani',
      status: 'active',
      tambakLocation: tambakLocation.trim() || 'Tambak Pesisir Pantura',
      bankAccount: {
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim() || '4120-00-000000-00-0',
        accountHolder: accountHolder.trim() || name.trim(),
      },
    });

    if (onFarmerCreated) {
      onFarmerCreated(created);
    }

    // Reset
    setName('');
    setPhone('');
    setEmail('');
    setTambakLocation('');
    setAccountNumber('');
    setAccountHolder('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center border border-amber-300">
              <Fish className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Registrasi Data Petani Baru</h3>
              <p className="text-xs text-slate-500">
                Pendaftaran cepat petambak di balai pelelangan untuk pencairan hasil lelang
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Nama Lengkap Petani / Pemilik Tambak <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: H. Darman Sulaeman"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nomor HP / WhatsApp <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Email (Opsional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="darman@tambak.id"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Lokasi Tambak / Blok Empang <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={tambakLocation}
                  onChange={(e) => setTambakLocation(e.target.value)}
                  placeholder="Contoh: Muara Blanakan, Tambak Blok D-05 (2 Kolam)"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Rekening Bank untuk Pencairan Tunai/Transfer */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Data Rekening Bank Pencairan Hasil Lelang & Retensi</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Nama Bank
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  <option value="BRI Unit Blanakan">BRI (Bank Rakyat Indonesia)</option>
                  <option value="Bank Mandiri">Bank Mandiri</option>
                  <option value="BCA">BCA (Bank Central Asia)</option>
                  <option value="BNI">BNI (Bank Negara Indonesia)</option>
                  <option value="BSI">BSI (Bank Syariah Indonesia)</option>
                  <option value="Bank BJB">Bank BJB</option>
                  <option value="Tunai Lapangan">Pembayaran Tunai di Lokasi Kasir</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Nomor Rekening
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Contoh: 4120-01-098871-53-1"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Nama Pemegang Rekening (Atas Nama)
              </label>
              <input
                type="text"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder={name ? `Sesuai nama: ${name}` : 'Nama sesuai buku tabungan'}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Tier Potongan Jasa Koperasi */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Status Keanggotaan & Rekomendasi Tier Jasa
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTierSuggestion(8)}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  tierSuggestion === 8
                    ? 'border-amber-500 bg-amber-50 text-amber-950 ring-1 ring-amber-500'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="block font-bold text-xs">8%</span>
                <span className="text-[10px] text-slate-500">Reguler / Non-Anggota</span>
              </button>

              <button
                type="button"
                onClick={() => setTierSuggestion(6)}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  tierSuggestion === 6
                    ? 'border-amber-500 bg-amber-50 text-amber-950 ring-1 ring-amber-500'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="block font-bold text-xs">6%</span>
                <span className="text-[10px] text-slate-500">Anggota Koperasi</span>
              </button>

              <button
                type="button"
                onClick={() => setTierSuggestion(3)}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  tierSuggestion === 3
                    ? 'border-amber-500 bg-amber-50 text-amber-950 ring-1 ring-amber-500'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="block font-bold text-xs">3%</span>
                <span className="text-[10px] text-slate-500">Mitra Prioritas</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-600/20 transition-all active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Data Petani</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
