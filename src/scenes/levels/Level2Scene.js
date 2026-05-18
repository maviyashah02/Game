import Phaser from 'phaser';
import { W, H } from '../../config/GameConfig.js';
import { BaseLevelScene } from './BaseLevelScene.js';

export class Level2Scene extends BaseLevelScene {
  constructor() { super('Level2'); }

  create() {
    const config = {
      worldWidth: 2400,
      startX: 80, startY: 360,
      chapterName: 'Chapter 2 — Hungry Little Gemma',
      objective: 'Collect 5 berries for Gemma!\nCross the river and return!',
      platforms: [
        { x: 200,  y: 370 }, { x: 350,  y: 340 },
        { x: 510,  y: 370 }, { x: 650,  y: 320 },
        { x: 820,  y: 370 }, { x: 980,  y: 300, key: 'log' },
        { x: 1200, y: 350 }, { x: 1400, y: 310 },
        { x: 1600, y: 360 }, { x: 1800, y: 320, key: 'log' },
        { x: 2000, y: 350 }, { x: 2200, y: 370 },
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
        { x: 640, w: 260 },
      ]
    };

    this.initLevel(config);

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

    this.gemmaGoal = this.physics.add.staticImage(160, 358, 'gemma').setScale(0.9).setDepth(8);
    this.tweens.add({ targets: this.gemmaGoal, y: '+=6', duration: 700, yoyo: true, repeat: -1 });

    for (let x = 640; x < 900; x += 20) {
      const w = this.add.rectangle(x, H - 12, 22, 22, 0x2a6aaa, 0.7).setDepth(3);
      this.tweens.add({ targets: w, alpha: 0.4 + Math.random() * 0.3, duration: 500 + Math.random() * 500, yoyo: true, repeat: -1 });
    }

    this._thorns = [];
    [500, 1300, 1900].forEach(tx => {
      this.add.text(tx, 378, '🌵', { fontSize: '24px' }).setDepth(9);
      this._thorns.push({ x: tx - 12, y: 370, w: 30, h: 30 });
    });

    this._berries.forEach(berry => {
      this.physics.add.overlap(this.shadow, berry, () => {
        if (!berry.getData('collected')) {
          berry.setData('collected', true);
          berry.destroy();
          this._berryCount++;
          this._berryTxt.setText(`🍓 ${this._berryCount} / 5`);
          this._showMessage(`Berry collected! ${this._berryCount}/5 🍓`);
          const sp = this.add.image(berry.x, berry.y, 'sparkle').setDepth(20);
          this.tweens.add({ targets: sp, scale: 2, alpha: 0, duration: 400, onComplete: () => sp.destroy() });
          if (this._berryCount >= this._berryNeeded) {
            this._showMessage('Got enough berries! Return to Gemma! 🏃');
          }
        }
      });
    });

    this.physics.add.overlap(this.shadow, this.gemmaGoal, () => {
      if (!this._levelDone && this._berryCount >= this._berryNeeded) {
        this._levelDone = true;
        this._onFeedGemma();
      } else if (!this._levelDone && !this._hintedReturn) {
        this._hintedReturn = true;
        this._showMessage('Collect 5 berries first! 🍓');
      }
    });
  }

  _onFeedGemma() {
    this.tweens.add({ targets: this.gemmaGoal, scaleX: 2.2, scaleY: 2.2, duration: 300, yoyo: true });
    for (let i = 0; i < 6; i++) {
      this.time.delayedCall(i * 150, () => {
        const b = this.add.image(160 + (Math.random() - 0.5) * 40, 350, 'berry').setDepth(60);
        this.tweens.add({
          targets: b, y: b.y - 40, x: b.x + (Math.random() - 0.5) * 30,
          alpha: 0, duration: 700, onComplete: () => b.destroy()
        });
      });
    }
    this.time.delayedCall(1200, () => {
      this._completeLevel('Level3', "Gemma is fed! 🍓💛\nShe's stronger now!");
    });
  }

  update() {
    this._updateBgParallax();
    this.updateMovement();

    if (this._thorns && this.shadow) {
      this._thorns.forEach(t => {
        if (this.shadow.x > t.x && this.shadow.x < t.x + t.w && this.shadow.y > t.y - 10 && !this._thornCooldown) {
          this._thornCooldown = true;
          this.cameras.main.shake(200, 0.008);
          this.shadow.setTint(0xff4444);
          this.time.delayedCall(500, () => { this.shadow.clearTint(); this._thornCooldown = false; });
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
