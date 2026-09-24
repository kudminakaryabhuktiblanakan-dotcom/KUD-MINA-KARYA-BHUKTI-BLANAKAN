export type UserRole = 'admin' | 'manager' | 'karyawan' | 'petani' | 'bakul';

export type DiscountTier = 8 | 6 | 3;

export interface UserPermissions {
  canInputWeighing: boolean;
  canRunAuction: boolean;
  canViewReports: boolean;
  canManageUsers: boolean;
  canApproveFinancials: boolean;
  canExportData: boolean;
  canPlaceBid: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  status: 'active' | 'suspended';
  password?: string;
  avatar?: string;
  tambakLocation?: string; // for petani
  defaultTier?: DiscountTier; // for petani (8 | 6 | 3)
  bakulMarketArea?: string; // for bakul
  creditLimit?: number; // for bakul
  shiftLocation?: string; // for karyawan (e.g. Meja Timbang 1)
  permissions?: UserPermissions;
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  createdAt?: string;
  lastLoginAt?: string;
}

export type CommodityCategory = 
  | 'Udang Vaname' 
  | 'Udang Windu' 
  | 'Ikan Bandeng' 
  | 'Ikan Nila Salin' 
  | 'Kepiting Bakau' 
  | 'Ikan Gurame Tambak' 
  | string;

export interface CommodityMaster {
  id: string;
  name: string;
  code: string;
  icon?: string;
  defaultVariety: string;
  defaultPricePerKg: number;
  unit: string;
  description?: string;
  createdAt: string;
}

export type CommodityStatus = 'registered' | 'bidding' | 'sold' | 'cancelled';

export interface Commodity {
  id: string;
  farmerId: string;
  farmerName: string;
  category: CommodityCategory;
  variety?: string;
  initialWeightKg: number;
  qualityNotes: string;
  harvestDate: string;
  pondNumber: string;
  status: CommodityStatus;
  createdAt: string;
}

export interface BidRecord {
  id: string;
  bakulId: string;
  bakulName: string;
  bidPricePerKg: number;
  totalGrossPrice: number;
  timestamp: string;
}

export type AuctionStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';

export interface Auction {
  id: string;
  commodityId: string;
  commodity: Commodity;
  startPricePerKg: number;
  currentBidPerKg: number;
  winningBakulId?: string;
  winningBakulName?: string;
  winningPricePerKg?: number;
  winningGrossPrice?: number; // X = winningPricePerKg * weightKg
  discountTier: DiscountTier;
  status: AuctionStatus;
  bids: BidRecord[];
  createdAt: string;
  closedAt?: string;
}

export type RetentionStatus = 'held' | 'ready_to_release' | 'released';
export type BakulBillStatus = 'unpaid' | 'invoiced' | 'paid';

export interface TransactionLedger {
  id: string;
  auctionId: string;
  farmerId: string;
  farmerName: string;
  bakulId: string;
  bakulName: string;
  commodityCategory: CommodityCategory;
  weightKg: number;
  pricePerKg: number;
  
  // Core financial values
  grossPrice: number; // X = Total auction value
  discountTier: DiscountTier;
  
  // Petani (Penjual) side
  farmerCutPercent: number; // 8%, 6%, or 3%
  farmerCutAmount: number; // X * tier%
  farmerRetention1Percent: number; // X * 1% (Retensi ditahan 3 bulan)
  koperasiFarmerIncome: number; // farmerCutAmount - farmerRetention1Percent
  netFarmerAmount: number; // X - farmerCutAmount (Cair segera)
  
  // Bakul (Pembeli) side
  bakulAdditional6Percent: number; // X * 6%
  koperasiBakulIncome3Percent: number; // X * 3%
  bakulMonthlyBill3Percent: number; // X * 3%
  totalBakulPayable: number; // X + bakulAdditional6Percent
  
  // Koperasi overall
  totalKoperasiIncome: number; // koperasiFarmerIncome + koperasiBakulIncome3Percent
  
  // Retention & Billing Tracking
  statusRetention: RetentionStatus;
  retentionDueDate: string; // ISO date (3 months from created_at)
  retentionReleasedAt?: string;
  
  statusBakulBill: BakulBillStatus;
  monthlyBillPeriod: string; // YYYY-MM
  bakulInvoiceId?: string;
  
  createdAt: string;
  approvedByManager?: boolean;
}

export interface MonthlyBakulInvoice {
  id: string;
  bakulId: string;
  bakulName: string;
  period: string; // e.g. "2026-09"
  periodLabel: string; // "September 2026"
  transactionCount: number;
  totalAuctionGross: number;
  totalBakul3PercentBill: number; // Sum of bakulMonthlyBill3Percent
  status: 'draft' | 'issued' | 'paid';
  dueDate: string;
  paidAt?: string;
  paymentMethod?: string;
  createdAt: string;
}

export interface SystemFinancialSummary {
  totalGrossAuctionVolume: number;
  totalKoperasiRevenue: number;
  koperasiFromFarmers: number;
  koperasiFromBakuls: number;
  totalFarmerPaidOut: number;
  totalFarmerRetentionHeld: number;
  totalFarmerRetentionReleased: number;
  totalBakulMonthlyReceivables: number;
  totalBakulMonthlyCollected: number;
}

export interface DirectAuctionSaleData {
  farmerId: string;
  farmerName: string;
  bakulId: string;
  bakulName: string;
  category: CommodityCategory;
  variety?: string;
  initialWeightKg: number;
  qualityNotes?: string;
  pondNumber?: string;
  pricePerKg: number;
  discountTier: DiscountTier;
}
