import { useState } from "react";
import { X, Volume2, RotateCcw, ArrowRight, CheckCircle2, LogOut, Shield } from "lucide-react";
import { toast } from "sonner";
import { useGame } from "../../context/GameContext.jsx";
import { TUTORIALS } from "../../data/tutorials.js";
import { api } from "../../services/apiClient.js";
import { getVolumeSettings, saveVolumeSettings } from "../../utils/sound.js";
import { Button } from "../ui/button.jsx";
import { Input } from "../ui/input.jsx";

export function ActiveSystemModal() {
  const {
    state,
    activeModal,
    setActiveModal,
    setScreen,
    authUser,
    setAuthUser,
    actions,
    serverHealth,
  } = useGame();

  if (!activeModal) return null;

  const close = () => setActiveModal(null);

  if (activeModal.type === "pause") {
    return (
      <ModalShell title="Game Paused" subtitle="Session Controls" onClose={close} maxWidth="max-w-sm">
        <div className="flex flex-col gap-2.5">
          <Button variant="hero" onClick={close}>Resume Exploration</Button>
          <Button variant="outline" onClick={() => setActiveModal({ type: "settings" })}>Settings & Accessibility</Button>
          <Button variant="outline" onClick={() => setActiveModal({ type: "howto" })}>How to Play</Button>
          {authUser?.role === "admin" && (
            <Button variant="outline" onClick={() => setActiveModal({ type: "admin" })}>
              <Shield className="mr-1.5 h-4 w-4 text-amber-400" /> Admin Analytics
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => {
              close();
              setScreen("title");
            }}
          >
            Return to Title Screen
          </Button>
        </div>
      </ModalShell>
    );
  }

  if (activeModal.type === "howto") {
    return (
      <ModalShell title="How to Play AI Arena" subtitle="Explorer Manual" onClose={close}>
        <div className="space-y-3 text-sm text-slate-300">
          <p><strong>1. Explore Six Territories:</strong> Move across sectors with <strong>WASD / Arrow keys</strong> or click directly on terminals and NPCs.</p>
          <p><strong>2. Learn Before You Fight:</strong> Visit blue Tutorial Codices (?) in each territory before tackling terminals and Boss Cores (⚔).</p>
          <p><strong>3. High Efficiency Wins:</strong> Clear rubrics cleanly on your first try with zero hints and concise tokens to earn <strong>S Rank</strong>, extra XP, Coins, and raise your weighted <strong>AEI (AI Efficiency Index)</strong>.</p>
          <p><strong>4. Skill Passport:</strong> Earn verifiable competency records across Prompting, Fact Evaluation, Tool Mastery, Workflow Safety, Governance, and Creative Synthesis.</p>
        </div>
      </ModalShell>
    );
  }

  if (activeModal.type === "credits") {
    return (
      <ModalShell title="Credits & Architecture" subtitle="AI Arena Edition 2.0" onClose={close}>
        <div className="space-y-2.5 text-sm text-slate-300">
          <p><strong>AI Arena</strong> — Immersive story-driven AI literacy and skill certification game.</p>
          <p className="text-xs text-slate-400">
            Powered by React 19, Phaser 3 Game Engine, JavaScript ES6+, Tailwind CSS, Node/Express, PostgreSQL, Socket.IO, Groq API, Google Gemini Vision API, and Web Audio Synthesis.
          </p>
        </div>
      </ModalShell>
    );
  }

  if (activeModal.type === "npc") {
    const npc = activeModal.data;
    return (
      <ModalShell title={npc.name} subtitle={npc.role} onClose={close}>
        <p className="rounded-xl border border-teal-500/30 bg-slate-900/80 p-4 text-sm leading-relaxed text-slate-200">
          “{npc.greeting}”
        </p>
        <div className="mt-4 flex justify-end">
          <Button onClick={close}>Understood</Button>
        </div>
      </ModalShell>
    );
  }

  if (activeModal.type === "tutorial") {
    return <TutorialModalContent tutorialId={activeModal.data?.tutorialId} onClose={close} actions={actions} />;
  }

  if (activeModal.type === "settings") {
    return <SettingsModalContent state={state} actions={actions} onClose={close} />;
  }

  if (activeModal.type === "auth") {
    return (
      <AuthModalContent
        authUser={authUser}
        setAuthUser={setAuthUser}
        state={state}
        serverHealth={serverHealth}
        onClose={close}
      />
    );
  }

  return null;
}

export function ModalShell({ title, subtitle, children, onClose, maxWidth = "max-w-xl" }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className={`game-dialogue-box relative max-h-[90vh] w-full ${maxWidth} overflow-y-auto rounded-2xl p-6 text-slate-100`}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
        {subtitle && <p className="font-mono text-[11px] uppercase tracking-widest text-teal-400">{subtitle}</p>}
        <h2 className="mt-0.5 font-display text-2xl font-bold text-white">{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function TutorialModalContent({ tutorialId, onClose, actions }) {
  const tut = TUTORIALS[tutorialId];
  const [step, setStep] = useState(0);
  if (!tut) return null;
  const current = tut.steps[step];
  const isLast = step >= tut.steps.length - 1;

  return (
    <ModalShell title={tut.title} subtitle={`Briefing ${step + 1} / ${tut.steps.length}`} onClose={onClose}>
      <div className="rounded-xl border border-teal-500/30 bg-slate-900/75 p-4">
        <h3 className="font-display text-lg font-semibold text-amber-300">{current.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-200">{current.body}</p>
      </div>
      <div className="mt-5 flex items-center justify-between">
        <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          Previous
        </Button>
        {isLast ? (
          <Button
            variant="hero"
            onClick={() => {
              actions.completeTutorial(tut.id);
              toast.success("Tutorial mastered! Terminals calibrated.");
              onClose();
            }}
          >
            <CheckCircle2 className="mr-1.5 h-4 w-4" /> Complete Briefing
          </Button>
        ) : (
          <Button onClick={() => setStep((s) => s + 1)}>
            Next <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        )}
      </div>
    </ModalShell>
  );
}

function SettingsModalContent({ state, actions, onClose }) {
  const [vols, setVols] = useState(getVolumeSettings);
  const a11y = state.accessibility || {};

  const updateAudio = (patch) => {
    const next = saveVolumeSettings({ ...vols, ...patch });
    setVols(next);
  };

  return (
    <ModalShell title="Settings & Accessibility" subtitle="System Configuration" onClose={onClose}>
      <div className="space-y-5 text-sm">
        <div className="space-y-3 rounded-xl border border-slate-700/70 bg-slate-900/60 p-4">
          <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-teal-300">
            <Volume2 className="h-4 w-4" /> Audio & Voice
          </h3>
          <label className="flex items-center justify-between text-xs">
            <span>SFX Volume ({Math.round(vols.sfx * 100)}%)</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={vols.sfx}
              onChange={(e) => updateAudio({ sfx: Number(e.target.value) })}
            />
          </label>
          <label className="flex items-center justify-between text-xs">
            <span>Ambient Music ({Math.round(vols.music * 100)}%)</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={vols.music}
              onChange={(e) => updateAudio({ music: Number(e.target.value) })}
            />
          </label>
          <label className="flex items-center justify-between text-xs">
            <span>Enable Ambient Synth Music</span>
            <input
              type="checkbox"
              checked={vols.musicEnabled}
              onChange={(e) => updateAudio({ musicEnabled: e.target.checked })}
            />
          </label>
          <label className="flex items-center justify-between text-xs">
            <span>Voice Narration (Speech Synthesis)</span>
            <input
              type="checkbox"
              checked={Boolean(a11y.voiceNarration)}
              onChange={(e) => actions.updateAccessibility({ voiceNarration: e.target.checked })}
            />
          </label>
        </div>

        <div className="space-y-2.5 rounded-xl border border-slate-700/70 bg-slate-900/60 p-4">
          <h3 className="font-display text-sm font-semibold text-amber-300">Visual & Accessibility</h3>
          {[
            { key: "highContrast", label: "High Contrast Mode" },
            { key: "largeText", label: "Larger Readable Text" },
            { key: "reducedMotion", label: "Reduced Motion Effects" },
          ].map((item) => (
            <label key={item.key} className="flex items-center justify-between text-xs">
              <span>{item.label}</span>
              <input
                type="checkbox"
                checked={Boolean(a11y[item.key])}
                onChange={(e) => actions.updateAccessibility({ [item.key]: e.target.checked })}
              />
            </label>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Language</span>
          <select
            value={state.profile?.language || "en"}
            onChange={(e) => actions.updateProfile({ language: e.target.value })}
            className="rounded-md border border-slate-600 bg-slate-900 px-3 py-1.5 text-xs text-white"
          >
            <option value="en">English</option>
            <option value="bn">বাংলা (Bengali)</option>
            <option value="hi">हिन्दी (Hindi)</option>
          </select>
        </div>

        <div className="flex items-center justify-between border-t border-slate-700 pt-3">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              actions.resetProgress();
              toast.success("Local guest save cleared.");
              onClose();
            }}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset Local Save
          </Button>
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </ModalShell>
  );
}

function AuthModalContent({ authUser, setAuthUser, state, serverHealth, onClose }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [alias, setAlias] = useState(state.profile?.alias || "Explorer");
  const [busy, setBusy] = useState(false);

  if (authUser) {
    return (
      <ModalShell title="Account Connected" subtitle="PostgreSQL Cloud Save" onClose={onClose} maxWidth="max-w-md">
        <div className="space-y-3 text-sm">
          <p className="text-slate-300">Signed in as <strong>{authUser.email}</strong> ({authUser.alias})</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                await api.migrateGuest({
                  profile: state.profile,
                  submissions: state.submissions,
                });
                toast.success("Local progress synced to PostgreSQL!");
              }}
            >
              Sync Guest Save Now
            </Button>
            <Button
              variant="ghost"
              onClick={async () => {
                await api.logout().catch(() => {});
                setAuthUser(null);
                toast.info("Signed out cleanly.");
                onClose();
              }}
            >
              <LogOut className="mr-1.5 h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>
      </ModalShell>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res =
        mode === "register"
          ? await api.register({ email, password, alias })
          : await api.login({ email, password });
      setAuthUser(res.user);
      toast.success(`Welcome back, ${res.user.alias}!`);
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title="Account & Cloud Save" subtitle="PostgreSQL Sync" onClose={onClose} maxWidth="max-w-md">
      {serverHealth.dbStatus !== "connected" && (
        <div className="mb-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200">
          Server PostgreSQL status: <strong>{serverHealth.dbStatus}</strong>. Guest play continues saving locally in your browser.
        </div>
      )}
      <div className="mb-3 flex gap-2">
        <Button size="sm" variant={mode === "login" ? "default" : "ghost"} onClick={() => setMode("login")}>Sign In</Button>
        <Button size="sm" variant={mode === "register" ? "default" : "ghost"} onClick={() => setMode("register")}>Create Account</Button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === "register" && (
          <Input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Explorer alias" required />
        )}
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" required />
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 8 chars)" required />
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Connecting…" : mode === "register" ? "Register & Save Progress" : "Sign In"}
        </Button>
      </form>
    </ModalShell>
  );
}
