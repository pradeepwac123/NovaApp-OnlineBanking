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
          {/* Overlay: semi-transparent surface scrim, not pure black */}
          <motion.button
            className="fixed inset-0 z-50 bg-on-surface/30"
            onClick={onClose}
            aria-label="Close modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal panel: white surface floating above the scrim */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-sm bg-surface-container-lowest p-6 shadow-ambient"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="modal-title" className="text-xl font-semibold text-on-surface">{title}</h3>
                {description && <p className="mt-2 text-sm leading-6 text-on-surface-variant">{description}</p>}
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="rounded-full bg-surface-container px-3 py-1 text-sm text-on-surface-variant transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Close
              </button>
            </div>

            {children && <div className="mt-5">{children}</div>}

            {onConfirm && (
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="rounded-sm bg-surface-container px-4 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className={`rounded-sm px-4 py-2 text-sm font-medium text-on-primary transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    confirmTone === "danger" ? "bg-error" : "gradient-btn"
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
