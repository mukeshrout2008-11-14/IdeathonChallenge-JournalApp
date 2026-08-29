import React from 'react';
import { ToastMessage } from '../types';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-md w-full px-4 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          id={`toast-${toast.id}`}
          className={`flex items-start p-4 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-200 ${
            toast.type === 'error'
              ? 'bg-[#FDF2F0] border-[#F3C4BE] text-[#5C1D11]'
              : toast.type === 'success'
              ? 'bg-[#F0F5F2] border-[#D0DFD4] text-[#1D3832]'
              : 'bg-[#F4EFE6] border-[#DFD7C7] text-[#3D332A]'
          }`}
        >
          <div className="flex-shrink-0 mr-3 mt-0.5">
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-[#9C4124]" />}
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-[#2D4A43]" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-[#8C5E3C]" />}
          </div>
          
          <div className="flex-1 text-sm font-medium leading-5 font-sans">
            {toast.message}
            {toast.actionLabel && toast.onAction && (
              <button
                type="button"
                onClick={() => {
                  toast.onAction?.();
                  onDismiss(toast.id);
                }}
                className="mt-2 block text-xs font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity text-[#9C4124]"
              >
                {toast.actionLabel}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="flex-shrink-0 ml-3 text-[#8C827A] hover:text-[#1A2826] transition-colors p-1"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
