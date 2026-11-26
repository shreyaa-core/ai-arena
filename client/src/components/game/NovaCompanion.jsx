import { useState } from "react";
import { Bot, Mic, Send, Volume2, X, Sparkles } from "lucide-react";
import { useGame } from "../../context/GameContext.jsx";
import { api } from "../../services/apiClient.js";
import { speakText, stopSpeaking } from "../../utils/speech.js";
import { Button } from "../ui/button.jsx";
import { Input } from "../ui/input.jsx";

export function NovaCompanion() {
  const { state, activeWorld, serverHealth, t } = useGame();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [mood, setMood] = useState("idle"); // idle | thinking | happy | warning
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello Explorer! I'm NOVA. Walk up to terminals in any world or ask me for prompt engineering guidance anytime.",
    },
  ]);

  const lang = state.profile?.language || "en";

  const sendMessage = async (e) => {
    e?.preventDefault();
    const q = input.trim();
    if (!q || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setBusy(true);
    setMood("thinking");

    try {
      const res = await api.novaChat({
        message: q,
        worldId: activeWorld?.id,
        language: lang,
      });
      setMessages((m) => [...m, { role: "assistant", text: res.reply }]);
      setMood("happy");
      if (state.accessibility?.voiceNarration) {
        speakText(res.reply, lang);
      }
    } catch (err) {
      setMood("warning");
      const fallbackTip =
        err.status === 503
          ? `Live Groq AI isn't configured on the server yet. Offline Coaching Tip for ${activeWorld?.name}: Always define Role, Audience, Format, Word Limit, and Verification rules ('cite sources / do not invent').`
          : `Connection issue: ${err.message}. Keep prompts structured with Role + Constraints + Output Schema.`;
      setMessages((m) => [...m, { role: "assistant", text: fallbackTip }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-30">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="hud-panel group flex items-center gap-2.5 rounded-full border-teal-400/50 px-4 py-2.5 text-sm font-medium text-white shadow-xl hover:border-teal-300"
        >
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-teal-500/20 text-teal-300">
            <Bot className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-400" />
          </span>
          <span className="font-display">{t.askNova}</span>
        </button>
      ) : (
        <div className="game-dialogue-box flex h-[420px] w-[340px] flex-col overflow-hidden rounded-2xl shadow-2xl sm:w-[370px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-700/80 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                  mood === "thinking"
                    ? "animate-pulse border-amber-400 bg-amber-500/20 text-amber-300"
                    : mood === "warning"
                      ? "border-rose-400 bg-rose-500/20 text-rose-300"
                      : "border-teal-400 bg-teal-500/20 text-teal-300"
                }`}
              >
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-display text-sm font-semibold text-white">NOVA Guide</h3>
                <p className="text-[11px] text-slate-400">
                  {serverHealth.groqConfigured ? "Live Groq AI Coach" : "Offline Tactical Guide"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                title="Read last message aloud"
                onClick={() => {
                  stopSpeaking();
                  const last = [...messages].reverse().find((m) => m.role === "assistant");
                  if (last) speakText(last.text, lang);
                }}
                className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <Volume2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Close NOVA"
                onClick={() => setOpen(false)}
                className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-2.5 overflow-y-auto p-3 text-xs">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`rounded-xl px-3 py-2 leading-relaxed ${
                  m.role === "user"
                    ? "ml-8 bg-teal-500/20 text-teal-50"
                    : "mr-6 border border-slate-700/80 bg-slate-900/75 text-slate-200"
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="flex items-center gap-1.5 border-t border-slate-700/80 p-2.5">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask NOVA for guidance…"
              className="h-8 text-xs"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0"
              title="Voice Input (Browser Dictation)"
              onClick={() => {
                const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
                if (!Rec) {
                  setMessages((m) => [
                    ...m,
                    { role: "assistant", text: "Browser SpeechRecognition unavailable here; type your question below." },
                  ]);
                  return;
                }
                const rec = new Rec();
                rec.lang = lang === "bn" ? "bn-BD" : lang === "hi" ? "hi-IN" : "en-US";
                rec.onresult = (ev) => {
                  const text = ev.results?.[0]?.[0]?.transcript || "";
                  if (text) setInput(text);
                };
                rec.start();
              }}
            >
              <Mic className="h-3.5 w-3.5" />
            </Button>
            <Button type="submit" size="icon" className="h-8 w-8 shrink-0" disabled={busy}>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
