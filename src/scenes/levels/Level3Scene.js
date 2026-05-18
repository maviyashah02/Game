import Phaser from 'phaser';
import { W, H } from '../../config/GameConfig.js';
import { BaseLevelScene } from './BaseLevelScene.js';

export class Level3Scene extends BaseLevelScene {
  constructor() { super('Level3'); }

  create() {
    const config = {
      worldWidth: 2600,
      startX: 80, startY: 350,
      chapterName: 'Chapter 3 — The Snake Returns',
      objective: 'Protect Gemma! Defeat the snake!\nBark 3 times to scare it away!',
      platforms: [
        { x: 200,  y: 360 }, { x: 380,  y: 320 },
        { x: 560,  y: 360, key: 'log' },
        { x: 740,  y: 300 }, { x: 920,  y: 340 },
        { x: 1100, y: 280, key: 'log' }, { x: 1280, y: 350 },
        { x: 1460, y: 300 }, { x: 1640, y: 360, key: 'log' },
        { x: 1820, y: 300 }, { x: 2000, y: 340 },
        { x: 2200, y: 280, key: 'log' }, { x: 2400, y: 350 },
      ],
      rocks: [
        { x: 480,  y: 395 }, { x: 1000, y: 395 },
        { x: 1600, y: 395 }, { x: 2100, y: 395 }
      ],
      gaps: [
        { x: 300,  w: 60 }, { x: 660,  w: 60 },
        { x: 1180, w: 60 }, { x: 1740, w: 60 }, { x: 2300, w: 60 }
      ]
    };

    this.initLevel(config);

    this.cage      = this.physics.add.staticImage(2520, 355, 'cage').setScale(2.2).setDepth(8);
    this.gemmaGoal = this.add.image(2520, 348, 'gemma').setScale(0.9).setDepth(9);
    this.tweens.add({ targets: this.gemmaGoal, y: '+=5', duration: 600, yoyo: true, repeat: -1 });

    this.snake = this.physics.add.sprite(2300, 374, 'snake').setScale(0.85).setDepth(9);
    this.snake.setImmovable(false);
    this.snake.body.setAllowGravity(false);
    this._snakeHP    = 3;
    this._lastSnakeX = 2300;

    this._snakeHPText = this.add.text(W / 2, H - 32, '🐍 Snake HP: ❤️❤️❤️', {
      fontSize: '13px', fontFamily: 'Georgia, serif',
      color: '#ee4422', stroke: '#0a0502', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(35);

    this._barkCount = 0;
    this._barkTxt = this.add.text(W - 20, 38, '🐕 Barks: 0/3', {
      fontSize: '14px', fontFamily: 'Georgia, serif',
      color: '#f5e0b0', stroke: '#1a0802', strokeThickness: 2
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(35);

    this._collapsing = [];
    [560, 1100, 1640, 2200].forEach(px => {
      const warn = this.add.rectangle(px, 300, 90, 5, 0xff4422, 0.4).setDepth(12);
      this._collapsing.push({ x: px, warn, triggered: false });
    });

    this.onBark = () => {
      if (this._snakeHP <= 0) return;
      const dist = Phaser.Math.Distance.Between(this.shadow.x, this.shadow.y, this.snake.x, this.snake.y);
      if (dist < 250) {
        this._snakeHP--;
        this._barkCount++;
        this._barkTxt.setText(`🐕 Barks: ${this._barkCount}/3`);
        this._updateSnakeHP();
        this.snake.setTint(0xff6666);
        this.tweens.add({ targets: this.snake, x: this.snake.x + 60, duration: 300, yoyo: true });
        this.time.delayedCall(600, () => this.snake.clearTint());
        this.cameras.main.shake(250, 0.01);
        if (this._snakeHP <= 0) this._defeatSnake();
      } else {
        this._showMessage('Get closer to the snake and bark! 🐕');
      }
    };

    this.time.delayedCall(1000, () => this._showMessage('Reach the snake! Press B or 🐕 to bark!'));
    this.time.delayedCall(3000, () => this._showMessage('Watch for collapsing platforms! ⚠️'));

    this.time.addEvent({
      delay: 3000, loop: true, callback: () => {
        if (this._snakeHP > 0 && !this._levelDone) this.cameras.main.shake(100, 0.003);
      }
    });

    this.physics.add.collider(this.snake, this.groundGroup);
  }

  _updateSnakeHP() {
    const hearts = ['❤️', '❤️', '❤️'].map((h, i) => i < this._snakeHP ? h : '🖤').join('');
    this._snakeHPText.setText(`🐍 Snake HP: ${hearts}`);
  }

  _defeatSnake() {
    this._snakeHPText.setText('🐍 The snake flees!');
    this.tweens.add({ targets: this.snake, x: this.snake.x + 400, alpha: 0, duration: 1200, ease: 'Power2' });
    this.cameras.main.shake(400, 0.015);

    for (let i = 0; i < 16; i++) {
      const sp = this.add.image(
        this.snake.x + (Math.random() - 0.5) * 100,
        this.snake.y + (Math.random() - 0.5) * 40,
        'sparkle'
      ).setDepth(60);
      this.tweens.add({
        targets: sp,
        x: sp.x + (Math.random() - 0.5) * 150,
        y: sp.y - 60 - Math.random() * 60,
        alpha: 0, scale: 2, duration: 900,
        onComplete: () => sp.destroy()
      });
    }

    this.time.delayedCall(1500, () => {
      if (this._levelDone) return;
      this._levelDone = true;
      for (let i = 0; i < 8; i++) {
        this.time.delayedCall(i * 180, () => {
          const h = this.add.image(2520 + (Math.random() - 0.5) * 50, 320, 'heart').setDepth(60);
          this.tweens.add({ targets: h, y: h.y - 60, alpha: 0, duration: 900, onComplete: () => h.destroy() });
        });
      }
      this.time.delayedCall(1600, () => {
        this._completeLevel('EndScene', "GEMMA IS SAFE! 🐾💛\nShadow's love saved the day!");
      });
    });
  }

  update() {
    this._updateBgParallax();
    this.updateMovement();

    if (this._rocks) {
      Object.values(this._rocks).forEach(rock => {
        if (!rock.getData('pushed')) {
          const dist = Phaser.Math.Distance.Between(this.shadow.x, this.shadow.y, rock.x, rock.y);
          if (dist < 42) this._pushRock(rock);
        }
      });
    }

    if (this._snakeHP > 0 && !this._levelDone) {
      const sx   = this.snake.x;
      const px   = this.shadow.x;
      const dist = Math.abs(sx - px);
      if (dist < 600) {
        const dir = px > sx ? 1 : -1;
        this.snake.x += dir * 0.8;
        this.snake.setFlipX(dir < 0);
        if (dist < 120) {
          this.cameras.main.shake(80, 0.004);
          if (!this._snakeDangerShown) {
            this._snakeDangerShown = true;
            this._showMessage('⚠️ The snake is close! BARK! (B or 🐕)');
          }
        }
      }
    }

    if (this._collapsing) {
      this._collapsing.forEach(cp => {
        const dist = Math.abs(this.shadow.x - cp.x);
        if (dist < 60 && !cp.triggered) {
          cp.triggered = true;
          cp.warn.setFillStyle(0xff2200, 0.8);
          this.time.delayedCall(800, () => {
            this.platGroup.getChildren().forEach(p => {
              if (Math.abs(p.x - cp.x) < 50) {
                this.tweens.add({
                  targets: p, y: p.y + 80, alpha: 0, duration: 500,
                  onComplete: () => { p.destroy(); cp.warn.destroy(); }
                });
              }
            });
          });
        }
      });
    }
  }
}
