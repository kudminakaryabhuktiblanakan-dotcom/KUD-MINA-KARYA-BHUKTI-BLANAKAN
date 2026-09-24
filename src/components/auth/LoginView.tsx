import React, { useState } from 'react';
import { 
  Waves, 
  ShieldCheck, 
  TrendingUp, 
  Scale, 
  Fish, 
  ShoppingBag, 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound,
  ShieldAlert,
  Sparkles,
  Phone,
  Mail,
  Building2,
  Info
} from 'lucide-react';
import { User, UserRole } from '../../types';

interface LoginViewProps {
  users: User[];
  onLogin?: (user: User) => void;
  onLoginSuccess?: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ users, onLogin, onLoginSuccess }) => {
  const notifyLogin = (user: User) => {
    if (onLogin) onLogin(user);
    if (onLoginSuccess) onLoginSuccess(user);
  };
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedQuickRole, setSelectedQuickRole] = useState<UserRole>('karyawan');
  const [loginMode, setLoginMode] = useState<'form' | 'quick'>('quick');

  const roleDefinitions: Record<UserRole, {
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    color: string;
    bgBadge: string;
    borderBadge: string;
    capacitySummary: string[];
  }> = {
    admin: {
      title: 'Administrator Master',
      subtitle: 'Pengawasan Penuh, Pengaturan Akses & Sistem',
      icon: <ShieldCheck className="w-5 h-5 text-purple-600" />,
      color: 'from-purple-600 to-indigo-700',
      bgBadge: 'bg-purple-100 text-purple-800',
      borderBadge: 'border-purple-200',
      capacitySummary: [
        'Akses penuh kelola pengguna & beri hak akses',
        'Audit buku besar (ledger) & konfigurasi tier',
        'Laporan menyeluruh & pemeliharaan data'
      ]
    },
    manager: {
      title: 'Manajer Keuangan',
      subtitle: 'Otorisasi Keuangan, Retensi & Tagihan',
      icon: <TrendingUp className="w-5 h-5 text-blue-600" />,
      color: 'from-blue-600 to-cyan-700',
      bgBadge: 'bg-blue-100 text-blue-800',
      borderBadge: 'border-blue-200',
      capacitySummary: [
        'Otorisasi pencairan tabungan retensi 1% petani (3 bln)',
        'Verifikasi & approval tagihan bulanan 3% bakul',
        'Laporan laba rugi & pembukuan kas koperasi'
      ]
    },
    karyawan: {
      title: 'Kasir / Petugas Timbang',
      subtitle: 'Operasional Lapangan, Timbangan & Lelang',
      icon: <Scale className="w-5 h-5 text-emerald-600" />,
      color: 'from-emerald-600 to-teal-700',
      bgBadge: 'bg-emerald-100 text-emerald-800',
      borderBadge: 'border-emerald-200',
      capacitySummary: [
        'Input penimbangan komoditas lot petani',
        'Eksekusi lelang langsung & bidding bakul',
        'Cetak nota/struk lelang & input anggota baru'
      ]
    },
    petani: {
      title: 'Petani Tambak (Penjual)',
      subtitle: 'Hasil Tangkapan, Potongan & Tabungan Retensi',
      icon: <Fish className="w-5 h-5 text-amber-600" />,
      color: 'from-amber-600 to-orange-700',
      bgBadge: 'bg-amber-100 text-amber-800',
      borderBadge: 'border-amber-200',
      capacitySummary: [
        'Khusus data hasil lelang tangkapan miliknya sendiri',
        'Transparansi potongan tier (8%/6%/3%) & cair hari H',
        'Cek status tabungan retensi 1% (tertahan / siap cair)'
      ]
    },
    bakul: {
      title: 'Bakul / Tengkulak (Pembeli)',
      subtitle: 'Ruang Bidding Lelang, Nota & Tagihan Bulanan',
      icon: <ShoppingBag className="w-5 h-5 text-indigo-600" />,
      color: 'from-indigo-600 to-blue-800',
      bgBadge: 'bg-indigo-100 text-indigo-800',
      borderBadge: 'border-indigo-200',
      capacitySummary: [
        'Khusus data pembelian & penawaran lelang miliknya',
        'Nota belanja lelang (+6% biaya lelang koperasi)',
        'Rekap tagihan bulanan 3% & riwayat pembayaran'
      ]
    }
  };

  const roleUsers = users.filter((u) => u.role === selectedQuickRole);

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanInput = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanInput) {
      setErrorMessage('Silakan masukkan Email, Username, atau Nomor HP Anda.');
      return;
    }

    // Find user by email, phone, or name matching
    const foundUser = users.find(
      (u) =>
        u.email.toLowerCase() === cleanInput ||
        u.phone.replace(/[^0-9]/g, '') === cleanInput.replace(/[^0-9]/g, '') ||
        u.name.toLowerCase() === cleanInput
    );

    if (!foundUser) {
      setErrorMessage('Pengguna tidak ditemukan. Periksa kembali email, nomor HP, atau gunakan menu Pilih Cepat Akun Demo.');
      return;
    }

    // Check account status
    if (foundUser.status === 'suspended') {
      setErrorMessage('AKSES DITOLAK: Akun Anda sedang ditangguhkan oleh Administrator KUD. Silakan hubungi bagian manajemen.');
      return;
    }

    // Check password
    if (foundUser.password && cleanPass && foundUser.password !== cleanPass && cleanPass !== '123456') {
      setErrorMessage('Kata sandi yang Anda masukkan salah. (Petunjuk demo: gunakan kata sandi sesuai peran atau "123456").');
      return;
    }

    // Successful login
    notifyLogin(foundUser);
  };

  const handleQuickLogin = (user: User) => {
    if (user.status === 'suspended') {
      setErrorMessage(`AKSES DITOLAK: Akun ${user.name} (${user.role.toUpperCase()}) sedang ditangguhkan oleh pengurus.`);
      return;
    }
    setErrorMessage(null);
    notifyLogin(user);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden font-sans">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 z-10 grid grid-cols-1 lg:grid-cols-12">
        {/* Left Column: Branding, Context & Identity */}
        <div className="lg:col-span-5 bg-gradient-to-br from-cyan-950 via-slate-900 to-blue-950 p-8 text-white flex flex-col justify-between relative">
          <div className="relative z-10 space-y-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/30">
                <Waves className="w-7 h-7 text-slate-950" />
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-cyan-400 block">
                  TPI & PANGKALAN LELANG
                </span>
                <h1 className="text-xl font-black tracking-tight text-white leading-tight">
                  KUD Mina Karya Bhukti
                </h1>
              </div>
            </div>

            <div className="pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-3">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Portal Akses Resmi & Terintegrasi</span>
              </div>
              <h2 className="text-2xl font-bold leading-tight text-white">
                Sistem Informasi Lelang, Bagi Hasil & Keuangan
              </h2>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Login aman untuk Petugas Timbang, Petani Tambak, Bakul/Tengkulak, Manajer Keuangan, dan Pengurus KUD TPI Blanakan.
              </p>
            </div>

            {/* Capacity Security Summary */}
            <div className="space-y-2.5 pt-4 border-t border-white/10 text-xs">
              <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider block">
                Hak Akses Sesuai Kapasitas:
              </span>
              <div className="flex items-start gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">Petani:</strong> Isolasi privasi data penjualan & retensi 1% miliknya</span>
              </div>
              <div className="flex items-start gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">Bakul:</strong> Ruang bidding, nota pembelian +6% & tagihan 3%</span>
              </div>
              <div className="flex items-start gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">Karyawan:</strong> Penimbangan digital & eksekusi lelang lapangan</span>
              </div>
              <div className="flex items-start gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">Manajer & Admin:</strong> Otorisasi pencairan & manajemen akses</span>
              </div>
            </div>
          </div>

          <div className="pt-8 text-[11px] text-slate-400 flex items-center justify-between border-t border-white/10 mt-6">
            <span>v2.4 &bull; Wilayah Kerja TPI Blanakan</span>
            <span className="text-cyan-400 font-medium">Koperasi Sejahtera</span>
          </div>
        </div>

        {/* Right Column: Login Portal Form & Quick Role Selection */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between bg-white">
          <div className="space-y-5">
            {/* Top Switcher: Form Login vs Quick Login Demo */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Pintu Masuk Pengguna
                </h3>
                <p className="text-xs text-slate-500">
                  Pilih cara masuk sesuai peran dan kapasitas Anda
                </p>
              </div>

              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('quick');
                    setErrorMessage(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    loginMode === 'quick'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 inline mr-1 text-amber-500" />
                  Pilih Cepat Peran
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('form');
                    setErrorMessage(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    loginMode === 'form'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5 inline mr-1 text-cyan-600" />
                  Ketik Kredensial
                </button>
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">Gagal Masuk</span>
                  <p>{errorMessage}</p>
                </div>
              </div>
            )}

            {/* MODE 1: QUICK ROLE SELECTION (Direct Demo Access) */}
            {loginMode === 'quick' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                    1. Pilih Kapasitas / Peran Anda:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {(['admin', 'manager', 'karyawan', 'petani', 'bakul'] as UserRole[]).map((r) => {
                      const def = roleDefinitions[r];
                      const isSelected = selectedQuickRole === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            setSelectedQuickRole(r);
                            setErrorMessage(null);
                          }}
                          className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-cyan-600 bg-cyan-50/70 ring-2 ring-cyan-500/20 text-slate-900 shadow-xs'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                        >
                          <div className="p-1.5 rounded-lg bg-white shadow-2xs">
                            {def.icon}
                          </div>
                          <span className="text-[11px] font-bold capitalize leading-tight">
                            {r === 'karyawan' ? 'Kasir/Timbang' : r}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Role Description Card & Capacity Details */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      {roleDefinitions[selectedQuickRole].title}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${roleDefinitions[selectedQuickRole].bgBadge}`}>
                      Kapasitas: {selectedQuickRole}
                    </span>
                  </div>
                  <ul className="text-[11px] text-slate-600 space-y-1">
                    {roleDefinitions[selectedQuickRole].capacitySummary.map((cap, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />
                        <span>{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* User Cards for this selected role */}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                    2. Pilih Akun Pengguna ({roleUsers.length} Terdaftar):
                  </label>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {roleUsers.map((u) => {
                      const isSuspended = u.status === 'suspended';
                      return (
                        <div
                          key={u.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                            isSuspended
                              ? 'bg-rose-50/50 border-rose-200 opacity-70'
                              : 'bg-white border-slate-200 hover:border-cyan-500 hover:shadow-xs'
                          }`}
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900 truncate">
                                {u.name}
                              </span>
                              {isSuspended ? (
                                <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 text-[10px] font-bold">
                                  Ditangguhkan
                                </span>
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">
                              {u.email} &bull; {u.phone}
                            </p>
                            {u.tambakLocation && (
                              <p className="text-[10px] text-amber-700 font-medium truncate">
                                Tambak: {u.tambakLocation}
                              </p>
                            )}
                            {u.bakulMarketArea && (
                              <p className="text-[10px] text-indigo-700 font-medium truncate">
                                Area: {u.bakulMarketArea}
                              </p>
                            )}
                            {u.shiftLocation && (
                              <p className="text-[10px] text-emerald-700 font-medium truncate">
                                Shift: {u.shiftLocation}
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleQuickLogin(u)}
                            disabled={isSuspended}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 transition-all ${
                              isSuspended
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-slate-900 hover:bg-cyan-600 text-white shadow-xs cursor-pointer'
                            }`}
                          >
                            <span>Masuk</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* MODE 2: MANUAL FORM LOGIN */}
            {loginMode === 'form' && (
              <form onSubmit={handleManualLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Email, Username, atau No. Handphone
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="contoh: petugas.asep@koperasitambak.id / 0857-1122-3344"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-hidden transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Kata Sandi / PIN Keamanan
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Demo password: <code className="text-slate-600 font-mono">123456</code>
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi akun Anda"
                      className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-hidden transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
                    <span>Ingat sesi masuk di perangkat ini</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode('quick');
                      setErrorMessage(null);
                    }}
                    className="text-cyan-600 hover:text-cyan-700 font-semibold"
                  >
                    Bantuan Login
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-bold text-xs rounded-xl shadow-md shadow-cyan-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>Masuk ke Sistem TPI Blanakan</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

          {/* Footer Assistance */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 mt-4">
            <span className="flex items-center gap-1 text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Terkoneksi aman dengan Server KUD
            </span>
            <span className="text-slate-400">
              Butuh akun baru? Hubungi Admin KUD
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
