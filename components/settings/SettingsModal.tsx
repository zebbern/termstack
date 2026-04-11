/**
 * Settings Modal Base Component
 * Provides modal wrapper for settings
 */
import React, { ReactNode } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}

export function SettingsModal({ isOpen, onClose, title, icon, children }: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 flex w-full max-w-3xl flex-col border-l border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--app-shadow)]">
        {/* Header */}
        <div className="border-b border-[var(--app-border)] px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-2)] p-2 text-[var(--app-text)]">
                  {icon}
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold text-[var(--app-text)]">
                  {title}
                </h2>
                <p className="mt-0.5 text-xs text-[var(--app-muted)]">
                  Configure your project settings
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-[var(--app-muted)] transition-all hover:bg-[rgba(255,255,255,0.06)] hover:text-[var(--app-text)]"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-[var(--app-surface)]">
          {children}
        </div>
      </div>
    </div>
  );
}
