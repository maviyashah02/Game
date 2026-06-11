import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { generateL5Assets } from './L5Assets.js';

// ── Level 5 · Gamma's Seven Puppies (LOCKED: entirely inside the garage) ──────
// Stormy night. Gamma is already in labor on her delivery bed in the family
// garage. Gleenda helps. One garage scene, phased:
//   intro → Setup → Heart Check → Medicine → Treatment Support (longest)
//   → climax → 7-puppy arrival → puppy care → Nursery (next scene).
export class Level5Scene extends Phaser.Scene {
  constructor() { super('Level5'); }

  create() {
    generateL5Assets(this);
    this._stars = this.registry.get('l5_stars') || 0;
    this.cameras.main.setBackgroundColor('#0a1018');
    this.cameras.main.fadeIn(1100, 0, 0, 0);
    this._phaseObjs = []; this._phase = 'intro';
    this._waveOffset = 0;

    this._buildGarage();
    this._buildMonitor();
    this._buildHUD();
    this._intro();
  }

  // ── GARAGE with stormy residential street in the background ───────────────────
  _buildGarage() {
    // garage interior
    if (this.textures.exists('l5_garage_bg'))
      this.add.image(W / 2, H / 2, 'l5_garage_bg').setDisplaySize(W, H).setDepth(-30).setTint(0x6a7088);
    else this.add.rectangle(W / 2, H / 2, W, H, 0x1a2030, 1).setDepth(-30);
    // stormy night dim
    this.add.rectangle(W / 2, H / 2, W, H, 0x081020, 0.4).setDepth(-29);

    // distant rainy street seen through the garage opening (center-back band)
    const street = this.add.graphics().setDepth(-28);
    street.fillStyle(0x10182a, 0.55); street.fillRect(250, 120, 300, 150);
    // house silhouettes + street lamp glow
    for (let i = 0; i < 4; i++) { street.fillStyle(0x1a2438, 0.6); street.fillRect(270 + i * 70, 150 + (i % 2) * 18, 50, 100); }
    const lamp = this.add.circle(330, 150, 5, 0xffe9a8, 1).setDepth(-27);
    this.add.circle(330, 150, 26, 0xffe9a8, 0.12).setDepth(-27);
    // wind-swept trees
    [300, 520].forEach(tx => { const t = this.add.text(tx, 250, '🌲', { fontSize: '26px' }).setOrigin(0.5, 1).setDepth(-27).setAlpha(0.5); this.tweens.add({ targets: t, angle: 6, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); });

    // heavy rain (screen-space)
    this._rain = [];
    for (let i = 0; i < 80; i++) this._rain.push({ r: this.add.rectangle(Math.random() * W, Math.random() * H, 2, 14, 0x9ab4d8, 0.3).setDepth(-10), vy: 9 + Math.random() * 6 });

    // lightning flashes
    this._flash = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0).setDepth(-9);
    this.time.addEvent({ delay: 5200, loop: true, callback: () => {
      if (this._phase === 'done2') return;
      this.tweens.add({ targets: this._flash, alpha: 0.32, duration: 60, yoyo: true, repeat: 1 });
      this.cameras.main.shake(180, 0.004);
    }});

    // warm overhead delivery lamp
    const glow = this.add.circle(W / 2, 70, 130, 0xffe0a0, 0.16).setDepth(-20);
    this.tweens.add({ targets: glow, alpha: 0.26, duration: 1600, yoyo: true, repeat: -1 });

    // delivery bed + Gamma + Gleeda
    this.add.ellipse(W / 2 + 30, 374, 300, 36, 0x000000, 0.25).setDepth(2);
    this.add.rectangle(W / 2 + 30, 360, 280, 30, 0x8a4a6a, 1).setStrokeStyle(2, 0x5a2a44, 1).setDepth(3);   // pink dog bed
    this.add.rectangle(W / 2 + 30, 348, 280, 8, 0xaa6a8a, 1).setDepth(3);
    this._gamma = this.textures.exists('gemma_idle')
      ? this.add.image(W / 2 + 30, 348, 'gemma_idle').setOrigin(0.5, 1).setDisplaySize(168, 92).setDepth(6)
      : this.add.text(W / 2 + 30, 348, '🐕', { fontSize: '70px' }).setOrigin(0.5, 1).setDepth(6);
    this.tweens.add({ targets: this._gamma, y: 344, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    if (this.textures.exists('gleeda_idle'))
      this._gleeda = this.add.image(150, 378, 'gleeda_idle').setOrigin(0.5, 1).setDisplaySize(80, 96).setDepth(6).setAlpha(0);

    // garage equipment props
    this.add.text(W - 70, 350, '🔥', { fontSize: '24px' }).setOrigin(0.5, 1).setDepth(5);   // heating lamp
    const iv = this.add.graphics().setDepth(5); iv.fillStyle(0xbac4cc, 1); iv.fillRect(W - 120, 160, 4, 190); iv.fillStyle(0x88ccaa, 0.9); iv.fillRoundedRect(W - 134, 160, 26, 36, 5);
  }

  _buildMonitor() {
    const mx = W / 2 - 110, my = 150;
    const g = this.add.graphics().setDepth(9);
    g.fillStyle(0x0a1820, 1); g.fillRoundedRect(mx - 10, my - 10, 230, 124, 8);
    g.lineStyle(2, 0x1e4060, 0.8); g.strokeRoundedRect(mx - 10, my - 10, 230, 124, 8);
    this.add.text(mx, my - 4, 'HEART RATE', { fontSize: '8px', fontFamily: 'monospace', color: '#66ff99' }).setDepth(11);
    this._bpm = 132;
    this._bpmTxt = this.add.text(mx + 200, my + 100, '132', { fontSize: '24px', fontFamily: 'monospace', color: '#66ff99', stroke: '#000', strokeThickness: 2 }).setOrigin(1, 1).setDepth(11);
    this.add.text(mx + 8, my + 100, '♥ BPM', { fontSize: '10px', fontFamily: 'monospace', color: '#ff6688' }).setOrigin(0, 1).setDepth(11);
    this._ekg = this.add.graphics().setDepth(10);
    this._monX = mx; this._monY = my;
  }

  _buildHUD() {
    const g = this.add.graphics().setDepth(30);
    g.fillStyle(0x060e1a, 0.92); g.fillRoundedRect(4, 4, W - 8, 46, 6);
    g.lineStyle(1.5, 0x88aacc, 0.4); g.strokeRoundedRect(4, 4, W - 8, 46, 6);
    this._hudStep = this.add.text(120, 16, '', { fontSize: '11px', fontFamily: 'Georgia, serif', color: '#88aacc' }).setOrigin(0.5).setDepth(31);
    // hearts (decorative, full)
    for (let i = 0; i < 3; i++) this.add.image(20 + i * 22, 16, 'heart').setScale(0.6).setDepth(31);
    this._dots = [];
    for (let i = 0; i < 4; i++) this._dots.push(this.add.circle(W / 2 - 45 + i * 30, 32, 6, 0x1a3040, 1).setStrokeStyle(1.5, 0x88aacc, 0.6).setDepth(31));
    this._starTxt = this.add.text(W - 16, 16, `⭐ ${this._stars}`, { fontSize: '13px', fontFamily: 'Georgia, serif', color: '#ffd86a', stroke: '#000', strokeThickness: 2 }).setOrigin(1, 0.5).setDepth(31);
    this._title = this.add.text(W / 2, 70, '', { fontSize: '18px', fontFamily: 'Georgia, serif', color: '#ffb0c8', stroke: '#0a0502', strokeThickness: 3 }).setOrigin(0.5).setDepth(31);
    this._sub = this.add.text(W / 2, 94, '', { fontSize: '11px', fontFamily: 'Georgia, serif', color: '#e8d0e0', stroke: '#000', strokeThickness: 2, align: 'center', wordWrap: { width: 600 } }).setOrigin(0.5).setDepth(31);
  }
  _setStep(n, title, sub) {
    if (n) { this._hudStep.setText(`GARAGE DELIVERY ROOM — STEP ${n} of 4`); this._dots.forEach((d, i) => d.setFillStyle(i < n ? 0x44aaff : 0x1a3040, 1)); }
    this._title.setText(title); this._sub.setText(sub || '');
  }

  // ── UPDATE (rain + live EKG + heart cursor) ───────────────────────────────────
  update(_, delta) {
    if (this._rain) this._rain.forEach(d => { d.r.y += d.vy; if (d.r.y > H) { d.r.y = -14; d.r.x = Math.random() * W; } });
    this._waveOffset += delta * 0.006 * 13;
    this._drawEKG();
    if (this._phase === 'heart' && this._cursor) {
      this._cursorX += delta * 0.105;
      if (this._cursorX > this._cursorMaxX) this._cursorX = this._monX;
      this._cursor.x = this._cursorX;
    }
  }
  _drawEKG() {
    if (!this._ekg) return;
    const calm = ['climax', 'arrival', 'care', 'done2'].includes(this._phase);
    this._ekg.clear();
    this._ekg.lineStyle(2, calm ? 0x44ff88 : 0x00ff88, 0.85);
    this._ekg.beginPath();
    const base = this._monY + 50;
    for (let xi = 0; xi < 200; xi++) {
      let y = Math.sin((xi + this._waveOffset) * 0.12) * (calm ? 6 : 10);
      const sp = (xi + this._waveOffset) % 50;
      if (sp < 4) y -= calm ? 18 : 28; else if (sp < 8) y += calm ? 12 : 18; else if (sp < 12) y -= 6;
      if (xi === 0) this._ekg.moveTo(this._monX + xi, base + y); else this._ekg.lineTo(this._monX + xi, base + y);
    }
    this._ekg.strokePath();
  }

  _clearPhase() { this._phaseObjs.forEach(o => { try { this.tweens.killTweensOf(o); o.destroy(); } catch (_) {} }); this._phaseObjs = []; }
  _add(o) { this._phaseObjs.push(o); return o; }
  _panel(y, h) { const g = this.add.graphics().setDepth(20); g.fillStyle(0x12091a, 0.9); g.fillRoundedRect(150, y, 500, h, 12); g.lineStyle(2, 0xc89af5, 0.7); g.strokeRoundedRect(150, y, 500, h, 12); return this._add(g); }
  _float(msg, color) { const t = this.add.text(W / 2, 120, msg, { fontSize: '16px', fontFamily: 'Georgia, serif', color, stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(45); this.tweens.add({ targets: t, y: 100, alpha: 0, duration: 850, onComplete: () => t.destroy() }); }
  _sparkleAt(x, y) { for (let i = 0; i < 8; i++) { const a = Math.random() * Math.PI * 2, d = 14 + Math.random() * 22; const s = this.add.text(x, y, '✨', { fontSize: '15px' }).setDepth(30); this.tweens.add({ targets: s, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, alpha: 0, duration: 600, onComplete: () => s.destroy() }); } }

  // ── SCENE 1 · STORMY NIGHT (intro cutscene) ───────────────────────────────────
  _intro() {
    this._setStep(0, '⛈️ A Stormy Night…', '');
    this.time.delayedCall(700, () => { if (this._gleeda) this.tweens.add({ targets: this._gleeda, alpha: 1, x: 200, duration: 900 }); });
    this.time.delayedCall(1700, () => this._say('"Gamma! The puppies are coming!\nHold on — I\'m right here. 💛"'));
    this.time.delayedCall(4200, () => { this._sayClear(); this._startSetup(); });
  }
  _say(txt) {
    this._sayClear();
    this._bub = this.add.graphics().setDepth(24);
    this._bub.fillStyle(0x0a0a1a, 0.92); this._bub.fillRoundedRect(210, 250, 260, 60, 8);
    this._bub.lineStyle(2, 0xffb0c8, 0.6); this._bub.strokeRoundedRect(210, 250, 260, 60, 8);
    this._bubTxt = this.add.text(340, 280, txt, { fontSize: '12px', fontFamily: 'Georgia, serif', color: '#ffe0ec', fontStyle: 'italic', align: 'center', lineSpacing: 4 }).setOrigin(0.5).setDepth(25);
  }
  _sayClear() { if (this._bub) { this._bub.destroy(); this._bub = null; } if (this._bubTxt) { this._bubTxt.destroy(); this._bubTxt = null; } }

  // ── SCENE 2 · TREATMENT ROOM SETUP (organize supplies) ────────────────────────
  _startSetup() {
    this._phase = 'setup';
    this._setStep(1, '🧰 Get Ready', 'Drag the supplies onto the prep tray to set up');
    this._panel(250, 116);
    this._add(this.add.text(W / 2, 352, '🩹 Prep Tray', { fontSize: '12px', fontFamily: 'Georgia, serif', color: '#cfe0f5' }).setOrigin(0.5).setDepth(22));
    const tray = { x: W / 2, y: 330 };
    this._add(this.add.rectangle(tray.x, tray.y, 150, 30, 0x2a2436, 0.9).setStrokeStyle(2, 0x6a5a8a, 1).setDepth(21));
    let placed = 0;
    ['🧺', '💧', '💊'].forEach((e, i) => {
      const ix = 260 + i * 140, iy = 288;
      const it = this._add(this.add.text(ix, iy, e, { fontSize: '34px' }).setOrigin(0.5).setDepth(23).setInteractive({ draggable: true, useHandCursor: true }));
      this.input.setDraggable(it);
      it.on('drag', (p, x, y) => { it.x = x; it.y = y; });
      it.on('dragend', () => {
        if (Phaser.Math.Distance.Between(it.x, it.y, tray.x, tray.y) < 90) { it.disableInteractive(); it.setPosition(tray.x - 50 + placed * 40, tray.y); placed++; this._sparkleAt(it.x, it.y); if (placed >= 3) { this._float('✅ Supplies ready!', '#88ffaa'); this.time.delayedCall(900, () => { this._clearPhase(); this._startHeartCheck(); }); } }
        else this.tweens.add({ targets: it, x: ix, y: iy, duration: 250, ease: 'Back.easeOut' });
      });
    });
  }

  // ── SCENE 3 · HEART CHECK ─────────────────────────────────────────────────────
  _startHeartCheck() {
    this._phase = 'heart';
    this._setStep(2, '❤️ Heart Check', 'Tap ❤️ (or SPACE) when the cursor is in the GREEN zone — 4×');
    const gzX = this._monX + 26, gzW = 46;
    this._add(this.add.rectangle(gzX + gzW / 2, this._monY + 50, gzW, 96, 0x00ff44, 0.16).setDepth(11));
    this._add(this.add.rectangle(gzX + gzW / 2, this._monY + 50, gzW, 96, 0, 0).setStrokeStyle(2, 0x00ff44, 0.7).setDepth(11));
    this._cursor = this._add(this.add.rectangle(this._monX, this._monY + 50, 3, 96, 0x44ff88, 0.95).setDepth(13));
    this._cursorX = this._monX; this._cursorMaxX = this._monX + 200; this._gzL = gzX; this._gzR = gzX + gzW; this._hHits = 0;
    this._hDots = [];
    for (let i = 0; i < 4; i++) this._hDots.push(this._add(this.add.circle(W / 2 - 45 + i * 30, 292, 7, 0x1a3040, 1).setStrokeStyle(1.5, 0x44ff88, 0.8).setDepth(22)));
    const hBtn = this._add(this.add.text(W / 2, 342, '❤️', { fontSize: '46px' }).setOrigin(0.5).setDepth(24).setInteractive({ useHandCursor: true }));
    this.tweens.add({ targets: hBtn, scale: 1.15, duration: 450, yoyo: true, repeat: -1 });
    hBtn.on('pointerdown', () => this._heartTap());
    this._spKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this._spKey.on('down', () => this._heartTap());
  }
  _heartTap() {
    if (this._phase !== 'heart') return;
    if (this._cursorX >= this._gzL && this._cursorX <= this._gzR) {
      this._hHits++; this._hDots[this._hHits - 1]?.setFillStyle(0x44ff88, 1);
      this._bpm = Math.max(78, this._bpm - 14); this._bpmTxt.setText(`${this._bpm}`);
      this.cameras.main.flash(120, 30, 160, 60); this._float('💚 Perfect!', '#44ff88');
      if (this._hHits >= 4) { this._phase = 'done'; this._bpmTxt.setColor('#44ff88'); if (this._spKey) this._spKey.removeAllListeners(); this.time.delayedCall(1000, () => { this._clearPhase(); this._startMedicine(); }); }
    } else { this.cameras.main.shake(140, 0.006); this._float('Wait for the green zone…', '#aaaaaa'); }
  }

  // ── SCENE 4 · MEDICINE PREPARATION (wrong ingredient fails) ───────────────────
  _startMedicine() {
    this._phase = 'med';
    this._setStep(3, '🧪 Medicine Preparation', 'Add the 3 correct medicines to the bowl — avoid the wrong one!');
    this._panel(248, 118);
    this._add(this.add.text(W / 2, 352, '🥣', { fontSize: '42px' }).setOrigin(0.5, 1).setDepth(22));
    this._medAdded = 0;
    Phaser.Utils.Array.Shuffle([{ ok: true }, { ok: true }, { ok: true }, { ok: false }]).forEach((it, i) => {
      const x = 226 + i * 116;
      const obj = this._add(this.add.text(x, 288, it.ok ? '🧪' : '🧴', { fontSize: '34px' }).setOrigin(0.5).setDepth(23).setInteractive({ useHandCursor: true }));
      this.tweens.add({ targets: obj, y: 282, duration: 600 + i * 110, yoyo: true, repeat: -1 });
      obj.on('pointerdown', () => {
        if (this._phase !== 'med') return;
        if (!it.ok) { this.cameras.main.shake(160, 0.01); this._float('✗ Wrong ingredient!', '#ff6666'); this.tweens.add({ targets: obj, x: x + 8, duration: 60, yoyo: true, repeat: 3 }); return; }
        obj.disableInteractive(); this.tweens.killTweensOf(obj);
        for (let s = 0; s < 6; s++) { const st = this.add.text(W / 2 + (Math.random() - 0.5) * 26, 334, '·', { fontSize: '20px', color: '#cfe' }).setDepth(24).setAlpha(0.7); this.tweens.add({ targets: st, y: 296, alpha: 0, duration: 700, onComplete: () => st.destroy() }); }
        this.tweens.add({ targets: obj, x: W / 2, y: 348, scale: 0.4, alpha: 0, duration: 320, onComplete: () => obj.destroy() });
        this.cameras.main.flash(100, 80, 160, 200); this._medAdded++;
        if (this._medAdded >= 3) { this._phase = 'done'; this._float('✅ Medicine ready!', '#88ffaa'); this.time.delayedCall(1000, () => { this._clearPhase(); this._startSupport(); }); }
      });
    });
  }

  // ── SCENE 5 · TREATMENT SUPPORT (longest — 7 tasks → 100%) ────────────────────
  _startSupport() {
    this._phase = 'support';
    this._setStep(4, '🤝 Treatment Support', 'Complete every task to help Gamma — fill the bar to 100%');
    this._panel(238, 132);
    this._progDone = 0;
    this._add(this.add.rectangle(W / 2, 356, 440, 16, 0x10202c, 1).setStrokeStyle(2, 0x3a6a8a, 1).setDepth(22));
    this._progFill = this._add(this.add.rectangle(W / 2 - 220, 356, 0, 14, 0x44cc66, 1).setOrigin(0, 0.5).setDepth(23));
    this._progTxt = this._add(this.add.text(W / 2, 356, '0%', { fontSize: '11px', fontFamily: 'Georgia, serif', color: '#fff' }).setOrigin(0.5).setDepth(24));
    const tasks = [
      { e: '🧺', l: 'Towel' }, { e: '💧', l: 'Warm Water' }, { e: '🧣', l: 'Blanket' },
      { e: '📈', l: 'Check Monitor' }, { e: '🔥', l: 'Heating Lamp' }, { e: '🧺', l: 'Puppy Basket' }, { e: '🧸', l: 'Nursery' },
    ];
    const total = tasks.length;
    tasks.forEach((t, i) => {
      const col = i % 4, row = Math.floor(i / 4);
      const x = 215 + col * 96, y = 280 + row * 0; // single row of 7 below
      const xx = 200 + i * 62;
      const card = this._add(this.add.rectangle(xx, 286, 54, 50, 0x0e1a26, 0.95).setStrokeStyle(2, 0x3a6a8a, 1).setDepth(22).setInteractive({ useHandCursor: true }));
      this._add(this.add.text(xx, 282, t.e, { fontSize: '22px' }).setOrigin(0.5).setDepth(23));
      this._add(this.add.text(xx, 306, t.l, { fontSize: '7px', fontFamily: 'Georgia, serif', color: '#bcd', align: 'center', wordWrap: { width: 56 } }).setOrigin(0.5).setDepth(23));
      card.once('pointerdown', () => {
        card.setFillStyle(0x143a24).disableInteractive();
        this._add(this.add.text(xx + 18, 268, '✓', { fontSize: '18px', color: '#88ff88', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(24));
        this._progDone++;
        const pct = Math.round((this._progDone / total) * 100);
        this.tweens.add({ targets: this._progFill, displayWidth: 440 * (this._progDone / total), duration: 300 });
        this._progTxt.setText(`${pct}%`);
        this.cameras.main.flash(80, 50, 140, 70);
        // Gamma gets comfier as care progresses
        if (this._progDone >= total) { this._phase = 'done'; this.time.delayedCall(700, () => this._climax()); }
      });
    });
  }

  // ── CINEMATIC CLIMAX ──────────────────────────────────────────────────────────
  _climax() {
    this._clearPhase();
    this._phase = 'climax';
    this._setStep(0, '💛 Gamma is doing great!', 'The treatment worked — the puppies are coming!');
    this._bpm = 76; this._bpmTxt.setText('76').setColor('#44ff88');
    const warm = this.add.rectangle(W / 2, H / 2, W, H, 0xffb060, 0).setDepth(38);
    this.tweens.add({ targets: warm, alpha: 0.16, duration: 1200, yoyo: true });
    this.cameras.main.zoomTo(1.2, 1400, 'Sine.easeInOut');
    this.cameras.main.pan(W / 2 + 30, 330, 1400, 'Sine.easeInOut');
    if (this._gamma.setTexture && this.textures.exists('gemma_happy')) this._gamma.setTexture('gemma_happy');
    this.time.addEvent({ delay: 160, repeat: 14, callback: () => { const e = Phaser.Math.RND.pick(['🐾', '💛', '✨']); const t = this.add.text(W / 2 + 30 + (Math.random() - 0.5) * 200, 360, e, { fontSize: `${14 + Math.random() * 12}px` }).setDepth(39); this.tweens.add({ targets: t, y: t.y - 120, alpha: 0, duration: 1600, onComplete: () => t.destroy() }); }});
    this.time.delayedCall(2600, () => { this.cameras.main.zoomTo(1, 900, 'Sine.easeInOut'); this.cameras.main.pan(W / 2, H / 2, 900, 'Sine.easeInOut'); this.time.delayedCall(1000, () => this._puppyArrival()); });
  }

  // ── SCENE 6 · SEVEN PUPPY ARRIVAL ─────────────────────────────────────────────
  _puppyArrival() {
    this._phase = 'arrival';
    this._title.setText('🐶 The puppies are arriving!'); this._sub.setText('One by one… a new family is born!');
    const tints = [0xc8915a, 0x3a2a22, 0xf0e6d2, 0xe0b060, 0xa88858, 0x806048, 0xd8c8a8];
    const useImg = this.textures.exists('gemma_idle');
    this._pups = [];
    const spots = [[240, 392], [320, 400], [400, 404], [480, 404], [560, 400], [285, 408], [520, 410]];
    spots.forEach((s, i) => this.time.delayedCall(500 + i * 620, () => {
      let pup, base;
      if (useImg) { pup = this.add.image(s[0], s[1], 'gemma_idle').setOrigin(0.5, 1).setDisplaySize(54, 32).setDepth(12).setTint(tints[i]); base = pup.scaleX; pup.setScale(base * 0.2); this.tweens.add({ targets: pup, scaleX: base, scaleY: base, duration: 400, ease: 'Back.easeOut' }); }
      else { pup = this.add.text(s[0], s[1], '🐶', { fontSize: '28px' }).setOrigin(0.5, 1).setDepth(12).setScale(0.2); this.tweens.add({ targets: pup, scale: 1, duration: 400, ease: 'Back.easeOut' }); }
      this._pups.push(pup);
      const bark = this.add.text(s[0], s[1] - 46, 'yip! 🐾', { fontSize: '12px', fontFamily: 'Georgia, serif', color: '#ffd0e4', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(14);
      this.tweens.add({ targets: bark, y: bark.y - 20, alpha: 0, duration: 900, onComplete: () => bark.destroy() });
      this._sparkleAt(s[0], s[1] - 20); this.cameras.main.flash(120, 255, 230, 180);
      if (this._pups.length >= 7) this.time.delayedCall(900, () => this._puppyCare());
    }));
  }

  // ── SCENE 7 · PUPPY CARE drag & drop ──────────────────────────────────────────
  _puppyCare() {
    this._phase = 'care';
    this._setStep(0, '🧺 Puppy Care', 'Drag each puppy into a cozy basket');
    const baskets = [];
    for (let i = 0; i < 7; i++) { const bx = 130 + i * 78; this.add.text(bx, 392, '🧺', { fontSize: '34px' }).setOrigin(0.5).setDepth(8); baskets.push({ x: bx, y: 384, used: false }); }
    let placed = 0;
    this._pups.forEach((pup) => {
      pup.setDepth(20).setInteractive({ draggable: true, useHandCursor: true });
      this.input.setDraggable(pup);
      const home = { x: pup.x, y: pup.y };
      pup.on('drag', (p, x, y) => { pup.x = x; pup.y = y; });
      pup.on('dragend', () => {
        const slot = baskets.find(b => !b.used && Phaser.Math.Distance.Between(pup.x, pup.y, b.x, b.y) < 46);
        if (slot) { slot.used = true; pup.disableInteractive(); pup.setPosition(slot.x, slot.y); placed++; this.tweens.add({ targets: pup, scale: pup.scaleX * 1.15, duration: 100, yoyo: true }); this._sparkleAt(slot.x, slot.y - 10);
          if (placed >= 7) { this._phase = 'done2'; this._float('💛 All puppies safe & cozy!', '#88ffaa'); this.time.delayedCall(1600, () => this._toNursery()); } }
        else this.tweens.add({ targets: pup, x: home.x, y: home.y, duration: 250, ease: 'Back.easeOut' });
      });
    });
  }

  _toNursery() { this.cameras.main.fadeOut(800, 0, 0, 0); this.time.delayedCall(850, () => this.scene.start('L5_Nursery', { stars: this._stars })); }
}
