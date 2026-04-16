/**
 * AI Assistant Settings Component
 * Display current AI CLI and model (read-only)
 */
import React from 'react';
import { useCLI } from '@/hooks/useCLI';

interface AIAssistantSettingsProps {
  projectId: string;
}

export function AIAssistantSettings({ projectId }: AIAssistantSettingsProps) {
  const { cliOptions, preference } = useCLI({ projectId });

  const selectedCLIOption = cliOptions.find(opt => opt.id === preference?.preferredCli);

  // Get the actual model name from preference data
  const getModelDisplayName = () => {
    if (!preference?.selectedModel) return 'Default Model';

    // Find the model name from the CLI options
    const currentCLI = selectedCLIOption;
    if (currentCLI?.models) {
      const model = currentCLI.models.find(m => m.id === preference.selectedModel);
      return model?.name || preference.selectedModel;
    }

    return preference.selectedModel;
  };

  const modelDisplayName = getModelDisplayName();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-medium text-[var(--app-text)] mb-4">
          Current AI Assistant
        </h3>

        <div className="space-y-4">
          {/* Current CLI */}
          <div className="p-4 bg-[var(--app-surface)] rounded-lg border border-[var(--app-border)]">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-[var(--app-muted)] mb-1">
                  CLI Agent
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-[var(--app-text)]">
                    {selectedCLIOption?.name || preference?.preferredCli || 'Not configured'}
                  </span>
                  {selectedCLIOption?.configured ? (
                    <span className="text-xs px-2 py-1 bg-emerald-900/30 text-emerald-400 rounded">
                      Configured
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 bg-yellow-900/30 text-yellow-400 rounded">
                      Not Configured
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Current Model */}
          <div className="p-4 bg-[var(--app-surface)] rounded-lg border border-[var(--app-border)]">
            <h4 className="text-sm font-medium text-[var(--app-muted)] mb-1">
              Model
            </h4>
            <span className="text-lg font-semibold text-[var(--app-text)]">
              {modelDisplayName}
            </span>
          </div>


          {/* Note */}
          <div className="text-center">
            <p className="text-sm text-[var(--app-muted)]">
              To modify these settings, use Global Settings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
