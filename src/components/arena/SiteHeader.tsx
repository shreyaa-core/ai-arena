import { Link, useRouterState } from "@tanstack/react-router";
import { Flame, Gauge, Medal, Swords, Target, User, Zap } from "lucide-react";
import { computePlayerStats } from "@/lib/arena/game";
import { useArenaState } from "@/lib/arena/storage";
import { cn } from "@/lib/utils";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
      <img src="/favicon.svg" alt="" className="h-7 w-7" />
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
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
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
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/15 text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <item.icon className="h-3.5 w-3.5" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {stats.currentStreak > 0 && (
            <span
              className="chip border-warning/40 bg-warning/10 text-warning"
              title="Active 70%+ efficiency streak"
            >
              <Flame className="h-3 w-3" aria-hidden />
              {stats.currentStreak}x
            </span>
          )}
          <span
            className="hidden chip border-highlight/40 bg-highlight/10 text-highlight sm:inline-flex"
            title="Average AI Efficiency Score"
          >
            <Gauge className="h-3 w-3" aria-hidden />
            {stats.completedIds.length ? `${stats.averageEfficiency}% Eff` : "Unranked"}
          </span>
          <Link
            to="/profile"
            className="chip border-primary/40 bg-primary/15 text-foreground transition-colors hover:bg-primary/25"
            title={`${stats.rank.title} — ${stats.totalXp} XP`}
          >
            <span className="font-mono text-[11px] text-primary">Lv.{stats.rank.level}</span>
            <span>{stats.totalXp} XP</span>
          </Link>
        </div>
      </div>

      <nav
        aria-label="Mobile navigation"
        className="flex items-center justify-around border-t border-border/60 px-2 py-1.5 md:hidden"
      >
        {NAV_ITEMS.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-1 rounded px-2 py-1 text-xs font-medium",
                active ? "bg-primary/15 text-foreground" : "text-muted-foreground",
              )}
            >
              <item.icon className="h-3.5 w-3.5" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
      AI Arena is an indicative practice game &amp; rubric assessment — not a certified or scientifically validated credential.
    </footer>
  );
}
