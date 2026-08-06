import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error';
  text: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => (
  <div className="fixed bottom-6 right-6 z-[100] space-y-2">
    {toasts.map(t => (
      <Toast key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
    ))}
  </div>
);

const Toast: React.FC<{ toast: ToastMessage; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-xs font-medium min-w-[260px] ${
      toast.type === 'success'
        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
    }`}>
      {toast.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
      <span className="flex-1">{toast.text}</span>
      <button onClick={onDismiss} className="text-slate-400 hover:text-slate-200"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
};
