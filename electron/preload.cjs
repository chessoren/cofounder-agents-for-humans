// Mira Desktop — preload bridge. Exposes a minimal, typed surface on window.mira.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mira', {
  isDesktop: true,

  // Hardware probe -> picks the model tier internally, returns a user-facing summary
  hardware: {
    detect: () => ipcRenderer.invoke('mira:hardware:detect'),
  },

  // Real mouse + keyboard control (nut.js, main process)
  automation: {
    status: () => ipcRenderer.invoke('mira:automation:status'),
    move: (x, y) => ipcRenderer.invoke('mira:automation:move', { x, y }),
    click: (opts) => ipcRenderer.invoke('mira:automation:click', opts || {}),
    type: (text) => ipcRenderer.invoke('mira:automation:type', { text }),
    key: (keys) => ipcRenderer.invoke('mira:automation:key', { keys }),
  },

  // Overlay window controls (click-through toggle for hover-interactive zones)
  overlay: {
    setInteractive: (on) => ipcRenderer.invoke('mira:overlay:interactive', { on }),
  },

  // Agent mode — the magic ritual
  agent: {
    run: (goal) => ipcRenderer.invoke('mira:agent:run', { goal }),
    stop: () => ipcRenderer.invoke('mira:agent:stop'),
    onStart: (cb) => {
      const h = (_e, p) => cb(p);
      ipcRenderer.on('mira:agent:start', h);
      return () => ipcRenderer.removeListener('mira:agent:start', h);
    },
    onEvent: (cb) => {
      const h = (_e, p) => cb(p);
      ipcRenderer.on('mira:agent:event', h);
      return () => ipcRenderer.removeListener('mira:agent:event', h);
    },
    onResult: (cb) => {
      const h = (_e, p) => cb(p);
      ipcRenderer.on('mira:agent:result', h);
      return () => ipcRenderer.removeListener('mira:agent:result', h);
    },
  },

  // Amazon Bedrock reachability (onboarding "connecting" step)
  bedrock: {
    check: () => ipcRenderer.invoke('mira:bedrock:check'),
  },

  // Proactive layer: what Cofounder watches, what it found, what it remembers
  observer: {
    state: () => ipcRenderer.invoke('mira:observer:state'),
    pause: (paused) => ipcRenderer.invoke('mira:observer:pause', { paused }),
    erase: () => ipcRenderer.invoke('mira:observer:erase'),
    onState: (cb) => { const h = (_e, p) => cb(p); ipcRenderer.on('mira:observer:state', h); return () => ipcRenderer.removeListener('mira:observer:state', h); },
  },
  workflows: {
    status: () => ipcRenderer.invoke('mira:workflows:status'),
    analyze: () => ipcRenderer.invoke('mira:workflows:analyze'),
    takeover: (id) => ipcRenderer.invoke('mira:workflows:takeover', { id }),
    onResult: (cb) => { const h = (_e, p) => cb(p); ipcRenderer.on('mira:workflows:result', h); return () => ipcRenderer.removeListener('mira:workflows:result', h); },
    onFocus: (cb) => { const h = (_e, p) => cb(p); ipcRenderer.on('mira:workflows:focus', h); return () => ipcRenderer.removeListener('mira:workflows:focus', h); },
  },
  memory: {
    list: () => ipcRenderer.invoke('mira:memory:list'),
    forget: (id) => ipcRenderer.invoke('mira:memory:forget', { id }),
  },

  // Chat completions (historical name; served by Amazon Bedrock)
  ollama: {
    check: () => ipcRenderer.invoke('mira:ollama:check'),
    install: () => ipcRenderer.invoke('mira:ollama:install'),
    pull: () => ipcRenderer.invoke('mira:ollama:pull'),
    generate: (prompt) => ipcRenderer.invoke('mira:ollama:generate', { prompt }),
    onProgress: (cb) => {
      const handler = (_e, payload) => cb(payload);
      ipcRenderer.on('mira:ollama:progress', handler);
      return () => ipcRenderer.removeListener('mira:ollama:progress', handler);
    },
  },
});
