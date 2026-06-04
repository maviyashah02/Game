import Phaser from 'phaser';
import { W, H } from '../../../../config/GameConfig.js';

// L2 Checkpoint Overlay — Dodge the Hazards (quick reaction / whack-a-mole)
// Tap each creature before it bites you. Emits 'cp-done' when won.
const HAZARDS = ['🐍', '🕷️', '🦂', '🦟'];
const NEED  = 10;    // creatures to whack
const LIVES = 3;
const SPOTS = [
  { x: 150, y: 195 }, { x: 330, y: 185 }, { x: 510, y: 195 }, { x: 660, y: 185 },
  { x: 150, y: 320 }, { x: 330, y: 330 }, { x: 510, y: 320 }, { x: 660, y: 330 },
];

export class L2_DodgeScene extends Phaser.Scene {
  constructor() { super('L2_Dodge'); }

  create() {
    this.add.rectangle(W / 2, H / 2, W, H, 0x05080a, 0.84).setDepth(0).setInteractive();
    this.add.rectangle(W / 2, 26, W, 52, 0x0a1018, 0.9).setDepth(1);
    this.add.text(W / 2, 18, '🐍 Dodge the Hazards!', { fontSize: '18px', fontFamily: 'Georgia, serif', color: '#f5c87a', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(2);
    this.add.text(W / 2, 40, 'Tap each creature FAST — before it bites you!', { fontSize: '12px', fontFamily: 'Georgia, serif', color: '#c8d0e0', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(2);

    // Bushes at each spot
    SPOTS.forEach(s => {
      const g = this.add.graphics().setDepth(3);
      g.fillStyle(0x12260e, 1); g.fillEllipse(s.x, s.y + 34, 92, 30);
      g.fillStyle(0x1c3a16, 1); g.fillEllipse(s.x - 18, s.y + 26, 40, 26);
      g.fillStyle(0x224418, 1); g.fillEllipse(s.x + 16, s.y + 28, 44, 28);
    });

    this._whacked = 0; this._lives = LIVES; this._done = false;
    this._window = 1450;                 // ms a hazard stays before biting (ramps down)
    this._active = new Array(SPOTS.length).fill(null);

    this._whackTxt = this.add.text(14, 60, `Whacked:  0 / ${NEED}`, { fontSize: '14px', fontFamily: 'Georgia, serif', color: '#88ff88', stroke: '#000', strokeThickness: 2 }).setDepth(6);
    this._lifeTxt  = this.add.text(W - 14, 60, '❤️'.repeat(LIVES), { fontSize: '15px' }).setOrigin(1, 0).setDepth(6);

    this._spawnTimer = this.time.addEvent({ delay: 820, loop: true, callback: () => this._spawn() });
    this.time.delayedCall(250, () => this._spawn());
    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  _spawn() {
    if (this._done) return;
    const free = [];
    this._active.forEach((a, i) => { if (!a) free.push(i); });
    if (!free.length) return;
    const idx = Phaser.Math.RND.pick(free);
    const s = SPOTS[idx];
    const emoji = Phaser.Math.RND.pick(HAZARDS);

    const haz = this.add.text(s.x, s.y, emoji, { fontSize: '40px' }).setOrigin(0.5).setDepth(5).setScale(0);
    const hit = this.add.circle(s.x, s.y, 34, 0xffffff, 0.001).setDepth(6).setInteractive({ useHandCursor: true });
    const rec = { haz, hit, biteEvt: null, gone: false };
    this._active[idx] = rec;

    this.tweens.add({ targets: haz, scale: 1, duration: 130, ease: 'Back.easeOut' });
    this.tweens.add({ targets: haz, y: s.y - 6, duration: 160, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 130 });

    const clear = () => { rec.gone = true; if (rec.biteEvt) rec.biteEvt.remove(); this.tweens.killTweensOf(haz); try { hit.destroy(); } catch (_) {} this._active[idx] = null; };

    hit.on('pointerdown', () => {
      if (rec.gone || this._done) return;
      clear();
      this.tweens.add({ targets: haz, scale: 1.5, alpha: 0, angle: 40, duration: 160, onComplete: () => haz.destroy() });
      const star = this.add.text(s.x, s.y - 10, '💥', { fontSize: '26px' }).setOrigin(0.5).setDepth(7);
      this.tweens.add({ targets: star, scale: 1.6, alpha: 0, duration: 320, onComplete: () => star.destroy() });
      this._whacked++;
      this._whackTxt.setText(`Whacked:  ${this._whacked} / ${NEED}`);
      this._window = Math.max(950, this._window - 12);   // gets faster
      if (this._whacked >= NEED) this._win();
    });

    rec.biteEvt = this.time.delayedCall(this._window, () => {
      if (rec.gone || this._done) return;
      clear();
      this.tweens.add({ targets: haz, y: s.y + 26, alpha: 0, duration: 200, onComplete: () => haz.destroy() });
      this.cameras.main.shake(200, 0.012); this.cameras.main.flash(160, 160, 0, 0);
      this._lives--;
      this._lifeTxt.setText('❤️'.repeat(Math.max(0, this._lives)) + '🖤'.repeat(LIVES - Math.max(0, this._lives)));
      if (this._lives <= 0) this._fail("🐍 Bitten too many times!");
    });
  }

  _clearAll() {
    this._active.forEach(rec => { if (rec) { rec.gone = true; if (rec.biteEvt) rec.biteEvt.remove(); try { rec.haz.destroy(); rec.hit.destroy(); } catch (_) {} } });
    this._active = new Array(SPOTS.length).fill(null);
  }

  _win() {
    if (this._done) return;
    this._done = true;
    this._spawnTimer.remove(); this._clearAll();
    this.cameras.main.flash(500, 60, 200, 80);
    const total = (this.registry.get('points') || 0) + 2;
    this.registry.set('points', total);
    this.add.text(W / 2, H / 2 - 14, '✅ Path cleared!', { fontSize: '24px', fontFamily: 'Georgia, serif', color: '#88ffaa', stroke: '#0a0502', strokeThickness: 3 }).setOrigin(0.5).setDepth(20);
    this.add.text(W / 2, H / 2 + 22, `+2 ⭐   (Total: ${total})`, { fontSize: '17px', fontFamily: 'Georgia, serif', color: '#ffd86a', stroke: '#0a0502', strokeThickness: 3 }).setOrigin(0.5).setDepth(20);
    this.time.delayedCall(1300, () => this.events.emit('cp-done'));
  }

  _fail(msg) {
    if (this._done) return;
    this._done = true;
    this._spawnTimer.remove(); this._clearAll();
    this.cameras.main.shake(300, 0.012);
    this.add.text(W / 2, H / 2, msg + '\nTry again!', { fontSize: '18px', fontFamily: 'Georgia, serif', color: '#ff7070', stroke: '#000', strokeThickness: 3, align: 'center' }).setOrigin(0.5).setDepth(20);
    this.time.delayedCall(1700, () => this.scene.restart());
  }
}
