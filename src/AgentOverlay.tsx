// AgentOverlay — the magic ritual.
// Rendered in a transparent, click-through, always-on-top window that covers the
// screen. The user sees only: the floating IA bar above the taskbar, a bubble of
// Mira's reflections emerging above it, and the blue cursor bursting out of the
// bubble (water-drop splash) to act on the real desktop. At the end the bubble
// expands to full screen and the main Mira window returns.
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FONT = '"Inter Tight", sans-serif';
const BAR_W = Math.min(702, typeof window !== 'undefined' ? window.innerWidth * 0.92 : 702);
const BUBBLE_H = Math.round(BAR_W * 0.62);
const BAR_BOTTOM = 56; // sits just above the Dock
const BAR_H = 92;

type Phase = 'intro' | 'acting' | 'closing';

export default function AgentOverlay() {
  const [goal, setGoal] = useState('');
  const [reflections, setReflections] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>('intro');
  const [emerged, setEmerged] = useState(false);
  const [splashKey, setSplashKey] = useState(0);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [clickKey, setClickKey] = useState(0);
  const [summary, setSummary] = useState('');
  const [errored, setErrored] = useState('');
  const reflRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  // Emission point — top-center of the bubble, where the cursor is "born".
  const emit = {
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 400,
    y: typeof window !== 'undefined' ? window.innerHeight - BAR_BOTTOM - BAR_H - 18 - BUBBLE_H + 26 : 200,
  };

  // This window must be see-through so the real desktop shows behind the bar.
  useEffect(() => {
    const prev: string[] = [];
    [document.documentElement, document.body, document.getElementById('root')].forEach((el) => {
      if (el) { prev.push((el as HTMLElement).style.background); (el as HTMLElement).style.background = 'transparent'; }
    });
    return () => {
      [document.documentElement, document.body, document.getElementById('root')].forEach((el, i) => {
        if (el) (el as HTMLElement).style.background = prev[i] || '';
      });
    };
  }, []);

  useEffect(() => {
    reflRef.current?.scrollTo({ top: reflRef.current.scrollHeight, behavior: 'smooth' });
  }, [reflections]);

  const handleEvent = (ev: MiraAgentEvent) => {
    if (ev.type === 'reflection') {
      setReflections((p) => [...p, ev.text]);
    } else if (ev.type === 'cursor') {
      const a = ev.action;
      if (!emerged) { setEmerged(true); setSplashKey((k) => k + 1); }
      if (a.x != null && a.y != null) setCursor({ x: a.x, y: a.y });
      if (a.kind === 'click') setClickKey((k) => k + 1);
      setPhase('acting');
    } else if (ev.type === 'done') {
      setSummary(ev.summary);
      setReflections((p) => (ev.reflections?.length ? ev.reflections : p));
      setPhase('closing');
    } else if (ev.type === 'error') {
      setErrored(ev.message);
      setPhase('closing');
    }
  };

  useEffect(() => {
    const w = window as Window;
    if (w.mira?.agent) {
      const offStart = w.mira.agent.onStart((p) => setGoal(p.goal));
      const offEvent = w.mira.agent.onEvent(handleEvent);
      return () => { offStart(); offEvent(); };
    }
    // Browser-preview demo so the ritual is visible without Electron.
    if (!startedRef.current) { startedRef.current = true; runDemo(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Browser preview demo ---------------------------------------------
  const runDemo = async () => {
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const W = window.innerWidth, H = window.innerHeight;
    setGoal('Send the latest report to Isaac on WhatsApp');
    await wait(700);
    handleEvent({ type: 'reflection', text: 'Got it — let me take care of that for you.' });
    await wait(900);
    handleEvent({ type: 'reflection', text: 'Opening WhatsApp…' });
    handleEvent({ type: 'cursor', action: { kind: 'move', x: W * 0.5, y: H * 0.45 } });
    await wait(1100);
    handleEvent({ type: 'cursor', action: { kind: 'click', x: W * 0.5, y: H * 0.45 } });
    await wait(900);
    handleEvent({ type: 'reflection', text: 'Finding Isaac…' });
    handleEvent({ type: 'cursor', action: { kind: 'move', x: W * 0.3, y: H * 0.25 } });
    await wait(1000);
    handleEvent({ type: 'cursor', action: { kind: 'type', x: W * 0.3, y: H * 0.25, text: 'Isaac' } });
    await wait(900);
    handleEvent({ type: 'reflection', text: 'Attaching the report and sending…' });
    handleEvent({ type: 'cursor', action: { kind: 'move', x: W * 0.65, y: H * 0.7 } });
    await wait(1000);
    handleEvent({ type: 'cursor', action: { kind: 'click', x: W * 0.65, y: H * 0.7 } });
    await wait(900);
    handleEvent({ type: 'done', summary: 'Sent the latest report to Isaac on WhatsApp. ✅', reflections: [] });
  };

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: 'transparent', fontFamily: FONT }}>
      {/* Blue cursor — the hand of Mira */}
      <AnimatePresence>
        {emerged && phase !== 'closing' && cursor && (
          <motion.img
            src="/mira-cursor.svg"
            alt=""
            className="absolute z-[60] pointer-events-none"
            style={{ width: 40, height: 40, left: 0, top: 0, filter: 'drop-shadow(0 6px 14px rgba(61,130,222,0.45))' }}
            initial={{ x: emit.x - 20, y: emit.y - 20, scale: 0.3, opacity: 0 }}
            animate={{ x: cursor.x - 6, y: cursor.y - 4, scale: 1, opacity: 1 }}
            exit={{ x: emit.x - 20, y: emit.y - 20, scale: 0.3, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 18, mass: 0.7 }}
          />
        )}
      </AnimatePresence>

      {/* Click ripple */}
      <AnimatePresence>
        {cursor && (
          <motion.div
            key={`click-${clickKey}`}
            className="absolute z-[55] rounded-full pointer-events-none"
            style={{ left: cursor.x - 16, top: cursor.y - 16, width: 32, height: 32, border: '2px solid rgba(61,130,222,0.7)' }}
            initial={{ scale: 0.2, opacity: 0.9 }}
            animate={{ scale: 2.2, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* Splash — the droplet burst as the cursor breaks the bubble's surface */}
      <AnimatePresence>
        {splashKey > 0 && phase !== 'closing' && (
          <motion.div key={`splash-${splashKey}`} className="absolute z-[58] pointer-events-none" style={{ left: emit.x, top: emit.y }}>
            <motion.span
              className="absolute rounded-full"
              style={{ width: 70, height: 70, left: -35, top: -35, border: '2.5px solid rgba(112,168,242,0.8)' }}
              initial={{ scale: 0.2, opacity: 1 }}
              animate={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            />
            {[...Array(7)].map((_, i) => {
              const ang = (i / 7) * Math.PI * 2;
              return (
                <motion.span
                  key={i}
                  className="absolute rounded-full bg-[#5C9DF5]"
                  style={{ width: 8, height: 8, left: -4, top: -4 }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{ x: Math.cos(ang) * 46, y: Math.sin(ang) * 46 - 8, opacity: 0, scale: 0.4 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reflection bubble */}
      <AnimatePresence>
        {phase !== 'closing' && (
          <motion.div
            className="absolute left-1/2 z-40"
            style={{ width: BAR_W, height: BUBBLE_H, bottom: BAR_BOTTOM + BAR_H + 18, x: '-50%' }}
            initial={{ opacity: 0, scale: 0.6, y: 80, borderRadius: '50%' }}
            animate={{
              opacity: 1, scale: 1, y: 0,
              borderRadius: ['46% 54% 60% 40% / 55% 45% 55% 45%', '24px', '24px'],
            }}
            exit={{ opacity: 0, scale: 0.4, y: 120 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="w-full h-full rounded-[24px] p-[4px]"
              style={{ border: '0.5px solid rgba(0,0,0,0.05)', background: 'rgba(157,196,250,0.18)', backdropFilter: 'blur(50px)' }}
            >
              <div className="relative w-full h-full bg-white rounded-[20px] flex flex-col" style={{ border: '1px solid rgba(34,106,205,0.05)' }}>
                {/* droplet tail toward the bar */}
                <div className="absolute left-1/2 -bottom-2 w-5 h-5 bg-white rotate-45 rounded-[4px]" style={{ transform: 'translateX(-50%) rotate(45deg)', border: '1px solid rgba(34,106,205,0.05)', borderTop: 'none', borderLeft: 'none' }} />
                <div className="flex items-center gap-2 px-5 pt-4 pb-2">
                  <span className="w-2 h-2 rounded-full bg-[#3D82DE] animate-pulse" />
                  <span className="text-[13px] font-semibold text-[#11315D]">Cofounder is working</span>
                </div>
                <div ref={reflRef} className="flex-1 overflow-y-auto px-5 pb-4 flex flex-col gap-2 scrollbar-none">
                  {reflections.length === 0 && (
                    <div className="flex items-center gap-1.5 py-2">
                      <span className="w-2 h-2 rounded-full bg-[#3D82DE] animate-typing-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-[#3D82DE] animate-typing-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-[#3D82DE] animate-typing-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                  {reflections.map((r, i) => (
                    <motion.p
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: i === reflections.length - 1 ? 1 : 0.5, y: 0 }}
                      className="text-[14px] leading-snug text-[#0D1B4B]"
                    >
                      {r}
                    </motion.p>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating IA bar (display-only during execution) */}
      <motion.div
        className="absolute left-1/2"
        style={{ width: BAR_W, bottom: BAR_BOTTOM, x: '-50%' }}
        initial={{ opacity: 0, y: 60, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          className="w-full p-[4px] rounded-[24px]"
          style={{ border: '0.5px solid rgba(0,0,0,0.05)', background: 'rgba(157,196,250,0.18)', backdropFilter: 'blur(50px)' }}
        >
          <div className="w-full bg-white rounded-[20px] flex items-center gap-3 px-4" style={{ height: BAR_H - 8, border: '1px solid rgba(34,106,205,0.05)' }}>
            <div className="w-7 h-7 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(180deg, #70A8F2 0%, #3D82DE 100%)' }}>
              <img src="/mira-cursor.svg" alt="" className="w-4 h-4" style={{ filter: 'brightness(0) invert(1)' }} />
            </div>
            <span className="flex-1 text-[15px] text-[#0D1B4B] truncate">{goal || 'Working…'}</span>
            {/* Enlarged Stop hit-zone. Hovering it makes the overlay momentarily
                interactive (it is click-through otherwise) so the click lands. */}
            <div
              className="flex items-center justify-center"
              style={{ pointerEvents: 'auto', padding: '14px', margin: '-14px' }}
              onMouseEnter={() => (window as Window).mira?.overlay?.setInteractive(true)}
              onMouseLeave={() => (window as Window).mira?.overlay?.setInteractive(false)}
            >
              <button
                onClick={() => { (window as Window).mira?.overlay?.setInteractive(false); (window as Window).mira?.agent?.stop(); }}
                className="flex items-center gap-1.5 h-9 px-4 rounded-[12px] text-[13px] font-medium text-[#E0245E] bg-[rgba(224,36,94,0.08)] hover:bg-[rgba(224,36,94,0.16)] active:scale-[0.97] transition-all cursor-pointer"
                style={{ fontFamily: FONT }}
              >
                <span className="w-2.5 h-2.5 rounded-[3px] bg-[#E0245E]" />
                Stop
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Closing — bubble expands to full screen, masking the return of the main window */}
      <AnimatePresence>
        {phase === 'closing' && (
          <motion.div
            className="absolute left-1/2 z-[70] flex items-center justify-center"
            style={{ bottom: BAR_BOTTOM + BAR_H + 18, x: '-50%', background: 'rgba(238,241,247,0.98)' }}
            initial={{ width: BAR_W, height: BUBBLE_H, borderRadius: 24, opacity: 1 }}
            animate={{ width: '100vw', height: '100vh', borderRadius: 0, bottom: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-[15px] text-[#11315D] opacity-0">{errored || summary}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
