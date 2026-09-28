// ============================================================================
// SHOP & GEAR MANAGER
// Weapons, Headgear accessories, and Studio backgrounds
// ============================================================================

export class ShopManager {
  constructor(saveManager) {
    this.saveManager = saveManager;

    this.weapons = [
      {
        id: 'fists',
        name: 'Cyber Knuckles',
        cost: 0,
        description: 'Standard martial arts fists. Fast recovery & clean strikes.',
        bonus: 'Base Stats',
        rangeMultiplier: 1.0,
        scoreMultiplier: 1.0,
        color: '#00ffcc',
        icon: '👊',
      },
      {
        id: 'katana',
        name: 'Neon Katana',
        cost: 400,
        description: 'Slices through enemies with cyan laser arcs. Extended range!',
        bonus: '+25% Strike Range',
        rangeMultiplier: 1.25,
        scoreMultiplier: 1.15,
        color: '#00ffff',
        icon: '⚔️',
      },
      {
        id: 'nunchaku',
        name: 'Pulse Nunchaku',
        cost: 850,
        description: 'Rapid twin spinning flurries. Builds combo faster!',
        bonus: '+30% Combo Bonus',
        rangeMultiplier: 1.1,
        scoreMultiplier: 1.3,
        color: '#ffea00',
        icon: '🥋',
      },
      {
        id: 'staff',
        name: 'Bo Staff of Wukong',
        cost: 1400,
        description: 'Heavy gold-tipped pole. Massive knockback and stun!',
        bonus: '+40% Knockback & Stun',
        rangeMultiplier: 1.35,
        scoreMultiplier: 1.45,
        color: '#ff9900',
        icon: '🦯',
      },
      {
        id: 'sabers',
        name: 'Dual Plasma Sabers',
        cost: 2500,
        description: 'Twin humming laser blades. Supreme cutting power!',
        bonus: '+50% Score Multiplier',
        rangeMultiplier: 1.3,
        scoreMultiplier: 1.6,
        color: '#ff00aa',
        icon: '⚡',
      },
    ];

    this.headgears = [
      { id: 'none', name: 'Clean Stick', cost: 0, description: 'Minimalist classic stickman style.', icon: '⚪' },
      { id: 'headband', name: 'Ninja Headband', cost: 0, description: 'Crimson cloth headband fluttering in the wind.', icon: '🧣' },
      { id: 'visor', name: 'Cyber Visor', cost: 250, description: 'Futuristic cyan holographic targeting visor.', icon: '🕶️' },
      { id: 'headset', name: 'RGB Cat Headset', cost: 600, description: 'Ultimate pro StickTuber aesthetic with glowing cat ears.', icon: '🎧' },
      { id: 'hair', name: 'Saiyan Gold Hair', cost: 1200, description: 'Spiky electric golden aura hair of power.', icon: '⚡' },
      { id: 'horns', name: 'Cyber Demon Horns', cost: 2000, description: 'Intimidating crimson holographic demon horns.', icon: '😈' },
    ];

    this.themes = [
      { id: 'cyber_dojo', name: 'Neon Cyber Dojo', cost: 0, description: 'High-tech neon arena with dynamic reactive floor.', icon: '⛩️' },
      { id: 'shinjuku', name: 'Neo Shinjuku Skyline', cost: 350, description: 'Distant rainy cyberpunk towers and neon billboards.', icon: '🏙️' },
      { id: 'synthwave', name: 'Synthwave Sunset 1984', cost: 800, description: 'Retro 80s outrun wireframe perspective and wire sun.', icon: '🌅' },
      { id: 'matrix', name: 'Digital Void Matrix', cost: 1500, description: 'Cascading emerald green cyber code stream.', icon: '🟢' },
    ];
  }

  getWeapons() {
    const unlocked = this.saveManager.data.unlockedWeapons;
    const current = this.saveManager.data.selectedWeapon;
    return this.weapons.map(w => ({
      ...w,
      isUnlocked: unlocked.includes(w.id),
      isSelected: current === w.id,
      canAfford: this.saveManager.data.coins >= w.cost,
    }));
  }

  getHeadgears() {
    const unlocked = this.saveManager.data.unlockedHeadgear;
    const current = this.saveManager.data.selectedHeadgear;
    return this.headgears.map(h => ({
      ...h,
      isUnlocked: unlocked.includes(h.id),
      isSelected: current === h.id,
      canAfford: this.saveManager.data.coins >= h.cost,
    }));
  }

  getThemes() {
    const unlocked = this.saveManager.data.unlockedThemes;
    const current = this.saveManager.data.selectedTheme;
    return this.themes.map(t => ({
      ...t,
      isUnlocked: unlocked.includes(t.id),
      isSelected: current === t.id,
      canAfford: this.saveManager.data.coins >= t.cost,
    }));
  }

  getSelectedWeaponData() {
    const id = this.saveManager.data.selectedWeapon;
    return this.weapons.find(w => w.id === id) || this.weapons[0];
  }
}
