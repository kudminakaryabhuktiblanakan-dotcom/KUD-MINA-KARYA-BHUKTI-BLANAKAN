import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert } from 'lucide-react';
import { TransactionLedger } from '../../types';
import { formatIDR } from '../../services/calculationEngine';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'single' | 'all';
  targetLedger?: TransactionLedger | null;
  totalCount?: number;
  onConfirmSingle?: (ledgerId: string) => void;
  onConfirmDeleteAll?: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  mode,
  targetLedger,
  totalCount = 0,
  onConfirmSingle,
  onConfirmDeleteAll,
}) => {
  const [confirmInput, setConfirmInput] = useState('');

  if (!isOpen) return null;

  const isSingle = mode === 'single';

  const handleExecute = () => {
    if (isSingle) {
      if (targetLedger && onConfirmSingle) {
        onConfirmSingle(targetLedger.id);
      }
    } else {
      if (confirmInput === 'HAPUS SEMUA' && onConfirmDeleteAll) {
        onConfirmDeleteAll();
      }
    }
    setConfirmInput('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={`p-6 text-white relative ${isSingle ? 'bg-red-700' : 'bg-red-900'}`}>
          <button
            onClick={() => {
              setConfirmInput('');
              onClose();
            }}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
              {isSingle ? <Trash2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">
                {isSingle ? 'Hapus Transaksi Lelang' : 'HAPUS SEMUA DATA TRANSAKSI'}
              </h3>
              <p className="text-xs text-red-100 mt-0.5">
                {isSingle
                  ? 'Konfirmasi penghapusan catatan buku besar ini.'
                  : 'Tindakan ini akan mengosongkan seluruh riwayat lelang.'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs text-slate-600">
          {isSingle && targetLedger ? (
            <div className="space-y-3">
              <p className="text-slate-800 font-semibold leading-relaxed">
                Apakah Anda yakin ingin menghapus data lelang ini secara permanen?
              </p>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">ID Transaksi:</span>
                  <span className="font-bold text-slate-900">{targetLedger.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Penjual (Petani):</span>
                  <span className="font-bold text-slate-800">{targetLedger.farmerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pembeli (Bakul):</span>
                  <span className="font-bold text-slate-800">{targetLedger.bakulName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Komoditas & Bobot:</span>
                  <span className="font-bold text-slate-800">
                    {targetLedger.commodityCategory} ({targetLedger.weightKg} Kg)
                  </span>
                </div>
                <div className="flex justify-between text-red-600 pt-1 border-t border-slate-200 font-bold">
                  <span>Nilai Transaksi:</span>
                  <span>{formatIDR(targetLedger.grossPrice)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-800 leading-relaxed font-medium">
                PERINGATAN: Anda akan menghapus seluruh data transaksi ({totalCount} transaksi) dari buku besar lelang KUD Mina Karya Bhukti.
              </div>

              <p className="text-slate-700 font-bold">
                Ketik <span className="font-mono text-red-700 bg-red-100 px-1.5 py-0.5 rounded">HAPUS SEMUA</span> di bawah ini untuk mengonfirmasi:
              </p>

              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="Ketik HAPUS SEMUA"
                className="w-full px-3.5 py-2.5 border-2 border-red-300 rounded-xl text-xs font-mono font-bold focus:border-red-600 focus:outline-hidden"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setConfirmInput('');
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={!isSingle && confirmInput !== 'HAPUS SEMUA'}
            onClick={handleExecute}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
              isSingle || confirmInput === 'HAPUS SEMUA'
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20 active:scale-95 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>{isSingle ? 'Hapus Transaksi Ini' : 'Hapus Seluruh Data Transaksi'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
