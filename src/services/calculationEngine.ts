import { DiscountTier, TransactionLedger, CommodityCategory, RetentionStatus, BakulBillStatus } from '../types';

export interface CalculationResult {
  grossPrice: number; // X
  discountTier: DiscountTier;
  
  // Farmer side
  farmerCutPercent: number;
  farmerCutAmount: number;
  farmerRetention1Percent: number;
  koperasiFarmerIncome: number;
  netFarmerAmount: number;
  
  // Bakul side
  bakulAdditional6Percent: number;
  koperasiBakulIncome3Percent: number;
  bakulMonthlyBill3Percent: number;
  totalBakulPayable: number;
  
  // Koperasi overall
  totalKoperasiIncome: number;
  
  // Retention & Billing meta
  retentionDueDate: string;
  monthlyBillPeriod: string;
}

/**
 * Core Financial Calculation for Koperasi Tambak Auction
 * @param grossPrice The winning price X (or total kg * price/kg)
 * @param tier The cooperative service tier: 8, 6, or 3 (%)
 * @param transactionDate The date of the transaction
 */
export function calculateAuctionFinancials(
  grossPrice: number,
  tier: DiscountTier,
  transactionDate: Date = new Date()
): CalculationResult {
  const X = Math.round(grossPrice);
  
  // 1. Sisi Petani (Penjual)
  const farmerCutPercent = tier;
  const farmerCutAmount = Math.round(X * (tier / 100));
  const farmerRetention1Percent = Math.round(X * 0.01);
  // Pendapatan Bersih Koperasi dari Petani = Total Potongan - Hak Petani
  const koperasiFarmerIncome = farmerCutAmount - farmerRetention1Percent;
  // Dana Bersih untuk Petani (Cair Segera) = X - Total Potongan
  const netFarmerAmount = X - farmerCutAmount;
  
  // 2. Sisi Bakul (Pembeli)
  // Total tambahan biaya yang harus dibayar bakul adalah +6% dari X
  const bakulAdditional6Percent = Math.round(X * 0.06);
  // 1. Bagian Koperasi (3%) = X * 3% (Langsung masuk pendapatan koperasi)
  const koperasiBakulIncome3Percent = Math.round(X * 0.03);
  // 2. Bagian Simpanan / Tagihan Bakul (3%) = X * 3% (Ditagihkan bulanan)
  const bakulMonthlyBill3Percent = Math.round(X * 0.03);
  // Total Tagihan Akhir Bakul = X + (X * 6%)
  const totalBakulPayable = X + bakulAdditional6Percent;
  
  // 3. Keuntungan Total Koperasi per Transaksi
  // Keuntungan Koperasi = (Pendapatan Bersih dari Potongan Petani) + (Bagian Koperasi dari Bakul 3%)
  const totalKoperasiIncome = koperasiFarmerIncome + koperasiBakulIncome3Percent;
  
  // 4. Jadwal Retensi 3 Bulan
  const dueDate = new Date(transactionDate);
  dueDate.setMonth(dueDate.getMonth() + 3);
  const retentionDueDate = dueDate.toISOString().split('T')[0];
  
  // 5. Periode Tagihan Bulanan (YYYY-MM)
  const year = transactionDate.getFullYear();
  const month = String(transactionDate.getMonth() + 1).padStart(2, '0');
  const monthlyBillPeriod = `${year}-${month}`;

  return {
    grossPrice: X,
    discountTier: tier,
    farmerCutPercent,
    farmerCutAmount,
    farmerRetention1Percent,
    koperasiFarmerIncome,
    netFarmerAmount,
    bakulAdditional6Percent,
    koperasiBakulIncome3Percent,
    bakulMonthlyBill3Percent,
    totalBakulPayable,
    totalKoperasiIncome,
    retentionDueDate,
    monthlyBillPeriod,
  };
}

/**
 * Creates a complete ledger record from an auction conclusion
 */
export function createLedgerRecord(params: {
  auctionId: string;
  farmerId: string;
  farmerName: string;
  bakulId: string;
  bakulName: string;
  commodityCategory: CommodityCategory;
  weightKg: number;
  pricePerKg: number;
  discountTier: DiscountTier;
  createdAt?: string;
}): TransactionLedger {
  const txDate = params.createdAt ? new Date(params.createdAt) : new Date();
  const gross = Math.round(params.weightKg * params.pricePerKg);
  const calc = calculateAuctionFinancials(gross, params.discountTier, txDate);
  
  return {
    id: `TX-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
    auctionId: params.auctionId,
    farmerId: params.farmerId,
    farmerName: params.farmerName,
    bakulId: params.bakulId,
    bakulName: params.bakulName,
    commodityCategory: params.commodityCategory,
    weightKg: params.weightKg,
    pricePerKg: params.pricePerKg,
    
    grossPrice: calc.grossPrice,
    discountTier: calc.discountTier,
    
    farmerCutPercent: calc.farmerCutPercent,
    farmerCutAmount: calc.farmerCutAmount,
    farmerRetention1Percent: calc.farmerRetention1Percent,
    koperasiFarmerIncome: calc.koperasiFarmerIncome,
    netFarmerAmount: calc.netFarmerAmount,
    
    bakulAdditional6Percent: calc.bakulAdditional6Percent,
    koperasiBakulIncome3Percent: calc.koperasiBakulIncome3Percent,
    bakulMonthlyBill3Percent: calc.bakulMonthlyBill3Percent,
    totalBakulPayable: calc.totalBakulPayable,
    
    totalKoperasiIncome: calc.totalKoperasiIncome,
    
    statusRetention: 'held' as RetentionStatus,
    retentionDueDate: calc.retentionDueDate,
    
    statusBakulBill: 'unpaid' as BakulBillStatus,
    monthlyBillPeriod: calc.monthlyBillPeriod,
    
    createdAt: txDate.toISOString(),
    approvedByManager: true,
  };
}

/**
 * Helper to format Rupiah
 */
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date in Indonesian locale
 */
export function formatIndoDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
