import React, { useState, useEffect } from 'react';
import { 
  UserCog, 
  ShieldCheck, 
  User, 
  Mail, 
  KeyRound, 
  Lock, 
  Eye, 
  EyeOff, 
  Save, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  ShieldAlert, 
  Sparkles, 
  BadgeCheck, 
  Briefcase, 
  MapPin, 
  Trash2, 
  X,
  Clock
} from 'lucide-react';
import { useProjectContext } from '../context/ProjectContext';
import { SystemUser, TeamItem } from '../types';

export const UserSettingsPage: React.FC = () => {
  const { 
    userProfile, 
    updateUserProfile, 
    updatePassword, 
    systemUsers, 
    addSystemUser, 
    deleteSystemUser,
    teams,
    addTeam,
    updateTeam,
    deleteTeam
  } = useProjectContext();

  // Profile Form State
  const [fullName, setFullName] = useState(userProfile.fullName || 'Administrator Utama');
  const [email, setEmail] = useState('');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');

  // Add User Modal State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'Pengawas Lapangan' | 'Staff Administrasi' | 'Koordinator Operasional' | 'Super Admin'>('Pengawas Lapangan');
  const [newUserArea, setNewUserArea] = useState('Jabo 1');
  const [modalError, setModalError] = useState('');

  // Team CRUD Modal State
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamNameInput, setTeamNameInput] = useState('');
  const [teamPicInput, setTeamPicInput] = useState('');
  const [teamPhoneInput, setTeamPhoneInput] = useState('');
  const [teamAreaInput, setTeamAreaInput] = useState('Jabo 1');
  const [teamModalError, setTeamModalError] = useState('');

  // Sync state if userProfile changes
  useEffect(() => {
    setFullName(userProfile.fullName || 'Administrator Utama');
  }, [userProfile]);

  // Handle Profile Save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg('');
    setProfileErrorMsg('');

    if (!fullName.trim()) {
      setProfileErrorMsg('Nama lengkap tidak boleh kosong.');
      return;
    }
    if (email.trim() && !email.includes('@')) {
      setProfileErrorMsg('Format email tidak valid. Harap masukkan format email yang benar.');
      return;
    }

    updateUserProfile({
      fullName: fullName.trim(),
      email: email.trim()
    });

    setProfileSuccessMsg('Perubahan profil berhasil disimpan!');
    setTimeout(() => {
      setProfileSuccessMsg('');
    }, 4000);
  };

  // Handle Password Update
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccessMsg('');
    setPasswordErrorMsg('');

    if (!currentPassword) {
      setPasswordErrorMsg('Silakan masukkan password saat ini.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setPasswordErrorMsg('Password baru harus minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('Konfirmasi password tidak cocok dengan password baru.');
      return;
    }

    const res = updatePassword(currentPassword, newPassword);
    if (res.success) {
      setPasswordSuccessMsg('Password berhasil diperbarui dan telah aktif!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPasswordSuccessMsg('');
      }, 4000);
    } else {
      setPasswordErrorMsg(res.message);
    }
  };

  // Handle Add New User
  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    if (!newUserName.trim()) {
      setModalError('Nama lengkap pengguna wajib diisi.');
      return;
    }
    if (!newUserUsername.trim()) {
      setModalError('Username wajib diisi.');
      return;
    }
    if (!newUserEmail.trim() || !newUserEmail.includes('@')) {
      setModalError('Format email tidak valid.');
      return;
    }

    // Check duplicate username
    if (systemUsers.some(u => u.username.toLowerCase() === newUserUsername.trim().toLowerCase())) {
      setModalError('Username sudah terdaftar dalam sistem.');
      return;
    }

    addSystemUser({
      username: newUserUsername.trim().toLowerCase(),
      fullName: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      area: newUserRole === 'Pengawas Lapangan' ? newUserArea : 'HQ Belacom',
      status: 'Aktif',
      lastLogin: 'Belum pernah login'
    });

    // Reset & close
    setNewUserName('');
    setNewUserUsername('');
    setNewUserEmail('');
    setNewUserRole('Pengawas Lapangan');
    setNewUserArea('Jabo 1');
    setIsAddUserModalOpen(false);
  };

  const handleTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTeamModalError('');

    if (!teamNameInput.trim()) {
      setTeamModalError('Nama Team wajib diisi.');
      return;
    }
    if (!teamPicInput.trim()) {
      setTeamModalError('Nama PIC / Teknisi wajib diisi.');
      return;
    }
    if (!teamPhoneInput.trim()) {
      setTeamModalError('Nomor Telepon wajib diisi.');
      return;
    }

    if (editingTeamId) {
      updateTeam(editingTeamId, {
        teamName: teamNameInput.trim(),
        pic: teamPicInput.trim(),
        phone: teamPhoneInput.trim(),
        area: teamAreaInput
      });
    } else {
      addTeam({
        teamName: teamNameInput.trim(),
        pic: teamPicInput.trim(),
        phone: teamPhoneInput.trim(),
        area: teamAreaInput
      });
    }

    // Reset & close
    setTeamNameInput('');
    setTeamPicInput('');
    setTeamPhoneInput('');
    setTeamAreaInput('Jabo 1');
    setEditingTeamId(null);
    setIsTeamModalOpen(false);
  };

  const openAddTeamModal = () => {
    setEditingTeamId(null);
    setTeamNameInput('');
    setTeamPicInput('');
    setTeamPhoneInput('');
    setTeamAreaInput('Jabo 1');
    setTeamModalError('');
    setIsTeamModalOpen(true);
  };

  const openEditTeamModal = (team: TeamItem) => {
    setEditingTeamId(team.id);
    setTeamNameInput(team.teamName);
    setTeamPicInput(team.pic);
    setTeamPhoneInput(team.phone);
    setTeamAreaInput(team.area || 'Jabo 1');
    setTeamModalError('');
    setIsTeamModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      
      {/* 1. BANNER HEADER HALAMAN */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950/80 border border-slate-800 p-6 sm:p-7 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-blue-600/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner">
                <UserCog className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
                Menu Setting
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed pl-0.5">
              Kelola profil administrator, peran pengawas lapangan, serta otorisasi hak akses sistem
            </p>
          </div>

          {/* Button "+ Tambah Pengguna" (warna biru/cyan bercahaya) */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsAddUserModalOpen(true)}
              className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-cyan-500 via-cyan-600 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/30 border border-cyan-400/40 hover:shadow-cyan-500/50 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-cyan-100" />
              <span>+ Tambah Pengguna</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. STRUKTUR DUA KAD UTAMA (GRID 2 KOLUM) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* KAD KIRI: "PROFIL AKUN AKTIF" */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
          {/* Card Header with Super Admin Badge */}
          <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <User className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                PROFIL AKUN AKTIF
              </h3>
            </div>
            {/* Lencana "Super Admin" */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              Super Admin
            </span>
          </div>

          {/* Card Body */}
          <form onSubmit={handleSaveProfile} className="p-5 sm:p-6 space-y-5 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              
              {/* Username (ID Sistem): Non-editable with note */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Username (ID Sistem)</span>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                    Sistem ID
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={userProfile.username || 'admin'}
                    disabled
                    readOnly
                    className="w-full bg-slate-950/80 border border-slate-800 text-slate-400 text-sm font-mono rounded-xl px-3.5 py-2.5 cursor-not-allowed select-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <BadgeCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 italic flex items-center gap-1">
                  * Username utama sistem tidak dapat diganti
                </p>
              </div>

              {/* Nama Lengkap: Editable input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Contoh: Administrator Utama"
                    className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-500 text-sm text-slate-100 rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all duration-200 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* Email Resmi / Pribadi: Editable with note */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Email Resmi / Pribadi
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Contoh: nama@gmail.com, user@yahoo.com (Bisa dikosongkan)"
                    className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-500 text-sm text-slate-100 font-mono rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all duration-200 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Bebas diisi email pribadi (@gmail.com, @yahoo.com, dll) atau email dinas
                </p>
              </div>

              {/* Feedback messages */}
              {profileSuccessMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-300 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}
              {profileErrorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-300 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{profileErrorMsg}</span>
                </div>
              )}

            </div>

            {/* Action button: "Simpan Perubahan Profil" (butang biru) */}
            <div className="pt-4 border-t border-slate-800/80 mt-6">
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-500 active:scale-95 shadow-lg shadow-blue-600/30 border border-blue-400/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan Profil</span>
              </button>
            </div>
          </form>
        </div>

        {/* KAD KANAN: "GANTI PASSWORD" */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
          {/* Card Header with Kredensial Sesi Badge */}
          <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <KeyRound className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                GANTI PASSWORD
              </h3>
            </div>
            {/* Lencana "Kredensial Sesi" */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              Kredensial Sesi
            </span>
          </div>

          {/* Card Body */}
          <form onSubmit={handleUpdatePassword} className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              
              {/* Password Saat Ini */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Password Saat Ini
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Masukkan password saat ini..."
                    className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-500 text-sm text-slate-100 font-mono rounded-xl pl-10 pr-10 py-2.5 outline-none transition-all duration-200 focus:ring-1 focus:ring-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Baru */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Password Baru
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter..."
                    className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-500 text-sm text-slate-100 font-mono rounded-xl pl-10 pr-10 py-2.5 outline-none transition-all duration-200 focus:ring-1 focus:ring-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Konfirmasi Password Baru */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Konfirmasi Password Baru
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru..."
                    className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-500 text-sm text-slate-100 font-mono rounded-xl pl-10 pr-10 py-2.5 outline-none transition-all duration-200 focus:ring-1 focus:ring-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Feedback messages */}
              {passwordSuccessMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-300 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{passwordSuccessMsg}</span>
                </div>
              )}
              {passwordErrorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-300 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{passwordErrorMsg}</span>
                </div>
              )}

            </div>

            {/* Action button: "Perbarui Password" */}
            <div className="pt-4 border-t border-slate-800/80 mt-6">
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-95 shadow-lg shadow-cyan-900/40 border border-cyan-400/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>Perbarui Password</span>
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* 3. DAFTAR PENGGUNA & HAK AKSES SISTEM (Tabel Otorisasi Pengawas Lapangan & Admin) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                Daftar Pengguna & Otorisasi Hak Akses Sistem
              </h3>
              <p className="text-[11px] text-slate-400">
                Total {systemUsers.length} akun administrator terdaftar
              </p>
            </div>
          </div>

          <span className="text-[11px] font-mono text-cyan-400 px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-800/40 self-start sm:self-auto">
            Role-Based Access Control (RBAC)
          </span>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold font-mono">
                <th className="py-3 px-4">Pengguna / Nama</th>
                <th className="py-3 px-4">Username & Email</th>
                <th className="py-3 px-4">Peran (Role)</th>
                <th className="py-3 px-4">Area Penugasan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Aktivitas Terakhir</th>
                <th className="py-3 px-4 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {systemUsers.map((user) => {
                const isSuperAdmin = user.role.toLowerCase().includes('super') || user.username === 'admindsb' || user.username === 'adminbelacom' || user.username === 'admin';
                return (
                  <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSuperAdmin 
                            ? 'bg-gradient-to-tr from-amber-500 to-orange-600 text-slate-950 shadow-sm'
                            : 'bg-gradient-to-tr from-slate-800 to-slate-700 text-cyan-300 border border-slate-700'
                        }`}>
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-200">
                            {user.fullName}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            ID: {user.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Username & Email */}
                    <td className="py-3.5 px-4">
                      <p className="font-mono text-cyan-300 font-medium">@{user.username}</p>
                      <p className="text-slate-400 text-[11px] font-mono">{user.email}</p>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        isSuperAdmin
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : user.role.includes('Pengawas')
                            ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                            : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                      }`}>
                        {isSuperAdmin ? <ShieldCheck className="w-3 h-3 text-amber-400" /> : <Briefcase className="w-3 h-3" />}
                        {user.role}
                      </span>
                    </td>

                    {/* Area */}
                    <td className="py-3.5 px-4 text-slate-300">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{user.area || 'Semua Area'}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        {user.status}
                      </span>
                    </td>

                    {/* Last Login */}
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{user.lastLogin}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      {user.id === 'usr-1' || isSuperAdmin ? (
                        <span className="px-2 py-1 bg-slate-800 text-slate-400 rounded-lg text-[10px] font-mono font-semibold">
                          Protected
                        </span>
                      ) : (
                        <button 
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Yakin ingin menghapus akun ${user.fullName} (@${user.username})?`)) {
                              deleteSystemUser(user.id);
                            }
                          }}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer mx-auto shadow-sm"
                          title="Hapus Akun Pengguna"
                        >
                          <span>🗑️ Hapus</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. DAFTAR TEAM PELAKSANA (CRUD LENGKAP: NAMA TEAM, PIC/TEKNISI, NO. TELP) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mt-8">
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                Daftar Team Pelaksana & Teknisi Lapangan
              </h3>
              <p className="text-[11px] text-slate-400">
                Total {teams.length} team operasional terdaftar (Input, Edit, Hapus, Simpan)
              </p>
            </div>
          </div>

          <button
            onClick={openAddTeamModal}
            className="px-4 py-2 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-950/50 border border-emerald-400/30 flex items-center gap-2 cursor-pointer transition-all self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Tambah Team Baru</span>
          </button>
        </div>

        {/* Team Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold font-mono">
                <th className="py-3 px-4">Nama Team</th>
                <th className="py-3 px-4">PIC / Teknisi Lapangan</th>
                <th className="py-3 px-4">Nomor Telepon (WhatsApp)</th>
                <th className="py-3 px-4">Area Penugasan</th>
                <th className="py-3 px-4 text-center">Tindakan (CRUD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {teams.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-cyan-300 font-mono flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    {t.teamName}
                  </td>
                  <td className="py-3.5 px-4 text-slate-200 font-medium">{t.pic}</td>
                  <td className="py-3.5 px-4 text-slate-300 font-mono">{t.phone}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      {t.area || 'Jabo 1'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditTeamModal(t)}
                        className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-white border border-cyan-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                        title="Edit Team"
                      >
                        <span>✏️ Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Yakin ingin menghapus team ${t.teamName} (${t.pic})?`)) {
                            deleteTeam(t.id);
                          }
                        }}
                        className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                        title="Hapus Team"
                      >
                        <span>🗑️ Hapus</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MODAL TAMBAH PENGGUNA */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddUserModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-tight">
                  Tambah Pengguna Baru
                </h3>
                <p className="text-xs text-slate-400">
                  Daftarkan akun pengawas lapangan atau staf administrasi baru
                </p>
              </div>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddUserSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Contoh: Pratama Wicaksana"
                  className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-500 text-sm text-slate-100 rounded-xl px-3.5 py-2.5 outline-none transition-all focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Username (ID Sistem)
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserUsername}
                    onChange={(e) => setNewUserUsername(e.target.value)}
                    placeholder="supv_jabo_baru"
                    className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-500 text-sm text-slate-100 font-mono rounded-xl px-3.5 py-2.5 outline-none transition-all focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="nama@gmail.com"
                    className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-500 text-sm text-slate-100 font-mono rounded-xl px-3.5 py-2.5 outline-none transition-all focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Peran (Role Akses)
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e: any) => setNewUserRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-500 text-sm text-slate-100 rounded-xl px-3 py-2.5 outline-none transition-all focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="Pengawas Lapangan">Pengawas Lapangan</option>
                    <option value="Koordinator Operasional">Koordinator Operasional</option>
                    <option value="Staff Administrasi">Staff Administrasi</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Area Wilayah Penugasan
                  </label>
                  <select
                    value={newUserArea}
                    onChange={(e) => setNewUserArea(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-500 text-sm text-slate-100 rounded-xl px-3 py-2.5 outline-none transition-all focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="Jabo 1">Jabo 1</option>
                    <option value="Jabo 2">Jabo 2</option>
                    <option value="Jabo 3">Jabo 3</option>
                    <option value="Semua Area (HQ)">Semua Area (HQ)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-950/60 border border-cyan-400/40 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Tambahkan Pengguna</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL TAMBAH / EDIT TEAM PELAKSANA */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsTeamModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-tight">
                  {editingTeamId ? 'Edit Team Pelaksana' : 'Tambah Team Baru'}
                </h3>
                <p className="text-xs text-slate-400">
                  Kelola nama team, PIC/teknisi, dan nomor telepon
                </p>
              </div>
            </div>

            {teamModalError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{teamModalError}</span>
              </div>
            )}

            <form onSubmit={handleTeamSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nama Team
                </label>
                <input
                  type="text"
                  required
                  value={teamNameInput}
                  onChange={(e) => setTeamNameInput(e.target.value)}
                  placeholder="Contoh: ABR 13 / Team Alpha"
                  className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-500 text-sm text-slate-100 font-mono rounded-xl px-3.5 py-2.5 outline-none transition-all focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  PIC / Teknisi Utama
                </label>
                <input
                  type="text"
                  required
                  value={teamPicInput}
                  onChange={(e) => setTeamPicInput(e.target.value)}
                  placeholder="Contoh: Rudi Lapangan"
                  className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-500 text-sm text-slate-100 rounded-xl px-3.5 py-2.5 outline-none transition-all focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nomor Telepon (WhatsApp)
                </label>
                <input
                  type="text"
                  required
                  value={teamPhoneInput}
                  onChange={(e) => setTeamPhoneInput(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-500 text-sm text-slate-100 font-mono rounded-xl px-3.5 py-2.5 outline-none transition-all focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Area Wilayah Penugasan
                </label>
                <select
                  value={teamAreaInput}
                  onChange={(e) => setTeamAreaInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-500 text-sm text-slate-100 rounded-xl px-3 py-2.5 outline-none transition-all focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="Jabo 1">Jabo 1</option>
                  <option value="Jabo 2">Jabo 2</option>
                  <option value="Jabo 3">Jabo 3</option>
                  <option value="HQ / Nasional">HQ / Nasional</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setIsTeamModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-950/60 border border-emerald-400/40 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingTeamId ? 'Simpan Perubahan' : 'Simpan Team Baru'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
