import Phaser from 'phaser';
import { GH, GW } from './pixel';
import { LabScene } from './lab';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GW,
  height: GH,
  backgroundColor: '#000000',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [LabScene],
  render: { pixelArt: true, antialias: false, roundPixels: true, powerPreference: 'high-performance' },
  fps: { target: 60 },
});
(window as unknown as { __phaser: Phaser.Game }).__phaser = game;
