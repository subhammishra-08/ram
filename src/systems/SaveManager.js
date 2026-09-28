// ============================================================================
// SAVE & PROGRESSION MANAGER (LocalStorage Persistence)
// Weapons, cosmetics, stats, upgrades, and channel milestone tracking
// ============================================================================

const SAVE_KEY = 'sticktuber_save_v1';

export class SaveManager {
  constructor() {
    this.data = this.load();
  }

  getDefaults() {
    return {
      subscribers: 10000,
      coins: 600, // Starting bonus so player can immediately explore shop
      selectedWeapon: 'fists',
      unlockedWeapons: ['fists'],
      selectedHeadgear: 'headband',
      unlockedHeadgear: ['none', 'headband'],
      selectedTheme: 'cyber_dojo',
      unlockedThemes: ['cyber_dojo'],
      levelProgress: {
        track1: { stars: 0, highScore: 0, completed: false },
        track2: { stars: 0, highScore: 0, completed: false },
        track3: { stars: 0, highScore: 0, completed: false },
        track4: { stars: 0, highScore: 0, completed: false },
      },
      endlessRecord: 0,
      stats: {
        totalStreams: 0,
        totalEnemiesDefeated: 0,
        highestCombo: 0,
        totalSuperchats: 0,
      },
      settings: {
        masterVolume: 0.8,
        musicVolume: 0.7,
        sfxVolume: 0.9,
        screenShake: true,
        particles: true,
        latencyMs: 0,
      }
    };
  }

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return this.getDefaults();
      const parsed = JSON.parse(raw);
      return { ...this.getDefaults(), ...parsed };
    } catch (e) {
      console.warn('Failed to load save data from localStorage, using defaults.', e);
      return this.getDefaults();
    }
  }

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Failed to write save data to localStorage.', e);
    }
  }

  addCoins(amount) {
    this.data.coins = Math.max(0, this.data.coins + amount);
    this.save();
    return this.data.coins;
  }

  addSubscribers(amount) {
    this.data.subscribers = Math.max(0, this.data.subscribers + amount);
    this.save();
    return this.data.subscribers;
  }

  unlockWeapon(weaponId, cost = 0) {
    if (this.data.coins < cost) return false;
    if (!this.data.unlockedWeapons.includes(weaponId)) {
      this.data.coins -= cost;
      this.data.unlockedWeapons.push(weaponId);
      this.save();
    }
    return true;
  }

  setWeapon(weaponId) {
    if (this.data.unlockedWeapons.includes(weaponId)) {
      this.data.selectedWeapon = weaponId;
      this.save();
      return true;
    }
    return false;
  }

  unlockHeadgear(headgearId, cost = 0) {
    if (this.data.coins < cost) return false;
    if (!this.data.unlockedHeadgear.includes(headgearId)) {
      this.data.coins -= cost;
      this.data.unlockedHeadgear.push(headgearId);
      this.save();
    }
    return true;
  }

  setHeadgear(headgearId) {
    if (this.data.unlockedHeadgear.includes(headgearId)) {
      this.data.selectedHeadgear = headgearId;
      this.save();
      return true;
    }
    return false;
  }

  unlockTheme(themeId, cost = 0) {
    if (this.data.coins < cost) return false;
    if (!this.data.unlockedThemes.includes(themeId)) {
      this.data.coins -= cost;
      this.data.unlockedThemes.push(themeId);
      this.save();
    }
    return true;
  }

  setTheme(themeId) {
    if (this.data.unlockedThemes.includes(themeId)) {
      this.data.selectedTheme = themeId;
      this.save();
      return true;
    }
    return false;
  }

  recordLevelScore(trackId, score, stars) {
    if (!this.data.levelProgress[trackId]) {
      this.data.levelProgress[trackId] = { stars: 0, highScore: 0, completed: false };
    }
    const cur = this.data.levelProgress[trackId];
    if (score > cur.highScore) cur.highScore = score;
    if (stars > cur.stars) cur.stars = stars;
    cur.completed = true;
    this.save();
  }

  recordEndlessScore(score) {
    if (score > this.data.endlessRecord) {
      this.data.endlessRecord = score;
      this.save();
    }
  }

  updateStats(enemiesKilled, maxCombo) {
    this.data.stats.totalStreams++;
    this.data.stats.totalEnemiesDefeated += enemiesKilled;
    if (maxCombo > this.data.stats.highestCombo) {
      this.data.stats.highestCombo = maxCombo;
    }
    this.save();
  }
}
