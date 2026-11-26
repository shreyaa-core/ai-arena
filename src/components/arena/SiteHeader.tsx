import { Link, useRouterState } from "@tanstack/react-router";
import { Flame, Gamepad2, Map, Medal, User, Volume2, VolumeX, Zap } from "lucide-react";
import { computePlayerStats } from "@/lib/arena/game";
import { playClick, toggleSoundEnabled, useSoundEnabled } from "@/lib/arena/sound";
import { useArenaState } from "@/lib/arena/storage";
import { cn } from "@/lib/utils";

export function Logo() {
  return (
    <Link
      to="/"
      onClick={() => playClick()}
      className="flex items-center gap-2.5 text-base font-semibold tracking-tight text-foreground"
    >
      <img src="/favicon.svg" alt="" className="h-6 w-6" />
      <span>AI ARENA</span>
    </Link>
  );
}

const NAV_ITEMS = [
  { to: "/", label: "Lobby", icon: Gamepad2 },
  { to: "/missions", label: "Campaign", icon: Map },
  { to: "/blitz", label: "Blitz", icon: Zap },
  { to: "/leaderboard", label: "Rankings", icon: Medal },
  { to: "/profile", label: "Hangar", icon: User },
] as const;

export function SiteHeader() {
  const state = useArenaState();
  const stats = computePlayerStats(state);
  const soundOn = useSoundEnabled();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-40 border-b border-primary/35 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-5">
          <Logo />
          <nav aria-label="Game modes" className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => {
              const active =
                item.to === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.to) ||
                    (item.to === "/missions" && pathname.startsWith("/play"));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => playClick()}
                  className={cn(
                    "inline-flex h-8 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors duration-150",
                    active
                      ? "border border-highlight/60 bg-primary/25 text-foreground shadow-[0_0_12px_-4px_oklch(0.81_0.14_205/0.5)]"
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

        <div className="flex items-center gap-2.5 text-xs">
          {stats.currentStreak > 0 && (
            <span
              className="hidden items-center gap-1 rounded-md border border-nebula/50 bg-nebula/15 px-2 py-1 font-mono text-nebula tabular sm:inline-flex"
              title="Active 70%+ efficiency streak"
            >
              <Flame className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
              {stats.currentStreak}x COMBO
            </span>
          )}
          <span className="hidden rounded-md border border-border bg-card px-2 py-1 font-mono text-highlight tabular sm:inline">
            {stats.completedIds.length ? `${stats.averageEfficiency}% EFF` : "NEW PILOT"}
          </span>
          <Link
            to="/profile"
            onClick={() => playClick()}
            className="inline-flex h-8 items-center gap-2.5 rounded-md border border-primary/50 bg-card px-2.5 font-mono text-xs text-foreground tabular transition-colors duration-150 hover:border-highlight/60"
            title={`${stats.rank.title} — ${stats.totalXp} XP`}
          >
            <span className="text-highlight font-semibold">LV.{stats.rank.level}</span>
            <span className="hidden h-1.5 w-14 overflow-hidden rounded-full bg-secondary sm:inline-block">
              <span
                className="block h-full bg-highlight transition-[width] duration-300"
                style={{ width: `${stats.rankProgress}%` }}
              />
            </span>
            <span className="text-nebula">{stats.totalXp} XP</span>
          </Link>
          <button
            type="button"
            onClick={() => toggleSoundEnabled()}
            aria-label={soundOn ? "Mute game sound" : "Enable game sound"}
            title={soundOn ? "Sound FX: ON" : "Sound FX: OFF"}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:border-highlight/50 hover:text-foreground"
          >
            {soundOn ? (
              <Volume2 className="h-4 w-4 text-highlight" strokeWidth={1.5} />
            ) : (
              <VolumeX className="h-4 w-4" strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>

      <nav
        aria-label="Mobile navigation"
        className="flex items-center justify-around border-t border-border px-2 py-1.5 md:hidden"
      >
        {NAV_ITEMS.map((item) => {
          const active =
            item.to === "/"
              ? pathname === "/"
              : pathname.startsWith(item.to) ||
                (item.to === "/missions" && pathname.startsWith("/play"));
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => playClick()}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors",
                active ? "bg-primary/25 text-highlight" : "text-muted-foreground",
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
  return null;
}
