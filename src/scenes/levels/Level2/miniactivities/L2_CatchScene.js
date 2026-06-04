import Phaser from 'phaser';
import { W, H } from '../../../../config/GameConfig.js';

// L2 Checkpoint Overlay — Catch the Supplies (skill / reaction)
// Launched on top of the paused platformer. Emits 'cp-done' when won.
// Move the basket to catch GOOD supplies, dodge falling rocks.
const GOOD  = ['🎒', '🍞', '💧', '🧰', '🩹', '🥫'];
const BAD   = ['🪨', '🌵', '💣'];
const NEED  = 7;     // supplies to catch
const LIVES = 3;
const TIME  = 30;

export class L2_CatchScene extends Phaser.Scene {
  constructor() { super('L2_Catch'); }

  create() {
    // Dim backdrop over the frozen platformer (also swallows stray input)
    this.add.rectangle(W / 2, H / 2, W, H, 0x05080a, 0.84).setDepth(0).setInteractive();
    this.add.rectangle(W / 2, 26, W, 52, 0x0a1018, 0.9).setDepth(1);
    this.add.text(W / 2, 18, '🧺 Catch the Supplies!', { fontSize: '18px', fontFamily: 'Georgia, serif', color: '#f5c87a', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(2);
    this.add.text(W / 2, 40, 'Move with the mouse or ← →. Catch supplies, dodge rocks!', { fontSize: '12px', fontFamily: 'Georgia, serif', color: '#c8d0e0', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(2);

    // Ground line
    this.add.rectangle(W / 2, H - 22, W, 6, 0x2a3a18, 1).setDepth(1);

    // Basket
    this._basket = this.add.text(W / 2, H - 44, '🧺', { fontSize: '46px' }).setOrigin(0.5).setDepth(10);
    this._basketX = W / 2;

    // State + HUD
    this._caught = 0; this._lives = LIVES; this._timeLeft = TIME; this._done = false;
    this._items = [];
    this._caughtTxt = this.add.text(14, 60, `Caught:  0 / ${NEED}`, { fontSize: '14px', fontFamily: 'Georgia, serif', color: '#88ff88', stroke: '#000', strokeThickness: 2 }).setDepth(5);
    this._lifeTxt   = this.add.text(14, 82, '❤️'.repeat(LIVES), { fontSize: '14px' }).setDepth(5);
    this._timeTxt   = this.add.text(W - 14, 60, `⏱ ${TIME}s`, { fontSize: '15px', fontFamily: 'Georgia, serif', color: '#f5c87a', stroke: '#000', strokeThickness: 2 }).setOrigin(1, 0).setDepth(5);

    // Controls
    this.input.on('pointermove', p => { this._basketX = Phaser.Math.Clamp(p.x, 40, W - 40); });
    this._keys = this.input.keyboard.addKeys('LEFT,RIGHT,A,D');

    // Falling speed ramps up
    this._fallSpeed = 0.14;
    this._spawnTimer = this.time.addEvent({ delay: 880, loop: true, callback: () => this._spawn() });
    this._timer = this.time.addEvent({ delay: 1000, loop: true, callback: () => {
      if (this._done) return;
      this._timeLeft--;
      this._timeTxt.setText(`⏱ ${this._timeLeft}s`).setColor(this._timeLeft <= 8 ? '#ff4466' : '#f5c87a');
      this._fallSpeed += 0.006;             // gets harder
      if (this._timeLeft <= 0) this._fail("⏱ Out of time! The supplies scattered.");
    }});

    this._spawn(); this._spawn();
    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  _spawn() {
    if (this._done) return;
    const bad = Math.random() < 0.34;
    const emoji = bad ? Phaser.Math.RND.pick(BAD) : Phaser.Math.RND.pick(GOOD);
    const x = 40 + Math.random() * (W - 80);
    const t = this.add.text(x, -20, emoji, { fontSize: '34px' }).setOrigin(0.5).setDepth(8);
    this._items.push({ t, vy: this._fallSpeed * (0.85 + Math.random() * 0.4), bad });
  }

  update(time, delta) {
    if (this._done) return;
    const d = Math.min(delta, 40);
    // Keyboard movement
    const step = 0.45 * d;
    if (this._keys.LEFT.isDown  || this._keys.A.isDown) this._basketX = Math.max(40, this._basketX - step);
    if (this._keys.RIGHT.isDown || this._keys.D.isDown) this._basketX = Math.min(W - 40, this._basketX + step);
    this._basket.x = this._basketX;

    const catchY = H - 58;
    for (let i = this._items.length - 1; i >= 0; i--) {
      const it = this._items[i];
      it.t.y += it.vy * d;
      // caught?
      if (it.t.y >= catchY && it.t.y <= catchY + 46 && Math.abs(it.t.x - this._basketX) < 46) {
        this._items.splice(i, 1);
        if (it.bad) this._hit(it.t);
        else        this._grab(it.t);
        continue;
      }
      // missed off-bottom
      if (it.t.y > H + 24) {
        this._items.splice(i, 1);
        it.t.destroy();
      }
    }
  }

  _grab(t) {
    t.destroy();
    this._caught++;
    this._caughtTxt.setText(`Caught:  ${this._caught} / ${NEED}`);
    this.tweens.add({ targets: this._basket, scaleX: 1.2, scaleY: 0.85, duration: 90, yoyo: true });
    const plus = this.add.text(this._basketX, H - 78, '+1', { fontSize: '16px', fontFamily: 'Georgia, serif', color: '#88ff88', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(11);
    this.tweens.add({ targets: plus, y: plus.y - 26, alpha: 0, duration: 600, onComplete: () => plus.destroy() });
    if (this._caught >= NEED) this._win();
  }

  _hit(t) {
    t.destroy();
    this.cameras.main.shake(220, 0.012);
    this.cameras.main.flash(180, 160, 0, 0);
    this._lives--;
    this._lifeTxt.setText('❤️'.repeat(Math.max(0, this._lives)) + '🖤'.repeat(LIVES - Math.max(0, this._lives)));
    if (this._lives <= 0) this._fail("💥 Too many rocks! The basket broke.");
  }

  _win() {
    if (this._done) return;
    this._done = true;
    this._spawnTimer.remove(); this._timer.remove();
    this._items.forEach(it => it.t.destroy()); this._items = [];
    this.cameras.main.flash(500, 60, 200, 80);
    const total = (this.registry.get('points') || 0) + 2;
    this.registry.set('points', total);
    this.add.text(W / 2, H / 2 - 14, '✅ Supplies recovered!', { fontSize: '24px', fontFamily: 'Georgia, serif', color: '#88ffaa', stroke: '#0a0502', strokeThickness: 3 }).setOrigin(0.5).setDepth(20);
    this.add.text(W / 2, H / 2 + 22, `+2 ⭐   (Total: ${total})`, { fontSize: '17px', fontFamily: 'Georgia, serif', color: '#ffd86a', stroke: '#0a0502', strokeThickness: 3 }).setOrigin(0.5).setDepth(20);
    this.time.delayedCall(1300, () => this.events.emit('cp-done'));
  }

  _fail(msg) {
    if (this._done) return;
    this._done = true;
    this._spawnTimer.remove(); this._timer.remove();
    this._items.forEach(it => it.t.destroy()); this._items = [];
    this.cameras.main.shake(300, 0.012);
    this.add.text(W / 2, H / 2, msg + '\nTry again!', { fontSize: '18px', fontFamily: 'Georgia, serif', color: '#ff7070', stroke: '#000', strokeThickness: 3, align: 'center' }).setOrigin(0.5).setDepth(20);
    this.time.delayedCall(1700, () => this.scene.restart());
  }
}
