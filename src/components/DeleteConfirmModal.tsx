import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { TouchButton } from './TouchButton';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  itemIdentifier?: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title,
  itemIdentifier,
  message,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden p-6 text-center space-y-4">
        
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div>
          <h3 className="text-base font-bold text-white">{title}</h3>
          {itemIdentifier && (
            <p className="text-xs font-mono font-bold text-rose-400 mt-1 bg-rose-500/10 py-1 px-2.5 rounded-lg inline-block border border-rose-500/20">
              {itemIdentifier}
            </p>
          )}
          <p className="text-xs text-slate-400 mt-2">
            {message || 'Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.'}
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center gap-3">
          <TouchButton variant="secondary" size="md" onClick={onCancel}>
            Batal
          </TouchButton>
          <TouchButton
            variant="danger"
            size="md"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={onConfirm}
            showFingerIcon
          >
            Ya, Hapus Permanent
          </TouchButton>
        </div>

      </div>
    </div>
  );
};
