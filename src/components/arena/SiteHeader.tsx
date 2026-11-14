import { Link } from "@tanstack/react-router";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
      <img src="/favicon.svg" alt="" className="h-7 w-7" />
      AI Arena
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Logo />
        <span className="chip border-highlight/40 text-highlight">Guest practice mode</span>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
      AI Arena is an indicative practice assessment — not a certified or scientifically validated credential.
    </footer>
  );
}
