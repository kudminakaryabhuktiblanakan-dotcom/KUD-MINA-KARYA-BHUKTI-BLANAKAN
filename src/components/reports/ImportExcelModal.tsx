import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Loader2,
  Trash2,
  Table
} from 'lucide-react';
import { 
  parseExcelFile, 
  downloadImportTemplateExcel, 
  ParsedImportRow 
} from '../../services/exportImportService';
import { TransactionLedger, DiscountTier, CommodityCategory } from '../../types';
import { calculateAuctionFinancials, formatIDR } from '../../services/calculationEngine';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (importedLedgers: TransactionLedger[]) => void;
}

export const ImportExcelModal: React.FC<ImportExcelModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedImportRow[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const rows = await parseExcelFile(file);
      setParsedRows(rows);
      if (rows.length === 0) {
        setErrorMessage('File tidak memiliki baris data transaksi yang valid.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Gagal membaca file: ${err.message || 'Format tidak didukung'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const validRows = parsedRows.filter((r) => r.isValid);
  const invalidRows = parsedRows.filter((r) => !r.isValid);

  const totalImportWeight = validRows.reduce((acc, r) => acc + r.weightKg, 0);
  const totalImportGross = validRows.reduce((acc, r) => acc + r.weightKg * r.pricePerKg, 0);

  const handleExecuteImport = () => {
    if (validRows.length === 0) return;

    const newLedgers: TransactionLedger[] = validRows.map((r, idx) => {
      const gross = Math.round(r.weightKg * r.pricePerKg);
      const fin = calculateAuctionFinancials(gross, r.discountTier);
      const uniqueId = `IMP-${Date.now().toString(36).toUpperCase()}-${idx + 1}`;

      return {
        id: uniqueId,
        auctionId: `AUC-${uniqueId}`,
        farmerId: `FARMER-${Date.now()}-${idx}`,
        farmerName: r.farmerName,
        bakulId: `BAKUL-${Date.now()}-${idx}`,
        bakulName: r.bakulName,
        commodityCategory: r.commodityCategory as CommodityCategory,
        weightKg: r.weightKg,
        pricePerKg: r.pricePerKg,
        grossPrice: gross,
        discountTier: r.discountTier,
        farmerCutPercent: fin.farmerCutPercent,
        farmerCutAmount: fin.farmerCutAmount,
        farmerRetention1Percent: fin.farmerRetention1Percent,
        koperasiFarmerIncome: fin.koperasiFarmerIncome,
        netFarmerAmount: fin.netFarmerAmount,
        bakulAdditional6Percent: fin.bakulAdditional6Percent,
        koperasiBakulIncome3Percent: fin.koperasiBakulIncome3Percent,
        bakulMonthlyBill3Percent: fin.bakulMonthlyBill3Percent,
        totalBakulPayable: fin.totalBakulPayable,
        totalKoperasiIncome: fin.totalKoperasiIncome,
        statusRetention: 'held',
        retentionDueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        statusBakulBill: 'unpaid',
        monthlyBillPeriod: r.date.substring(0, 7),
        createdAt: `${r.date}T08:00:00Z`,
      };
    });

    onImportSuccess(newLedgers);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Impor Data Transaksi Lelang (.xlsx)</h3>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                Unggah file spreadsheet Excel untuk memasukkan data timbangan dan lelang secara massal ke dalam sistem.
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Download Template Bar */}
          <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-teal-700 shrink-0" />
              <div>
                <span className="text-xs font-bold text-teal-900 block">
                  Belum punya format Excel yang sesuai?
                </span>
                <span className="text-[11px] text-teal-700">
                  Unduh template Excel standar yang sudah berisi kolom dan contoh data transaksi lelang TPI.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={downloadImportTemplateExcel}
              className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Template (.xlsx)</span>
            </button>
          </div>

          {/* Upload Area */}
          {!selectedFile ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/40 rounded-3xl p-8 text-center cursor-pointer transition-all space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Klik untuk pilih file atau seret file Excel ke sini
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Format yang didukung: Microsoft Excel (.xlsx, .xls) atau .csv
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">{selectedFile.name}</span>
                  <span className="text-[11px] text-slate-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB &bull; {parsedRows.length} baris terdeteksi
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setParsedRows([]);
                  setErrorMessage(null);
                }}
                className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white transition-colors"
                title="Hapus file"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="py-8 text-center space-y-2">
              <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Sedang memvalidasi dan memproses data Excel...</p>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Preview Table & Stats */}
          {parsedRows.length > 0 && (
            <div className="space-y-4">
              {/* Stats Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Baris Valid</span>
                  <span className="text-lg font-black text-emerald-950">{validRows.length} Baris</span>
                </div>
                <div className="p-3 bg-slate-100 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-600 uppercase block">Total Volume</span>
                  <span className="text-lg font-black text-slate-900">{totalImportWeight.toLocaleString('id-ID')} Kg</span>
                </div>
                <div className="p-3 bg-cyan-50 rounded-xl border border-cyan-200">
                  <span className="text-[10px] font-bold text-cyan-800 uppercase block">Total Omzet Bruto</span>
                  <span className="text-sm font-black font-mono text-cyan-950 mt-1 block">
                    {formatIDR(totalImportGross)}
                  </span>
                </div>
                <div className={`p-3 rounded-xl border ${invalidRows.length > 0 ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  <span className="text-[10px] font-bold uppercase block">Baris Tidak Valid</span>
                  <span className="text-lg font-black">{invalidRows.length} Baris</span>
                </div>
              </div>

              {/* Table Preview */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Table className="w-4 h-4" />
                    <span>Pratinjau Data yang Akan Masuk ({validRows.length} dari {parsedRows.length})</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Hanya baris dengan status valid yang akan disimpan ke sistem
                  </span>
                </div>

                <div className="overflow-x-auto max-h-56">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3">Tanggal</th>
                        <th className="py-2 px-3">Petani</th>
                        <th className="py-2 px-3">Bakul</th>
                        <th className="py-2 px-3">Komoditas</th>
                        <th className="py-2 px-3 text-right">Bobot (Kg)</th>
                        <th className="py-2 px-3 text-right">Harga/Kg</th>
                        <th className="py-2 px-3 text-center">Tier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.map((r, i) => (
                        <tr key={i} className={r.isValid ? 'hover:bg-slate-50' : 'bg-red-50/50 text-red-900'}>
                          <td className="py-2 px-3">
                            {r.isValid ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" /> Valid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full" title={r.errors.join(', ')}>
                                <AlertCircle className="w-3 h-3" /> Error
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono text-[11px]">{r.date}</td>
                          <td className="py-2 px-3 font-semibold">{r.farmerName}</td>
                          <td className="py-2 px-3">{r.bakulName}</td>
                          <td className="py-2 px-3">{r.commodityCategory}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold">{r.weightKg}</td>
                          <td className="py-2 px-3 text-right font-mono">{formatIDR(r.pricePerKg)}</td>
                          <td className="py-2 px-3 text-center font-bold">{r.discountTier}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={validRows.length === 0}
            onClick={handleExecuteImport}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md ${
              validRows.length > 0
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-95 cursor-pointer'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Masukkan {validRows.length} Transaksi ke Sistem</span>
          </button>
        </div>
      </div>
    </div>
  );
};
