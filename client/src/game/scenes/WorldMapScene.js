import Phaser from "phaser";
import { WORLDS } from "../../data/worlds.js";
import { gameEvents } from "../gameEvents.js";

/**
 * Interactive orbital world map connecting all 6 AI territories and the Grandmaster Arena.
 */
export class WorldMapScene extends Phaser.Scene {
  constructor() {
    super({ key: "WorldMapScene" });
    this.nodes = [];
    this.snapshot = {
      unlockedWorlds: ["prompt-academy"],
      restoredWorlds: [],
      xp: 0,
    };
  }

  init(data) {
    if (data) this.snapshot = { ...this.snapshot, ...data };
  }

  create() {
    const { width, height } = this.scale;
    const scaleX = width / 1140;
    const scaleY = height / 560;

    // Atmosphere & starfield
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x070d1f, 0x0b132b, 0x101c3a, 0x182548, 1);
    bg.fillRect(0, 0, width, height);

    // Subtle orbital ring guides
    const guides = this.add.graphics();
    guides.lineStyle(1, 0x38bdf8, 0.14);
    guides.strokeEllipse(width * 0.5, height * 0.52, width * 0.78, height * 0.66);
    guides.strokeEllipse(width * 0.5, height * 0.52, width * 0.52, height * 0.42);

    // Draw glowing energy conduits between territories
    const lines = this.add.graphics();
    for (let i = 0; i < WORLDS.length - 1; i++) {
      const a = WORLDS[i];
      const b = WORLDS[i + 1];
      const ax = a.mapPos.x * scaleX;
      const ay = a.mapPos.y * scaleY;
      const bx = b.mapPos.x * scaleX;
      const by = b.mapPos.y * scaleY;
      const unlocked = (this.snapshot.unlockedWorlds || []).includes(b.id) || this.snapshot.xp >= b.requiredXp;
      lines.lineStyle(unlocked ? 3 : 2, unlocked ? b.accentNum : 0x475569, unlocked ? 0.55 : 0.28);
      lines.lineBetween(ax, ay, bx, by);
    }

    // Place interactive world nodes
    this.nodes = [];
    for (const world of WORLDS) {
      const x = world.mapPos.x * scaleX;
      const y = world.mapPos.y * scaleY;
      const unlocked =
        (this.snapshot.unlockedWorlds || []).includes(world.id) || this.snapshot.xp >= world.requiredXp;
      const restored = (this.snapshot.restoredWorlds || []).includes(world.id);

      const container = this.add.container(x, y);

      // Outer restoration halo
      const halo = this.add.circle(0, 0, restored ? 42 : 34, world.accentNum, restored ? 0.25 : unlocked ? 0.14 : 0.05);
      const disc = this.add.circle(0, 0, 26, unlocked ? 0x141d38 : 0x0f172a, 1);
      disc.setStrokeStyle(3, restored ? 0xfbbf24 : unlocked ? world.accentNum : 0x475569, unlocked ? 1 : 0.6);

      const badgeText = this.add
        .text(0, 0, restored ? "★" : unlocked ? String(world.order) : "🔒", {
          fontFamily: "Roboto, sans-serif",
          fontSize: restored ? "20px" : "16px",
          color: restored ? "#FBBF24" : unlocked ? "#F1F5F9" : "#94A3B8",
        })
        .setOrigin(0.5);

      const labelBg = this.add.rectangle(0, 44, Math.max(138, world.name.length * 9.5 + 22), 28, 0x0b132b, 0.9);
      labelBg.setStrokeStyle(1, unlocked ? world.accentNum : 0x334155, 0.7);
      const label = this.add
        .text(0, 44, world.name, {
          fontFamily: "Roboto, sans-serif",
          fontSize: "15px",
          fontStyle: "bold",
          color: unlocked ? "#F1F5F9" : "#94A3B8",
        })
        .setOrigin(0.5);

      const sub = this.add
        .text(0, 68, restored ? "Restored" : unlocked ? "Available" : `Requires ${world.requiredXp} XP`, {
          fontFamily: "Roboto, sans-serif",
          fontSize: "13px",
          color: restored ? "#FBBF24" : unlocked ? world.accent : "#94A3B8",
        })
        .setOrigin(0.5);

      container.add([halo, disc, badgeText, labelBg, label, sub]);
      container.setSize(80, 85);
      container.setInteractive({ useHandCursor: unlocked });

      container.on("pointerover", () => {
        if (!unlocked) return;
        this.tweens.add({ targets: container, scale: 1.09, duration: 150 });
        halo.setFillStyle(world.accentNum, 0.34);
      });
      container.on("pointerout", () => {
        this.tweens.add({ targets: container, scale: 1, duration: 150 });
        halo.setFillStyle(world.accentNum, restored ? 0.25 : unlocked ? 0.14 : 0.05);
      });
      container.on("pointerdown", () => {
        gameEvents.emit("world:select", { world, unlocked });
      });

      if (unlocked) {
        this.tweens.add({
          targets: halo,
          scale: { from: 0.95, to: 1.12 },
          duration: 1800,
          yoyo: true,
          repeat: -1,
        });
      }
      this.nodes.push(container);
    }
  }
}
