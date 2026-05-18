import Phaser from 'phaser';
import { W, H } from '../../config/GameConfig.js';

export class BaseLevelScene extends Phaser.Scene {

  initLevel(config) {
    this.lvlConfig = config;
    this.cameras.main.setBackgroundColor('#0d0806');
    this.cameras.main.fadeIn(600, 0, 0, 0);

    this.physics.world.setBounds(0, 0, config.worldWidth || 2000, H);
    this.cameras.main.setBounds(0, 0, config.worldWidth || 2000, H);

    this._buildBackground(config.worldWidth || 2000);

    this.groundGroup = this.physics.add.staticGroup();
    this._buildGround(config);

    this.platGroup = this.physics.add.staticGroup();
    if (config.platforms) {
      config.platforms.forEach(p => {
        const pl = this.platGroup.create(p.x, p.y, p.key || 'platform');
        if (p.key === 'log') {
          // log.png is 1118×223 — use config w, derive height from real ratio
          const lw = p.w || 90;
          const lh = p.h || Math.round(lw * 223 / 1118);
          pl.setDisplaySize(lw, lh).refreshBody();
        } else {
          // platform.png is 1003×249 — ratio ~4:1, matches config defaults closely
          pl.setDisplaySize(p.w || 80, p.h || 20).refreshBody();
        }
      });
    }

    this.rockGroup = this.physics.add.group({ allowGravity: false });
    this._rocks = {};
    if (config.rocks) {
      config.rocks.forEach((r, i) => {
        const rock = this.rockGroup.create(r.x, r.y, 'rock');
        // rock.png is 569×438 — display at 60×46 (ratio 1.30:1 matches image)
        rock.setDisplaySize(60, 46);
        rock.body.setSize(60, 46, true);
        rock.setCollideWorldBounds(true);
        rock.setImmovable(r.immovable !== false);
        rock.setData('id', i);
        if (!r.immovable) rock.body.setAllowGravity(false);
        this._rocks[i] = rock;
      });
    }

    this.shadow = this.physics.add.sprite(config.startX || 80, config.startY || 390, 'shadow_idle');

    // Images are 677×369 px after background removal — scale to ~122×66px display
    this.shadow.setScale(0.18);

    // Body: 60% of image width × 85% of height, CENTERED on sprite.
    // Works regardless of exact image dimensions.
    const tw = this.shadow.texture.source[0].width;
    const th = this.shadow.texture.source[0].height;
    this.shadow.body.setSize(tw * 0.60, th * 0.85, true);

    this.shadow.setCollideWorldBounds(true);
    this.shadow.setDepth(10);
    this._onGround = false;

    if (!this.anims.exists('shadow_walk')) {
      this.anims.create({ key: 'shadow_walk',      frames: [{ key: 'shadow_run1' }, { key: 'shadow_run2' }], frameRate: 6, repeat: -1 });
      this.anims.create({ key: 'shadow_idle_anim', frames: [{ key: 'shadow_idle' }],                         frameRate: 1, repeat: -1 });
      this.anims.create({ key: 'shadow_jump_anim', frames: [{ key: 'shadow_jump' }],                         frameRate: 1, repeat: -1 });
    }

    this.cameras.main.startFollow(this.shadow, true, 0.08, 0.08);

    this.physics.add.collider(this.shadow, this.groundGroup);
    this.physics.add.collider(this.shadow, this.platGroup);
    this.physics.add.collider(this.shadow, this.rockGroup);
    this.physics.add.collider(this.rockGroup, this.groundGroup);
    this.physics.add.collider(this.rockGroup, this.platGroup);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      bark:  Phaser.Input.Keyboard.KeyCodes.B
    });

    this._buildTouchControls();
    this._buildHUD(config);

    this.time.addEvent({ delay: 600, callback: this._spawnLeaf, callbackScope: this, loop: true });

    // atmospheric mist overlay (fixed to camera)
    this._fogLayer = this.add.tileSprite(400, 400, 800, 80, 'fog')
      .setScrollFactor(0).setAlpha(0.55).setDepth(18);
    // dark bottom vignette so ground reads clearly
    const vignette = this.add.rectangle(400, 430, 800, 40, 0x000000, 0.45)
      .setScrollFactor(0).setDepth(19);

    this.time.delayedCall(500, () => this._showObjective(config.objective));
  }

  _buildBackground(worldW) {
    // ── solid fallback so nothing is ever black/grid if image is missing ──
    this.add.rectangle(400, 225, 800, 450, 0x0a1a0a).setScrollFactor(0).setDepth(-15);

    // ── 3-layer parallax (only if jungle_bg image loaded successfully) ────
    const hasJungle = this.textures.exists('jungle_bg');

    if (hasJungle) {
      // Far layer — very slow, darkened for atmospheric depth
      this._bgFar = this.add.tileSprite(400, 225, 800, 450, 'jungle_bg')
        .setScrollFactor(0).setAlpha(0.5).setTint(0x0d1a0d).setDepth(-12);

      // Mid layer — medium speed, slightly darkened
      this._bgMid = this.add.tileSprite(400, 225, 800, 450, 'jungle_bg')
        .setScrollFactor(0).setAlpha(0.68).setTint(0x1a2e1a).setDepth(-9);

      // Near layer — fastest, full colour
      this._bgNear = this.add.tileSprite(400, 225, 800, 450, 'jungle_bg')
        .setScrollFactor(0).setAlpha(0.85).setDepth(-6);

    } else {
      // ── procedural jungle fallback (used until real image is added) ────
      // dark gradient sky
      const grad = this.add.graphics().setScrollFactor(0).setDepth(-12);
      for (let y = 0; y < 450; y++) {
        const t = y / 450;
        const r = Math.floor(8  + t * 4);
        const g = Math.floor(18 + t * 14);
        const b = Math.floor(8  + t * 4);
        grad.fillStyle(Phaser.Display.Color.GetColor(r, g, b), 1);
        grad.fillRect(0, y, 800, 1);
      }
      // silhouette tree columns at several depths
      const treePalette = [0x061006, 0x0a180a, 0x0e200e, 0x122812];
      for (let layer = 0; layer < 4; layer++) {
        const sf = 0.1 + layer * 0.15;
        const col = treePalette[layer];
        const count = Math.ceil(worldW / 60) + 2;
        for (let i = 0; i < count; i++) {
          const bx = i * 60 + (layer * 17) % 60;
          const bh = 180 + ((i * 37 + layer * 23) % 120);
          const bw = 22 + ((i * 13 + layer * 7) % 20);
          const img = this.add.graphics();
          img.fillStyle(col, 1);
          img.fillRect(bx, 450 - bh, bw, bh);   // trunk column
          img.fillEllipse(bx + bw / 2, 450 - bh, bw * 2.8, bh * 0.55); // canopy blob
          img.setScrollFactor(sf).setDepth(-12 + layer);
        }
      }
    }

    // Top dark gradient so sky area doesn't bleed into action zone
    const topFade = this.add.rectangle(400, 30, 800, 80, 0x000000, 0.55)
      .setScrollFactor(0).setDepth(-5);

    // Atmospheric light rays (subtle vertical slices brightening the mid-scene)
    for (let i = 0; i < 5; i++) {
      const ray = this.add.rectangle(
        120 + i * 140, 160, 18, 340,
        0x88cc44, 0.028 + Math.random() * 0.018
      ).setScrollFactor(0).setDepth(-5);
      this.tweens.add({
        targets: ray,
        alpha: { from: 0.02, to: 0.06 },
        x: `+=${6 + i * 2}`,
        duration: 3000 + i * 700,
        yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  // Call every update() — drives the parallax scroll
  _updateBgParallax() {
    const sx = this.cameras.main.scrollX;
    if (this._bgFar)  this._bgFar.tilePositionX  = sx * 0.08;
    if (this._bgMid)  this._bgMid.tilePositionX  = sx * 0.28;
    if (this._bgNear) this._bgNear.tilePositionX = sx * 0.52;
  }

  _buildGround(config) {
    const worldW = config.worldWidth || 2000;
    const gaps   = config.gaps || [];

    // Invisible physics tiles for collision (32×32 grid, top at H-32=418)
    let x = 0;
    while (x < worldW) {
      const inGap = gaps.some(g => x + 16 > g.x && x < g.x + g.w);
      if (!inGap) {
        const tile = this.groundGroup.create(x + 16, H - 16, 'ground');
        tile.setDisplaySize(32, 32).setAlpha(0).refreshBody();
      }
      x += 32;
    }

    // Visual TileSprite per ground section — grass surface aligns with physics top (y=418)
    // ground.png is 500×500; tileScale 0.14 → each tile renders 70×70px.
    // Grass occupies top 20% of image = 14px. TileSprite center at H-11=439, top at 404.
    // Grass surface = 404 + 14 = 418 = physics surface. ✓
    this._groundSections(worldW, gaps).forEach(sec => {
      this.add.tileSprite(sec.start + sec.width / 2, H - 11, sec.width, 70, 'ground')
        .setTileScale(0.14, 0.14)
        .setDepth(5);
    });
  }

  _groundSections(worldW, gaps) {
    const sections = [];
    let start = 0;
    const sorted = [...gaps].sort((a, b) => a.x - b.x);
    for (const gap of sorted) {
      if (gap.x > start) sections.push({ start, width: gap.x - start });
      start = gap.x + gap.w;
    }
    if (start < worldW) sections.push({ start, width: worldW - start });
    return sections;
  }

  _buildHUD(config) {
    this._hudChapter = this.add.text(W / 2, 22, config.chapterName || '', {
      fontSize: '16px', fontFamily: 'Georgia, serif',
      color: '#f5c87a', stroke: '#1a0802', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(30);

    this._hearts = [];
    for (let i = 0; i < 3; i++) {
      this._hearts.push(
        this.add.image(20 + i * 26, 22, 'heart').setScale(0.8).setScrollFactor(0).setDepth(30)
      );
    }

    this.add.rectangle(W / 2, H - 12, 200, 8, 0x2a1a0a, 0.8).setScrollFactor(0).setDepth(30);
    this._progressBar = this.add.rectangle(W / 2 - 100, H - 12, 0, 8, 0xf5c87a, 1)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(31);
    this._progressMax = config.worldWidth || 2000;
  }

  _showObjective(text) {
    const bg = this.add.rectangle(W / 2, H / 2, 500, 100, 0x1a0d06, 0.9)
      .setScrollFactor(0).setDepth(50).setStrokeStyle(2, 0xf5c87a, 0.7);
    const title = this.add.text(W / 2, H / 2 - 18, '🐾 Mission', {
      fontSize: '13px', fontFamily: 'Georgia, serif', color: '#c9956b'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);
    const txt = this.add.text(W / 2, H / 2 + 10, text, {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#f5e0b0',
      stroke: '#0a0502', strokeThickness: 2, align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);
    this.tweens.add({
      targets: [bg, title, txt], alpha: 0, delay: 2800, duration: 600,
      onComplete: () => { bg.destroy(); title.destroy(); txt.destroy(); }
    });
  }

  _buildTouchControls() {
    const touchY   = H - 45;
    const btnStyle = { fontSize: '22px', color: '#f5e0b0', backgroundColor: 'rgba(40,20,5,0.7)', padding: { x: 14, y: 8 } };

    this._touchLeft  = this.add.text(30,      touchY, '◀', btnStyle).setScrollFactor(0).setDepth(40).setInteractive();
    this._touchRight = this.add.text(90,      touchY, '▶', btnStyle).setScrollFactor(0).setDepth(40).setInteractive();
    this._touchJump  = this.add.text(W - 80,  touchY, '🦘', btnStyle).setScrollFactor(0).setDepth(40).setInteractive();
    this._touchBark  = this.add.text(W - 150, touchY, '🐕', btnStyle).setScrollFactor(0).setDepth(40).setInteractive();

    this._touchState = { left: false, right: false, jump: false };

    this._touchLeft.on('pointerdown', () => this._touchState.left = true)
                   .on('pointerup',   () => this._touchState.left = false)
                   .on('pointerout',  () => this._touchState.left = false);
    this._touchRight.on('pointerdown', () => this._touchState.right = true)
                    .on('pointerup',   () => this._touchState.right = false)
                    .on('pointerout',  () => this._touchState.right = false);
    this._touchJump.on('pointerdown', () => { this._touchState.jump = true; })
                   .on('pointerup',   () => this._touchState.jump = false);
    this._touchBark.on('pointerdown', () => { this._doBark(); });

    this.input.addPointer(3);
  }

  _spawnLeaf() {
    const leaf = this.add.image(this.cameras.main.scrollX + Math.random() * 820, -10, 'leaf');
    leaf.setAlpha(0.5 + Math.random() * 0.3).setDepth(15);
    this.tweens.add({
      targets: leaf,
      y: H + 20, x: `+=${(Math.random() - 0.5) * 120}`,
      rotation: `+=${Math.PI * (Math.random() > 0.5 ? 3 : -3)}`,
      alpha: 0,
      duration: 3500 + Math.random() * 2500,
      onComplete: () => leaf.destroy()
    });
  }

  _doBark() {
    const bx   = this.shadow.x + (this.shadow.flipX ? -60 : 60);
    const bark = this.add.text(bx, this.shadow.y - 40, 'WOOF!', {
      fontSize: '18px', fontFamily: 'Georgia, serif',
      color: '#f5c87a', stroke: '#2a1008', strokeThickness: 3
    }).setDepth(20);
    this.tweens.add({ targets: bark, y: bark.y - 30, alpha: 0, duration: 800, onComplete: () => bark.destroy() });

    for (let i = 0; i < 3; i++) {
      const circle = this.add.circle(bx, this.shadow.y - 20, 10 + i * 12, 0xf5c87a, 0.3 - i * 0.08).setDepth(19);
      this.tweens.add({ targets: circle, scaleX: 2, scaleY: 2, alpha: 0, duration: 500 + i * 100, onComplete: () => circle.destroy() });
    }
    if (this.onBark) this.onBark();
  }

  updateMovement() {
    const s    = this.shadow;
    const body = s.body;
    const onG  = body.blocked.down;
    this._onGround = onG;

    const left  = this.cursors.left.isDown  || this.wasd.left.isDown  || (this._touchState && this._touchState.left);
    const right = this.cursors.right.isDown || this.wasd.right.isDown || (this._touchState && this._touchState.right);
    const jump  = Phaser.Input.Keyboard.JustDown(this.cursors.up)    ||
                  Phaser.Input.Keyboard.JustDown(this.wasd.up)        ||
                  Phaser.Input.Keyboard.JustDown(this.wasd.space)     ||
                  (this._touchState && this._touchState.jump && onG);
    const bark  = Phaser.Input.Keyboard.JustDown(this.wasd.bark);

    const speed = 200;

    if (left) {
      s.setVelocityX(-speed);
      s.setFlipX(true);
      if (onG) s.play('shadow_walk', true);
      this._spawnDust(s.x + 10, s.y + 20);
    } else if (right) {
      s.setVelocityX(speed);
      s.setFlipX(false);
      if (onG) s.play('shadow_walk', true);
      this._spawnDust(s.x - 10, s.y + 20);
    } else {
      s.setVelocityX(0);
      if (onG) s.play('shadow_idle_anim', true);
    }

    if (jump && onG) {
      s.setVelocityY(-430);
      s.play('shadow_jump_anim', true);
      this._spawnDust(s.x, s.y + 20, true);
    }
    if (!onG) s.play('shadow_jump_anim', true);

    if (bark) this._doBark();

    if (this._touchState && this._touchState.jump) this._touchState.jump = false;

    if (this._progressBar && this._progressMax) {
      const pct = Math.min(s.x / this._progressMax, 1);
      this._progressBar.width = 200 * pct;
    }
  }

  _spawnDust(x, y, big = false) {
    if (Math.random() > 0.3) return;
    const d = this.add.image(x, y, 'dust').setDepth(8);
    this.tweens.add({
      targets: d,
      y: y - (big ? 20 : 10),
      x: `+=${(Math.random() - 0.5) * 20}`,
      alpha: 0, scale: big ? 2 : 1,
      duration: 400 + Math.random() * 200,
      onComplete: () => d.destroy()
    });
  }

  _pushRock(rock) {
    const dx    = rock.x - this.shadow.x;
    const pushX = dx > 0 ? 80 : -80;
    if (!rock.getData('pushed')) {
      rock.setData('pushed', true);
      rock.setImmovable(false);
      rock.body.setAllowGravity(true);
      this.tweens.add({ targets: rock, x: rock.x + pushX, duration: 600, ease: 'Power2' });
      const arrow = this.add.text(rock.x + pushX / 2, rock.y - 30, dx > 0 ? '→ PUSH! →' : '← PUSH! ←', {
        fontSize: '14px', fontFamily: 'Georgia, serif', color: '#f5c87a'
      }).setDepth(25);
      this.tweens.add({ targets: arrow, y: arrow.y - 20, alpha: 0, duration: 700, onComplete: () => arrow.destroy() });
    }
  }

  _showMessage(text, duration = 2000) {
    const bg = this.add.rectangle(W / 2, 80, 500, 50, 0x1a0d06, 0.88)
      .setScrollFactor(0).setDepth(50).setStrokeStyle(2, 0xf5c87a, 0.6);
    const txt = this.add.text(W / 2, 80, text, {
      fontSize: '15px', fontFamily: 'Georgia, serif', color: '#e8d0a8', align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);
    this.tweens.add({
      targets: [bg, txt], alpha: 0, delay: duration, duration: 500,
      onComplete: () => { bg.destroy(); txt.destroy(); }
    });
  }

  _completeLevel(nextScene, message = 'Level Complete!') {
    this.physics.pause();
    this.cameras.main.shake(300, 0.01);

    for (let i = 0; i < 12; i++) {
      const sp = this.add.image(
        this.shadow.x + (Math.random() - 0.5) * 80,
        this.shadow.y + (Math.random() - 0.5) * 80,
        'sparkle'
      ).setDepth(60);
      this.tweens.add({
        targets: sp,
        x: sp.x + (Math.random() - 0.5) * 100,
        y: sp.y - 50 - Math.random() * 50,
        alpha: 0, scale: 1.5, duration: 800,
        onComplete: () => sp.destroy()
      });
    }

    const bg = this.add.rectangle(W / 2, H / 2, 500, 140, 0x1a0d06, 0.95)
      .setScrollFactor(0).setDepth(70).setStrokeStyle(2, 0xf5c87a, 0.8);
    this.add.text(W / 2, H / 2 - 28, '🐾 ' + message, {
      fontSize: '22px', fontFamily: 'Georgia, serif',
      color: '#f5c87a', stroke: '#1a0802', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(71);

    const cont = this.add.text(W / 2, H / 2 + 28, '[ Continue the Journey ]', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#e8d0a8'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(71).setInteractive({ useHandCursor: true });
    cont.on('pointerup', () => {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.time.delayedCall(650, () => this.scene.start(nextScene));
    });
    this.tweens.add({ targets: cont, alpha: { from: 0.4, to: 1 }, duration: 800, yoyo: true, repeat: -1 });
  }
}
