import React, { useState } from 'react';
import { 
  Code2, 
  Database, 
  Layers, 
  Cpu, 
  Smartphone, 
  Server, 
  FileCode, 
  Copy, 
  Check, 
  Layout, 
  Clock, 
  ShieldCheck, 
  Terminal,
  ExternalLink
} from 'lucide-react';

export const ArchitectureDocs: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'stack' | 'erd' | 'laravel' | 'flutter' | 'wireframe'>('laravel');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sqlSchemaCode = `-- ========================================================
-- SCHEMA DATABASE KOPERASI TAMBAK (POSTGRESQL / MYSQL)
-- Multi-Role Lelang, Bagi Hasil Berjenjang, & Retensi
-- ========================================================

-- 1. Tabel Users & RBAC
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'karyawan', 'petani', 'bakul');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    phone VARCHAR(20) NOT NULL,
    tambak_location TEXT NULL,          -- Lokasi tambak (khusus Petani)
    bakul_market_area TEXT NULL,        -- Wilayah distribusi (khusus Bakul)
    bank_name VARCHAR(50) NULL,
    bank_account_number VARCHAR(50) NULL,
    bank_account_holder VARCHAR(150) NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Commodities (Hasil Tambak Masuk)
CREATE TYPE commodity_status AS ENUM ('registered', 'bidding', 'sold', 'cancelled');

CREATE TABLE commodities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    category VARCHAR(50) NOT NULL,      -- 'Udang Vaname', 'Bandeng', dll
    variety VARCHAR(100) NULL,          -- 'Size 40', 'Cabut Duri'
    initial_weight DECIMAL(10, 2) NOT NULL, -- Bobot timbangan (kg)
    quality_notes TEXT NULL,
    pond_number VARCHAR(50) NULL,
    harvest_date DATE NOT NULL,
    status commodity_status DEFAULT 'registered',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Auctions (Sesi Pelelangan)
CREATE TYPE auction_status AS ENUM ('scheduled', 'live', 'completed', 'cancelled');

CREATE TABLE auctions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commodity_id UUID NOT NULL UNIQUE REFERENCES commodities(id) ON DELETE RESTRICT,
    winning_bakul_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    start_price_per_kg DECIMAL(12, 2) NOT NULL,
    winning_price_per_kg DECIMAL(12, 2) NULL,
    winning_gross_price DECIMAL(14, 2) NULL, -- X = winning_price * weight
    discount_tier SMALLINT NOT NULL CHECK (discount_tier IN (8, 6, 3)),
    status auction_status DEFAULT 'live',
    closed_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Transaction_Ledgers (Buku Besar Keuangan Utama)
CREATE TYPE retention_status AS ENUM ('held', 'ready_to_release', 'released');
CREATE TYPE bakul_bill_status AS ENUM ('unpaid', 'invoiced', 'paid');

CREATE TABLE transaction_ledgers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_id UUID NOT NULL UNIQUE REFERENCES auctions(id) ON DELETE RESTRICT,
    farmer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    bakul_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Nilai Pokok Lelang (X)
    gross_price DECIMAL(14, 2) NOT NULL, -- X
    discount_tier SMALLINT NOT NULL CHECK (discount_tier IN (8, 6, 3)),
    
    -- Sisi Petani (Penjual)
    farmer_cut_amount DECIMAL(14, 2) NOT NULL,          -- X * tier%
    farmer_retention_1_percent DECIMAL(14, 2) NOT NULL, -- X * 1% (Ditahan 3 bulan)
    koperasi_farmer_income DECIMAL(14, 2) NOT NULL,     -- farmer_cut_amount - 1%
    net_farmer_amount DECIMAL(14, 2) NOT NULL,          -- X - farmer_cut_amount (Cair segera)
    
    -- Sisi Bakul (Pembeli)
    bakul_additional_6_percent DECIMAL(14, 2) NOT NULL,      -- X * 6%
    koperasi_bakul_income_3_percent DECIMAL(14, 2) NOT NULL, -- X * 3%
    bakul_monthly_bill_3_percent DECIMAL(14, 2) NOT NULL,    -- X * 3%
    total_bakul_payable DECIMAL(14, 2) NOT NULL,             -- X + 6%
    
    -- Keuntungan Koperasi Keseluruhan
    total_koperasi_income DECIMAL(14, 2) NOT NULL, -- (koperasi_farmer_income + 3%)
    
    -- Tracking Retensi 3 Bulan Petani
    status_retention retention_status DEFAULT 'held',
    retention_due_date DATE NOT NULL,              -- created_at + 3 months
    retention_released_at TIMESTAMP WITH TIME ZONE NULL,
    
    -- Tracking Tagihan 3% Bulanan Bakul
    status_bakul_bill bakul_bill_status DEFAULT 'unpaid',
    monthly_bill_period VARCHAR(7) NOT NULL,        -- Format 'YYYY-MM'
    bakul_invoice_id UUID NULL,
    
    approved_by_manager BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes untuk akselerasi Background Jobs (Cron)
CREATE INDEX idx_retention_due ON transaction_ledgers (status_retention, retention_due_date);
CREATE INDEX idx_bakul_monthly ON transaction_ledgers (bakul_id, status_bakul_bill, monthly_bill_period);
`;

  const laravelServiceCode = `<?php

namespace App\\Services;

use App\\Models\\Auction;
use App\\Models\\Commodity;
use App\\Models\\TransactionLedger;
use Carbon\\Carbon;
use Illuminate\\Support\\Facades\\DB;

class TransactionCalculationService
{
    /**
     * Hitung seluruh formula keuangan lelang koperasi dengan presisi tinggi
     * 
     * @param float|int $grossPrice Nilai total lelang (X)
     * @param int $tier Persentase potongan petani (8, 6, atau 3)
     * @param Carbon $transactionDate Tanggal transaksi
     * @return array
     */
    public function calculateFinancials(float $grossPrice, int $tier, Carbon $transactionDate): array
    {
        // Pastikan pembulatan presisi Rupiah (integer)
        $X = round($grossPrice);

        // 1. SISI PETANI (PENJUAL)
        // Total Potongan = X * tier%
        $farmerCutAmount = (int) round($X * ($tier / 100));

        // Hak Petani (Retensi 1%) = X * 1% (Ditahan 3 bulan)
        $farmerRetention1Percent = (int) round($X * 0.01);

        // Pendapatan Bersih Koperasi dari Petani = Total Potongan - Hak Petani
        $koperasiFarmerIncome = $farmerCutAmount - $farmerRetention1Percent;

        // Dana Bersih Petani (Cair Segera) = X - Total Potongan
        $netFarmerAmount = $X - $farmerCutAmount;

        // 2. SISI BAKUL (PEMBELI)
        // Tambahan Biaya Bakul = +6%
        $bakulAdditional6Percent = (int) round($X * 0.06);

        // 1. Bagian Koperasi Langsung (3%) = X * 3%
        $koperasiBakulIncome3Percent = (int) round($X * 0.03);

        // 2. Bagian Simpanan / Tagihan Bakul Bulanan (3%) = X * 3%
        $bakulMonthlyBill3Percent = (int) round($X * 0.03);

        // Total Tagihan Akhir Bakul = X + 6%
        $totalBakulPayable = $X + $bakulAdditional6Percent;

        // 3. KEUNTUNGAN TOTAL KOPERASI PER TRANSAKSI
        // Keuntungan Koperasi = Bersih dari Petani + 3% dari Bakul
        $totalKoperasiIncome = $koperasiFarmerIncome + $koperasiBakulIncome3Percent;

        // 4. JADWAL JATUH TEMPO RETENSI 3 BULAN
        $retentionDueDate = $transactionDate->copy()->addMonths(3)->toDateString();

        // 5. PERIODE TAGIHAN BULANAN BAKUL (YYYY-MM)
        $monthlyBillPeriod = $transactionDate->format('Y-m');

        return [
            'gross_price' => $X,
            'discount_tier' => $tier,
            'farmer_cut_amount' => $farmerCutAmount,
            'farmer_retention_1_percent' => $farmerRetention1Percent,
            'koperasi_farmer_income' => $koperasiFarmerIncome,
            'net_farmer_amount' => $netFarmerAmount,
            'bakul_additional_6_percent' => $bakulAdditional6Percent,
            'koperasi_bakul_income_3_percent' => $koperasiBakulIncome3Percent,
            'bakul_monthly_bill_3_percent' => $bakulMonthlyBill3Percent,
            'total_bakul_payable' => $totalBakulPayable,
            'total_koperasi_income' => $totalKoperasiIncome,
            'retention_due_date' => $retentionDueDate,
            'monthly_bill_period' => $monthlyBillPeriod,
        ];
    }

    /**
     * Otorisasi dan Simpan Hasil Pemenang Lelang ke Ledger
     */
    public function recordAuctionConclusion(Auction $auction, string $winningBakulId, float $winningPricePerKg): TransactionLedger
    {
        return DB::transaction(function () use ($auction, $winningBakulId, $winningPricePerKg) {
            $commodity = $auction->commodity;
            $grossPrice = $commodity->initial_weight * $winningPricePerKg;
            $now = Carbon::now();

            $calc = $this->calculateFinancials($grossPrice, $auction->discount_tier, $now);

            // Update status auction
            $auction->update([
                'winning_bakul_id' => $winningBakulId,
                'winning_price_per_kg' => $winningPricePerKg,
                'winning_gross_price' => $grossPrice,
                'status' => 'completed',
                'closed_at' => $now,
            ]);

            // Update commodity status
            $commodity->update(['status' => 'sold']);

            // Insert Ledger
            return TransactionLedger::create([
                'auction_id' => $auction->id,
                'farmer_id' => $commodity->farmer_id,
                'bakul_id' => $winningBakulId,
                'gross_price' => $calc['gross_price'],
                'discount_tier' => $calc['discount_tier'],
                'farmer_cut_amount' => $calc['farmer_cut_amount'],
                'farmer_retention_1_percent' => $calc['farmer_retention_1_percent'],
                'koperasi_farmer_income' => $calc['koperasi_farmer_income'],
                'net_farmer_amount' => $calc['net_farmer_amount'],
                'bakul_additional_6_percent' => $calc['bakul_additional_6_percent'],
                'koperasi_bakul_income_3_percent' => $calc['koperasi_bakul_income_3_percent'],
                'bakul_monthly_bill_3_percent' => $calc['bakul_monthly_bill_3_percent'],
                'total_bakul_payable' => $calc['total_bakul_payable'],
                'total_koperasi_income' => $calc['total_koperasi_income'],
                'status_retention' => 'held',
                'retention_due_date' => $calc['retention_due_date'],
                'status_bakul_bill' => 'unpaid',
                'monthly_bill_period' => $calc['monthly_bill_period'],
                'created_at' => $now,
            ]);
        });
    }
}`;

  const laravelCronJobsCode = `<?php

// =========================================================================
// 1. CRON JOB: ProcessRetentionReleaseCommand (Jatuh Tempo 3 Bulan Petani)
// Jalankan setiap hari pukul 01:00: $schedule->command('koperasi:retention-release')->dailyAt('01:00');
// =========================================================================

namespace App\\Console\\Commands;

use Illuminate\\Console\\Command;
use App\\Models\\TransactionLedger;
use Carbon\\Carbon;
use Illuminate\\Support\\Facades\\Log;

class ProcessRetentionReleaseCommand extends Command
{
    protected $signature = 'koperasi:retention-release';
    protected $description = 'Otomatis menandai retensi 1% petani yang telah genap 3 bulan sebagai Siap Dicairkan';

    public function handle()
    {
        $today = Carbon::today()->toDateString();

        $affected = TransactionLedger::where('status_retention', 'held')
            ->whereDate('retention_due_date', '<=', $today)
            ->update([
                'status_retention' => 'ready_to_release',
                'updated_at' => Carbon::now(),
            ]);

        $this->info("Berhasil memperbarui {$affected} catatan retensi petani ke status 'ready_to_release'.");
        Log::info("CRON RETENSI: {$affected} hak petani siap dicairkan pada tanggal {$today}.");
        return 0;
    }
}

// =========================================================================
// 2. CRON JOB: GenerateMonthlyBakulInvoiceCommand (Rekap Tagihan 3% Bakul)
// Jalankan tanggal 1 setiap bulan pukul 02:00: $schedule->command('koperasi:generate-bakul-invoices')->monthlyOn(1, '02:00');
// =========================================================================

namespace App\\Console\\Commands;

use Illuminate\\Console\\Command;
use App\\Models\\TransactionLedger;
use App\\Models\\MonthlyBakulInvoice;
use Carbon\\Carbon;
use Illuminate\\Support\\Facades\\DB;
use Illuminate\\Support\\Str;

class GenerateMonthlyBakulInvoiceCommand extends Command
{
    protected $signature = 'koperasi:generate-bakul-invoices {--period= : Format YYYY-MM}';
    protected $description = 'Rekapitulasi komponen tagihan 3% bakul selama 1 bulan kalender menjadi invoice resmi';

    public function handle()
    {
        $targetPeriod = $this->option('period') ?? Carbon::now()->subMonth()->format('Y-m');
        $this->info("Menghasilkan invoice tagihan 3% bakul untuk periode: {$targetPeriod}");

        $unbilledGroups = TransactionLedger::where('monthly_bill_period', $targetPeriod)
            ->where('status_bakul_bill', 'unpaid')
            ->select(
                'bakul_id',
                DB::raw('COUNT(id) as total_tx'),
                DB::raw('SUM(gross_price) as total_gross'),
                DB::raw('SUM(bakul_monthly_bill_3_percent) as total_3_percent')
            )
            ->groupBy('bakul_id')
            ->get();

        foreach ($unbilledGroups as $group) {
            DB::transaction(function () use ($group, $targetPeriod) {
                $invoiceId = 'INV-' . str_replace('-', '', $targetPeriod) . '-' . strtoupper(Str::random(6));

                // 1. Buat Invoice Induk
                MonthlyBakulInvoice::create([
                    'id' => $invoiceId,
                    'bakul_id' => $group->bakul_id,
                    'period' => $targetPeriod,
                    'transaction_count' => $group->total_tx,
                    'total_auction_gross' => $group->total_gross,
                    'total_bakul_3_percent_bill' => $group->total_3_percent,
                    'status' => 'issued',
                    'due_date' => Carbon::parse($targetPeriod . '-01')->addMonth()->setDay(10)->toDateString(),
                ]);

                // 2. Hubungkan ledger ke invoice
                TransactionLedger::where('bakul_id', $group->bakul_id)
                    ->where('monthly_bill_period', $targetPeriod)
                    ->where('status_bakul_bill', 'unpaid')
                    ->update([
                        'status_bakul_bill' => 'invoiced',
                        'bakul_invoice_id' => $invoiceId,
                    ]);
            });
        }

        $this->info("Selesai menerbitkan " . count($unbilledGroups) . " invoice bakul.");
        return 0;
    }
}`;

  const flutterModelCode = `// lib/models/transaction_ledger.dart
import 'package:intl/intl.dart';

class TransactionLedger {
  final String id;
  final String auctionId;
  final String farmerId;
  final String farmerName;
  final String bakulId;
  final String bakulName;
  final String commodityCategory;
  final double weightKg;
  final double pricePerKg;
  final double grossPrice; // X
  final int discountTier; // 8, 6, 3
  
  // Sisi Petani
  final double farmerCutAmount;
  final double farmerRetention1Percent;
  final double koperasiFarmerIncome;
  final double netFarmerAmount;
  
  // Sisi Bakul
  final double bakulAdditional6Percent;
  final double koperasiBakulIncome3Percent;
  final double bakulMonthlyBill3Percent;
  final double totalBakulPayable;
  
  // Koperasi
  final double totalKoperasiIncome;
  final String statusRetention; // 'held' | 'ready_to_release' | 'released'
  final DateTime retentionDueDate;
  final String statusBakulBill; // 'unpaid' | 'invoiced' | 'paid'
  final String monthlyBillPeriod;

  TransactionLedger({
    required this.id,
    required this.auctionId,
    required this.farmerId,
    required this.farmerName,
    required this.bakulId,
    required this.bakulName,
    required this.commodityCategory,
    required this.weightKg,
    required this.pricePerKg,
    required this.grossPrice,
    required this.discountTier,
    required this.farmerCutAmount,
    required this.farmerRetention1Percent,
    required this.koperasiFarmerIncome,
    required this.netFarmerAmount,
    required this.bakulAdditional6Percent,
    required this.koperasiBakulIncome3Percent,
    required this.bakulMonthlyBill3Percent,
    required this.totalBakulPayable,
    required this.totalKoperasiIncome,
    required this.statusRetention,
    required this.retentionDueDate,
    required this.statusBakulBill,
    required this.monthlyBillPeriod,
  });

  String get formattedGross => NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0).format(grossPrice);
  String get formattedNetFarmer => NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0).format(netFarmerAmount);
  String get formattedRetention => NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0).format(farmerRetention1Percent);
  String get formattedBakulPayable => NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0).format(totalBakulPayable);

  factory TransactionLedger.fromJson(Map<String, dynamic> json) {
    return TransactionLedger(
      id: json['id'],
      auctionId: json['auction_id'],
      farmerId: json['farmer_id'],
      farmerName: json['farmer_name'],
      bakulId: json['bakul_id'],
      bakulName: json['bakul_name'],
      commodityCategory: json['commodity_category'],
      weightKg: (json['weight_kg'] as num).toDouble(),
      pricePerKg: (json['price_per_kg'] as num).toDouble(),
      grossPrice: (json['gross_price'] as num).toDouble(),
      discountTier: json['discount_tier'],
      farmerCutAmount: (json['farmer_cut_amount'] as num).toDouble(),
      farmerRetention1Percent: (json['farmer_retention_1_percent'] as num).toDouble(),
      koperasiFarmerIncome: (json['koperasi_farmer_income'] as num).toDouble(),
      netFarmerAmount: (json['net_farmer_amount'] as num).toDouble(),
      bakulAdditional6Percent: (json['bakul_additional_6_percent'] as num).toDouble(),
      koperasiBakulIncome3Percent: (json['koperasi_bakul_income_3_percent'] as num).toDouble(),
      bakulMonthlyBill3Percent: (json['bakul_monthly_bill_3_percent'] as num).toDouble(),
      totalBakulPayable: (json['total_bakul_payable'] as num).toDouble(),
      totalKoperasiIncome: (json['total_koperasi_income'] as num).toDouble(),
      statusRetention: json['status_retention'],
      retentionDueDate: DateTime.parse(json['retention_due_date']),
      statusBakulBill: json['status_bakul_bill'],
      monthlyBillPeriod: json['monthly_bill_period'],
    );
  }
}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">Dokumentasi Arsitektur & Source Code</h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Production Blueprint
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Spesifikasi teknis lengkap implementasi Laravel 11 (Backend & Cron) dan Flutter 3 (Mobile Client).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              PHP 8.3 + Dart 3.5
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSection('stack')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSection === 'stack'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          1. Arsitektur Teknis & Tech Stack
        </button>
        <button
          onClick={() => setActiveSection('erd')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSection === 'erd'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4" />
          2. Skema Database (ERD & SQL)
        </button>
        <button
          onClick={() => setActiveSection('laravel')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSection === 'laravel'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Server className="w-4 h-4" />
          3. Backend Laravel (Service & Cron)
        </button>
        <button
          onClick={() => setActiveSection('flutter')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSection === 'flutter'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          4. Mobile Flutter (Model & State)
        </button>
        <button
          onClick={() => setActiveSection('wireframe')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSection === 'wireframe'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layout className="w-4 h-4" />
          5. Desain UI/UX & Wireframe 5 Role
        </button>
      </div>

      {/* Section 1: Tech Stack */}
      {activeSection === 'stack' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Rekomendasi Arsitektur Teknis Sistem Koperasi Tambak
            </h3>
            <p className="text-xs text-slate-500">
              Arsitektur terdistribusi yang memisahkan core transactional ledger, background scheduler, dan multi-platform client.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Box 1: Backend API */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-red-100 text-red-700">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Backend: Laravel 11/12</h4>
                  <span className="text-[11px] text-slate-500 font-mono">PHP 8.3 / REST API</span>
                </div>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                <li><strong>Laravel Sanctum</strong>: Multi-role token-based authentication.</li>
                <li><strong>Database Transactions</strong>: Menjamin integritas ACID saat penutupan lelang.</li>
                <li><strong>Laravel Reverb / Soketi</strong>: Real-time WebSocket broadcasting untuk live bidding.</li>
                <li><strong>Policy & Gate</strong>: Enforce RBAC ketat untuk 5 jenis hak akses.</li>
              </ul>
            </div>

            {/* Box 2: Mobile App */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Mobile: Flutter 3.24+</h4>
                  <span className="text-[11px] text-slate-500 font-mono">Cross-platform (Android/iOS)</span>
                </div>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                <li><strong>BLoC / Riverpod</strong>: State management modular & reaktif.</li>
                <li><strong>Petani View</strong>: Notifikasi pencairan saldo retensi 1% & dompet panen.</li>
                <li><strong>Bakul View</strong>: Bidding lelang real-time & download invoice bulanan PDF.</li>
                <li><strong>Offline Caching</strong>: Hive / Isar untuk riwayat transaksi lokal.</li>
              </ul>
            </div>

            {/* Box 3: Cron Jobs & Workers */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Scheduler & Cron Workers</h4>
                  <span className="text-[11px] text-slate-500 font-mono">Redis Queue + Horizon</span>
                </div>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                <li><strong>Cron Retensi 3 Bulan</strong>: Daily check <code>01:00 AM</code> memindahkan status <code>held</code> ke <code>ready_to_release</code>.</li>
                <li><strong>Cron Invoice 3% Bakul</strong>: Monthly check tanggal 1 pukul <code>02:00 AM</code> merekap seluruh kewajiban 3% menjadi invoice berkala.</li>
                <li><strong>Push Notification</strong>: Firebase Cloud Messaging (FCM).</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Database & ERD */}
      {activeSection === 'erd' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">Rancangan Skema Database Relasional (SQL DDL)</h3>
                <p className="text-xs text-slate-500">
                  Desain tabel ternormalisasi untuk entitas Users, Commodities, Auctions, dan Transaction_Ledgers.
                </p>
              </div>
              <button
                onClick={() => handleCopy(sqlSchemaCode, 'sql')}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-800 transition-colors"
              >
                {copiedId === 'sql' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedId === 'sql' ? 'Tersalin!' : 'Salin SQL Schema'}
              </button>
            </div>

            <div className="relative">
              <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-[500px] leading-relaxed">
                <code>{sqlSchemaCode}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Section 3: Laravel Implementation */}
      {activeSection === 'laravel' && (
        <div className="space-y-6">
          {/* Service */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  1. Core Calculation Service (Laravel Service Pattern)
                </h3>
                <p className="text-xs text-slate-500">
                  Lokasi: <code>app/Services/TransactionCalculationService.php</code>
                </p>
              </div>
              <button
                onClick={() => handleCopy(laravelServiceCode, 'service')}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-800 transition-colors"
              >
                {copiedId === 'service' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedId === 'service' ? 'Tersalin!' : 'Salin Kode Service'}
              </button>
            </div>

            <div className="relative">
              <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-[450px] leading-relaxed">
                <code>{laravelServiceCode}</code>
              </pre>
            </div>
          </div>

          {/* Cron Jobs */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  2. Background Scheduler / Cron Jobs (Laravel Console Commands)
                </h3>
                <p className="text-xs text-slate-500">
                  Pekerja otomatis untuk retensi 3 bulan petani dan invoice bulanan 3% bakul
                </p>
              </div>
              <button
                onClick={() => handleCopy(laravelCronJobsCode, 'cron')}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-800 transition-colors"
              >
                {copiedId === 'cron' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedId === 'cron' ? 'Tersalin!' : 'Salin Kode Cron Jobs'}
              </button>
            </div>

            <div className="relative">
              <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-[450px] leading-relaxed">
                <code>{laravelCronJobsCode}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Section 4: Flutter Mobile */}
      {activeSection === 'flutter' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Arsitektur Flutter Mobile Client (Dart Data Model & Formatting)
              </h3>
              <p className="text-xs text-slate-500">
                Lokasi: <code>lib/models/transaction_ledger.dart</code>
              </p>
            </div>
            <button
              onClick={() => handleCopy(flutterModelCode, 'flutter')}
              className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-800 transition-colors"
            >
              {copiedId === 'flutter' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedId === 'flutter' ? 'Tersalin!' : 'Salin Kode Flutter'}
            </button>
          </div>

          <div className="relative">
            <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-[500px] leading-relaxed">
              <code>{flutterModelCode}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Section 5: UI/UX Wireframe Description */}
      {activeSection === 'wireframe' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Spesifikasi Desain Antarmuka & Wireframe untuk 5 Peran
            </h3>
            <p className="text-xs text-slate-500">
              Panduan UX, tata letak, komponen utama, dan alur kerja (workflow) tiap persona
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Role 1: Admin */}
            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/20 space-y-2">
              <span className="font-bold text-purple-900 text-sm block">1. Antarmuka Admin (Web Desktop)</span>
              <p className="text-slate-600">
                <strong>Struktur Layout:</strong> Sidebar kiri (Master Users, Commodities, Tiers, Audit Ledgers, System Health). Main Area berupa Data Grid dengan filter multi-parameter dan fitur Export CSV/Excel.
              </p>
              <p className="text-slate-600">
                <strong>Komponen Kunci:</strong> Modal edit persentase tier (8/6/3%), Log audit transaksi dengan timestamp presisi, Panel eksekusi manual background jobs (Retensi & Invoice generator).
              </p>
            </div>

            {/* Role 2: Manager */}
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/20 space-y-2">
              <span className="font-bold text-blue-900 text-sm block">2. Antarmuka Manager (Web / Tablet)</span>
              <p className="text-slate-600">
                <strong>Struktur Layout:</strong> Executive Dashboard dengan 4 KPI Cards (Total Omset Lelang X, Laba Bersih Koperasi, Liabilitas Retensi 1%, Piutang 3% Bakul). Grafik Donut pembagian pendapatan dari Petani vs Bakul.
              </p>
              <p className="text-slate-600">
                <strong>Komponen Kunci:</strong> Tab Otorisasi Pencairan Retensi (daftar transaksi berstatus <code>ready_to_release</code> dengan tombol persetujuan transfer), Tab Otorisasi Invoice Bulanan Bakul.
              </p>
            </div>

            {/* Role 3: Karyawan */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 space-y-2">
              <span className="font-bold text-emerald-900 text-sm block">3. Antarmuka Karyawan / Petugas Kasir Lapangan (Tablet Touchscreen & Web POS)</span>
              <p className="text-slate-600">
                <strong>Struktur Layout:</strong> 3 Tab Utama: (1) Form Penimbangan Masuk (input bobot, pilih petani, grade, tier potongan), (2) Konsol Lelang Real-time (Tombol palu lelang besar, visual bid leader, quick increment button), (3) Cetak Nota Thermal 80mm.
              </p>
              <p className="text-slate-600">
                <strong>Komponen Kunci:</strong> Integrasi timbangan digital via Bluetooth/Serial, tombol konfirmasi sekali klik yang langsung menghasilkan kalkulasi ledger otomatis.
              </p>
            </div>

            {/* Role 4: Petani */}
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/20 space-y-2">
              <span className="font-bold text-amber-900 text-sm block">4. Antarmuka Petani / Penjual (Mobile Flutter App)</span>
              <p className="text-slate-600">
                <strong>Struktur Layout:</strong> Clean Bottom Navigation: Beranda Dompet Hasil Panen, Riwayat Lelang, dan Profil Rekening Bank.
              </p>
              <p className="text-slate-600">
                <strong>Komponen Kunci:</strong> Widget "Dompet Hak Retensi 1%" dengan progress countdown 3 bulan. Jika sudah jatuh tempo, muncul tombol mencolok "Klaim / Tarik Saldo Retensi ke Rekening". Card riwayat transparan menampilkan potongan tier secara jujur tanpa biaya tersembunyi.
              </p>
            </div>

            {/* Role 5: Bakul */}
            <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 space-y-2">
              <span className="font-bold text-indigo-900 text-sm block">5. Antarmuka Bakul / Pembeli (Mobile Flutter App)</span>
              <p className="text-slate-600">
                <strong>Struktur Layout:</strong> Beranda Live Auction (daftar komoditas sedang dilelang dengan refresh real-time), Tab Bidding Cepat, Tab Riwayat Pembelian (+6%), dan Tab Tagihan Bulanan (Komponen 3%).
              </p>
              <p className="text-slate-600">
                <strong>Komponen Kunci:</strong> Tombol lelang satu sentuhan (+Rp 500 / +Rp 1.000 / +Rp 2.000), kartu tagihan bulanan berkala dengan tombol unduh PDF invoice resmi dan opsi pembayaran transfer bank/QRIS koperasi.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
