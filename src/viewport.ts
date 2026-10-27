import Phaser from 'phaser';
import { PX } from './pixel';

/** In-match viewport in art pixels. The court is wider and taller, so the camera frames a window of it and scrolls. */
export const VW = 384;
export const VH = 216;
/** Court art row shown at the top edge of the match viewport. */
export const VIEW_TOP = 24;

/** Resize the canvas to `w` x `h` art pixels (no-op when already that size). */
export function setViewport(scene: Phaser.Scene, w: number, h: number) {
  const s = scene.scale;
  if (s.gameSize.width !== w || s.gameSize.height !== h) s.resize(w, h);
  scene.cameras.main.setSize(w, h);
}

/** World coordinate of a screen-fixed (scroll factor 0) object drawn at art pixel `s` of a `size`-pixel axis. */
export const fixedAt = (s: number, size: number) => s * PX - (size * (PX - 1)) / 2;
/** World offset to give a screen-fixed Graphics whose commands are already in art pixels times PX. */
export const fixedOrigin = (size: number) => -(size * (PX - 1)) / 2;
