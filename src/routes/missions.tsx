import { createFileRoute } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { MissionCard } from "@/components/arena/MissionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CHALLENGES } from "@/lib/arena/challenges";
import { DIFFICULTIES, DOMAINS, TYPE_LABEL } from "@/lib/arena/domains";
import { computePlayerStats } from "@/lib/arena/game";
import { useArenaState } from "@/lib/arena/storage";
import type { ChallengeType, Difficulty, DomainId } from "@/lib/arena/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/missions")({
  validateSearch: (search: Record<string, unknown>): { domain?: DomainId } => {
    const d = search["domain"];
    const valid = DOMAINS.some((x) => x.id === d);
    return valid ? { domain: d as DomainId } : {};
  },
  head: () => ({
    meta: [
      { title: "Missions — AI Arena" },
      { name: "description", content: "Filter and play 12 interactive AI efficiency missions." },
    ],
  }),
  component: MissionsPage,
});

function MissionsPage() {
  const { domain: initialDomain } = Route.useSearch();
  const state = useArenaState();
  const stats = computePlayerStats(state);

  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState<DomainId | "all">(initialDomain ?? "all");
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [type, setType] = useState<ChallengeType | "all">("all");
  const [status, setStatus] = useState<"all" | "unplayed" | "cleared" | "saved">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CHALLENGES.filter((c) => {
      if (domain !== "all" && c.domain !== domain) return false;
      if (difficulty !== "all" && c.difficulty !== difficulty) return false;
      if (type !== "all" && c.type !== type) return false;
      const cleared = stats.completedIds.includes(c.id);
      if (status === "unplayed" && cleared) return false;
      if (status === "cleared" && !cleared) return false;
      if (status === "saved" && !state.saved.includes(c.id)) return false;
      if (q && !`${c.title} ${c.summary} ${c.scenario}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [query, domain, difficulty, type, status, stats.completedIds, state.saved]);

  const resetFilters = () => {
    setQuery("");
    setDomain("all");
    setDifficulty("all");
    setType("all");
    setStatus("all");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium">Missions</h1>
          <p className="mt-1 text-sm text-muted-foreground tabular">
            {stats.completedIds.length} of {CHALLENGES.length} cleared
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search
            className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"
            strokeWidth={1.5}
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            aria-label="Search missions"
            className="pl-9"
          />
        </div>
      </div>

      <div className="mt-6 space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-16 text-xs text-muted-foreground">Domain</span>
          <button
            type="button"
            onClick={() => setDomain("all")}
            className={cn(
              "tag cursor-pointer transition-colors",
              domain === "all"
                ? "border-primary/50 bg-secondary text-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            All
          </button>
          {DOMAINS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDomain(d.id)}
              className={cn(
                "tag cursor-pointer transition-colors",
                domain === d.id
                  ? "border-primary/50 bg-secondary text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-16 text-xs text-muted-foreground">Level</span>
            {(["all", ...DIFFICULTIES] as const).map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => setDifficulty(diff)}
                className={cn(
                  "tag cursor-pointer transition-colors",
                  difficulty === diff
                    ? "border-primary/50 bg-secondary text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {diff === "all" ? "All" : diff}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Status</span>
            {(["all", "unplayed", "cleared", "saved"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatus(st)}
                className={cn(
                  "tag cursor-pointer capitalize transition-colors",
                  status === st
                    ? "border-primary/50 bg-secondary text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-16 text-xs text-muted-foreground">Format</span>
            <button
              type="button"
              onClick={() => setType("all")}
              className={cn(
                "tag cursor-pointer transition-colors",
                type === "all"
                  ? "border-primary/50 bg-secondary text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              All
            </button>
            {(Object.keys(TYPE_LABEL) as ChallengeType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  "tag cursor-pointer transition-colors",
                  type === t
                    ? "border-primary/50 bg-secondary text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {TYPE_LABEL[t]}
              </button>
            ))}
          </div>

          {(query || domain !== "all" || difficulty !== "all" || type !== "all" || status !== "all") && (
            <Button type="button" size="sm" variant="ghost" onClick={resetFilters}>
              <X className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
              Reset
            </Button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">No missions match those filters</p>
          <Button type="button" variant="outline" className="mt-4" onClick={resetFilters}>
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {filtered.map((c) => (
            <MissionCard
              key={c.id}
              challenge={c}
              bestSubmission={stats.bestByChallenge[c.id]}
              isSaved={state.saved.includes(c.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
