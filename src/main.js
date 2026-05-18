import Phaser from 'phaser';
import { BootScene }       from './scenes/BootScene.js';
import { MenuScene }       from './scenes/MenuScene.js';
import { EndScene }        from './scenes/EndScene.js';
import { Cinematic1Scene } from './scenes/cinematics/Cinematic1Scene.js';
import { Level1Scene }     from './scenes/levels/Level1Scene.js';
import { Level2Scene }     from './scenes/levels/Level2Scene.js';
import { Level3Scene }     from './scenes/levels/Level3Scene.js';
import { W, H }            from './config/GameConfig.js';

const config = {
  type: Phaser.AUTO,
  width: W,
  height: H,
  parent: 'game-container',
  backgroundColor: '#0d0806',
  antialias: true,
  roundPixels: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 800 },
      debug: false
    }
  },
  scene: [
    BootScene,
    MenuScene,
    Cinematic1Scene,
    Level1Scene,
    Level2Scene,
    Level3Scene,
    EndScene,
  ]
};

window._game = new Phaser.Game(config);
