import React, { useState, useMemo } from 'react';
import { 
  INITIAL_USERS, 
  INITIAL_COMMODITIES, 
  INITIAL_AUCTIONS, 
  INITIAL_LEDGERS, 
  INITIAL_INVOICES,
  INITIAL_COMMODITY_MASTERS
} from './data/mockData';
import { 
  UserRole, 
  User, 
  Commodity, 
  CommodityMaster,
  Auction, 
  TransactionLedger, 
  MonthlyBakulInvoice, 
  DiscountTier,
  DirectAuctionSaleData
} from './types';
import { Navbar } from './components/Navbar';
import { FinancialCalculatorModal } from './components/FinancialCalculatorModal';
import { AdminView } from './components/roles/AdminView';
import { ManagerView } from './components/roles/ManagerView';
import { KaryawanView } from './components/roles/KaryawanView';
import { PetaniView } from './components/roles/PetaniView';
import { BakulView } from './components/roles/BakulView';
import { CommodityDirectoryView } from './components/commodities/CommodityDirectoryView';
import { AddCommodityModal } from './components/commodities/AddCommodityModal';
import { PeriodReportView } from './components/reports/PeriodReportView';
import { SystemWorkflowGuide } from './components/SystemWorkflowGuide';
import { ArchitectureDocs } from './components/ArchitectureDocs';
import { LoginView } from './components/auth/LoginView';
import { createLedgerRecord } from './services/calculationEngine';
import { CheckCircle2, Info, Bell, AlertTriangle } from 'lucide-react';

export default function App() {
  // Main State
  const [activeRole, setActiveRole] = useState<UserRole>('admin');
  const [activeViewMode, setActiveViewMode] = useState<'app' | 'commodities' | 'reports' | 'architecture'>('app');
  const [currentSimulatedDate, setCurrentSimulatedDate] = useState<Date>(new Date('2026-09-24T08:00:00Z'));
  const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(false);
  const [isAddCommodityModalOpen, setIsAddCommodityModalOpen] = useState<boolean>(false);

  // Data Store
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [commodityMasters, setCommodityMasters] = useState<CommodityMaster[]>(INITIAL_COMMODITY_MASTERS);
  const [commodities, setCommodities] = useState<Commodity[]>(INITIAL_COMMODITIES);
  const [auctions, setAuctions] = useState<Auction[]>(INITIAL_AUCTIONS);
  const [ledgers, setLedgers] = useState<TransactionLedger[]>(INITIAL_LEDGERS);
  const [invoices, setInvoices] = useState<MonthlyBakulInvoice[]>(INITIAL_INVOICES);

  // Authentication State
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(() => {
    try {
      const savedId = localStorage.getItem('koperasi_logged_in_user_id');
      if (savedId) {
        const found = INITIAL_USERS.find((u) => u.id === savedId && u.status !== 'suspended');
        if (found) return found;
      }
    } catch {
      // Ignore localStorage access failure
    }
    return INITIAL_USERS[0]; // Default initial active session for instant exploration
  });

  // Active User Persona depending on selected role
  const [activePetaniId, setActivePetaniId] = useState<string>('USR-PETANI-01');
  const [activeBakulId, setActiveBakulId] = useState<string>('USR-BAKUL-01');

  // Flash Message Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'warn' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'warn' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Login handler
  const handleLogin = (user: User) => {
    setAuthenticatedUser(user);
    setActiveRole(user.role);
    if (user.role === 'petani') {
      setActivePetaniId(user.id);
    } else if (user.role === 'bakul') {
      setActiveBakulId(user.id);
    }
    try {
      localStorage.setItem('koperasi_logged_in_user_id', user.id);
    } catch {
      // ignore
    }
    showToast(`Selamat datang kembali, ${user.name}! Hak akses Anda aktif sebagai ${user.role.toUpperCase()}.`, 'success');
  };

  // Logout handler
  const handleLogout = () => {
    try {
      localStorage.removeItem('koperasi_logged_in_user_id');
    } catch {
      // ignore
    }
    const prevName = authenticatedUser?.name;
    setAuthenticatedUser(null);
    showToast(prevName ? `${prevName} berhasil keluar (logout).` : 'Sesi berhasil diakhiri.', 'info');
  };

  const currentUser = useMemo(() => {
    if (!authenticatedUser) return users[0];
    // If admin is browsing in supervisor preview mode
    if (authenticatedUser.role === 'admin') {
      if (activeRole === 'admin') return authenticatedUser;
      if (activeRole === 'manager') return users.find((u) => u.role === 'manager') || authenticatedUser;
      if (activeRole === 'karyawan') return users.find((u) => u.role === 'karyawan') || authenticatedUser;
      if (activeRole === 'petani') return users.find((u) => u.id === activePetaniId) || users.find((u) => u.role === 'petani') || authenticatedUser;
      if (activeRole === 'bakul') return users.find((u) => u.id === activeBakulId) || users.find((u) => u.role === 'bakul') || authenticatedUser;
      return authenticatedUser;
    }
    // Non-admin users are strictly tied to their own persona and role
    return authenticatedUser;
  }, [authenticatedUser, activeRole, users, activePetaniId, activeBakulId]);

  // Counts for Notifications
  const dueRetentionCount = useMemo(() => {
    return ledgers.filter((l) => l.statusRetention === 'ready_to_release').length;
  }, [ledgers]);

  const unbilledBakulCount = useMemo(() => {
    return ledgers.filter((l) => l.statusBakulBill === 'unpaid').length;
  }, [ledgers]);

  // Advance Time Machine & Run Automated Checks
  const handleAdvanceDays = (days: number) => {
    const nextDate = new Date(currentSimulatedDate);
    nextDate.setDate(nextDate.getDate() + days);
    setCurrentSimulatedDate(nextDate);

    // 1. Check 3-Month Retention Status
    const todayStr = nextDate.toISOString().split('T')[0];
    let maturedCount = 0;

    const updatedLedgers = ledgers.map((item) => {
      if (item.statusRetention === 'held' && item.retentionDueDate <= todayStr) {
        maturedCount++;
        return { ...item, statusRetention: 'ready_to_release' as const };
      }
      return item;
    });

    setLedgers(updatedLedgers);

    // 2. If advancing 30+ days, trigger monthly bill grouping
    if (days >= 30) {
      triggerMonthlyBillCron(nextDate, updatedLedgers);
    }

    if (maturedCount > 0) {
      showToast(`Waktu maju +${days} hari. Ada ${maturedCount} hak retensi 1% petani yang telah jatuh tempo (3 bulan) & siap dicairkan!`, 'warn');
    } else {
      showToast(`Waktu disimulasikan maju +${days} hari. Tanggal saat ini: ${todayStr}`, 'info');
    }
  };

  const handleResetDate = () => {
    setCurrentSimulatedDate(new Date('2026-09-24T08:00:00Z'));
    showToast('Tanggal simulasi dikembalikan ke waktu awal (24 September 2026).', 'info');
  };

  // Retention Cron manually triggered
  const triggerRetentionCron = () => {
    const todayStr = currentSimulatedDate.toISOString().split('T')[0];
    let count = 0;

    setLedgers((prev) =>
      prev.map((l) => {
        if (l.statusRetention === 'held' && l.retentionDueDate <= todayStr) {
          count++;
          return { ...l, statusRetention: 'ready_to_release' };
        }
        return l;
      })
    );

    if (count > 0) {
      showToast(`Background Job Selesai: ${count} transaksi retensi dipindahkan ke status 'ready_to_release'.`, 'success');
    } else {
      showToast('Background Job Selesai: Tidak ada transaksi retensi yang jatuh tempo pada tanggal simulasi ini.', 'info');
    }
  };

  // Monthly Bakul Bill Cron manually or automatically triggered
  const triggerMonthlyBillCron = (dateRef: Date = currentSimulatedDate, currentLedgers: TransactionLedger[] = ledgers) => {
    const unbilled = currentLedgers.filter((l) => l.statusBakulBill === 'unpaid');
    if (unbilled.length === 0) {
      showToast('Tidak ada transaksi bakul berstatus unpaid untuk direkap.', 'info');
      return;
    }

    // Group by bakulId and period
    const groups: Record<string, { bakulId: string; bakulName: string; period: string; txCount: number; gross: number; bill: number; txIds: string[] }> = {};

    unbilled.forEach((tx) => {
      const key = `${tx.bakulId}_${tx.monthlyBillPeriod}`;
      if (!groups[key]) {
        groups[key] = {
          bakulId: tx.bakulId,
          bakulName: tx.bakulName,
          period: tx.monthlyBillPeriod,
          txCount: 0,
          gross: 0,
          bill: 0,
          txIds: [],
        };
      }
      groups[key].txCount += 1;
      groups[key].gross += tx.grossPrice;
      groups[key].bill += tx.bakulMonthlyBill3Percent;
      groups[key].txIds.push(tx.id);
    });

    const newInvoices: MonthlyBakulInvoice[] = [];
    const invoicedTxIds = new Set<string>();

    Object.values(groups).forEach((g) => {
      const invId = `INV-${g.period.replace('-', '')}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      newInvoices.push({
        id: invId,
        bakulId: g.bakulId,
        bakulName: g.bakulName,
        period: g.period,
        periodLabel: `Periode ${g.period}`,
        transactionCount: g.txCount,
        totalAuctionGross: g.gross,
        totalBakul3PercentBill: g.bill,
        status: 'issued',
        dueDate: `${g.period}-10`,
        createdAt: dateRef.toISOString(),
      });
      g.txIds.forEach((id) => invoicedTxIds.add(id));
    });

    setInvoices((prev) => [...newInvoices, ...prev]);
    setLedgers((prev) =>
      prev.map((l) => (invoicedTxIds.has(l.id) ? { ...l, statusBakulBill: 'invoiced' } : l))
    );

    showToast(`Berhasil menerbitkan ${newInvoices.length} invoice tagihan 3% bulanan untuk para bakul.`, 'success');
  };

  // Add new weighing & open auction
  const handleAddNewWeighing = (
    newCommodity: Partial<Commodity>,
    startPricePerKg: number,
    tier: DiscountTier
  ) => {
    const comId = `COM-${Date.now().toString(36).toUpperCase()}`;
    const fullCommodity: Commodity = {
      id: comId,
      farmerId: newCommodity.farmerId || 'USR-PETANI-01',
      farmerName: newCommodity.farmerName || 'Pak Subur Pranoto',
      category: newCommodity.category || 'Udang Vaname',
      variety: newCommodity.variety || 'Size 40',
      initialWeightKg: typeof newCommodity.initialWeightKg === 'number' && newCommodity.initialWeightKg > 0 ? newCommodity.initialWeightKg : 250,
      qualityNotes: newCommodity.qualityNotes || 'Kualitas Prima',
      harvestDate: newCommodity.harvestDate || new Date().toISOString().split('T')[0],
      pondNumber: newCommodity.pondNumber || 'Tambak Utama',
      status: 'bidding',
      createdAt: currentSimulatedDate.toISOString(),
    };

    const aucId = `AUC-${Date.now().toString(36).toUpperCase()}`;
    const newAuction: Auction = {
      id: aucId,
      commodityId: comId,
      commodity: fullCommodity,
      startPricePerKg,
      currentBidPerKg: startPricePerKg,
      discountTier: tier,
      status: 'live',
      bids: [],
      createdAt: currentSimulatedDate.toISOString(),
    };

    setCommodities((prev) => [fullCommodity, ...prev]);
    setAuctions((prev) => [newAuction, ...prev]);

    showToast(`Penimbangan dicatat & Sesi Lelang dibuka untuk ${fullCommodity.category} (${fullCommodity.initialWeightKg} Kg)!`, 'success');
  };

  // Add new User (Petani, Bakul, Karyawan, etc.)
  const handleAddUser = (userData: User | Omit<User, 'id'>): User => {
    let userRecord: User;
    if ('id' in userData && userData.id) {
      userRecord = userData as User;
    } else {
      const prefix = userData.role === 'petani' ? 'USR-PETANI-' : userData.role === 'bakul' ? 'USR-BAKUL-' : 'USR-';
      const id = `${prefix}${Date.now().toString(36).toUpperCase()}`;
      userRecord = {
        id,
        ...userData,
      } as User;
    }
    setUsers((prev) => [userRecord, ...prev]);
    showToast(
      `Pengguna "${userRecord.name}" (${userRecord.role.toUpperCase()}) berhasil didaftarkan dengan hak akses!`,
      'success'
    );
    return userRecord;
  };

  // Update existing user profile, permissions, status
  const handleUpdateUser = (updatedUser: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    if (authenticatedUser?.id === updatedUser.id) {
      setAuthenticatedUser(updatedUser);
    }
    showToast(`Data profil & hak akses "${updatedUser.name}" berhasil disimpan.`, 'success');
  };

  // Delete user
  const handleDeleteUser = (userId: string) => {
    const toDelete = users.find((u) => u.id === userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    if (authenticatedUser?.id === userId) {
      handleLogout();
    }
    showToast(`Pengguna "${toDelete?.name || userId}" berhasil dihapus dari sistem.`, 'info');
  };

  // Toggle user active / suspended status
  const handleToggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const newStatus = u.status === 'active' ? 'suspended' : 'active';
          showToast(
            `Status akun ${u.name} sekarang: ${newStatus === 'active' ? 'Aktif' : 'Ditangguhkan (Suspended)'}.`,
            newStatus === 'active' ? 'success' : 'warn'
          );
          return { ...u, status: newStatus };
        }
        return u;
      })
    );
  };

  // Tambah Master Komoditas Baru
  const handleAddCommodityMaster = (newMaster: Omit<CommodityMaster, 'id' | 'createdAt'>): CommodityMaster => {
    const masterId = `MAS-${Date.now().toString(36).toUpperCase()}`;
    const record: CommodityMaster = {
      id: masterId,
      ...newMaster,
      createdAt: currentSimulatedDate.toISOString(),
    };
    setCommodityMasters((prev) => [...prev, record]);
    showToast(`Komoditas "${record.name}" (${record.code}) berhasil didaftarkan ke katalog & sistem lelang TPI!`, 'success');
    return record;
  };

  // Direct auction closing (catat transaksi lelang langsung selesai oleh karyawan)
  const handleDirectAuctionSale = (data: DirectAuctionSaleData): TransactionLedger => {
    const comId = `COM-${Date.now().toString(36).toUpperCase()}`;
    const fullCommodity: Commodity = {
      id: comId,
      farmerId: data.farmerId,
      farmerName: data.farmerName,
      category: data.category,
      variety: data.variety || 'Mutu Standar',
      initialWeightKg: data.initialWeightKg,
      qualityNotes: data.qualityNotes || 'Kualitas Prima',
      harvestDate: currentSimulatedDate.toISOString().split('T')[0],
      pondNumber: data.pondNumber || 'Tambak',
      status: 'sold',
      createdAt: currentSimulatedDate.toISOString(),
    };

    const aucId = `AUC-${Date.now().toString(36).toUpperCase()}`;
    const gross = Math.round(data.initialWeightKg * data.pricePerKg);
    const closedAuction: Auction = {
      id: aucId,
      commodityId: comId,
      commodity: fullCommodity,
      startPricePerKg: data.pricePerKg,
      currentBidPerKg: data.pricePerKg,
      winningBakulId: data.bakulId,
      winningBakulName: data.bakulName,
      winningPricePerKg: data.pricePerKg,
      winningGrossPrice: gross,
      discountTier: data.discountTier,
      status: 'completed',
      bids: [
        {
          id: `BID-${Date.now().toString(36)}`,
          bakulId: data.bakulId,
          bakulName: data.bakulName,
          bidPricePerKg: data.pricePerKg,
          totalGrossPrice: gross,
          timestamp: currentSimulatedDate.toISOString(),
        },
      ],
      createdAt: currentSimulatedDate.toISOString(),
      closedAt: currentSimulatedDate.toISOString(),
    };

    const newLedger = createLedgerRecord({
      auctionId: aucId,
      farmerId: data.farmerId,
      farmerName: data.farmerName,
      bakulId: data.bakulId,
      bakulName: data.bakulName,
      commodityCategory: data.category,
      weightKg: data.initialWeightKg,
      pricePerKg: data.pricePerKg,
      discountTier: data.discountTier,
      createdAt: currentSimulatedDate.toISOString(),
    });

    setCommodities((prev) => [fullCommodity, ...prev]);
    setAuctions((prev) => [closedAuction, ...prev]);
    setLedgers((prev) => [newLedger, ...prev]);

    showToast(
      `Transaksi lelang berhasil dibukukan! ${data.farmerName} ➔ ${data.bakulName} (Total Rp ${gross.toLocaleString('id-ID')})`,
      'success'
    );
    return newLedger;
  };

  // Edit/Koreksi Transaksi Ledger
  const handleUpdateLedger = (updated: TransactionLedger) => {
    setLedgers((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    showToast(`Data transaksi ${updated.id} (${updated.commodityCategory}) berhasil diperbarui & dihitung ulang!`, 'success');
  };

  // Hapus Satu Transaksi
  const handleDeleteLedger = (ledgerId: string) => {
    setLedgers((prev) => prev.filter((l) => l.id !== ledgerId));
    showToast(`Data transaksi ${ledgerId} berhasil dihapus dari buku besar lelang.`, 'info');
  };

  // Hapus Semua Data Transaksi (Bulk Reset)
  const handleDeleteAllLedgers = () => {
    const count = ledgers.length;
    setLedgers([]);
    showToast(`Seluruh riwayat transaksi (${count} data) telah berhasil dihapus/dikosongkan dari sistem.`, 'warn');
  };

  // Impor Data Transaksi dari Excel (.xlsx)
  const handleImportLedgers = (newLedgers: TransactionLedger[]) => {
    setLedgers((prev) => [...newLedgers, ...prev]);
    showToast(`Berhasil mengimpor ${newLedgers.length} transaksi lelang dari file Excel ke sistem!`, 'success');
  };

  // Place a bid
  const handlePlaceBid = (auctionId: string, bakulId: string, bidPricePerKg: number) => {
    const bakul = users.find((u) => u.id === bakulId);
    if (!bakul) return;

    setAuctions((prev) =>
      prev.map((a) => {
        if (a.id === auctionId && a.status === 'live') {
          const newBid = {
            id: `BID-${Date.now().toString(36)}`,
            bakulId: bakul.id,
            bakulName: bakul.name,
            bidPricePerKg,
            totalGrossPrice: a.commodity.initialWeightKg * bidPricePerKg,
            timestamp: currentSimulatedDate.toISOString(),
          };
          return {
            ...a,
            currentBidPerKg: bidPricePerKg,
            winningBakulId: bakul.id,
            winningBakulName: bakul.name,
            bids: [...a.bids, newBid],
          };
        }
        return a;
      })
    );

    showToast(`Penawaran baru: ${bakul.name} menawar Rp ${bidPricePerKg.toLocaleString('id-ID')} / kg`, 'info');
  };

  // Conclude auction & generate ledger
  const handleConcludeAuction = (auctionId: string) => {
    const auc = auctions.find((a) => a.id === auctionId);
    if (!auc || !auc.winningBakulId) {
      showToast('Belum ada bakul penawar untuk lelang ini.', 'warn');
      return;
    }

    const finalGross = Math.round(auc.commodity.initialWeightKg * auc.currentBidPerKg);

    const newLedger = createLedgerRecord({
      auctionId: auc.id,
      farmerId: auc.commodity.farmerId,
      farmerName: auc.commodity.farmerName,
      bakulId: auc.winningBakulId,
      bakulName: auc.winningBakulName || 'Bakul Pemenang',
      commodityCategory: auc.commodity.category,
      weightKg: auc.commodity.initialWeightKg,
      pricePerKg: auc.currentBidPerKg,
      discountTier: auc.discountTier,
      createdAt: currentSimulatedDate.toISOString(),
    });

    // Close auction
    setAuctions((prev) =>
      prev.map((a) =>
        a.id === auctionId
          ? {
              ...a,
              status: 'completed',
              winningPricePerKg: a.currentBidPerKg,
              winningGrossPrice: finalGross,
              closedAt: currentSimulatedDate.toISOString(),
            }
          : a
      )
    );

    // Update commodity
    setCommodities((prev) =>
      prev.map((c) => (c.id === auc.commodityId ? { ...c, status: 'sold' } : c))
    );

    // Prepend new ledger
    setLedgers((prev) => [newLedger, ...prev]);

    showToast(
      `KETOK PALU! Pemenang lelang: ${auc.winningBakulName} (Total Rp ${finalGross.toLocaleString('id-ID')}). Buku besar transaksi berhasil dibukukan!`,
      'success'
    );
  };

  // Release retention (Manager or Farmer)
  const handleReleaseRetention = (ledgerId: string) => {
    setLedgers((prev) =>
      prev.map((l) =>
        l.id === ledgerId
          ? {
              ...l,
              statusRetention: 'released',
              retentionReleasedAt: currentSimulatedDate.toISOString(),
            }
          : l
      )
    );
    showToast('Hak Petani (Retensi 1%) berhasil disetujui & ditransfer ke rekening bank petani.', 'success');
  };

  // Approve / Pay Invoice
  const handleApproveOrPayInvoice = (invoiceId: string) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              status: 'paid',
              paidAt: currentSimulatedDate.toISOString(),
            }
          : inv
      )
    );

    // Update linked ledgers
    setLedgers((prev) =>
      prev.map((l) => (l.bakulInvoiceId === invoiceId ? { ...l, statusBakulBill: 'paid' } : l))
    );

    showToast(`Invoice ${invoiceId} berhasil diverifikasi Lunas!`, 'success');
  };

  // Reset to initial mock
  const handleResetData = () => {
    setUsers(INITIAL_USERS);
    setCommodities(INITIAL_COMMODITIES);
    setAuctions(INITIAL_AUCTIONS);
    setLedgers(INITIAL_LEDGERS);
    setInvoices(INITIAL_INVOICES);
    setCurrentSimulatedDate(new Date('2026-09-24T08:00:00Z'));
    showToast('Database simulasi berhasil dikembalikan ke keadaan awal.', 'info');
  };

  // If not authenticated, display the Login View
  if (!authenticatedUser) {
    return (
      <div className="relative min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in slide-in-from-bottom-5 duration-300">
            <div
              className={`p-4 rounded-2xl shadow-2xl border flex items-start gap-3 ${
                toastMessage.type === 'success'
                  ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                  : toastMessage.type === 'warn'
                  ? 'bg-amber-900 text-amber-100 border-amber-700'
                  : 'bg-slate-900 text-slate-100 border-slate-700'
              }`}
            >
              {toastMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : toastMessage.type === 'warn' ? (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              )}
              <p className="text-xs font-semibold leading-relaxed">{toastMessage.text}</p>
            </div>
          </div>
        )}
        <LoginView users={users} onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in slide-in-from-bottom-5 duration-300">
          <div
            className={`p-4 rounded-2xl shadow-2xl border flex items-start gap-3 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                : toastMessage.type === 'warn'
                ? 'bg-amber-900 text-amber-100 border-amber-700'
                : 'bg-slate-900 text-slate-100 border-slate-700'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : toastMessage.type === 'warn' ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            )}
            <p className="text-xs font-semibold leading-relaxed">{toastMessage.text}</p>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        currentUser={currentUser}
        users={users}
        currentSimulatedDate={currentSimulatedDate}
        onAdvanceDays={handleAdvanceDays}
        onResetDate={handleResetDate}
        activeViewMode={activeViewMode}
        setActiveViewMode={setActiveViewMode}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        dueRetentionCount={dueRetentionCount}
        unbilledBakulCount={unbilledBakulCount}
        commoditiesCount={commodityMasters.length}
        onLogout={handleLogout}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8">
        {activeViewMode === 'architecture' ? (
          <ArchitectureDocs />
        ) : activeViewMode === 'commodities' ? (
          <CommodityDirectoryView
            commodityMasters={commodityMasters}
            commodities={commodities}
            auctions={auctions}
            ledgers={ledgers}
            onOpenAddModal={() => setIsAddCommodityModalOpen(true)}
            onSelectCommodityForWeighing={(comName) => {
              setActiveRole('karyawan');
              setActiveViewMode('app');
            }}
          />
        ) : activeViewMode === 'reports' ? (
          <PeriodReportView
            ledgers={ledgers}
            users={users}
            commodityMasters={commodityMasters}
            currentSimulatedDate={currentSimulatedDate}
            onUpdateLedger={handleUpdateLedger}
            onDeleteLedger={handleDeleteLedger}
            onDeleteAllLedgers={handleDeleteAllLedgers}
            onImportLedgers={handleImportLedgers}
            onOpenReceipt={(ledger) => {
              setActiveRole('karyawan');
              setActiveViewMode('app');
            }}
          />
        ) : (
          <>
            {/* Interactive Quick Guide & Business Logic Stepper (visible for Admin) */}
            {currentUser.role === 'admin' && (
              <SystemWorkflowGuide
                activeRole={activeRole}
                onSelectRole={(role) => setActiveRole(role)}
                onOpenCalculator={() => setIsCalculatorOpen(true)}
              />
            )}

            {activeRole === 'admin' && (
              <AdminView
                users={users}
                currentLoggedInUser={currentUser}
                commodities={commodities}
                commodityMasters={commodityMasters}
                auctions={auctions}
                ledgers={ledgers}
                currentSimulatedDate={currentSimulatedDate}
                onTriggerRetentionCron={triggerRetentionCron}
                onTriggerMonthlyBillCron={() => triggerMonthlyBillCron()}
                onResetData={handleResetData}
                onApproveLedger={(id) => showToast(`Audit disetujui untuk ${id}`, 'info')}
                onOpenAddCommodityModal={() => setIsAddCommodityModalOpen(true)}
                onUpdateLedger={handleUpdateLedger}
                onDeleteLedger={handleDeleteLedger}
                onDeleteAllLedgers={handleDeleteAllLedgers}
                onImportLedgers={handleImportLedgers}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
                onToggleUserStatus={handleToggleUserStatus}
              />
            )}

            {activeRole === 'manager' && (
              <ManagerView
                ledgers={ledgers}
                invoices={invoices}
                users={users}
                currentLoggedInUser={currentUser}
                onReleaseRetention={handleReleaseRetention}
                onApproveInvoice={handleApproveOrPayInvoice}
                onOpenReports={() => setActiveViewMode('reports')}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
                onToggleUserStatus={handleToggleUserStatus}
              />
            )}

            {activeRole === 'karyawan' && (
              <KaryawanView
                users={users}
                commodities={commodities}
                commodityMasters={commodityMasters}
                auctions={auctions}
                ledgers={ledgers}
                currentSimulatedDate={currentSimulatedDate}
                onAddNewWeighing={handleAddNewWeighing}
                onPlaceBid={handlePlaceBid}
                onConcludeAuction={handleConcludeAuction}
                onAddUser={handleAddUser}
                onDirectAuctionSale={handleDirectAuctionSale}
                onAddCommodityMaster={handleAddCommodityMaster}
                onUpdateLedger={handleUpdateLedger}
                onDeleteLedger={handleDeleteLedger}
                onDeleteAllLedgers={handleDeleteAllLedgers}
                onImportLedgers={handleImportLedgers}
              />
            )}

            {activeRole === 'petani' && (
              <PetaniView
                currentUser={currentUser}
                allFarmers={users.filter((u) => u.role === 'petani')}
                onSelectFarmer={(id) => setActivePetaniId(id)}
                ledgers={ledgers}
                onClaimRetention={handleReleaseRetention}
                loggedInRole={authenticatedUser.role}
              />
            )}

            {activeRole === 'bakul' && (
              <BakulView
                currentUser={currentUser}
                allBakuls={users.filter((u) => u.role === 'bakul')}
                onSelectBakul={(id) => setActiveBakulId(id)}
                auctions={auctions}
                ledgers={ledgers}
                invoices={invoices}
                onPlaceBid={handlePlaceBid}
                onPayInvoice={handleApproveOrPayInvoice}
                loggedInRole={authenticatedUser.role}
              />
            )}
          </>
        )}
      </main>

      {/* Interactive Financial Calculator Modal */}
      <FinancialCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />

      {/* Global Add Commodity Modal */}
      <AddCommodityModal
        isOpen={isAddCommodityModalOpen}
        onClose={() => setIsAddCommodityModalOpen(false)}
        onAddCommodity={handleAddCommodityMaster}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Koperasi Tambak Mina Karya Bhukti</span>
            <span>&bull;</span>
            <span>Sistem Lelang Komoditas & Manajemen Keuangan Multi-Role</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Laravel 11 REST API</span>
            <span>&bull;</span>
            <span>Flutter 3 Mobile</span>
            <span>&bull;</span>
            <span>PostgreSQL / Redis</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
