import Phaser from 'phaser';
import { BootScene }       from './scenes/BootScene.js';
import { MenuScene }       from './scenes/MenuScene.js';
import { EndScene }        from './scenes/EndScene.js';
import { IntroVideoScene }  from './scenes/levels/Level1/cinematics/IntroVideoScene.js';
import { Cinematic1Scene }  from './scenes/levels/Level1/cinematics/Cinematic1Scene.js';
import { Level1Scene }      from './scenes/levels/Level1/Level1Scene.js';
import { L1_FoodScene }     from './scenes/levels/Level1/miniactivities/L1_FoodScene.js';
import { L1_EndScene }      from './scenes/levels/Level1/miniactivities/L1_EndScene.js';
import { Cinematic2Scene }  from './scenes/levels/Level2/cinematics/Cinematic2Scene.js';
import { Level2Scene }      from './scenes/levels/Level2/Level2Scene.js';
import { L2_CalmerScene }   from './scenes/levels/Level2/miniactivities/L2_CalmerScene.js';
import { L2_FeedScene }     from './scenes/levels/Level2/miniactivities/L2_FeedScene.js';
import { L2_CatchScene }    from './scenes/levels/Level2/miniactivities/L2_CatchScene.js';
import { L2_DodgeScene }    from './scenes/levels/Level2/miniactivities/L2_DodgeScene.js';
import { L2_FirefliesScene } from './scenes/levels/Level2/miniactivities/L2_FirefliesScene.js';
import { L2_PetScene }      from './scenes/levels/Level2/miniactivities/L2_PetScene.js';
import { L2_RhythmScene }   from './scenes/levels/Level2/miniactivities/L2_RhythmScene.js';
import { L2_EndScene }      from './scenes/levels/Level2/miniactivities/L2_EndScene.js';
import { Level3Scene }            from './scenes/levels/Level3/Level3Scene.js';
import { L3_CarJourneyScene }    from './scenes/levels/Level3/L3_CarJourneyScene.js';
import { L3_MG1_MedicineScene }  from './scenes/levels/Level3/miniactivities/L3_MG1_MedicineScene.js';
import { L3_MG2_InjectionScene } from './scenes/levels/Level3/miniactivities/L3_MG2_InjectionScene.js';
import { L3_MG3_HeartScene }     from './scenes/levels/Level3/miniactivities/L3_MG3_HeartScene.js';
import { L3_MG4_OxygenScene }    from './scenes/levels/Level3/miniactivities/L3_MG4_OxygenScene.js';
import { L3_MG5_DeliveryScene }  from './scenes/levels/Level3/miniactivities/L3_MG5_DeliveryScene.js';
import { L3_EndScene }           from './scenes/levels/Level3/L3_EndScene.js';
// Level 4
import { Level4Scene }       from './scenes/levels/Level4/Level4Scene.js';
import { L4_DecorateScene }  from './scenes/levels/Level4/L4_DecorateScene.js';
import { W, H }                  from './config/GameConfig.js';

// ── Shared touch state: HTML footer buttons write here, Phaser reads here ──
window._touchState = { left: false, right: false, jump: false };

function wireHoldBtn(id, key) {
  const btn = document.getElementById(id);
  if (!btn) return;
  const press   = () => { window._touchState[key] = true;  btn.classList.add('pressed'); };
  const release = () => { window._touchState[key] = false; btn.classList.remove('pressed'); };
  btn.addEventListener('pointerdown',   e => { e.preventDefault(); press(); });
  btn.addEventListener('pointerup',     e => { e.preventDefault(); release(); });
  btn.addEventListener('pointercancel', e => { e.preventDefault(); release(); });
  btn.addEventListener('pointerleave',  e => { release(); });
}

wireHoldBtn('btn-left',  'left');
wireHoldBtn('btn-right', 'right');
wireHoldBtn('btn-jump',  'jump');

const barkBtn = document.getElementById('btn-bark');
if (barkBtn) {
  barkBtn.addEventListener('pointerdown', e => {
    e.preventDefault();
    barkBtn.classList.add('pressed');
    if (window._currentLevel?._doBark) window._currentLevel._doBark();
  });
  barkBtn.addEventListener('pointerup',     () => barkBtn.classList.remove('pressed'));
  barkBtn.addEventListener('pointercancel', () => barkBtn.classList.remove('pressed'));
}

const attackBtn = document.getElementById('btn-attack');
if (attackBtn) {
  attackBtn.addEventListener('pointerdown', e => {
    e.preventDefault();
    attackBtn.classList.add('pressed');
    if (window._currentLevel?._doSnakeAttack) window._currentLevel._doSnakeAttack();
  });
  attackBtn.addEventListener('pointerup',     () => attackBtn.classList.remove('pressed'));
  attackBtn.addEventListener('pointercancel', () => attackBtn.classList.remove('pressed'));
}

// ── Phaser game config ─────────────────────────────────────────────────────
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
    EndScene,
    // Level 1
    IntroVideoScene,
    Cinematic1Scene,
    Level1Scene,
    L1_FoodScene,
    L1_EndScene,
    // Level 2
    Cinematic2Scene,
    Level2Scene,
    L2_CalmerScene,
    L2_FeedScene,
    L2_CatchScene,
    L2_DodgeScene,
    L2_FirefliesScene,
    L2_PetScene,
    L2_RhythmScene,
    L2_EndScene,
    // Level 3
    Level3Scene,
    L3_CarJourneyScene,
    L3_MG1_MedicineScene,
    L3_MG2_InjectionScene,
    L3_MG3_HeartScene,
    L3_MG4_OxygenScene,
    L3_MG5_DeliveryScene,
    L3_EndScene,
    // Level 4
    Level4Scene,
    L4_DecorateScene,
  ]
};

window._game = new Phaser.Game(config);
