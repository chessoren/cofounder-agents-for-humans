// Ambient type for the native bridge exposed by electron/preload.cjs.
export {};

declare global {
  interface MiraOllamaProgress {
    phase: 'install' | 'pull';
    message: string;
    percent: number | null;
  }

  interface MiraHardware {
    ramGB: number;
    cores: number;
    gpu: string;
    tier: string;
    label: string;
    warn: boolean;
    message: string;
  }

  type MiraAgentEvent =
    | { type: 'reflection'; text: string }
    | { type: 'cursor'; action: { kind: 'move' | 'click' | 'type'; x: number | null; y: number | null; text?: string } }
    | { type: 'done'; summary: string; reflections: string[] }
    | { type: 'error'; message: string };

  interface MiraAgentResult {
    goal: string;
    summary: string;
    reflections: string[];
    error: string | null;
  }

  interface MiraObserverState {
    running: boolean;
    paused: boolean;
    error: string;
    events: number;
    lastApp: string;
    logPath: string;
  }

  interface MiraWorkflow {
    id: string;
    name: string;
    summary: string;
    steps: string[];
    trigger: string;
    frequency: string;
    minutes_saved_per_week: number;
    confidence: number;
    automation_mission: string;
    evidence: { id: string; occurrences: number; last_seen: string }[];
    detected_at: string;
    firstSeen?: string;
    confirmedAt?: string;
    confirmations?: number;
  }

  interface MiraFact {
    id: string;
    fact: string;
    concepts: string[];
    firstSeen: string;
    confirmedAt: string;
    confirmations: number;
  }

  interface MiraMemory {
    workflows: MiraWorkflow[];
    facts: MiraFact[];
  }

  interface MiraAnalysis {
    ok: boolean;
    at: string | null;
    summary: string;
    error: string;
    transport: 'agentcore' | 'local' | '';
    detected: MiraWorkflow[];
    memory: MiraMemory;
  }

  interface MiraBridge {
    isDesktop: boolean;
    bedrock: {
      check: () => Promise<{ ok: boolean; model?: string; region?: string; error?: string }>;
    };
    observer: {
      state: () => Promise<MiraObserverState>;
      pause: (paused: boolean) => Promise<MiraObserverState>;
      erase: () => Promise<MiraObserverState>;
      onState: (cb: (s: MiraObserverState) => void) => () => void;
    };
    workflows: {
      status: () => Promise<{ at: string | null; summary: string; error: string; transport: string; running: boolean; runtimeArn: string }>;
      analyze: () => Promise<MiraAnalysis>;
      takeover: (id: string) => Promise<{ ok: boolean; error?: string }>;
      onResult: (cb: (r: MiraAnalysis) => void) => () => void;
      onFocus: (cb: (p: { id: string }) => void) => () => void;
    };
    memory: {
      list: () => Promise<MiraMemory>;
      forget: (id: string) => Promise<MiraMemory>;
    };
    hardware: {
      detect: () => Promise<MiraHardware>;
    };
    overlay: {
      setInteractive: (on: boolean) => Promise<{ ok: boolean }>;
    };
    agent: {
      run: (goal: string) => Promise<{ ok: boolean; error?: string }>;
      stop: () => Promise<{ ok: boolean }>;
      onStart: (cb: (p: { goal: string }) => void) => () => void;
      onEvent: (cb: (ev: MiraAgentEvent) => void) => () => void;
      onResult: (cb: (r: MiraAgentResult) => void) => () => void;
    };
    automation: {
      status: () => Promise<{ ok: boolean; screen?: { width: number; height: number }; error?: string }>;
      move: (x: number, y: number) => Promise<{ ok: boolean }>;
      click: (opts?: { x?: number; y?: number; button?: 'left' | 'right' | 'middle'; double?: boolean }) => Promise<{ ok: boolean }>;
      type: (text: string) => Promise<{ ok: boolean }>;
      key: (keys: string | string[]) => Promise<{ ok: boolean; error?: string }>;
    };
    ollama: {
      check: () => Promise<{ installed: boolean; serving: boolean }>;
      install: () => Promise<{ ok: boolean; already?: boolean; manual?: boolean; error?: string }>;
      pull: () => Promise<{ ok: boolean; error?: string }>;
      generate: (prompt: string) => Promise<{ ok: boolean; text?: string; error?: string }>;
      onProgress: (cb: (p: MiraOllamaProgress) => void) => () => void;
    };
  }

  interface Window {
    mira?: MiraBridge;
  }
}
