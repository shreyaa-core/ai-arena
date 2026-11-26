import Phaser from "phaser";
import { TitleScene } from "./scenes/TitleScene.js";
import { WorldMapScene } from "./scenes/WorldMapScene.js";
import { TerritoryScene } from "./scenes/TerritoryScene.js";

export function createPhaserGame(parentEl) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: parentEl,
    width: parentEl.clientWidth || 1280,
    height: parentEl.clientHeight || 720,
    backgroundColor: "#0B132B",
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0 },
        debug: false,
      },
    },
    scene: [TitleScene, WorldMapScene, TerritoryScene],
  });
}
