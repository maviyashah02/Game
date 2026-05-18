import Phaser from 'phaser';
import { H } from '../../config/GameConfig.js';
import { BaseLevelScene } from './BaseLevelScene.js';

export class Level1Scene extends BaseLevelScene {
  constructor() { super('Level1'); }

  create() {
    const config = {
      worldWidth: 2200,
      startX: 80, startY: 360,
      chapterName: 'Chapter 1 — The Warning',
      objective: "Reach Gemma's cage!\nJump, push rocks, and climb!",
      platforms: [
        { x: 320,  y: 360, w: 90, h: 20 },
        { x: 500,  y: 320, w: 80, h: 20 },
        { x: 700,  y: 370, w: 90, h: 20 },
        { x: 900,  y: 330, w: 80, h: 20, key: 'log' },
        { x: 1100, y: 350, w: 90, h: 20 },
        { x: 1300, y: 310, w: 80, h: 20 },
        { x: 1500, y: 350, w: 90, h: 20 },
        { x: 1700, y: 325, w: 80, h: 20, key: 'log' },
      ],
      rocks: [
        { x: 420,  y: 385, immovable: false },
        { x: 800,  y: 395, immovable: false },
        { x: 1200, y: 395, immovable: false },
      ],
      gaps: [
        { x: 580,  w: 80 },
        { x: 1050, w: 70 },
      ]
    };

    this.initLevel(config);

    this._rainData = [];
    for (let i = 0; i < 70; i++) {
      const r = this.add.image(Math.random() * 800, Math.random() * 450, 'raindrop')
        .setScrollFactor(0).setAlpha(0.25).setDepth(25);
      this._rainData.push({ img: r, speed: 4 + Math.random() * 2 });
    }

    this.cage      = this.physics.add.staticImage(2100, 360, 'cage').setScale(2).setDepth(8);
    this.gemmaGoal = this.add.image(2100, 348, 'gemma').setScale(0.9).setDepth(9);

    this.snake = this.add.image(1950, 374, 'snake').setScale(0.85).setDepth(9);
    this._snakeDir = 1;
    this._snakeTween = this.tweens.add({
      targets: this.snake, x: '+=120', duration: 2000, yoyo: true, repeat: -1,
      onUpdate: (t) => {
        this.snake.setFlipX(this._snakeDir < 0);
        this._snakeDir = t.progress > 0.5 ? -1 : 1;
      }
    });

    this._switch1     = this.physics.add.staticImage(1380, 375, 'switch_off').setDepth(8);
    this._switch1Done = false;

    this.physics.add.overlap(this.shadow, this.cage, () => {
      if (!this._levelDone) {
        this._levelDone = true;
        this._onReachGemma();
      }
    });

    this.physics.add.overlap(this.shadow, this._switch1, () => {
      if (!this._switch1Done) {
        this._switch1Done = true;
        this._switch1.setTexture('switch_on');
        this._showMessage('Switch activated! Path opened! 🎯');
        for (let x = 1050; x < 1120; x += 32) {
          const tile = this.groundGroup.create(x + 16, H - 16, 'ground');
          tile.setDisplaySize(32, 32).refreshBody();
          const twn = this.add.image(x + 16, H - 30, 'sparkle').setDepth(15);
          this.tweens.add({ targets: twn, alpha: 0, y: twn.y - 20, duration: 600, onComplete: () => twn.destroy() });
        }
      }
    });

    this.time.delayedCall(1200, () => this._showMessage('Tip: Walk into rocks to push them! Jump with ↑ or W'));
  }

  _onReachGemma() {
    if (this.snake && this._snakeTween) this._snakeTween.stop();
    if (this.snake) {
      this.tweens.add({ targets: this.snake, x: '+=200', alpha: 0, duration: 1000 });
    }
    this.tweens.add({ targets: this.gemmaGoal, y: '-=10', duration: 300, yoyo: true, repeat: 3 });

    for (let i = 0; i < 5; i++) {
      this.time.delayedCall(i * 200, () => {
        const h = this.add.image(2100 + (Math.random() - 0.5) * 60, 320 + Math.random() * 20, 'heart')
          .setDepth(60).setScale(0.8);
        this.tweens.add({ targets: h, y: h.y - 50, alpha: 0, duration: 1000, onComplete: () => h.destroy() });
      });
    }
    this.time.delayedCall(1200, () => {
      this._completeLevel('Level2', "Shadow reached Gemma! 💛\nShe's safe... for now.");
    });
  }

  update() {
    this._updateBgParallax();
    this.updateMovement();

    if (this._rainData) {
      for (const r of this._rainData) {
        r.img.y += r.speed;
        if (r.img.y > 460) { r.img.y = -10; r.img.x = Math.random() * 800; }
      }
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
