import Phaser from 'phaser';
import { W, H } from '../../config/GameConfig.js';
import { BaseLevelScene } from './BaseLevelScene.js';

// Chapter 1 — Three zones: Easy → Medium (Hard) → Boss → Free Gemma
export class Level1Scene extends BaseLevelScene {
  constructor() { super('Level1'); }

  create() {
    const config = {
      worldWidth: 5100,
      startX: 80, startY: 360,
      chapterName: "Chapter 1 — Shadow's Journey",
      objective: 'Cross the forest! Pull levers to build bridges!\nFind Gemma and bark the snake away! 🐾',
      platforms: [
        // ── ZONE 1: Easy Forest (x = 0–1700) ──────────────────────────────
        { x: 200,  y: 370 },
        { x: 390,  y: 335 },
        { x: 570,  y: 370 },
        { x: 740,  y: 310 },
        { x: 920,  y: 360, key: 'log' },
        { x: 1100, y: 330 },
        { x: 1290, y: 370 },
        { x: 1460, y: 300, key: 'log' },
        { x: 1620, y: 355 },           // platform before lever + big hole
        // ── ZONE 2: Medium Jungle (x = 2000–3500) ──────────────────────────
        { x: 2080, y: 360 },
        { x: 2270, y: 325 },
        { x: 2460, y: 370 },
        { x: 2640, y: 295, key: 'log' },   // COLLAPSING — gap below at x=2610
        { x: 2830, y: 350 },
        { x: 3020, y: 315 },
        { x: 3200, y: 360, key: 'log' },   // COLLAPSING — gap below at x=3170
        { x: 3390, y: 330 },
        { x: 3480, y: 355 },           // platform before lever + big hole
        // ── ZONE 3: Hard Territory (x = 3800–5100) ─────────────────────────
        { x: 3900, y: 365 },
        { x: 4080, y: 320 },
        { x: 4270, y: 355, key: 'log' },   // COLLAPSING — gap below at x=4238
        { x: 4440, y: 295 },
        { x: 4650, y: 330 },
      ],
      rocks: [
        // Zone 1 — hurdles (jump over)
        { x: 150,  y: 390, hurdle: true, immovable: true },
        { x: 460,  y: 390, hurdle: true, immovable: true },
        { x: 800,  y: 390, hurdle: true, immovable: true },
        { x: 1150, y: 390, hurdle: true, immovable: true },
        // Zone 1 — pushable
        { x: 320,  y: 395 },
        { x: 700,  y: 395 },
        // Zone 2 — pushable
        { x: 2500, y: 395 },
        { x: 3050, y: 395 },
        // Zone 3 — hurdles
        { x: 3860, y: 390, hurdle: true, immovable: true },
        { x: 4120, y: 390, hurdle: true, immovable: true },
      ],
      gaps: [
        // Zone 1 — small gaps
        { x: 280,  w: 70 },
        { x: 630,  w: 70 },
        // Zone 1 — BIG HOLE (lever 1 → bridge 1)
        { x: 1700, w: 300 },
        // Zone 2 — medium gaps
        { x: 2100, w: 80 },
        { x: 2360, w: 80 },
        // Zone 2 — collapsing log gaps
        { x: 2610, w: 64 },
        { x: 3170, w: 64 },
        // Zone 2 — BIG HOLE (lever 2 → bridge 2)
        { x: 3500, w: 300 },
        // Zone 3 — gaps
        { x: 3990, w: 70 },
        { x: 4238, w: 64 },   // collapsing log gap
      ]
    };

    this.initLevel(config);
    this._initZoneProgressBar();

    // ── Zone progress flags ────────────────────────────────────────────────
    this._zone2Entered = false;
    this._zone3Entered = false;

    // ── Rain (Zone 1 atmosphere) ───────────────────────────────────────────
    this._rainData = [];
    for (let i = 0; i < 70; i++) {
      const r = this.add.image(Math.random() * 800, Math.random() * 450, 'raindrop')
        .setScrollFactor(0).setAlpha(0.25).setDepth(25);
      this._rainData.push({ img: r, speed: 4 + Math.random() * 2 });
    }
    this._rainActive = true;

    // ── Zone labels (world-space warning signs) ────────────────────────────
    this.add.text(2010, 348, '⚠️', { fontSize: '22px' }).setDepth(14);
    this.add.text(3810, 348, '⚠️', { fontSize: '22px' }).setDepth(14);

    // ── LEVER 1: Zone 1 → Zone 2 bridge (Memory Cards puzzle) ─────────────
    this._spawnLever(1650, () => {
      this._puzzleMemoryCards(() => {
        this._buildBridge(1700, 300);
        this._showMessage('🌉 Bridge built! Cross to Zone 2!');
      });
    });

    // ── LEVER 2: Zone 2 → Zone 3 bridge (Match Columns puzzle) ───────────
    this._spawnLever(3490, () => {
      this._puzzleMatchColumns(() => {
        this._buildBridge(3500, 300);
        this._showMessage('🌉 Bridge built! Cross to Zone 3!');
      });
    });

    // ── Collapsing logs — Zone 2 ───────────────────────────────────────────
    this._collapsing = [];
    [{ x: 2640, y: 295 }, { x: 3200, y: 360 }, { x: 4270, y: 355 }].forEach(ld => {
      const warn = this.add.rectangle(ld.x, ld.y - 2, 88, 6, 0xff4422, 0.5).setDepth(12);
      this.tweens.add({ targets: warn, alpha: { from: 0.3, to: 0.85 }, duration: 400, yoyo: true, repeat: -1 });
      this._collapsing.push({ x: ld.x, y: ld.y, warn, triggered: false });
    });

    // ── Zone 2 thorn hazards ───────────────────────────────────────────────
    this._thorns = [];
    [2350, 2900, 3300].forEach(tx => {
      this.add.text(tx, 378, '🌵', { fontSize: '24px' }).setDepth(9);
      this._thorns.push({ x: tx - 12, y: 370, w: 30, h: 30 });
    });
    // Zone 3 thorns
    [4100, 4550].forEach(tx => {
      this.add.text(tx, 378, '🌵', { fontSize: '24px' }).setDepth(9);
      this._thorns.push({ x: tx - 12, y: 370, w: 30, h: 30 });
    });

    // ── Boulder gauntlet (Zone 1, x=900–1600) ────────────────────────────
    this._boulderGroup = this.physics.add.group();
    this.physics.add.overlap(this.shadow, this._boulderGroup, (s, boulder) => {
      if (!boulder.getData('hit')) {
        boulder.setData('hit', true);
        this.tweens.add({ targets: boulder, alpha: 0, duration: 180, onComplete: () => boulder.destroy() });
        this._onHazardHit();
      }
    });
    this._gauntletStarted = false;

    // ── Zone 2 patrol snake ────────────────────────────────────────────────
    this._patrolSnake = this.physics.add.sprite(2700, 374, 'snake')
      .setScale(0.55).setDepth(9).setVisible(false);
    this._patrolSnake.body.setAllowGravity(false);
    this._patrolDir    = 1;
    this._patrolMin    = 2350;
    this._patrolMax    = 3100;
    this._patrolScared = false;
    this._patrolHitCD  = false;

    // ── Zone 3 boss snake ──────────────────────────────────────────────────
    this.snake = this.physics.add.sprite(4500, 374, 'snake').setScale(0.85).setDepth(9);
    this.snake.body.setAllowGravity(false);
    this._snakeHP      = 3;
    this._bossActive   = false;
    this._snakeDangerShown = false;

    this._snakeHPText = this.add.text(W / 2, H - 32, '🐍 Boss HP: ❤️❤️❤️', {
      fontSize: '13px', fontFamily: 'Georgia, serif',
      color: '#ee4422', stroke: '#0a0502', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(35).setVisible(false);

    this._barkTxt = this.add.text(W - 20, 38, '🐕 Barks: 0/3', {
      fontSize: '14px', fontFamily: 'Georgia, serif',
      color: '#f5e0b0', stroke: '#1a0802', strokeThickness: 2
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(35).setVisible(false);
    this._barkCount = 0;

    // ── Gemma cage (Zone 3 far end) ────────────────────────────────────────
    this.gemmaGoal = this.add.image(4880, 382, 'gemma_idle').setDisplaySize(90, 50).setDepth(9);
    this.tweens.add({ targets: this.gemmaGoal, x: '+=3', duration: 90, yoyo: true, repeat: -1 });
    this._drawCage(4880, 385);

    // ── Bark handler ───────────────────────────────────────────────────────
    this.onBark = () => {
      // Scare Zone 2 patrol snake
      if (this._patrolSnake.visible && !this._patrolScared && !this._bossActive) {
        const pd = Phaser.Math.Distance.Between(
          this.shadow.x, this.shadow.y, this._patrolSnake.x, this._patrolSnake.y
        );
        if (pd < 260) { this._scarePatrol(); return; }
      }
      // Damage Zone 3 boss
      if (!this._bossActive || this._snakeHP <= 0) return;
      const dist = Phaser.Math.Distance.Between(
        this.shadow.x, this.shadow.y, this.snake.x, this.snake.y
      );
      if (dist < 260) {
        this._snakeHP--;
        this._barkCount++;
        this._barkTxt.setText(`🐕 Barks: ${this._barkCount}/3`);
        this._updateBossHP();
        this.snake.setTint(0xff6666);
        this.tweens.add({ targets: this.snake, x: this.snake.x + 60, duration: 300, yoyo: true });
        this.time.delayedCall(600, () => this.snake.clearTint());
        this.cameras.main.shake(250, 0.01);
        if (this._snakeHP <= 0) this._defeatSnake();
      } else {
        this._showMessage('Get closer to the snake and bark! 🐕');
      }
    };

    this.physics.add.collider(this.snake, this.groundGroup);

    this.time.delayedCall(1200, () =>
      this._showMessage('Jump over the rocks! Reach the lever to cross! 🐾')
    );
  }

  // ── Zone progress bar (replaces default bar) ─────────────────────────────
  _initZoneProgressBar() {
    const WORLD_W = this.lvlConfig.worldWidth || 5100;
    const LEFT = 88, RIGHT = W - 88, BAR_W = RIGHT - LEFT;
    const TY = H - 10;   // track y

    // Hide the default progress fill drawn by _buildHUD
    if (this._progressBar) this._progressBar.setAlpha(0);

    // Opaque background strip covering the old bar (same depth = renders after = on top)
    this.add.rectangle(W / 2, TY, W - 172, 10, 0x120904, 1)
      .setScrollFactor(0).setDepth(30);

    // Track line
    this.add.rectangle(LEFT + BAR_W / 2, TY, BAR_W, 3, 0x3a2810, 1)
      .setScrollFactor(0).setDepth(31);

    // Filled progress (updates in update)
    this._zpFill = this.add.rectangle(LEFT, TY, 2, 3, 0x44cc44, 1)
      .setScrollFactor(0).setDepth(32).setOrigin(0, 0.5);

    // Zone checkpoint flags: [worldX, label, hex color]
    const zones = [
      { wx: 0,       label: 'Z1', color: 0x44cc44 },
      { wx: 2000,    label: 'Z2', color: 0xf5c840 },
      { wx: 3800,    label: 'Z3', color: 0xee5522 },
      { wx: WORLD_W, label: '🏁', color: 0xffffff },
    ];

    zones.forEach(z => {
      const bx = LEFT + (z.wx / WORLD_W) * BAR_W;
      const fg = this.add.graphics().setScrollFactor(0).setDepth(33);
      fg.fillStyle(z.color, 1);
      fg.fillRect(bx - 1, TY - 18, 2, 16);            // flag pole
      fg.fillTriangle(bx + 1, TY - 18, bx + 1, TY - 10, bx + 10, TY - 14);  // flag
      this.add.text(bx, TY - 28, z.label, {
        fontSize: '8px', fontFamily: 'Georgia, serif', color: '#e8d0a8'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(34);
    });

    // Running shadow icon that slides along the track
    this._zpRunner = this.add.text(LEFT, TY - 7, '🐾', { fontSize: '12px' })
      .setScrollFactor(0).setDepth(34).setOrigin(0.5, 1);

    this._zpLeft   = LEFT;
    this._zpWidth  = BAR_W;
    this._zpWorldW = WORLD_W;
  }

  // ── Lever: draws lever graphic + triggers puzzle on overlap ──────────────
  _spawnLever(x, onPull) {
    // Grass visual top is at y≈404 (H-46). Anchor the lever here so the
    // rotated base block stays fully above the grass texture.
    const baseY = H - 56;   // y=394 — lever anchor sits above grass surface

    // Graphics object anchored at lever base — rotates around base
    const leverG = this.add.graphics().setDepth(12);
    leverG.x = x;
    leverG.y = baseY;
    const drawLever = (pulled) => {
      leverG.clear();
      // Base block
      leverG.fillStyle(0x3a1a06, 1);
      leverG.fillRect(-14, -8, 28, 12);
      // Pole
      leverG.fillStyle(pulled ? 0x5a8820 : 0x7a4a15, 1);
      leverG.fillRect(-4, -50, 8, 46);
      // Round handle
      leverG.fillStyle(pulled ? 0x88cc30 : 0xd4a030, 1);
      leverG.fillCircle(0, -50, 9);
    };
    drawLever(false);
    leverG.angle = -20;   // tilted: "ready to pull"

    // Label (above the handle)
    const label = this.add.text(x, baseY - 72, '⚙ LEVER', {
      fontSize: '11px', fontFamily: 'Georgia, serif', color: '#f5c87a'
    }).setOrigin(0.5).setDepth(12);

    // Proximity hint
    const hint = this.add.text(x, baseY - 88, '▼ Walk here!', {
      fontSize: '10px', fontFamily: 'Georgia, serif', color: '#aaeebb'
    }).setOrigin(0.5).setDepth(12).setAlpha(0);

    // Pulse glow
    const glow = this.add.circle(x, baseY - 30, 26, 0xf5c87a, 0.12).setDepth(11);
    this.tweens.add({ targets: glow, alpha: 0.05, scaleX: 1.3, scaleY: 1.3, duration: 750, yoyo: true, repeat: -1 });

    // Invisible physics trigger zone (centered on shadow's typical height)
    const zone = this.physics.add.image(x, H - 58, '__DEFAULT')
      .setAlpha(0).setDisplaySize(70, 70);
    zone.body.setAllowGravity(false);

    let pulled = false;
    this.physics.add.overlap(this.shadow, zone, () => {
      if (pulled) return;
      pulled = true;
      zone.destroy();
      hint.destroy();
      this.tweens.killTweensOf(glow);

      // Lever pull animation
      this.tweens.add({
        targets: leverG, angle: 70, duration: 480, ease: 'Back.easeIn',
        onComplete: () => {
          drawLever(true);
          leverG.angle = 70;
          label.setText('⚙ PULLED!').setColor('#aaffaa');
          glow.setFillStyle(0x44ff88, 0.22);
          this.tweens.add({ targets: glow, alpha: 0.08, duration: 600, yoyo: true, repeat: -1 });
          this.cameras.main.shake(280, 0.01);
          this._showMessage('⚙ Lever pulled! Solve the puzzle to build the bridge!');
          this.time.delayedCall(900, () => onPull());
        }
      });
    });

    // Show hint when near
    let hintEvt;
    hintEvt = this.time.addEvent({
      delay: 200, loop: true, callback: () => {
        if (pulled || !this.shadow) { hintEvt.remove(); return; }
        const d = Phaser.Math.Distance.Between(this.shadow.x, this.shadow.y, x, baseY - 24);
        hint.setAlpha(d < 190 ? Math.min(1, (190 - d) / 70) : 0);
      }
    });
  }

  // ── Bridge: fills hole with rising platform tiles ──────────────────────
  _buildBridge(gapX, gapW) {
    this.cameras.main.shake(180, 0.007);
    const tileW = 32;
    const count = Math.ceil(gapW / tileW);

    for (let i = 0; i < count; i++) {
      const tx = gapX + i * tileW + tileW / 2;

      // Add physics ground tile (invisible, solid)
      const tile = this.groundGroup.create(tx, H - 16, 'ground');
      tile.setDisplaySize(tileW, 32).setAlpha(0).refreshBody();

      // Visible plank rising from below
      const vis = this.add.image(tx, H + 60, 'platform')
        .setDisplaySize(tileW, 18).setDepth(6);
      this.tweens.add({
        targets: vis, y: H - 11,
        duration: 550, delay: i * 35, ease: 'Back.easeOut'
      });
    }

    // Sparkle sweep across the new bridge
    for (let i = 0; i < 9; i++) {
      this.time.delayedCall(i * 70 + 350, () => {
        const sp = this.add.image(gapX + (i / 8) * gapW, H - 28, 'sparkle').setDepth(20);
        this.tweens.add({ targets: sp, y: sp.y - 38, alpha: 0, scale: 1.4, duration: 550, onComplete: () => sp.destroy() });
      });
    }
  }

  // ── Patrol snake (Zone 2) ─────────────────────────────────────────────
  _scarePatrol() {
    this._patrolScared = true;
    this._patrolSnake.setTint(0xff9999);
    const dir = this._patrolSnake.x > this.shadow.x ? 1 : -1;
    this.tweens.add({ targets: this._patrolSnake, x: this._patrolSnake.x + dir * 160, duration: 600, ease: 'Power2' });
    this._showMessage('🐍 The snake is scared! Keep going!');
    this.time.delayedCall(3200, () => {
      this._patrolScared = false;
      this._patrolSnake.clearTint();
    });
  }

  // ── Boss snake (Zone 3) ───────────────────────────────────────────────
  _updateBossHP() {
    const h = ['❤️', '❤️', '❤️'].map((v, i) => i < this._snakeHP ? v : '🖤').join('');
    this._snakeHPText.setText(`🐍 Boss HP: ${h}`);
  }

  _defeatSnake() {
    this._snakeHPText.setText('🐍 The snake flees!');
    this.tweens.add({ targets: this.snake, x: this.snake.x + 500, alpha: 0, duration: 1300, ease: 'Power2' });
    this.cameras.main.shake(450, 0.016);
    for (let i = 0; i < 18; i++) {
      const sp = this.add.image(
        this.snake.x + (Math.random() - 0.5) * 120,
        this.snake.y + (Math.random() - 0.5) * 50, 'sparkle'
      ).setDepth(60);
      this.tweens.add({ targets: sp, x: sp.x + (Math.random() - 0.5) * 160, y: sp.y - 70, alpha: 0, scale: 2, duration: 950, onComplete: () => sp.destroy() });
    }
    this.time.delayedCall(1400, () => this._unlockCage());
  }

  _unlockCage() {
    if (this._levelDone) return;
    this._levelDone = true;
    this._showMessage('🐾 Snake defeated! Gemma is FREE! 💛');

    if (this._cageGraphics) {
      this.tweens.killTweensOf(this._cageGraphics);
      this.cameras.main.shake(350, 0.015);
      for (let i = 0; i < 14; i++) {
        this.time.delayedCall(i * 60, () => {
          const sp = this.add.image(4880 + (Math.random() - 0.5) * 110, 385 + (Math.random() - 0.5) * 60, 'sparkle').setDepth(62);
          this.tweens.add({ targets: sp, y: sp.y - 50, alpha: 0, scale: 2, duration: 700, onComplete: () => sp.destroy() });
        });
      }
      this.tweens.add({
        targets: this._cageGraphics, alpha: 0, duration: 600,
        onComplete: () => { if (this._cageGraphics) { this._cageGraphics.destroy(); this._cageGraphics = null; } }
      });
    }

    this.gemmaGoal.setTexture('gemma_happy');
    this.tweens.killTweensOf(this.gemmaGoal);
    this.tweens.add({ targets: this.gemmaGoal, y: '-=12', duration: 260, yoyo: true, repeat: 4 });

    for (let i = 0; i < 8; i++) {
      this.time.delayedCall(i * 180, () => {
        const hrt = this.add.image(4880 + (Math.random() - 0.5) * 60, 310, 'heart').setDepth(60);
        this.tweens.add({ targets: hrt, y: hrt.y - 65, alpha: 0, duration: 950, onComplete: () => hrt.destroy() });
      });
    }

    this.time.delayedCall(2400, () => {
      this._completeLevel('Level2', "GEMMA IS FREE! 🐾💛\nNow let's find her some food!");
    });
  }

  _drawCage(cx, cy) {
    const cw = 105, ch = 72;
    const g = this.add.graphics().setDepth(11);
    g.lineStyle(5, 0x4a2e0c, 1);
    for (let bx = cx - cw / 2; bx <= cx + cw / 2 + 1; bx += 18)
      g.lineBetween(bx, cy - ch / 2, bx, cy + ch / 2);
    g.lineStyle(6, 0x2e1a06, 1);
    g.lineBetween(cx - cw / 2, cy - ch / 2, cx + cw / 2, cy - ch / 2);
    g.lineBetween(cx - cw / 2, cy + ch / 2, cx + cw / 2, cy + ch / 2);
    g.lineStyle(4, 0x3a2208, 1);
    g.lineBetween(cx - cw / 2, cy, cx + cw / 2, cy);
    g.fillStyle(0xd4a030, 1);
    g.fillRect(cx - 7, cy + ch / 2 - 10, 14, 10);
    g.fillStyle(0xc89020, 1);
    g.fillCircle(cx, cy + ch / 2 - 14, 6);
    this._cageGraphics = g;
    this.tweens.add({ targets: g, x: '+=2', duration: 120, yoyo: true, repeat: -1 });
  }

  _startGauntlet() {
    this._showMessage('⚠️ Watch out! Boulders falling! 🪨');
    this.cameras.main.shake(200, 0.008);
    this._gauntletTimer = this.time.addEvent({
      delay: 1800, loop: true,
      callback: () => {
        if (this._levelDone || !this.shadow || this.shadow.x > 1650) {
          this._gauntletTimer.remove();
          return;
        }
        const spawnX = Phaser.Math.Clamp(this.shadow.x + (Math.random() - 0.45) * 220, 920, 1630);
        const b = this._boulderGroup.create(spawnX, -20, 'rock');
        b.setDisplaySize(42, 32).setDepth(15);
        b.body.setSize(42, 32, true);
        b.body.setAllowGravity(true);
        this.time.delayedCall(3200, () => { if (b && b.active) b.destroy(); });
      }
    });
  }

  update() {
    this._updateBgParallax();
    this.updateMovement();
    if (!this.shadow) return;

    const sx = this.shadow.x;

    // ── Zone progress bar update ─────────────────────────────────────────
    if (this._zpFill) {
      const pct = Math.min(sx / this._zpWorldW, 1);
      this._zpFill.width = Math.max(2, pct * this._zpWidth);
      this._zpRunner.x = this._zpLeft + pct * this._zpWidth;
      // Fill color changes per zone
      const fillColor = sx < 2000 ? 0x44cc44 : sx < 3800 ? 0xf5c840 : 0xee5522;
      this._zpFill.setFillStyle(fillColor);
    }

    // ── Rain fade (Zone 1 only) ──────────────────────────────────────────
    if (this._rainData) {
      if (this._rainActive) {
        for (const r of this._rainData) {
          r.img.y += r.speed;
          if (r.img.y > 460) { r.img.y = -10; r.img.x = Math.random() * 800; }
        }
        if (sx > 1950) {
          this._rainActive = false;
          this._rainData.forEach(r => this.tweens.add({ targets: r.img, alpha: 0, duration: 1400 }));
        }
      }
    }

    // ── Rock pushing ─────────────────────────────────────────────────────
    if (this._rocks) {
      Object.values(this._rocks).forEach(rock => {
        if (!rock.getData('hurdle') && !rock.getData('pushed')) {
          if (Phaser.Math.Distance.Between(sx, this.shadow.y, rock.x, rock.y) < 42)
            this._pushRock(rock);
        }
      });
    }

    // ── Boulder gauntlet (Zone 1) ────────────────────────────────────────
    if (!this._gauntletStarted && sx > 900) {
      this._gauntletStarted = true;
      this._startGauntlet();
    }

    // ── Zone 2 entry → checkpoint ────────────────────────────────────────
    if (!this._zone2Entered && sx > 2000) {
      this._zone2Entered = true;
      this._saveCheckpoint(2020, 360);
      this._patrolSnake.setVisible(true);
      this.time.delayedCall(600, () => this._showMessage('⚠️ Zone 2! Watch for the snake! Bark to scare it! 🐍'));
    }

    // ── Zone 3 entry → checkpoint + activate boss ─────────────────────────
    if (!this._zone3Entered && sx > 3800) {
      this._zone3Entered = true;
      this._saveCheckpoint(3820, 360);
      this._patrolSnake.setVisible(false);
      this._bossActive = true;
      this._snakeHPText.setVisible(true);
      this._barkTxt.setVisible(true);
      this.time.delayedCall(300, () => this._showMessage('⚠️ Boss snake! Bark 3× to chase it away! Gemma needs you!'));
    }

    // ── Thorn hazard ─────────────────────────────────────────────────────
    if (this._thorns) {
      this._thorns.forEach(t => {
        if (sx > t.x && sx < t.x + t.w && this.shadow.y > t.y - 10 && !this._thornCooldown) {
          this._thornCooldown = true;
          this._onHazardHit();
          this.time.delayedCall(1200, () => { this._thornCooldown = false; });
        }
      });
    }

    // ── Zone 2 patrol snake AI ────────────────────────────────────────────
    if (this._patrolSnake && this._patrolSnake.visible && !this._patrolScared) {
      const pd = Math.abs(this._patrolSnake.x - sx);
      if (pd < 340) {
        const dir = sx > this._patrolSnake.x ? 1 : -1;
        this._patrolSnake.x += dir * 0.85;
        this._patrolSnake.setFlipX(dir < 0);
        if (pd < 55 && !this._patrolHitCD) {
          this._patrolHitCD = true;
          this._onHazardHit();
          this.time.delayedCall(1200, () => { this._patrolHitCD = false; });
        }
      } else {
        // Patrol back and forth
        this._patrolSnake.x += this._patrolDir * 0.55;
        this._patrolSnake.setFlipX(this._patrolDir < 0);
        if (this._patrolSnake.x >= this._patrolMax) this._patrolDir = -1;
        if (this._patrolSnake.x <= this._patrolMin) this._patrolDir = 1;
      }
    }

    // ── Zone 3 boss snake chase ───────────────────────────────────────────
    if (this._bossActive && this._snakeHP > 0 && !this._levelDone) {
      const bd = Math.abs(this.snake.x - sx);
      if (bd < 700) {
        const dir = sx > this.snake.x ? 1 : -1;
        this.snake.x += dir * 0.85;
        this.snake.setFlipX(dir < 0);
        if (bd < 55) this._onHazardHit();
        if (bd < 130 && !this._snakeDangerShown) {
          this._snakeDangerShown = true;
          this._showMessage('⚠️ BARK! (B key or 🐕 button)');
        }
      }
      // Reset danger hint when snake backs off
      if (bd > 200) this._snakeDangerShown = false;
    }

    // ── Collapsing logs ───────────────────────────────────────────────────
    if (this._collapsing) {
      this._collapsing.forEach(cp => {
        if (cp.triggered) return;
        if (Math.abs(sx - cp.x) < 65) {
          cp.triggered = true;
          if (cp.warn && cp.warn.active) {
            this.tweens.killTweensOf(cp.warn);
            cp.warn.setFillStyle(0xff1100, 1);
          }
          this._showMessage('⚠️ Log collapsing! JUMP!');
          this.time.delayedCall(650, () => {
            const toFall = this.platGroup.getChildren().filter(p => Math.abs(p.x - cp.x) < 55);
            toFall.forEach(p => {
              const { x, y, displayWidth: dw, displayHeight: dh } = p;
              const key = p.texture.key;
              p.destroy();
              const vis = this.add.image(x, y, key).setDisplaySize(dw, dh).setDepth(8);
              this.tweens.add({ targets: vis, y: y + 160, alpha: 0, angle: (Math.random() - 0.5) * 25, duration: 750, ease: 'Power1', onComplete: () => vis.destroy() });
            });
            if (cp.warn && cp.warn.active) cp.warn.destroy();
            this.cameras.main.shake(200, 0.01);
          });
        }
      });
    }
  }
}
