import { useState } from "react";
import { X, Sparkles, ArrowRight, Check } from "lucide-react";
import { AVATAR_COLORS, CHARACTERS } from "../../data/characters.js";
import { EXPERIENCE_LEVELS } from "../../data/domains.js";
import { useGame } from "../../context/GameContext.jsx";
import { Button } from "../ui/button.jsx";
import { Input } from "../ui/input.jsx";
import { playClick } from "../../utils/sound.js";

const GOALS = [
  { id: "practical-mastery", label: "Master Everyday AI Prompting" },
  { id: "work-automation", label: "Automate Work Workflows Safely" },
  { id: "research-verification", label: "Spot Hallucinations & Fact-Check" },
  { id: "certification", label: "Earn Verified AEI Skill Passport" },
];

export function OnboardingModal() {
  const { state, actions, enterWorldMap, enterTerritory, setActiveModal } = useGame();
  const [alias, setAlias] = useState(state.profile?.alias || "Explorer");
  const [characterId, setCharacterId] = useState(state.profile?.character?.id || "nova-cadet");
  const [avatarColor, setAvatarColor] = useState(state.profile?.character?.suitColor || "#14B8A6");
  const [language, setLanguage] = useState(state.profile?.language || "en");
  const [experienceLevel, setExperienceLevel] = useState(state.profile?.experience || "beginner");
  const [learningGoal, setLearningGoal] = useState(state.profile?.goal || "practical-mastery");

  const startCampaign = (withBaselineAssessment = false) => {
    playClick();
    actions.updateProfile({
      alias: alias.trim() || "Explorer",
      language,
      experience: experienceLevel,
      goal: learningGoal,
      onboarded: true,
      character: {
        id: characterId,
        suitColor: avatarColor,
      },
    });
    if (withBaselineAssessment) {
      setActiveModal({ type: "assessment" });
    } else {
      // Personalized starting path: beginners open Prompt Academy Tutorial right inside territory
      if (experienceLevel === "beginner") {
        enterTerritory("prompt-academy");
        setActiveModal({ type: "tutorial", data: { tutorialId: "tut-prompt-101" } });
      } else {
        enterWorldMap();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="game-dialogue-box relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl p-6 text-slate-100 md:p-8">
        <button
          type="button"
          onClick={() => setActiveModal(null)}
          aria-label="Close onboarding"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 space-y-1">
          <p className="font-mono text-xs uppercase tracking-widest text-teal-400">
            Explorer Commissioning
          </p>
          <h2 className="font-display text-2xl font-bold text-white">
            Create Your AI Arena Identity
          </h2>
          <p className="text-sm text-slate-300">
            Customize your character, preferred language, and AI experience so the world tailors your starting route.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Alias & Language */}
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-300">
                Explorer Callsign / Alias
              </label>
              <Input
                value={alias}
                maxLength={28}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="Enter player alias…"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-300">
                Preferred Language
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "en", label: "English" },
                  { id: "bn", label: "বাংলা" },
                  { id: "hi", label: "हिन्दी" },
                ].map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLanguage(l.id)}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                      language === l.id
                        ? "border-teal-400 bg-teal-500/20 text-white"
                        : "border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-300">
                Suit Tint
              </label>
              <div className="flex items-center gap-2.5">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    title={c.label}
                    onClick={() => setAvatarColor(c.hex)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition ${
                      avatarColor === c.hex ? "scale-110 border-white" : "border-transparent opacity-80"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {avatarColor === c.hex && <Check className="h-4 w-4 text-slate-950" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-300">
                Primary Learning Goal
              </label>
              <div className="grid gap-1.5">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setLearningGoal(g.id)}
                    className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
                      learningGoal === g.id
                        ? "border-teal-400 bg-teal-500/15 text-white"
                        : "border-slate-700 bg-slate-900/50 text-slate-300 hover:border-slate-500"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Character & AI Experience */}
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-300">
                Choose Character Class
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CHARACTERS.map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => {
                      setCharacterId(ch.id);
                      setAvatarColor(ch.accent);
                    }}
                    className={`rounded-xl border p-3 text-left transition ${
                      characterId === ch.id
                        ? "border-amber-400 bg-amber-500/15"
                        : "border-slate-700 bg-slate-900/60 hover:border-slate-500"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3.5 w-3.5 rounded-full"
                        style={{ backgroundColor: ch.accent }}
                      />
                      <span className="font-display text-sm font-semibold text-white">
                        {ch.name}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] font-medium text-teal-300">{ch.archetype}</p>
                    <p className="mt-1 line-clamp-2 text-[11px] text-slate-400">
                      {ch.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-300">
                AI Experience Level
              </label>
              <div className="grid gap-1.5">
                {EXPERIENCE_LEVELS.map((exp) => (
                  <button
                    key={exp.id}
                    type="button"
                    onClick={() => setExperienceLevel(exp.id)}
                    className={`rounded-lg border px-3 py-2 text-left transition ${
                      experienceLevel === exp.id
                        ? "border-teal-400 bg-teal-500/15"
                        : "border-slate-700 bg-slate-900/50 hover:border-slate-500"
                    }`}
                  >
                    <p className="text-xs font-semibold text-white">{exp.label}</p>
                    <p className="text-[11px] text-slate-400">{exp.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-700/70 pt-4">
          <button
            type="button"
            onClick={() => startCampaign(false)}
            className="text-xs text-slate-400 underline-offset-4 hover:text-white hover:underline"
          >
            Skip & Start Guest Play Immediately
          </button>

          <div className="flex flex-wrap gap-2.5">
            <Button variant="outline" onClick={() => startCampaign(true)}>
              <Sparkles className="mr-1.5 h-4 w-4 text-amber-400" />
              Take Baseline Assessment
            </Button>
            <Button variant="hero" onClick={() => startCampaign(false)}>
              Launch Adventure
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
