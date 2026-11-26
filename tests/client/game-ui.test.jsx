import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DynamicScenePreview } from "../../client/src/components/game/DynamicScenePreview.jsx";
import { generateDynamicVisualChallenge } from "../../client/src/engine/dynamicChallenges.js";
import { loadArenaState } from "../../client/src/utils/storage.js";

vi.mock("../../client/src/components/game/PhaserViewport.jsx", () => ({
  PhaserViewport: ({ screen: activeScreen }) => (
    <div data-testid="phaser-viewport" data-screen={activeScreen} />
  ),
}));

import App from "../../client/src/App.jsx";

describe("AI Arena client UI & migration helpers", () => {
  it("renders full App TitleScreen with Play Game launch controls", () => {
    localStorage.clear();
    render(<App />);
    expect(screen.getByRole("heading", { name: /AI ARENA/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Play Game/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Training Grounds/i })).toBeInTheDocument();
  });

  it("renders DynamicScenePreview SVG with accessible scene description", () => {
    const ch = generateDynamicVisualChallenge(404);
    render(<DynamicScenePreview spec={ch.payload.sceneSpec} />);
    const svg = screen.getByRole("img");
    expect(svg).toHaveAttribute("aria-label", expect.stringContaining("Generated scene:"));
  });

  it("safely migrates legacy ai-arena.state.v1 guest saves into v2 schema", () => {
    localStorage.clear();
    localStorage.setItem(
      "ai-arena.state.v1",
      JSON.stringify({
        profile: { alias: "LegacyAce" },
        submissions: [
          {
            id: "old1",
            challengeId: "brief-research-assistant",
            score: 88,
            seconds: 100,
            criteria: [],
            at: "2026-01-01T00:00:00Z",
          },
        ],
        saved: ["brief-research-assistant"],
      }),
    );

    const migrated = loadArenaState();
    expect(migrated.profile.alias).toBe("LegacyAce");
    expect(migrated.submissions).toHaveLength(1);
    expect(migrated.coins).toBeGreaterThanOrEqual(100);
    expect(migrated.unlockedWorlds).toContain("prompt-academy");
  });
});
