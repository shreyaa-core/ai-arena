import { createFileRoute } from "@tanstack/react-router";
import { CHALLENGES } from "@/lib/arena/challenges";
import { DOMAINS, TYPE_LABEL, domainById } from "@/lib/arena/domains";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Arena — How good are you at working with AI?" },
      { name: "description", content: "Practice and measure applied AI skills with realistic, rubric-scored challenges." },
      { property: "og:title", content: "AI Arena — How good are you at working with AI?" },
      { property: "og:description", content: "Practice and measure applied AI skills with realistic, rubric-scored challenges." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="relative">
      <div className="bg-grid pointer-events-none absolute inset-0 h-[480px]" aria-hidden />
      <section className="relative mx-auto max-w-6xl px-4 pb-12 pt-20">
        <span className="chip border-primary/40 text-primary">Indicative practice assessment</span>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold md:text-6xl">
          How good are you at <span className="text-gradient">working with AI?</span>
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Realistic challenges across six skill domains, scored against transparent rubrics.
        </p>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-12 sm:grid-cols-2 lg:grid-cols-3">
        {DOMAINS.map((d) => (
          <div key={d.id} className="rounded-xl border border-border bg-gradient-surface p-5">
            <d.icon className="h-5 w-5 text-highlight" aria-hidden />
            <h2 className="mt-3 font-semibold">{d.label}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{d.blurb}</p>
          </div>
        ))}
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <h2 className="mb-4 text-2xl font-semibold">Challenges</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {CHALLENGES.map((c) => (
            <article key={c.id} className="rounded-xl border border-paper-border bg-paper p-5 text-paper-foreground">
              <div className="flex flex-wrap gap-2 text-paper-muted-foreground">
                <span className="chip">{domainById(c.domain).label}</span>
                <span className="chip">{c.difficulty}</span>
                <span className="chip">{c.minutes} min</span>
                <span className="chip">{TYPE_LABEL[c.type]}</span>
              </div>
              <h3 className="mt-3 font-semibold">{c.title}</h3>
              <p className="mt-1 text-sm text-paper-muted-foreground">{c.summary}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
