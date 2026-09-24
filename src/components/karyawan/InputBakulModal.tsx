import React, { useState } from 'react';
import { User } from '../../types';
import { ShoppingBag, X, Check, Phone, MapPin, Truck, CreditCard } from 'lucide-react';

interface InputBakulModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBakul: (newBakul: Omit<User, 'id'>) => User;
  onBakulCreated?: (bakul: User) => void;
}

export const InputBakulModal: React.FC<InputBakulModalProps> = ({
  isOpen,
  onClose,
  onSaveBakul,
  onBakulCreated,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [marketArea, setMarketArea] = useState('');
  const [bankName, setBankName] = useState('BCA');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !marketArea.trim()) {
      return;
    }

    const created = onSaveBakul({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '')}@bakul.id`,
      role: 'bakul',
      status: 'active',
      bakulMarketArea: marketArea.trim(),
      bankAccount: {
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim() || '800-000-0000',
        accountHolder: accountHolder.trim() || name.trim(),
      },
    });

    if (onBakulCreated) {
      onBakulCreated(created);
    }

    // Reset
    setName('');
    setPhone('');
    setEmail('');
    setMarketArea('');
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
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-blue-50/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-700 flex items-center justify-center border border-indigo-300">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Registrasi Data Bakul / Pembeli Baru</h3>
              <p className="text-xs text-slate-500">
                Pendaftaran peserta lelang pedagang ikan/udang & pembeli grosir di TPI
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
                Nama Bakul / Juragan / Usaha Pembeli <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Juragan Sodikin / CV Bahari Mandiri"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
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
                    placeholder="0852-xxxx-xxxx"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
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
                  placeholder="sodikin.seafood@gmail.com"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Wilayah Pasar & Rute Distribusi <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Truck className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={marketArea}
                  onChange={(e) => setMarketArea(e.target.value)}
                  placeholder="Contoh: Pasar Muara Angke Jakarta / Ekspedisi Truk Berpendingin"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                Tulis tujuan pasar distribusi atau armada logistik yang digunakan.
              </span>
            </div>
          </div>

          {/* Rekening Bank Pembeli */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>Rekening Bank / Catatan Pembayaran</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Nama Bank
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="BCA">BCA (Bank Central Asia)</option>
                  <option value="Bank Mandiri">Bank Mandiri</option>
                  <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                  <option value="BNI">BNI (Bank Negara Indonesia)</option>
                  <option value="BSI">BSI (Bank Syariah Indonesia)</option>
                  <option value="Tunai">Setoran Tunai Langsung Kasir</option>
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
                  placeholder="Contoh: 822-019-3381"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Atas Nama Pemilik Rekening
              </label>
              <input
                type="text"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder={name ? `Sesuai nama: ${name}` : 'Nama pemilik rekening'}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Ketentuan Tagihan 6% */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs space-y-1 text-indigo-950">
            <span className="font-bold block">Pemberitahuan Skema Lelang untuk Bakul:</span>
            <p className="text-[11px] leading-relaxed text-indigo-800">
              Setiap pembelian lelang dikenakan tambahan <strong>+6%</strong> (3% jasa kas koperasi langsung + 3% tagihan bulanan / simpanan wajib yang ditagih tiap akhir bulan).
            </p>
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
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Data Bakul</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
