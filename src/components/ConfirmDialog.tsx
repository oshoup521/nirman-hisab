import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, message, confirmText, onConfirm, onCancel }: ConfirmDialogProps) {
  useEscapeKey(open, onCancel);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog Card */}
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Warning stripe */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-400 to-red-600" />

        <div className="p-6">
          {/* Icon + Title */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            <p className="text-base font-bold text-slate-800">{title ?? 'Delete karna chahte hain?'}</p>
          </div>

          {/* Message */}
          <p className="text-sm text-slate-500 mb-6 pl-1">{message}</p>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={() => { onConfirm(); onCancel(); }}
              className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-600"
              autoFocus
            >
              {!confirmText && <Trash2 size={14} />}
              {confirmText ?? 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
