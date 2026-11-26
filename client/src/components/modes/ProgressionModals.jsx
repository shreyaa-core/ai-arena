import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Award, CheckCircle2, Coins, Download, Lock, Shield, ShoppingBag, TreePine, Trophy } from "lucide-react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { SHOP_ITEMS } from "../../data/shopItems.js";
import { SKILL_TREE_NODES } from "../../data/skillTree.js";
import { useGame } from "../../context/GameContext.jsx";
import { buildLeaderboard } from "../../engine/leaderboard.js";
import { api } from "../../services/apiClient.js";
import { ModalShell } from "../game/PauseSettingsModals.jsx";
import { Button } from "../ui/button.jsx";

export function ProgressionModals() {
  const { activeModal, setActiveModal } = useGame();
  if (!activeModal) return null;
  const close = () => setActiveModal(null);

  if (activeModal.type === "skill-tree") return <SkillTreeContent onClose={close} />;
  if (activeModal.type === "shop") return <ShopContent onClose={close} />;
  if (activeModal.type === "passport") return <PassportContent onClose={close} />;
  if (activeModal.type === "leaderboard") return <LeaderboardContent onClose={close} />;
  if (activeModal.type === "admin") return <AdminContent onClose={close} />;
  return null;
}

function SkillTreeContent({ onClose }) {
  const { state, stats, actions } = useGame();
  const unlocked = state.skillNodesUnlocked || [];
  const totalPointsEarned = Math.max(1, stats.completedIds.length + Math.floor(stats.totalXp / 120));
  const pointsLeft = Math.max(0, totalPointsEarned - unlocked.length);

  return (
    <ModalShell title="Skill Tree" subtitle={`Available Skill Points: ${pointsLeft}`} onClose={onClose}>
      <div className="grid gap-3 sm:grid-cols-2">
        {SKILL_TREE_NODES.map((node) => {
          const isUnlocked = unlocked.includes(node.id);
          const prereqMet = !node.prerequisiteId || unlocked.includes(node.prerequisiteId);
          return (
            <div key={node.id} className={`rounded-xl border p-3.5 text-xs ${isUnlocked ? "border-emerald-400/60 bg-emerald-500/10" : "border-slate-700 bg-slate-900/70"}`}>
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-semibold text-white">{node.name}</span>
                {isUnlocked ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : !prereqMet ? (
                  <Lock className="h-4 w-4 text-slate-500" />
                ) : (
                  <TreePine className="h-4 w-4 text-teal-400" />
                )}
              </div>
              <p className="mt-1 text-slate-300">{node.description}</p>
              {!isUnlocked && (
                <Button
                  size="sm"
                  className="mt-2.5 h-7 text-xs"
                  disabled={!prereqMet || pointsLeft < node.costPoints}
                  onClick={() => {
                    actions.unlockSkill(node.id);
                    toast.success(`Unlocked ${node.name}!`);
                  }}
                >
                  Unlock ({node.costPoints} pt)
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </ModalShell>
  );
}

function ShopContent({ onClose }) {
  const { state, actions } = useGame();
  const inventory = state.inventory || ["suit-teal-vanguard"];
  const coins = state.coins ?? 100;

  return (
    <ModalShell title="Explorer Gear & Shop" subtitle={`Arena Coins: ${coins} (Cosmetic Only · Zero Pay-to-Win)`} onClose={onClose}>
      <div className="grid gap-3 sm:grid-cols-2">
        {SHOP_ITEMS.map((item) => {
          const owned = inventory.includes(item.id);
          const equipped = state.equipped?.[item.slot] === item.id;
          return (
            <div key={item.id} className="rounded-xl border border-slate-700 bg-slate-900/70 p-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-semibold text-white">{item.name}</span>
                <span className="flex items-center gap-1 font-mono text-amber-400">
                  <Coins className="h-3.5 w-3.5" /> {item.priceCoins}
                </span>
              </div>
              <p className="mt-1 text-slate-300">{item.description}</p>
              <div className="mt-3">
                {owned ? (
                  <Button
                    size="sm"
                    variant={equipped ? "secondary" : "default"}
                    className="h-7 text-xs"
                    disabled={equipped}
                    onClick={() => {
                      actions.equipItem(item.slot, item.id);
                      if (item.slot === "suit") actions.updateProfile({ character: { suitColor: item.colorHex } });
                      toast.success(`Equipped ${item.name}`);
                    }}
                  >
                    {equipped ? "Equipped" : "Equip"}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="hero"
                    className="h-7 text-xs"
                    disabled={coins < item.priceCoins}
                    onClick={() => {
                      const res = actions.buyItem(item);
                      if (res.ok) {
                        if (item.slot === "suit") actions.updateProfile({ character: { suitColor: item.colorHex } });
                        toast.success(`Purchased & Equipped ${item.name}!`);
                      } else {
                        toast.error(res.reason || "Insufficient coins");
                      }
                    }}
                  >
                    <ShoppingBag className="mr-1 h-3 w-3" /> Unlock ({item.priceCoins} Coins)
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ModalShell>
  );
}

function PassportContent({ onClose }) {
  const { state, stats, badges } = useGame();
  const [qrUrl, setQrUrl] = useState("");
  const verifyCode = `AIA-${(state.profile?.alias || "EXP").slice(0, 3).toUpperCase()}-${stats.aei}`;

  useEffect(() => {
    QRCode.toDataURL(`${window.location.origin}/?verify=${verifyCode}`, { width: 120, margin: 1 })
      .then(setQrUrl)
      .catch(() => {});
  }, [verifyCode]);

  const radarData = stats.domainScores.map((d) => ({
    domain: d.label.split(" ")[0],
    score: d.score,
  }));

  const downloadCertificate = () => {
    const html = `<!doctype html><html><head><title>AI Arena Skill Passport</title></head><body style="font-family:sans-serif;padding:40px;background:#0B132B;color:#F8FAFC"><h1>AI ARENA — VERIFIED SKILL PASSPORT</h1><p>Explorer: <strong>${state.profile?.alias}</strong></p><p>AEI Score: <strong>${stats.aei}/100 (${stats.aeiBand})</strong></p><p>Rank: ${stats.rank.title}</p><p>Verification Code: ${verifyCode}</p></body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ai-arena-passport-${verifyCode}.html`;
    a.click();
  };

  return (
    <ModalShell title="AI Skill Passport" subtitle={`Competency Tier: ${stats.aeiBand} (AEI ${stats.aei}/100)`} onClose={onClose} maxWidth="max-w-2xl">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-56 rounded-xl border border-slate-700 bg-slate-900/70 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="domain" tick={{ fill: "#CBD5E1", fontSize: 10 }} />
              <Radar dataKey="score" stroke="#14B8A6" fill="#14B8A6" fillOpacity={0.35} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-amber-500/30 bg-slate-900/70 p-4 text-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase text-amber-400">Credential ID: {verifyCode}</p>
              <h3 className="mt-1 font-display text-lg font-bold text-white">{state.profile?.alias || "Explorer"}</h3>
              <p className="text-teal-300">{stats.rank.title} · {stats.aeiBand}</p>
              <p className="mt-1 text-slate-400">Missions Cleared: {stats.completedIds.length} · Badges: {badges.filter((b) => b.unlocked).length}/{badges.length}</p>
            </div>
            {qrUrl && <img src={qrUrl} alt="Skill Passport QR" className="h-20 w-20 rounded bg-white p-1" />}
          </div>
          <Button size="sm" variant="hero" className="mt-3" onClick={downloadCertificate}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export Certificate
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        {badges.map((b) => (
          <div key={b.id} className={`rounded-lg border p-2 ${b.unlocked ? "border-amber-400/50 bg-amber-500/10" : "border-slate-800 opacity-45"}`}>
            <Award className={`h-4 w-4 ${b.unlocked ? "text-amber-400" : "text-slate-500"}`} />
            <p className="mt-1 font-semibold text-white">{b.name}</p>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}

function LeaderboardContent({ onClose }) {
  const { state } = useGame();
  const [sort, setSort] = useState("efficiency");
  const [remote, setRemote] = useState(null);

  useEffect(() => {
    api.leaderboard().then((r) => setRemote(r.entries || null)).catch(() => {});
  }, []);

  const entries = buildLeaderboard(state, sort, remote);

  return (
    <ModalShell title="Arena Leaderboard" subtitle="Ranked by Verified Efficiency, XP & Clears" onClose={onClose}>
      <div className="mb-3 flex gap-2">
        {["efficiency", "xp", "cleared"].map((k) => (
          <Button key={k} size="sm" variant={sort === k ? "default" : "outline"} onClick={() => setSort(k)} className="capitalize">
            Sort: {k}
          </Button>
        ))}
      </div>
      <div className="space-y-1.5 text-xs">
        {entries.map((row, idx) => (
          <div key={row.id || row.user_id || idx} className={`flex items-center justify-between rounded-lg border px-3 py-2 ${row.isYou ? "border-teal-400 bg-teal-500/15" : "border-slate-700 bg-slate-900/60"}`}>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-amber-400">#{idx + 1}</span>
              <span className="font-semibold text-white">{row.alias}</span>
              {row.isBot && <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">AI Contender</span>}
              {row.isYou && <span className="rounded bg-teal-500/20 px-1.5 py-0.5 text-[10px] text-teal-300">You</span>}
            </div>
            <div className="flex items-center gap-4 font-mono text-slate-300">
              <span>{row.efficiency ?? row.average_efficiency}% Eff</span>
              <span>{row.xp ?? row.total_xp} XP</span>
            </div>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}

function AdminContent({ onClose }) {
  const [analytics, setAnalytics] = useState(null);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    api.leaderboard();
    fetch("/api/admin/analytics", { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setAnalytics)
      .catch((e) => setErrMsg(e.message));
  }, []);

  return (
    <ModalShell title="Admin & Educator Analytics" subtitle="RBAC Protected Dashboard" onClose={onClose}>
      {errMsg ? (
        <p className="text-xs text-rose-400">Unable to load admin metrics: {errMsg}</p>
      ) : !analytics ? (
        <p className="text-xs text-slate-400">Loading analytics…</p>
      ) : (
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-slate-700 bg-slate-900 p-3">
              <p className="text-slate-400">Registered Users</p>
              <p className="mt-1 font-display text-xl font-bold text-white">{analytics.users}</p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-900 p-3">
              <p className="text-slate-400">Total Attempts</p>
              <p className="mt-1 font-display text-xl font-bold text-teal-300">{analytics.attempts?.total}</p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-900 p-3">
              <p className="text-slate-400">Avg Efficiency</p>
              <p className="mt-1 font-display text-xl font-bold text-amber-300">{analytics.attempts?.avg_efficiency}%</p>
            </div>
          </div>
        </div>
      )}
    </ModalShell>
  );
}
