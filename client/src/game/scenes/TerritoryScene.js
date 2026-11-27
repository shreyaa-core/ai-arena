import Phaser from "phaser";
import { worldById } from "../../data/worlds.js";
import { gameEvents } from "../gameEvents.js";

/**
 * Interactive 2D/2.5D playable territory map with animated player avatar,
 * companion drone NOVA, NPC, interactive consoles, collectibles, and boss pedestal.
 */
export class TerritoryScene extends Phaser.Scene {
  constructor() {
    super({ key: "TerritoryScene" });
    this.worldConfig = worldById("prompt-academy");
    this.snapshot = {
      completedIds: [],
      completedTutorials: [],
      restoredWorlds: [],
      suitHex: 0x14b8a6,
      visorHex: 0x38bdf8,
      alias: "Explorer",
    };
    this.interactables = [];
    this.moveTarget = null;
    this.playerSpeed = 230;
  }

  init(data) {
    if (data?.worldId) this.worldConfig = worldById(data.worldId);
    if (data) this.snapshot = { ...this.snapshot, ...data };
  }

  create() {
    const worldWidth = 1280;
    const worldHeight = 620;
    const cfg = this.worldConfig;
    const isRestored = (this.snapshot.restoredWorlds || []).includes(cfg.id);

    this.physics.world.setBounds(40, 60, worldWidth - 80, worldHeight - 100);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

    // Multi-layered stylized floor & grid ambiance
    const bg = this.add.graphics();
    bg.fillGradientStyle(cfg.skyTop, cfg.skyTop, cfg.skyBottom, cfg.floorColor, 1);
    bg.fillRect(0, 0, worldWidth, worldHeight);

    // Circuit floor pathways
    const floor = this.add.graphics();
    floor.fillStyle(cfg.floorColor, 0.92);
    floor.fillRoundedRect(36, 56, worldWidth - 72, worldHeight - 96, 18);
    floor.lineStyle(2, isRestored ? 0xfbbf24 : cfg.accentNum, isRestored ? 0.55 : 0.35);
    floor.strokeRoundedRect(36, 56, worldWidth - 72, worldHeight - 96, 18);

    floor.lineStyle(1, cfg.tileAccent, 0.45);
    for (let gx = 80; gx < worldWidth - 60; gx += 64) {
      floor.lineBetween(gx, 64, gx, worldHeight - 48);
    }
    for (let gy = 90; gy < worldHeight - 50; gy += 64) {
      floor.lineBetween(44, gy, worldWidth - 44, gy);
    }

    // Floating environmental particles (brighter & golden when restored)
    for (let i = 0; i < 24; i++) {
      const px = Phaser.Math.Between(60, worldWidth - 60);
      const py = Phaser.Math.Between(80, worldHeight - 60);
      const dot = this.add.circle(px, py, Phaser.Math.Between(2, 4), isRestored ? 0xfbbf24 : cfg.accentNum, 0.28);
      this.tweens.add({
        targets: dot,
        y: py - Phaser.Math.Between(12, 28),
        alpha: { from: 0.15, to: 0.55 },
        duration: Phaser.Math.Between(2000, 4200),
        yoyo: true,
        repeat: -1,
      });
    }

    this.interactables = [];

    // Territory NPC mentor station
    const npcX = 140;
    const npcY = 300;
    const npcContainer = this.add.container(npcX, npcY);
    const npcAura = this.add.circle(0, 0, 28, cfg.accentNum, 0.18);
    const npcBody = this.add.circle(0, 0, 18, 0x1e293b, 1).setStrokeStyle(2.5, 0xfbbf24, 0.9);
    const npcIcon = this.add.text(0, 0, "NPC", { fontFamily: "Chakra Petch", fontSize: "12px", fontStyle: "bold", color: "#FBBF24" }).setOrigin(0.5);
    const npcLabel = this.add.text(0, 32, cfg.npc.name, { fontFamily: "Chakra Petch", fontSize: "14px", color: "#F1F5F9" }).setOrigin(0.5);
    npcContainer.add([npcAura, npcBody, npcIcon, npcLabel]);
    npcContainer.setSize(64, 64).setInteractive({ useHandCursor: true });
    this.tweens.add({ targets: npcBody, y: -4, duration: 1400, yoyo: true, repeat: -1 });
    this.registerInteractable({
      id: `npc-${cfg.id}`,
      kind: "npc",
      label: `Talk to ${cfg.npc.name}`,
      x: npcX,
      y: npcY,
      container: npcContainer,
      payload: cfg.npc,
    });

    // Interactive stations (tutorials, missions, boss)
    for (const st of cfg.stations) {
      const done =
        (this.snapshot.completedIds || []).includes(st.id) ||
        (this.snapshot.completedTutorials || []).includes(st.id);

      const c = this.add.container(st.x, st.y);
      const glow = this.add.circle(0, 0, st.kind === "boss" ? 38 : 28, st.color, done ? 0.3 : 0.16);
      const pad = this.add.rectangle(0, 0, st.kind === "boss" ? 50 : 40, st.kind === "boss" ? 50 : 40, 0x0f172a, 0.95);
      pad.setRotation(st.kind === "boss" ? Math.PI / 4 : 0);
      pad.setStrokeStyle(2.5, done ? 0x22c55e : st.color, 1);

      const glyph = st.kind === "boss" ? "⚔" : st.kind === "tutorial" ? "?" : done ? "✓" : "◆";
      const txt = this.add.text(0, 0, glyph, {
        fontFamily: "Chakra Petch, sans-serif",
        fontSize: st.kind === "boss" ? "20px" : "16px",
        color: done ? "#22C55E" : "#F8FAFC",
      }).setOrigin(0.5);

      const nameTag = this.add
        .text(0, 36, st.label, {
          fontFamily: "Roboto, sans-serif",
          fontSize: "14px",
          backgroundColor: "#0B132B",
          padding: { x: 8, y: 3 },
          color: done ? "#86EFAC" : "#F1F5F9",
        })
        .setOrigin(0.5);

      c.add([glow, pad, txt, nameTag]);
      c.setSize(68, 68).setInteractive({ useHandCursor: true });

      this.tweens.add({
        targets: glow,
        scale: { from: 0.92, to: 1.12 },
        duration: 1600,
        yoyo: true,
        repeat: -1,
      });

      this.registerInteractable({
        id: st.id,
        kind: st.kind,
        label: st.label,
        x: st.x,
        y: st.y,
        container: c,
        payload: st,
      });
    }

    // Collectible shard if not yet picked up
    const shardKey = `collectible:${cfg.id}`;
    if (cfg.collectible && !(this.snapshot.completedTutorials || []).includes(shardKey)) {
      const col = this.add.container(cfg.collectible.x, cfg.collectible.y);
      const gem = this.add.polygon(0, 0, [0, -14, 12, 0, 0, 14, -12, 0], 0xfbbf24, 0.9);
      gem.setStrokeStyle(2, 0xfef3c7, 1);
      const lbl = this.add.text(0, 24, cfg.collectible.label, { fontFamily: "Roboto", fontSize: "13px", color: "#FBBF24" }).setOrigin(0.5);
      col.add([gem, lbl]).setSize(48, 48).setInteractive({ useHandCursor: true });
      this.tweens.add({ targets: gem, angle: 360, duration: 4800, repeat: -1 });
      this.registerInteractable({
        id: shardKey,
        kind: "collectible",
        label: `Collect ${cfg.collectible.label}`,
        x: cfg.collectible.x,
        y: cfg.collectible.y,
        container: col,
        payload: { worldId: cfg.id, label: cfg.collectible.label },
      });
    }

    // Side-quest / Extra Game Mode portal
    if (cfg.sideQuest) {
      const sq = this.add.container(cfg.sideQuest.x, cfg.sideQuest.y);
      const ring = this.add.circle(0, 0, 22, 0xa78bfa, 0.2).setStrokeStyle(2, 0xa78bfa, 0.9);
      const ico = this.add.text(0, 0, "◈", { fontFamily: "Chakra Petch", fontSize: "16px", color: "#C4B5FD" }).setOrigin(0.5);
      const tag = this.add.text(0, 30, cfg.sideQuest.label, { fontFamily: "Roboto", fontSize: "14px", color: "#DDD6FE", backgroundColor: "#0B132B", padding: { x: 7, y: 3 } }).setOrigin(0.5);
      sq.add([ring, ico, tag]).setSize(60, 60).setInteractive({ useHandCursor: true });
      this.registerInteractable({
        id: `mode-${cfg.sideQuest.mode}`,
        kind: "mode",
        label: cfg.sideQuest.label,
        x: cfg.sideQuest.x,
        y: cfg.sideQuest.y,
        container: sq,
        payload: { mode: cfg.sideQuest.mode },
      });
    }

    // Create procedural Player Explorer avatar + Physics body
    this.player = this.add.container(190, 360);
    const shadow = this.add.ellipse(0, 18, 30, 10, 0x000000, 0.45);
    const body = this.add.circle(0, 0, 16, this.snapshot.suitHex || 0x14b8a6, 1).setStrokeStyle(2.5, 0xf8fafc, 0.9);
    const visor = this.add.rectangle(4, -3, 14, 7, this.snapshot.visorHex || 0x38bdf8, 1);
    const pName = this.add
      .text(0, -30, this.snapshot.alias || "Explorer", {
        fontFamily: "Chakra Petch, sans-serif",
        fontSize: "14px",
        color: "#F8FAFC",
        backgroundColor: "#0B132B",
        padding: { x: 7, y: 2 },
      })
      .setOrigin(0.5);
    this.player.add([shadow, body, visor, pName]);
    this.player.setSize(34, 34);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);

    // Floating companion NOVA orb trailing the explorer
    this.novaOrb = this.add.container(160, 330);
    const novaHalo = this.add.circle(0, 0, 12, 0x38bdf8, 0.25);
    const novaCore = this.add.circle(0, 0, 7, 0x22d3ee, 1).setStrokeStyle(1.5, 0xffffff, 0.9);
    this.novaOrb.add([novaHalo, novaCore]);

    // Contextual world interaction prompt
    this.promptHint = this.add
      .text(190, 310, "", {
        fontFamily: "Chakra Petch, sans-serif",
        fontSize: "15px",
        fontStyle: "bold",
        color: "#06211E",
        backgroundColor: "#14B8A6",
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5)
      .setDepth(50)
      .setVisible(false);

    // Keyboard & Click-to-move controls (disableGlobalCapture + enableCapture=false so <input>/<textarea> always receive W/A/S/D/E/Arrows)
    this.input.keyboard.disableGlobalCapture();
    this.input.keyboard.clearCaptures();
    this.cursors = this.input.keyboard.addKeys(
      {
        up: Phaser.Input.Keyboard.KeyCodes.UP,
        down: Phaser.Input.Keyboard.KeyCodes.DOWN,
        left: Phaser.Input.Keyboard.KeyCodes.LEFT,
        right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      },
      false,
    );
    this.wasd = this.input.keyboard.addKeys("W,A,S,D", false);
    this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E, false);

    this.input.on("pointerdown", (pointer, currentlyOver) => {
      if (currentlyOver && currentlyOver.length > 0) return;
      this.moveTarget = { x: pointer.worldX, y: pointer.worldY };
    });

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.fadeIn(350, 11, 19, 43);
  }

  registerInteractable(entry) {
    entry.container.on("pointerdown", () => {
      this.moveTarget = { x: entry.x, y: entry.y + 30 };
      gameEvents.emit("station:activate", entry);
    });
    this.interactables.push(entry);
  }

  update(_time, _delta) {
    if (!this.player?.body) return;

    const activeEl = typeof document !== "undefined" ? document.activeElement : null;
    const isTyping =
      activeEl &&
      (activeEl.tagName === "INPUT" ||
        activeEl.tagName === "TEXTAREA" ||
        activeEl.tagName === "SELECT" ||
        activeEl.isContentEditable);

    if (isTyping || !this.input.keyboard.enabled) {
      this.moveTarget = null;
      this.player.body.setVelocity(0, 0);
      return;
    }

    let vx = 0;
    let vy = 0;
    if (this.cursors.left.isDown || this.wasd.A.isDown) vx = -1;
    else if (this.cursors.right.isDown || this.wasd.D.isDown) vx = 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) vy = -1;
    else if (this.cursors.down.isDown || this.wasd.S.isDown) vy = 1;

    if (vx !== 0 || vy !== 0) {
      this.moveTarget = null;
      const vec = new Phaser.Math.Vector2(vx, vy).normalize().scale(this.playerSpeed);
      this.player.body.setVelocity(vec.x, vec.y);
    } else if (this.moveTarget) {
      const dx = this.moveTarget.x - this.player.x;
      const dy = this.moveTarget.y - this.player.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 10) {
        this.moveTarget = null;
        this.player.body.setVelocity(0, 0);
      } else {
        this.player.body.setVelocity((dx / dist) * this.playerSpeed, (dy / dist) * this.playerSpeed);
      }
    } else {
      this.player.body.setVelocity(0, 0);
    }

    // NOVA smooth follow
    const targetNx = this.player.x - 28;
    const targetNy = this.player.y - 26 + Math.sin(this.time.now / 380) * 5;
    this.novaOrb.x += (targetNx - this.novaOrb.x) * 0.12;
    this.novaOrb.y += (targetNy - this.novaOrb.y) * 0.12;

    // Proximity prompt for nearby station
    let nearest = null;
    let bestDist = 74;
    for (const item of this.interactables) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y);
      if (d < bestDist) {
        bestDist = d;
        nearest = item;
      }
    }

    if (nearest) {
      this.promptHint.setText(`[E] ${nearest.label}`);
      this.promptHint.setPosition(nearest.x, nearest.y - 44);
      this.promptHint.setVisible(true);
      if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
        gameEvents.emit("station:activate", nearest);
      }
    } else {
      this.promptHint.setVisible(false);
    }
  }
}
