import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { generateL4Assets, generateL4StreetAssets } from './L4Assets.js';

// ── Level 4 — Build Gamma's New Home: collect 6 materials across the neighbourhood ──
const WORLD_W  = 13200;
const GROUND_Y = 408;            // surface the player stands on
const RUN_SPEED = 230;
const JUMP_V    = -560;

// 6 required items (key, label, texture, world x)
const ITEMS = [
  { key: 'wood',    label: 'Wood Plank',   tex: 'l4_wood',      x: 1500, w: 60, h: 36 },
  { key: 'roof',    label: 'Roof Panel',   tex: 'l4_roof',      x: 3650, w: 60, h: 36 },
  { key: 'nails',   label: 'Nails Box',    tex: 'l4_nails',     x: 5800, w: 54, h: 48 },
  { key: 'paint',   label: 'Paint Bucket', tex: 'l4_paint',     x: 8000, w: 48, h: 56 },
  { key: 'bedding', label: 'Soft Bedding', tex: 'l4_bed',       x: 10100, w: 76, h: 54 },
  { key: 'bowl',    label: 'Food Bowl',    tex: 'l4_food_bowl', x: 12000, w: 64, h: 54 },
];

// obstacles: jump over them (collision when grounded = lose a heart)
const OBSTACLES = [
  { tex: 'l4_cone',   x: 900,   w: 40, h: 48 },
  { tex: 'l4_puddle', x: 2050,  w: 76, h: 22, flat: true },
  { tex: 'l4_boxes',  x: 2750,  w: 62, h: 52 },
  { tex: 'l4_bin',    x: 4250,  w: 44, h: 58 },
  { tex: 'l4_cone',   x: 4900,  w: 40, h: 48 },
  { tex: 'l4_pothole',x: 5300,  w: 66, h: 24, flat: true },
  { tex: 'l4_bike',   x: 6700,  w: 74, h: 50 },
  { tex: 'l4_boxes',  x: 7300,  w: 62, h: 52 },
  { tex: 'l4_bin',    x: 8800,  w: 44, h: 58 },
  { tex: 'l4_puddle', x: 9400,  w: 76, h: 22, flat: true },
  { tex: 'l4_cone',   x: 10700, w: 40, h: 48 },
  { tex: 'l4_boxes',  x: 11300, w: 62, h: 52 },
  { tex: 'l4_pothole',x: 12500, w: 66, h: 24, flat: true },
];

export class Level4Scene extends Phaser.Scene {
  constructor() { super('Level4'); }

  create() {
    generateL4Assets(this);
    generateL4StreetAssets(this);

    this.physics.world.setBounds(0, 0, WORLD_W, H);
    this.cameras.main.setBounds(0, 0, WORLD_W, H);
    this.cameras.main.fadeIn(700, 0, 0, 0);

    this._collected = {};
    this._coins = 0;
    this._hearts = 3;
    this._hurtCD = false;
    this._done = false;
    this._returning = false;

    this._buildBackground();
    this._buildRoad();
    this._buildProps();
    this._buildItems();
    this._buildObstacles();
    this._buildCoinsAndStars();
    this._buildDogEvent();
    this._buildPlayer();
    this._buildHUD();
    this._buildControls();

    this.time.delayedCall(400, () => this._toast("Collect all 6 materials for Gamma's house! 🏠"));
  }

  // ── BACKGROUND (parallax) ───────────────────────────────────────────────────
  _buildBackground() {
    // Level-2 "Road" background — tiling road_bg with parallax (same as Chapter 2, Zone 1)
    if (this.textures.exists('road_bg')) {
      this._roadBgTile = this.add.tileSprite(W / 2, H / 2, W, H, 'road_bg').setScrollFactor(0).setDepth(-30);
    } else {
      const sky = this.add.graphics().setScrollFactor(0).setDepth(-30);
      sky.fillGradientStyle(0x7ec8f0, 0x7ec8f0, 0xcdeafd, 0xcdeafd, 1); sky.fillRect(0, 0, W, H);
    }
  }

  // ── ROAD SURFACE (world space) — same styling as Level 2, Zone 1 ────────────
  _buildRoad() {
    const r = this.add.graphics().setDepth(0);
    r.fillStyle(0x3d3d4a, 1); r.fillRect(0, GROUND_Y + 6, WORLD_W, 20);
    r.fillStyle(0x2a2a38, 1); r.fillRect(0, GROUND_Y + 26, WORLD_W, H - GROUND_Y - 26);
    r.fillStyle(0x888899, 0.55); r.fillRect(0, GROUND_Y + 14, WORLD_W, 2);
    // lane dashes
    r.fillStyle(0xbbbb88, 0.18);
    for (let x = 80; x < WORLD_W; x += 120) r.fillRect(x, H - 10, 80, 3);

    // physics ground (invisible static body)
    const g = this.add.rectangle(WORLD_W / 2, GROUND_Y + 14, WORLD_W, 28, 0, 0);
    this.physics.add.existing(g, true);
    this._ground = g;
  }

  // ── Section landmarks (navigation aid for the collect game) ─────────────────
  _buildProps() {
    // section signs
    const sign = (x, txt, col) => {
      const p = this.add.graphics().setDepth(5);
      p.fillStyle(col, 1); p.fillRoundedRect(x - 60, 150, 120, 30, 6);
      p.lineStyle(2, 0xffffff, 0.8); p.strokeRoundedRect(x - 60, 150, 120, 30, 6);
      this.add.text(x, 165, txt, { fontSize: '13px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#0006', strokeThickness: 2 }).setOrigin(0.5).setDepth(6);
    };
    sign(2300, '🛒 GROCERY', 0xcc5544);
    sign(4700, '🏘️ HOMES', 0x4477aa);
    sign(7000, '🌳 PARK', 0x44aa55);
    sign(9300, '🏪 MARKET', 0xaa7733);
    sign(11600, '🏡 HOME ZONE', 0xcc7755);
  }

  // ── COLLECTIBLE ITEMS ───────────────────────────────────────────────────────
  _buildItems() {
    this._itemObjs = ITEMS.map(it => {
      const y = GROUND_Y - 36;
      const img = this.add.image(it.x, y, it.tex).setDisplaySize(it.w, it.h).setDepth(8);
      this.tweens.add({ targets: img, y: y - 12, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const glow = this.add.circle(it.x, y, 30, 0xfff0a0, 0.18).setDepth(7);
      this.tweens.add({ targets: glow, alpha: 0.4, scale: 1.2, duration: 800, yoyo: true, repeat: -1 });
      // floating label
      this.add.text(it.x, y - 34, it.label, { fontSize: '10px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#0008', strokeThickness: 3 }).setOrigin(0.5).setDepth(9);
      return { ...it, img, glow, taken: false };
    });
  }

  _buildObstacles() {
    this._obsObjs = OBSTACLES.map(o => {
      const y = o.flat ? GROUND_Y + 6 : GROUND_Y - 2;
      const img = this.add.image(o.x, y, o.tex).setOrigin(0.5, 1).setDisplaySize(o.w, o.h).setDepth(7);
      // clearY = the height the player's feet must rise ABOVE (by jumping) to avoid the hit
      const clearY = o.flat ? GROUND_Y - 30 : y - o.h;
      return { ...o, img, clearY };
    });
  }

  // ── COINS + STARS ───────────────────────────────────────────────────────────
  _buildCoinsAndStars() {
    this._coinObjs = [];
    for (let x = 400; x < WORLD_W - 200; x += 230) {
      // arc of 3 coins
      for (let i = 0; i < 3; i++) {
        const cx = x + i * 34, cy = GROUND_Y - 60 - Math.sin(i / 2 * Math.PI) * 26;
        const c = this.add.image(cx, cy, 'l4_coin').setDisplaySize(22, 22).setDepth(8);
        this.tweens.add({ targets: c, angle: 360, duration: 1400, repeat: -1 });
        this._coinObjs.push({ img: c, x: cx, y: cy, taken: false, star: false });
      }
    }
    // a few stars
    [1700, 5000, 8400, 11800].forEach(x => {
      const s = this.add.image(x, GROUND_Y - 110, 'l4_star').setDisplaySize(28, 28).setDepth(8);
      this.tweens.add({ targets: s, y: s.y - 14, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this._coinObjs.push({ img: s, x, y: GROUND_Y - 110, taken: false, star: true });
    });
  }

  // ── MINI EVENT: dog blocks the road ─────────────────────────────────────────
  _buildDogEvent() {
    const x = 6300;
    this._dog = {
      x, gone: false, triggered: false,
      img: this.add.image(x, GROUND_Y + 4, this.textures.exists('gemma_idle') ? 'gemma_idle' : 'l4_bush')
        .setOrigin(0.5, 1).setDisplaySize(96, 56).setDepth(8).setTint(0xd8c0a0),
    };
    this.tweens.add({ targets: this._dog.img, y: this._dog.img.y - 4, duration: 500, yoyo: true, repeat: -1 });
  }

  // ── PLAYER ──────────────────────────────────────────────────────────────────
  _buildPlayer() {
    const tex = this.textures.exists('gleeda_idle') ? 'gleeda_idle' : 'l4_doghouse';
    this.player = this.physics.add.sprite(80, GROUND_Y - 60, tex).setDepth(10);
    this.player.setDisplaySize(58, 74);
    const tw = this.player.texture.source[0].width, th = this.player.texture.source[0].height;
    this.player.body.setSize(tw * 0.5, th * 0.82, true);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this._ground);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);   // slight lag = premium feel
    this._facing = 1;
  }

  // ── HUD ─────────────────────────────────────────────────────────────────────
  _buildHUD() {
    // hearts
    this._heartTxt = this.add.text(14, 10, '❤️❤️❤️', { fontSize: '20px' }).setScrollFactor(0).setDepth(50);
    // coins
    this.add.image(24, 42, 'l4_coin').setDisplaySize(22, 22).setScrollFactor(0).setDepth(50);
    this._coinTxt = this.add.text(40, 32, '0', { fontSize: '16px', fontFamily: 'Georgia, serif', color: '#f5c84a', stroke: '#000', strokeThickness: 3 }).setScrollFactor(0).setDepth(50);

    // title + item panel (top center)
    const pw = 360, px = W / 2 - pw / 2;
    const p = this.add.graphics().setScrollFactor(0).setDepth(49);
    p.fillStyle(0x1a2230, 0.9); p.fillRoundedRect(px, 6, pw, 58, 10);
    p.lineStyle(2, 0x4a6080, 0.8); p.strokeRoundedRect(px, 6, pw, 58, 10);
    this.add.text(W / 2, 16, 'LEVEL 4 — COLLECT ITEMS', { fontSize: '12px', fontFamily: 'Georgia, serif', color: '#cfe0f5' }).setOrigin(0.5).setScrollFactor(0).setDepth(50);

    this._itemHud = {};
    ITEMS.forEach((it, i) => {
      const ix = px + 32 + i * 56, iy = 44;
      const icon = this.add.image(ix, iy, it.tex).setDisplaySize(it.w * 0.42, it.h * 0.42).setScrollFactor(0).setDepth(50).setAlpha(0.4);
      const chk = this.add.text(ix, iy + 14, '0/1', { fontSize: '9px', fontFamily: 'Georgia, serif', color: '#aab' }).setOrigin(0.5).setScrollFactor(0).setDepth(51);
      this._itemHud[it.key] = { icon, chk };
    });

    // pause
    const pause = this.add.text(W - 24, 14, '⏸', { fontSize: '24px' }).setOrigin(0.5).setScrollFactor(0).setDepth(50).setInteractive({ useHandCursor: true });
    pause.on('pointerdown', () => this._togglePause());
  }

  _buildControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('A,D,W,SPACE');
    const footer = document.getElementById('game-footer');
    if (footer) footer.style.display = 'flex';
    this.events.once('shutdown', () => { const f = document.getElementById('game-footer'); if (f) f.style.display = 'none'; });
  }

  // ── UPDATE ──────────────────────────────────────────────────────────────────
  update(time, delta) {
    if (this._done || this._paused) return;
    const ts = window._touchState || {};
    const p = this.player, onGround = p.body.blocked.down || p.body.touching.down;

    let vx = 0;
    const left  = this.cursors.left.isDown  || this.keys.A.isDown || ts.left;
    const right = this.cursors.right.isDown || this.keys.D.isDown || ts.right;
    const jump  = this.cursors.up.isDown    || this.keys.W.isDown || this.keys.SPACE.isDown || ts.jump;

    if (this._dogBlock && p.x > this._dogBlock - 30) { p.x = this._dogBlock - 30; }   // dog soft-barrier

    if (left)  { vx = -RUN_SPEED; this._facing = -1; }
    if (right) { vx =  RUN_SPEED; this._facing =  1; }
    p.setVelocityX(vx);
    p.setFlipX(this._facing < 0);

    if (jump && onGround) { p.setVelocityY(JUMP_V); }

    // animation
    if (!onGround) { if (this.textures.exists('gleeda_jump')) p.setTexture('gleeda_jump'); }
    else if (vx !== 0) { if (this.textures.exists('gleeda_run1')) p.setTexture('gleeda_run1'); }
    else { if (this.textures.exists('gleeda_idle')) p.setTexture('gleeda_idle'); }
    p.setDisplaySize(58, 74);

    // clouds drift
    if (this._clouds) this._clouds.forEach((c, i) => { c.x -= 0.06 * (1 + i % 2); if (c.x < -60) c.x = W + 60; });

    this._checkItems();
    this._checkCoins();
    this._checkObstacles(onGround);
    this._checkDog();
    this._checkHome();
  }

  _checkItems() {
    const p = this.player;
    this._itemObjs.forEach(it => {
      if (it.taken) return;
      if (Math.abs(p.x - it.x) < 40 && Math.abs(p.y - it.img.y) < 70) {
        it.taken = true;
        this._collected[it.key] = true;
        this.tweens.killTweensOf(it.img); this.tweens.killTweensOf(it.glow);
        it.glow.destroy();
        this.tweens.add({ targets: it.img, y: it.img.y - 40, alpha: 0, scale: 1.4, duration: 450, onComplete: () => it.img.destroy() });
        this._sparkle(it.x, it.img.y);
        // HUD
        const h = this._itemHud[it.key];
        h.icon.setAlpha(1); h.chk.setText('✓').setColor('#66ff88').setFontSize(13);
        this._toast(`${it.label} Collected!  +25 🪙`);
        this._addCoins(25);
        if (Object.keys(this._collected).length === ITEMS.length) this._allCollected();
      }
    });
  }

  _checkCoins() {
    const p = this.player;
    this._coinObjs.forEach(c => {
      if (c.taken) return;
      if (Math.abs(p.x - c.x) < 34 && Math.abs(p.y - c.y) < 56) {
        c.taken = true;
        this.tweens.killTweensOf(c.img);
        this.tweens.add({ targets: c.img, y: 40, x: this.cameras.main.scrollX + 24, scale: 0.5, alpha: 0, duration: 350, onComplete: () => c.img.destroy() });
        this._addCoins(c.star ? 50 : 5);
      }
    });
  }

  _checkObstacles(onGround) {
    if (this._hurtCD) return;
    const p = this.player;
    for (const o of this._obsObjs) {
      if (Math.abs(p.x - o.x) < (o.w / 2 + 14) && p.body.bottom > o.clearY + 4) {
        this._loseHeart();
        break;
      }
    }
  }

  _checkDog() {
    if (!this._dog || this._dog.gone) return;
    const p = this.player;
    if (!this._dog.triggered && Math.abs(p.x - this._dog.x) < 130 && p.x < this._dog.x) {
      this._dog.triggered = true;
      this._dogBlock = this._dog.x - 6;
      this._toast('🐕 A dog is resting on the path… wait a moment!');
      let t = 3;
      const lbl = this.add.text(this._dog.x, this._dog.img.y - 70, '3', { fontSize: '26px', fontFamily: 'Georgia, serif', color: '#ffd86a', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setDepth(20);
      const ev = this.time.addEvent({ delay: 1000, repeat: 2, callback: () => {
        t--; if (t > 0) { lbl.setText(`${t}`); }
        else {
          lbl.destroy();
          this._dog.gone = true; this._dogBlock = null;
          this.tweens.add({ targets: this._dog.img, x: this._dog.x + 200, alpha: 0, duration: 900, onComplete: () => this._dog.img.destroy() });
          this._toast('🐾 The dog moved on. Go ahead!');
        }
      }});
    }
  }

  _checkHome() {
    if (!this._returning) return;
    const p = this.player;
    if (p.x > WORLD_W - 120) {
      this._done = true;
      this._toast('🏡 Home! Time to build Gamma\'s house!');
      this.cameras.main.fadeOut(700, 0, 0, 0);
      this.time.delayedCall(750, () => this.scene.start('L4_Decorate', { coins: this._coins }));
    }
  }

  _allCollected() {
    this._returning = true;
    this._toast('✅ All materials collected! Return home →');
    // HOME sign + arrow at the end
    this.add.image(WORLD_W - 90, GROUND_Y - 70, 'l4_homesign').setDisplaySize(96, 46).setDepth(9);
    this.add.image(WORLD_W - 70, GROUND_Y - 150, 'l4_house').setOrigin(0.5, 1).setDisplaySize(180, 168).setTint(0xfff0d8).setDepth(6);
    // arrow above player
    this._arrow = this.add.text(0, 0, '➡️', { fontSize: '26px' }).setScrollFactor(0).setDepth(52);
    this.tweens.add({ targets: this._arrow, alpha: 0.4, duration: 500, yoyo: true, repeat: -1 });
  }

  // ── feedback helpers ────────────────────────────────────────────────────────
  _addCoins(n) {
    this._coins += n;
    this._coinTxt.setText(`${this._coins}`);
    this.tweens.add({ targets: this._coinTxt, scale: 1.3, duration: 120, yoyo: true });
  }

  _loseHeart() {
    this._hurtCD = true;
    this._hearts = Math.max(0, this._hearts - 1);
    this._heartTxt.setText('❤️'.repeat(this._hearts) + '🖤'.repeat(3 - this._hearts));
    this.cameras.main.shake(180, 0.01);
    this.cameras.main.flash(160, 200, 40, 40);
    this.tweens.add({ targets: this.player, alpha: 0.4, duration: 100, yoyo: true, repeat: 4 });
    this.time.delayedCall(1100, () => { this._hurtCD = false; this.player.setAlpha(1); });
    if (this._hearts <= 0) this._gameOver();
  }

  _gameOver() {
    this._done = true;
    this.add.rectangle(this.cameras.main.scrollX + W / 2, H / 2, W, H, 0x000000, 0.65).setDepth(60).setScrollFactor(0);
    this.add.text(W / 2, H / 2 - 10, '💔 Oh no! Try again', { fontSize: '24px', fontFamily: 'Georgia, serif', color: '#ff8888', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setScrollFactor(0).setDepth(61);
    this.time.delayedCall(1600, () => { this.cameras.main.fadeOut(400, 0, 0, 0); this.time.delayedCall(450, () => this.scene.restart()); });
  }

  _sparkle(x, y) {
    for (let i = 0; i < 10; i++) {
      const ang = Math.random() * Math.PI * 2, d = 16 + Math.random() * 26;
      const s = this.add.image(x, y, this.textures.exists('l4_sparkle') ? 'l4_sparkle' : 'l4_coin').setScale(0.6).setDepth(30);
      s.setTint([0xffee44, 0xff88cc, 0x88eeff, 0xaaffaa][i % 4]);
      this.tweens.add({ targets: s, x: x + Math.cos(ang) * d, y: y + Math.sin(ang) * d, alpha: 0, scale: 1.2, duration: 600, onComplete: () => s.destroy() });
    }
  }

  _toast(msg) {
    if (this._toastObj) { try { this._toastObj.destroy(); } catch (_) {} }
    const t = this.add.text(W / 2, H - 70, msg, { fontSize: '14px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#000', strokeThickness: 3, backgroundColor: '#0008', padding: { x: 12, y: 6 }, align: 'center' }).setOrigin(0.5).setScrollFactor(0).setDepth(55).setAlpha(0);
    this._toastObj = t;
    this.tweens.add({ targets: t, alpha: 1, y: H - 76, duration: 250 });
    this.tweens.add({ targets: t, alpha: 0, delay: 2200, duration: 400, onComplete: () => { try { t.destroy(); } catch (_) {} } });
  }

  // ── PAUSE ───────────────────────────────────────────────────────────────────
  _togglePause() {
    if (this._done) return;
    if (this._paused) { this._pauseObjs.forEach(o => o.destroy()); this._pauseObjs = null; this._paused = false; this.physics.resume(); return; }
    this._paused = true; this.physics.pause();
    const cx = this.cameras.main.scrollX;
    const ov = this.add.rectangle(cx + W / 2, H / 2, W, H, 0x000000, 0.6).setDepth(70).setScrollFactor(0);
    const t = this.add.text(W / 2, H / 2 - 40, '⏸ PAUSED', { fontSize: '24px', fontFamily: 'Georgia, serif', color: '#fff' }).setOrigin(0.5).setScrollFactor(0).setDepth(71);
    const resume = this.add.text(W / 2, H / 2 + 6, '▶ Resume', { fontSize: '16px', fontFamily: 'Georgia, serif', color: '#fff', backgroundColor: '#44aa44', padding: { x: 16, y: 8 } }).setOrigin(0.5).setScrollFactor(0).setDepth(71).setInteractive({ useHandCursor: true });
    const menu = this.add.text(W / 2, H / 2 + 48, '🏠 Menu', { fontSize: '14px', fontFamily: 'Georgia, serif', color: '#fff', backgroundColor: '#884422', padding: { x: 14, y: 7 } }).setOrigin(0.5).setScrollFactor(0).setDepth(71).setInteractive({ useHandCursor: true });
    resume.on('pointerdown', () => this._togglePause());
    menu.on('pointerdown', () => { this.physics.resume(); this.scene.start('Menu'); });
    this._pauseObjs = [ov, t, resume, menu];
  }
}
