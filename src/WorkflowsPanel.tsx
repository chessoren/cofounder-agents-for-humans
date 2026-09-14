// The proactive layer, made visible: what Cofounder is watching, the workflows
// the Strands agent confirmed from that activity, and the facts it remembers.
// Everything here can be paused, erased or dismissed by the user.
import { useEffect, useState } from 'react';
import { Eye, EyeOff, Play, Repeat, Sparkles, Trash2, Loader2, Brain } from 'lucide-react';

const INK = '#11315D';
const SUB = 'rgba(13,27,75,0.55)';
const ACCENT = '#3D82DE';
const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.88)',
  border: '1px solid rgba(34,106,205,0.12)',
  boxShadow: '0 10px 30px rgba(17,49,93,0.08)',
  backdropFilter: 'blur(10px)',
};

export default function WorkflowsPanel() {
  const api = typeof window !== 'undefined' ? window.mira : undefined;
  const [obs, setObs] = useState<MiraObserverState | null>(null);
  const [mem, setMem] = useState<MiraMemory>({ workflows: [], facts: [] });
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [focusId, setFocusId] = useState<string | null>(null);

  useEffect(() => {
    if (!api?.observer) return;
    api.observer.state().then(setObs).catch(() => {});
    api.memory.list().then(setMem).catch(() => {});
    api.workflows.status().then((s) => { if (s.error) setNote(s.error); else if (s.summary) setNote(s.summary); }).catch(() => {});
    const offState = api.observer.onState(setObs);
    const offResult = api.workflows.onResult((r) => { setMem(r.memory); setNote(r.error || r.summary); });
    const offFocus = api.workflows.onFocus((p) => setFocusId(p.id));
    const poll = setInterval(() => { api.observer.state().then(setObs).catch(() => {}); }, 10000);
    return () => { offState(); offResult(); offFocus(); clearInterval(poll); };
  }, [api]);

  if (!api?.observer) return null;

  const analyze = async () => {
    setBusy(true); setNote('');
    const r = await api.workflows.analyze();
    setBusy(false);
    setMem(r.memory);
    setNote(r.error ? `The workflow agent could not run: ${r.error}` : r.summary);
  };

  const togglePause = async () => setObs(await api.observer.pause(!obs?.paused));
  const forget = async (id: string) => setMem(await api.memory.forget(id));

  return (
    <div className="w-full max-w-[760px] mx-auto mt-6 flex flex-col gap-3 text-left" style={{ fontFamily: '"Inter Tight", sans-serif' }}>
      {/* What is being watched */}
      <div className="rounded-[18px] px-4 py-3 flex items-center gap-3" style={CARD}>
        <span className="relative flex w-2.5 h-2.5">
          {obs?.running && !obs.error && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: '#22B07D' }} />}
          <span className="relative inline-flex rounded-full w-2.5 h-2.5" style={{ background: obs?.error ? '#E5484D' : obs?.running ? '#22B07D' : '#B0B8C4' }} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold" style={{ color: INK }}>
            {obs?.error ? 'Observation needs a permission' : obs?.paused ? 'Observation paused' : 'Cofounder is watching how you work'}
          </div>
          <div className="text-[12px] truncate" style={{ color: SUB }}>
            {obs?.error || `${obs?.events ?? 0} activity events recorded · apps, windows and sites only — never keystrokes`}
          </div>
        </div>
        <button onClick={togglePause} className="px-3 py-1.5 rounded-full text-[12.5px] font-medium inline-flex items-center gap-1.5 cursor-pointer"
          style={{ background: 'white', color: INK, border: '1px solid rgba(34,106,205,0.15)' }}>
          {obs?.paused ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          {obs?.paused ? 'Resume' : 'Pause'}
        </button>
      </div>

      {/* Workflows */}
      <div className="rounded-[18px] p-4" style={CARD}>
        <div className="flex items-center gap-2 mb-2">
          <Repeat className="w-4 h-4" color={ACCENT} strokeWidth={2.2} />
          <span className="text-[14px] font-semibold flex-1" style={{ color: INK }}>Workflows you repeat</span>
          <button onClick={analyze} disabled={busy}
            className="px-3 py-1.5 rounded-full text-[12.5px] font-medium inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            style={{ background: 'linear-gradient(180deg,#70A8F2,#3D82DE)', color: 'white' }}>
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {busy ? 'Analysing your week…' : 'Analyse now'}
          </button>
        </div>
        {note && <p className="text-[12.5px] mb-2 leading-snug" style={{ color: INK }}>{note}</p>}
        {!mem.workflows.length ? (
          <p className="text-[12.5px]" style={{ color: SUB }}>
            No repeated workflow confirmed yet. Cofounder checks every 30 minutes and tells you as soon as it finds one.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {mem.workflows.map((w) => (
              <div key={w.id} className="rounded-[14px] px-3.5 py-3"
                style={{ background: focusId === w.id ? '#E8F1FF' : '#F4F7FB', outline: focusId === w.id ? `2px solid ${ACCENT}` : 'none' }}>
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-semibold" style={{ color: INK }}>{w.name}</div>
                    <div className="text-[12px] mt-0.5" style={{ color: SUB }}>
                      {w.frequency} · ~{Math.round(w.minutes_saved_per_week || 0)} min/week · {Math.round((w.confidence || 0) * 100)}% confident
                    </div>
                    <div className="text-[12.5px] mt-1" style={{ color: INK }}>{w.summary}</div>
                    <ol className="text-[12px] mt-1.5 list-decimal pl-4" style={{ color: SUB }}>
                      {(w.steps || []).map((s, i) => <li key={i}>{s}</li>)}
                    </ol>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button onClick={() => api.workflows.takeover(w.id)} title={w.automation_mission}
                      className="px-3 py-1.5 rounded-full text-[12px] font-medium inline-flex items-center gap-1 cursor-pointer"
                      style={{ background: 'linear-gradient(180deg,#70A8F2,#3D82DE)', color: 'white' }}>
                      <Play className="w-3 h-3" strokeWidth={2.6} /> Take it over
                    </button>
                    <button onClick={() => forget(w.id)}
                      className="px-3 py-1 rounded-full text-[12px] inline-flex items-center gap-1 cursor-pointer"
                      style={{ color: SUB }}>
                      <Trash2 className="w-3 h-3" /> Not useful
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Facts */}
      {mem.facts.length > 0 && (
        <div className="rounded-[18px] p-4" style={CARD}>
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4" color={ACCENT} strokeWidth={2.2} />
            <span className="text-[14px] font-semibold" style={{ color: INK }}>What Cofounder remembers about how you work</span>
          </div>
          <div className="flex flex-col gap-1">
            {mem.facts.map((f) => (
              <div key={f.id} className="flex items-center gap-2 text-[12.5px] px-2 py-1 rounded-[10px] hover:bg-[#F4F7FB]" style={{ color: INK }}>
                <span className="flex-1">{f.fact}</span>
                {f.confirmations > 1 && <span className="text-[11px]" style={{ color: SUB }}>confirmed ×{f.confirmations}</span>}
                <button onClick={() => forget(f.id)} title="Forget" className="cursor-pointer"><Trash2 className="w-3 h-3" color={SUB} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
