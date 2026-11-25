import { createFileRoute, Link } from "@tanstack/react-router";
import { Medal, Play } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { buildLeaderboard, type LeaderboardSort } from "@/lib/arena/leaderboard";
import { useArenaState } from "@/lib/arena/storage";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard (Demo) — AI Arena" },
      { name: "description", content: "Compare your AI Efficiency Index against simulated benchmark operators." },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const state = useArenaState();
  const [sort, setSort] = useState<LeaderboardSort>("efficiency");
  const rows = buildLeaderboard(state, sort);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="chip border-warning/40 bg-warning/10 text-warning">
            Demo Benchmark Data — Simulated Contenders
          </span>
          <h1 className="mt-2 flex items-center gap-2 text-3xl font-bold">
            <Medal className="h-7 w-7 text-highlight" aria-hidden />
            Efficiency Leaderboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your local guest score is ranked live against simulated AI Arena benchmark profiles.
          </p>
        </div>

        <div className="flex gap-1.5">
          {(
            [
              { id: "efficiency", label: "Efficiency" },
              { id: "xp", label: "XP" },
              { id: "cleared", label: "Cleared" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSort(opt.id)}
              className={cn(
                "chip cursor-pointer",
                sort === opt.id ? "border-primary bg-primary/20 text-foreground" : "border-border text-muted-foreground",
              )}
            >
              Sort: {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Operator</th>
              <th className="px-4 py-3 text-right">Efficiency</th>
              <th className="px-4 py-3 text-right">XP</th>
              <th className="px-4 py-3 text-right">Cleared</th>
              <th className="hidden px-4 py-3 text-right sm:table-cell">Best Streak</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row, idx) => (
              <tr
                key={row.id}
                className={cn(row.isYou ? "bg-primary/15 font-medium" : "hover:bg-muted/20")}
              >
                <td className="px-4 py-3 font-mono text-xs">#{idx + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span>{row.alias}</span>
                    {row.isYou && (
                      <span className="chip border-highlight/40 bg-highlight/15 text-highlight">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{row.rankTitle}</div>
                </td>
                <td className="px-4 py-3 text-right font-mono">{row.efficiency}%</td>
                <td className="px-4 py-3 text-right font-mono text-highlight">{row.xp}</td>
                <td className="px-4 py-3 text-right font-mono">{row.cleared}/12</td>
                <td className="hidden px-4 py-3 text-right font-mono sm:table-cell">
                  {row.bestStreak}x
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end">
        <Button asChild variant="hero">
          <Link to="/blitz">
            <Play className="h-4 w-4" aria-hidden />
            Climb Ranks in Blitz Mode
          </Link>
        </Button>
      </div>
    </div>
  );
}
