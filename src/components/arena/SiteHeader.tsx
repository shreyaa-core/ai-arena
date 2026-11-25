import { Link, useRouterState } from "@tanstack/react-router";
import { Flame, Medal, Swords, Target, User, Zap } from "lucide-react";
import { computePlayerStats } from "@/lib/arena/game";
import { useArenaState } from "@/lib/arena/storage";
import { cn } from "@/lib/utils";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 text-base font-medium tracking-tight text-foreground">
      <img src="/favicon.svg" alt="" className="h-6 w-6" />
      <span>AI Arena</span>
    </Link>
  );
}

const NAV_ITEMS = [
  { to: "/", label: "Arena", icon: Swords },
  { to: "/missions", label: "Missions", icon: Target },
  { to: "/blitz", label: "Blitz", icon: Zap },
  { to: "/leaderboard", label: "Leaderboard", icon: Medal },
  { to: "/profile", label: "Report", icon: User },
] as const;

export function SiteHeader() {
  const state = useArenaState();
  const stats = computePlayerStats(state);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-40 border-b border-arcade-purple/35 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Logo />
          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => {
              const active =
                item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "inline-flex h-8 items-center gap-2 rounded-md px-3 text-sm transition-colors duration-150",
                    active
                      ? "border border-highlight/45 bg-arcade-purple/25 text-foreground"
                      : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
                  )}
                >
                  <item.icon
                    className={cn("h-4 w-4", active ? "text-highlight" : "text-muted-foreground")}
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {stats.currentStreak > 0 && (
            <span
              className="hidden items-center gap-1 font-mono text-warning tabular sm:inline-flex"
              title="Active 70%+ efficiency streak"
            >
              <Flame className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
              {stats.currentStreak}x
            </span>
          )}
          <span className="hidden font-mono text-highlight tabular sm:inline">
            {stats.completedIds.length ? `${stats.averageEfficiency}% eff` : "Unranked"}
          </span>
          <Link
            to="/profile"
            className="inline-flex h-8 items-center gap-2 rounded-md border border-arcade-purple/50 bg-secondary px-2.5 font-mono text-xs text-foreground tabular transition-colors duration-150 hover:border-highlight/60"
            title={`${stats.rank.title} — ${stats.totalXp} XP`}
          >
            <span className="text-highlight">Lv.{stats.rank.level}</span>
            <span className="text-warning">{stats.totalXp} XP</span>
          </Link>
        </div>
      </div>

      <nav
        aria-label="Mobile navigation"
        className="flex items-center justify-around border-t border-border px-2 py-1.5 md:hidden"
      >
        {NAV_ITEMS.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors",
                active ? "bg-arcade-purple/25 text-highlight" : "text-muted-foreground",
              )}
            >
              <item.icon className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-arcade-purple/30 py-6 text-center text-xs text-muted-foreground">
      AI Arena is an indicative practice game and rubric assessment — not a certified credential
    </footer>
  );
}
