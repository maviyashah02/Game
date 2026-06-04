import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { generateL4Assets, generateL4StreetAssets } from './L4Assets.js';

// ── Level 4 — Build Scene: assemble Gamma's dog house step by step ──────────────
const HX = 470, HY = 372;          // house base centre / bottom
const STEPS = [
  { key: 'foundation', label: 'Place the Wood Foundation', tip: 'Tap to lay the planks',    taps: 1 },
  { key: 'walls',      label: 'Raise the Walls',           tip: 'Tap to build the walls',   taps: 1 },
  { key: 'roof',       label: 'Install the Roof',          tip: 'Tap to fit the roof',      taps: 1 },
  { key: 'nails',      label: 'Hammer the Nails',          tip: 'Tap each nail (4)',        taps: 4 },
  { key: 'paint',      label: 'Paint the House',           tip: 'Swipe across to paint!',   paint: true },
  { key: 'bedding',    label: 'Place the Soft Bedding',    tip: 'Tap to add the cushion',   taps: 1 },
  { key: 'bowl',       label: 'Place the Food Bowl',       tip: 'Tap to set the bowl',      taps: 1 },
];

export class L4_DecorateScene extends Phaser.Scene {
  constructor() { super('L4_Decorate'); }

  create(data) {
    generateL4Assets(this);
    generateL4StreetAssets(this);
    this.cameras.main.fadeIn(700, 0, 0, 0);
    this._coins = (data && data.coins) || 0;

    // Garage background
    if (this.textures.exists('l4_garage_bg'))
      this.add.image(W / 2, H / 2, 'l4_garage_bg').setDisplaySize(W, H).setDepth(-10);
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.18).setDepth(-9);

    // Title
    this.add.text(W / 2, 24, '🔨 Build Gamma\'s House!', { fontSize: '20px', fontFamily: 'Georgia, serif', color: '#ffe0b0', stroke: '#3a1e08', strokeThickness: 3 }).setOrigin(0.5).setDepth(40);

    // Progress bar
    const bx = W / 2 - 150, by = 54;
    this.add.graphics().setDepth(40).fillStyle(0x22160a, 0.9).fillRoundedRect(bx, by, 300, 16, 8);
    this._progFill = this.add.graphics().setDepth(41);
    this._progTxt = this.add.text(W / 2, by + 8, '0%', { fontSize: '11px', fontFamily: 'Georgia, serif', color: '#fff' }).setOrigin(0.5).setDepth(42);
    this._progBX = bx; this._progBY = by;

    // Gamma watching beside the build area
    this._gamma = this.add.image(150, 384, this.textures.exists('gemma_idle') ? 'gemma_idle' : 'l4_food_bowl')
      .setOrigin(0.5, 1).setDisplaySize(150, 86).setDepth(8);
    this.tweens.add({ targets: this._gamma, y: 380, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // House graphics + dynamic images
    this._houseG = this.add.graphics().setDepth(5);
    this._stageImgs = [];
    this._stage = 0;        // how many steps built
    this._paint = 0;
    this._drawHouse();

    // Prompt
    this._promptBg = this.add.graphics().setDepth(40);
    this._promptBg.fillStyle(0x1a2230, 0.92); this._promptBg.fillRoundedRect(W / 2 - 200, H - 64, 400, 48, 10);
    this._promptBg.lineStyle(2, 0x4a6080, 0.8); this._promptBg.strokeRoundedRect(W / 2 - 200, H - 64, 400, 48, 10);
    this._promptTxt = this.add.text(W / 2, H - 48, '', { fontSize: '15px', fontFamily: 'Georgia, serif', color: '#cfe0f5', align: 'center' }).setOrigin(0.5).setDepth(41);
    this._tipTxt = this.add.text(W / 2, H - 28, '', { fontSize: '11px', fontFamily: 'Georgia, serif', color: '#88a0c0' }).setOrigin(0.5).setDepth(41);

    this._step = 0;
    this._startStep();
  }

  // ── HOUSE DRAWING (progressive) ─────────────────────────────────────────────
  _drawHouse() {
    const g = this._houseG, s = this._stage; g.clear();
    g.fillStyle(0x000000, 0.18); g.fillEllipse(HX, HY + 8, 170, 18);
    if (s < 1) {  // empty build pad
      g.fillStyle(0x4a4a52, 0.5); g.fillRect(HX - 90, HY - 4, 180, 8);
      return;
    }
    // foundation
    g.fillStyle(0x9a6a2e, 1); g.fillRect(HX - 82, HY - 16, 164, 18);
    g.fillStyle(0x7a4e1e, 0.5); g.fillRect(HX - 82, HY - 2, 164, 4);
    if (s < 2) return;

    const wallTop = HY - 16 - 88;
    const painted = s >= 5;
    // walls
    g.fillStyle(painted ? 0x3f74ad : 0xb07e38, 1); g.fillRect(HX - 68, wallTop, 136, 88);
    if (!painted) { g.lineStyle(1, 0x8a5e28, 0.4); for (let i = 1; i < 5; i++) g.lineBetween(HX - 68, wallTop + i * 17, HX + 68, wallTop + i * 17); }
    // door
    g.fillStyle(0x140d06, 1); g.fillEllipse(HX, HY - 16, 60, 78);
    g.fillStyle(0x0c0704, 1); g.fillRect(HX - 30, HY - 46, 60, 30);
    g.lineStyle(4, painted ? 0xd0a040 : 0x8a5a20, 0.9); g.strokeEllipse(HX, HY - 16, 60, 78);
    if (s < 3) return;
    // roof
    g.fillStyle(0xc0392b, 1); g.fillTriangle(HX - 90, wallTop + 6, HX, wallTop - 54, HX + 90, wallTop + 6);
    g.fillStyle(0x9a2f22, 1); g.fillRect(HX - 90, wallTop, 180, 7);
    g.lineStyle(1.5, 0x8a261b, 0.5);
    for (let r = 0; r < 4; r++) { const yy = wallTop - 6 - r * 11; const hw = 80 - r * 18; g.lineBetween(HX - hw, yy, HX + hw, yy); }
    if (s < 4) return;
    // nails
    g.fillStyle(0xcfcfd6, 1);
    [[-62, wallTop + 6], [62, wallTop + 6], [-62, HY - 24], [62, HY - 24]].forEach(([dx, dy]) => { g.fillCircle(HX + dx, dy, 3.5); g.fillStyle(0x9a9aa2, 1); g.fillCircle(HX + dx + 1, dy + 1, 1.5); g.fillStyle(0xcfcfd6, 1); });
    if (s < 5) return;
    // name plate
    g.fillStyle(0xe0a23c, 1); g.fillRoundedRect(HX - 30, wallTop - 4, 60, 15, 4);
    g.lineStyle(1.5, 0x9a6a20, 0.9); g.strokeRoundedRect(HX - 30, wallTop - 4, 60, 15, 4);
  }

  _setProgress() {
    const pct = Math.round((this._stage / STEPS.length) * 100);
    this._progFill.clear();
    this._progFill.fillStyle(0x44cc55, 1);
    this._progFill.fillRoundedRect(this._progBX, this._progBY, 300 * (this._stage / STEPS.length), 16, 8);
    this._progTxt.setText(`${pct}%`);
  }

  // ── STEP FLOW ───────────────────────────────────────────────────────────────
  _startStep() {
    if (this._zone) { this._zone.destroy(); this._zone = null; }
    if (this._nailDots) { this._nailDots.forEach(o => o.destroy()); this._nailDots = null; }
    if (this._step >= STEPS.length) { this._finish(); return; }

    const st = STEPS[this._step];
    this._promptTxt.setText(`Step ${this._step + 1}/${STEPS.length}:  ${st.label}`);
    this._tipTxt.setText(st.tip);

    if (st.paint) { this._startPaint(); return; }
    if (st.key === 'nails') { this._startNails(); return; }

    // simple tap step
    this._taps = 0;
    const zone = this.add.rectangle(HX, HY - 70, 200, 200, 0xffffff, 0.001).setDepth(30).setInteractive({ useHandCursor: true });
    this._zone = zone;
    // pulsing hint hand
    const hint = this.add.text(HX, HY - 70, '👆', { fontSize: '30px' }).setOrigin(0.5).setDepth(31);
    this.tweens.add({ targets: hint, y: HY - 56, duration: 500, yoyo: true, repeat: -1 });
    zone.on('pointerdown', () => {
      this._taps++;
      this.tweens.add({ targets: this._gamma, y: this._gamma.y - 8, duration: 100, yoyo: true });
      if (this._taps >= (st.taps || 1)) { hint.destroy(); this._completeStep(st); }
    });
  }

  _startNails() {
    this._nailDots = [];
    let left = 4;
    const wallTop = HY - 16 - 88;
    const spots = [[HX - 62, wallTop + 6], [HX + 62, wallTop + 6], [HX - 62, HY - 24], [HX + 62, HY - 24]];
    spots.forEach(([nx, ny]) => {
      const ring = this.add.circle(nx, ny, 12, 0xffee44, 0).setStrokeStyle(2, 0xffee44, 0.9).setDepth(31).setInteractive({ useHandCursor: true });
      this.tweens.add({ targets: ring, scale: 1.3, alpha: 0.4, duration: 600, yoyo: true, repeat: -1 });
      this._nailDots.push(ring);
      ring.once('pointerdown', () => {
        ring.disableInteractive(); this.tweens.killTweensOf(ring); ring.destroy();
        const hammer = this.add.text(nx + 16, ny - 18, '🔨', { fontSize: '24px' }).setOrigin(0.5).setDepth(33);
        this.tweens.add({ targets: hammer, angle: -40, x: nx + 4, y: ny - 8, duration: 120, yoyo: true, onComplete: () => hammer.destroy() });
        this.cameras.main.shake(80, 0.004);
        this._sparkle(nx, ny);
        left--;
        if (left <= 0) this._completeStep(STEPS[this._step]);
      });
    });
  }

  _startPaint() {
    this._paint = 0;
    const wallTop = HY - 16 - 88;
    // paint overlay fill (grows as you swipe)
    this._paintG = this.add.graphics().setDepth(6);
    const brush = this.add.text(HX - 70, wallTop + 40, '🖌️', { fontSize: '28px' }).setDepth(32);
    this.tweens.add({ targets: brush, x: HX + 70, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const zone = this.add.rectangle(HX, wallTop + 44, 150, 100, 0xffffff, 0.001).setDepth(30).setInteractive({ useHandCursor: true, draggable: true });
    this._zone = zone;
    let lastX = null;
    const paintMove = (p) => {
      if (!p.isDown) { lastX = null; return; }
      if (lastX !== null) this._paint = Phaser.Math.Clamp(this._paint + Math.abs(p.x - lastX) / 520, 0, 1);
      lastX = p.x;
      this._paintG.clear();
      this._paintG.fillStyle(0x3f74ad, 1);
      this._paintG.fillRect(HX - 68, wallTop, 136 * this._paint, 88);
      if (this._paint >= 1) {
        this.input.off('pointermove', paintMove);
        brush.destroy(); this._paintG.destroy();
        this._completeStep(STEPS[this._step]);
      }
    };
    this.input.on('pointermove', paintMove);
    this._paintMove = paintMove;
  }

  _completeStep(st) {
    if (this._zone) { this._zone.destroy(); this._zone = null; }
    if (this._paintMove) { this.input.off('pointermove', this._paintMove); this._paintMove = null; }
    this._stage++;
    this.cameras.main.flash(180, 80, 200, 90);
    this._sparkle(HX, HY - 80);

    // step-specific extra image
    if (st.key === 'bedding' && this.textures.exists('l4_bed')) {
      const bed = this.add.image(HX, HY - 22, 'l4_bed').setDisplaySize(58, 40).setDepth(6).setAlpha(0).setScale(0.4);
      this.tweens.add({ targets: bed, alpha: 1, scale: 1, duration: 350, ease: 'Back.easeOut' });
      this._stageImgs.push(bed);
    }
    if (st.key === 'bowl' && this.textures.exists('l4_food_bowl')) {
      const bowl = this.add.image(HX + 96, HY - 2, 'l4_food_bowl').setOrigin(0.5, 1).setDisplaySize(50, 42).setDepth(7).setAlpha(0).setScale(0.4);
      this.tweens.add({ targets: bowl, alpha: 1, scale: 1, duration: 350, ease: 'Back.easeOut' });
      this._stageImgs.push(bowl);
    }

    this._drawHouse();
    this._setProgress();
    this._step++;
    this.time.delayedCall(550, () => this._startStep());
  }

  // ── FINAL CUTSCENE ──────────────────────────────────────────────────────────
  _finish() {
    this._promptTxt.setText('🎉 The house is ready!');
    this._tipTxt.setText('');
    // Gamma walks to the house and goes inside
    this.tweens.add({ targets: this._gamma, x: HX - 4, duration: 1400, ease: 'Sine.easeInOut',
      onComplete: () => {
        if (this.textures.exists('gemma_happy')) this._gamma.setTexture('gemma_happy');
        // sniff
        this.tweens.add({ targets: this._gamma, y: this._gamma.y + 6, duration: 200, yoyo: true, repeat: 2,
          onComplete: () => {
            // walk inside (fade into the door)
            this.tweens.add({ targets: this._gamma, x: HX, alpha: 0, scale: 0.7, duration: 700,
              onComplete: () => {
                this._heartBurst();
                // Glenda kneels beside
                if (this.textures.exists('gleeda_idle'))
                  this.add.image(HX - 120, HY + 2, 'gleeda_idle').setOrigin(0.5, 1).setDisplaySize(90, 110).setDepth(8);
                this.add.text(W / 2, 110, '💛 Gamma loves her new home! 💛', { fontSize: '20px', fontFamily: 'Georgia, serif', color: '#ffd0e4', stroke: '#3a0820', strokeThickness: 3 }).setOrigin(0.5).setDepth(45).setAlpha(0).setData('fin', 1);
                this.children.list.filter(c => c.getData && c.getData('fin')).forEach(c => this.tweens.add({ targets: c, alpha: 1, duration: 500 }));
                this.time.delayedCall(2000, () => this._reward());
              } });
          } });
      } });
  }

  _heartBurst() {
    for (let i = 0; i < 16; i++) this.time.delayedCall(i * 80, () => {
      const h = this.add.text(HX + (Math.random() - 0.5) * 80, HY - 70, '❤️', { fontSize: `${14 + Math.random() * 12}px` }).setOrigin(0.5).setDepth(40);
      this.tweens.add({ targets: h, y: h.y - 80, alpha: 0, duration: 1100, onComplete: () => h.destroy() });
    });
    this.cameras.main.flash(500, 255, 180, 200);
  }

  // ── REWARD SCREEN ───────────────────────────────────────────────────────────
  _reward() {
    // persist a little progress
    try { this.registry.set('points', (this.registry.get('points') || 0) + 500); } catch (_) {}
    try { localStorage.setItem('shadowgamma_level4_done', '1'); } catch (_) {}

    const ov = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.78).setDepth(60);
    const cg = this.add.graphics().setDepth(61);
    cg.fillStyle(0xfdf0e8, 1); cg.fillRoundedRect(W / 2 - 170, H / 2 - 120, 340, 240, 18);
    cg.lineStyle(3, 0xf5c84a, 1); cg.strokeRoundedRect(W / 2 - 170, H / 2 - 120, 340, 240, 18);

    this.add.text(W / 2, H / 2 - 92, 'LEVEL 4 COMPLETE! 🎉', { fontSize: '20px', fontFamily: 'Georgia, serif', color: '#d94060', stroke: '#fdf0e8', strokeThickness: 2 }).setOrigin(0.5).setDepth(62);
    ['⭐', '⭐', '⭐'].forEach((s, i) => {
      const st = this.add.text(W / 2 - 34 + i * 34, H / 2 - 50, s, { fontSize: '30px' }).setOrigin(0.5).setDepth(62).setScale(0.2);
      this.tweens.add({ targets: st, scale: 1, duration: 350, delay: 250 + i * 160, ease: 'Back.easeOut' });
    });
    if (this.textures.exists('l4_coin')) this.add.image(W / 2 - 56, H / 2 - 2, 'l4_coin').setDisplaySize(26, 26).setDepth(62);
    this.add.text(W / 2 - 38, H / 2 - 2, '+500', { fontSize: '22px', fontFamily: 'Georgia, serif', color: '#d4a020' }).setOrigin(0, 0.5).setDepth(62);
    this.add.text(W / 2 + 36, H / 2 - 2, '⭐ +1', { fontSize: '20px', fontFamily: 'Georgia, serif', color: '#e0a020' }).setOrigin(0, 0.5).setDepth(62);

    const next = this.add.text(W / 2 - 70, H / 2 + 64, 'Next', { fontSize: '16px', fontFamily: 'Georgia, serif', color: '#fff', backgroundColor: '#44aa44', padding: { x: 20, y: 10 } }).setOrigin(0.5).setDepth(62).setInteractive({ useHandCursor: true });
    const replay = this.add.text(W / 2 + 70, H / 2 + 64, 'Replay', { fontSize: '16px', fontFamily: 'Georgia, serif', color: '#fff', backgroundColor: '#884422', padding: { x: 16, y: 10 } }).setOrigin(0.5).setDepth(62).setInteractive({ useHandCursor: true });
    next.on('pointerdown', () => { this.cameras.main.fadeOut(500, 0, 0, 0); this.time.delayedCall(550, () => this.scene.start('Menu')); });
    replay.on('pointerdown', () => { this.cameras.main.fadeOut(500, 0, 0, 0); this.time.delayedCall(550, () => this.scene.start('Level4')); });

    // celebration sparkles
    this.time.addEvent({ delay: 200, repeat: 20, callback: () => this._sparkle(W / 2 - 130 + Math.random() * 260, H / 2 - 100 + Math.random() * 220) });
  }

  _sparkle(x, y) {
    for (let i = 0; i < 8; i++) {
      const ang = Math.random() * Math.PI * 2, d = 14 + Math.random() * 24;
      const s = this.add.image(x, y, this.textures.exists('l4_sparkle') ? 'l4_sparkle' : 'l4_coin').setScale(0.6).setDepth(63);
      s.setTint([0xffee44, 0xff88cc, 0x88eeff, 0xaaffaa][i % 4]);
      this.tweens.add({ targets: s, x: x + Math.cos(ang) * d, y: y + Math.sin(ang) * d, alpha: 0, scale: 1.2, duration: 600, onComplete: () => s.destroy() });
    }
  }
}
