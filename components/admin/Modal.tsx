"use client";

import { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  confirmTone?: "primary" | "danger";
  children?: ReactNode;
};

export function Modal({
  open,
  title,
  description,
  onClose,
  onConfirm,
  confirmLabel = "Confirm",
  confirmTone = "primary",
  children,
}: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            className="fixed inset-0 z-50 bg-black/60"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/10 bg-[#10101c] p-6 shadow-2xl"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-white">{title}</h3>
                {description && <p className="mt-2 text-sm text-[#8b8ba7]">{description}</p>}
              </div>
              <button onClick={onClose} className="rounded-full border border-white/10 px-3 py-1 text-sm text-[#8b8ba7]">
                Close
              </button>
            </div>

            {children && <div className="mt-5">{children}</div>}

            {onConfirm && (
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={onClose} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-[#8b8ba7]">
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className={`rounded-xl px-4 py-2 text-sm font-medium text-white ${
                    confirmTone === "danger" ? "bg-[#ff5d6c]" : "bg-gradient-to-r from-[#6C3CE1] to-[#00D4AA]"
                  }`}
                >
                  {confirmLabel}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

