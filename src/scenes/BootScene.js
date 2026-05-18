import Phaser from 'phaser';
import { generateAssets } from '../utils/AssetGenerator.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    this.load.image('jungle_bg',    'assets/images/jungle.png');
    this.load.image('start_screen', 'assets/images/StartScreen.png');
    this.load.image('ground',       'assets/images/ground.png');
    this.load.image('platform',     'assets/images/platform.png');
    this.load.image('log',          'assets/images/log.png');
    this.load.image('rock',         'assets/images/rock.png');
    this.load.image('fallen_tree',  'assets/images/fallen_tree.png');
    this.load.image('shadow_idle',  'assets/images/shadow/shadow_idle.png');
    this.load.image('shadow_run1',  'assets/images/shadow/shadow_run1.png');
    this.load.image('shadow_run2',  'assets/images/shadow/shadow_run2.png');
    this.load.image('shadow_jump',  'assets/images/shadow/shadow_jump.png');
  }

  create() {
    generateAssets(this);
    this.scene.start('Menu');

    let pct = 0;
    const tips = ['Waking Shadow up...', 'Brewing forest magic...', 'Hiding berries...', 'Training the snake...', 'Almost ready...'];
    const iv = setInterval(() => {
      pct = Math.min(pct + 8, 100);
      document.getElementById('load-bar').style.width = pct + '%';
      document.getElementById('load-tip').textContent = tips[Math.floor(pct / 22)] || 'Almost ready...';
      if (pct >= 100) {
        clearInterval(iv);
        setTimeout(() => {
          const ls = document.getElementById('loading-screen');
          ls.style.opacity = '0';
          setTimeout(() => ls.remove(), 1000);
        }, 400);
      }
    }, 40);
  }
}
