"use client";

import { X } from "lucide-react";
import { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "md",
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`bg-white w-full ${maxWidthClasses[maxWidth]} rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-1">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}

interface ModalFooterProps {
  children: ReactNode;
}

export function ModalFooter({ children }: ModalFooterProps) {
  return (
    <div className="flex gap-3 mt-6 pt-6 border-t border-slate-50">
      {children}
    </div>
  );
}
