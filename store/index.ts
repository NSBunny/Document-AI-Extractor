import { create } from 'zustand';
import type { ExtractionResult, HistoryEntry, ProcessingStatus, AppSettings, AIModelConfig } from '@/lib/types';
import { AVAILABLE_MODELS } from '@/lib/types';

/* ──────────────────────────────────────────────────────────────────────────
 * Local-storage helpers for persistence
 * ────────────────────────────────────────────────────────────────────────── */

const HISTORY_KEY = 'docai-extraction-history';
const SETTINGS_KEY = 'docai-app-settings';
const MAX_HISTORY = 50;

const DEFAULT_SETTINGS: AppSettings = {
  openaiKey: '',
  anthropicKey: '',
  googleKey: '',
  defaultModel: 'gemini-2.0-flash',
};

function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistHistory(history: HistoryEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
  } catch {
    // storage full — fail silently
  }
}

function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function persistSettings(settings: AppSettings) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // fail silently
  }
}

/* ──────────────────────────────────────────────────────────────────────────
 * Store shape
 * ────────────────────────────────────────────────────────────────────────── */

interface DocAIStore {
  /* ── Processing state ─────────────────────────────────────────────── */
  status: ProcessingStatus;
  setStatus: (s: ProcessingStatus) => void;
  errorMessage: string;
  setErrorMessage: (msg: string) => void;

  /* ── Current file ─────────────────────────────────────────────────── */
  currentFile: { name: string; size: number; type: string } | null;
  setCurrentFile: (f: { name: string; size: number; type: string } | null) => void;

  /* ── Extraction result ────────────────────────────────────────────── */
  extractionResult: ExtractionResult | null;
  setExtractionResult: (r: ExtractionResult | null) => void;

  /* ── Extraction history ───────────────────────────────────────────── */
  history: HistoryEntry[];
  loadHistoryFromStorage: () => void;
  addHistoryEntry: (entry: HistoryEntry) => void;
  removeHistoryEntry: (id: string) => void;
  clearHistory: () => void;
  /** Restore a previous extraction from history. */
  restoreFromHistory: (id: string) => void;

  /* ── App Settings (API Keys & Model choices) ───────────────────────── */
  settings: AppSettings;
  loadSettingsFromStorage: () => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  getSelectedModelConfig: () => AIModelConfig;

  /* ── UI ────────────────────────────────────────────────────────────── */
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;

  /* ── Reset ─────────────────────────────────────────────────────────── */
  resetCurrent: () => void;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Store implementation
 * ────────────────────────────────────────────────────────────────────────── */

export const useDocAIStore = create<DocAIStore>((set, get) => ({
  status: 'idle',
  setStatus: (s) => set({ status: s }),
  errorMessage: '',
  setErrorMessage: (msg) => set({ errorMessage: msg }),

  currentFile: null,
  setCurrentFile: (f) => set({ currentFile: f }),

  extractionResult: null,
  setExtractionResult: (r) => set({ extractionResult: r }),

  history: [],
  loadHistoryFromStorage: () => set({ history: loadHistory() }),
  addHistoryEntry: (entry) => {
    const updated = [entry, ...get().history].slice(0, MAX_HISTORY);
    set({ history: updated });
    persistHistory(updated);
  },
  removeHistoryEntry: (id) => {
    const updated = get().history.filter((e) => e.id !== id);
    set({ history: updated });
    persistHistory(updated);
  },
  clearHistory: () => {
    set({ history: [] });
    persistHistory([]);
  },
  restoreFromHistory: (id) => {
    const entry = get().history.find((e) => e.id === id);
    if (entry) {
      set({
        extractionResult: entry.result,
        currentFile: {
          name: entry.fileName,
          size: entry.result.metadata.fileSize,
          type: entry.result.metadata.mimeType,
        },
        status: 'done',
        errorMessage: '',
      });
    }
  },

  settings: DEFAULT_SETTINGS,
  loadSettingsFromStorage: () => set({ settings: loadSettings() }),
  updateSettings: (patch) => {
    const updated = { ...get().settings, ...patch };
    set({ settings: updated });
    persistSettings(updated);
  },
  getSelectedModelConfig: () => {
    const keys = get().settings;
    if (keys.googleKey) {
      return { provider: 'google', modelId: 'gemini-2.0-flash', displayName: 'Gemini 2.0 Flash' };
    }
    if (keys.openaiKey) {
      return { provider: 'openai', modelId: 'gpt-4o-mini', displayName: 'GPT-4o Mini' };
    }
    if (keys.anthropicKey) {
      return { provider: 'anthropic', modelId: 'claude-3-5-sonnet-latest', displayName: 'Claude 3.5 Sonnet' };
    }
    // Fallback default
    return { provider: 'google', modelId: 'gemini-2.0-flash', displayName: 'Gemini 2.0 Flash' };
  },

  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  resetCurrent: () =>
    set({
      status: 'idle',
      currentFile: null,
      extractionResult: null,
      errorMessage: '',
    }),
}));
