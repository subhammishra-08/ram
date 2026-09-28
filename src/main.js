// ============================================================================
// STICKTUBER - MAIN ENTRY POINT
// Initializes audio, save systems, game loop, and UI
// ============================================================================

import { AudioEngine } from './audio/AudioEngine.js';
import { StreamerSystem } from './systems/StreamerSystem.js';
import { SaveManager } from './systems/SaveManager.js';
import { ShopManager } from './ui/ShopManager.js';
import { GameEngine } from './engine/GameEngine.js';
import { UIManager } from './ui/UIManager.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');

  // Initialize core systems
  const saveManager = new SaveManager();
  const audioEngine = new AudioEngine();
  const streamerSystem = new StreamerSystem();
  const shopManager = new ShopManager(saveManager);

  // Apply saved volume settings
  if (saveManager.data.settings) {
    audioEngine.setMasterVolume(saveManager.data.settings.masterVolume ?? 0.8);
    audioEngine.setMusicVolume(saveManager.data.settings.musicVolume ?? 0.7);
    audioEngine.setSfxVolume(saveManager.data.settings.sfxVolume ?? 0.9);
  }

  // Create core game engine
  const gameEngine = new GameEngine(
    canvas,
    audioEngine,
    streamerSystem,
    saveManager,
    shopManager
  );

  // Create UI manager
  const uiManager = new UIManager(
    gameEngine,
    audioEngine,
    streamerSystem,
    saveManager,
    shopManager
  );

  // Resume Web Audio context on user gesture (browser requirement)
  const unlockAudio = () => {
    audioEngine.ensureContext();
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('pointerdown', unlockAudio);
  window.addEventListener('keydown', unlockAudio);

  // Initial draw loop so background is rendered even on menu
  const renderMenuPreview = () => {
    if (gameEngine.gameState === 'menu') {
      gameEngine.render();
      requestAnimationFrame(renderMenuPreview);
    }
  };
  requestAnimationFrame(renderMenuPreview);

  console.log('StickTuber: Cyber Beat Brawl initialized successfully!');
});
