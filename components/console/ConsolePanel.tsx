'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { MotionDiv } from '@/lib/motion';
import type { PreviewEventInfo } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';
const POLL_INTERVAL = 5000;

interface PortEntry {
  projectId: string;
  projectName: string;
  port: number | null;
  url: string | null;
  status: string;
  pid: number | null;
  logCount: number;
  recentLogs: string[];
  latestDiagnostic?: PreviewEventInfo | null;
}

interface ConsolePanelProps {
  /** When provided, only show ports for this project */
  projectId?: string;
  /** Whether the panel is open */
  isOpen: boolean;
  /** Callback when user closes the panel */
  onClose: () => void;
  /** Callback when a port is killed (for parent to update preview state) */
  onPortKilled?: (projectId: string) => void;
}

export default function ConsolePanel({
  projectId,
  isOpen,
  onClose,
  onPortKilled,
}: ConsolePanelProps) {
  const [ports, setPorts] = useState<PortEntry[]>([]);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [killingPorts, setKillingPorts] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [logFilter, setLogFilter] = useState('');
  const [clearedLogs, setClearedLogs] = useState<Map<string, number>>(new Map());
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logEndRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  const getFilteredLogs = useCallback((entry: PortEntry) => {
    const clearIndex = clearedLogs.get(entry.projectId) ?? 0;
    const logs = entry.recentLogs.slice(clearIndex);
    if (!logFilter) return logs;
    return logs.filter((line) => line.toLowerCase().includes(logFilter.toLowerCase()));
  }, [logFilter, clearedLogs]);

  const handleClearLogs = useCallback((entryProjectId: string, totalLogs: number) => {
    setClearedLogs((prev) => new Map(prev).set(entryProjectId, totalLogs));
  }, []);

  const handleCopyLogs = useCallback(async (entry: PortEntry) => {
    const logs = getFilteredLogs(entry);
    const text = logs.join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(entry.projectId);
      setTimeout(() => setCopyFeedback(null), 1500);
    } catch {
      // Fallback for non-secure contexts
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopyFeedback(entry.projectId);
      setTimeout(() => setCopyFeedback(null), 1500);
    }
  }, [getFilteredLogs]);

  const fetchPorts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/projects/ports`);
      if (!res.ok) {
        setError('Failed to fetch ports');
        return;
      }
      const json = await res.json();
      const data: PortEntry[] = json?.data ?? json ?? [];

      if (projectId) {
        setPorts(data.filter((p) => p.projectId === projectId));
      } else {
        setPorts(data);
      }
      setError(null);
    } catch {
      setError('Network error');
    }
  }, [projectId]);

  useEffect(() => {
    fetchPorts();
    pollRef.current = setInterval(fetchPorts, POLL_INTERVAL);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchPorts]);

  // Auto-scroll expanded logs to bottom
  useEffect(() => {
    for (const id of expandedLogs) {
      const el = logEndRefs.current.get(id);
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ports, expandedLogs]);

  const handleKill = useCallback(
    async (targetProjectId: string) => {
      setKillingPorts((prev) => new Set(prev).add(targetProjectId));
      try {
        const res = await fetch(`${API_BASE}/api/projects/ports/kill`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: targetProjectId }),
        });
        if (res.ok) {
          onPortKilled?.(targetProjectId);
          await fetchPorts();
        }
      } finally {
        setKillingPorts((prev) => {
          const next = new Set(prev);
          next.delete(targetProjectId);
          return next;
        });
      }
    },
    [fetchPorts, onPortKilled]
  );

  const toggleLogs = (id: string) => {
    setExpandedLogs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const visibleEntries = ports.filter(
    (entry) =>
      entry.status === 'running' ||
      entry.status === 'starting' ||
      entry.status === 'error' ||
      Boolean(entry.latestDiagnostic)
  );
  const activePorts = visibleEntries.filter(
    (entry) => entry.status === 'running' || entry.status === 'starting'
  );
  const issueCount = visibleEntries.filter((entry) => entry.status === 'error').length;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <MotionDiv
        key="console-panel"
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="border-t border-[var(--app-border)] bg-[var(--app-bg)] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--app-border)]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--app-text)]">Console</span>
            {activePorts.length > 0 && (
              <span className="rounded-full bg-[var(--app-accent)] px-2 py-0.5 text-xs font-medium text-[#050608]">
                {activePorts.length} active
              </span>
            )}
            {issueCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                {issueCount} issue{issueCount === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Filter input */}
            <div className="relative">
              <input
                type="text"
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                placeholder="Filter logs..."
                className="h-6 w-36 rounded bg-[var(--app-surface)] border border-[var(--app-border)] px-2 text-xs text-[var(--app-text)] placeholder:text-[var(--app-muted)] focus:outline-none focus:border-[var(--app-accent)] transition"
              />
              {logFilter && (
                <button
                  type="button"
                  onClick={() => setLogFilter('')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-[var(--app-muted)] hover:text-[var(--app-text)] transition"
                  title="Clear filter"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18" />
                    <path d="M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={fetchPorts}
              className="rounded p-1 text-[var(--app-muted)] hover:text-[var(--app-text)] transition"
              title="Refresh"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 4v6h6" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-[var(--app-muted)] hover:text-[var(--app-text)] transition"
              title="Close console"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[280px] overflow-y-auto">
          {error && (
            <div className="px-4 py-2 text-xs text-[var(--app-danger)]">{error}</div>
          )}

          {visibleEntries.length === 0 && !error && (
            <div className="px-4 py-8 text-center text-sm text-[var(--app-muted)]">
              No active preview activity
            </div>
          )}

          {visibleEntries.map((entry) => (
            <div
              key={entry.projectId}
              className="border-b border-[var(--app-border)] last:border-b-0"
            >
              {/* Port row */}
              <div className="flex items-center justify-between px-4 py-2.5 hover:bg-[var(--app-surface)] transition">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Status dot */}
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      entry.status === 'running'
                        ? 'bg-emerald-400'
                        : 'bg-amber-400 animate-pulse'
                    }`}
                  />

                  {/* Port number */}
                  <span className="font-mono text-sm font-medium text-[var(--app-text)]">
                    {entry.port ? `:${entry.port}` : entry.status === 'error' ? 'error' : 'idle'}
                  </span>

                  {/* Project name */}
                  <span className="text-sm text-[var(--app-muted)] truncate">
                    {entry.projectName}
                  </span>

                  {/* PID */}
                  {entry.pid && (
                    <span className="text-xs text-[var(--app-muted)] opacity-50">
                      PID {entry.pid}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Open URL */}
                  {entry.url && (
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded px-2 py-1 text-xs text-[var(--app-accent)] hover:bg-[var(--app-surface-2)] transition"
                    >
                      Open
                    </a>
                  )}

                  {/* Toggle logs */}
                  {entry.logCount > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleLogs(entry.projectId)}
                      className="rounded px-2 py-1 text-xs text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-surface-2)] transition"
                    >
                      {expandedLogs.has(entry.projectId) ? 'Hide logs' : `Logs (${entry.logCount})`}
                    </button>
                  )}

                  {/* Copy logs */}
                  {expandedLogs.has(entry.projectId) && entry.logCount > 0 && (
                    <button
                      type="button"
                      onClick={() => handleCopyLogs(entry)}
                      className="rounded px-2 py-1 text-xs text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-surface-2)] transition"
                      title="Copy logs to clipboard"
                    >
                      {copyFeedback === entry.projectId ? 'Copied!' : 'Copy'}
                    </button>
                  )}

                  {/* Clear logs */}
                  {expandedLogs.has(entry.projectId) && entry.logCount > 0 && (
                    <button
                      type="button"
                      onClick={() => handleClearLogs(entry.projectId, entry.recentLogs.length)}
                      className="rounded px-2 py-1 text-xs text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-surface-2)] transition"
                      title="Clear logs"
                    >
                      Clear
                    </button>
                  )}

                  {/* Kill button */}
                  <button
                    type="button"
                    onClick={() => handleKill(entry.projectId)}
                    disabled={killingPorts.has(entry.projectId)}
                    className="rounded px-2.5 py-1 text-xs font-medium text-red-400 border border-red-400/20 hover:bg-red-400/10 hover:border-red-400/40 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    {killingPorts.has(entry.projectId) ? 'Stopping...' : 'Stop'}
                  </button>
                </div>
              </div>

              {entry.latestDiagnostic && (
                <div className="px-4 pb-3">
                  <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          entry.latestDiagnostic.severity === 'error'
                            ? 'bg-amber-500'
                            : entry.latestDiagnostic.severity === 'warning'
                            ? 'bg-yellow-500'
                            : 'bg-emerald-500'
                        }`}
                      />
                      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--app-muted)]">
                        {entry.latestDiagnostic.category?.replace(/-/g, ' ') || 'preview update'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--app-text)]">{entry.latestDiagnostic.message}</p>
                    {entry.latestDiagnostic.detail && (
                      <p className="mt-1 text-xs text-[var(--app-muted)]">{entry.latestDiagnostic.detail}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Expanded logs */}
              <AnimatePresence>
                {expandedLogs.has(entry.projectId) && (
                  <MotionDiv
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <div className="mx-4 mb-2 rounded-lg bg-[#0d1117] border border-[var(--app-border)] max-h-[160px] overflow-y-auto">
                      <pre className="p-3 text-xs text-gray-400 font-mono leading-relaxed whitespace-pre-wrap">
                        {(() => {
                          const filtered = getFilteredLogs(entry);
                          if (filtered.length === 0) return logFilter ? 'No matching logs' : 'No recent logs';
                          return filtered.join('\n');
                        })()}
                      </pre>
                      <div
                        ref={(el) => {
                          logEndRefs.current.set(entry.projectId, el);
                        }}
                      />
                    </div>
                  </MotionDiv>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </MotionDiv>
    </AnimatePresence>
  );
}
