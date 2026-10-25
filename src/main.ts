import Phaser from 'phaser';
import { GH, GW } from './pixel';
import { LabScene } from './lab';
import { GameCfg, GameScene } from './game';
import { MenuScene } from './menu';
import { buildLoadout, STARTER_EQUIP } from './loadout';
import { save } from './save';
import { AiLevel } from './tuning';
import { CourtId } from './courts';

const q = new URLSearchParams(location.search);

class BootScene extends Phaser.Scene {
  constructor() { super('boot'); }
  create() {
    if (q.has('lab')) { this.scene.start('lab'); return; }
    const auto = q.get('auto');
    if (auto) {
      const cfg: GameCfg = {
        mode: (q.get('mode') as GameCfg['mode']) ?? 'sim',
        court: auto as CourtId,
        p1: buildLoadout({ ...STARTER_EQUIP }, 'YOU'),
        level: (q.get('level') as AiLevel) ?? 'hooper',
        target: +(q.get('target') ?? 11),
        seed: q.has('seed') ? +q.get('seed')! : undefined,
      };
      this.scene.start('game', cfg);
      return;
    }
    save();
    this.scene.start('menu');
  }
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GW,
  height: GH,
  backgroundColor: '#000000',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, MenuScene, GameScene, LabScene],
  render: { pixelArt: true, antialias: false, roundPixels: true, powerPreference: 'high-performance' },
  fps: { target: 60 },
});
(window as unknown as { __phaser: Phaser.Game }).__phaser = game;
