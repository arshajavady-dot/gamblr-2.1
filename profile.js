/* ==========================================================================
   gamblr - User Profile & Account Authentication Engine
   With Username Availability & Profanity/Slur Filter
   ========================================================================== */

class ProfileManager {
  constructor() {
    this.sessionKey = 'gamblr_current_session';
    this.dbKey = 'gamblr_accounts_db';

    this.profile = {
      username: 'Guest',
      avatar: '👤',
      isLoggedIn: false
    };

    // Profanity & Slur Blacklist (Normalized check for leetspeak)
    this.slurList = [
      'nigger', 'nigga', 'faggot', 'fag', 'retard', 'kike', 'spic', 'chink',
      'cunt', 'whore', 'slut', 'bastard', 'bitch', 'fuck', 'shit', 'pussy',
      'dick', 'cock', 'asshole', 'penis', 'vagina'
    ];

    this.modal = null;
    this.btnProfile = null;
    this.avatarDisplay = null;
    this.nameDisplay = null;
  }

  init() {
    this.loadSession();

    this.modal = document.getElementById('profile-modal');
    this.btnProfile = document.getElementById('btn-profile');
    this.avatarDisplay = document.getElementById('profile-avatar-display');
    this.nameDisplay = document.getElementById('profile-name-display');

    if (this.btnProfile) {
      this.btnProfile.addEventListener('click', () => this.openModal());
    }

    const headerLvlBadge = document.getElementById('header-level-badge');
    if (headerLvlBadge) {
      headerLvlBadge.addEventListener('click', () => this.openStatsModal());
    }

    const btnClose = document.getElementById('btn-close-profile');
    if (btnClose) {
      btnClose.addEventListener('click', () => this.closeModal());
    }

    const btnCloseStats = document.getElementById('btn-close-stats-modal');
    if (btnCloseStats) {
      btnCloseStats.addEventListener('click', () => this.closeStatsModal());
    }

    const statsModal = document.getElementById('stats-modal');
    if (statsModal) {
      statsModal.addEventListener('click', (e) => {
        if (e.target === statsModal) this.closeStatsModal();
      });
    }

    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) this.closeModal();
      });
    }

    // Auth Tab Switchers
    const tabs = document.querySelectorAll('.auth-tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const targetView = tab.getAttribute('data-tab');
        document.querySelectorAll('.auth-tab-view').forEach(v => v.classList.remove('active'));
        const activeView = document.getElementById(`auth-view-${targetView}`);
        if (activeView) activeView.classList.add('active');
        this.clearAlert();
      });
    });

    // Form Event Listeners
    const btnLoginSubmit = document.getElementById('btn-login-submit');
    if (btnLoginSubmit) {
      btnLoginSubmit.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }

    const btnRegisterSubmit = document.getElementById('btn-register-submit');
    if (btnRegisterSubmit) {
      btnRegisterSubmit.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleRegister();
      });
    }

    const btnGuestMode = document.getElementById('btn-guest-mode');
    if (btnGuestMode) {
      btnGuestMode.addEventListener('click', () => this.setGuestMode());
    }

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => this.setGuestMode());
    }

    const btnSaveAvatar = document.getElementById('btn-save-avatar');
    if (btnSaveAvatar) {
      btnSaveAvatar.addEventListener('click', () => this.saveAvatarOnly());
    }

    const btnExportSync = document.getElementById('btn-export-sync');
    if (btnExportSync) {
      btnExportSync.addEventListener('click', () => this.handleExportSync());
    }

    const btnImportSync = document.getElementById('btn-import-sync');
    if (btnImportSync) {
      btnImportSync.addEventListener('click', () => this.handleImportSync());
    }

    // Avatar Picker Grid listeners
    const avatarBtns = document.querySelectorAll('.avatar-option');
    avatarBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        avatarBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.profile.avatar = btn.getAttribute('data-avatar') || '👤';
        const preview = document.getElementById('modal-avatar-preview');
        if (preview) preview.textContent = this.profile.avatar;
      });
    });

    this.updateHeaderUI();
    this.notifyAccountChange();
  }

  // Check username against slurs & profanity
  validateUsername(username) {
    if (!username || username.trim().length < 3) {
      return { valid: false, message: 'Username must be at least 3 characters long!' };
    }

    if (username.trim().length > 16) {
      return { valid: false, message: 'Username cannot exceed 16 characters!' };
    }

    // Normalize leetspeak (0->o, 1->i, 3->e, 4->a, 5->s, 7->t, @->a, $->s, !->i)
    let normalized = username.toLowerCase()
      .replace(/0/g, 'o')
      .replace(/1/g, 'i')
      .replace(/!/g, 'i')
      .replace(/3/g, 'e')
      .replace(/4/g, 'a')
      .replace(/@/g, 'a')
      .replace(/5/g, 's')
      .replace(/\$/g, 's')
      .replace(/7/g, 't')
      .replace(/[^a-z]/g, '');

    for (let slur of this.slurList) {
      if (normalized.includes(slur)) {
        return { valid: false, message: '⚠️ Username contains inappropriate words or slurs!' };
      }
    }

    return { valid: true };
  }

  // Load Accounts Database (Local)
  getAccountsDB() {
    try {
      const data = localStorage.getItem(this.dbKey);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  saveAccountsDB(db) {
    try {
      localStorage.setItem(this.dbKey, JSON.stringify(db));
    } catch (e) {}
  }

  // Cloud Database Sync Methods (Firebase REST Endpoint)
  async fetchFromCloudDB(key) {
    try {
      const res = await fetch(`https://gamblr-casino-default-rtdb.firebaseio.com/accounts/${key}.json`);
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (e) {
      console.warn('Cloud DB fetch warning:', e);
    }
    return null;
  }

  async saveToCloudDB(key, accountData) {
    try {
      await fetch(`https://gamblr-casino-default-rtdb.firebaseio.com/accounts/${key}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountData)
      });
    } catch (e) {
      console.warn('Cloud DB save warning:', e);
    }
  }

  async syncStatsToCloud(userKey, gameKey, statsObj) {
    if (!userKey || userKey === 'guest') return;
    try {
      await fetch(`https://gamblr-casino-default-rtdb.firebaseio.com/accounts/${userKey}/stats/${gameKey}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statsObj)
      });
    } catch (e) {}
  }

  loadSession() {
    try {
      const data = localStorage.getItem(this.sessionKey);
      if (data) {
        this.profile = Object.assign(this.profile, JSON.parse(data));
      }
    } catch (e) {}
  }

  saveSession() {
    try {
      localStorage.setItem(this.sessionKey, JSON.stringify(this.profile));
    } catch (e) {}
    this.updateHeaderUI();
    this.notifyAccountChange();
  }

  getGameStats(gameKey, defaultStats) {
    const userKey = this.profile.isLoggedIn ? this.profile.username.toLowerCase() : 'guest';
    if (this.profile.isLoggedIn) {
      const db = this.getAccountsDB();
      if (db[userKey] && db[userKey].stats && db[userKey].stats[gameKey]) {
        return Object.assign({}, defaultStats, db[userKey].stats[gameKey]);
      }
    } else {
      try {
        const guestData = localStorage.getItem(`gamblr_guest_stats_${gameKey}`);
        if (guestData) return Object.assign({}, defaultStats, JSON.parse(guestData));
      } catch (e) {}
    }
    return Object.assign({}, defaultStats);
  }

  saveGameStats(gameKey, statsObj) {
    const userKey = this.profile.isLoggedIn ? this.profile.username.toLowerCase() : 'guest';
    if (this.profile.isLoggedIn) {
      const db = this.getAccountsDB();
      if (!db[userKey]) {
        db[userKey] = { username: this.profile.username, stats: {} };
      }
      if (!db[userKey].stats) db[userKey].stats = {};
      db[userKey].stats[gameKey] = statsObj;
      this.saveAccountsDB(db);
      // Async Cloud Sync
      this.syncStatsToCloud(userKey, gameKey, statsObj);
    } else {
      try {
        localStorage.setItem(`gamblr_guest_stats_${gameKey}`, JSON.stringify(statsObj));
      } catch (e) {}
    }
  }

  notifyAccountChange() {
    const managers = [
      window.coinFlipManager,
      window.magic8BallManager,
      window.spinWheelManager,
      window.rouletteManager,
      window.slotsManager,
      window.diceManager,
      window.cookieManager,
      window.rpsManager,
      window.cardsManager,
      window.minesManager,
      window.plinkoManager,
      window.raceManager
    ];

    managers.forEach(mgr => {
      if (mgr && typeof mgr.loadStats === 'function') {
        mgr.loadStats();
        if (typeof mgr.updateStatsUI === 'function') {
          mgr.updateStatsUI();
        }
      }
    });
  }

  checkAchievements() {
    if (!this.profile.unlockedBadges) this.profile.unlockedBadges = {};

    const coinStats = this.getGameStats('coin', {});
    const slotsStats = this.getGameStats('slots', {});
    const minesStats = this.getGameStats('mines', {});
    const eightballStats = this.getGameStats('8ball', {});
    const rpsStats = this.getGameStats('rps', {});
    const cardsStats = this.getGameStats('cards', {});
    const plinkoStats = this.getGameStats('plinko', {});
    const raceStats = this.getGameStats('race', {});

    const BADGES = [
      { id: 'first_win', title: 'First Victory', desc: 'Earn 50 XP / Win any game', icon: '🏆', check: () => (this.profile.xp || 0) >= 50 },
      { id: 'coin_master', title: 'Coin Master', desc: 'Win 5 Coin Flips', icon: '🪙', check: () => (Number(coinStats.wins) || 0) >= 5 },
      { id: 'jackpot_king', title: 'Jackpot King', desc: 'Hit a Slot Machine Jackpot', icon: '🎰', check: () => (Number(slotsStats.jackpots) || 0) >= 1 },
      { id: 'mine_sweeper', title: 'Mine Sweeper', desc: 'Cash out 3 Mines games', icon: '💣', check: () => (Number(minesStats.wins) || 0) >= 3 },
      { id: 'high_roller', title: 'High Roller', desc: 'Reach Casino Level 5', icon: '🚀', check: () => (this.profile.level || 1) >= 5 },
      // 10 NEW HARD / ELITE ACHIEVEMENTS
      { id: 'coin_god', title: 'Coin Titan', desc: 'Win 50 Coin Flips total', icon: '👑', check: () => (Number(coinStats.wins) || 0) >= 50 },
      { id: 'streak_legend', title: 'Streak Legend', desc: 'Achieve a 5-Win Streak on Coin Flip', icon: '🔥', check: () => (Number(coinStats.bestStreak) || 0) >= 5 },
      { id: 'slot_addict', title: 'Slot Machine Addict', desc: 'Spin the Slot Machine 100 times', icon: '🍒', check: () => (Number(slotsStats.totalSpins) || 0) >= 100 },
      { id: 'oracle_master', title: 'Oracle Whisperer', desc: 'Consult the Magic 8-Ball 25 times', icon: '🔮', check: () => (Number(eightballStats.total) || 0) >= 25 },
      { id: 'rps_grandmaster', title: 'RPS Grandmaster', desc: 'Win 15 Rock Paper Scissors matches', icon: '✊', check: () => (Number(rpsStats.wins) || 0) >= 15 },
      { id: 'card_shark', title: 'Card Shark', desc: 'Achieve a 5-Card Streak in Higher/Lower', icon: '🃏', check: () => (Number(cardsStats.bestStreak) || 0) >= 5 },
      { id: 'mine_field_god', title: 'Minefield Demolisher', desc: 'Win 10 Cyber Mines cashouts', icon: '💥', check: () => (Number(minesStats.wins) || 0) >= 10 },
      { id: 'plinko_rainmaker', title: 'Plinko Rainmaker', desc: 'Drop 50 Plinko balls on the board', icon: '🔵', check: () => (Number(plinkoStats.totalDrops) || 0) >= 50 },
      { id: 'derby_champion', title: 'Derby Champion', desc: 'Win 10 Animal Races', icon: '🏇', check: () => (Number(raceStats.wins) || 0) >= 10 },
      { id: 'casino_tycoon', title: 'Casino Tycoon', desc: 'Reach Level 10 or 2,500 Total XP', icon: '💎', check: () => (this.profile.level || 1) >= 10 || (this.profile.xp || 0) >= 2500 }
    ];

    BADGES.forEach(b => {
      if (!this.profile.unlockedBadges[b.id] && b.check()) {
        this.profile.unlockedBadges[b.id] = true;
        this.saveSession();
        this.showAchievementToast(b.title, b.icon);
        if (window.soundEngine && window.soundEngine.playCoinWin) {
          window.soundEngine.playCoinWin();
        }
      }
    });
  }

  showAchievementToast(title, icon) {
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        <span class="toast-tag">ACHIEVEMENT UNLOCKED!</span>
        <h4 class="toast-title">${title}</h4>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 50);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }

  triggerWinEffect(cardElement) {
    if (!cardElement) {
      cardElement = document.querySelector('.view-panel.active .game-card') || document.querySelector('.view-panel.active .card-glass');
    }
    if (cardElement) {
      cardElement.classList.remove('win-card-burst');
      void cardElement.offsetWidth;
      cardElement.classList.add('win-card-burst');
      setTimeout(() => cardElement.classList.remove('win-card-burst'), 1000);

      const rect = cardElement.getBoundingClientRect();
      const startX = rect.left + rect.width / 2;
      const startY = rect.top + rect.height / 3;

      // Target position: Mouse cursor position (or fallback to XP badge if cursor static)
      const targetX = window.currentMouseX || (window.innerWidth - 180);
      const targetY = window.currentMouseY || 35;

      for (let i = 0; i < 22; i++) {
        const coin = document.createElement('div');
        coin.className = 'victory-burst-coin';
        coin.textContent = Math.random() > 0.4 ? '🪙' : Math.random() > 0.5 ? '⭐' : '👑';

        // 1. Initial burst outwards
        const angle = Math.random() * Math.PI * 2;
        const burstDist = Math.random() * 140 + 70;
        const burstX = startX + Math.cos(angle) * burstDist;
        const burstY = startY + Math.sin(angle) * burstDist - 50;

        coin.style.left = `${startX}px`;
        coin.style.top = `${startY}px`;

        document.body.appendChild(coin);

        // Stage 1: Explode outward
        requestAnimationFrame(() => {
          coin.style.transition = 'all 0.32s cubic-bezier(0.1, 0.8, 0.2, 1)';
          coin.style.left = `${burstX}px`;
          coin.style.top = `${burstY}px`;
          coin.style.transform = 'translate(-50%, -50%) scale(1.4) rotate(180deg)';

          // Stage 2: Magnetically fly directly into your mouse cursor!
          setTimeout(() => {
            const currentMouseX = window.currentMouseX || targetX;
            const currentMouseY = window.currentMouseY || targetY;

            coin.style.transition = 'all 0.42s cubic-bezier(0.5, 0, 0.8, 1)';
            coin.style.left = `${currentMouseX}px`;
            coin.style.top = `${currentMouseY}px`;
            coin.style.transform = 'translate(-50%, -50%) scale(0.2) rotate(360deg)';
            coin.style.opacity = '0.1';

            setTimeout(() => coin.remove(), 420);
          }, 320 + i * 25); // Staggered collection rhythm!
        });
      }
    }
  }

  triggerLoseEffect(cardElement) {
    if (!cardElement) {
      cardElement = document.querySelector('.view-panel.active .game-card') || document.querySelector('.view-panel.active .card-glass');
    }
    if (cardElement) {
      cardElement.classList.remove('lose-card-glitch');
      void cardElement.offsetWidth;
      cardElement.classList.add('lose-card-glitch');
      setTimeout(() => cardElement.classList.remove('lose-card-glitch'), 600);

      // Heavy 65-Particle Defeat Confetti Rain
      const colors = ['#ff3366', '#ff0055', '#990033', '#44001a', '#aa0000', '#ff4d4d', '#7209b7'];
      
      for (let i = 0; i < 65; i++) {
        const confetti = document.createElement('div');
        const isEmoji = Math.random() < 0.28;
        
        if (isEmoji) {
          confetti.className = 'defeat-emoji-particle';
          confetti.textContent = Math.random() > 0.4 ? '💀' : Math.random() > 0.5 ? '💥' : '❌';
        } else {
          confetti.className = 'defeat-confetti-piece';
          confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
          confetti.style.width = `${Math.random() * 10 + 6}px`;
          confetti.style.height = `${Math.random() * 16 + 10}px`;
        }

        const startX = Math.random() * window.innerWidth;
        const delay = Math.random() * 0.45;
        const duration = Math.random() * 1.4 + 1.2;
        const rotation = Math.random() * 720 - 360;

        confetti.style.left = `${startX}px`;
        confetti.style.top = `-30px`;
        confetti.style.animationDelay = `${delay}s`;
        confetti.style.animationDuration = `${duration}s`;
        confetti.style.setProperty('--rot', `${rotation}deg`);

        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), (delay + duration) * 1000 + 100);
      }
    }
  }

  addXP(amount, clientX, clientY) {
    if (!this.profile.xp) this.profile.xp = 0;
    this.profile.xp += amount;

    const currentLevel = Math.floor(Math.sqrt(this.profile.xp / 40)) + 1;
    const oldLevel = this.profile.level || 1;
    this.profile.level = currentLevel;

    if (currentLevel > oldLevel) {
      this.showAlert(`🎉 LEVEL UP! You reached Level ${currentLevel}!`, false);
      if (window.soundEngine && window.soundEngine.playCoinWin) {
        window.soundEngine.playCoinWin();
      }
    }

    this.triggerWinEffect();

    this.checkAchievements();
    this.saveSession();
    this.updateHeaderUI();

    if (clientX && clientY) {
      this.spawnXPPopup(`+${amount} XP`, clientX, clientY);
    } else {
      this.spawnXPPopup(`+${amount} XP`, window.innerWidth / 2, window.innerHeight / 3);
    }
  }

  spawnXPPopup(text, x, y) {
    const pop = document.createElement('div');
    pop.className = 'xp-floating-popup';
    pop.textContent = text;
    pop.style.left = `${x}px`;
    pop.style.top = `${y}px`;
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 1200);
  }

  updateHeaderUI() {
    if (this.avatarDisplay) this.avatarDisplay.textContent = this.profile.avatar;
    if (this.nameDisplay) {
      this.nameDisplay.textContent = this.profile.username;
    }

    const lvlText = document.getElementById('user-level-text');
    const xpBar = document.getElementById('user-xp-bar');
    if (lvlText) lvlText.textContent = `LVL ${this.profile.level || 1}`;
    if (xpBar) {
      const currentXP = this.profile.xp || 0;
      const currentLvl = this.profile.level || 1;
      const prevLvlXP = Math.pow(currentLvl - 1, 2) * 40;
      const nextLvlXP = Math.pow(currentLvl, 2) * 40;
      const pct = Math.min(100, Math.max(0, ((currentXP - prevLvlXP) / (nextLvlXP - prevLvlXP)) * 100));
      xpBar.style.width = `${pct}%`;
    }
  }

  showAlert(message, isError = true) {
    const alertBox = document.getElementById('auth-alert-box');
    if (alertBox) {
      alertBox.textContent = message;
      alertBox.className = `auth-alert-box ${isError ? 'alert-error' : 'alert-success'}`;
      alertBox.classList.remove('hidden');
    }
  }

  clearAlert() {
    const alertBox = document.getElementById('auth-alert-box');
    if (alertBox) {
      alertBox.classList.add('hidden');
    }
  }

  async handleRegister() {
    this.clearAlert();
    const userIn = document.getElementById('reg-username');
    const passIn = document.getElementById('reg-password');
    const passConf = document.getElementById('reg-password-confirm');

    const username = userIn ? userIn.value.trim() : '';
    const password = passIn ? passIn.value : '';
    const confirm = passConf ? passConf.value : '';

    // 1. Validate username profanity & slurs
    const valResult = this.validateUsername(username);
    if (!valResult.valid) {
      this.showAlert(valResult.message, true);
      return;
    }

    if (username.toLowerCase() === 'guest') {
      this.showAlert('Cannot use "Guest" as a registered account name!', true);
      return;
    }

    if (!password || password.length < 4) {
      this.showAlert('Password must be at least 4 characters long!', true);
      return;
    }

    if (password !== confirm) {
      this.showAlert('Passwords do not match!', true);
      return;
    }

    this.showAlert('⏳ Checking username availability on Cloud...', false);

    // 2. Check if username taken locally OR on Cloud
    const db = this.getAccountsDB();
    const key = username.toLowerCase();

    if (db[key]) {
      this.showAlert(`⚠️ The username "${username}" is already taken! Please choose another.`, true);
      return;
    }

    const cloudCheck = await this.fetchFromCloudDB(key);
    if (cloudCheck) {
      this.showAlert(`⚠️ The username "${username}" is already registered on Cloud! Please choose another.`, true);
      return;
    }

    // 3. Register user account locally & on Cloud
    const accountData = {
      username: username,
      password: password,
      avatar: this.profile.avatar || '👤',
      createdAt: new Date().toISOString(),
      stats: {}
    };

    db[key] = accountData;
    this.saveAccountsDB(db);
    await this.saveToCloudDB(key, accountData);

    // 4. Log in new user
    this.profile.username = username;
    this.profile.isLoggedIn = true;
    this.saveSession();

    this.showAlert(`🎉 Account created & synced to Cloud! Welcome, ${username}.`, false);
    setTimeout(() => {
      this.closeModal();
    }, 1200);
  }

  async handleLogin() {
    this.clearAlert();
    const userIn = document.getElementById('login-username');
    const passIn = document.getElementById('login-password');

    const username = userIn ? userIn.value.trim() : '';
    const password = passIn ? passIn.value : '';

    if (!username || !password) {
      this.showAlert('Please enter both username and password!', true);
      return;
    }

    this.showAlert('⏳ Logging in & Syncing from Cloud...', false);

    const db = this.getAccountsDB();
    const key = username.toLowerCase();
    let account = db[key];

    // If not found locally, fetch from Cloud DB
    if (!account) {
      const cloudAccount = await this.fetchFromCloudDB(key);
      if (cloudAccount) {
        account = cloudAccount;
        db[key] = cloudAccount;
        this.saveAccountsDB(db);
      }
    } else {
      // Sync latest cloud stats if available
      const cloudAccount = await this.fetchFromCloudDB(key);
      if (cloudAccount && cloudAccount.password === password) {
        account = cloudAccount;
        db[key] = cloudAccount;
        this.saveAccountsDB(db);
      }
    }

    if (!account || account.password !== password) {
      this.showAlert('Invalid username or password!', true);
      return;
    }

    // Successful login
    this.profile.username = account.username;
    this.profile.avatar = account.avatar || '👑';
    this.profile.isLoggedIn = true;
    this.saveSession();

    this.showAlert(`⚡ Logged in successfully via Cloud Sync! Welcome back, ${account.username}.`, false);
    setTimeout(() => {
      this.closeModal();
    }, 1000);
  }

  setGuestMode() {
    this.profile.username = 'Guest';
    this.profile.avatar = '👤';
    this.profile.isLoggedIn = false;
    this.saveSession();
    this.showAlert('Playing as Guest.', false);
    setTimeout(() => {
      this.closeModal();
    }, 800);
  }

  saveAvatarOnly() {
    if (this.profile.isLoggedIn) {
      const db = this.getAccountsDB();
      const key = this.profile.username.toLowerCase();
      if (db[key]) {
        db[key].avatar = this.profile.avatar;
        this.saveAccountsDB(db);
      }
    }
    this.saveSession();
    this.showAlert('Avatar updated!', false);
    setTimeout(() => {
      this.closeModal();
    }, 800);
  }

  handleExportSync() {
    if (!this.profile.isLoggedIn) {
      this.showAlert('Please log in to export your account sync code!', true);
      return;
    }

    const db = this.getAccountsDB();
    const userKey = this.profile.username.toLowerCase();
    const accountObj = db[userKey];

    if (!accountObj) {
      this.showAlert('Account data not found!', true);
      return;
    }

    try {
      const jsonStr = JSON.stringify(accountObj);
      const b64 = btoa(encodeURIComponent(jsonStr));
      const syncToken = `GAMBLR-SYNC-${b64}`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(syncToken).then(() => {
          this.showAlert('📋 Sync key copied to clipboard! Paste it on your second device.', false);
        }).catch(() => {
          prompt('Copy your Device Sync Key below:', syncToken);
        });
      } else {
        prompt('Copy your Device Sync Key below:', syncToken);
      }
    } catch (e) {
      this.showAlert('Failed to generate sync code!', true);
    }
  }

  handleImportSync() {
    const input = document.getElementById('import-sync-code');
    const rawVal = input ? input.value.trim() : '';

    if (!rawVal) {
      this.showAlert('Please paste a GAMBLR-SYNC- code first!', true);
      return;
    }

    if (!rawVal.startsWith('GAMBLR-SYNC-')) {
      this.showAlert('Invalid Sync Code format! Must start with "GAMBLR-SYNC-"', true);
      return;
    }

    try {
      const b64 = rawVal.replace('GAMBLR-SYNC-', '').trim();
      const jsonStr = decodeURIComponent(atob(b64));
      const accountData = JSON.parse(jsonStr);

      if (!accountData.username || !accountData.password) {
        this.showAlert('Corrupted or invalid Sync Code!', true);
        return;
      }

      const db = this.getAccountsDB();
      const userKey = accountData.username.toLowerCase();
      db[userKey] = accountData;
      this.saveAccountsDB(db);

      // Async Cloud sync push so it's backed up on cloud database too
      this.saveToCloudDB(userKey, accountData);

      // Log in
      this.profile.username = accountData.username;
      this.profile.avatar = accountData.avatar || '👑';
      this.profile.isLoggedIn = true;
      this.saveSession();

      this.showAlert(`🎉 Account & Stats imported! Welcome, ${accountData.username}!`, false);
      if (input) input.value = '';
      setTimeout(() => {
        this.closeModal();
      }, 1000);
    } catch (e) {
      this.showAlert('Failed to import Sync Code. Check that the full code was pasted.', true);
    }
  }

  openModal() {
    if (!this.modal) return;
    this.clearAlert();

    const title = document.getElementById('modal-username-title');
    const badge = document.getElementById('modal-user-badge');
    const preview = document.getElementById('modal-avatar-preview');

    if (title) title.textContent = this.profile.username;
    if (preview) preview.textContent = this.profile.avatar;

    if (badge) {
      if (this.profile.isLoggedIn) {
        badge.textContent = 'HIGH ROLLER ACCOUNT';
        badge.className = 'badge-logged-in';
      } else {
        badge.textContent = 'GUEST MODE';
        badge.className = 'badge-guest';
      }
    }

    // Highlight active tab
    const defaultTab = this.profile.isLoggedIn ? 'profile' : 'login';
    const tabBtns = document.querySelectorAll('.auth-tab-btn');
    tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === defaultTab);
    });

    document.querySelectorAll('.auth-tab-view').forEach(v => {
      v.classList.toggle('active', v.id === `auth-view-${defaultTab}`);
    });

    // Highlight current avatar
    const avatarBtns = document.querySelectorAll('.avatar-option');
    avatarBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-avatar') === this.profile.avatar);
    });

    this.modal.classList.remove('hidden');
  }

  openStatsModal() {
    const modal = document.getElementById('stats-modal');
    if (!modal) return;

    // 0. Auto-eval achievements
    this.checkAchievements();

    // 1. Calculate Level & XP
    const currentXP = this.profile.xp || 0;
    const currentLvl = this.profile.level || 1;
    const prevLvlXP = Math.pow(currentLvl - 1, 2) * 40;
    const nextLvlXP = Math.pow(currentLvl, 2) * 40;
    const xpInLvl = currentXP - prevLvlXP;
    const xpReq = nextLvlXP - prevLvlXP;
    const pct = Math.min(100, Math.max(0, Math.round((xpInLvl / xpReq) * 100)));

    const elLevel = document.getElementById('career-modal-level');
    const elXPText = document.getElementById('career-modal-xp-text');
    const elXPBar = document.getElementById('career-modal-xp-bar');

    if (elLevel) elLevel.textContent = `LEVEL ${currentLvl}`;
    if (elXPText) elXPText.textContent = `${currentXP} Total XP • ${xpInLvl}/${xpReq} to Level ${currentLvl + 1} (${pct}%)`;
    if (elXPBar) elXPBar.style.width = `${pct}%`;

    // 2. Aggregate Wins & Losses across modes
    const gameKeys = [
      { key: 'coin', name: 'Coin Flip', icon: '🪙' },
      { key: 'slots', name: 'Slot Machine', icon: '🎰' },
      { key: 'rps', name: 'Rock Paper Scissors', icon: '✊' },
      { key: 'cards', name: 'Higher or Lower', icon: '🃏' },
      { key: 'mines', name: 'Cyber Mines', icon: '💣' },
      { key: 'plinko', name: 'Plinko', icon: '🔵' },
      { key: 'race', name: 'Animal Racing', icon: '🏇' }
    ];

    let grandWins = 0;
    let grandLosses = 0;
    let breakdownHTML = '';

    gameKeys.forEach(g => {
      const stats = this.getGameStats(g.key, {});
      let wins = 0;
      let losses = 0;

      if (g.key === 'coin') {
        wins = stats.wins || 0;
        losses = (stats.totalFlips || 0) - wins;
      } else if (g.key === 'slots') {
        wins = stats.wins || 0;
        losses = (stats.totalSpins || 0) - wins;
      } else if (g.key === 'rps') {
        wins = stats.wins || 0;
        losses = stats.losses || 0;
      } else if (g.key === 'cards') {
        wins = stats.bestStreak || 0;
        losses = stats.games || 0;
      } else if (g.key === 'mines') {
        wins = stats.wins || 0;
        losses = stats.losses || 0;
      } else if (g.key === 'plinko') {
        wins = stats.wins || 0;
        losses = (stats.totalDrops || 0) - wins;
      } else if (g.key === 'race') {
        wins = stats.wins || 0;
        losses = (stats.totalRaces || 0) - wins;
      }

      if (losses < 0) losses = 0;

      grandWins += wins;
      grandLosses += losses;

      const total = wins + losses;
      const gameWinRate = total > 0 ? Math.round((wins / total) * 100) : 0;

      breakdownHTML += `
        <div class="breakdown-row">
          <div class="breakdown-game"><span class="game-icon">${g.icon}</span> ${g.name}</div>
          <div class="breakdown-stats">
            <span class="win-count">${wins}</span> / <span class="loss-count">${losses}</span>
            <span class="pct-pill">${gameWinRate}%</span>
          </div>
        </div>
      `;
    });

    const grandTotal = grandWins + grandLosses;
    const overallPct = grandTotal > 0 ? Math.round((grandWins / grandTotal) * 100) : 0;

    const elWins = document.getElementById('career-total-wins');
    const elLosses = document.getElementById('career-total-losses');
    const elWinPct = document.getElementById('career-win-pct');
    const elBreakdown = document.getElementById('game-breakdown-list');

    if (elWins) elWins.textContent = grandWins;
    if (elLosses) elLosses.textContent = grandLosses;
    if (elWinPct) elWinPct.textContent = `${overallPct}%`;
    if (elBreakdown) elBreakdown.innerHTML = breakdownHTML;

    // 3. Render Achievements Grid
    const coinStats = this.getGameStats('coin', {});
    const slotsStats = this.getGameStats('slots', {});
    const minesStats = this.getGameStats('mines', {});
    const eightballStats = this.getGameStats('8ball', {});
    const rpsStats = this.getGameStats('rps', {});
    const cardsStats = this.getGameStats('cards', {});
    const plinkoStats = this.getGameStats('plinko', {});
    const raceStats = this.getGameStats('race', {});

    const BADGES = [
      { id: 'first_win', title: 'First Victory', desc: 'Earn 50 XP / Win any game', icon: '🏆', check: () => (this.profile.xp || 0) >= 50 },
      { id: 'coin_master', title: 'Coin Master', desc: 'Win 5 Coin Flips', icon: '🪙', check: () => (Number(coinStats.wins) || 0) >= 5 },
      { id: 'jackpot_king', title: 'Jackpot King', desc: 'Hit a Slot Machine Jackpot', icon: '🎰', check: () => (Number(slotsStats.jackpots) || 0) >= 1 },
      { id: 'mine_sweeper', title: 'Mine Sweeper', desc: 'Cash out 3 Mines games', icon: '💣', check: () => (Number(minesStats.wins) || 0) >= 3 },
      { id: 'high_roller', title: 'High Roller', desc: 'Reach Casino Level 5', icon: '🚀', check: () => (this.profile.level || 1) >= 5 },
      // 10 NEW HARD / ELITE ACHIEVEMENTS
      { id: 'coin_god', title: 'Coin Titan', desc: 'Win 50 Coin Flips total', icon: '👑', check: () => (Number(coinStats.wins) || 0) >= 50 },
      { id: 'streak_legend', title: 'Streak Legend', desc: 'Achieve a 5-Win Streak on Coin Flip', icon: '🔥', check: () => (Number(coinStats.bestStreak) || 0) >= 5 },
      { id: 'slot_addict', title: 'Slot Machine Addict', desc: 'Spin the Slot Machine 100 times', icon: '🍒', check: () => (Number(slotsStats.totalSpins) || 0) >= 100 },
      { id: 'oracle_master', title: 'Oracle Whisperer', desc: 'Consult the Magic 8-Ball 25 times', icon: '🔮', check: () => (Number(eightballStats.total) || 0) >= 25 },
      { id: 'rps_grandmaster', title: 'RPS Grandmaster', desc: 'Win 15 Rock Paper Scissors matches', icon: '✊', check: () => (Number(rpsStats.wins) || 0) >= 15 },
      { id: 'card_shark', title: 'Card Shark', desc: 'Achieve a 5-Card Streak in Higher/Lower', icon: '🃏', check: () => (Number(cardsStats.bestStreak) || 0) >= 5 },
      { id: 'mine_field_god', title: 'Minefield Demolisher', desc: 'Win 10 Cyber Mines cashouts', icon: '💥', check: () => (Number(minesStats.wins) || 0) >= 10 },
      { id: 'plinko_rainmaker', title: 'Plinko Rainmaker', desc: 'Drop 50 Plinko balls on the board', icon: '🔵', check: () => (Number(plinkoStats.totalDrops) || 0) >= 50 },
      { id: 'derby_champion', title: 'Derby Champion', desc: 'Win 10 Animal Races', icon: '🏇', check: () => (Number(raceStats.wins) || 0) >= 10 },
      { id: 'casino_tycoon', title: 'Casino Tycoon', desc: 'Reach Level 10 or 2,500 Total XP', icon: '💎', check: () => (this.profile.level || 1) >= 10 || (this.profile.xp || 0) >= 2500 }
    ];

    if (!this.profile.unlockedBadges) this.profile.unlockedBadges = {};

    let unlockedCount = 0;
    let achievementsHTML = '';

    BADGES.forEach(b => {
      const isUnlocked = !!this.profile.unlockedBadges[b.id];
      if (isUnlocked) unlockedCount++;

      achievementsHTML += `
        <div class="modal-badge-card ${isUnlocked ? 'unlocked' : 'locked'}">
          <div class="badge-card-icon">${b.icon}</div>
          <div class="badge-card-info">
            <h5 class="badge-card-title">${b.title}</h5>
            <p class="badge-card-desc">${b.desc}</p>
          </div>
          <span class="badge-status-tag ${isUnlocked ? 'tag-unlocked' : 'tag-locked'}">
            ${isUnlocked ? '✓ UNLOCKED' : '🔒 LOCKED'}
          </span>
        </div>
      `;
    });

    const elBadgeCount = document.getElementById('unlocked-badge-count');
    const elGrid = document.getElementById('modal-achievements-grid');

    if (elBadgeCount) elBadgeCount.textContent = `${unlockedCount}/${BADGES.length}`;
    if (elGrid) elGrid.innerHTML = achievementsHTML;

    modal.classList.remove('hidden');
  }

  closeStatsModal() {
    const modal = document.getElementById('stats-modal');
    if (modal) modal.classList.add('hidden');
  }

  closeModal() {
    if (this.modal) this.modal.classList.add('hidden');
  }
}

window.profileManager = new ProfileManager();
