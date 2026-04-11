"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DeleteProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  projectName: string;
  isDeleting?: boolean;
}

export default function DeleteProjectModal({
  isOpen,
  onClose,
  onConfirm,
  projectName,
  isDeleting = false
}: DeleteProjectModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const canDelete = confirmText.toLowerCase() === 'delete';

  const handleConfirm = () => {
    if (canDelete) {
      onConfirm();
    }
  };

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm" onClick={handleClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-[var(--app-shadow)]"
              onClick={e => e.stopPropagation()}
            >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/12 text-rose-300">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 13.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>

            <h3 className="mb-2 text-xl font-semibold text-[var(--app-text)]">
              Delete Project
            </h3>

            <p className="mb-6 text-sm leading-6 text-[var(--app-muted)]">
              You&apos;re about to permanently delete the project{' '}
              <span className="font-semibold text-[var(--app-text)]">&quot;{projectName}&quot;</span>.
              This action cannot be undone.
            </p>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-[var(--app-muted)]">
                To confirm, type &quot;delete&quot; below:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-2)] px-3 py-2.5 text-[var(--app-text)] outline-none transition-all placeholder:text-[var(--app-muted)] focus:border-rose-500/50"
                placeholder="Type &apos;delete&apos; to confirm"
                disabled={isDeleting}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={isDeleting}
                className="flex-1 rounded-lg border border-[var(--app-border)] bg-[rgba(255,255,255,0.03)] px-4 py-2.5 font-medium text-[var(--app-text)] transition-colors hover:bg-[rgba(255,255,255,0.06)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!canDelete || isDeleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-rose-500 px-4 py-2.5 font-medium text-slate-950 transition-colors hover:bg-rose-400 disabled:cursor-not-allowed disabled:bg-rose-500/40 disabled:text-slate-300"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Project'
                )}
              </button>
            </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
