import { useState, useEffect } from "react";
import { Dialog, Listbox } from "@headlessui/react";
import { toast } from "react-hot-toast";
import { AIConfig } from "@/types/ai";
import { RESPONSE_LANGUAGES } from "@/utils/language";
import { NEVERSIGHT_MODELS, getNeversightModelById } from "@/utils/neversight-models";

interface AIConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartAnalysis: () => void;
}

export default function AIConfigModal({
  isOpen,
  onClose,
  onStartAnalysis,
}: AIConfigModalProps) {
  const [config, setConfig] = useState<AIConfig>(() => {
    const defaultConfig: AIConfig = {
      apiKey: "",
      selectedModel: NEVERSIGHT_MODELS[0].id,
      language: "english",
      superPrompt: true,
    };

    const savedConfig = localStorage.getItem('ai_config');
    if (savedConfig) {
      try {
        const raw = JSON.parse(savedConfig) as Record<string, unknown>;
        const merged: AIConfig = {
          apiKey: typeof raw.apiKey === "string" ? raw.apiKey : defaultConfig.apiKey,
          selectedModel:
            typeof raw.selectedModel === "string"
              ? raw.selectedModel
              : defaultConfig.selectedModel,
          language: typeof raw.language === "string" ? raw.language : defaultConfig.language,
          superPrompt: true,
        };

        // Validate model
        if (!getNeversightModelById(merged.selectedModel)) {
          merged.selectedModel = defaultConfig.selectedModel;
        }
        return merged;
      } catch (e) {
        console.error('Failed to parse saved config:', e);
      }
    }
    return defaultConfig;
  });

  const handleStartAnalysis = () => {
    if (!config.apiKey?.trim()) {
      toast.error("Please enter your Neversight API Key");
      return;
    }
    
    // save config to local storage
    localStorage.setItem('ai_config', JSON.stringify(config));
    onStartAnalysis();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                    bg-card rounded-lg border border-border p-6 w-[480px] z-50"
      >
        <h3 className="text-xl font-semibold text-foreground mb-4">
          AI Configuration
        </h3>

        <div className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                Model
              </label>
              <select
                value={config.selectedModel}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    selectedModel: e.target.value,
                  }))
                }
                className="w-full bg-card-hover text-foreground/80 border border-border rounded-md px-3 py-2"
              >
                {NEVERSIGHT_MODELS.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center pb-2">
              <input
                type="checkbox"
                id="superPrompt"
                checked={config.superPrompt}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    superPrompt: e.target.checked,
                  }))
                }
                className="h-4 w-4 text-accent bg-card-hover border-border 
                         rounded focus:ring-accent focus:ring-offset-card"
              />
              <label
                htmlFor="superPrompt"
                className="ml-2 cursor-pointer text-sm font-medium text-foreground/80"
              >
                Super Prompt
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Response Language
            </label>
            <Listbox
              value={config.language || "english"}
              onChange={(value) => setConfig({ ...config, language: value })}
            >
              <div className="relative mt-1">
                <Listbox.Button className="relative w-full bg-card-hover text-foreground/80 border border-border rounded-md px-3 py-2 text-left">
                  <span className="block truncate">
                    {
                      RESPONSE_LANGUAGES.find(
                        (l) => l.id === (config.language || "english")
                      )?.name
                    }
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <svg
                      className="h-5 w-5 text-muted"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M7 7l3-3 3 3m0 6l-3 3-3-3"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </Listbox.Button>
                <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-card-hover border border-border py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {RESPONSE_LANGUAGES.map((language) => (
                    <Listbox.Option
                      key={language.id}
                      value={language.id}
                      className={({ active }: { active: boolean }) =>
                        `relative cursor-pointer select-none py-2 px-4 ${
                          active ? "bg-secondary-hover text-foreground" : "text-foreground/80"
                        }`
                      }
                    >
                      {({ selected }: { selected: boolean }) => (
                        <span
                          className={`block truncate ${
                            selected ? "font-medium" : "font-normal"
                          }`}
                        >
                          {language.name}
                        </span>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Neversight API Key
            </label>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, apiKey: e.target.value }))
              }
              placeholder="Enter your Neversight API key"
              className="w-full bg-card-hover text-foreground/80 border border-border rounded-md px-3 py-2"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => {
              localStorage.removeItem("ai_config");
              setConfig({
                apiKey: "",
                selectedModel: NEVERSIGHT_MODELS[0].id,
                language: "english",
                superPrompt: true,
              });
            }}
            className="px-4 py-2 text-muted hover:text-foreground transition-colors"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-muted hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleStartAnalysis}
            className="group relative inline-flex items-center gap-2 px-4 py-2 
                     bg-secondary rounded-lg text-accent font-medium
                     border border-accent/20
                     transition-all duration-300 ease-out
                     hover:bg-accent/10"
          >
            <span className="relative z-10">Start Analysis</span>
            <svg
              className="w-4 h-4 transform transition-transform duration-300 
                         group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        </div>
      </div>
    </Dialog>
  );
}
