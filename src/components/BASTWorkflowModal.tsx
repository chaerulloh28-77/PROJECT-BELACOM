import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Send, 
  UserCheck, 
  FileCheck2, 
  DollarSign, 
  Sparkles,
  GitBranch,
  Calendar,
  Check
} from 'lucide-react';
import { BASTItem, BASTWorkflow } from '../types';
import { TouchButton } from './TouchButton';
import { evaluateBASTWorkflow, getDefaultBASTWorkflow, getStage1, getStage2, getStage3, getStage4 } from '../utils/bastWorkflowHelper';

interface BASTWorkflowModalProps {
  isOpen: boolean;
  bast: BASTItem | null;
  onClose: () => void;
  onSave: (bastId: string, updatedWorkflow: BASTWorkflow) => void;
}

export const BASTWorkflowModal: React.FC<BASTWorkflowModalProps> = ({
  isOpen,
  bast,
  onClose,
  onSave
}) => {
  if (!isOpen || !bast) return null;

  const initialWf = bast.workflow || getDefaultBASTWorkflow(bast.woNumber);
  const [workflow, setWorkflow] = useState<BASTWorkflow>(initialWf);
  const [activeTab, setActiveTab] = useState<1 | 2 | 3 | 4>(1);

  const todayStr = new Date().toISOString().substring(0, 10);
  const evaluation = evaluateBASTWorkflow({ ...bast, workflow });

  const stage1 = getStage1(workflow);
  const stage2 = getStage2(workflow);
  const stage3 = getStage3(workflow);
  const stage4 = getStage4(workflow);

  const handleStage1Change = (updates: Partial<typeof stage1>) => {
    setWorkflow(prev => {
      const current = getStage1(prev);
      const next = { ...current, ...updates };
      return {
        ...prev,
        stage1EmailUser: next,
        stage1EmailFmi: next,
        updatedAt: todayStr
      };
    });
  };

  const handleStage2Change = (updates: Partial<typeof stage2>) => {
    setWorkflow(prev => {
      const current = getStage2(prev);
      const next = { ...current, ...updates };
      return {
        ...prev,
        stage2AdminUser: next,
        stage2AdminFmi: next,
        updatedAt: todayStr
      };
    });
  };

  const handleStage3Change = (updates: Partial<typeof stage3>) => {
    setWorkflow(prev => {
      const current = getStage3(prev);
      const next = { ...current, ...updates };
      return {
        ...prev,
        stage3RoutingTtd: next,
        updatedAt: todayStr
      };
    });
  };

  const handleStage4Change = (updates: Partial<typeof stage4>) => {
    setWorkflow(prev => {
      const current = getStage4(prev);
      const next = { ...current, ...updates };
      return {
        ...prev,
        stage4Finance: next,
        updatedAt: todayStr
      };
    });
  };

  // Toggle stage completion checkboxes
  const handleToggleStage1Completion = (checked: boolean) => {
    handleStage1Change({
      isCompleted: checked,
      status: checked ? 'Selesai' : 'Pending',
      tanggalKirim: checked && !stage1.tanggalKirim ? todayStr : stage1.tanggalKirim,
      emailSentDate: checked && !stage1.emailSentDate ? todayStr : stage1.emailSentDate,
      emailSubject: stage1.emailSubject || `Pengiriman BAST ${bast.woNumber} - PT Belacom`
    });
  };

  const handleToggleStage2Completion = (checked: boolean) => {
    handleStage2Change({
      isCompleted: checked,
      status: checked ? 'Approved' : 'Menunggu Pengecekan',
      checkedDate: checked && !stage2.checkedDate ? todayStr : stage2.checkedDate,
      adminName: stage2.adminName || 'Admin User'
    });
  };

  const handleToggleStage3Completion = (checked: boolean) => {
    handleStage3Change({
      isCompleted: checked,
      status: checked ? 'Selesai TTD' : 'In Progress',
      signedDate: checked && !stage3.signedDate ? todayStr : stage3.signedDate,
      approverNames: stage3.approverNames || 'Pimpinan / Approver User'
    });
  };

  const handleToggleStage4Completion = (checked: boolean) => {
    handleStage4Change({
      isCompleted: checked,
      status: checked ? 'Siap Invoice' : 'Diterima Finance',
      tanggalMasukFinance: checked && !stage4.tanggalMasukFinance ? todayStr : stage4.tanggalMasukFinance,
      receivedDate: checked && !stage4.receivedDate ? todayStr : stage4.receivedDate,
      financeRefNumber: stage4.financeRefNumber || `FIN-${bast.woNumber.replace(/[^0-9]/g, '').slice(-4) || '2026'}`
    });
  };

  const handleQuickAdvance = (targetStage: 1 | 2 | 3 | 4) => {
    if (targetStage === 1) {
      handleToggleStage1Completion(true);
      setActiveTab(2);
    } else if (targetStage === 2) {
      handleToggleStage2Completion(true);
      setActiveTab(3);
    } else if (targetStage === 3) {
      handleToggleStage3Completion(true);
      setActiveTab(4);
    } else if (targetStage === 4) {
      handleToggleStage4Completion(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(bast.id, workflow);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Sub Routing Workflow BAST</h3>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/80 font-bold">
                  {bast.woNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Alur 4 Tahap Berurutan: 1. Email User ➔ 2. Admin User ➔ 3. Routing TTD ➔ 4. Finance
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Progress Bar Overview */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span>Status Alur:</span>
              <strong className="text-cyan-300">{evaluation.currentStageTitle}</strong>
            </span>
            <span className="font-bold text-emerald-400">{evaluation.percent}% Selesai</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
            <div
              className={`h-full transition-all duration-300 ${
                evaluation.isAllCompleted
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-500'
              }`}
              style={{ width: `${Math.max(8, evaluation.percent)}%` }}
            />
          </div>

          {/* Stage Buttons / Stepper Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {evaluation.stages.map((stage) => {
              const isActive = activeTab === stage.stageNumber;
              return (
                <button
                  key={stage.stageNumber}
                  type="button"
                  onClick={() => setActiveTab(stage.stageNumber)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isActive
                      ? 'bg-slate-800 border-cyan-500 shadow-md ring-1 ring-cyan-500/50'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                      {stage.isCompleted ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : null}
                      Tahap {stage.stageNumber}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${stage.badgeBg} ${stage.badgeText} ${stage.badgeBorder}`}
                    >
                      {stage.badgeLabel}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-white truncate">
                    {stage.title.replace(/^\d+\.\s*/, '')}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Form Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* TAHAP 1: EMAIL KE USER */}
          {activeTab === 1 && (
            <div className="space-y-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800 animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase font-mono">
                  <Send className="w-4 h-4" />
                  <span>Tahap 1: BAST (Dokumen Lengkap) Diemail ke User</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickAdvance(1)}
                  className="px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-800 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tandai Selesai &amp; Lanjut</span>
                </button>
              </div>

              {/* Checkbox: User dapat mencentang tahap yang sudah selesai */}
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 cursor-pointer hover:border-cyan-500/50 transition-colors select-none">
                <input
                  type="checkbox"
                  checked={Boolean(stage1.isCompleted || stage1.status === 'Selesai' || stage1.status === 'Sent')}
                  onChange={(e) => handleToggleStage1Completion(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-400 bg-slate-950 cursor-pointer accent-emerald-500"
                />
                <div>
                  <span className="text-xs font-bold text-white block">
                    Tahap 1 Selesai: Dokumen BAST lengkap sudah diemail ke User
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Centang untuk menyelesaikan Tahap 1 dan mengaktifkan tahap berikutnya
                  </span>
                </div>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Status Pengiriman Email</label>
                  <select
                    value={stage1.status || 'Pending'}
                    onChange={(e) =>
                      handleStage1Change({ status: e.target.value as 'Pending' | 'Selesai' | 'Sent' })
                    }
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl p-2.5 outline-none font-mono focus:border-cyan-500"
                  >
                    <option value="Pending">Pending (Belum Diemail)</option>
                    <option value="Selesai">Selesai (Sudah Dikirim ke User)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold">Tanggal Kirim Email</label>
                    <button
                      type="button"
                      onClick={() => handleStage1Change({ tanggalKirim: todayStr, emailSentDate: todayStr })}
                      className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                    >
                      + Hari Ini
                    </button>
                  </div>
                  <input
                    type="date"
                    value={stage1.tanggalKirim || stage1.emailSentDate || ''}
                    onChange={(e) => handleStage1Change({ tanggalKirim: e.target.value, emailSentDate: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl p-2.5 outline-none font-mono focus:border-cyan-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-300 block mb-1 font-semibold">Subjek Email / Nomor Surat Pengantar</label>
                  <input
                    type="text"
                    value={stage1.emailSubject || ''}
                    onChange={(e) => handleStage1Change({ emailSubject: e.target.value })}
                    placeholder="Contoh: Pengiriman Berkas BAST WO-BEL-2026-0082 - PT Belacom ke User"
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl p-2.5 outline-none font-mono focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Nomor Referensi Email</label>
                  <input
                    type="text"
                    value={stage1.emailNumber || ''}
                    onChange={(e) => handleStage1Change({ emailNumber: e.target.value })}
                    placeholder="Contoh: MAIL-USR-2026/10/082"
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl p-2.5 outline-none font-mono focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Catatan Ringkas</label>
                  <input
                    type="text"
                    value={stage1.notes || ''}
                    onChange={(e) => handleStage1Change({ notes: e.target.value })}
                    placeholder="Contoh: Berkas PDF lengkap 5 lampiran telah diemail ke User"
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl p-2.5 outline-none font-mono focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAHAP 2: ADMIN USER */}
          {activeTab === 2 && (
            <div className="space-y-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800 animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase font-mono">
                  <UserCheck className="w-4 h-4" />
                  <span>Tahap 2: Pengecekan Admin User</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickAdvance(2)}
                  className="px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-800 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Set Approved &amp; Lanjut</span>
                </button>
              </div>

              {/* Checkbox: User dapat mencentang tahap yang sudah selesai */}
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 cursor-pointer hover:border-cyan-500/50 transition-colors select-none">
                <input
                  type="checkbox"
                  checked={Boolean(stage2.isCompleted || stage2.status === 'Approved')}
                  onChange={(e) => handleToggleStage2Completion(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-400 bg-slate-950 cursor-pointer accent-emerald-500"
                />
                <div>
                  <span className="text-xs font-bold text-white block">
                    Tahap 2 Selesai: Pengecekan admin User telah disetujui (Approved)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Centang jika dokumen telah diperiksa dan disetujui oleh admin User
                  </span>
                </div>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Status Pengecekan Admin User</label>
                  <select
                    value={stage2.status || 'Menunggu Pengecekan'}
                    onChange={(e) =>
                      handleStage2Change({
                        status: e.target.value as 'Menunggu Pengecekan' | 'Approved' | 'Ada Catatan Revisi',
                        isCompleted: e.target.value === 'Approved'
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl p-2.5 outline-none font-mono focus:border-cyan-500"
                  >
                    <option value="Menunggu Pengecekan">Menunggu Pengecekan</option>
                    <option value="Approved">Approved (Dokumen Valid &amp; Lengkap)</option>
                    <option value="Ada Catatan Revisi">Ada Catatan Revisi (Perlu Koreksi)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Nama Admin User</label>
                  <input
                    type="text"
                    value={stage2.adminName || ''}
                    onChange={(e) => handleStage2Change({ adminName: e.target.value })}
                    placeholder="Contoh: Sarah / Admin User"
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl p-2.5 outline-none font-mono focus:border-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold">Tanggal Pengecekan</label>
                    <button
                      type="button"
                      onClick={() => handleStage2Change({ checkedDate: todayStr })}
                      className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                    >
                      + Hari Ini
                    </button>
                  </div>
                  <input
                    type="date"
                    value={stage2.checkedDate || ''}
                    onChange={(e) => handleStage2Change({ checkedDate: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl p-2.5 outline-none font-mono focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Catatan Ringkas / Revisi</label>
                  <input
                    type="text"
                    value={stage2.notes || ''}
                    onChange={(e) => handleStage2Change({ notes: e.target.value })}
                    placeholder="Contoh: Seluruh berkas teknis dan lampiran telah sesuai"
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl p-2.5 outline-none font-mono focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAHAP 3: ROUTING TTD USER */}
          {activeTab === 3 && (
            <div className="space-y-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800 animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase font-mono">
                  <FileCheck2 className="w-4 h-4" />
                  <span>Tahap 3: Proses Routing TTD User</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickAdvance(3)}
                  className="px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-800 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Set Selesai TTD &amp; Lanjut</span>
                </button>
              </div>

              {/* Checkbox: User dapat mencentang tahap yang sudah selesai */}
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 cursor-pointer hover:border-cyan-500/50 transition-colors select-none">
                <input
                  type="checkbox"
                  checked={Boolean(stage3.isCompleted || stage3.status === 'Selesai TTD')}
                  onChange={(e) => handleToggleStage3Completion(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-400 bg-slate-950 cursor-pointer accent-emerald-500"
                />
                <div>
                  <span className="text-xs font-bold text-white block">
                    Tahap 3 Selesai: Tanda tangan approver User lengkap
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Centang jika proses routing tanda tangan pejabat/approver User telah selesai
                  </span>
                </div>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Status Routing TTD</label>
                  <select
                    value={stage3.status || 'Menunggu TTD'}
                    onChange={(e) =>
                      handleStage3Change({
                        status: e.target.value as 'Menunggu TTD' | 'In Progress' | 'Selesai TTD',
                        isCompleted: e.target.value === 'Selesai TTD'
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl p-2.5 outline-none font-mono focus:border-cyan-500"
                  >
                    <option value="Menunggu TTD">Menunggu TTD (Antre Approver)</option>
                    <option value="In Progress">In Progress (Sirkulasi TTD Sedang Berjalan)</option>
                    <option value="Selesai TTD">Selesai TTD (Tanda Tangan Lengkap)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Nama Approver User</label>
                  <input
                    type="text"
                    value={stage3.approverNames || ''}
                    onChange={(e) => handleStage3Change({ approverNames: e.target.value })}
                    placeholder="Contoh: Bpk. Hendra (PM) & Bpk. Bambang (GM Ops)"
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl p-2.5 outline-none font-mono focus:border-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold">Tanggal Selesai TTD</label>
                    <button
                      type="button"
                      onClick={() => handleStage3Change({ signedDate: todayStr })}
                      className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                    >
                      + Hari Ini
                    </button>
                  </div>
                  <input
                    type="date"
                    value={stage3.signedDate || ''}
                    onChange={(e) => handleStage3Change({ signedDate: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl p-2.5 outline-none font-mono focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Catatan Ringkas</label>
                  <input
                    type="text"
                    value={stage3.notes || ''}
                    onChange={(e) => handleStage3Change({ notes: e.target.value })}
                    placeholder="Contoh: Ditandatangani basah / digital lengkap oleh para pejabat"
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl p-2.5 outline-none font-mono focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAHAP 4: MASUK KE FINANCE */}
          {activeTab === 4 && (
            <div className="space-y-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800 animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase font-mono">
                  <DollarSign className="w-4 h-4" />
                  <span>Tahap 4: Masuk ke Finance</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickAdvance(4)}
                  className="px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-800 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Set Siap Invoice</span>
                </button>
              </div>

              {/* Checkbox: User dapat mencentang tahap yang sudah selesai */}
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 cursor-pointer hover:border-cyan-500/50 transition-colors select-none">
                <input
                  type="checkbox"
                  checked={Boolean(stage4.isCompleted || stage4.status === 'Siap Invoice')}
                  onChange={(e) => handleToggleStage4Completion(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-400 bg-slate-950 cursor-pointer accent-emerald-500"
                />
                <div>
                  <span className="text-xs font-bold text-white block">
                    Tahap 4 Selesai: Dokumen diterima finance &amp; siap diterbitkan invoice
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Centang jika berkas sudah diterima finance dan siap dibuatkan tagihan (100% Selesai)
                  </span>
                </div>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Status Finance</label>
                  <select
                    value={stage4.status || 'Menunggu Finance'}
                    onChange={(e) =>
                      handleStage4Change({
                        status: e.target.value as 'Menunggu Finance' | 'Diterima Finance' | 'Siap Invoice',
                        isCompleted: e.target.value === 'Siap Invoice'
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl p-2.5 outline-none font-mono focus:border-cyan-500"
                  >
                    <option value="Menunggu Finance">Menunggu Finance</option>
                    <option value="Diterima Finance">Diterima Finance</option>
                    <option value="Siap Invoice">Siap Invoice (Dapat Dibuatkan Tagihan)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold">Tanggal Masuk Finance</label>
                    <button
                      type="button"
                      onClick={() => handleStage4Change({ tanggalMasukFinance: todayStr, receivedDate: todayStr })}
                      className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                    >
                      + Hari Ini
                    </button>
                  </div>
                  <input
                    type="date"
                    value={stage4.tanggalMasukFinance || stage4.receivedDate || ''}
                    onChange={(e) => handleStage4Change({ tanggalMasukFinance: e.target.value, receivedDate: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl p-2.5 outline-none font-mono focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Nomor Referensi Finance</label>
                  <input
                    type="text"
                    value={stage4.financeRefNumber || ''}
                    onChange={(e) => handleStage4Change({ financeRefNumber: e.target.value })}
                    placeholder="Contoh: FIN-USR-2026/0912"
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl p-2.5 outline-none font-mono focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Catatan Ringkas Finance</label>
                  <input
                    type="text"
                    value={stage4.notes || ''}
                    onChange={(e) => handleStage4Change({ notes: e.target.value })}
                    placeholder="Contoh: Berkas telah diverifikasi tim finance, siap dibuatkan invoice"
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl p-2.5 outline-none font-mono focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Quick Summary Card */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-mono">Progress:</span>
              <span className="font-mono font-bold text-cyan-300">
                Tahap {evaluation.currentStageNumber > 4 ? 'Selesai' : `${evaluation.currentStageNumber} dari 4`}
              </span>
            </div>
            <div className="text-slate-400 font-mono text-[11px]">
              Terakhir Diperbarui: <span className="text-slate-200">{workflow.updatedAt || todayStr}</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <TouchButton variant="secondary" size="md" type="button" onClick={onClose}>
              Batal
            </TouchButton>
            <TouchButton variant="primary" size="md" type="submit" showFingerIcon>
              Simpan Perubahan Routing
            </TouchButton>
          </div>
        </form>

      </div>
    </div>
  );
};
