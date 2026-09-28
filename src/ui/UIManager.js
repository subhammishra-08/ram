// ============================================================================
// UI MANAGER - HUD, CHAT OVERLAY, MENUS, SHOP, AND SOUND CONTROLS
// Professional Twitch/YouTube streamer aesthetic with reactive neon elements
// ============================================================================

export class UIManager {
  constructor(gameEngine, audioEngine, streamerSystem, saveManager, shopManager) {
    this.game = gameEngine;
    this.audio = audioEngine;
    this.streamer = streamerSystem;
    this.save = saveManager;
    this.shop = shopManager;

    this.cacheDom();
    this.bindEvents();
    this.updateChannelHeader();
    this.renderTrackList();
  }

  cacheDom() {
    // Screens & Modals
    this.screenMenu = document.getElementById('screen-menu');
    this.screenGame = document.getElementById('screen-game');
    this.screenShop = document.getElementById('modal-shop');
    this.screenSettings = document.getElementById('modal-settings');
    this.screenSummary = document.getElementById('modal-summary');
    this.screenHowToPlay = document.getElementById('modal-howtoplay');
    this.modalPause = document.getElementById('modal-pause');

    // Header & Channel Info
    this.channelSubscribers = document.getElementById('channel-subs');
    this.channelCoins = document.getElementById('channel-coins');
    this.liveBadge = document.getElementById('live-indicator');
    this.liveViewers = document.getElementById('live-viewers');
    this.streamTimer = document.getElementById('stream-timer');
    this.liveLikes = document.getElementById('live-likes');
    this.btnAudioMute = document.getElementById('btn-audio-mute');
    this.muteIcon = document.getElementById('mute-icon');

    // In-game HUD
    this.hudHearts = document.getElementById('hud-hearts');
    this.hudScore = document.getElementById('hud-score');
    this.hudComboContainer = document.getElementById('hud-combo-container');
    this.hudComboNum = document.getElementById('hud-combo-num');
    this.hudFeverBar = document.getElementById('hud-fever-fill');
    this.hudFeverBtn = document.getElementById('hud-fever-btn');
    this.hudWave = document.getElementById('hud-wave');
    this.btnHudPause = document.getElementById('btn-hud-pause');

    // Pause Modal buttons
    this.btnPauseResume = document.getElementById('btn-pause-resume');
    this.btnPauseRestart = document.getElementById('btn-pause-restart');
    this.btnPauseMenu = document.getElementById('btn-pause-menu');

    // Live Chat DOM
    this.chatContainer = document.getElementById('stream-chat-messages');

    // On-screen touch buttons
    this.btnTouchLeft = document.getElementById('btn-touch-left');
    this.btnTouchRight = document.getElementById('btn-touch-right');
    this.btnTouchFever = document.getElementById('btn-touch-fever');

    // Menu Buttons
    this.btnStartCareer = document.getElementById('btn-start-career');
    this.btnStartEndless = document.getElementById('btn-start-endless');
    this.btnOpenShop = document.getElementById('btn-open-shop');
    this.btnOpenSettings = document.getElementById('btn-open-settings');
    this.btnOpenHowToPlay = document.getElementById('btn-open-howtoplay');
    this.btnBackToMenu = document.getElementById('btn-back-menu');

    // Modals Close Buttons
    this.btnCloseShop = document.getElementById('btn-close-shop');
    this.btnCloseSettings = document.getElementById('btn-close-settings');
    this.btnCloseHowToPlay = document.getElementById('btn-close-howtoplay');
    this.btnSummaryClaim = document.getElementById('btn-summary-claim');

    // Shop tabs & containers
    this.shopTabWeapons = document.getElementById('shop-tab-weapons');
    this.shopTabHats = document.getElementById('shop-tab-hats');
    this.shopTabThemes = document.getElementById('shop-tab-themes');
    this.shopItemsList = document.getElementById('shop-items-list');

    // Volume sliders
    this.sliderMaster = document.getElementById('slider-master');
    this.sliderMusic = document.getElementById('slider-music');
    this.sliderSfx = document.getElementById('slider-sfx');
  }

  bindEvents() {
    // Game Flow Callbacks
    this.game.onHudUpdate = (data) => this.updateHud(data);
    this.game.onGameOver = (summary) => this.showSummary(summary, false);
    this.game.onVictory = (summary) => this.showSummary(summary, true);

    // Audio Mute toggle
    if (this.btnAudioMute) {
      this.btnAudioMute.addEventListener('click', () => {
        const isMuted = this.audio.toggleMute();
        this.muteIcon.textContent = isMuted ? '🔇' : '🔊';
      });
    }

    // In-game Pause button
    if (this.btnHudPause) {
      this.btnHudPause.addEventListener('click', () => {
        this.togglePause();
      });
    }

    // Pause Modal actions
    if (this.btnPauseResume) {
      this.btnPauseResume.addEventListener('click', () => {
        this.audio.playClick();
        this.togglePause();
      });
    }

    if (this.btnPauseRestart) {
      this.btnPauseRestart.addEventListener('click', () => {
        this.audio.playClick();
        this.modalPause.classList.add('hidden');
        this.startGame(this.game.gameMode, this.game.currentTrackIndex);
      });
    }

    if (this.btnPauseMenu) {
      this.btnPauseMenu.addEventListener('click', () => {
        this.audio.playClick();
        this.modalPause.classList.add('hidden');
        this.game.gameState = 'menu';
        this.audio.stopTrack();
        this.showMenu();
      });
    }

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      // Prevent scrolling on arrows/space
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.repeat) return;

      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (this.game.gameState === 'playing' || this.game.gameState === 'paused') {
          this.togglePause();
          return;
        }
      }

      if (this.game.gameState === 'playing') {
        if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft' || e.key === 'j' || e.key === 'J') {
          this.triggerInput('left');
        } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight' || e.key === 'l' || e.key === 'L') {
          this.triggerInput('right');
        } else if (e.code === 'Space' || e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
          this.game.triggerFever();
        }
      }
    });

    // Touch & Mouse On-Screen Buttons
    const handleLeft = (e) => {
      e.preventDefault();
      this.triggerInput('left');
    };
    const handleRight = (e) => {
      e.preventDefault();
      this.triggerInput('right');
    };
    const handleFever = (e) => {
      e.preventDefault();
      this.game.triggerFever();
    };

    this.btnTouchLeft.addEventListener('pointerdown', handleLeft);
    this.btnTouchRight.addEventListener('pointerdown', handleRight);
    if (this.btnTouchFever) this.btnTouchFever.addEventListener('pointerdown', handleFever);
    if (this.hudFeverBtn) this.hudFeverBtn.addEventListener('pointerdown', handleFever);

    // Menu Navigation
    this.btnStartCareer.addEventListener('click', () => {
      this.audio.playClick();
      this.startGame('career', 0);
    });

    this.btnStartEndless.addEventListener('click', () => {
      this.audio.playClick();
      this.startGame('endless', 1);
    });

    this.btnOpenShop.addEventListener('click', () => {
      this.audio.playClick();
      this.openShop('weapons');
    });

    this.btnOpenSettings.addEventListener('click', () => {
      this.audio.playClick();
      this.screenSettings.classList.remove('hidden');
    });

    this.btnOpenHowToPlay.addEventListener('click', () => {
      this.audio.playClick();
      this.screenHowToPlay.classList.remove('hidden');
    });

    this.btnCloseShop.addEventListener('click', () => {
      this.audio.playClick();
      this.screenShop.classList.add('hidden');
      this.updateChannelHeader();
    });

    this.btnCloseSettings.addEventListener('click', () => {
      this.audio.playClick();
      this.screenSettings.classList.add('hidden');
    });

    this.btnCloseHowToPlay.addEventListener('click', () => {
      this.audio.playClick();
      this.screenHowToPlay.classList.add('hidden');
    });

    this.btnSummaryClaim.addEventListener('click', () => {
      this.audio.playClick();
      this.screenSummary.classList.add('hidden');
      this.showMenu();
    });

    // Shop Tabs
    this.shopTabWeapons.addEventListener('click', () => this.switchShopTab('weapons'));
    this.shopTabHats.addEventListener('click', () => this.switchShopTab('hats'));
    this.shopTabThemes.addEventListener('click', () => this.switchShopTab('themes'));

    // Volume Sliders
    this.sliderMaster.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.audio.setMasterVolume(val);
      this.save.data.settings.masterVolume = val;
      this.save.save();
    });

    this.sliderMusic.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.audio.setMusicVolume(val);
      this.save.data.settings.musicVolume = val;
      this.save.save();
    });

    this.sliderSfx.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.audio.setSfxVolume(val);
      this.save.data.settings.sfxVolume = val;
      this.save.save();
    });
  }

  togglePause() {
    this.game.pause();
    if (this.game.gameState === 'paused') {
      this.modalPause.classList.remove('hidden');
    } else {
      this.modalPause.classList.add('hidden');
    }
  }

  triggerInput(side) {
    this.game.handleAttack(side);

    // Visual button ripple
    const btn = side === 'left' ? this.btnTouchLeft : this.btnTouchRight;
    btn.classList.add('active-tap');
    setTimeout(() => btn.classList.remove('active-tap'), 120);
  }

  startGame(mode, trackIdx) {
    this.screenMenu.classList.add('hidden');
    this.screenGame.classList.remove('hidden');
    this.screenSummary.classList.add('hidden');

    this.game.startStream(mode, trackIdx);
    this.updateChannelHeader();
  }

  showMenu() {
    this.screenGame.classList.add('hidden');
    this.screenMenu.classList.remove('hidden');
    this.updateChannelHeader();
    this.renderTrackList();
  }

  updateChannelHeader() {
    const subs = this.save.data.subscribers;
    this.channelSubscribers.textContent = `${this.formatNumber(subs)} Subs`;
    this.channelCoins.textContent = `$${this.save.data.coins.toLocaleString()}`;
  }

  renderTrackList() {
    const listEl = document.getElementById('career-track-list');
    if (!listEl) return;

    listEl.innerHTML = '';
    this.audio.tracks.forEach((track, idx) => {
      const progress = this.save.data.levelProgress[track.id] || { stars: 0, highScore: 0 };
      const card = document.createElement('div');
      card.className = 'track-card';
      card.innerHTML = `
        <div class="track-header">
          <span class="track-badge" style="background:${track.difficultyColor}22; color:${track.difficultyColor}; border:1px solid ${track.difficultyColor}66;">${track.difficulty} • ${track.bpm} BPM</span>
          <div class="track-stars">${'★'.repeat(progress.stars)}${'☆'.repeat(3 - progress.stars)}</div>
        </div>
        <div class="track-title">${track.title}</div>
        <div class="track-desc">${track.description}</div>
        <div class="track-footer">
          <span class="track-score">Best: ${progress.highScore.toLocaleString()} pts</span>
          <button class="btn-play-track" data-index="${idx}">STREAM THIS TRACK ⚡</button>
        </div>
      `;

      card.querySelector('.btn-play-track').addEventListener('click', (e) => {
        e.stopPropagation();
        this.audio.playClick();
        this.startGame('career', idx);
      });

      listEl.appendChild(card);
    });
  }

  updateHud(data) {
    // Score
    this.hudScore.textContent = data.score.toLocaleString();

    // Hearts
    this.hudHearts.innerHTML = '';
    for (let i = 0; i < data.maxHp; i++) {
      const heart = document.createElement('span');
      heart.className = i < data.hp ? 'heart full' : 'heart empty';
      heart.textContent = '❤️';
      this.hudHearts.appendChild(heart);
    }

    // Combo
    if (data.combo > 1) {
      this.hudComboContainer.classList.remove('hidden');
      this.hudComboNum.textContent = `${data.combo}x`;
      this.hudComboNum.style.transform = `scale(${1.0 + Math.min(0.5, data.combo * 0.015)})`;
    } else {
      this.hudComboContainer.classList.add('hidden');
    }

    // Fever gauge
    this.hudFeverBar.style.width = `${data.feverGauge}%`;
    if (data.feverGauge >= 100 || data.isFever) {
      this.hudFeverBtn.classList.remove('hidden');
      this.hudFeverBtn.classList.add('fever-ready');
      this.hudFeverBtn.textContent = data.isFever ? '⚡ OVERDRIVE ACTIVE! ⚡' : '⚡ TAP FOR FEVER! [SPACE]';
    } else {
      this.hudFeverBtn.classList.add('hidden');
      this.hudFeverBtn.classList.remove('fever-ready');
    }

    // Wave indicator
    this.hudWave.textContent = `WAVE ${data.wave}`;

    // Live Streamer metrics
    this.liveViewers.textContent = `${this.formatNumber(data.viewers)}`;
    this.liveLikes.textContent = `${this.formatNumber(data.likes)}`;

    // Timer
    const secs = Math.floor(this.streamer.streamTime);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    this.streamTimer.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    // Sync Chat Box
    this.renderChatMessages();
  }

  renderChatMessages() {
    if (!this.chatContainer) return;

    // Check if new messages added
    const currentCount = this.chatContainer.childElementCount;
    if (currentCount === this.streamer.chatMessages.length) return;

    this.chatContainer.innerHTML = '';
    for (const msg of this.streamer.chatMessages) {
      const el = document.createElement('div');
      if (msg.isSuperChat) {
        el.className = 'chat-message superchat';
        el.innerHTML = `
          <div class="sc-header">
            <span class="sc-badge">SUPER CHAT</span>
            <span class="sc-user" style="color:${msg.color}">${msg.username}</span>
            <span class="sc-amount">$${msg.amount}.00</span>
          </div>
          <div class="sc-text">${this.escapeHtml(msg.message)}</div>
        `;
      } else {
        el.className = 'chat-message';
        let badgeHtml = '';
        if (msg.badge === 'mod') badgeHtml = '<span class="badge badge-mod">MOD</span>';
        else if (msg.badge === 'sub') badgeHtml = '<span class="badge badge-sub">SUB</span>';
        else if (msg.badge === 'vip') badgeHtml = '<span class="badge badge-vip">VIP</span>';

        el.innerHTML = `
          ${badgeHtml}
          <span class="chat-user" style="color:${msg.color}">${msg.username}:</span>
          <span class="chat-text">${this.escapeHtml(msg.message)}</span>
        `;
      }
      this.chatContainer.appendChild(el);
    }

    // Auto-scroll to bottom of chat
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
  }

  showSummary(summary, isVictory) {
    this.screenSummary.classList.remove('hidden');

    const titleEl = document.getElementById('summary-title');
    const badgeEl = document.getElementById('summary-badge');
    const ratingEl = document.getElementById('summary-rating');
    const viewersEl = document.getElementById('summary-viewers');
    const subsEl = document.getElementById('summary-subs');
    const coinsEl = document.getElementById('summary-coins');
    const accuracyEl = document.getElementById('summary-accuracy');
    const comboEl = document.getElementById('summary-combo');

    titleEl.textContent = isVictory ? 'BROADCAST COMPLETE! 🏆' : 'STREAM CRASHED! 💥';
    badgeEl.textContent = isVictory ? 'EPIC STREAM VICTORY' : 'DEFEAT - STREAM OVER';
    badgeEl.className = isVictory ? 'summary-tag victory' : 'summary-tag defeat';

    ratingEl.textContent = summary.rating;
    viewersEl.textContent = this.formatNumber(summary.peakViewers);
    subsEl.textContent = `+${this.formatNumber(summary.subscribersGained)}`;
    coinsEl.textContent = `+$${summary.coinsEarned.toLocaleString()}`;
    accuracyEl.textContent = `${summary.accuracyPct}%`;
    comboEl.textContent = `${this.game.maxCombo}x`;

    this.updateChannelHeader();
  }

  // =========================================================================
  // SHOP LOGIC
  // =========================================================================

  openShop(tab = 'weapons') {
    this.screenShop.classList.remove('hidden');
    this.switchShopTab(tab);
    document.getElementById('shop-coins-display').textContent = `$${this.save.data.coins.toLocaleString()}`;
  }

  switchShopTab(tab) {
    [this.shopTabWeapons, this.shopTabHats, this.shopTabThemes].forEach(t => t.classList.remove('active'));
    this.shopItemsList.innerHTML = '';

    if (tab === 'weapons') {
      this.shopTabWeapons.classList.add('active');
      this.renderShopWeapons();
    } else if (tab === 'hats') {
      this.shopTabHats.classList.add('active');
      this.renderShopHats();
    } else if (tab === 'themes') {
      this.shopTabThemes.classList.add('active');
      this.renderShopThemes();
    }
  }

  renderShopWeapons() {
    const weapons = this.shop.getWeapons();
    weapons.forEach(w => {
      const card = document.createElement('div');
      card.className = `shop-item-card ${w.isSelected ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="shop-item-icon">${w.icon}</div>
        <div class="shop-item-name">${w.name}</div>
        <div class="shop-item-bonus">${w.bonus}</div>
        <div class="shop-item-desc">${w.description}</div>
        <div class="shop-item-action">
          ${w.isSelected
            ? '<button class="btn-shop btn-equipped" disabled>EQUIPPED ✓</button>'
            : (w.isUnlocked
              ? `<button class="btn-shop btn-equip" data-id="${w.id}">EQUIP</button>`
              : `<button class="btn-shop btn-buy" data-id="${w.id}" data-cost="${w.cost}" ${!w.canAfford ? 'disabled' : ''}>BUY $${w.cost.toLocaleString()}</button>`
            )
          }
        </div>
      `;

      const btnEquip = card.querySelector('.btn-equip');
      if (btnEquip) {
        btnEquip.addEventListener('click', () => {
          this.audio.playClick();
          this.save.setWeapon(w.id);
          this.renderShopWeapons();
          this.updateChannelHeader();
        });
      }

      const btnBuy = card.querySelector('.btn-buy');
      if (btnBuy) {
        btnBuy.addEventListener('click', () => {
          if (this.save.unlockWeapon(w.id, w.cost)) {
            this.audio.playSuperChat();
            this.save.setWeapon(w.id);
            document.getElementById('shop-coins-display').textContent = `$${this.save.data.coins.toLocaleString()}`;
            this.renderShopWeapons();
            this.updateChannelHeader();
          }
        });
      }

      this.shopItemsList.appendChild(card);
    });
  }

  renderShopHats() {
    const hats = this.shop.getHeadgears();
    hats.forEach(h => {
      const card = document.createElement('div');
      card.className = `shop-item-card ${h.isSelected ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="shop-item-icon">${h.icon}</div>
        <div class="shop-item-name">${h.name}</div>
        <div class="shop-item-desc">${h.description}</div>
        <div class="shop-item-action">
          ${h.isSelected
            ? '<button class="btn-shop btn-equipped" disabled>EQUIPPED ✓</button>'
            : (h.isUnlocked
              ? `<button class="btn-shop btn-equip" data-id="${h.id}">EQUIP</button>`
              : `<button class="btn-shop btn-buy" data-id="${h.id}" data-cost="${h.cost}" ${!h.canAfford ? 'disabled' : ''}>BUY $${h.cost.toLocaleString()}</button>`
            )
          }
        </div>
      `;

      const btnEquip = card.querySelector('.btn-equip');
      if (btnEquip) {
        btnEquip.addEventListener('click', () => {
          this.audio.playClick();
          this.save.setHeadgear(h.id);
          this.renderShopHats();
          this.updateChannelHeader();
        });
      }

      const btnBuy = card.querySelector('.btn-buy');
      if (btnBuy) {
        btnBuy.addEventListener('click', () => {
          if (this.save.unlockHeadgear(h.id, h.cost)) {
            this.audio.playSuperChat();
            this.save.setHeadgear(h.id);
            document.getElementById('shop-coins-display').textContent = `$${this.save.data.coins.toLocaleString()}`;
            this.renderShopHats();
            this.updateChannelHeader();
          }
        });
      }

      this.shopItemsList.appendChild(card);
    });
  }

  renderShopThemes() {
    const themes = this.shop.getThemes();
    themes.forEach(t => {
      const card = document.createElement('div');
      card.className = `shop-item-card ${t.isSelected ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="shop-item-icon">${t.icon}</div>
        <div class="shop-item-name">${t.name}</div>
        <div class="shop-item-desc">${t.description}</div>
        <div class="shop-item-action">
          ${t.isSelected
            ? '<button class="btn-shop btn-equipped" disabled>ACTIVE ✓</button>'
            : (t.isUnlocked
              ? `<button class="btn-shop btn-equip" data-id="${t.id}">ACTIVATE</button>`
              : `<button class="btn-shop btn-buy" data-id="${t.id}" data-cost="${t.cost}" ${!t.canAfford ? 'disabled' : ''}>BUY $${t.cost.toLocaleString()}</button>`
            )
          }
        </div>
      `;

      const btnEquip = card.querySelector('.btn-equip');
      if (btnEquip) {
        btnEquip.addEventListener('click', () => {
          this.audio.playClick();
          this.save.setTheme(t.id);
          this.renderShopThemes();
        });
      }

      const btnBuy = card.querySelector('.btn-buy');
      if (btnBuy) {
        btnBuy.addEventListener('click', () => {
          if (this.save.unlockTheme(t.id, t.cost)) {
            this.audio.playSuperChat();
            this.save.setTheme(t.id);
            document.getElementById('shop-coins-display').textContent = `$${this.save.data.coins.toLocaleString()}`;
            this.renderShopThemes();
          }
        });
      }

      this.shopItemsList.appendChild(card);
    });
  }

  formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
