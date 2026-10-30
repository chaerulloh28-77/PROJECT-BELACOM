import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Radio
} from 'lucide-react';
import { useProjectContext } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { TouchButton } from '../components/TouchButton';

export const LoginPage: React.FC = () => {
  const { login: projectContextLogin } = useProjectContext();
  const { login: authContextLogin } = useAuth();

  // Inputs are empty by default as requested
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMsg('Silakan masukkan Username!');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Silakan masukkan Password!');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      // 1. Trigger AuthContext login (sends immediate non-blocking email to chaerulloh28@gmail.com & persists session)
      const authRes = await authContextLogin(username, password, true);
      
      // 2. Trigger ProjectContext login for app state
      if (projectContextLogin) {
        await projectContextLogin(username, password);
      }

      if (!authRes.success) {
        setErrorMsg(authRes.errorMsg || 'Kredensial tidak sesuai! Silakan periksa kembali.');
      }
    } catch {
      setErrorMsg('Terjadi kesalahan saat otentikasi. Silakan periksa kembali kredensial Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden selection:bg-cyan-500 selection:text-white">
      
      {/* Background Radial Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-600/15 blur-3xl rounded-full pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-600/10 blur-3xl rounded-full pointer-events-none"></div>

      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6">
        
        {/* Header Logo */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 p-0.5 shadow-lg shadow-cyan-900/40">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-cyan-400">
              <Radio className="w-8 h-8 animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider font-mono">
              BELACOM PROJECT
            </h1>
            <p className="text-xs text-slate-400 font-sans mt-1">
              Sistem Otentikasi Akses Terbatas System Admin
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Username field - empty by default */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              Username
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-sm text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all focus:ring-1 focus:ring-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Password field - empty by default */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-sm text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-10 py-2.5 outline-none transition-all focus:ring-1 focus:ring-cyan-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <TouchButton
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting}
            className="w-full font-bold"
            icon={<ShieldCheck className="w-5 h-5" />}
            showFingerIcon
          >
            {isSubmitting ? 'Memproses Otentikasi...' : 'Masuk ke System'}
          </TouchButton>

        </form>

        {/* Footer info note matching the screenshot */}
        <div className="mt-8 pt-4 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500 font-mono">
            Controlling Belacom Project © 2026 · Real-Time Auto-Save Enabled
          </p>
        </div>

      </div>
    </div>
  );
};
