import React, { useState, useMemo } from 'react';
import { 
  Scale, 
  Gavel, 
  Printer, 
  PlusCircle, 
  CheckCircle, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  Users,
  ShoppingBag,
  Fish,
  Search,
  Check,
  ChevronRight,
  ArrowRight,
  Phone,
  MapPin,
  CreditCard,
  Sparkles,
  Zap,
  Tag,
  DollarSign,
  Receipt,
  FileText,
  UserPlus,
  Send,
  Package,
  FileSpreadsheet
} from 'lucide-react';
import { 
  User, 
  Commodity, 
  CommodityMaster,
  Auction, 
  CommodityCategory, 
  DiscountTier, 
  TransactionLedger,
  DirectAuctionSaleData 
} from '../../types';
import { calculateAuctionFinancials, formatIDR, formatIndoDate } from '../../services/calculationEngine';
import { InputPetaniModal } from '../karyawan/InputPetaniModal';
import { InputBakulModal } from '../karyawan/InputBakulModal';
import { AddCommodityModal } from '../commodities/AddCommodityModal';
import { CommodityDirectoryView } from '../commodities/CommodityDirectoryView';
import { PeriodReportView } from '../reports/PeriodReportView';
import { INITIAL_COMMODITY_MASTERS } from '../../data/mockData';

interface KaryawanViewProps {
  users: User[];
  commodities: Commodity[];
  auctions: Auction[];
  ledgers: TransactionLedger[];
  commodityMasters?: CommodityMaster[];
  currentSimulatedDate?: Date;
  onAddNewWeighing: (newCommodity: Partial<Commodity>, startPrice: number, tier: DiscountTier) => void;
  onPlaceBid: (auctionId: string, bakulId: string, bidPricePerKg: number) => void;
  onConcludeAuction: (auctionId: string) => void;
  onAddUser?: (newUser: Omit<User, 'id'>) => User;
  onDirectAuctionSale?: (data: DirectAuctionSaleData) => TransactionLedger;
  onAddCommodityMaster?: (commodity: Omit<CommodityMaster, 'id' | 'createdAt'>) => CommodityMaster;
  onUpdateLedger?: (updatedLedger: TransactionLedger) => void;
  onDeleteLedger?: (ledgerId: string) => void;
  onDeleteAllLedgers?: () => void;
  onImportLedgers?: (newLedgers: TransactionLedger[]) => void;
}

export const KaryawanView: React.FC<KaryawanViewProps> = ({
  users,
  commodities,
  auctions,
  ledgers,
  commodityMasters = INITIAL_COMMODITY_MASTERS,
  currentSimulatedDate,
  onAddNewWeighing,
  onPlaceBid,
  onConcludeAuction,
  onAddUser,
  onDirectAuctionSale,
  onAddCommodityMaster,
  onUpdateLedger,
  onDeleteLedger,
  onDeleteAllLedgers,
  onImportLedgers,
}) => {
  const [activeTab, setActiveTab] = useState<'input_lelang' | 'lelang' | 'data_petani' | 'data_bakul' | 'data_komoditas' | 'laporan' | 'struk'>('input_lelang');

  // Modals for Quick Add User & Commodity on the fly
  const [isFarmerModalOpen, setIsFarmerModalOpen] = useState(false);
  const [isBakulModalOpen, setIsBakulModalOpen] = useState(false);
  const [isAddCommodityModalOpen, setIsAddCommodityModalOpen] = useState(false);

  // Filtered lists
  const farmers = useMemo(() => users.filter((u) => u.role === 'petani'), [users]);
  const bakuls = useMemo(() => users.filter((u) => u.role === 'bakul'), [users]);

  // Form State for Penimbangan & Lelang
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>(farmers[0]?.id || '');
  const [category, setCategory] = useState<CommodityCategory>('Udang Vaname');
  const [variety, setVariety] = useState<string>('Size 40');
  // Weight input stored as string to support "0.5", "0,75", "0.2" cleanly without snapping
  const [weightKgInput, setWeightKgInput] = useState<string>('320');
  const [qualityNotes, setQualityNotes] = useState<string>('Segar dingin es, kulit keras, panen fajar');
  const [tier, setTier] = useState<DiscountTier>(8);
  const [pricePerKg, setPricePerKg] = useState<number>(85000);
  const [pondNumber, setPondNumber] = useState<string>('Tambak Blok B-03');

  // Direct closing options
  const [executionMode, setExecutionMode] = useState<'live_auction' | 'direct_close'>('live_auction');
  const [directWinningBakulId, setDirectWinningBakulId] = useState<string>(bakuls[0]?.id || '');

  // Search states for directory tabs
  const [farmerSearch, setFarmerSearch] = useState('');
  const [bakulSearch, setBakulSearch] = useState('');

  // Bid step per click for operator
  const [operatorBidStep, setOperatorBidStep] = useState<number>(500);

  // Modal receipt state
  const [selectedLedgerForReceipt, setSelectedLedgerForReceipt] = useState<TransactionLedger | null>(
    ledgers[0] || null
  );

  // Active auction
  const activeAuction = auctions.find((a) => a.status === 'live');

  // Selected Farmer details
  const selectedFarmer = useMemo(() => {
    return farmers.find((f) => f.id === selectedFarmerId) || farmers[0];
  }, [farmers, selectedFarmerId]);

  // Numeric weight value (supports decimals like 0.25, 0.5, 0.75 Kg)
  const numericWeightKg = useMemo(() => {
    const clean = String(weightKgInput).replace(',', '.').trim();
    const val = parseFloat(clean);
    return isNaN(val) ? 0 : val;
  }, [weightKgInput]);

  // Live calculation preview in form
  const previewGross = Math.round(numericWeightKg * pricePerKg);
  const previewFinancials = useMemo(() => {
    return calculateAuctionFinancials(previewGross, tier);
  }, [previewGross, tier]);

  // Handle Commodity & Auction Creation
  const handleSaveAuctionEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmer || numericWeightKg <= 0) return;

    if (executionMode === 'live_auction') {
      // 1. Open Live Auction session
      onAddNewWeighing(
        {
          farmerId: selectedFarmer.id,
          farmerName: selectedFarmer.name,
          category,
          variety,
          initialWeightKg: numericWeightKg,
          qualityNotes,
          pondNumber,
          harvestDate: new Date().toISOString().split('T')[0],
        },
        pricePerKg,
        tier
      );
      // Switch to live auction console
      setActiveTab('lelang');
    } else {
      // 2. Direct Closing / Ketok Palu Lapangan Langsung
      const winningBakul = bakuls.find((b) => b.id === directWinningBakulId) || bakuls[0];
      if (onDirectAuctionSale && winningBakul) {
        const createdLedger = onDirectAuctionSale({
          farmerId: selectedFarmer.id,
          farmerName: selectedFarmer.name,
          bakulId: winningBakul.id,
          bakulName: winningBakul.name,
          category,
          variety,
          initialWeightKg: numericWeightKg,
          qualityNotes,
          pondNumber,
          pricePerKg,
          discountTier: tier,
        });

        setSelectedLedgerForReceipt(createdLedger);
        setActiveTab('struk');
      }
    }
  };

  // Helper when user selects a preset commodity
  const handleSelectCategoryPreset = (cat: CommodityCategory, defaultVariety: string, defaultPrice: number) => {
    setCategory(cat);
    setVariety(defaultVariety);
    setPricePerKg(defaultPrice);
  };

  // Quick weight increments
  const handleAddWeight = (delta: number) => {
    const current = numericWeightKg;
    const next = Math.max(0.01, Math.round((current + delta) * 1000) / 1000);
    setWeightKgInput(String(next));
  };

  const handleSetPresetWeight = (preset: number) => {
    setWeightKgInput(String(preset));
  };

  // Quick price increments
  const handleAddPrice = (delta: number) => {
    setPricePerKg((prev) => Math.max(1000, prev + delta));
  };

  // Filtered farmers and buyers for directories
  const filteredFarmers = useMemo(() => {
    if (!farmerSearch.trim()) return farmers;
    const q = farmerSearch.toLowerCase();
    return farmers.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.phone.toLowerCase().includes(q) ||
        (f.tambakLocation && f.tambakLocation.toLowerCase().includes(q))
    );
  }, [farmers, farmerSearch]);

  const filteredBakuls = useMemo(() => {
    if (!bakulSearch.trim()) return bakuls;
    const q = bakulSearch.toLowerCase();
    return bakuls.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.phone.toLowerCase().includes(q) ||
        (b.bakulMarketArea && b.bakulMarketArea.toLowerCase().includes(q))
    );
  }, [bakuls, bakulSearch]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Fast Action Bar */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-emerald-800/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                  Pusat Input & Konsol Petugas Lapangan
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Petugas Timbang & Kasir
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 mt-1 max-w-2xl">
                Sistem entri terpadu untuk memasukkan <strong>Data Petani</strong>, <strong>Data Bakul</strong>, serta <strong>Penimbangan & Lelang</strong> secara cepat dan akurat.
              </p>
            </div>
          </div>

          {/* Quick Action Shortcut Buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => setIsFarmerModalOpen(true)}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
            >
              <UserPlus className="w-4 h-4 text-amber-300" />
              <span>+ Petani Baru</span>
            </button>

            <button
              onClick={() => setIsBakulModalOpen(true)}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
            >
              <ShoppingBag className="w-4 h-4 text-indigo-300" />
              <span>+ Bakul Baru</span>
            </button>

            <button
              onClick={() => setActiveTab('input_lelang')}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <Scale className="w-4 h-4" />
              <span>+ Timbang & Lelang</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none flex-nowrap">
        <button
          onClick={() => setActiveTab('input_lelang')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'input_lelang'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Input Timbangan & Lelang</span>
        </button>

        <button
          onClick={() => setActiveTab('lelang')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'lelang'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Gavel className="w-4 h-4" />
          <span>Konsol Lelang Berjalan</span>
          {activeAuction ? (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          ) : null}
        </button>

        <button
          onClick={() => setActiveTab('data_petani')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'data_petani'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Fish className="w-4 h-4" />
          <span>Data Petani ({farmers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('data_bakul')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'data_bakul'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Data Bakul ({bakuls.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('data_komoditas')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'data_komoditas'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4 text-teal-400" />
          <span>Komoditas & Rekap Total ({commodityMasters.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('laporan')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'laporan'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Laporan H/B/T, Edit, Hapus & Impor</span>
        </button>

        <button
          onClick={() => setActiveTab('struk')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'struk'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>Nota Timbang & Struk Kasir</span>
        </button>
      </div>

      {/* SUB-TAB 1: INPUT TIMBANGAN & LELANG (TERPADU & MUDAH) */}
      {activeTab === 'input_lelang' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Form Left/Center (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                  <Scale className="w-5 h-5 text-emerald-600" />
                  <span>Formulir Timbangan & Lelang Komoditas</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Isi data panen yang masuk ke dermaga pelelangan. Bisa langsung dibuka live atau dicatat selesai.
                </p>
              </div>

              {/* Mode Switcher */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-[11px] font-bold border border-slate-200">
                <button
                  type="button"
                  onClick={() => setExecutionMode('live_auction')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    executionMode === 'live_auction'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Buka Live Bidding
                </button>
                <button
                  type="button"
                  onClick={() => setExecutionMode('direct_close')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    executionMode === 'direct_close'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Catat Selesai (Langsung)
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveAuctionEntry} className="space-y-5">
              {/* STEP 1: PEMILIHAN PETANI DENGAN QUICK ADD */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black flex items-center justify-center">
                      1
                    </span>
                    <span>Pilih Petani (Pemilik Panen)</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsFarmerModalOpen(true)}
                    className="text-xs text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 underline"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Petani Baru Belum Terdaftar?</span>
                  </button>
                </div>

                <select
                  value={selectedFarmerId}
                  onChange={(e) => setSelectedFarmerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                >
                  {farmers.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} &bull; {f.tambakLocation || 'Petambak Pantura'}
                    </option>
                  ))}
                </select>

                {selectedFarmer && (
                  <div className="p-2.5 bg-amber-50/60 border border-amber-200/80 rounded-xl flex items-center justify-between text-[11px] text-amber-900">
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span className="truncate">Tambak: {selectedFarmer.tambakLocation || 'Pantura Subang'}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 font-mono">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{selectedFarmer.bankAccount?.bankName} ({selectedFarmer.bankAccount?.accountNumber})</span>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 2: PILIH KOMODITAS PRESET 1-KLIK */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black flex items-center justify-center">
                      2
                    </span>
                    <span>Pilih Komoditas ({commodityMasters.length} Terdaftar)</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddCommodityModalOpen(true)}
                    className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200 flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>+ Komoditas Baru</span>
                  </button>
                </div>

                {/* Dynamic Preset Chips from commodityMasters */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {commodityMasters.map((preset) => {
                    const isSelected = category === preset.name;
                    return (
                      <button
                        type="button"
                        key={preset.id}
                        onClick={() => handleSelectCategoryPreset(preset.name, preset.defaultVariety, preset.defaultPricePerKg)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 font-bold ring-1 ring-emerald-500'
                            : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100 font-medium'
                        }`}
                      >
                        <span className="text-xs block flex items-center gap-1">
                          <span>{preset.icon || '🐟'}</span>
                          <span className="truncate">{preset.name}</span>
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">Rekom: {preset.defaultVariety}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Kategori Spesifik
                    </label>
                    <select
                      value={category}
                      onChange={(e) => {
                        const chosen = commodityMasters.find((m) => m.name === e.target.value);
                        setCategory(e.target.value);
                        if (chosen) {
                          setVariety(chosen.defaultVariety);
                          setPricePerKg(chosen.defaultPricePerKg);
                        }
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    >
                      {commodityMasters.map((m) => (
                        <option key={m.id} value={m.name}>
                          {m.icon ? `${m.icon} ` : ''}{m.name} ({m.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Varietas / Ukuran (Size)
                    </label>
                    <input
                      type="text"
                      value={variety}
                      onChange={(e) => setVariety(e.target.value)}
                      placeholder="Contoh: Size 40 / Cabut Duri"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* STEP 3: BOBOT TIMBANG & PRESET CEPAT (MENDUKUNG DESIMAL < 1 KG) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black flex items-center justify-center">
                      3
                    </span>
                    <span>Bobot Timbangan Masuk (Kg)</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-emerald-800 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300">
                    Bisa angka 0, sekian (contoh: 0,25 / 0,5 / 0,75 Kg)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      required
                      value={weightKgInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        // Allow digits, decimal point, comma, or empty
                        if (/^[0-9]*[.,]?[0-9]*$/.test(val) || val === '') {
                          setWeightKgInput(val);
                        }
                      }}
                      placeholder="Contoh: 0.5 atau 0,75"
                      className="w-full px-4 py-2.5 text-base sm:text-lg font-black font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                    <span className="absolute right-3 top-3 text-xs font-bold text-slate-400">
                      KG
                    </span>
                  </div>

                  {/* Increment Buttons with both micro/sub-1kg and standard increments */}
                  <div className="flex items-center gap-1">
                    {[+0.1, +0.5, +1, +10, +50].map((delta) => (
                      <button
                        type="button"
                        key={delta}
                        onClick={() => handleAddWeight(delta)}
                        className="px-2.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-mono font-bold transition-all"
                        title={`Tambah ${delta} Kg`}
                      >
                        +{delta}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Presets (Termasuk bobot di bawah 1 kg untuk kepiting, ikan per ekor, atau sampel) */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[11px] font-semibold text-slate-500">Pilihan cepat:</span>
                  {[0.25, 0.5, 0.75, 1, 2, 5, 20, 50, 100, 320].map((pVal) => (
                    <button
                      key={pVal}
                      type="button"
                      onClick={() => handleSetPresetWeight(pVal)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-mono font-semibold transition-all ${
                        numericWeightKg === pVal
                          ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {pVal < 1 ? `${pVal} kg (${pVal * 1000}gr)` : `${pVal} kg`}
                    </button>
                  ))}
                </div>

                {/* Catatan Mutu / Kesegaran */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-600">
                      Catatan Mutu & Kesegaran:
                    </label>
                    <div className="flex items-center gap-1">
                      {['Segar Dingin Es', 'Kulit Keras', 'Mutu A'].map((tag) => (
                        <button
                          type="button"
                          key={tag}
                          onClick={() => setQualityNotes(tag)}
                          className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={qualityNotes}
                    onChange={(e) => setQualityNotes(e.target.value)}
                    placeholder="Contoh: Segar dingin es, tidak lembek, panen fajar"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* STEP 4: HARGA & TIER JASA KOPERASI */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black flex items-center justify-center">
                      4
                    </span>
                    <span>
                      {executionMode === 'live_auction' ? 'Harga Buka Lelang / Kg (Rp)' : 'Harga Ketok Palu / Kg (Rp)'}
                    </span>
                    <span className="text-red-500">*</span>
                  </label>

                  <div className="flex items-center gap-1">
                    {[+2000, +5000, +10000].map((pDelta) => (
                      <button
                        type="button"
                        key={pDelta}
                        onClick={() => handleAddPrice(pDelta)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-mono font-bold"
                      >
                        +{pDelta.toLocaleString('id-ID')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    step={1000}
                    min={1000}
                    required
                    value={pricePerKg}
                    onChange={(e) => setPricePerKg(Math.max(1000, Number(e.target.value)))}
                    className="w-full pl-10 pr-4 py-2.5 text-base sm:text-lg font-black font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* Tier Jasa Koperasi */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Pilihan Tier Potongan Jasa Koperasi Petani:
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {([8, 6, 3] as DiscountTier[]).map((t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => setTier(t)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          tier === t
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="block text-sm font-black">{t}%</span>
                        <span className="text-[10px] text-slate-500 block">
                          {t === 8 ? 'Reguler' : t === 6 ? 'Anggota Koperasi' : 'Mitra Prioritas'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* IF DIRECT CLOSING: SELECT WINNING BAKUL */}
              {executionMode === 'direct_close' && (
                <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-indigo-700" />
                      <span>Pilih Bakul Pemenang (Ketok Palu Lapangan):</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsBakulModalOpen(true)}
                      className="text-xs text-indigo-700 hover:text-indigo-900 font-bold underline"
                    >
                      + Bakul Baru
                    </button>
                  </div>

                  <select
                    value={directWinningBakulId}
                    onChange={(e) => setDirectWinningBakulId(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm font-semibold border border-indigo-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    {bakuls.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} &bull; {b.bakulMarketArea || 'Pasar Distribusi'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* SUBMIT BUTTON */}
              <div className="pt-3 border-t border-slate-200">
                {executionMode === 'live_auction' ? (
                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-98"
                  >
                    <Gavel className="w-4 h-4" />
                    <span>Simpan Penimbangan & Buka Sesi Lelang Live</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 transition-all active:scale-98"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Ketok Palu Selesai & Cetak Nota Kasir</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Right Column: Live Financial Preview Card (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-700 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-300 border border-emerald-500/30">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-white">Simulasi Keuangan Real-Time</h4>
                    <p className="text-[11px] text-slate-400">Dihitung otomatis saat karyawan mengetik</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Tier {tier}%
                </span>
              </div>

              {/* Total Nilai Lelang X */}
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-1">
                <span className="text-xs text-slate-400 font-semibold block uppercase">
                  Estimasi Total Nilai Lelang Kotor (X)
                </span>
                <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                  {formatIDR(previewGross)}
                </div>
                <span className="text-[11px] text-slate-400 block font-mono">
                  {numericWeightKg} Kg &times; {formatIDR(pricePerKg)}
                </span>
              </div>

              {/* Rincian Petani */}
              <div className="p-3.5 bg-emerald-950/50 rounded-xl border border-emerald-800/50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <Fish className="w-3.5 h-3.5" />
                    Pencairan Petani (Penjual):
                  </span>
                  <span className="font-bold text-emerald-200 font-mono">
                    {formatIDR(previewFinancials.netFarmerAmount)}
                  </span>
                </div>

                <div className="space-y-1 text-[11px] pt-1 border-t border-emerald-800/30">
                  <div className="flex justify-between text-slate-300">
                    <span>Total Potongan Jasa ({tier}%):</span>
                    <span className="font-mono text-red-300">-{formatIDR(previewFinancials.farmerCutAmount)}</span>
                  </div>
                  <div className="flex justify-between text-amber-300 pl-2">
                    <span>&bull; Hak Retensi 1% (Ditahan 3 Bulan):</span>
                    <span className="font-mono font-bold">{formatIDR(previewFinancials.farmerRetention1Percent)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 pl-2">
                    <span>&bull; Jasa Bersih Koperasi ({tier - 1}%):</span>
                    <span className="font-mono">{formatIDR(previewFinancials.koperasiFarmerIncome)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold pt-1 border-t border-emerald-800/40">
                    <span>Cair Tunai / Rekening Petani Segera:</span>
                    <span className="font-mono">{formatIDR(previewFinancials.netFarmerAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Rincian Bakul */}
              <div className="p-3.5 bg-indigo-950/50 rounded-xl border border-indigo-800/50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Tagihan Bakul (+6%):
                  </span>
                  <span className="font-bold text-indigo-200 font-mono">
                    {formatIDR(previewFinancials.totalBakulPayable)}
                  </span>
                </div>

                <div className="space-y-1 text-[11px] pt-1 border-t border-indigo-800/30">
                  <div className="flex justify-between text-slate-300">
                    <span>Nilai Menang Lelang (X):</span>
                    <span className="font-mono">{formatIDR(previewGross)}</span>
                  </div>
                  <div className="flex justify-between text-indigo-300 pl-2">
                    <span>&bull; Kas Koperasi Langsung (3%):</span>
                    <span className="font-mono">+{formatIDR(previewFinancials.koperasiBakulIncome3Percent)}</span>
                  </div>
                  <div className="flex justify-between text-purple-300 pl-2">
                    <span>&bull; Tagihan Bulanan / Simpanan (3%):</span>
                    <span className="font-mono">+{formatIDR(previewFinancials.bakulMonthlyBill3Percent)}</span>
                  </div>
                </div>
              </div>

              {/* Laba Koperasi */}
              <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-700">
                <span className="text-slate-300">Total Keuntungan Koperasi:</span>
                <span className="text-cyan-400 font-mono font-bold text-sm">
                  {formatIDR(previewFinancials.totalKoperasiIncome)}
                </span>
              </div>
            </div>

            {/* Quick Tips Box */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-950 space-y-2">
              <span className="font-bold flex items-center gap-1.5 text-amber-900">
                <Zap className="w-4 h-4 text-amber-600" />
                Tips Kecepatan Operator Lapangan:
              </span>
              <p className="text-[11px] leading-relaxed text-amber-800">
                Gunakan mode <strong>"Catat Selesai (Langsung)"</strong> jika lelang diteriakkan secara manual di dermaga balai lelang. Setelah ditimbang dan ketok palu langsung, cukup pilih bakul pemenang dan sistem langsung mencetak nota thermal kasir!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: KONSOL LELANG BERJALAN (LIVE BIDDING) */}
      {activeTab === 'lelang' && (
        <div className="space-y-6">
          {activeAuction ? (
            <div className="bg-white rounded-2xl border-2 border-emerald-500 shadow-md p-5 sm:p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-900 text-lg">
                        Lelang Sedang Berlangsung: {activeAuction.commodity.category}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold animate-pulse">
                        LIVE BIDDING
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Petani: <strong className="text-slate-700">{activeAuction.commodity.farmerName}</strong> | 
                      Bobot Timbang: <strong className="text-slate-700">{activeAuction.commodity.initialWeightKg} Kg</strong> | 
                      Tier Jasa Koperasi: <strong className="text-cyan-700">{activeAuction.discountTier}%</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onConcludeAuction(activeAuction.id)}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all active:scale-98"
                  >
                    <Gavel className="w-4 h-4" />
                    <span>KETOK PALU (KUNCI PEMENANG)</span>
                  </button>
                </div>
              </div>

              {/* Price & Current Leader Box */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-1">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Tawaran Tertinggi Saat Ini</span>
                  <div className="text-3xl font-black text-amber-400 font-mono">
                    {formatIDR(activeAuction.currentBidPerKg)}
                    <span className="text-sm font-normal text-slate-300"> / Kg</span>
                  </div>
                  <span className="text-xs text-slate-300">
                    Dipimpin oleh: <strong className="text-white">{activeAuction.winningBakulName || 'Belum Ada'}</strong>
                  </span>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl space-y-1">
                  <span className="text-xs text-emerald-800 uppercase font-semibold">Estimasi Total Bruto (X)</span>
                  <div className="text-2xl font-black text-emerald-800 font-mono">
                    {formatIDR(activeAuction.commodity.initialWeightKg * activeAuction.currentBidPerKg)}
                  </div>
                  <span className="text-[11px] text-emerald-600">
                    {activeAuction.commodity.initialWeightKg} Kg &times; {formatIDR(activeAuction.currentBidPerKg)}
                  </span>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-2xl space-y-1">
                  <span className="text-xs text-indigo-800 uppercase font-semibold">Estimasi Tagihan Bakul (+6%)</span>
                  <div className="text-2xl font-black text-indigo-800 font-mono">
                    {formatIDR((activeAuction.commodity.initialWeightKg * activeAuction.currentBidPerKg) * 1.06)}
                  </div>
                  <span className="text-[11px] text-indigo-600">
                    Termasuk 3% Kas Koperasi + 3% Tagihan Bulanan
                  </span>
                </div>
              </div>

              {/* Bidding Control Panel for Operator - Quick Click on Bakul Name */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span>Input Tawaran Cepat Bakul (Tinggal Klik Nama Bakul)</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tanpa pilih nominal di setiap bakul. Cukup klik tombol <strong>Nama Bakul</strong> yang menawar, sistem langsung menaikkan tawaran lelang.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-auto flex-wrap sm:flex-nowrap">
                    <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Kelipatan per klik:</span>
                    <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                      {[500, 1000, 2000].map((step) => (
                        <button
                          key={step}
                          type="button"
                          onClick={() => setOperatorBidStep(step)}
                          className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                            operatorBidStep === step
                              ? 'bg-slate-900 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          +Rp {step.toLocaleString('id-ID')}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsBakulModalOpen(true)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+ Bakul Baru</span>
                    </button>
                  </div>
                </div>

                {/* Big Touch-Friendly Bakul Name Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {bakuls.map((bakul) => {
                    const isWinning = activeAuction.winningBakulId === bakul.id;
                    const nextPrice = activeAuction.currentBidPerKg + operatorBidStep;

                    return (
                      <button
                        key={bakul.id}
                        type="button"
                        onClick={() => onPlaceBid(activeAuction.id, bakul.id, nextPrice)}
                        className={`p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer active:scale-95 flex flex-col justify-between min-h-[110px] group shadow-xs hover:shadow-md ${
                          isWinning
                            ? 'bg-gradient-to-br from-amber-500 to-amber-600 border-amber-600 text-white shadow-md shadow-amber-500/25 ring-2 ring-amber-400'
                            : 'bg-white hover:bg-indigo-50/60 border-slate-200 hover:border-indigo-400 text-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 w-full">
                          <div>
                            <span className={`text-base sm:text-lg font-black block leading-tight ${
                              isWinning ? 'text-white' : 'text-slate-900 group-hover:text-indigo-700'
                            }`}>
                              {bakul.name}
                            </span>
                            <span className={`text-[11px] block mt-0.5 ${
                              isWinning ? 'text-amber-100' : 'text-slate-500'
                            }`}>
                              {bakul.bakulMarketArea || 'Bakul Distribusi Pasar'}
                            </span>
                          </div>

                          {isWinning ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white text-amber-800 shadow-2xs shrink-0 flex items-center gap-1">
                              👑 Memimpin
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white shrink-0 transition-colors border border-indigo-200/60">
                              + Tawar
                            </span>
                          )}
                        </div>

                        <div className={`mt-3 pt-2.5 border-t flex items-center justify-between text-xs w-full ${
                          isWinning ? 'border-amber-400/40 text-amber-100' : 'border-slate-100 text-slate-600'
                        }`}>
                          <span className="text-[11px] font-medium">
                            {isWinning ? 'Tawaran Memimpin:' : 'Klik Menawar Menjadi:'}
                          </span>
                          <span className={`font-mono font-black text-sm ${
                            isWinning ? 'text-white' : 'text-emerald-700 group-hover:text-indigo-700'
                          }`}>
                            {formatIDR(isWinning ? activeAuction.currentBidPerKg : nextPrice)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bidding Log */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600 mb-2">
                  Riwayat Ticks Penawaran Masuk ({activeAuction.bids.length} Tawaran)
                </h4>
                <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-slate-50">
                  {activeAuction.bids.slice().reverse().map((bid, i) => (
                    <div key={bid.id} className="p-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700">#{activeAuction.bids.length - i}</span>
                        <span className="font-semibold text-slate-900">{bid.bakulName}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-800">
                        {formatIDR(bid.bidPricePerKg)} / kg
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Gavel className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="font-bold text-slate-900 text-base">Tidak Ada Lelang Aktif Saat Ini</h3>
                <p className="text-xs text-slate-500">
                  Timbang hasil tambak petani baru untuk memulai sesi penawaran lelang komoditas di balai lelang.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('input_lelang')}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs"
              >
                Mulai Timbang Panen Baru
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: DATA PETANI (INPUT & MANAJEMEN) */}
      {activeTab === 'data_petani' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Fish className="w-5 h-5 text-amber-600" />
                <span>Direktori & Manajemen Data Petani</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola data petambak, lokasi empang, dan nomor rekening pencairan lelang & retensi 1%.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFarmerModalOpen(true)}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-600/20 transition-all active:scale-98"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Registrasi Petani Baru</span>
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={farmerSearch}
              onChange={(e) => setFarmerSearch(e.target.value)}
              placeholder="Cari petani berdasarkan nama, nomor telepon, atau lokasi tambak..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Farmers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFarmers.map((farmer) => (
              <div
                key={farmer.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-amber-300 hover:shadow-md transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                  <div>
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      {farmer.id}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-1">{farmer.name}</h4>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {farmer.phone}
                    </span>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    Petambak
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span className="leading-tight">{farmer.tambakLocation || 'Pantura Subang'}</span>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/80 font-mono text-[11px] text-slate-700">
                    <div className="flex items-center gap-1 font-bold text-emerald-800">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{farmer.bankAccount?.bankName || 'BRI'}</span>
                    </div>
                    <div className="mt-0.5">
                      {farmer.bankAccount?.accountNumber || '4120-01-xxxxxx-xx-x'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      a.n {farmer.bankAccount?.accountHolder || farmer.name}
                    </div>
                  </div>
                </div>

                {/* Quick Action Button */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setSelectedFarmerId(farmer.id);
                      setActiveTab('input_lelang');
                    }}
                    className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Timbang Panen Petani Ini</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: DATA BAKUL (INPUT & MANAJEMEN) */}
      {activeTab === 'data_bakul' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-600" />
                <span>Direktori & Manajemen Data Bakul (Pembeli)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola data pedagang, pembeli grosir, wilayah pasar tujuan, serta tagihan lelang +6%.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsBakulModalOpen(true)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all active:scale-98"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Registrasi Bakul Baru</span>
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={bakulSearch}
              onChange={(e) => setBakulSearch(e.target.value)}
              placeholder="Cari bakul berdasarkan nama, nomor telepon, atau pasar distribusi..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Bakul Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBakuls.map((bakul) => (
              <div
                key={bakul.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                  <div>
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      {bakul.id}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-1">{bakul.name}</h4>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {bakul.phone}
                    </span>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                    Pembeli / Juragan
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100">
                    <span className="text-[10px] text-indigo-900 font-bold block mb-0.5">
                      Wilayah Pasar / Distribusi:
                    </span>
                    <span className="text-xs text-slate-800 font-medium leading-tight block">
                      {bakul.bakulMarketArea || 'Pasar Ikan Muara Baru'}
                    </span>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/80 font-mono text-[11px] text-slate-700">
                    <div className="flex items-center gap-1 font-bold text-indigo-800">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{bakul.bankAccount?.bankName || 'BCA'}</span>
                    </div>
                    <div className="mt-0.5">
                      {bakul.bankAccount?.accountNumber || '800-000-xxxx'}
                    </div>
                  </div>
                </div>

                {/* Status Skema +6% */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Skema Lelang:</span>
                  <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    +6% (3% Kas + 3% Bln)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 5: STRUK KASIR / BUKTI LELANG THERMAL */}
      {activeTab === 'struk' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List Transaksi */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <h4 className="font-bold text-xs uppercase text-slate-700 tracking-wider">
              Pilih Transaksi untuk Cetak Struk
            </h4>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {ledgers.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => setSelectedLedgerForReceipt(tx)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedLedgerForReceipt?.id === tx.id
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-[10px] text-slate-500">{tx.id}</span>
                    <span className="font-bold text-xs text-slate-900 font-mono">
                      {formatIDR(tx.grossPrice)}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 mt-1">
                    {tx.commodityCategory} ({tx.weightKg} kg)
                  </div>
                  <div className="text-[11px] text-slate-500 flex justify-between mt-1">
                    <span>Petani: {tx.farmerName}</span>
                    <span>Bakul: {tx.bakulName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Thermal Paper Slip Preview */}
          <div className="lg:col-span-2 flex flex-col items-center">
            {selectedLedgerForReceipt ? (
              <div className="w-full max-w-md bg-white border border-slate-300 rounded-2xl shadow-xl p-6 font-mono text-xs space-y-4">
                <div className="text-center space-y-1 pb-3 border-b-2 border-dashed border-slate-300">
                  <h3 className="font-extrabold text-sm uppercase tracking-wide">
                    KUD MINA KARYA BHUKTI
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Balai Pelelangan Ikan & Udang Pantura
                  </p>
                  <p className="text-[10px] text-slate-500">
                    No. Timbang / Lelang: {selectedLedgerForReceipt.id}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Waktu: {formatIndoDate(selectedLedgerForReceipt.createdAt)}
                  </p>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>Petani (Penjual):</span>
                    <span className="font-bold">{selectedLedgerForReceipt.farmerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bakul (Pembeli):</span>
                    <span className="font-bold">{selectedLedgerForReceipt.bakulName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Komoditas:</span>
                    <span className="font-bold">{selectedLedgerForReceipt.commodityCategory}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bobot Timbang:</span>
                    <span className="font-bold">{selectedLedgerForReceipt.weightKg} Kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Harga Menang / Kg:</span>
                    <span className="font-bold">{formatIDR(selectedLedgerForReceipt.pricePerKg)}</span>
                  </div>
                </div>

                <div className="py-2 border-y-2 border-dashed border-slate-300 space-y-1 font-bold">
                  <div className="flex justify-between text-sm">
                    <span>NILAI KOTOR (X):</span>
                    <span>{formatIDR(selectedLedgerForReceipt.grossPrice)}</span>
                  </div>
                </div>

                {/* Sisi Petani */}
                <div className="p-2.5 bg-slate-50 rounded-lg space-y-1 text-[11px]">
                  <div className="font-bold text-slate-800 uppercase">RINCIAN PENJUAL (PETANI):</div>
                  <div className="flex justify-between text-red-600">
                    <span>Potongan Jasa ({selectedLedgerForReceipt.discountTier}%):</span>
                    <span>-{formatIDR(selectedLedgerForReceipt.farmerCutAmount)}</span>
                  </div>
                  <div className="flex justify-between text-amber-700 pl-2">
                    <span>&bull; Hak Petani (Retensi 1%):</span>
                    <span>{formatIDR(selectedLedgerForReceipt.farmerRetention1Percent)}</span>
                  </div>
                  <div className="flex justify-between text-cyan-800 pl-2">
                    <span>&bull; Jasa Bersih Koperasi:</span>
                    <span>{formatIDR(selectedLedgerForReceipt.koperasiFarmerIncome)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-700 pt-1 border-t border-slate-200">
                    <span>DITERIMA PETANI SEGERA:</span>
                    <span>{formatIDR(selectedLedgerForReceipt.netFarmerAmount)}</span>
                  </div>
                </div>

                {/* Sisi Bakul */}
                <div className="p-2.5 bg-slate-50 rounded-lg space-y-1 text-[11px]">
                  <div className="font-bold text-slate-800 uppercase">RINCIAN PEMBELI (BAKUL):</div>
                  <div className="flex justify-between text-indigo-700">
                    <span>Biaya Tambahan (+6%):</span>
                    <span>+{formatIDR(selectedLedgerForReceipt.bakulAdditional6Percent)}</span>
                  </div>
                  <div className="flex justify-between text-cyan-800 pl-2">
                    <span>&bull; Bagian Kas Koperasi (3%):</span>
                    <span>{formatIDR(selectedLedgerForReceipt.koperasiBakulIncome3Percent)}</span>
                  </div>
                  <div className="flex justify-between text-purple-700 pl-2">
                    <span>&bull; Rekap Tagihan Bulanan (3%):</span>
                    <span>{formatIDR(selectedLedgerForReceipt.bakulMonthlyBill3Percent)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-indigo-900 pt-1 border-t border-slate-200">
                    <span>TOTAL TAGIHAN BAKUL:</span>
                    <span>{formatIDR(selectedLedgerForReceipt.totalBakulPayable)}</span>
                  </div>
                </div>

                <div className="pt-3 border-t-2 border-dashed border-slate-300 text-center space-y-2">
                  <p className="text-[10px] text-slate-500">
                    Terima kasih telah bertransaksi di KUD Mina Karya Bhukti.
                    Simpan nota ini sebagai bukti timbang dan penarikan dana.
                  </p>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-sans font-bold flex items-center gap-1.5 mx-auto hover:bg-slate-800 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Slip Thermal 80mm</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* SUB-TAB: DATA KOMODITAS & REKAP TOTAL */}
      {activeTab === 'data_komoditas' && (
        <CommodityDirectoryView
          commodityMasters={commodityMasters}
          commodities={commodities}
          auctions={auctions}
          ledgers={ledgers}
          onOpenAddModal={() => setIsAddCommodityModalOpen(true)}
          onSelectCommodityForWeighing={(comName) => {
            const master = commodityMasters.find((m) => m.name === comName);
            setCategory(comName);
            if (master) {
              setVariety(master.defaultVariety);
              setPricePerKg(master.defaultPricePerKg);
            }
            setActiveTab('input_lelang');
          }}
        />
      )}

      {/* SUB-TAB: LAPORAN HARIAN, BULANAN, TAHUNAN & IMPOR EKSPOR */}
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
          onOpenReceipt={(l) => {
            setSelectedLedgerForReceipt(l);
            setActiveTab('struk');
          }}
        />
      )}

      {/* QUICK ADD MODALS */}
      <InputPetaniModal
        isOpen={isFarmerModalOpen}
        onClose={() => setIsFarmerModalOpen(false)}
        onSaveFarmer={(newFarmer) => {
          if (onAddUser) {
            return onAddUser(newFarmer);
          }
          return { id: `FARMER-${Date.now()}`, ...newFarmer };
        }}
        onFarmerCreated={(farmer) => {
          setSelectedFarmerId(farmer.id);
        }}
      />

      <InputBakulModal
        isOpen={isBakulModalOpen}
        onClose={() => setIsBakulModalOpen(false)}
        onSaveBakul={(newBakul) => {
          if (onAddUser) {
            return onAddUser(newBakul);
          }
          return { id: `BAKUL-${Date.now()}`, ...newBakul };
        }}
        onBakulCreated={(bakul) => {
          setDirectWinningBakulId(bakul.id);
        }}
      />

      <AddCommodityModal
        isOpen={isAddCommodityModalOpen}
        onClose={() => setIsAddCommodityModalOpen(false)}
        onAddCommodity={(newCom) => {
          if (onAddCommodityMaster) {
            const created = onAddCommodityMaster(newCom);
            setCategory(created.name);
            setVariety(created.defaultVariety);
            setPricePerKg(created.defaultPricePerKg);
            return created;
          }
          return { id: `MAS-${Date.now()}`, ...newCom, createdAt: new Date().toISOString() };
        }}
      />
    </div>
  );
};
