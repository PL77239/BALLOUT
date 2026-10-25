import Phaser from 'phaser';
import { W, H } from './tuning';
import { MenuScene } from './menu';
import { GameScene } from './game';
import type { GameCfg } from './game';
import type { CourtId } from './courts';

const q = new URLSearchParams(location.search);

class BootScene extends Phaser.Scene {
  constructor() { super('boot'); }
  create() {
    if (q.get('auto')) {
      const cfg: GameCfg = {
        mode: q.get('auto') === '2' ? '1p' : q.get('auto') === '3' ? '2p' : 'sim', court: (q.get('court') as CourtId) || 'brooklyn',
        look1: +(q.get('l1') ?? 0), look2: +(q.get('l2') ?? 1), level: 'hooper', target: +(q.get('to') ?? 11),
      };
      this.scene.start('game', cfg);
    } else this.scene.start('menu');
  }
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: W,
  height: H,
  backgroundColor: '#000000',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, MenuScene, GameScene],
  render: { antialias: true, powerPreference: 'high-performance' },
  fps: { target: 60 },
});
(window as unknown as { __phaser: Phaser.Game }).__phaser = game;
