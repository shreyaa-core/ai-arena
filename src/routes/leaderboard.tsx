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
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-muted-foreground">
            Demo benchmark data · simulated contenders
          </div>
          <h1 className="mt-1 flex items-center gap-2.5 text-3xl font-medium">
            <Medal className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} aria-hidden />
            Leaderboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your local guest score is ranked against simulated benchmark profiles
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
                "tag cursor-pointer transition-colors",
                sort === opt.id
                  ? "border-primary/50 bg-secondary text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-secondary/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Rank</th>
              <th className="px-4 py-3 font-medium">Operator</th>
              <th className="px-4 py-3 text-right font-medium">Efficiency</th>
              <th className="px-4 py-3 text-right font-medium">XP</th>
              <th className="px-4 py-3 text-right font-medium">Cleared</th>
              <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">Best streak</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row, idx) => (
              <tr
                key={row.id}
                className={cn(
                  "transition-colors",
                  row.isYou
                    ? "bg-arcade-purple/20 shadow-[inset_2px_0_0_#00F5FF]"
                    : "hover:bg-secondary/40",
                )}
              >
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground tabular">
                  #{idx + 1}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{row.alias}</span>
                    {row.isYou && (
                      <span className="tag border-highlight/50 bg-highlight/15 text-highlight">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{row.rankTitle}</div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-highlight tabular">
                  {row.efficiency}%
                </td>
                <td className="px-4 py-3 text-right font-mono text-warning tabular">{row.xp}</td>
                <td className="px-4 py-3 text-right font-mono tabular">{row.cleared}/12</td>
                <td className="hidden px-4 py-3 text-right font-mono tabular sm:table-cell">
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
            <Play className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            Play blitz mode
          </Link>
        </Button>
      </div>
    </div>
  );
}
