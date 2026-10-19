import React from 'react';
import { CheckCircle2, AlertCircle, Trash2, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto p-3.5 rounded-2xl border shadow-2xl flex items-start justify-between gap-3 transition-all duration-300 animate-slideUp ${
            toast.type === 'success'
              ? 'bg-slate-900/95 border-emerald-500/40 text-slate-100 shadow-emerald-950/30'
              : toast.type === 'error'
              ? 'bg-slate-900/95 border-rose-500/40 text-slate-100 shadow-rose-950/30'
              : 'bg-slate-900/95 border-cyan-500/40 text-slate-100 shadow-cyan-950/30'
          }`}
        >
          <div className="flex items-start gap-2.5">
            <div className={`p-1.5 rounded-xl shrink-0 ${
              toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
              toast.type === 'error' ? 'bg-rose-500/10 text-rose-400' :
              'bg-cyan-500/10 text-cyan-400'
            }`}>
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
              {toast.type === 'error' && <Trash2 className="w-5 h-5" />}
              {toast.type === 'info' && <AlertCircle className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">{toast.title}</h4>
              {toast.message && (
                <p className="text-[11px] text-slate-400 mt-0.5">{toast.message}</p>
              )}
            </div>
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="p-1 text-slate-500 hover:text-slate-300 rounded-lg shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
