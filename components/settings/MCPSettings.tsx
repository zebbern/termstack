"use client";
import React, { useState } from 'react';
import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';
import { MCP_PRESETS } from '@/lib/services/settings';
import type { MCPServerConfig } from '@/lib/services/settings';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';

const PRESET_DESCRIPTIONS: Record<string, string> = {
  filesystem: 'Sandboxed file operations — read, write, search files within the project',
  playwright: 'Browser automation — navigate pages, click elements, take screenshots',
  'sequential-thinking': 'Extended reasoning — multi-step problem decomposition',
  github: 'GitHub integration — repos, issues, PRs, code search',
};

const PRESET_ICONS: Record<string, React.ReactNode> = {
  filesystem: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
  playwright: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
  'sequential-thinking': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  github: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  ),
};

interface AddFormState {
  name: string;
  command: string;
  args: string;
  envKey: string;
  envValue: string;
  envPairs: Record<string, string>;
}

const emptyForm: AddFormState = {
  name: '',
  command: 'npx',
  args: '',
  envKey: '',
  envValue: '',
  envPairs: {},
};

export function MCPSettings() {
  const { settings, setSettings } = useGlobalSettings();
  const [addForm, setAddForm] = useState<AddFormState>({ ...emptyForm });
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<AddFormState>({ ...emptyForm });

  const servers: MCPServerConfig[] = settings.mcp_servers ?? [];

  const mergedPresets = MCP_PRESETS.map((preset) => {
    const saved = servers.find((s) => s.name === preset.name && s.isPreset);
    return saved ?? preset;
  });
  const customServers = servers.filter((s) => !s.isPreset);

  async function persist(updated: MCPServerConfig[]) {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/settings/global`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mcp_servers: updated }),
      });
      if (res.ok) {
        setSettings((prev) => ({ ...prev, mcp_servers: updated }));
      }
    } catch (err) {
      console.error('Failed to save MCP settings:', err);
    } finally {
      setSaving(false);
    }
  }

  function togglePreset(presetName: string) {
    const current = [...servers];
    const idx = current.findIndex((s) => s.name === presetName && s.isPreset);
    if (idx >= 0) {
      current[idx] = { ...current[idx], enabled: !current[idx].enabled };
    } else {
      const preset = MCP_PRESETS.find((p) => p.name === presetName);
      if (preset) current.push({ ...preset, enabled: true });
    }
    persist(current);
  }

  function handleAddCustom() {
    if (!addForm.name.trim() || !addForm.command.trim()) return;
    const newServer: MCPServerConfig = {
      name: addForm.name.trim(),
      command: addForm.command.trim(),
      args: addForm.args.split(/\s+/).filter(Boolean),
      enabled: true,
      isPreset: false,
    };
    if (Object.keys(addForm.envPairs).length > 0) {
      newServer.env = { ...addForm.envPairs };
    }
    persist([...servers, newServer]);
    setAddForm({ ...emptyForm });
    setShowAddForm(false);
  }

  function deleteServer(name: string) {
    persist(servers.filter((s) => !(s.name === name && !s.isPreset)));
  }

  function startEdit(server: MCPServerConfig) {
    setEditingId(server.name);
    setEditForm({
      name: server.name,
      command: server.command,
      args: server.args.join(' '),
      envKey: '',
      envValue: '',
      envPairs: server.env ? { ...server.env } : {},
    });
  }

  function saveEdit() {
    if (!editingId || !editForm.name.trim() || !editForm.command.trim()) return;
    const updated = servers.map((s) => {
      if (s.name === editingId && !s.isPreset) {
        return {
          ...s,
          name: editForm.name.trim(),
          command: editForm.command.trim(),
          args: editForm.args.split(/\s+/).filter(Boolean),
          env: Object.keys(editForm.envPairs).length > 0 ? { ...editForm.envPairs } : undefined,
        };
      }
      return s;
    });
    persist(updated);
    setEditingId(null);
  }

  function addEnvPair(form: AddFormState, setForm: (f: AddFormState) => void) {
    if (!form.envKey.trim()) return;
    setForm({
      ...form,
      envPairs: { ...form.envPairs, [form.envKey.trim()]: form.envValue },
      envKey: '',
      envValue: '',
    });
  }

  function removeEnvPair(form: AddFormState, setForm: (f: AddFormState) => void, key: string) {
    const copy = { ...form.envPairs };
    delete copy[key];
    setForm({ ...form, envPairs: copy });
  }

  return (
    <div className="space-y-8">
      {/* Preset MCP Servers */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Preset MCP Servers</h3>
        <p className="text-sm text-gray-600 mb-4">
          Toggle built-in MCP servers. Enabled servers are injected into all new projects.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {mergedPresets.map((preset) => (
            <div
              key={preset.name}
              className={`relative p-4 rounded-xl border transition-all cursor-pointer ${
                preset.enabled
                  ? 'border-[#DE7356]/50 bg-[#DE7356]/5'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
              }`}
              onClick={() => togglePreset(preset.name)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`${preset.enabled ? 'text-[#DE7356]' : 'text-gray-400'}`}>
                    {PRESET_ICONS[preset.name]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{preset.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {PRESET_DESCRIPTIONS[preset.name]}
                    </p>
                  </div>
                </div>
                {/* Toggle Switch */}
                <div
                  className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                    preset.enabled ? 'bg-[#DE7356]' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      preset.enabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </div>
              </div>
              {preset.name === 'github' && preset.enabled && (
                <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <label className="text-xs text-gray-500 whitespace-nowrap">GITHUB_TOKEN</label>
                  <input
                    type="password"
                    placeholder="ghp_..."
                    className="flex-1 text-xs px-2 py-1 border border-gray-200 rounded bg-white text-gray-900 placeholder:text-gray-400"
                    value={
                      servers.find((s) => s.name === 'github' && s.isPreset)?.env?.GITHUB_TOKEN ?? ''
                    }
                    onChange={(e) => {
                      const current = [...servers];
                      const idx = current.findIndex((s) => s.name === 'github' && s.isPreset);
                      if (idx >= 0) {
                        current[idx] = {
                          ...current[idx],
                          env: { ...current[idx].env, GITHUB_TOKEN: e.target.value },
                        };
                        persist(current);
                      }
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Custom MCP Servers */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Custom MCP Servers</h3>
            <p className="text-sm text-gray-600">
              Add your own MCP servers. They&apos;ll be included in all new projects.
            </p>
          </div>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-3 py-1.5 text-sm bg-[#DE7356] text-white rounded-lg hover:bg-[#c5614a] transition-colors"
            >
              + Add Server
            </button>
          )}
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="p-4 mb-4 rounded-xl border border-[#DE7356]/30 bg-[#DE7356]/5">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Server Name</label>
                <input
                  type="text"
                  placeholder="my-server"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Command</label>
                <input
                  type="text"
                  placeholder="npx"
                  value={addForm.command}
                  onChange={(e) => setAddForm({ ...addForm, command: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Arguments <span className="text-gray-400">(space-separated)</span>
              </label>
              <input
                type="text"
                placeholder="-y @my-org/mcp-server@latest"
                value={addForm.args}
                onChange={(e) => setAddForm({ ...addForm, args: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400"
              />
            </div>
            {/* Env Vars */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Environment Variables <span className="text-gray-400">(optional)</span>
              </label>
              {Object.entries(addForm.envPairs).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-gray-700">{k}={v ? '••••' : '(empty)'}</span>
                  <button
                    onClick={() => removeEnvPair(addForm, setAddForm, k)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="KEY"
                  value={addForm.envKey}
                  onChange={(e) => setAddForm({ ...addForm, envKey: e.target.value })}
                  className="w-28 px-2 py-1 text-xs border border-gray-200 rounded bg-white text-gray-900 placeholder:text-gray-400"
                />
                <input
                  type="text"
                  placeholder="value"
                  value={addForm.envValue}
                  onChange={(e) => setAddForm({ ...addForm, envValue: e.target.value })}
                  className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded bg-white text-gray-900 placeholder:text-gray-400"
                />
                <button
                  onClick={() => addEnvPair(addForm, setAddForm)}
                  className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Add
                </button>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowAddForm(false); setAddForm({ ...emptyForm }); }}
                className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustom}
                disabled={!addForm.name.trim() || !addForm.command.trim()}
                className="px-3 py-1.5 text-sm bg-[#DE7356] text-white rounded-lg hover:bg-[#c5614a] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Add Server
              </button>
            </div>
          </div>
        )}

        {/* Custom Server List */}
        {customServers.length === 0 && !showAddForm ? (
          <p className="text-sm text-gray-500 italic">No custom MCP servers configured.</p>
        ) : (
          <div className="space-y-2">
            {customServers.map((server) => (
              <div
                key={server.name}
                className="p-3 rounded-lg border border-gray-200 bg-gray-50"
              >
                {editingId === server.name ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="px-2 py-1 text-sm border border-gray-200 rounded bg-white text-gray-900"
                      />
                      <input
                        type="text"
                        value={editForm.command}
                        onChange={(e) => setEditForm({ ...editForm, command: e.target.value })}
                        className="px-2 py-1 text-sm border border-gray-200 rounded bg-white text-gray-900"
                      />
                    </div>
                    <input
                      type="text"
                      value={editForm.args}
                      onChange={(e) => setEditForm({ ...editForm, args: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-200 rounded bg-white text-gray-900"
                    />
                    {/* Env vars in edit */}
                    {Object.entries(editForm.envPairs).map(([k, v]) => (
                      <div key={k} className="flex items-center gap-2">
                        <span className="text-xs font-mono text-gray-700">{k}={v ? '••••' : '(empty)'}</span>
                        <button onClick={() => removeEnvPair(editForm, setEditForm, k)} className="text-xs text-red-500">×</button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input
                        type="text" placeholder="KEY" value={editForm.envKey}
                        onChange={(e) => setEditForm({ ...editForm, envKey: e.target.value })}
                        className="w-28 px-2 py-1 text-xs border border-gray-200 rounded bg-white text-gray-900"
                      />
                      <input
                        type="text" placeholder="value" value={editForm.envValue}
                        onChange={(e) => setEditForm({ ...editForm, envValue: e.target.value })}
                        className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded bg-white text-gray-900"
                      />
                      <button onClick={() => addEnvPair(editForm, setEditForm)} className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">Add</button>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditingId(null)} className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Cancel</button>
                      <button onClick={saveEdit} className="px-3 py-1 text-sm bg-[#DE7356] text-white rounded hover:bg-[#c5614a]">Save</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{server.name}</p>
                      <p className="text-xs text-gray-500 font-mono">
                        {server.command} {server.args.join(' ')}
                      </p>
                      {server.env && Object.keys(server.env).length > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          env: {Object.keys(server.env).join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(server)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteServer(server.name)}
                        className="p-1.5 text-red-400 hover:text-red-600 rounded"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-[#DE7356]" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-900">How MCP Servers Work</h3>
            <div className="mt-1 text-sm text-gray-600">
              <p>
                MCP (Model Context Protocol) servers give AI agents superpowers — filesystem access, browser
                automation, extended reasoning. Enabled servers are automatically configured in every new
                project for Claude, Codex, and Cursor agents.
              </p>
            </div>
          </div>
        </div>
      </div>

      {saving && (
        <div className="text-xs text-gray-400 text-center animate-pulse">Saving...</div>
      )}
    </div>
  );
}
