// ============================================================================
// STICKTUBER STREAMING & LIVE CHAT SIMULATION
// High-energy chat, subscriber growth, viewer spikes, superchats, and tips
// ============================================================================

export class StreamerSystem {
  constructor() {
    this.viewers = 1250;
    this.targetViewers = 1250;
    this.peakViewers = 1250;
    this.subscribers = 10000;
    this.streamCoins = 0;
    this.streamLikes = 42;
    this.streamTime = 0; // seconds

    this.chatMessages = [];
    this.maxChatMessages = 25;
    this.chatTimer = 0;
    this.superChatQueue = [];

    // Pre-configured funny viewer usernames & chat presets
    this.usernames = [
      { name: 'CyberBlade99', badge: 'sub', color: '#00e5ff' },
      { name: 'NeonKitten', badge: 'vip', color: '#ff00aa' },
      { name: 'StickSama', badge: 'mod', color: '#00ff88' },
      { name: 'BeatDropGod', badge: 'sub', color: '#ffea00' },
      { name: 'QuantumGamer', badge: 'regular', color: '#ffffff' },
      { name: 'X_PixelWarrior_X', badge: 'sub', color: '#a855f7' },
      { name: 'Slayer_Tuber', badge: 'regular', color: '#ff7700' },
      { name: 'HyperDrive', badge: 'vip', color: '#00ffff' },
      { name: 'PogChampion', badge: 'mod', color: '#00ff88' },
      { name: 'LoFi_Ninja', badge: 'sub', color: '#ff4488' },
      { name: 'ZeroTwoFan', badge: 'regular', color: '#ff66aa' },
      { name: 'GlitchMaster', badge: 'vip', color: '#3b82f6' },
      { name: 'BrawlSensei', badge: 'sub', color: '#f59e0b' },
      { name: 'TwitchyStick', badge: 'regular', color: '#94a3b8' },
    ];

    this.generalChat = [
      'LETS GOOOOO STICKTUBER!',
      'W streamer today',
      'The EDM track is pure fire 🔥',
      'Who is producing this music?!',
      'Punch fight dance all night long!',
      'He makes it look so effortless',
      'Just dropped a like on the stream!',
      'Subscribed with Prime!',
      'Best combat rhythm game in the multiverse',
      'StickTuber never misses (usually)',
      'Look at that reaction speed!',
      'VIBING TO THIS BEAT 🎵',
      'Hit the boss with the katana!',
      'Bro is locked in right now',
    ];

    this.comboChat = [
      'POGGGERS THAT COMBO!!',
      'x{combo} STREAK?! ARE YOU KIDDING ME?',
      'Stick god is cracked today!!',
      'CLIP THAT RIGHT NOW!! 📽️',
      'Bro entered ultra instinct mode',
      'My eyes cannot track his hands!',
      'PERFECT AFTER PERFECT!',
      'HE DOES NOT MISS 🔥🔥🔥',
      'StickTuber is top 1 global for sure',
    ];

    this.missChat = [
      'KEKW whiffed the air!',
      'OOF the combo dropped!',
      'My grandma punches better than that whiff lol',
      'Did your mouse cable get caught?!',
      'F in the chat for the combo',
      'Reset the stream counter haha',
      'Shake it off king you got this!',
      'WHIFF DETECTED ⚠️',
    ];

    this.feverChat = [
      'SUPER SAIYAN STICKMAN LET\'S GOOOOO!! ⚡',
      'FEVER TIME HYPPPPEEEE!! 💥',
      'THE GOLDEN AURA IS INSANE!',
      'HE IS CLEARING THE ENTIRE SCREEN!',
      'MAXIMUM OVERDRIVE ACTIVATED!!',
      'SPAM THE CHAT BOYS 🚀🚀🚀',
    ];

    this.superChatDonors = [
      { name: 'CyberWhale_99', amount: 50, text: 'Keep dominating the arena! Here is $50 for the grind!' },
      { name: 'NeonValkyrie', amount: 20, text: 'That dragon kick was legendary! Love the stream!' },
      { name: 'PixelSamurai', amount: 100, text: 'TOP TIER FIGHTING! Donating $100 for the Katana upgrade!' },
      { name: 'Dr_BeatDrop', amount: 10, text: 'The rhythm sync is unreal. Great job StickTuber!' },
      { name: 'AnimeStickLord', amount: 25, text: 'Do the 1-inch punch next! PogChamp!' },
      { name: 'GigaChadStick', amount: 75, text: 'W stream, W music, W gameplay. Keep winning king!' },
    ];
  }

  reset() {
    this.viewers = 1250;
    this.targetViewers = 1250;
    this.peakViewers = 1250;
    this.streamCoins = 0;
    this.streamLikes = 42;
    this.streamTime = 0;
    this.chatMessages = [];
    this.superChatQueue = [];
    this.chatTimer = 0;

    // Seed initial greeting chat
    this.addChatMessage('StickSama', 'mod', '#00ff88', 'Welcome everyone to today\'s StickTuber live broadcast! Smash that like button!');
    this.addChatMessage('CyberBlade99', 'sub', '#00e5ff', 'Ready to watch the master at work! 🔥');
  }

  addChatMessage(username, badge, color, message, isSuperChat = false, amount = 0) {
    this.chatMessages.push({
      id: Math.random().toString(36).substr(2, 9),
      username,
      badge,
      color,
      message,
      isSuperChat,
      amount,
      timestamp: Date.now(),
    });

    if (this.chatMessages.length > this.maxChatMessages) {
      this.chatMessages.shift();
    }
  }

  // Trigger contextual chat on gameplay events
  triggerEvent(eventType, data = {}) {
    if (eventType === 'combo' && data.combo >= 15 && data.combo % 10 === 0) {
      const user = this.getRandomUser();
      const template = this.comboChat[Math.floor(Math.random() * this.comboChat.length)];
      const msg = template.replace('{combo}', data.combo);
      this.addChatMessage(user.name, user.badge, user.color, msg);

      // Spike viewers
      this.targetViewers += data.combo * 45;
      this.streamLikes += Math.floor(Math.random() * 8 + 3);
    }
    else if (eventType === 'miss') {
      const user = this.getRandomUser();
      const msg = this.missChat[Math.floor(Math.random() * this.missChat.length)];
      this.addChatMessage(user.name, user.badge, user.color, msg);

      // Minor viewer drop on whiff
      this.targetViewers = Math.max(1000, this.targetViewers - 80);
    }
    else if (eventType === 'fever') {
      for (let i = 0; i < 2; i++) {
        const user = this.getRandomUser();
        const msg = this.feverChat[Math.floor(Math.random() * this.feverChat.length)];
        this.addChatMessage(user.name, user.badge, user.color, msg);
      }
      this.targetViewers += 800;
      this.streamLikes += 25;
    }
    else if (eventType === 'boss_spawn') {
      this.addChatMessage('StickSama', 'mod', '#00ff88', '🚨 BOSS ALERT! Everyone spam the chat to give StickTuber energy!! 🚨');
      this.targetViewers += 1200;
    }
    else if (eventType === 'boss_defeated') {
      this.addChatMessage('PogChampion', 'mod', '#00ff88', 'BOSS DOWN!! WHAT AN ABSOLUTE LEGEND!! 🏆👑');
      this.targetViewers += 2500;
      this.streamLikes += 100;
      this.triggerSuperChat();
    }
    else if (eventType === 'superchat') {
      this.triggerSuperChat();
    }
  }

  triggerSuperChat() {
    const donor = this.superChatDonors[Math.floor(Math.random() * this.superChatDonors.length)];
    this.addChatMessage(donor.name, 'vip', '#ffaa00', donor.text, true, donor.amount);
    this.streamCoins += donor.amount;
    this.targetViewers += donor.amount * 15;
    this.streamLikes += 15;
    return donor;
  }

  getRandomUser() {
    return this.usernames[Math.floor(Math.random() * this.usernames.length)];
  }

  update(dt) {
    this.streamTime += dt;

    // Smooth viewer count interpolation
    const diff = this.targetViewers - this.viewers;
    this.viewers += diff * Math.min(1.0, 3.5 * dt);

    if (this.viewers > this.peakViewers) {
      this.peakViewers = Math.round(this.viewers);
    }

    // Periodic organic chat chatter
    this.chatTimer += dt;
    if (this.chatTimer >= 2.2 + Math.random() * 1.8) {
      this.chatTimer = 0;
      const user = this.getRandomUser();
      const msg = this.generalChat[Math.floor(Math.random() * this.generalChat.length)];
      this.addChatMessage(user.name, user.badge, user.color, msg);
    }

    // Chance for random organic superchat during high viewer counts
    if (Math.random() < 0.003 && this.viewers > 3000) {
      this.triggerSuperChat();
    }
  }

  calculateStreamSummary(totalScore, maxCombo, perfectHits, totalHits) {
    const accuracy = totalHits > 0 ? (perfectHits / totalHits) : 0;
    let rating = 'C';
    let subGain = Math.floor(totalScore / 18);

    if (accuracy >= 0.9 && maxCombo >= 50) {
      rating = 'S+';
      subGain = Math.floor(subGain * 2.2);
    } else if (accuracy >= 0.8 && maxCombo >= 30) {
      rating = 'S';
      subGain = Math.floor(subGain * 1.7);
    } else if (accuracy >= 0.65) {
      rating = 'A';
      subGain = Math.floor(subGain * 1.3);
    } else if (accuracy >= 0.45) {
      rating = 'B';
    }

    const coinReward = this.streamCoins + Math.floor(totalScore / 35);

    return {
      peakViewers: Math.round(this.peakViewers),
      finalViewers: Math.round(this.viewers),
      likes: this.streamLikes,
      subscribersGained: subGain,
      coinsEarned: coinReward,
      accuracyPct: Math.round(accuracy * 100),
      rating,
      streamDuration: Math.round(this.streamTime),
    };
  }
}
