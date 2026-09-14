import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WorkflowsPanel from '../WorkflowsPanel';
import {
  X, ThumbsUp, ThumbsDown, RotateCw, Copy, MoreHorizontal, Check,
  Code, Github, Terminal, Box, Gitlab, HelpCircle, Cpu, Smartphone, Send, Cloud, CloudLightning,
  PenTool, Image, Feather, Video, Zap, Palette, Globe, Layout, MousePointer, BookOpen, MessageSquare,
  Trello, CheckSquare, Columns, List, Layers, Target, BarChart2, Mail, Search, Share2, Users, Grid,
  FileText, Table, File, VideoOff, Play, CreditCard, Link2,
  Database, Server, Shield, Sparkles, Bot, Lock, Calendar, DollarSign, ShoppingCart, Music, Mic, Folder,
  Compass, Briefcase, Clock, Settings, Activity, Sliders, Eye, Book, Flame, ArrowRight,
  ChevronDown, Plus
} from 'lucide-react';

const A = "https://qclay.design/lovable/sixsense";

const FONT = '"Inter Tight", sans-serif';

// Shared popover shell — sits above its trigger button, with a click-away backdrop.
function Popover({ children, width = 300, onClose }: { children: ReactNode; width?: number; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-full left-0 mb-2 z-50 rounded-[16px] bg-white p-2 text-left"
        style={{ width, border: '1px solid rgba(34,106,205,0.08)', boxShadow: '0 16px 40px rgba(0,0,0,0.14), 0 4px 10px rgba(0,0,0,0.06)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </>
  );
}

// Model selector — Cofounder runs on a single model: Claude Sonnet 4.6 on Amazon Bedrock.
function ModelMenu({ families, onClose }: { families: { family: string; models: { name: string; desc: string }[] }[]; onClose: () => void }) {
  return (
    <Popover width={320} onClose={onClose}>
      <div className="max-h-[330px] overflow-y-auto scrollbar-none pr-0.5">
        {families.map((fam) => (
          <div key={fam.family}>
            <div className="px-1.5 pb-1 text-[10.5px] font-semibold uppercase tracking-wide text-[rgba(13,27,75,0.35)]" style={{ fontFamily: FONT }}>{fam.family}</div>
            {fam.models.map((m) => (
              <button key={m.name} className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-[10px] bg-[#E8F1FF] border border-[#3D82DE] text-left cursor-pointer" style={{ fontFamily: FONT }}>
                <div className="w-4 h-4 mt-0.5 rounded-[5px] flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(166deg, #A0E4FF 9.8%, #9CA4FB 184.41%)' }}>
                  <img src={`${A}/ai-select.svg`} alt="" className="w-2.5 h-2.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold text-[#0D1B4B]">{m.name}</span>
                  <span className="text-[11.5px] text-[rgba(13,27,75,0.5)] leading-snug">{m.desc}</span>
                </div>
                <Check className="w-4 h-4 ml-auto mt-0.5 text-[#3D82DE]" />
              </button>
            ))}
          </div>
        ))}
      </div>
    </Popover>
  );
}

function RecordPopover({ onClose }: { onClose: () => void }) {
  return (
    <Popover width={290} onClose={onClose}>
      <div className="flex items-center gap-2 px-1.5 pt-1 pb-1.5">
        <Video className="w-4 h-4 text-[#3D82DE]" />
        <span className="text-[13.5px] font-semibold text-[#0D1B4B]" style={{ fontFamily: FONT }}>Record &amp; Replay</span>
      </div>
      <p className="px-1.5 text-[12px] leading-snug text-[rgba(13,27,75,0.6)]" style={{ fontFamily: FONT }}>
        Record your screen and show Cofounder a repetitive task once. Cofounder learns it and replays it automatically whenever you need — no setup, no scripts.
      </p>
      <button disabled className="mt-2.5 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-[12px] text-[13px] font-medium text-[rgba(13,27,75,0.5)] bg-[rgba(0,0,0,0.05)] cursor-not-allowed" style={{ fontFamily: FONT }}>
        <Lock className="w-3.5 h-3.5" /> Start recording · Launching Soon
      </button>
    </Popover>
  );
}

function StylePopover(props: {
  styles: { id: string; name: string; prompt: string; builtin: boolean }[];
  activeStyleId: string | null;
  onPick: (id: string) => void;
  onRemove: (id: string) => void;
  draftName: string; draftDesc: string;
  setDraftName: (v: string) => void; setDraftDesc: (v: string) => void;
  busy: boolean; onCreate: () => void; onUploadDocs: () => void; onClose: () => void;
}) {
  const { styles, activeStyleId, onPick, onRemove, draftName, draftDesc, setDraftName, setDraftDesc, busy, onCreate, onUploadDocs, onClose } = props;
  return (
    <Popover width={300} onClose={onClose}>
      <div className="flex items-center gap-2 px-1.5 pt-1 pb-2">
        <Palette className="w-4 h-4 text-[#3D82DE]" />
        <span className="text-[13.5px] font-semibold text-[#0D1B4B]" style={{ fontFamily: FONT }}>Style</span>
      </div>
      <div className="flex flex-col gap-1 max-h-[180px] overflow-y-auto scrollbar-none">
        {styles.map((s) => {
          const active = activeStyleId === s.id;
          return (
            <div key={s.id} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[10px] border cursor-pointer ${active ? 'bg-[#E8F1FF] border-[#3D82DE]' : 'bg-white border-[rgba(0,0,0,0.06)] hover:bg-[rgba(0,0,0,0.02)]'}`} onClick={() => onPick(s.id)}>
              <span className={`text-[13px] ${active ? 'font-semibold text-[#0D1B4B]' : 'font-normal text-[rgba(13,27,75,0.75)]'}`} style={{ fontFamily: FONT }}>{s.name}</span>
              {active && <Check className="w-3.5 h-3.5 text-[#3D82DE]" />}
              {!s.builtin && (
                <button onClick={(e) => { e.stopPropagation(); onRemove(s.id); }} className="ml-auto text-[rgba(13,27,75,0.3)] hover:text-[rgba(13,27,75,0.7)] cursor-pointer"><X className="w-3 h-3" /></button>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-2 pt-2 border-t border-[rgba(0,0,0,0.05)]">
        <span className="px-1.5 text-[11px] font-semibold uppercase tracking-wide text-[rgba(13,27,75,0.35)]" style={{ fontFamily: FONT }}>Add a style</span>
        <input value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="Style name" className="mt-1.5 w-full bg-[#F4F7FB] border border-[rgba(0,0,0,0.05)] rounded-[10px] px-2.5 py-1.5 outline-none text-[12.5px] text-[#0D1B4B] focus:border-[#3D82DE]" style={{ fontFamily: FONT }} />
        <textarea value={draftDesc} onChange={(e) => setDraftDesc(e.target.value)} placeholder="Describe the style (tone, format…) and Cofounder will write it." rows={2} className="mt-1.5 w-full resize-none bg-[#F4F7FB] border border-[rgba(0,0,0,0.05)] rounded-[10px] px-2.5 py-1.5 outline-none text-[12.5px] text-[#0D1B4B] focus:border-[#3D82DE]" style={{ fontFamily: FONT }} />
        <div className="flex items-center gap-1.5 mt-1.5">
          <button onClick={onCreate} disabled={busy || !draftDesc.trim()} className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-[10px] text-[12.5px] font-medium text-white bg-gradient-to-b from-[#70A8F2] to-[#3D82DE] hover:from-[#80B8FF] hover:to-[#4D92EE] disabled:opacity-50 cursor-pointer" style={{ fontFamily: FONT }}>
            <Sparkles className="w-3.5 h-3.5" /> {busy ? 'Writing…' : 'Create with Cofounder'}
          </button>
          <button onClick={onUploadDocs} className="px-2.5 py-1.5 rounded-[10px] text-[12.5px] font-medium text-[#3D82DE] border border-[rgba(61,130,222,0.25)] hover:bg-[#E8F1FF] cursor-pointer" style={{ fontFamily: FONT }} title="Use documents">Docs</button>
        </div>
      </div>
    </Popover>
  );
}

function SkillsPopover(props: {
  skills: { id: string; name: string; content: string }[];
  activeSkillIds: string[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  draftName: string; draftBody: string;
  setDraftName: (v: string) => void; setDraftBody: (v: string) => void;
  onAdd: () => void; onClose: () => void;
}) {
  const { skills, activeSkillIds, onToggle, onRemove, draftName, draftBody, setDraftName, setDraftBody, onAdd, onClose } = props;
  return (
    <Popover width={300} onClose={onClose}>
      <div className="flex items-center gap-2 px-1.5 pt-1 pb-1.5">
        <Sparkles className="w-4 h-4 text-[#3D82DE]" />
        <span className="text-[13.5px] font-semibold text-[#0D1B4B]" style={{ fontFamily: FONT }}>Skills</span>
      </div>
      <p className="px-1.5 text-[11.5px] leading-snug text-[rgba(13,27,75,0.55)]" style={{ fontFamily: FONT }}>
        Connect skills by pasting a <span className="font-medium">.md</span> file — or drop one on the bar — then invoke them.
      </p>
      <div className="flex flex-col gap-1 mt-2 max-h-[150px] overflow-y-auto scrollbar-none">
        {skills.length === 0 && (
          <span className="px-2.5 py-2 text-[12px] text-[rgba(13,27,75,0.4)]" style={{ fontFamily: FONT }}>No skills connected yet.</span>
        )}
        {skills.map((s) => {
          const active = activeSkillIds.includes(s.id);
          return (
            <div key={s.id} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[10px] border cursor-pointer ${active ? 'bg-[#E8F1FF] border-[#3D82DE]' : 'bg-white border-[rgba(0,0,0,0.06)] hover:bg-[rgba(0,0,0,0.02)]'}`} onClick={() => onToggle(s.id)}>
              <Sparkles className={`w-3.5 h-3.5 ${active ? 'text-[#3D82DE]' : 'text-[rgba(13,27,75,0.4)]'}`} />
              <span className={`text-[13px] truncate ${active ? 'font-semibold text-[#0D1B4B]' : 'font-normal text-[rgba(13,27,75,0.75)]'}`} style={{ fontFamily: FONT }}>{s.name}</span>
              {active && <Check className="w-3.5 h-3.5 text-[#3D82DE]" />}
              <button onClick={(e) => { e.stopPropagation(); onRemove(s.id); }} className="ml-auto text-[rgba(13,27,75,0.3)] hover:text-[rgba(13,27,75,0.7)] cursor-pointer"><X className="w-3 h-3" /></button>
            </div>
          );
        })}
      </div>
      <div className="mt-2 pt-2 border-t border-[rgba(0,0,0,0.05)]">
        <input value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="Skill name" className="w-full bg-[#F4F7FB] border border-[rgba(0,0,0,0.05)] rounded-[10px] px-2.5 py-1.5 outline-none text-[12.5px] text-[#0D1B4B] focus:border-[#3D82DE]" style={{ fontFamily: FONT }} />
        <textarea value={draftBody} onChange={(e) => setDraftBody(e.target.value)} placeholder="Paste the .md content here…" rows={3} className="mt-1.5 w-full resize-none bg-[#F4F7FB] border border-[rgba(0,0,0,0.05)] rounded-[10px] px-2.5 py-1.5 outline-none text-[12.5px] text-[#0D1B4B] focus:border-[#3D82DE]" style={{ fontFamily: FONT }} />
        <button onClick={onAdd} disabled={!draftBody.trim()} className="mt-1.5 w-full flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-[10px] text-[12.5px] font-medium text-white bg-gradient-to-b from-[#70A8F2] to-[#3D82DE] hover:from-[#80B8FF] hover:to-[#4D92EE] disabled:opacity-50 cursor-pointer" style={{ fontFamily: FONT }}>
          <Plus className="w-3.5 h-3.5" /> Add skill
        </button>
      </div>
    </Popover>
  );
}

// --- PREDEFINED TOOLS LIST ---
const PREDEFINED_TOOLS = [
  {
    "name": "VS Code",
    "icon": "Code",
    "category": "Development"
  },
  {
    "name": "GitHub",
    "icon": "Github",
    "category": "Development"
  },
  {
    "name": "Terminal",
    "icon": "Terminal",
    "category": "Development"
  },
  {
    "name": "Docker",
    "icon": "Box",
    "category": "Development"
  },
  {
    "name": "GitLab",
    "icon": "Gitlab",
    "category": "Development"
  },
  {
    "name": "Stack Overflow",
    "icon": "HelpCircle",
    "category": "Development"
  },
  {
    "name": "Xcode",
    "icon": "Cpu",
    "category": "Development"
  },
  {
    "name": "Android Studio",
    "icon": "Smartphone",
    "category": "Development"
  },
  {
    "name": "Postman",
    "icon": "Send",
    "category": "Development"
  },
  {
    "name": "AWS",
    "icon": "Cloud",
    "category": "Development"
  },
  {
    "name": "Google Cloud",
    "icon": "CloudLightning",
    "category": "Development"
  },
  {
    "name": "Vercel",
    "icon": "Globe",
    "category": "Development"
  },
  {
    "name": "Netlify",
    "icon": "Globe",
    "category": "Development"
  },
  {
    "name": "IntelliJ IDEA",
    "icon": "Code",
    "category": "Development"
  },
  {
    "name": "PyCharm",
    "icon": "Code",
    "category": "Development"
  },
  {
    "name": "WebStorm",
    "icon": "Code",
    "category": "Development"
  },
  {
    "name": "Sublime Text",
    "icon": "FileText",
    "category": "Development"
  },
  {
    "name": "Vim",
    "icon": "Terminal",
    "category": "Development"
  },
  {
    "name": "Eclipse",
    "icon": "Code",
    "category": "Development"
  },
  {
    "name": "Kubernetes",
    "icon": "Box",
    "category": "Development"
  },
  {
    "name": "Bitbucket",
    "icon": "Gitlab",
    "category": "Development"
  },
  {
    "name": "Supabase",
    "icon": "Database",
    "category": "Development"
  },
  {
    "name": "Firebase",
    "icon": "Flame",
    "category": "Development"
  },
  {
    "name": "DigitalOcean",
    "icon": "Cloud",
    "category": "Development"
  },
  {
    "name": "Azure",
    "icon": "Cloud",
    "category": "Development"
  },
  {
    "name": "Cloudflare",
    "icon": "Shield",
    "category": "Development"
  },
  {
    "name": "Jenkins",
    "icon": "Server",
    "category": "Development"
  },
  {
    "name": "PostgreSQL",
    "icon": "Database",
    "category": "Development"
  },
  {
    "name": "MySQL",
    "icon": "Database",
    "category": "Development"
  },
  {
    "name": "MongoDB",
    "icon": "Database",
    "category": "Development"
  },
  {
    "name": "Redis",
    "icon": "Database",
    "category": "Development"
  },
  {
    "name": "SQLite",
    "icon": "Database",
    "category": "Development"
  },
  {
    "name": "Deno",
    "icon": "Code",
    "category": "Development"
  },
  {
    "name": "Node.js",
    "icon": "Terminal",
    "category": "Development"
  },
  {
    "name": "Heroku",
    "icon": "Cloud",
    "category": "Development"
  },
  {
    "name": "Figma",
    "icon": "PenTool",
    "category": "Design"
  },
  {
    "name": "Photoshop",
    "icon": "Image",
    "category": "Design"
  },
  {
    "name": "Illustrator",
    "icon": "Feather",
    "category": "Design"
  },
  {
    "name": "Premiere Pro",
    "icon": "Video",
    "category": "Design"
  },
  {
    "name": "After Effects",
    "icon": "Zap",
    "category": "Design"
  },
  {
    "name": "Canva",
    "icon": "Palette",
    "category": "Design"
  },
  {
    "name": "Sketch",
    "icon": "Layout",
    "category": "Design"
  },
  {
    "name": "Blender",
    "icon": "Globe",
    "category": "Design"
  },
  {
    "name": "Framer",
    "icon": "Layout",
    "category": "Design"
  },
  {
    "name": "Webflow",
    "icon": "MousePointer",
    "category": "Design"
  },
  {
    "name": "Lightroom",
    "icon": "Image",
    "category": "Design"
  },
  {
    "name": "InDesign",
    "icon": "BookOpen",
    "category": "Design"
  },
  {
    "name": "Adobe XD",
    "icon": "PenTool",
    "category": "Design"
  },
  {
    "name": "Audition",
    "icon": "Music",
    "category": "Design"
  },
  {
    "name": "Penpot",
    "icon": "PenTool",
    "category": "Design"
  },
  {
    "name": "Marvel",
    "icon": "Layout",
    "category": "Design"
  },
  {
    "name": "InVision",
    "icon": "Layers",
    "category": "Design"
  },
  {
    "name": "Zeplin",
    "icon": "Layers",
    "category": "Design"
  },
  {
    "name": "Abstract",
    "icon": "Layers",
    "category": "Design"
  },
  {
    "name": "Procreate",
    "icon": "Palette",
    "category": "Design"
  },
  {
    "name": "Affinity Designer",
    "icon": "Feather",
    "category": "Design"
  },
  {
    "name": "Affinity Photo",
    "icon": "Image",
    "category": "Design"
  },
  {
    "name": "Miro",
    "icon": "Grid",
    "category": "Design"
  },
  {
    "name": "Whimsical",
    "icon": "Grid",
    "category": "Design"
  },
  {
    "name": "Balsamiq",
    "icon": "Layout",
    "category": "Design"
  },
  {
    "name": "Axure RP",
    "icon": "Layout",
    "category": "Design"
  },
  {
    "name": "Proto.io",
    "icon": "Smartphone",
    "category": "Design"
  },
  {
    "name": "CorelDRAW",
    "icon": "Feather",
    "category": "Design"
  },
  {
    "name": "Cinema 4D",
    "icon": "Globe",
    "category": "Design"
  },
  {
    "name": "Figma FigJam",
    "icon": "Grid",
    "category": "Design"
  },
  {
    "name": "Figma Slides",
    "icon": "Layout",
    "category": "Design"
  },
  {
    "name": "Framer Motion",
    "icon": "Zap",
    "category": "Design"
  },
  {
    "name": "Rive",
    "icon": "Play",
    "category": "Design"
  },
  {
    "name": "Spline",
    "icon": "Globe",
    "category": "Design"
  },
  {
    "name": "Keynote",
    "icon": "Layout",
    "category": "Design"
  },
  {
    "name": "Notion",
    "icon": "BookOpen",
    "category": "Productivity"
  },
  {
    "name": "Slack",
    "icon": "MessageSquare",
    "category": "Productivity"
  },
  {
    "name": "Teams",
    "icon": "Users",
    "category": "Productivity"
  },
  {
    "name": "Zoom",
    "icon": "VideoOff",
    "category": "Productivity"
  },
  {
    "name": "Loom",
    "icon": "Play",
    "category": "Productivity"
  },
  {
    "name": "Google Sheets",
    "icon": "Grid",
    "category": "Productivity"
  },
  {
    "name": "Google Docs",
    "icon": "FileText",
    "category": "Productivity"
  },
  {
    "name": "Google Slides",
    "icon": "Layout",
    "category": "Productivity"
  },
  {
    "name": "Microsoft Excel",
    "icon": "Table",
    "category": "Productivity"
  },
  {
    "name": "Microsoft Word",
    "icon": "File",
    "category": "Productivity"
  },
  {
    "name": "Microsoft PowerPoint",
    "icon": "Layout",
    "category": "Productivity"
  },
  {
    "name": "Outlook",
    "icon": "Mail",
    "category": "Productivity"
  },
  {
    "name": "Gmail",
    "icon": "Mail",
    "category": "Productivity"
  },
  {
    "name": "Google Calendar",
    "icon": "Calendar",
    "category": "Productivity"
  },
  {
    "name": "Apple Notes",
    "icon": "FileText",
    "category": "Productivity"
  },
  {
    "name": "Obsidian",
    "icon": "BookOpen",
    "category": "Productivity"
  },
  {
    "name": "Evernote",
    "icon": "FileText",
    "category": "Productivity"
  },
  {
    "name": "Roam Research",
    "icon": "BookOpen",
    "category": "Productivity"
  },
  {
    "name": "Bear",
    "icon": "Feather",
    "category": "Productivity"
  },
  {
    "name": "Todoist",
    "icon": "CheckSquare",
    "category": "Productivity"
  },
  {
    "name": "Things",
    "icon": "CheckSquare",
    "category": "Productivity"
  },
  {
    "name": "TickTick",
    "icon": "CheckSquare",
    "category": "Productivity"
  },
  {
    "name": "Microsoft To Do",
    "icon": "CheckSquare",
    "category": "Productivity"
  },
  {
    "name": "Google Keep",
    "icon": "FileText",
    "category": "Productivity"
  },
  {
    "name": "Superhuman",
    "icon": "Mail",
    "category": "Productivity"
  },
  {
    "name": "Calendar.com",
    "icon": "Calendar",
    "category": "Productivity"
  },
  {
    "name": "Calendly",
    "icon": "Calendar",
    "category": "Productivity"
  },
  {
    "name": "Dropbox",
    "icon": "Folder",
    "category": "Productivity"
  },
  {
    "name": "Google Drive",
    "icon": "Folder",
    "category": "Productivity"
  },
  {
    "name": "Box.com",
    "icon": "Folder",
    "category": "Productivity"
  },
  {
    "name": "Jira",
    "icon": "Trello",
    "category": "Management"
  },
  {
    "name": "Linear",
    "icon": "CheckSquare",
    "category": "Management"
  },
  {
    "name": "Trello",
    "icon": "Columns",
    "category": "Management"
  },
  {
    "name": "Asana",
    "icon": "List",
    "category": "Management"
  },
  {
    "name": "ClickUp",
    "icon": "Layers",
    "category": "Management"
  },
  {
    "name": "Monday.com",
    "icon": "Columns",
    "category": "Management"
  },
  {
    "name": "Basecamp",
    "icon": "Briefcase",
    "category": "Management"
  },
  {
    "name": "Wrike",
    "icon": "List",
    "category": "Management"
  },
  {
    "name": "Airtable",
    "icon": "Table",
    "category": "Management"
  },
  {
    "name": "Smartsheet",
    "icon": "Table",
    "category": "Management"
  },
  {
    "name": "Productboard",
    "icon": "Target",
    "category": "Management"
  },
  {
    "name": "Shortcut",
    "icon": "CheckSquare",
    "category": "Management"
  },
  {
    "name": "Teamwork",
    "icon": "Briefcase",
    "category": "Management"
  },
  {
    "name": "Confluence",
    "icon": "BookOpen",
    "category": "Management"
  },
  {
    "name": "Miro Board",
    "icon": "Grid",
    "category": "Management"
  },
  {
    "name": "Notion Project",
    "icon": "BookOpen",
    "category": "Management"
  },
  {
    "name": "Hive",
    "icon": "Layers",
    "category": "Management"
  },
  {
    "name": "Podio",
    "icon": "Briefcase",
    "category": "Management"
  },
  {
    "name": "Aha!",
    "icon": "Target",
    "category": "Management"
  },
  {
    "name": "Paymo",
    "icon": "Clock",
    "category": "Management"
  },
  {
    "name": "Toggl Track",
    "icon": "Clock",
    "category": "Management"
  },
  {
    "name": "Harvest",
    "icon": "Clock",
    "category": "Management"
  },
  {
    "name": "Everhour",
    "icon": "Clock",
    "category": "Management"
  },
  {
    "name": "Float",
    "icon": "Calendar",
    "category": "Management"
  },
  {
    "name": "Resource Guru",
    "icon": "Calendar",
    "category": "Management"
  },
  {
    "name": "HubSpot",
    "icon": "Target",
    "category": "Marketing"
  },
  {
    "name": "Google Analytics",
    "icon": "BarChart2",
    "category": "Marketing"
  },
  {
    "name": "Mailchimp",
    "icon": "Mail",
    "category": "Marketing"
  },
  {
    "name": "SEMrush",
    "icon": "Search",
    "category": "Marketing"
  },
  {
    "name": "Buffer",
    "icon": "Share2",
    "category": "Marketing"
  },
  {
    "name": "Salesforce",
    "icon": "Users",
    "category": "Marketing"
  },
  {
    "name": "ActiveCampaign",
    "icon": "Mail",
    "category": "Marketing"
  },
  {
    "name": "Klaviyo",
    "icon": "Mail",
    "category": "Marketing"
  },
  {
    "name": "SendGrid",
    "icon": "Send",
    "category": "Marketing"
  },
  {
    "name": "Hootsuite",
    "icon": "Share2",
    "category": "Marketing"
  },
  {
    "name": "Sprout Social",
    "icon": "Share2",
    "category": "Marketing"
  },
  {
    "name": "Ahrefs",
    "icon": "Search",
    "category": "Marketing"
  },
  {
    "name": "Moz",
    "icon": "Search",
    "category": "Marketing"
  },
  {
    "name": "ConvertKit",
    "icon": "Mail",
    "category": "Marketing"
  },
  {
    "name": "Typeform",
    "icon": "FileText",
    "category": "Marketing"
  },
  {
    "name": "Jotform",
    "icon": "FileText",
    "category": "Marketing"
  },
  {
    "name": "SurveyMonkey",
    "icon": "FileText",
    "category": "Marketing"
  },
  {
    "name": "Marketo",
    "icon": "Target",
    "category": "Marketing"
  },
  {
    "name": "Pipedrive",
    "icon": "Users",
    "category": "Marketing"
  },
  {
    "name": "Close CRM",
    "icon": "Users",
    "category": "Marketing"
  },
  {
    "name": "Zoho CRM",
    "icon": "Users",
    "category": "Marketing"
  },
  {
    "name": "Copper CRM",
    "icon": "Users",
    "category": "Marketing"
  },
  {
    "name": "Intercom",
    "icon": "MessageSquare",
    "category": "Marketing"
  },
  {
    "name": "Zendesk",
    "icon": "MessageSquare",
    "category": "Marketing"
  },
  {
    "name": "Google Search Console",
    "icon": "Search",
    "category": "Marketing"
  },
  {
    "name": "Hotjar",
    "icon": "Eye",
    "category": "Marketing"
  },
  {
    "name": "Mixpanel",
    "icon": "BarChart2",
    "category": "Marketing"
  },
  {
    "name": "Amplitude",
    "icon": "BarChart2",
    "category": "Marketing"
  },
  {
    "name": "Optimizely",
    "icon": "Activity",
    "category": "Marketing"
  },
  {
    "name": "VWO",
    "icon": "Activity",
    "category": "Marketing"
  },
  {
    "name": "Stripe",
    "icon": "CreditCard",
    "category": "Finance"
  },
  {
    "name": "QuickBooks",
    "icon": "DollarSign",
    "category": "Finance"
  },
  {
    "name": "Xero",
    "icon": "DollarSign",
    "category": "Finance"
  },
  {
    "name": "PayPal",
    "icon": "CreditCard",
    "category": "Finance"
  },
  {
    "name": "Wise",
    "icon": "Globe",
    "category": "Finance"
  },
  {
    "name": "Bill.com",
    "icon": "CreditCard",
    "category": "Finance"
  },
  {
    "name": "Expensify",
    "icon": "FileText",
    "category": "Finance"
  },
  {
    "name": "Gusto",
    "icon": "Users",
    "category": "Finance"
  },
  {
    "name": "Deel",
    "icon": "Globe",
    "category": "Finance"
  },
  {
    "name": "Wave Accounting",
    "icon": "DollarSign",
    "category": "Finance"
  },
  {
    "name": "FreshBooks",
    "icon": "DollarSign",
    "category": "Finance"
  },
  {
    "name": "BambooHR",
    "icon": "Users",
    "category": "Finance"
  },
  {
    "name": "Rippling",
    "icon": "Layers",
    "category": "Finance"
  },
  {
    "name": "Brex",
    "icon": "CreditCard",
    "category": "Finance"
  },
  {
    "name": "Ramp",
    "icon": "CreditCard",
    "category": "Finance"
  },
  {
    "name": "Mercury Bank",
    "icon": "CreditCard",
    "category": "Finance"
  },
  {
    "name": "Expensify App",
    "icon": "FileText",
    "category": "Finance"
  },
  {
    "name": "Payfit",
    "icon": "DollarSign",
    "category": "Finance"
  },
  {
    "name": "TriNet",
    "icon": "Briefcase",
    "category": "Finance"
  },
  {
    "name": "Justworks",
    "icon": "Briefcase",
    "category": "Finance"
  },
  {
    "name": "Zapier",
    "icon": "Link2",
    "category": "Automation"
  },
  {
    "name": "Make",
    "icon": "Sparkles",
    "category": "Automation"
  },
  {
    "name": "IFTTT",
    "icon": "Link2",
    "category": "Automation"
  },
  {
    "name": "n8n",
    "icon": "Sparkles",
    "category": "Automation"
  },
  {
    "name": "Workato",
    "icon": "Settings",
    "category": "Automation"
  },
  {
    "name": "Tray.io",
    "icon": "Settings",
    "category": "Automation"
  },
  {
    "name": "Power Automate",
    "icon": "Sliders",
    "category": "Automation"
  },
  {
    "name": "ChatGPT",
    "icon": "Bot",
    "category": "AI"
  },
  {
    "name": "Claude",
    "icon": "Bot",
    "category": "AI"
  },
  {
    "name": "Gemini",
    "icon": "Sparkles",
    "category": "AI"
  },
  {
    "name": "Midjourney",
    "icon": "Image",
    "category": "AI"
  },
  {
    "name": "Stable Diffusion",
    "icon": "Image",
    "category": "AI"
  },
  {
    "name": "Jasper AI",
    "icon": "Feather",
    "category": "AI"
  },
  {
    "name": "Copy.ai",
    "icon": "Feather",
    "category": "AI"
  },
  {
    "name": "Runway ML",
    "icon": "Video",
    "category": "AI"
  },
  {
    "name": "ElevenLabs",
    "icon": "Mic",
    "category": "AI"
  },
  {
    "name": "Cursor AI",
    "icon": "Code",
    "category": "AI"
  },
  {
    "name": "v0.dev",
    "icon": "Layout",
    "category": "AI"
  },
  {
    "name": "Copilot",
    "icon": "Bot",
    "category": "AI"
  },
  {
    "name": "Perplexity",
    "icon": "Search",
    "category": "AI"
  },
  {
    "name": "Phind",
    "icon": "Search",
    "category": "AI"
  },
  {
    "name": "Synthesia",
    "icon": "Video",
    "category": "AI"
  },
  {
    "name": "Descript",
    "icon": "Mic",
    "category": "AI"
  },
  {
    "name": "Otter.ai",
    "icon": "Mic",
    "category": "AI"
  },
  {
    "name": "Fireflies.ai",
    "icon": "Mic",
    "category": "AI"
  },
  {
    "name": "Shopify",
    "icon": "ShoppingCart",
    "category": "E-commerce"
  },
  {
    "name": "WooCommerce",
    "icon": "ShoppingCart",
    "category": "E-commerce"
  },
  {
    "name": "Magento",
    "icon": "ShoppingCart",
    "category": "E-commerce"
  },
  {
    "name": "Squarespace",
    "icon": "Globe",
    "category": "E-commerce"
  },
  {
    "name": "Wix",
    "icon": "Globe",
    "category": "E-commerce"
  },
  {
    "name": "BigCommerce",
    "icon": "ShoppingCart",
    "category": "E-commerce"
  },
  {
    "name": "Webflow Commerce",
    "icon": "ShoppingCart",
    "category": "E-commerce"
  },
  {
    "name": "Stripe Checkout",
    "icon": "CreditCard",
    "category": "E-commerce"
  },
  {
    "name": "Printful",
    "icon": "ShoppingCart",
    "category": "E-commerce"
  },
  {
    "name": "Etsy Store",
    "icon": "ShoppingCart",
    "category": "E-commerce"
  },
  {
    "name": "DaVinci Resolve",
    "icon": "Video",
    "category": "AudioVideo"
  },
  {
    "name": "Final Cut Pro",
    "icon": "Video",
    "category": "AudioVideo"
  },
  {
    "name": "OBS Studio",
    "icon": "Video",
    "category": "AudioVideo"
  },
  {
    "name": "Audacity",
    "icon": "Mic",
    "category": "AudioVideo"
  },
  {
    "name": "Logic Pro",
    "icon": "Music",
    "category": "AudioVideo"
  },
  {
    "name": "GarageBand",
    "icon": "Music",
    "category": "AudioVideo"
  },
  {
    "name": "Ableton Live",
    "icon": "Music",
    "category": "AudioVideo"
  },
  {
    "name": "FL Studio",
    "icon": "Music",
    "category": "AudioVideo"
  },
  {
    "name": "Pro Tools",
    "icon": "Music",
    "category": "AudioVideo"
  },
  {
    "name": "Riverside.fm",
    "icon": "Mic",
    "category": "AudioVideo"
  }
];

const IconMap: { [key: string]: any } = {
  Code, Github, Terminal, Box, Gitlab, HelpCircle, Cpu, Smartphone, Send, Cloud, CloudLightning,
  PenTool, Image, Feather, Video, Zap, Palette, Globe, Layout, MousePointer, BookOpen, MessageSquare,
  Trello, CheckSquare, Columns, List, Layers, Target, BarChart2, Mail, Search, Share2, Users, Grid,
  FileText, Table, File, VideoOff, Play, CreditCard, Link2,
  Database, Server, Shield, Sparkles, Bot, Lock, Calendar, DollarSign, ShoppingCart, Music, Mic, Folder,
  Compass, Briefcase, Clock, Settings, Activity, Sliders, Eye, Book, Flame
};

function getToolIconUrl(toolName: string): string | null {
  const name = toolName.toLowerCase().trim();
  const mapping: { [key: string]: string } = {
    'vs code': 'visualstudiocode',
    'github': 'github',
    'gitlab': 'gitlab',
    'docker': 'docker',
    'stack overflow': 'stackoverflow',
    'xcode': 'xcode',
    'android studio': 'androidstudio',
    'postman': 'postman',
    'aws': 'amazonwebservices',
    'google cloud': 'googlecloud',
    'vercel': 'vercel',
    'netlify': 'netlify',
    'figma': 'figma',
    'photoshop': 'adobephotoshop',
    'illustrator': 'adobeillustrator',
    'premiere pro': 'adobepremierepro',
    'after effects': 'adobeaftereffects',
    'canva': 'canva',
    'sketch': 'sketch',
    'blender': 'blender',
    'framer': 'framer',
    'webflow': 'webflow',
    'notion': 'notion',
    'slack': 'slack',
    'jira': 'jira',
    'linear': 'linear',
    'trello': 'trello',
    'asana': 'asana',
    'clickup': 'clickup',
    'hubspot': 'hubspot',
    'google analytics': 'googleanalytics',
    'mailchimp': 'mailchimp',
    'semrush': 'semrush',
    'buffer': 'buffer',
    'salesforce': 'salesforce',
    'google sheets': 'googlesheets',
    'google docs': 'googledocs',
    'microsoft excel': 'microsoftexcel',
    'microsoft word': 'microsoftword',
    'teams': 'microsoftteams',
    'zoom': 'zoom',
    'loom': 'loom',
    'stripe': 'stripe',
    'zapier': 'zapier',
    'chatgpt': 'openai',
    'claude': 'anthropic',
    'gemini': 'google-gemini',
    'shopify': 'shopify',
    'squarespace': 'squarespace',
    'wix': 'wix',
    'discord': 'discord',
    'telegram': 'telegram',
    'whatsapp': 'whatsapp',
    'figma figjam': 'figma',
    'figma slides': 'figma',
    'framer motion': 'framer',
    'obs studio': 'obsstudio',
    'logic pro': 'apple',
    'garageband': 'apple',
    'final cut pro': 'apple',
    'davinci resolve': 'blackmagicdesign'
  };

  if (mapping[name]) {
    return `https://cdn.simpleicons.org/${mapping[name]}`;
  }

  // Fallback slug generation
  let slug = name
    .replace(/\s+/g, '')
    .replace(/\./g, '')
    .replace(/-/g, '')
    .replace(/!/g, '');

  if (/^[a-z0-9]+$/.test(slug)) {
    return `https://cdn.simpleicons.org/${slug}`;
  }

  return null;
}

function ToolIcon({ iconName, toolName, className, isChecked }: { iconName: string; toolName: string; className?: string; isChecked?: boolean }) {
  const [useFallback, setUseFallback] = useState(false);
  const iconUrl = !useFallback ? getToolIconUrl(toolName) : null;

  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt=""
        className={className}
        onError={() => setUseFallback(true)}
        style={{
          width: '16px',
          height: '16px',
          objectFit: 'contain',
          filter: isChecked === false ? 'grayscale(100%) opacity(0.45)' : 'none',
          transition: 'all 0.2s ease-in-out'
        }}
      />
    );
  }

  const IconComponent = IconMap[iconName] || HelpCircle;
  return <IconComponent className={className} />;
}

// --- MARKDOWN TO JSX PARSER ---
function renderMarkdown(text: string) {
  if (!text) return null;
  const paragraphs = text.split('\n\n');
  return paragraphs.map((para, pIdx) => {
    // Check if it is a list block
    if (para.startsWith('- ') || para.startsWith('* ') || para.includes('\n- ') || para.includes('\n* ')) {
      const lines = para.split('\n');
      const items = lines.map(line => line.replace(/^[\-\*]\s+/, '')).filter(Boolean);
      return (
        <ul key={pIdx} className="list-disc pl-5 my-2 flex flex-col gap-1.5 text-[#0D1B4B]">
          {items.map((item, iIdx) => (
            <li key={iIdx}>{parseInlineMarkdown(item)}</li>
          ))}
        </ul>
      );
    }

    // Check if it is a header
    if (para.startsWith('### ')) {
      return <h3 key={pIdx} className="text-base font-semibold text-[#11315D] mt-4 mb-2">{parseInlineMarkdown(para.replace('### ', ''))}</h3>;
    }
    if (para.startsWith('## ')) {
      return <h2 key={pIdx} className="text-lg font-bold text-[#11315D] mt-5 mb-2.5">{parseInlineMarkdown(para.replace('## ', ''))}</h2>;
    }
    if (para.startsWith('# ')) {
      return <h1 key={pIdx} className="text-xl font-bold text-[#11315D] mt-6 mb-3">{parseInlineMarkdown(para.replace('# ', ''))}</h1>;
    }

    // Regular paragraph
    return (
      <p key={pIdx} className="leading-6 my-2 text-[#0D1B4B]">
        {para.split('\n').map((line, lIdx) => (
          <span key={lIdx}>
            {lIdx > 0 && <br />}
            {parseInlineMarkdown(line)}
          </span>
        ))}
      </p>
    );
  });
}

function parseInlineMarkdown(text: string): React.ReactNode[] {
  const tokens = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return tokens.map((token, idx) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return <strong key={idx} className="font-semibold text-[#11315D]">{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith('*') && token.endsWith('*')) {
      return <em key={idx} className="italic">{token.slice(1, -1)}</em>;
    }
    return token;
  });
}

// --- SPRITE IMAGE CACHE & RASTERIZATION ---
const spriteUrls = [
  '/tiles/tile-empty.svg',
  '/tiles/tile-1.svg',
  '/tiles/tile-2.svg',
  '/tiles/tile-3.svg',
  '/tiles/tile-4.svg',
  '/tiles/tile-5.svg'
];

let spritesPromise: Promise<HTMLImageElement[]> | null = null;
function getSprites(): Promise<HTMLImageElement[]> {
  if (!spritesPromise) {
    spritesPromise = Promise.all(
      spriteUrls.map(url => {
        return new Promise<HTMLImageElement>(resolve => {
          const img = new window.Image();
          img.src = url;
          img.onload = () => resolve(img);
          img.onerror = () => {
            console.error("Failed to load sprite:", url);
            resolve(img); // Resolve anyway to avoid breaking Promise.all
          };
        });
      })
    );
  }
  return spritesPromise;
}

let offscreenCanvasesPromise: Promise<HTMLCanvasElement[]> | null = null;
function getRasterizedSprites(): Promise<HTMLCanvasElement[]> {
  if (!offscreenCanvasesPromise) {
    offscreenCanvasesPromise = getSprites().then(images => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const size = 32 * dpr;
      return images.map(img => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, size, size);
        }
        return canvas;
      });
    });
  }
  return offscreenCanvasesPromise;
}

// --- PIXEL GRID COMPONENT ---
interface PixelGridProps {
  side: 'left' | 'right';
}

interface Cell {
  c: number;
  r: number;
  baseOn: boolean;
  revealOn: boolean;
  flickerOn: boolean;
  noise: number;
  spriteIdx: number;
  hovered: boolean;
  hoverActive: boolean;
}

function PixelGrid({ side }: PixelGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cellsRef = useRef<Cell[]>([]);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const revealOrderRef = useRef<number[]>([]);
  const revealCountRef = useRef(0);
  const lastTimeRef = useRef<number>(0);
  
  // Timing variables
  const lastAmbientTimeRef = useRef<number>(0);
  const nextAmbientDelayRef = useRef<number>(120);
  const lastHoverFlickerTimeRef = useRef<number>(0);
  const nextHoverFlickerDelayRef = useRef<number>(70);

  // Cached sprites
  const spritesRef = useRef<HTMLCanvasElement[]>([]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Load and cache sprites
    getRasterizedSprites().then(canvases => {
      spritesRef.current = canvases;
    });

    const cols = 12;
    const rows = 16;
    const totalCells = cols * rows;
    const baseOnCount = Math.round(totalCells * 0.35); // ~67 cells

    // Shuffle cell indices using Fisher-Yates
    const indices = Array.from({ length: totalCells }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const baseOnSet = new Set(indices.slice(0, baseOnCount));
    revealOrderRef.current = indices.slice(0, baseOnCount);

    const initialCells: Cell[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        initialCells.push({
          c,
          r,
          baseOn: baseOnSet.has(idx),
          revealOn: prefersReducedMotion,
          flickerOn: false,
          noise: Math.random(),
          spriteIdx: Math.floor(Math.random() * 5), // 0..4 mapped to tile-1..5
          hovered: false,
          hoverActive: false,
        });
      }
    }
    cellsRef.current = initialCells;
    revealCountRef.current = prefersReducedMotion ? baseOnCount : 0;

    // Listen to global pointer events
    const handlePointerMove = (e: PointerEvent) => {
      pointerRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerLeave = () => {
      pointerRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerleave', handlePointerLeave);

    let animationId: number;

    const tick = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
        lastAmbientTimeRef.current = timestamp;
        lastHoverFlickerTimeRef.current = timestamp;
      }
      lastTimeRef.current = timestamp;

      // 1. Reveal Animation on Mount
      if (!prefersReducedMotion && revealCountRef.current < baseOnCount) {
        const nextBatchSize = Math.ceil(totalCells / 18); // 11 cells per tick
        const countToReveal = Math.min(nextBatchSize, baseOnCount - revealCountRef.current);
        for (let i = 0; i < countToReveal; i++) {
          const cellIdx = revealOrderRef.current[revealCountRef.current + i];
          if (cellsRef.current[cellIdx]) {
            cellsRef.current[cellIdx].revealOn = true;
          }
        }
        revealCountRef.current += countToReveal;
      }

      // 2. Ambient Flicker
      if (!prefersReducedMotion && timestamp - lastAmbientTimeRef.current > nextAmbientDelayRef.current) {
        let toggledCount = 0;
        let attempts = 0;
        while (toggledCount < 3 && attempts < 20) {
          attempts++;
          const randomIdx = Math.floor(Math.random() * totalCells);
          const cell = cellsRef.current[randomIdx];
          if (cell && !cell.hovered) {
            cell.flickerOn = !cell.flickerOn;
            toggledCount++;
          }
        }
        lastAmbientTimeRef.current = timestamp;
        nextAmbientDelayRef.current = 120 + Math.random() * 180; // 120ms to 300ms
      }

      // 3. Hover Flicker
      if (!prefersReducedMotion && timestamp - lastHoverFlickerTimeRef.current > nextHoverFlickerDelayRef.current) {
        const hoveredCells = cellsRef.current.filter(c => c.hovered);
        if (hoveredCells.length > 0) {
          const cellsToFlickerCount = Math.ceil(hoveredCells.length * 0.18);
          for (let i = 0; i < cellsToFlickerCount; i++) {
            const randomCell = hoveredCells[Math.floor(Math.random() * hoveredCells.length)];
            randomCell.hoverActive = Math.random() < 0.7; // re-randomize with HOVER_FILL_RATIO
          }
        }
        lastHoverFlickerTimeRef.current = timestamp;
        nextHoverFlickerDelayRef.current = 70 + Math.random() * 90; // 70ms to 160ms
      }

      // 4. Hover Blob Calculation (Window-level pointer)
      const canvas = canvasRef.current;
      if (canvas && pointerRef.current) {
        const rect = canvas.getBoundingClientRect();
        const px = pointerRef.current.x - rect.left;
        const py = pointerRef.current.y - rect.top;
        const px_units = px / 33;
        const py_units = py / 33;

        const t = timestamp;

        for (let i = 0; i < totalCells; i++) {
          const cell = cellsRef.current[i];
          const cx_units = cell.c + 0.5;
          const cy_units = cell.r + 0.5;

          const dx = cx_units - px_units;
          const dy = cy_units - py_units;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const angle = Math.atan2(dy, dx);
          
          // Organic modulation formula
          const rMod = Math.sin(angle * 3 + t * 0.0011) * 0.55 + 
                        Math.sin(angle * 5 - t * 0.0017 + 1.3) * 0.30 + 
                        Math.sin(angle * 2 + t * 0.0007 + 2.1) * 0.20;
          const rMax = 4 * (1 + rMod) * (0.95 + cell.noise * 0.30);

          const inBlob = dist <= rMax - 0.5 || 
                         (dist > rMax - 0.5 && dist <= rMax + 0.4 && 
                          (Math.sin(cell.c * 12.9898 + cell.r * 78.233 + t * 0.002) + 1) * 0.5 > 0.45);

          if (inBlob) {
            if (!cell.hovered) {
              cell.hovered = true;
              cell.hoverActive = Math.random() < 0.7; // base HOVER_FILL_RATIO
            }
          } else {
            cell.hovered = false;
          }
        }
      } else if (canvas && !pointerRef.current) {
        // Release all hovered cells if pointer leaves
        for (let i = 0; i < totalCells; i++) {
          cellsRef.current[i].hovered = false;
        }
      }

      // 5. Draw Frame to Canvas
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx && spritesRef.current.length > 0) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < totalCells; i++) {
          const cell = cellsRef.current[i];
          const isOn = cell.hovered ? cell.hoverActive : (cell.revealOn && (cell.baseOn !== cell.flickerOn));
          
          const spriteCanvas = isOn ? spritesRef.current[cell.spriteIdx + 1] : spritesRef.current[0];
          
          if (spriteCanvas) {
            const x = cell.c * 33 * dpr;
            const y = cell.r * 33 * dpr;
            const size = 32 * dpr;
            ctx.drawImage(spriteCanvas, x, y, size, size);
          }
        }
      }

      animationId = requestAnimationFrame(tick);
    };

    animationId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [side]);

  const maskStyle = side === 'left'
    ? 'radial-gradient(ellipse 80% 80% at 30% 50%, black 0%, transparent 75%)'
    : 'radial-gradient(ellipse 80% 80% at 70% 50%, black 0%, transparent 75%)';

  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

  return (
    <canvas
      ref={canvasRef}
      width={395 * dpr}
      height={527 * dpr}
      className="hidden md:block absolute top-[50%] -translate-y-[40%] z-0 pointer-events-none"
      style={{
        width: '395px',
        height: '527px',
        left: side === 'left' ? 0 : 'auto',
        right: side === 'right' ? 0 : 'auto',
        maskImage: maskStyle,
        WebkitMaskImage: maskStyle,
      }}
    />
  );
}



// --- SEND BUTTON COMPONENT ---
interface SendButtonProps {
  forceHover?: boolean;
  forceToggle?: number;
  onClick?: () => void;
}

function SendButton({ forceHover = false, forceToggle = 0, onClick }: SendButtonProps) {
  const [isBtnHovered, setIsBtnHovered] = useState(false);
  const [arrowToggle, setArrowToggle] = useState(0);

  const isHovered = isBtnHovered || forceHover;
  const activeToggle = arrowToggle + forceToggle;

  const borderRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const rotationRef = useRef(0);
  const speedRef = useRef(0);

  useEffect(() => {
    const updateRotation = (time: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
        requestRef.current = requestAnimationFrame(updateRotation);
        return;
      }
      const dt = Math.min(time - lastTimeRef.current, 50);
      lastTimeRef.current = time;

      const targetSpeed = isHovered ? (360 / 1500) : 0;
      const tau = isHovered ? 250 : 700;
      const k = 1 - Math.exp(-dt / tau);
      speedRef.current += (targetSpeed - speedRef.current) * k;
      rotationRef.current = (rotationRef.current + speedRef.current * dt) % 360;

      if (borderRef.current) {
        borderRef.current.style.transform = `rotate(${rotationRef.current}deg)`;
      }

      if (!isHovered && speedRef.current < 0.0005) {
        requestRef.current = null;
        lastTimeRef.current = null;
        return;
      }

      requestRef.current = requestAnimationFrame(updateRotation);
    };

    if (isHovered || speedRef.current > 0.0005) {
      if (requestRef.current === null) {
        lastTimeRef.current = null;
        requestRef.current = requestAnimationFrame(updateRotation);
      }
    }

    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    };
  }, [isHovered]);

  return (
    <motion.div
      className="relative w-11 h-11 flex items-center justify-center cursor-pointer translate-y-[10%]"
      animate={{ scale: isHovered ? 1.05 : 1 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => {
        setIsBtnHovered(true);
        setArrowToggle(prev => prev + 1);
      }}
      onMouseLeave={() => {
        setIsBtnHovered(false);
      }}
      onClick={onClick}
    >
      {/* Outer halo */}
      <div className="absolute inset-0 rounded-[15px] bg-[rgba(151,195,255,0.15)] z-[1]" />

      {/* Inner card */}
      <div
        className="relative w-9 h-9 rounded-[12px] flex items-center justify-center overflow-hidden z-[2]"
        style={{
          background: 'linear-gradient(180deg, #70A8F2 0%, #3D82DE 100%)',
          boxShadow: 'inset 0 1px 18px 2px rgba(173,208,255,0.20), inset 0 1px 4px 2px rgba(222,236,255,0.80), 0 42px 107px 0 rgba(61,130,222,0.34), 0 10px 10px 0 rgba(61,130,222,0.20), 0 3.714px 4.846px 0 rgba(61,130,222,0.15)',
        }}
      >
        {/* Dots overlay */}
        <img
          src={`${A}/dots.svg`}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-70 z-[2] pointer-events-none"
        />

        {/* Hover shine sweep */}
        {activeToggle > 0 && (
          <motion.div
            key={`blink-${activeToggle}`}
            className="absolute inset-0 pointer-events-none"
            style={{
              zIndex: 4,
              mixBlendMode: 'screen',
              background: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%)',
            }}
            initial={{ x: '-120%' }}
            animate={{ x: '120%' }}
            transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          />
        )}

        {/* Arrow Swap */}
        <div className="relative w-4 h-4 overflow-hidden z-[5] flex items-center justify-center">
          {activeToggle === 0 ? (
            <img src={`${A}/arrow-up.svg`} alt="" className="w-4 h-4" />
          ) : (
            <>
              <motion.img
                key={`out-${activeToggle}`}
                src={`${A}/arrow-up.svg`}
                alt=""
                className="absolute inset-0 w-4 h-4"
                initial={{ y: 0, opacity: 1 }}
                animate={{ y: -16, opacity: 0 }}
                transition={{ duration: 0.32, ease: [0.65, 0, 0.35, 1] }}
              />
              <motion.img
                key={`in-${activeToggle}`}
                src={`${A}/arrow-up.svg`}
                alt=""
                className="absolute inset-0 w-4 h-4"
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.32, ease: [0.65, 0, 0.35, 1] }}
              />
            </>
          )}
        </div>
      </div>

      {/* Spinning border container */}
      <div className="absolute inset-[-1px] rounded-[13px] p-[1px] overflow-hidden pointer-events-none z-[3]">
        <div
          ref={borderRef}
          className="w-full h-full rounded-[12px]"
          style={{
            background: 'conic-gradient(from 0deg, rgba(255,255,255,0) 0deg, #FFFFFF 60deg, #9EC7FF 120deg, rgba(255,255,255,0) 200deg, rgba(255,255,255,0) 360deg)',
            WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
            WebkitMaskComposite: 'xor',
            mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
            maskComposite: 'exclude',
          }}
        />
      </div>

      {/* Static fallback border */}
      <div className="absolute inset-0 rounded-[12px] border border-[#9EC7FF] pointer-events-none z-[4]" />
    </motion.div>
  );
}

// --- INDEX PAGE MAIN COMPONENT ---
const titles = [
  "AI that uses your computer.",
  "AI that actually operates your Mac.",
  "AI that have hands.",
  "AI that put your desktop on autopilot.",
  "AI that clicks for you.",
  "AI for your desktop tasks.",
  "AI that drives your computer.",
  "AI that uses ALL your software.",
  "AI that shift your workflow into autonomous.",
  "AI that let you click less, to achieve more."
];

export default function Index() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [cardsFinished, setCardsFinished] = useState([false, false, false]);

  const cx = 113.67 / 2; // 56.835

  const isAnyCardHovered = hoveredCard !== null;

  // Title Rotation State
  const [titleIdx, setTitleIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTitleIdx((prev) => (prev + 1) % titles.length);
    }, 1700);
    return () => clearInterval(timer);
  }, []);

  // Conversation States
  const [chatActive, setChatActive] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ id: number; sender: 'user' | 'ai'; text: string; reflections?: string[] }[]>([]);
  const [agentLaunching, setAgentLaunching] = useState(false);
  const [openReflections, setOpenReflections] = useState<number | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [aiResponseVisible, setAiResponseVisible] = useState(false);

  // Advanced Flow States
  const [conversationStage, setConversationStage] = useState<
    'initial' | 'asking_job' | 'asking_origin' | 'asking_mode' | 'auth' | 'credits' | 'installing' | 'home' | 'asking_tools' | 'asking_tasks' | 'waitlist' | 'final'
  >('initial');
  const [recommendedTools] = useState<string[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [recommendedTasks] = useState<string[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [sessionId, setSessionId] = useState<string>('');
  const [jobRole, setJobRole] = useState<string>('');

  // Mira desktop onboarding states
  const [originChoice, setOriginChoice] = useState<string>('');
  const [modeChoice, setModeChoice] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [authError, setAuthError] = useState<string>('');
  const [authBusy, setAuthBusy] = useState(false);
  const [account, setAccount] = useState<{ email: string; credits: number; plan: string; waitlistBonus: boolean } | null>(null);
  const [installState, setInstallState] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [installMessage, setInstallMessage] = useState<string>('');
  const [installPercent, setInstallPercent] = useState<number>(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // --- Toolbar: model selector / record&replay / style / skills / attachments ---
  type ToolbarMenu = null | 'model' | 'record' | 'style' | 'skills';
  const [openMenu, setOpenMenu] = useState<ToolbarMenu>(null);
  const [selectedModel] = useState<string>('Claude Sonnet 4.6'); // single model, served by Amazon Bedrock

  type StylePreset = { id: string; name: string; prompt: string; builtin: boolean };
  const [styles, setStyles] = useState<StylePreset[]>([
    { id: 'concise', name: 'Concise', prompt: 'Be brief and to the point. Prefer short sentences and minimal fluff.', builtin: true },
    { id: 'professional', name: 'Professional', prompt: 'Use a polished, professional and confident tone suitable for work.', builtin: true },
    { id: 'friendly', name: 'Friendly', prompt: 'Use a warm, casual and encouraging tone, like a helpful teammate.', builtin: true },
    { id: 'technical', name: 'Technical', prompt: 'Be precise and technical, use exact terminology and structured steps.', builtin: true },
  ]);
  const [activeStyleId, setActiveStyleId] = useState<string | null>(null);
  const [styleDraftName, setStyleDraftName] = useState('');
  const [styleDraftDesc, setStyleDraftDesc] = useState('');
  const [styleBusy, setStyleBusy] = useState(false);

  type Skill = { id: string; name: string; content: string };
  const [skills, setSkills] = useState<Skill[]>([]);
  const [activeSkillIds, setActiveSkillIds] = useState<string[]>([]);
  const [skillDraftName, setSkillDraftName] = useState('');
  const [skillDraftBody, setSkillDraftBody] = useState('');

  type Attachment = { id: string; name: string; type: string; size: number };
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MODEL_FAMILIES: { family: string; models: { name: string; desc: string }[] }[] = [
    { family: 'Amazon Bedrock', models: [
      { name: 'Claude Sonnet 4.6 on Amazon Bedrock', desc: 'The model behind every Cofounder action.' },
    ] },
  ];

  const addFiles = (files: FileList | File[]) => {
    const arr = Array.from(files).map((f) => ({
      id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2, 7)}`,
      name: f.name,
      type: f.type || f.name.split('.').pop() || 'file',
      size: f.size,
    }));
    if (arr.length) setAttachments((prev) => [...prev, ...arr]);
  };

  // Draft a style system-prompt from a free-text description (Bedrock via the main process).
  const createStyleFromDescription = async () => {
    const name = styleDraftName.trim() || 'Custom style';
    const desc = styleDraftDesc.trim();
    if (!desc) return;
    setStyleBusy(true);
    let prompt = desc;
    try {
      if (isDesktop && window.mira) {
        const r = await window.mira.ollama.generate(
          `Write a concise system-prompt (2-3 sentences, imperative voice) that makes an assistant write in this style: "${desc}". Output only the system prompt.`
        );
        if (r.ok && r.text && r.text.trim()) prompt = r.text.trim();
      }
    } catch { /* keep raw description as prompt */ }
    const id = `style-${Date.now()}`;
    setStyles((prev) => [...prev, { id, name, prompt, builtin: false }]);
    setActiveStyleId(id);
    setStyleDraftName('');
    setStyleDraftDesc('');
    setStyleBusy(false);
  };

  const addSkillFromText = (name: string, content: string) => {
    const clean = content.trim();
    if (!clean) return;
    const id = `skill-${Date.now()}`;
    const finalName = (name || 'Skill').replace(/\.md$/i, '');
    setSkills((prev) => [...prev, { id, name: finalName, content: clean }]);
    setActiveSkillIds((prev) => [...prev, id]);
    setSkillDraftName('');
    setSkillDraftBody('');
  };

  const ORIGIN_OPTIONS = ['X / Twitter', 'TikTok', 'A friend', 'Product Hunt', 'Google Search', 'Other'];
  const MODE_OPTIONS: { id: string; title: string; desc: string }[] = [
    { id: 'Safe Mode', title: 'Safe Mode', desc: 'Cofounder asks for your approval before every sensitive action.' },
    { id: 'Standard Mode', title: 'Standard Mode', desc: 'Balanced: Cofounder acts on its own, checks in on critical actions.' },
    { id: 'Turbo Mode', title: 'Turbo Mode', desc: 'Full autonomy: Cofounder runs everything without interruptions.' },
  ];

  const isDesktop = typeof window !== 'undefined' && !!window.mira?.isDesktop;

  useEffect(() => {
    const generateUUID = () => {
      if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID();
      }
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    };
    setSessionId(generateUUID());
  }, []);

  // When the agent finishes, the main window returns: append Mira's result
  // (with a collapsible reflections panel) to the same conversation.
  useEffect(() => {
    if (!isDesktop || !window.mira?.agent) return;
    const off = window.mira.agent.onResult((r) => {
      setAgentLaunching(false);
      setChatActive(true);
      const text = r.error ? r.error : (r.summary || 'Done.');
      setChatMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: 'ai' as const, text, reflections: r.reflections && r.reflections.length ? r.reflections : undefined },
      ]);
    });
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSession = async (updatedFields: {
    jobRole?: string;
    selectedTools?: string[];
    selectedTasks?: string[];
    email?: string;
    messages?: any[];
  }) => {
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
        currentSessionId = window.crypto.randomUUID();
      } else {
        currentSessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      }
      setSessionId(currentSessionId);
    }

    try {
      const body = {
        sessionId: currentSessionId,
        jobRole: updatedFields.jobRole !== undefined ? updatedFields.jobRole : jobRole,
        selectedTools: updatedFields.selectedTools !== undefined ? updatedFields.selectedTools : selectedTools,
        selectedTasks: updatedFields.selectedTasks !== undefined ? updatedFields.selectedTasks : selectedTasks,
        email: updatedFields.email !== undefined ? updatedFields.email : emailInput,
        messages: updatedFields.messages !== undefined ? updatedFields.messages : chatMessages
      };

      await fetch('/api/save-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    } catch (err) {
      console.error("Error saving session:", err);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Wait a brief tick for DOM updates
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [chatMessages, aiThinking]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // 1. Add User Message
    const newUserMsg = { id: Date.now(), sender: 'user' as const, text };
    const updatedHistory = [...chatMessages, newUserMsg];
    setChatMessages(updatedHistory);
    setTypedMessage('');
    setChatActive(true);

    const pushAi = (txt: string, history: any[]) => {
      const nextAiMsg = { id: Date.now() + 1, sender: 'ai' as const, text: txt };
      const finalHistory = [...history, nextAiMsg];
      setAiThinking(false);
      setAiResponseVisible(true);
      setChatMessages(prev => [...prev, nextAiMsg]);
      return finalHistory;
    };

    // 2. Stages State Machine
    if (conversationStage === 'initial') {
      // First Send from timeline: transitions to stage 'asking_job'
      setConversationStage('asking_job');
      setAiThinking(true);
      setAiResponseVisible(false);

      setTimeout(() => {
        const finalHistory = pushAi(
          "Hi, I'm Cofounder. I'm an AI, but I have hands: I control your computer's keyboard and mouse to act on your behalf. Tell me, what's your job?",
          updatedHistory
        );
        setTypedMessage("I'm a ");
        saveSession({ messages: finalHistory });
      }, 1400);
    }
    else if (conversationStage === 'asking_job') {
      // User submitted their job -> Mira acknowledges and asks where they know us from
      setJobRole(text);
      setAiThinking(true);
      setAiResponseVisible(false);
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ history: updatedHistory, stage: 'origin', jobRole: text })
        });
        if (!response.ok) throw new Error('chat failed');
        const data = await response.json();
        const finalHistory = pushAi(data.text, updatedHistory);
        setConversationStage('asking_origin');
        saveSession({ jobRole: text, messages: finalHistory });
      } catch (err) {
        const finalHistory = pushAi(
          `Love it, that's a job I can really help with! First, tell me: where did you hear about us?`,
          updatedHistory
        );
        setConversationStage('asking_origin');
        saveSession({ jobRole: text, messages: finalHistory });
      }
    }
    else if (conversationStage === 'asking_origin') {
      // User clicked an origin option -> Mira asks for the security mode
      setOriginChoice(text);
      setAiThinking(true);
      setAiResponseVisible(false);
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ history: updatedHistory, stage: 'mode', jobRole, origin: text })
        });
        if (!response.ok) throw new Error('chat failed');
        const data = await response.json();
        const finalHistory = pushAi(data.text, updatedHistory);
        setConversationStage('asking_mode');
        saveSession({ messages: finalHistory });
      } catch (err) {
        const finalHistory = pushAi(
          "Perfect, thank you! Now, choose the level of permissions you grant me to control your computer.",
          updatedHistory
        );
        setConversationStage('asking_mode');
        saveSession({ messages: finalHistory });
      }
    }
    else if (conversationStage === 'asking_mode') {
      // User picked Safe / Standard / Turbo -> move to account creation
      setModeChoice(text);
      setAiThinking(true);
      setAiResponseVisible(false);
      setTimeout(() => {
        const finalHistory = pushAi(
          `Got it, I'll run in **${text}**. One last step before I show you what I can do: create your account (or log in) to save your setup and your credits.`,
          updatedHistory
        );
        setConversationStage('auth');
        saveSession({ messages: finalHistory });
      }, 900);
    }
    else if (conversationStage === 'home' || conversationStage === 'final') {
      // On the desktop, a prompt from home launches the agent ritual: the window
      // is "sucked" into the bar, then the overlay takes over.
      if (isDesktop && window.mira?.agent) {
        setAgentLaunching(true);
        setTimeout(() => {
          window.mira!.agent.run(text);
          // The main window hides during execution; reset the suck once it returns.
          setTimeout(() => setAgentLaunching(false), 400);
        }, 650);
        return;
      }
      // Home / free chat — served by Amazon Bedrock
      setAiThinking(true);
      setAiResponseVisible(false);
      try {
        let replyText = '';
        // In the desktop app, generation goes through the main process (Bedrock).
        if (isDesktop && window.mira) {
          const ctx = `User profile — job: ${jobRole || 'unknown'}, heard about us via: ${originChoice || 'unknown'}, permission mode: ${modeChoice || 'Standard'}.\n\nUser message: ${text}`;
          const r = await window.mira.ollama.generate(ctx);
          if (r.ok && r.text && r.text.trim()) replyText = r.text.trim();
        }
        if (!replyText) {
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ history: updatedHistory, stage: 'final', tools: selectedTools })
          });
          if (!response.ok) throw new Error('Failed to fetch chat response');
          const data = await response.json();
          replyText = data.text;
        }
        const finalHistory = pushAi(replyText, updatedHistory);
        saveSession({ messages: finalHistory });
      } catch (err: any) {
        console.error("Chat API error:", err);
        const finalHistory = pushAi(
          "I'm ready to automate your computer! Just tell me the task you'd like me to run.",
          updatedHistory
        );
        saveSession({ messages: finalHistory });
      }
    } 
  };

  // --- Account creation / login (local account store via /api/auth) ---
  const handleAuth = async () => {
    if (authBusy) return;
    setAuthError('');
    const email = emailInput.trim();
    if (!email || !passwordInput) {
      setAuthError('Email and password required.');
      return;
    }
    setAuthBusy(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: authMode, email, password: passwordInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Something went wrong.');
        setAuthBusy(false);
        return;
      }
      setAccount({ email: data.email, credits: data.credits, plan: data.plan, waitlistBonus: data.waitlistBonus });
      saveSession({ email });

      // Build Mira's credits explanation, with a waitlist bonus shout-out when relevant.
      const lines: string[] = [];
      lines.push(
        data.created
          ? `Account created, welcome! 🎉`
          : `Great to see you again! 👋`
      );
      lines.push(
        `Here's how **credits** work: every action I run on your computer uses some. You get **1000 free credits** to try me out.`
      );
      if (data.waitlistBonus) {
        lines.push(
          `🔥🔥 You were on the waitlist, so you get **1000 extra credits**! 🔥🔥`
        );
      }
      lines.push(
        `After that, your **free plan** gives you **150 credits per month**. Current balance: **${data.credits} credits**.`
      );
      const userMsg = { id: Date.now(), sender: 'user' as const, text: `${authMode === 'signup' ? 'Create my account' : 'Log me in'} (${email})` };
      const aiMsg = { id: Date.now() + 1, sender: 'ai' as const, text: lines.join('\n\n') };
      setChatMessages(prev => [...prev, userMsg, aiMsg]);
      setAiResponseVisible(true);
      setConversationStage('credits');
      setAuthBusy(false);
    } catch (err: any) {
      setAuthError(err?.message || 'Network error.');
      setAuthBusy(false);
    }
  };

  // --- Credits screen -> connect to Amazon Bedrock ---
  const handleContinueToInstall = async () => {
    const aiMsg = {
      id: Date.now() + 1,
      sender: 'ai' as const,
      text: "Last step: I'll connect to Amazon Bedrock, where my model runs. Click to connect.",
    };
    setChatMessages(prev => [...prev, aiMsg]);
    setConversationStage('installing');
  };

  // --- Bedrock reachability check (desktop), simulated in the browser preview ---
  const handleInstallMira = async () => {
    if (installState === 'running') return;
    setInstallState('running');
    setInstallPercent(15);
    setInstallMessage('Connecting to Amazon Bedrock…');

    type BedrockCheck = { ok: boolean; model?: string; region?: string; error?: string };
    const bridge = window.mira as unknown as { bedrock?: { check?: () => Promise<BedrockCheck> } } | undefined;
    const checkFn = bridge?.bedrock?.check;

    if (!isDesktop || !window.mira || !checkFn) {
      if (isDesktop && window.mira) {
        setInstallMessage('This build cannot reach Amazon Bedrock yet (bridge unavailable).');
        setInstallState('error');
        return;
      }
      // Browser preview: simulate success so the flow is testable without Electron.
      setInstallPercent(70);
      setTimeout(() => {
        setInstallPercent(100);
        setInstallMessage('Connected to Amazon Bedrock (browser preview).');
        setTimeout(() => finishInstall(), 700);
      }, 700);
      return;
    }

    try {
      setInstallPercent(55);
      const r = await checkFn();
      if (!r || !r.ok) {
        setInstallPercent(0);
        setInstallMessage(r?.error || 'Could not reach Amazon Bedrock.');
        setInstallState('error');
        return;
      }
      setInstallPercent(100);
      setInstallMessage(r.model && r.model.startsWith('ollama:')
        ? `Amazon Bedrock is not available on this account yet — using the local model ${r.model.slice(7)} instead.`
        : `Connected to Amazon Bedrock${r.model ? ` · ${r.model}` : ''}${r.region ? ` (${r.region})` : ''}`);
      setTimeout(() => finishInstall(), 900);
    } catch (err: any) {
      setInstallPercent(0);
      setInstallMessage(err?.message || 'Could not reach Amazon Bedrock.');
      setInstallState('error');
    }
  };

  const finishInstall = async () => {
    setInstallPercent(100);
    setInstallState('done');
    setInstallMessage('Cofounder is ready 🎉');
    const aiMsg = {
      id: Date.now() + 1,
      sender: 'ai' as const,
      text: "Thank you! I'm now set up and ready to drive your computer. Here are a few ideas to get started 👇",
    };
    setChatMessages(prev => [...prev, aiMsg]);
    setChatActive(false);
    setConversationStage('home');

    // Ask the AI for personalized starter suggestions based on everything collected.
    let got: string[] = [];
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: [], stage: 'suggestions', jobRole, origin: originChoice, mode: modeChoice }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.suggestions)) got = data.suggestions.slice(0, 4);
      }
    } catch { /* non-blocking */ }
    if (!got.length) {
      got = [
        'Sort my inbox and reply to the urgent ones',
        'Build a slide deck from my notes',
        'Organize my desktop files',
        'Plan my meetings for the week',
      ];
    }
    setSuggestions(got);
  };

  // Automated Cursor Timeline State
  const [cursorPhase, setCursorPhase] = useState<'hidden' | 'movingToInput' | 'clickingInput' | 'typing' | 'pirouette' | 'movingToSend' | 'clickingSend' | 'done'>('hidden');
  const [typedMessage, setTypedMessage] = useState('');
  const [sendToggle, setSendToggle] = useState(0);
  const [sendHovered, setSendHovered] = useState(false);

  useEffect(() => {
    let timer: any;

    // Phase 1: Wait 1.5 seconds, then move to input
    timer = setTimeout(() => {
      setCursorPhase('movingToInput');
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (cursorPhase === 'movingToInput') {
      const t = setTimeout(() => {
        setCursorPhase('clickingInput');
      }, 1200);
      return () => clearTimeout(t);
    }

    if (cursorPhase === 'clickingInput') {
      const t = setTimeout(() => {
        setCursorPhase('typing');
      }, 300);
      return () => clearTimeout(t);
    }

    if (cursorPhase === 'typing') {
      const fullText = "Hey Cofounder, what can you actually do for me?";
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex < fullText.length) {
          setTypedMessage(fullText.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            setCursorPhase('pirouette');
          }, 500);
        }
      }, 60);
      return () => clearInterval(interval);
    }

    if (cursorPhase === 'pirouette') {
      const t = setTimeout(() => {
        setCursorPhase('movingToSend');
      }, 600);
      return () => clearTimeout(t);
    }

    if (cursorPhase === 'movingToSend') {
      const t = setTimeout(() => {
        setCursorPhase('clickingSend');
        setSendHovered(true);
        setSendToggle(prev => prev + 1);
      }, 800);
      return () => clearTimeout(t);
    }

    if (cursorPhase === 'clickingSend') {
      const t = setTimeout(() => {
        setCursorPhase('done');
        setSendHovered(false);
        handleSendMessage("Hey Cofounder, what can you actually do for me?");
      }, 500);
      return () => clearTimeout(t);
    }
  }, [cursorPhase]);

  const showCaret = cursorPhase === 'typing' || cursorPhase === 'clickingInput' || cursorPhase === 'pirouette' || cursorPhase === 'movingToSend';

  const cardsData = [
    {
      src: `${A}/image-1.png`,
      wStart: 20, hStart: 20, xStart: -5, yStart: 7,
      wEnd: 88.55, hEnd: 68.46, xEnd: -82, yEnd: 123, rotEnd: -16,
      floatY: [0, -6, 0, 4, 0], floatRot: [-16, -18, -16, -14, -16], floatDur: 6
    },
    {
      src: `${A}/image-2.png`,
      wStart: 20, hStart: 20, xStart: 35, yStart: 33,
      wEnd: 105, hEnd: 87, xEnd: 68, yEnd: 124, rotEnd: 24,
      floatY: [0, 5, 0, -5, 0], floatRot: [24, 26, 24, 22, 24], floatDur: 7
    },
    {
      src: `${A}/image-3.png`,
      wStart: 20, hStart: 20, xStart: -4, yStart: 27,
      wEnd: 105, hEnd: 96, xEnd: -4, yEnd: 148, rotEnd: -4,
      floatY: [0, -4, 0, 6, 0], floatRot: [-4, -5.5, -4, -2.5, -4], floatDur: 8
    }
  ];

  return (
    <div
      className={`relative w-full min-h-screen overflow-hidden flex flex-col items-center select-none ${
        chatActive ? 'justify-start pt-16 pb-[80px]' : 'justify-center'
      }`}
      style={{
        backgroundColor: '#EEF1F7',
        transformOrigin: 'bottom center',
        transform: agentLaunching ? 'scale(0.12) translateY(46vh)' : 'none',
        opacity: agentLaunching ? 0 : 1,
        filter: agentLaunching ? 'blur(3px)' : 'none',
        transition: 'transform 0.66s cubic-bezier(0.16,1,0.3,1), opacity 0.66s ease, filter 0.5s ease',
      }}
    >
      {/* Background Pixel Grids */}
      <PixelGrid side="left" />
      <PixelGrid side="right" />

      {/* Navbar (fixed top) */}
      <nav className="fixed top-0 left-0 w-full z-50 pointer-events-none bg-transparent">
        <div className="flex items-center gap-[6px] mt-[22px] ml-[22px] w-auto h-5 pointer-events-auto">
          <img src="/mira-logo.png" alt="Cofounder logo" className="h-5 w-auto object-contain" />
          <span
            style={{
              fontFamily: '"Inter Tight", sans-serif',
              color: '#3D82DE',
              fontWeight: 500,
            }}
            className="text-[16px] leading-none whitespace-nowrap"
          >
            Cofounder
          </span>
        </div>
      </nav>

      {/* Left Sidebar (fixed left) */}
      <div className="hidden sm:flex fixed left-4 top-1/2 -translate-y-1/2 z-10 flex-col gap-2">
        <button
          className="w-10 h-10 rounded-[12px] flex items-center justify-center transition-colors duration-200 cursor-pointer"
          style={{
            border: '1px solid rgba(34,106,205,0.05)',
            backgroundColor: 'rgba(255,255,255,0.90)',
            backdropFilter: 'blur(8px)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,1.0)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.90)'; }}
        >
          <img src={`${A}/chat.svg`} alt="Chat" className="w-[18px] h-[18px]" />
        </button>
        <button
          className="w-10 h-10 rounded-[12px] flex items-center justify-center transition-colors duration-200 cursor-pointer bg-transparent"
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.5)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <img src={`${A}/search.svg`} alt="Search" className="w-[18px] h-[18px]" />
        </button>
      </div>

      {/* Main Content Column */}
      <main
        className={`relative z-[5] w-full max-w-[702px] px-4 sm:px-0 flex flex-col items-center transition-all duration-700 ease-in-out ${
          chatActive ? 'flex-grow h-[calc(100vh-160px)] justify-between' : ''
        }`}
      >
        <AnimatePresence mode="wait">
          {!chatActive && (
            <motion.div
              key="hero-stack"
              className="w-full flex flex-col items-center"
              initial={{ opacity: 1, height: 'auto' }}
              exit={{
                opacity: 0,
                height: 0,
                y: -100,
                filter: 'blur(8px)',
                transition: { duration: 0.65, ease: [0.25, 1, 0.5, 1] }
              }}
            >
              {/* Folder/Lights stack + Floating cards */}
              <div className="relative w-[113.67px] h-[220px] overflow-visible">
                {/* z:1 blue-light-2 */}
                <motion.img
                  src={`${A}/blue-light-2.svg`}
                  alt=""
                  className="absolute pointer-events-none"
                  style={{ bottom: 50, left: 54.6, x: '-50%', width: 104, height: 170, zIndex: 1 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 1.0, ease: 'easeOut' }}
                />
                {/* z:2 blue-light */}
                <motion.img
                  src={`${A}/blue-light.svg`}
                  alt=""
                  className="absolute pointer-events-none"
                  style={{ bottom: 28, left: 54.6, x: '-50%', width: 104, height: 170, zIndex: 2 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 1.0, ease: 'easeOut' }}
                />
                {/* z:3 light-1 */}
                <motion.img
                  src={`${A}/light-1.svg`}
                  alt=""
                  className="absolute pointer-events-none"
                  style={{ bottom: 35, left: 57.2, x: '-50%', width: 180.5, height: 124.5, zIndex: 3 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.0, delay: 1.0, ease: 'easeOut' }}
                />
                {/* z:4 folder-3 */}
                <motion.img
                  src={`${A}/folder-3.svg`}
                  alt=""
                  className="absolute pointer-events-none"
                  style={{ bottom: 60, left: 23.4, width: 69.71, height: 45, zIndex: 4 }}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
                {/* z:5 small-light-2 */}
                <motion.img
                  src={`${A}/small-light-2.svg`}
                  alt=""
                  className="absolute pointer-events-none"
                  style={{ bottom: 55, left: 67.6, x: '-50%', width: 39, height: 17, zIndex: 5 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1.4, ease: 'easeOut' }}
                />
                {/* z:6 small-light */}
                <motion.img
                  src={`${A}/small-light.svg`}
                  alt=""
                  className="absolute pointer-events-none"
                  style={{ bottom: 50, left: 44.2, x: '-50%', width: 39, height: 25, zIndex: 6 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1.4, ease: 'easeOut' }}
                />
                {/* z:7 folder-2 */}
                <motion.img
                  src={`${A}/folder-2.svg`}
                  alt=""
                  className="absolute pointer-events-none"
                  style={{ bottom: 45, left: 18.98, width: 79, height: 51, zIndex: 7 }}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                />
                {/* z:8 light-2 */}
                <motion.img
                  src={`${A}/light-2.svg`}
                  alt=""
                  className="absolute pointer-events-none"
                  style={{ bottom: 20, left: 57.2, x: '-50%', width: 109, height: 162.5, zIndex: 8 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.0, delay: 1.1, ease: 'easeOut' }}
                />
                {/* z:9 folder-1 */}
                <motion.img
                  src={`${A}/folder-1.svg`}
                  alt=""
                  className="absolute pointer-events-none"
                  style={{ bottom: 30, left: 13, width: 91, height: 58, zIndex: 9 }}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                />
                {/* z:10 folder-0 */}
                <motion.img
                  src={`${A}/folder-0.svg?v=2`}
                  alt=""
                  className="absolute pointer-events-none"
                  style={{ bottom: 0, left: 0, width: 113.67, height: 76.5, zIndex: 10 }}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.0, ease: [0.22, 1, 0.36, 1] }}
                />

                {/* Floating Cards (rendered on top of folder stack) */}
                {cardsData.map((card, i) => (
                  <motion.div
                    key={i}
                    className="absolute cursor-pointer overflow-hidden rounded-[10px]"
                    style={{
                      transformOrigin: '50% 100%',
                      boxShadow: '0 16px 40px rgba(0,0,0,0.18), 0 4px 10px rgba(0,0,0,0.10)',
                      borderRadius: 10,
                      zIndex: hoveredCard === i ? 20 : 11,
                    }}
                    initial={{
                      opacity: 0,
                      width: card.wStart,
                      height: card.hStart,
                      left: cx + card.xStart,
                      bottom: card.yStart,
                      rotate: 0,
                      x: '-50%'
                    }}
                    animate={
                      !cardsFinished[i]
                        ? {
                            opacity: 1,
                            width: card.wEnd,
                            height: card.hEnd,
                            left: cx + card.xEnd,
                            bottom: card.yEnd,
                            rotate: card.rotEnd,
                            x: '-50%'
                          }
                        : {
                            opacity: 1,
                            width: card.wEnd,
                            height: card.hEnd,
                            left: cx + card.xEnd,
                            bottom: card.yEnd,
                            x: '-50%',
                            y: isAnyCardHovered ? 0 : card.floatY,
                            rotate: isAnyCardHovered ? card.rotEnd : card.floatRot,
                            scale: hoveredCard === i ? 1.08 : 1,
                          }
                    }
                    transition={
                      !cardsFinished[i]
                        ? { duration: 1.4, delay: 0.6 + i * 0.25, ease: [0.16, 1, 0.3, 1] }
                        : {
                            opacity: { duration: 0 },
                            width: { duration: 0 },
                            height: { duration: 0 },
                            left: { duration: 0 },
                            bottom: { duration: 0 },
                            x: { duration: 0 },
                            y: isAnyCardHovered
                              ? { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
                              : { repeat: Infinity, duration: card.floatDur, ease: 'easeInOut' },
                            rotate: isAnyCardHovered
                              ? { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
                              : { repeat: Infinity, duration: card.floatDur, ease: 'easeInOut' },
                            scale: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
                          }
                    }
                    onAnimationComplete={() => {
                      if (!cardsFinished[i]) {
                        setCardsFinished(prev => {
                          const next = [...prev];
                          next[i] = true;
                          return next;
                        });
                      }
                    }}
                    onMouseEnter={() => setHoveredCard(i)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <img src={card.src} alt="" className="w-full h-full object-cover rounded-[10px]" />
                  </motion.div>
                ))}
              </div>

              {/* Heading */}
              <div className="min-h-[36px] h-auto py-1 flex items-center justify-center mt-8 mb-1 w-full max-w-[600px]">
                <AnimatePresence mode="wait">
                  <motion.h1
                    key={titleIdx}
                    className="text-center font-normal text-[#11315D] tracking-[-0.64px] text-[24px] sm:text-[32px] leading-[28px] sm:leading-[32px]"
                    style={{
                      fontFamily: '"Inter Tight", sans-serif',
                    }}
                    initial={{ opacity: 0, y: -15, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: 15, filter: 'blur(6px)' }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                  >
                    {titles[titleIdx]}
                  </motion.h1>
                </AnimatePresence>
              </div>

              {/* Subtitle */}
              <motion.p
                className="text-center font-normal"
                style={{
                  fontSize: '14px',
                  color: 'rgba(13,27,75,0.50)',
                  marginBottom: '20px',
                  fontFamily: '"Inter Tight", sans-serif',
                }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.45, ease: 'easeOut' }}
              >
                Cofounder pilots your mouse and keyboard to execute your tasks, on your behalf.
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Conversation Area */}
        {chatActive && (
          <div className="w-full flex-grow flex flex-col gap-6 overflow-y-auto pr-2 max-h-[calc(100vh-280px)] scrollbar-none mb-6 pt-4">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col w-full ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                {msg.sender === 'user' ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="max-w-[80%] rounded-[20px] px-4 py-2.5 font-normal text-[14px] leading-5 text-[#0D1B4B]"
                    style={{
                      backgroundColor: '#E5EBF4',
                      border: '1px solid rgba(13,27,75,0.06)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                      fontFamily: '"Inter Tight", sans-serif',
                    }}
                  >
                    {msg.text}
                  </motion.div>
                ) : (
                  <div className="w-full max-w-[90%] text-left flex flex-col gap-4">
                    <div
                      className="flex flex-col gap-3 font-normal text-[15px] leading-6 text-[#0D1B4B]"
                      style={{ fontFamily: '"Inter Tight", sans-serif' }}
                    >
                      {renderMarkdown(msg.text)}
                    </div>

                    {/* Collapsible reflections panel — shown for agent results */}
                    {msg.reflections && msg.reflections.length > 0 && (
                      <div className="w-full max-w-[460px]">
                        <button
                          onClick={() => setOpenReflections(openReflections === msg.id ? null : msg.id)}
                          className="flex items-center gap-1.5 text-[12px] text-[rgba(13,27,75,0.5)] hover:text-[#3D82DE] cursor-pointer"
                          style={{ fontFamily: '"Inter Tight", sans-serif' }}
                        >
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openReflections === msg.id ? 'rotate-180' : ''}`} />
                          {openReflections === msg.id ? 'Hide reflections' : 'Show reflections'}
                        </button>
                        <AnimatePresence>
                          {openReflections === msg.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.25 }}
                              className="overflow-hidden mt-1.5 rounded-[12px] bg-[#F4F7FB] border border-[rgba(0,0,0,0.05)] p-3 flex flex-col gap-1.5"
                            >
                              {msg.reflections.map((r, i) => (
                                <div key={i} className="flex items-start gap-2 text-[12.5px] text-[rgba(13,27,75,0.7)]" style={{ fontFamily: '"Inter Tight", sans-serif' }}>
                                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#3D82DE] flex-shrink-0" />
                                  <span>{r}</span>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {aiResponseVisible && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.6 }}
                        className="flex items-center gap-3.5 mt-1 pl-1 text-[rgba(13,27,75,0.4)]"
                      >
                        <button className="hover:text-[#3D82DE] transition-colors cursor-pointer" title="Thumbs Up">
                          <ThumbsUp className="w-4 h-4 stroke-[1.8]" />
                        </button>
                        <button className="hover:text-[#3D82DE] transition-colors cursor-pointer" title="Thumbs Down">
                          <ThumbsDown className="w-4 h-4 stroke-[1.8]" />
                        </button>
                        <button className="hover:text-[#3D82DE] transition-colors cursor-pointer" title="Regenerate">
                          <RotateCw className="w-4 h-4 stroke-[1.8]" />
                        </button>
                        <button className="hover:text-[#3D82DE] transition-colors cursor-pointer" title="Copy">
                          <Copy className="w-4 h-4 stroke-[1.8]" />
                        </button>
                        <button className="hover:text-[#3D82DE] transition-colors cursor-pointer" title="More">
                          <MoreHorizontal className="w-4 h-4 stroke-[1.8]" />
                        </button>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {aiThinking && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 py-3 pl-2"
              >
                <div className="w-2 h-2 rounded-full bg-[#3D82DE] animate-typing-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-[#3D82DE] animate-typing-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-[#3D82DE] animate-typing-bounce" style={{ animationDelay: '300ms' }} />
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Job Suggestions Bubbles */}
        {conversationStage === 'asking_job' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-wrap gap-2 justify-center mb-4 max-w-[702px] w-full"
          >
            {['Developer', 'Designer', 'Marketer', 'Product Manager', 'Data Analyst', 'Copywriter'].map((job) => (
              <button
                key={job}
                onClick={() => setTypedMessage(`I'm a ${job.toLowerCase()}`)}
                className="px-3.5 py-1.5 rounded-full text-[13px] font-normal border transition-all cursor-pointer bg-white/85 hover:bg-white text-[#11315D] border-[rgba(61,130,222,0.12)] shadow-sm hover:scale-[1.03] active:scale-[0.98]"
                style={{ fontFamily: '"Inter Tight", sans-serif' }}
              >
                {job}
              </button>
            ))}
          </motion.div>
        )}

        {/* Prompt Input Box */}
        <motion.div
          layout
          className="relative w-full max-w-[702px] p-[4px] rounded-[24px] z-20"
          style={{
            border: '0.5px solid rgba(0,0,0,0.05)',
            background: 'rgba(157,196,250,0.15)',
            backdropFilter: 'blur(50px)',
          }}
          transition={{ type: 'spring', stiffness: 220, damping: 26 }}
        >
          {/* Automated Figma Cursor */}
          {cursorPhase !== 'hidden' && (
            <motion.div
              className="absolute pointer-events-none"
              style={{ zIndex: 9999 }}
              initial={{ x: 780, y: 160, rotate: 0, scale: 1, opacity: 0 }}
              animate={
                cursorPhase === 'movingToInput'
                  ? { x: 60, y: 30, rotate: 0, scale: 1, opacity: 1 }
                  : cursorPhase === 'clickingInput'
                  ? { x: 60, y: 30, rotate: 0, scale: [1, 0.85, 1], opacity: 1 }
                  : cursorPhase === 'typing'
                  ? { x: 60, y: 30, rotate: 0, scale: 1, opacity: 1 }
                  : cursorPhase === 'pirouette'
                  ? { x: 60, y: 30, rotate: [0, 360], scale: 1, opacity: 1 }
                  : cursorPhase === 'movingToSend'
                  ? { x: 664, y: 78, rotate: 0, scale: 1, opacity: 1 }
                  : cursorPhase === 'clickingSend'
                  ? { x: 664, y: 78, rotate: 0, scale: [1, 0.8, 1], opacity: 1 }
                  : { x: 664, y: 78, rotate: 0, scale: 1, opacity: 0 }
              }
              transition={
                cursorPhase === 'movingToInput'
                  ? { duration: 1.2, ease: 'easeInOut' }
                  : cursorPhase === 'clickingInput'
                  ? { duration: 0.3 }
                  : cursorPhase === 'typing'
                  ? { duration: 0 }
                  : cursorPhase === 'pirouette'
                  ? { duration: 0.6, ease: 'easeInOut' }
                  : cursorPhase === 'movingToSend'
                  ? { duration: 0.8, ease: 'easeInOut' }
                  : cursorPhase === 'clickingSend'
                  ? { duration: 0.3 }
                  : { duration: 0.4 }
              }
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 28 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ filter: 'drop-shadow(0px 4px 10px rgba(0, 0, 0, 0.25))' }}
              >
                <path
                  d="M3 2V22L9.6 15.4L15.4 25L19.8 22.4L14.2 13L21.2 12L3 2Z"
                  fill="#0057FF"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>
          )}

          {/* Inner card */}
          {conversationStage === 'asking_origin' ? (
            <motion.div
              layout="position"
              className="w-full bg-white rounded-[20px] flex flex-col justify-between p-5 gap-3"
              style={{ border: '1px solid rgba(34,106,205,0.05)' }}
            >
              <div className="flex flex-col gap-1 text-left">
                <span className="text-[14px] font-semibold text-[#11315D]" style={{ fontFamily: '"Inter Tight", sans-serif' }}>
                  Where did you hear about us?
                </span>
                <span className="text-[12px] text-[rgba(13,27,75,0.45)]" style={{ fontFamily: '"Inter Tight", sans-serif' }}>
                  It helps us get to know you better.
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full">
                {ORIGIN_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleSendMessage(opt)}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-normal border text-center transition-all cursor-pointer select-none active:scale-[0.97] bg-white border-[rgba(0,0,0,0.06)] text-[rgba(13,27,75,0.75)] hover:bg-[#E8F1FF] hover:border-[#3D82DE] hover:text-[#0D1B4B]"
                    style={{ fontFamily: '"Inter Tight", sans-serif' }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : conversationStage === 'asking_mode' ? (
            <motion.div
              layout="position"
              className="w-full bg-white rounded-[20px] flex flex-col justify-between p-5 gap-3"
              style={{ border: '1px solid rgba(34,106,205,0.05)' }}
            >
              <div className="flex flex-col gap-1 text-left">
                <span className="text-[14px] font-semibold text-[#11315D]" style={{ fontFamily: '"Inter Tight", sans-serif' }}>
                  What permissions do you grant me?
                </span>
                <span className="text-[12px] text-[rgba(13,27,75,0.45)]" style={{ fontFamily: '"Inter Tight", sans-serif' }}>
                  You can change this at any time.
                </span>
              </div>
              <div className="flex flex-col gap-2 w-full">
                {MODE_OPTIONS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleSendMessage(m.id)}
                    className="flex flex-col items-start gap-0.5 px-4 py-3 rounded-xl border text-left transition-all cursor-pointer select-none active:scale-[0.99] bg-white border-[rgba(0,0,0,0.06)] hover:bg-[#E8F1FF] hover:border-[#3D82DE]"
                    style={{ fontFamily: '"Inter Tight", sans-serif' }}
                  >
                    <span className="text-[13.5px] font-semibold text-[#0D1B4B]">{m.title}</span>
                    <span className="text-[12px] text-[rgba(13,27,75,0.55)] leading-snug">{m.desc}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : conversationStage === 'auth' ? (
            <motion.div
              layout="position"
              className="w-full bg-white rounded-[20px] flex flex-col justify-between p-5 gap-3"
              style={{ border: '1px solid rgba(34,106,205,0.05)' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-semibold text-[#11315D]" style={{ fontFamily: '"Inter Tight", sans-serif' }}>
                  {authMode === 'signup' ? 'Create your Cofounder account' : 'Log in'}
                </span>
                <button
                  onClick={() => { setAuthMode(authMode === 'signup' ? 'login' : 'signup'); setAuthError(''); }}
                  className="text-[12px] text-[#3D82DE] underline cursor-pointer"
                  style={{ fontFamily: '"Inter Tight", sans-serif' }}
                >
                  {authMode === 'signup' ? 'I already have an account' : 'Create an account'}
                </button>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <input
                  type="email"
                  placeholder="name@email.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-[#F4F7FB] border border-[rgba(0,0,0,0.05)] rounded-[14px] px-3.5 py-2.5 outline-none font-normal text-[14px] text-[#0D1B4B] placeholder-[rgba(13,27,75,0.3)] focus:border-[#3D82DE] transition-all"
                  style={{ fontFamily: '"Inter Tight", sans-serif' }}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAuth(); }}
                  className="w-full bg-[#F4F7FB] border border-[rgba(0,0,0,0.05)] rounded-[14px] px-3.5 py-2.5 outline-none font-normal text-[14px] text-[#0D1B4B] placeholder-[rgba(13,27,75,0.3)] focus:border-[#3D82DE] transition-all"
                  style={{ fontFamily: '"Inter Tight", sans-serif' }}
                />
                {authError && (
                  <span className="text-[12px] text-[#E0245E]" style={{ fontFamily: '"Inter Tight", sans-serif' }}>{authError}</span>
                )}
              </div>
              <button
                onClick={handleAuth}
                disabled={authBusy}
                className="self-end px-4 py-2 rounded-[12px] text-white font-medium text-[13px] bg-gradient-to-b from-[#70A8F2] to-[#3D82DE] hover:from-[#80B8FF] hover:to-[#4D92EE] shadow-md transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-[0.98] disabled:opacity-60"
                style={{ fontFamily: '"Inter Tight", sans-serif' }}
              >
                <span>{authBusy ? 'Please wait…' : authMode === 'signup' ? 'Create my account' : 'Log in'}</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </motion.div>
          ) : conversationStage === 'credits' ? (
            <motion.div
              layout="position"
              className="w-full bg-white rounded-[20px] flex flex-col justify-between p-5 gap-3"
              style={{ border: '1px solid rgba(34,106,205,0.05)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5 text-left">
                  <span className="text-[14px] font-semibold text-[#11315D]" style={{ fontFamily: '"Inter Tight", sans-serif' }}>
                    Your credits are ready
                  </span>
                  <span className="text-[12px] text-[rgba(13,27,75,0.45)]" style={{ fontFamily: '"Inter Tight", sans-serif' }}>
                    Free plan · 150 credits / month
                  </span>
                </div>
                <div
                  className="px-3 py-1.5 rounded-[12px] text-[#0D1B4B] font-semibold text-[15px] bg-[#E8F1FF] flex items-center gap-1"
                  style={{ fontFamily: '"Inter Tight", sans-serif' }}
                >
                  {account ? account.credits : 1000} <span className="text-[12px] font-normal text-[#5085CE]">credits</span>
                </div>
              </div>
              <button
                onClick={handleContinueToInstall}
                className="self-end px-4 py-2 rounded-[12px] text-white font-medium text-[13px] bg-gradient-to-b from-[#70A8F2] to-[#3D82DE] hover:from-[#80B8FF] hover:to-[#4D92EE] shadow-md transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-[0.98]"
                style={{ fontFamily: '"Inter Tight", sans-serif' }}
              >
                <span>Set up Cofounder</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </motion.div>
          ) : conversationStage === 'installing' ? (
            <motion.div
              layout="position"
              className="w-full bg-white rounded-[20px] flex flex-col justify-between p-5 gap-3"
              style={{ border: '1px solid rgba(34,106,205,0.05)' }}
            >
              <div className="flex flex-col gap-1 text-left">
                <span className="text-[14px] font-semibold text-[#11315D]" style={{ fontFamily: '"Inter Tight", sans-serif' }}>
                  {installState === 'done' ? 'Connected to Amazon Bedrock' : 'Connecting to Amazon Bedrock…'}
                </span>
                <span className="text-[12px] text-[rgba(13,27,75,0.45)]" style={{ fontFamily: '"Inter Tight", sans-serif' }}>
                  {installState === 'idle'
                    ? 'Cofounder thinks with Claude Sonnet 4.6 on Amazon Bedrock, using your own AWS credentials.'
                    : installMessage}
                </span>
              </div>

              {installState === 'error' && (
                <div
                  className="w-full rounded-[12px] px-3.5 py-2.5 text-[12px] leading-snug bg-[#FFF4E5] text-[#9A6400]"
                  style={{ fontFamily: '"Inter Tight", sans-serif' }}
                >
                  Configure AWS credentials (~/.aws/credentials) with Amazon Bedrock model access, then retry.
                </div>
              )}

              {installState !== 'idle' && installState !== 'error' && (
                <div className="w-full h-2 rounded-full bg-[#EEF1F7] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#70A8F2] to-[#3D82DE]"
                    animate={{ width: `${installPercent}%` }}
                    transition={{ ease: 'easeOut', duration: 0.3 }}
                  />
                </div>
              )}

              {installState !== 'done' && (
                <button
                  onClick={handleInstallMira}
                  disabled={installState === 'running'}
                  className="self-end px-4 py-2 rounded-[12px] text-white font-medium text-[13px] bg-gradient-to-b from-[#70A8F2] to-[#3D82DE] hover:from-[#80B8FF] hover:to-[#4D92EE] shadow-md transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-[0.98] disabled:opacity-60"
                  style={{ fontFamily: '"Inter Tight", sans-serif' }}
                >
                  <span>
                    {installState === 'running' ? 'Connecting…' : installState === 'error' ? 'Retry' : 'Connect'}
                  </span>
                  {installState !== 'running' && <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />}
                </button>
              )}
              {installState === 'error' && (
                // Observation and memory work without a model: let the user in, and
                // the workflow panel will say plainly why analysis cannot run yet.
                <button
                  onClick={() => finishInstall()}
                  className="self-end text-[12px] text-[#3D82DE] hover:underline cursor-pointer"
                  style={{ fontFamily: '"Inter Tight", sans-serif' }}
                >
                  Continue without Bedrock for now
                </button>
              )}
            </motion.div>
          ) : conversationStage === 'asking_tools' ? (
            <motion.div
              layout="position"
              className="w-full bg-white rounded-[20px] flex flex-col justify-between p-5 gap-3"
              style={{
                border: '1px solid rgba(34,106,205,0.05)',
              }}
            >
              <div className="flex flex-col gap-1 text-left">
                <span className="text-[14px] font-semibold text-[#11315D]" style={{ fontFamily: '"Inter Tight", sans-serif' }}>
                  Select the tools you use daily:
                </span>
                <span className="text-[12px] text-[rgba(13,27,75,0.45)]" style={{ fontFamily: '"Inter Tight", sans-serif' }}>
                  Cofounder can automate mouse clicks and keyboard typing in these apps.
                </span>
              </div>

              {/* Tools QCM checklist grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full max-h-[160px] overflow-y-auto pr-1 scrollbar-none">
                {recommendedTools.map((toolName) => {
                  const toolData = PREDEFINED_TOOLS.find(t => t.name.toLowerCase() === toolName.toLowerCase()) || { name: toolName, icon: 'HelpCircle', category: 'Tool' };
                  const isChecked = selectedTools.includes(toolName);
                  return (
                    <button
                      key={toolName}
                      onClick={() => {
                        setSelectedTools(prev =>
                          prev.includes(toolName)
                            ? prev.filter(t => t !== toolName)
                            : [...prev, toolName]
                        );
                      }}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-normal border text-left transition-all cursor-pointer select-none active:scale-[0.97] ${
                        isChecked
                          ? 'bg-[#E8F1FF] border-[#3D82DE] text-[#0D1B4B] font-medium shadow-sm'
                          : 'bg-white border-[rgba(0,0,0,0.06)] text-[rgba(13,27,75,0.65)] hover:bg-[rgba(0,0,0,0.02)]'
                      }`}
                      style={{ fontFamily: '"Inter Tight", sans-serif' }}
                    >
                      <ToolIcon iconName={toolData.icon} toolName={toolName} isChecked={isChecked} className={`w-4 h-4 ${isChecked ? 'text-[#3D82DE]' : 'text-[rgba(13,27,75,0.4)]'}`} />
                      <span className="truncate">{toolName}</span>
                    </button>
                  );
                })}
              </div>

              {/* QCM footer actions */}
              <div className="flex justify-between items-center mt-1 pt-2 border-t border-[rgba(0,0,0,0.04)] w-full">
                <span className="text-[12px] text-[rgba(13,27,75,0.45)]" style={{ fontFamily: '"Inter Tight", sans-serif' }}>
                  {selectedTools.length} tools selected
                </span>
                
                <button
                  onClick={() => handleSendMessage(`I use: ${selectedTools.join(', ')}`)}
                  className="px-4 py-2 rounded-[12px] text-white font-medium text-[13px] bg-gradient-to-b from-[#70A8F2] to-[#3D82DE] hover:from-[#80B8FF] hover:to-[#4D92EE] shadow-md transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-[0.98]"
                  style={{ fontFamily: '"Inter Tight", sans-serif' }}
                >
                  <span>Confirm tools</span>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </motion.div>
          ) : conversationStage === 'asking_tasks' ? (
            <motion.div
              layout="position"
              className="w-full bg-white rounded-[20px] flex flex-col justify-between p-5 gap-3"
              style={{
                border: '1px solid rgba(34,106,205,0.05)',
              }}
            >
              <div className="flex flex-col gap-1 text-left">
                <span className="text-[14px] font-semibold text-[#11315D]" style={{ fontFamily: '"Inter Tight", sans-serif' }}>
                  Select the tasks to give to Cofounder:
                </span>
                <span className="text-[12px] text-[rgba(13,27,75,0.45)]" style={{ fontFamily: '"Inter Tight", sans-serif' }}>
                  Choose which automations you want to run on your Mac.
                </span>
              </div>

              {/* Tasks checklist stack */}
              <div className="flex flex-col gap-2 w-full max-h-[160px] overflow-y-auto pr-1 scrollbar-none">
                {recommendedTasks.map((taskText) => {
                  const isChecked = selectedTasks.includes(taskText);
                  return (
                    <button
                      key={taskText}
                      onClick={() => {
                        setSelectedTasks(prev =>
                          prev.includes(taskText)
                            ? prev.filter(t => t !== taskText)
                            : [...prev, taskText]
                        );
                      }}
                      className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-normal border text-left transition-all cursor-pointer select-none active:scale-[0.99] ${
                        isChecked
                          ? 'bg-[#E8F1FF] border-[#3D82DE] text-[#0D1B4B] font-medium shadow-sm'
                          : 'bg-white border-[rgba(0,0,0,0.06)] text-[rgba(13,27,75,0.65)] hover:bg-[rgba(0,0,0,0.02)]'
                      }`}
                      style={{ fontFamily: '"Inter Tight", sans-serif' }}
                    >
                      <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${isChecked ? 'bg-[#3D82DE] border-[#3D82DE] text-white' : 'border-[rgba(13,27,75,0.3)] bg-white'}`}>
                        {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <span className="leading-tight flex-1 text-[12.5px]">{taskText}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tasks footer actions */}
              <div className="flex justify-between items-center mt-1 pt-2 border-t border-[rgba(0,0,0,0.04)] w-full">
                <span className="text-[12px] text-[rgba(13,27,75,0.45)]" style={{ fontFamily: '"Inter Tight", sans-serif' }}>
                  {selectedTasks.length} tasks selected
                </span>
                
                <button
                  onClick={() => {
                    if (selectedTasks.length > 0) {
                      handleSendMessage(`I want to automate: ${selectedTasks.join(', ')}`);
                    }
                  }}
                  className="px-4 py-2 rounded-[12px] text-white font-medium text-[13px] bg-gradient-to-b from-[#70A8F2] to-[#3D82DE] hover:from-[#80B8FF] hover:to-[#4D92EE] shadow-md transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-[0.98]"
                  style={{ fontFamily: '"Inter Tight", sans-serif' }}
                >
                  <span>Confirm tasks</span>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </motion.div>
          ) : conversationStage === 'waitlist' ? (
            <motion.div
              layout="position"
              className="w-full bg-white rounded-[20px] flex flex-col justify-between p-5 gap-3"
              style={{
                border: '1px solid rgba(34,106,205,0.05)',
              }}
            >
              <div className="flex flex-col gap-1 text-left">
                <span className="text-[14px] font-semibold text-[#11315D]" style={{ fontFamily: '"Inter Tight", sans-serif' }}>
                  Register for early access:
                </span>
                <span className="text-[12px] text-[rgba(13,27,75,0.45)]" style={{ fontFamily: '"Inter Tight", sans-serif' }}>
                  Enter your email address to join our exclusive waitlist.
                </span>
              </div>

              <div className="flex items-center gap-2 w-full bg-[#F4F7FB] border border-[rgba(0,0,0,0.05)] rounded-[16px] p-1.5 pl-3.5 focus-within:border-[#3D82DE] transition-all">
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="flex-1 min-w-0 bg-transparent outline-none font-normal text-[14px] text-[#0D1B4B] placeholder-[rgba(13,27,75,0.3)] border-none p-0 focus:outline-none focus:ring-0 focus:border-none"
                  style={{ fontFamily: '"Inter Tight", sans-serif' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && emailInput.trim()) {
                      handleSendMessage(emailInput);
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (emailInput.trim()) {
                      handleSendMessage(emailInput);
                    }
                  }}
                  className="px-4 py-2 rounded-[12px] text-white font-medium text-[13px] bg-gradient-to-b from-[#70A8F2] to-[#3D82DE] hover:from-[#80B8FF] hover:to-[#4D92EE] shadow-md transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-[0.98] whitespace-nowrap"
                  style={{ fontFamily: '"Inter Tight", sans-serif' }}
                >
                  <span>Join Waitlist</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              layout="position"
              className="relative w-full min-h-[116px] bg-white rounded-[20px] flex flex-col justify-between"
              style={{
                border: '1px solid rgba(34,106,205,0.05)',
                padding: '14px 14px 12px 16px',
              }}
              onDragOver={(e) => { e.preventDefault(); if (!isDragging) setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const md = Array.from(e.dataTransfer.files).filter((f) => /\.md$/i.test(f.name));
                const others = Array.from(e.dataTransfer.files).filter((f) => !/\.md$/i.test(f.name));
                if (others.length) addFiles(others);
                md.forEach((f) => { const r = new FileReader(); r.onload = () => addSkillFromText(f.name, String(r.result || '')); r.readAsText(f); });
              }}
            >
              {/* Drag overlay */}
              {isDragging && (
                <div className="absolute inset-0 z-30 rounded-[20px] border-2 border-dashed border-[#3D82DE] bg-[rgba(157,196,250,0.18)] flex items-center justify-center pointer-events-none">
                  <span className="text-[13px] font-medium text-[#3D82DE]" style={{ fontFamily: '"Inter Tight", sans-serif' }}>
                    Drop files to attach · drop .md to add a skill
                  </span>
                </div>
              )}

              {/* Attachment + active skill chips */}
              {(attachments.length > 0 || activeSkillIds.length > 0) && (
                <div className="flex flex-wrap gap-1.5 pb-2.5">
                  {attachments.map((a) => (
                    <div key={a.id} className="h-7 rounded-md bg-[#F4F7FB] border border-[rgba(0,0,0,0.06)] flex items-center px-2 gap-1.5" title={a.name}>
                      <FileText className="w-3 h-3 text-[#5085CE]" />
                      <span className="text-[12px] text-[rgba(13,27,75,0.7)] max-w-[120px] truncate" style={{ fontFamily: '"Inter Tight", sans-serif' }}>{a.name}</span>
                      <button onClick={() => setAttachments((p) => p.filter((x) => x.id !== a.id))} className="text-[rgba(13,27,75,0.35)] hover:text-[rgba(13,27,75,0.7)] cursor-pointer"><X className="w-2.5 h-2.5" /></button>
                    </div>
                  ))}
                  {activeSkillIds.map((sid) => {
                    const sk = skills.find((s) => s.id === sid);
                    if (!sk) return null;
                    return (
                      <div key={sid} className="h-7 rounded-md bg-[#E8F1FF] border border-[rgba(61,130,222,0.18)] flex items-center px-2 gap-1.5" title={`Skill: ${sk.name}`}>
                        <Sparkles className="w-3 h-3 text-[#3D82DE]" />
                        <span className="text-[12px] text-[#3A5E8C] max-w-[120px] truncate" style={{ fontFamily: '"Inter Tight", sans-serif' }}>{sk.name}</span>
                        <button onClick={() => setActiveSkillIds((p) => p.filter((x) => x !== sid))} className="text-[rgba(13,27,75,0.35)] hover:text-[rgba(13,27,75,0.7)] cursor-pointer"><X className="w-2.5 h-2.5" /></button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Typewriter/Input Line */}
              <div className="h-8 flex items-center font-normal text-[15px] leading-[22px] text-[#0D1B4B] pb-[10px] w-full">
                <input
                  type="text"
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  className="w-full bg-transparent outline-none font-normal text-[15px] leading-[22px] text-[#0D1B4B] placeholder-[rgba(13,27,75,0.3)] border-none p-0 focus:outline-none focus:ring-0 focus:border-none"
                  placeholder="Type a message..."
                  disabled={cursorPhase !== 'hidden' && cursorPhase !== 'done'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && typedMessage.trim()) {
                      handleSendMessage(typedMessage);
                    }
                  }}
                />
                {showCaret && (
                  <span className="w-[2px] h-[18px] bg-[#0D1B4B] ml-[2px] inline-block animate-caret-blink"></span>
                )}
              </div>

              {/* Bottom Toolbar Row */}
              <div className="flex justify-between items-center mt-[5px]">
                {/* Left Cluster */}
                <div className="flex items-center gap-[6px] translate-y-[35%]">
                  {/* Model selector pill (Claude Sonnet 4.6 on Amazon Bedrock) */}
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === 'model' ? null : 'model')}
                      className="h-7 rounded-lg flex items-center justify-between gap-1.5 px-2 bg-[#E8F1FF] hover:bg-[#DDEBFF] transition-colors cursor-pointer"
                      title="Model"
                    >
                      <div className="w-3.5 h-3.5 rounded-[4px] flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(166deg, #A0E4FF 9.8%, #9CA4FB 184.41%)' }}>
                        <img src={`${A}/ai-select.svg`} alt="" className="w-2 h-2" />
                      </div>
                      <span className="text-[12px] leading-4 font-medium text-[#5085CE] whitespace-nowrap" style={{ fontFamily: '"Inter Tight", sans-serif' }}>{selectedModel}</span>
                      <ChevronDown className={`w-3 h-3 text-[#5085CE] transition-transform ${openMenu === 'model' ? 'rotate-180' : ''}`} />
                    </button>
                    {openMenu === 'model' && (
                      <ModelMenu families={MODEL_FAMILIES} onClose={() => setOpenMenu(null)} />
                    )}
                  </div>

                  {/* Record & Replay */}
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === 'record' ? null : 'record')}
                      className="w-7 h-7 rounded-md border border-[rgba(0,0,0,0.10)] bg-[rgba(255,255,255,0.80)] flex items-center justify-center cursor-pointer hover:bg-white transition-colors duration-150"
                      title="Record & Replay"
                    >
                      <Video className="w-3.5 h-3.5 text-[rgba(13,27,75,0.55)]" />
                    </button>
                    {openMenu === 'record' && <RecordPopover onClose={() => setOpenMenu(null)} />}
                  </div>

                  {/* Style */}
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === 'style' ? null : 'style')}
                      className={`w-7 h-7 rounded-md border flex items-center justify-center cursor-pointer transition-colors duration-150 ${activeStyleId ? 'border-[#3D82DE] bg-[#E8F1FF]' : 'border-[rgba(0,0,0,0.10)] bg-[rgba(255,255,255,0.80)] hover:bg-white'}`}
                      title="Style"
                    >
                      <Palette className={`w-3.5 h-3.5 ${activeStyleId ? 'text-[#3D82DE]' : 'text-[rgba(13,27,75,0.55)]'}`} />
                    </button>
                    {openMenu === 'style' && (
                      <StylePopover
                        styles={styles}
                        activeStyleId={activeStyleId}
                        onPick={(id) => setActiveStyleId(activeStyleId === id ? null : id)}
                        onRemove={(id) => { setStyles((p) => p.filter((s) => s.id !== id)); if (activeStyleId === id) setActiveStyleId(null); }}
                        draftName={styleDraftName}
                        draftDesc={styleDraftDesc}
                        setDraftName={setStyleDraftName}
                        setDraftDesc={setStyleDraftDesc}
                        busy={styleBusy}
                        onCreate={createStyleFromDescription}
                        onUploadDocs={() => fileInputRef.current?.click()}
                        onClose={() => setOpenMenu(null)}
                      />
                    )}
                  </div>

                  {/* Vertical Divider */}
                  <div className="w-[1px] h-[18px] bg-[rgba(0,0,0,0.12)] mx-0.5" />

                  {/* Plus -> Skills */}
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === 'skills' ? null : 'skills')}
                      className="w-7 h-7 rounded-md border border-[rgba(0,0,0,0.10)] bg-transparent flex items-center justify-center cursor-pointer hover:bg-[rgba(0,0,0,0.05)] transition-colors duration-150"
                      title="Connect a skill"
                    >
                      <Plus className="w-4 h-4 text-[rgba(13,27,75,0.45)]" />
                    </button>
                    {openMenu === 'skills' && (
                      <SkillsPopover
                        skills={skills}
                        activeSkillIds={activeSkillIds}
                        onToggle={(id) => setActiveSkillIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])}
                        onRemove={(id) => { setSkills((p) => p.filter((s) => s.id !== id)); setActiveSkillIds((p) => p.filter((x) => x !== id)); }}
                        draftName={skillDraftName}
                        draftBody={skillDraftBody}
                        setDraftName={setSkillDraftName}
                        setDraftBody={setSkillDraftBody}
                        onAdd={() => addSkillFromText(skillDraftName, skillDraftBody)}
                        onClose={() => setOpenMenu(null)}
                      />
                    )}
                  </div>
                </div>

                {/* Right Side: SendButton */}
                <SendButton forceHover={sendHovered} forceToggle={sendToggle} onClick={() => handleSendMessage(typedMessage)} />
              </div>

              {/* Hidden file input (attachments + style docs) */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.pdf,.jpg,.jpeg,.png,.svg,.xls,.xlsx,.csv,.doc,.docx,.md"
                className="hidden"
                onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
              />
            </motion.div>
          )}
        </motion.div>

        {/* AI-generated starter suggestions (home page) */}
        {(conversationStage === 'home' || conversationStage === 'final') && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-wrap gap-2 justify-center mt-3 max-w-[702px] w-full z-20"
          >
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => handleSendMessage(s)}
                className="px-3.5 py-1.5 rounded-full text-[13px] font-normal border transition-all cursor-pointer bg-white/85 hover:bg-white text-[#11315D] border-[rgba(61,130,222,0.12)] shadow-sm hover:scale-[1.03] active:scale-[0.98]"
                style={{ fontFamily: '"Inter Tight", sans-serif' }}
              >
                {s}
              </button>
            ))}
          </motion.div>
        )}

        {/* Observed activity, detected workflows and memory (home page) */}
        {(conversationStage === 'home' || conversationStage === 'final') && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 max-w-[702px] w-full z-20"
          >
            <WorkflowsPanel />
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-5 left-0 w-full z-[5] text-center px-4 pointer-events-none">
        <p
          className="text-[13px] font-normal pointer-events-auto"
          style={{
            color: 'rgba(13,27,75,0.45)',
            fontFamily: '"Inter Tight", sans-serif',
          }}
        >
          By sending a message to ChatBot, you agree to our{' '}
          <a
            href="#"
            className="underline cursor-pointer"
            style={{
              color: 'rgba(13,27,75,0.65)',
              textUnderlineOffset: '2px',
            }}
          >
            Terms
          </a>{' '}
          and have read our{' '}
          <a
            href="#"
            className="underline cursor-pointer"
            style={{
              color: 'rgba(13,27,75,0.65)',
              textUnderlineOffset: '2px',
            }}
          >
            Privacy Policy.
          </a>
        </p>
      </footer>
    </div>
  );
}
