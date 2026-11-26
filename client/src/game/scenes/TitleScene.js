import Phaser from "phaser";

/**
 * Full-screen animated space station / orbital citadel backdrop rendered in Phaser
 * behind the Title Screen launch menu.
 */
export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: "TitleScene" });
    this.stars = [];
    this.rings = [];
  }

  create() {
    const { width, height } = this.scale;

    // Deep midnight sky gradient backdrop
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x070d1f, 0x0b132b, 0x141d38, 0x1c2541, 1);
    bg.fillRect(0, 0, width, height);

    // Subtle geometric sector horizon
    const horizon = this.add.graphics();
    horizon.fillStyle(0x14b8a6, 0.08);
    horizon.fillEllipse(width * 0.5, height * 0.92, width * 1.1, height * 0.45);
    horizon.lineStyle(2, 0x14b8a6, 0.28);
    horizon.strokeEllipse(width * 0.5, height * 0.92, width * 1.05, height * 0.42);

    // Drifting starfield
    for (let i = 0; i < 85; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height * 0.85);
      const r = Phaser.Math.FloatBetween(0.8, 2.2);
      const star = this.add.circle(x, y, r, i % 5 === 0 ? 0xf59e0b : 0xf1f5f9, Phaser.Math.FloatBetween(0.25, 0.85));
      star.speed = Phaser.Math.FloatBetween(4, 16);
      this.stars.push(star);
    }

    // Floating orbital AI core monolith on right flank
    const cx = Math.min(width * 0.75, width - 220);
    const cy = height * 0.48;
    const g = this.add.graphics({ x: cx, y: cy });
    g.fillStyle(0x1c2541, 0.92);
    g.lineStyle(2, 0x14b8a6, 0.8);
    g.fillPoints(
      [
        { x: 0, y: -90 },
        { x: 58, y: -32 },
        { x: 42, y: 78 },
        { x: 0, y: 105 },
        { x: -42, y: 78 },
        { x: -58, y: -32 },
      ],
      true,
    );
    g.strokePoints(
      [
        { x: 0, y: -90 },
        { x: 58, y: -32 },
        { x: 42, y: 78 },
        { x: 0, y: 105 },
        { x: -42, y: 78 },
        { x: -58, y: -32 },
      ],
      true,
    );
    g.fillStyle(0xf59e0b, 0.9);
    g.fillCircle(0, -10, 14);
    this.coreNode = g;

    for (let i = 1; i <= 3; i++) {
      const ring = this.add.circle(cx, cy, 85 + i * 32);
      ring.setStrokeStyle(1.2, i === 2 ? 0xf59e0b : 0x14b8a6, 0.28);
      ring.phase = i * 1.1;
      this.rings.push(ring);
    }

    this.tweens.add({
      targets: this.coreNode,
      y: cy - 14,
      duration: 2800,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });
  }

  update(_time, delta) {
    const { width } = this.scale;
    const dt = delta / 1000;
    for (const s of this.stars) {
      s.x -= s.speed * dt;
      if (s.x < -4) s.x = width + 4;
    }
    for (const r of this.rings) {
      r.phase += dt * 1.2;
      r.setScale(1 + Math.sin(r.phase) * 0.03);
    }
  }
}
