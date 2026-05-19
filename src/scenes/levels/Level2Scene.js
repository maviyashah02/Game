import Phaser from 'phaser';
import { W, H } from '../../config/GameConfig.js';
import { BaseLevelScene } from './BaseLevelScene.js';

// Chapter 2 — Collect fruit and feed Gemma
export class Level2Scene extends BaseLevelScene {
  constructor() { super('Level2'); }

  create() {
    const config = {
      worldWidth: 2400,
      startX: 80, startY: 360,
      timer: 90,
      chapterName: 'Chapter 2 — Find Food for Gemma!',
      objective: 'Collect 5 berries and bring them to Gemma!\nSolve the puzzles on the way!',
      platforms: [
        { x: 200,  y: 370 }, { x: 350,  y: 340 },
        { x: 510,  y: 370 }, { x: 650,  y: 320 },
        { x: 820,  y: 370 }, { x: 980,  y: 300, key: 'log' },
        { x: 1200, y: 350 }, { x: 1400, y: 310 },
        { x: 1600, y: 360 }, { x: 1800, y: 320, key: 'log' },
        { x: 2000, y: 350 }, { x: 2200, y: 370 },
        // Stepping stones across the river
        { x: 700,  y: 390, w: 50, h: 14 },
        { x: 780,  y: 390, w: 50, h: 14 },
        { x: 860,  y: 390, w: 50, h: 14 },
      ],
      rocks: [
        { x: 450,  y: 395 },
        { x: 1100, y: 395 },
        { x: 1700, y: 395 },
      ],
      gaps: [
        { x: 640, w: 260 },   // river gap
      ]
    };

    this.initLevel(config);

    // ── Berries scattered across the world ────────────────────────────────
    const berryPositions = [
      { x: 360,  y: 320 }, { x: 650,  y: 295 }, { x: 1000, y: 270 },
      { x: 1400, y: 280 }, { x: 2000, y: 320 }, { x: 2200, y: 345 }, { x: 1800, y: 290 }
    ];

    this._berries = [];
    berryPositions.forEach((bp, i) => {
      const berry = this.physics.add.staticImage(bp.x, bp.y, 'berry').setScale(1.5).setDepth(8);
      berry.setData('id', i);
      this._berries.push(berry);
      this.tweens.add({ targets: berry, y: bp.y - 6, duration: 800 + i * 120, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });

    this._berryCount  = 0;
    this._berryNeeded = 5;
    this._berryTxt = this.add.text(W - 20, 18, '🍓 0 / 5', {
      fontSize: '16px', fontFamily: 'Georgia, serif',
      color: '#f5e0b0', stroke: '#1a0802', strokeThickness: 2
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(35);

    // ── Gemma waits at start (already rescued) ────────────────────────────
    this.gemmaGoal = this.physics.add.staticImage(160, 388, 'gemma_idle')
      .setDisplaySize(120, 65).setDepth(8).refreshBody();
    this.tweens.add({ targets: this.gemmaGoal, y: '+=6', duration: 700, yoyo: true, repeat: -1 });

    // ── River water animation ─────────────────────────────────────────────
    for (let x = 640; x < 900; x += 20) {
      const w = this.add.rectangle(x, H - 12, 22, 22, 0x2a6aaa, 0.7).setDepth(3);
      this.tweens.add({ targets: w, alpha: 0.4 + Math.random() * 0.3, duration: 500 + Math.random() * 500, yoyo: true, repeat: -1 });
    }

    // ── Thorn hazards ─────────────────────────────────────────────────────
    this._thorns = [];
    [500, 1300, 1900].forEach(tx => {
      this.add.text(tx, 378, '🌵', { fontSize: '24px' }).setDepth(9);
      this._thorns.push({ x: tx - 12, y: 370, w: 30, h: 30 });
    });

    // ── Activity flags (each fires only once) ─────────────────────────────
    this._act2Done = false; // at berry 2 → Size Compare
    this._act4Done = false; // at berry 4 → Pattern
    this._act5Done = false; // at berry 5 → Odd One Out (before completing)

    // ── Berry collection overlaps ──────────────────────────────────────────
    this._berries.forEach(berry => {
      this.physics.add.overlap(this.shadow, berry, () => {
        if (!berry.getData('collected')) {
          berry.setData('collected', true);
          berry.destroy();
          this._berryCount++;

          const display = Math.min(this._berryCount, this._berryNeeded);
          this._berryTxt.setText(`🍓 ${display} / 5`);

          const sp = this.add.image(berry.x, berry.y, 'sparkle').setDepth(20);
          this.tweens.add({ targets: sp, scale: 2, alpha: 0, duration: 400, onComplete: () => sp.destroy() });

          if (this._berryCount <= this._berryNeeded) {
            this._showMessage(`Berry collected! ${display}/5 🍓`);
          }

          // Activity at berry 2
          if (this._berryCount === 2 && !this._act2Done) {
            this._act2Done = true;
            this.time.delayedCall(1200, () => {
              this._puzzleSizeCompare(() => {
                this._showMessage('Great! Keep collecting! 🍓');
              });
            });
          }

          // Activity at berry 4
          if (this._berryCount === 4 && !this._act4Done) {
            this._act4Done = true;
            this.time.delayedCall(1200, () => {
              this._puzzlePattern(() => {
                this._showMessage('Almost there! One more berry! 🍓');
              });
            });
          }

          // Activity at berry 5 (final) — puzzle before completing
          if (this._berryCount === 5 && !this._act5Done) {
            this._act5Done = true;
            this.time.delayedCall(1200, () => {
              this._puzzleMissingLetter(() => {
                this._showMessage('Got enough berries! Return to Gemma! 🏃');
              });
            });
          }

          if (this._berryCount > this._berryNeeded) return;

          if (this._berryCount === this._berryNeeded && this._act5Done) {
            this.time.delayedCall(3000, () => this._showMessage('Got enough berries! Return to Gemma! 🏃'));
          }
        }
      });
    });

    // ── Reach Gemma with enough berries → feed her ────────────────────────
    this.physics.add.overlap(this.shadow, this.gemmaGoal, () => {
      if (!this._levelDone && this._berryCount >= this._berryNeeded) {
        this._levelDone = true;
        this._onFeedGemma();
      } else if (!this._levelDone && !this._hintedReturn) {
        this._hintedReturn = true;
        this._showMessage('Collect 5 berries first! 🍓');
      }
    });

    this.time.delayedCall(800, () => this._showMessage('Collect 5 berries and bring them to Gemma! 🍓'));
  }

  _onFeedGemma() {
    this.gemmaGoal.setTexture('gemma_happy');
    this.tweens.add({ targets: this.gemmaGoal, y: '-=15', duration: 300, yoyo: true, repeat: 2 });
    this.cameras.main.shake(300, 0.01);

    for (let i = 0; i < 6; i++) {
      this.time.delayedCall(i * 150, () => {
        const b = this.add.image(160 + (Math.random() - 0.5) * 40, 350, 'berry').setDepth(60);
        this.tweens.add({ targets: b, y: b.y - 40, x: b.x + (Math.random() - 0.5) * 30, alpha: 0, duration: 700, onComplete: () => b.destroy() });
      });
    }

    for (let i = 0; i < 10; i++) {
      this.time.delayedCall(i * 120, () => {
        const sp = this.add.image(160 + (Math.random() - 0.5) * 80, 360 + (Math.random() - 0.5) * 40, 'sparkle').setDepth(62);
        this.tweens.add({ targets: sp, y: sp.y - 50, alpha: 0, scale: 1.8, duration: 700, onComplete: () => sp.destroy() });
      });
    }

    this.time.delayedCall(1600, () => {
      this._completeLevel('EndScene', "Gemma is fed and happy! 🍓💛\nShadow is a great friend!");
    });
  }

  update() {
    this._updateBgParallax();
    this.updateMovement();

    // Thorn hazard
    if (this._thorns && this.shadow) {
      this._thorns.forEach(t => {
        if (this.shadow.x > t.x && this.shadow.x < t.x + t.w &&
            this.shadow.y > t.y - 10 && !this._thornCooldown) {
          this._thornCooldown = true;
          this._onHazardHit();
          this.time.delayedCall(1200, () => { this._thornCooldown = false; });
        }
      });
    }

    if (this._rocks) {
      Object.values(this._rocks).forEach(rock => {
        if (!rock.getData('pushed')) {
          const dist = Phaser.Math.Distance.Between(this.shadow.x, this.shadow.y, rock.x, rock.y);
          if (dist < 42) this._pushRock(rock);
        }
      });
    }
  }
}
