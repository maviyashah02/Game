import Phaser from 'phaser';
import { W, H } from '../../../../config/GameConfig.js';

// L2 Checkpoint Overlay — Light the Fireflies (memory sequence / Simon-says)
// Watch the firefly order, then repeat it. Each round adds one. Emits 'cp-done' when won.
const POS = [
  { x: 210, y: 210 }, { x: 400, y: 165 }, { x: 590, y: 210 },
  { x: 295, y: 320 }, { x: 505, y: 320 },
];
const ROUNDS = 4;    // final sequence length
const LIVES  = 2;

export class L2_FirefliesScene extends Phaser.Scene {
  constructor() { super('L2_Fireflies'); }

  create() {
    this.add.rectangle(W / 2, H / 2, W, H, 0x040810, 0.9).setDepth(0).setInteractive();
    this.add.text(W / 2, 24, '✨ Light the Fireflies!', { fontSize: '18px', fontFamily: 'Georgia, serif', color: '#f5c87a', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(2);
    this._info = this.add.text(W / 2, 48, 'Watch the order…', { fontSize: '13px', fontFamily: 'Georgia, serif', color: '#bfe0ff', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(2);

    this._lifeTxt  = this.add.text(W - 14, 64, '❤️'.repeat(LIVES), { fontSize: '15px' }).setOrigin(1, 0).setDepth(5);
    this._roundTxt = this.add.text(14, 64, 'Round 1 / ' + ROUNDS, { fontSize: '14px', fontFamily: 'Georgia, serif', color: '#88ccff', stroke: '#000', strokeThickness: 2 }).setDepth(5);

    // Fireflies
    this._flies = POS.map((p, i) => {
      const glow = this.add.circle(p.x, p.y, 30, 0xccff66, 0.12).setDepth(4);
      const core = this.add.circle(p.x, p.y, 14, 0x6a7a20, 1).setDepth(5).setStrokeStyle(2, 0xaadd55, 0.7);
      const hit  = this.add.circle(p.x, p.y, 34, 0xffffff, 0.001).setDepth(6).setInteractive({ useHandCursor: true });
      this.tweens.add({ targets: glow, alpha: 0.22, scaleX: 1.2, scaleY: 1.2, duration: 1100 + i * 120, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      hit.on('pointerdown', () => this._tap(i));
      return { ...p, glow, core, hit };
    });

    this._seq    = Array.from({ length: ROUNDS }, () => Phaser.Math.Between(0, POS.length - 1));
    this._round  = 1;
    this._lives  = LIVES;
    this._inIdx  = 0;
    this._phase  = 'show';
    this._done   = false;

    this.cameras.main.fadeIn(300, 0, 0, 0);
    this.time.delayedCall(700, () => this._showSequence());
  }

  _flash(i, color = 0xffff88) {
    const f = this._flies[i];
    this.tweens.killTweensOf(f.core);
    f.core.setFillStyle(color, 1);
    f.glow.setFillStyle(color, 0.5);
    this.tweens.add({ targets: [f.core], scaleX: 1.7, scaleY: 1.7, duration: 200, yoyo: true,
      onComplete: () => { f.core.setFillStyle(0x6a7a20, 1); f.glow.setFillStyle(0xccff66, 0.12); f.core.setScale(1); } });
    this.tweens.add({ targets: f.glow, alpha: 0.55, scaleX: 1.6, scaleY: 1.6, duration: 200, yoyo: true });
  }

  _showSequence() {
    this._phase = 'show';
    this._info.setText('Watch the order…').setColor('#bfe0ff');
    this._roundTxt.setText(`Round ${this._round} / ${ROUNDS}`);
    let step = 0;
    const playNext = () => {
      if (this._done) return;
      if (step >= this._round) {
        this._phase = 'input'; this._inIdx = 0;
        this._info.setText('Now repeat it!  ✨').setColor('#aaffaa');
        return;
      }
      this._flash(this._seq[step]);
      step++;
      this.time.delayedCall(600, playNext);   // playback pace
    };
    this.time.delayedCall(300, playNext);
  }

  _tap(i) {
    if (this._done || this._phase !== 'input') return;
    if (i === this._seq[this._inIdx]) {
      this._flash(i, 0x88ff88);
      this._inIdx++;
      if (this._inIdx >= this._round) {
        // round complete
        this._phase = 'wait';
        if (this._round >= ROUNDS) { this._win(); return; }
        this._round++;
        this._info.setText('✅ Good! Next round…').setColor('#88ffaa');
        this.time.delayedCall(800, () => this._showSequence());
      }
    } else {
      // wrong
      this._flash(i, 0xff4444);
      this.cameras.main.shake(200, 0.01); this.cameras.main.flash(160, 160, 0, 0);
      this._lives--;
      this._lifeTxt.setText('❤️'.repeat(Math.max(0, this._lives)) + '🖤'.repeat(LIVES - Math.max(0, this._lives)));
      if (this._lives <= 0) { this._fail('✨ The path went dark!'); return; }
      this._phase = 'wait';
      this._info.setText('❌ Oops! Watch again…').setColor('#ff8888');
      this.time.delayedCall(900, () => this._showSequence());
    }
  }

  _win() {
    if (this._done) return;
    this._done = true;
    this.cameras.main.flash(600, 150, 200, 80);
    const total = (this.registry.get('points') || 0) + 2;
    this.registry.set('points', total);
    this._flies.forEach((f, k) => this.time.delayedCall(k * 120, () => this._flash(k, 0xffffaa)));
    this.add.text(W / 2, H / 2 + 62, '✅ The path is lit!', { fontSize: '24px', fontFamily: 'Georgia, serif', color: '#ccffaa', stroke: '#0a0502', strokeThickness: 3 }).setOrigin(0.5).setDepth(20);
    this.add.text(W / 2, H / 2 + 96, `+2 ⭐   (Total: ${total})`, { fontSize: '17px', fontFamily: 'Georgia, serif', color: '#ffd86a', stroke: '#0a0502', strokeThickness: 3 }).setOrigin(0.5).setDepth(20);
    this.time.delayedCall(1500, () => this.events.emit('cp-done'));
  }

  _fail(msg) {
    if (this._done) return;
    this._done = true;
    this.cameras.main.shake(300, 0.012);
    this.add.text(W / 2, H / 2 + 70, msg + '  Try again!', { fontSize: '18px', fontFamily: 'Georgia, serif', color: '#ff7070', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(20);
    this.time.delayedCall(1700, () => this.scene.restart());
  }
}
