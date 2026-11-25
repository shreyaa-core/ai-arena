import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ChallengeRunner } from "@/components/arena/ChallengeRunner";
import { Button } from "@/components/ui/button";
import { CHALLENGES, challengeById } from "@/lib/arena/challenges";
import { recommendNextChallenge } from "@/lib/arena/game";
import { useArenaState } from "@/lib/arena/storage";

export const Route = createFileRoute("/play/$id")({
  head: ({ params }) => {
    const ch = challengeById(params.id);
    return {
      meta: [
        { title: ch ? `${ch.title} — AI Arena` : "Mission Not Found — AI Arena" },
        { name: "description", content: ch?.summary ?? "Interactive AI efficiency mission." },
      ],
    };
  },
  component: PlayMissionPage,
});

function PlayMissionPage() {
  const { id } = Route.useParams();
  const state = useArenaState();
  const challenge = challengeById(id);

  if (!challenge) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Mission not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          That mission ID does not exist in the AI Arena catalog.
        </p>
        <Button asChild className="mt-6" variant="hero">
          <Link to="/missions">Back to Missions</Link>
        </Button>
      </div>
    );
  }

  const next = recommendNextChallenge(state);
  const nextChallenge =
    next.id !== challenge.id
      ? next
      : CHALLENGES[(CHALLENGES.findIndex((c) => c.id === challenge.id) + 1) % CHALLENGES.length];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4">
        <Link
          to="/missions"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          All Missions
        </Link>
      </div>

      <ChallengeRunner challenge={challenge} nextChallenge={nextChallenge} />
    </div>
  );
}
