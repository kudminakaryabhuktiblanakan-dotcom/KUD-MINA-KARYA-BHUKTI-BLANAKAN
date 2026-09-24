import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  Scale, 
  Fish, 
  ShoppingBag, 
  TrendingUp, 
  Lock, 
  KeyRound, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard,
  X,
  Save,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { User, UserRole, UserPermissions, DiscountTier } from '../../types';
import { getDefaultPermissions } from '../../data/mockData';
import { formatIDR } from '../../services/calculationEngine';

interface UserAccessManagementProps {
  users: User[];
  currentLoggedInUser: User;
  onAddUser: (newUser: User) => void;
  onUpdateUser: (updatedUser: User) => void;
  onDeleteUser: (userId: string) => void;
  onToggleUserStatus: (userId: string) => void;
}

export const UserAccessManagement: React.FC<UserAccessManagementProps> = ({
  users,
  currentLoggedInUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onToggleUserStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Statistics
  const totalCount = users.length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const managerCount = users.filter((u) => u.role === 'manager').length;
  const karyawanCount = users.filter((u) => u.role === 'karyawan').length;
  const petaniCount = users.filter((u) => u.role === 'petani').length;
  const bakulCount = users.filter((u) => u.role === 'bakul').length;
  const suspendedCount = users.filter((u) => u.status === 'suspended').length;

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = u.name.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchPhone = u.phone.toLowerCase().includes(q);
      const matchTambak = u.tambakLocation?.toLowerCase().includes(q) || false;
      const matchMarket = u.bakulMarketArea?.toLowerCase().includes(q) || false;
      return matchName || matchEmail || matchPhone || matchTambak || matchMarket;
    }
    return true;
  });

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Admin Master',
          bg: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: <ShieldCheck className="w-3.5 h-3.5" />,
        };
      case 'manager':
        return {
          label: 'Manajer Keuangan',
          bg: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <TrendingUp className="w-3.5 h-3.5" />,
        };
      case 'karyawan':
        return {
          label: 'Kasir/Timbang',
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: <Scale className="w-3.5 h-3.5" />,
        };
      case 'petani':
        return {
          label: 'Petani Tambak',
          bg: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: <Fish className="w-3.5 h-3.5" />,
        };
      case 'bakul':
        return {
          label: 'Bakul Pembeli',
          bg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          icon: <ShoppingBag className="w-3.5 h-3.5" />,
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Overview */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold tracking-tight">
                Pengaturan Akses Pengguna & Kapasitas
              </h2>
            </div>
            <p className="text-xs text-slate-300">
              Kelola pemberian hak akses, peran, kata sandi, dan status izin untuk Karyawan, Petani, dan Bakul.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer self-start sm:self-auto shrink-0"
          >
            <UserPlus className="w-4 h-4 text-slate-950" />
            <span>+ Beri Akses Pengguna Baru</span>
          </button>
        </div>
      </div>

      {/* Metric Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">Total User</span>
          <div className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">{totalCount}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-700 block uppercase tracking-wider">Karyawan</span>
          <div className="text-xl font-extrabold text-emerald-800 font-mono mt-0.5">{karyawanCount}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-700 block uppercase tracking-wider">Petani</span>
          <div className="text-xl font-extrabold text-amber-800 font-mono mt-0.5">{petaniCount}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-2xs">
          <span className="text-[11px] font-bold text-indigo-700 block uppercase tracking-wider">Bakul</span>
          <div className="text-xl font-extrabold text-indigo-800 font-mono mt-0.5">{bakulCount}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-blue-200 bg-blue-50/20 shadow-2xs">
          <span className="text-[11px] font-bold text-blue-700 block uppercase tracking-wider">Manajer</span>
          <div className="text-xl font-extrabold text-blue-800 font-mono mt-0.5">{managerCount}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-rose-200 bg-rose-50/30 shadow-2xs">
          <span className="text-[11px] font-bold text-rose-700 block uppercase tracking-wider">Ditangguhkan</span>
          <div className="text-xl font-extrabold text-rose-800 font-mono mt-0.5">{suspendedCount}</div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, email, no hp, tambak, pasar..."
              className="w-full pl-9 pr-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {/* Role Filter Buttons */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs overflow-x-auto">
              {[
                { id: 'all', label: 'Semua Role' },
                { id: 'karyawan', label: 'Karyawan' },
                { id: 'petani', label: 'Petani' },
                { id: 'bakul', label: 'Bakul' },
                { id: 'manager', label: 'Manajer' },
                { id: 'admin', label: 'Admin' },
              ].map((rf) => (
                <button
                  key={rf.id}
                  onClick={() => setRoleFilter(rf.id)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
                    roleFilter === rf.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {rf.label}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-hidden"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif Saja</option>
              <option value="suspended">Ditangguhkan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.length === 0 ? (
          <div className="col-span-full bg-white p-8 text-center rounded-2xl border border-slate-200 text-slate-500 text-xs">
            Tidak ada pengguna yang cocok dengan kriteria pencarian atau filter yang dipilih.
          </div>
        ) : (
          filteredUsers.map((u) => {
            const badge = getRoleBadge(u.role);
            const isSelf = u.id === currentLoggedInUser.id;
            const isSuspended = u.status === 'suspended';

            return (
              <div
                key={u.id}
                className={`bg-white rounded-2xl border p-4.5 space-y-3.5 transition-all shadow-2xs hover:shadow-xs relative flex flex-col justify-between ${
                  isSuspended ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200'
                }`}
              >
                <div className="space-y-3">
                  {/* Top: Name, Role Badge, Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-slate-900 text-sm truncate">
                          {u.name}
                        </h4>
                        {isSelf && (
                          <span className="px-1.5 py-0.2 bg-cyan-100 text-cyan-800 rounded text-[9px] font-bold">
                            Anda
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border shrink-0 ${badge.bg}`}
                    >
                      {badge.icon}
                      <span>{badge.label}</span>
                    </span>
                  </div>

                  {/* Metadata based on role */}
                  <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> No. HP:
                      </span>
                      <span className="font-medium font-mono">{u.phone}</span>
                    </div>

                    {u.tambakLocation && (
                      <div className="flex justify-between items-start text-[11px] gap-2">
                        <span className="text-slate-400 flex items-center gap-1 shrink-0">
                          <MapPin className="w-3 h-3 text-amber-600" /> Lokasi Tambak:
                        </span>
                        <span className="font-medium text-slate-800 text-right truncate">
                          {u.tambakLocation}
                        </span>
                      </div>
                    )}

                    {u.defaultTier && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Tier Potongan Jasa:</span>
                        <span className="font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded text-[10px]">
                          Tier {u.defaultTier}%
                        </span>
                      </div>
                    )}

                    {u.bakulMarketArea && (
                      <div className="flex justify-between items-start text-[11px] gap-2">
                        <span className="text-slate-400 flex items-center gap-1 shrink-0">
                          <Building2 className="w-3 h-3 text-indigo-600" /> Wilayah Pasar:
                        </span>
                        <span className="font-medium text-slate-800 text-right truncate">
                          {u.bakulMarketArea}
                        </span>
                      </div>
                    )}

                    {u.creditLimit !== undefined && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Limit Bidding:</span>
                        <span className="font-bold text-indigo-800 font-mono">
                          {formatIDR(u.creditLimit)}
                        </span>
                      </div>
                    )}

                    {u.shiftLocation && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Meja / Shift:</span>
                        <span className="font-medium text-emerald-800">
                          {u.shiftLocation}
                        </span>
                      </div>
                    )}

                    {u.bankAccount && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <CreditCard className="w-3 h-3" /> Rekening:
                        </span>
                        <span className="font-mono text-slate-700 truncate max-w-[150px]">
                          {u.bankAccount.bankName} {u.bankAccount.accountNumber}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Permissions Summary Badges */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Kapasitas & Izin Akses:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {u.permissions?.canInputWeighing && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                          Input Timbang
                        </span>
                      )}
                      {u.permissions?.canRunAuction && (
                        <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-semibold">
                          Operator Lelang
                        </span>
                      )}
                      {u.permissions?.canPlaceBid && (
                        <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-semibold">
                          Bidding Lelang
                        </span>
                      )}
                      {u.permissions?.canApproveFinancials && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold">
                          Approval Keuangan
                        </span>
                      )}
                      {u.permissions?.canViewReports && (
                        <span className="px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200 text-[10px] font-semibold">
                          Laporan H/B/T
                        </span>
                      )}
                      {u.permissions?.canManageUsers && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-semibold">
                          Kelola Akses
                        </span>
                      )}
                      {u.role === 'petani' && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
                          Data Hasil Milik Sendiri
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions Bar */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {/* Status Toggle Button */}
                  <button
                    type="button"
                    onClick={() => onToggleUserStatus(u.id)}
                    disabled={isSelf}
                    className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all ${
                      isSelf
                        ? 'text-slate-400 bg-slate-100 cursor-not-allowed'
                        : isSuspended
                        ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 cursor-pointer'
                        : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 cursor-pointer'
                    }`}
                    title={isSuspended ? 'Aktifkan kembali akses akun ini' : 'Tangguhkan akses login pengguna ini'}
                  >
                    {isSuspended ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Aktifkan</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                        <span>Tangguhkan</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    {/* Edit User Button */}
                    <button
                      type="button"
                      onClick={() => setEditingUser(u)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
                      title="Ubah Hak Akses & Profil Pengguna"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete User Button */}
                    <button
                      type="button"
                      onClick={() => setDeletingUser(u)}
                      disabled={isSelf || u.id === 'USR-ADMIN-01'}
                      className={`p-1.5 rounded-lg transition-all ${
                        isSelf || u.id === 'USR-ADMIN-01'
                          ? 'text-slate-300 cursor-not-allowed'
                          : 'text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 cursor-pointer'
                      }`}
                      title={isSelf || u.id === 'USR-ADMIN-01' ? 'Tidak dapat mencabut akun utama' : 'Cabut Akses / Hapus Akun'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: TAMBAH / BERI AKSES PENGGUNA BARU */}
      {isAddModalOpen && (
        <CreateUserModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={(newUser) => {
            onAddUser(newUser);
            setIsAddModalOpen(false);
          }}
        />
      )}

      {/* MODAL: EDIT HAK AKSES & STATUS PENGGUNA */}
      {editingUser && (
        <EditUserAccessModal
          user={editingUser}
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSave={(updated) => {
            onUpdateUser(updated);
            setEditingUser(null);
          }}
        />
      )}

      {/* MODAL: KONFIRMASI CABUT / HAPUS AKSES */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-2xl bg-rose-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Cabut Akses Pengguna?</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin mencabut seluruh hak akses dan menghapus akun pengguna{' '}
              <strong className="text-slate-900 font-bold">{deletingUser.name}</strong> ({deletingUser.role.toUpperCase()})?
              Akun ini tidak akan dapat login lagi ke sistem KUD.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteUser(deletingUser.id);
                  setDeletingUser(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Ya, Cabut Akses
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// SUB-COMPONENT: MODAL BERI AKSES PENGGUNA BARU
// ==========================================
interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onSave }) => {
  const [role, setRole] = useState<UserRole>('karyawan');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('123456');

  // Role-specific states
  const [tambakLocation, setTambakLocation] = useState('');
  const [defaultTier, setDefaultTier] = useState<DiscountTier>(8);
  const [bankName, setBankName] = useState('BRI Unit Blanakan');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  const [bakulMarketArea, setBakulMarketArea] = useState('');
  const [creditLimit, setCreditLimit] = useState<number>(50000000);

  const [shiftLocation, setShiftLocation] = useState('Meja Timbang Dermaga 1');

  // Permissions state
  const [permissions, setPermissions] = useState<UserPermissions>(getDefaultPermissions('karyawan'));

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setPermissions(getDefaultPermissions(newRole));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newId = `USR-${role.toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const newUser: User = {
      id: newId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role,
      status: 'active',
      password: password.trim() || '123456',
      permissions,
      createdAt: new Date().toISOString().split('T')[0],
      lastLoginAt: undefined,
    };

    if (role === 'petani') {
      newUser.tambakLocation = tambakLocation.trim() || 'Blanakan, Subang';
      newUser.defaultTier = defaultTier;
      if (accountNumber) {
        newUser.bankAccount = {
          bankName,
          accountNumber,
          accountHolder: accountHolder.trim() || name.trim(),
        };
      }
    } else if (role === 'bakul') {
      newUser.bakulMarketArea = bakulMarketArea.trim() || 'Pasar Lokal Subang / Muara Baru';
      newUser.creditLimit = creditLimit;
    } else if (role === 'karyawan') {
      newUser.shiftLocation = shiftLocation.trim();
    }

    onSave(newUser);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 my-8 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-100 text-cyan-800">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Beri Akses Pengguna Baru
              </h3>
              <p className="text-xs text-slate-500">
                Buat akun dan tentukan kapasitas untuk Karyawan, Petani, atau Bakul
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step 1: Select Role */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              1. Pilih Peran / Kapasitas:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(['karyawan', 'petani', 'bakul', 'manager', 'admin'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRoleChange(r)}
                  className={`p-2 rounded-xl border text-center text-xs font-bold capitalize transition-all cursor-pointer ${
                    role === r
                      ? 'border-cyan-600 bg-cyan-50 text-cyan-950 ring-2 ring-cyan-500/20 shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {r === 'karyawan' ? 'Kasir/Timbang' : r}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Basic Credentials */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Nama Lengkap Pengguna *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="misal: Hendra Gunawan"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Email / ID Akun *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hendra@koperasitambak.id"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Nomor Handphone / WhatsApp *
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0812-3344-5566"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Kata Sandi Awal / PIN
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Default: 123456"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Step 3: Role-Specific Configurations */}
          {role === 'petani' && (
            <div className="bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200 space-y-3">
              <span className="text-xs font-bold text-amber-900 block">
                Atribut Khusus Petani Tambak:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Lokasi Tambak Petani
                  </label>
                  <input
                    type="text"
                    value={tambakLocation}
                    onChange={(e) => setTambakLocation(e.target.value)}
                    placeholder="Blanakan Subang, Tambak Blok A-01"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Tier Potongan Jasa Default
                  </label>
                  <select
                    value={defaultTier}
                    onChange={(e) => setDefaultTier(Number(e.target.value) as DiscountTier)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                  >
                    <option value={8}>Tier 8% (Standar Umum)</option>
                    <option value={6}>Tier 6% (Anggota Kemitraan)</option>
                    <option value={3}>Tier 3% (Khusus / Binaan)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Nama Bank Penerimaan
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="BRI / Mandiri / BCA"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Nomor Rekening
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="4120-01-xxxxxx-xx"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {role === 'bakul' && (
            <div className="bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-200 space-y-3">
              <span className="text-xs font-bold text-indigo-900 block">
                Atribut Khusus Bakul / Pembeli Lelang:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Wilayah Pasar / Distribusi
                  </label>
                  <input
                    type="text"
                    value={bakulMarketArea}
                    onChange={(e) => setBakulMarketArea(e.target.value)}
                    placeholder="Pasar Ikan Pabean Surabaya / Muara Baru Jakarta"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Plafon Limit Bidding Lelang (Rp)
                  </label>
                  <input
                    type="number"
                    step="10000000"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {role === 'karyawan' && (
            <div className="bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-200 space-y-3">
              <span className="text-xs font-bold text-emerald-900 block">
                Atribut Khusus Karyawan Lapangan:
              </span>
              <div>
                <label className="font-semibold text-slate-700 block mb-1 text-xs">
                  Penugasan Lokasi Meja Timbang / Shift Kerja
                </label>
                <input
                  type="text"
                  value={shiftLocation}
                  onChange={(e) => setShiftLocation(e.target.value)}
                  placeholder="Meja Timbang Utama (Dermaga Barat)"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Step 4: Granular Permissions Checklist */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Pengaturan Izin Modular:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={permissions.canInputWeighing}
                  onChange={(e) => setPermissions({ ...permissions, canInputWeighing: e.target.checked })}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Input Timbangan</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={permissions.canRunAuction}
                  onChange={(e) => setPermissions({ ...permissions, canRunAuction: e.target.checked })}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Operator Lelang</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={permissions.canPlaceBid}
                  onChange={(e) => setPermissions({ ...permissions, canPlaceBid: e.target.checked })}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Ajukan Penawaran</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={permissions.canViewReports}
                  onChange={(e) => setPermissions({ ...permissions, canViewReports: e.target.checked })}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Lihat Laporan H/B/T</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={permissions.canExportData}
                  onChange={(e) => setPermissions({ ...permissions, canExportData: e.target.checked })}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Ekspor File (.xlsx/PDF)</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={permissions.canApproveFinancials}
                  onChange={(e) => setPermissions({ ...permissions, canApproveFinancials: e.target.checked })}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Otorisasi Keuangan</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan & Beri Akses</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// SUB-COMPONENT: MODAL EDIT HAK AKSES PENGGUNA
// ==========================================
interface EditUserAccessModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedUser: User) => void;
}

const EditUserAccessModal: React.FC<EditUserAccessModalProps> = ({
  user,
  isOpen,
  onClose,
  onSave,
}) => {
  const [role, setRole] = useState<UserRole>(user.role);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [status, setStatus] = useState<'active' | 'suspended'>(user.status);
  const [password, setPassword] = useState(user.password || '');

  // Role specifics
  const [tambakLocation, setTambakLocation] = useState(user.tambakLocation || '');
  const [defaultTier, setDefaultTier] = useState<DiscountTier>(user.defaultTier || 8);
  const [bakulMarketArea, setBakulMarketArea] = useState(user.bakulMarketArea || '');
  const [creditLimit, setCreditLimit] = useState<number>(user.creditLimit || 50000000);
  const [shiftLocation, setShiftLocation] = useState(user.shiftLocation || '');

  // Permissions
  const [permissions, setPermissions] = useState<UserPermissions>(
    user.permissions || getDefaultPermissions(user.role)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: User = {
      ...user,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role,
      status,
      password: password.trim() || user.password || '123456',
      permissions,
      tambakLocation: role === 'petani' ? tambakLocation : undefined,
      defaultTier: role === 'petani' ? defaultTier : undefined,
      bakulMarketArea: role === 'bakul' ? bakulMarketArea : undefined,
      creditLimit: role === 'bakul' ? creditLimit : undefined,
      shiftLocation: role === 'karyawan' ? shiftLocation : undefined,
    };

    onSave(updated);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 my-8 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-800">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Ubah Hak Akses & Kapasitas Pengguna
              </h3>
              <p className="text-xs text-slate-500">ID Pengguna: {user.id}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Peran / Kapasitas Akun
              </label>
              <select
                value={role}
                onChange={(e) => {
                  const newR = e.target.value as UserRole;
                  setRole(newR);
                  setPermissions(getDefaultPermissions(newR));
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold bg-white focus:outline-hidden"
              >
                <option value="karyawan">Karyawan (Kasir Lapangan / Petugas Timbang)</option>
                <option value="petani">Petani Tambak (Penjual)</option>
                <option value="bakul">Bakul / Tengkulak (Pembeli)</option>
                <option value="manager">Manajer Keuangan (Approval & Laporan)</option>
                <option value="admin">Administrator Master</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Status Hak Akses Login
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className={`w-full px-3 py-2 text-xs border rounded-xl font-bold focus:outline-hidden ${
                  status === 'active'
                    ? 'border-emerald-300 text-emerald-800 bg-emerald-50'
                    : 'border-rose-300 text-rose-800 bg-rose-50'
                }`}
              >
                <option value="active">&#x2714; Aktif (Dapat Login & Beroperasi)</option>
                <option value="suspended">&#x2716; Ditangguhkan (Akses Diblokir)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Email / ID
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                No. Handphone / WA
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Reset Kata Sandi / PIN
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ketik sandi baru"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:outline-hidden"
              />
            </div>
          </div>

          {/* Conditional Role Inputs */}
          {role === 'petani' && (
            <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200 grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Lokasi Tambak Petani
                </label>
                <input
                  type="text"
                  value={tambakLocation}
                  onChange={(e) => setTambakLocation(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Tier Jasa Lelang
                </label>
                <select
                  value={defaultTier}
                  onChange={(e) => setDefaultTier(Number(e.target.value) as DiscountTier)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                >
                  <option value={8}>Tier 8% (Umum)</option>
                  <option value={6}>Tier 6% (Kemitraan)</option>
                  <option value={3}>Tier 3% (Binaan)</option>
                </select>
              </div>
            </div>
          )}

          {role === 'bakul' && (
            <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-200 grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Wilayah Pasar / Distribusi
                </label>
                <input
                  type="text"
                  value={bakulMarketArea}
                  onChange={(e) => setBakulMarketArea(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Limit Plafon Bidding (Rp)
                </label>
                <input
                  type="number"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {role === 'karyawan' && (
            <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-200 text-xs">
              <label className="font-semibold text-slate-700 block mb-1">
                Lokasi Meja Timbang Lapangan / Shift
              </label>
              <input
                type="text"
                value={shiftLocation}
                onChange={(e) => setShiftLocation(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden"
              />
            </div>
          )}

          {/* Granular Permissions */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Pengaturan Izin Modular:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={permissions.canInputWeighing}
                  onChange={(e) => setPermissions({ ...permissions, canInputWeighing: e.target.checked })}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Input Timbangan</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={permissions.canRunAuction}
                  onChange={(e) => setPermissions({ ...permissions, canRunAuction: e.target.checked })}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Operator Lelang</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={permissions.canPlaceBid}
                  onChange={(e) => setPermissions({ ...permissions, canPlaceBid: e.target.checked })}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Ajukan Penawaran</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={permissions.canViewReports}
                  onChange={(e) => setPermissions({ ...permissions, canViewReports: e.target.checked })}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Lihat Laporan H/B/T</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={permissions.canExportData}
                  onChange={(e) => setPermissions({ ...permissions, canExportData: e.target.checked })}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Ekspor File (.xlsx/PDF)</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={permissions.canApproveFinancials}
                  onChange={(e) => setPermissions({ ...permissions, canApproveFinancials: e.target.checked })}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Otorisasi Keuangan</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
