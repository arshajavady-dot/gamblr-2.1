/* ==========================================================================
   gamblr - 3D Coin Flip Logic & Stats
   ========================================================================== */

class CoinFlipManager {
  constructor() {
    this.currentRotationY = 0;
    this.isFlipping = false;
    this.userPick = 'heads';

    this.stats = {
      totalFlips: 0,
      heads: 0,
      tails: 0,
      wins: 0,
      currentStreak: 0,
      bestStreak: 0,
      history: []
    };

    this.loadStats();
  }

  init() {
    this.bindEvents();
    this.updateStatsUI();
    this.updatePredictionDisplay();
  }

  bindEvents() {
    const btnFlip = document.getElementById('btn-flip');
    const btnFlip3 = document.getElementById('btn-flip-3');
    const btnFlip5 = document.getElementById('btn-flip-5');
    const pickHeads = document.getElementById('pick-heads');
    const pickTails = document.getElementById('pick-tails');
    const btnResetStats = document.getElementById('btn-reset-coin-stats');
    const coinEl = document.getElementById('coin');

    if (btnFlip) btnFlip.addEventListener('click', () => this.flipCoin());
    if (btnFlip3) btnFlip3.addEventListener('click', () => this.multiFlip(3));
    if (btnFlip5) btnFlip5.addEventListener('click', () => this.multiFlip(5));
    if (coinEl) coinEl.addEventListener('click', () => this.flipCoin());

    if (pickHeads) {
      pickHeads.addEventListener('click', () => {
        if (this.isFlipping) return;
        this.userPick = 'heads';
        pickHeads.classList.add('active');
        if (pickTails) pickTails.classList.remove('active');
        this.updatePredictionDisplay();
      });
    }

    if (pickTails) {
      pickTails.addEventListener('click', () => {
        if (this.isFlipping) return;
        this.userPick = 'tails';
        pickTails.classList.add('active');
        if (pickHeads) pickHeads.classList.remove('active');
        this.updatePredictionDisplay();
      });
    }

    if (btnResetStats) {
      btnResetStats.addEventListener('click', () => this.resetStats());
    }
  }

  updatePredictionDisplay() {
    const matchText = document.getElementById('coin-prediction-match');
    if (matchText && !this.isFlipping) {
      matchText.className = 'prediction-match';
      matchText.textContent = `Your Pick: ${this.userPick.toUpperCase()}`;
    }
  }

  getRandomOutcome() {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] % 2 === 0 ? 'heads' : 'tails';
  }

  flipCoin() {
    if (this.isFlipping) return;
    this.isFlipping = true;

    const btnFlip = document.getElementById('btn-flip');
    const pickHeads = document.getElementById('pick-heads');
    const pickTails = document.getElementById('pick-tails');

    if (btnFlip) btnFlip.disabled = true;
    if (pickHeads) pickHeads.style.pointerEvents = 'none';
    if (pickTails) pickTails.style.pointerEvents = 'none';

    const stage = document.querySelector('.coin-stage');
    if (stage) stage.classList.add('flipping');

    const resultBanner = document.getElementById('coin-result-banner');
    const resultText = document.getElementById('coin-result-text');
    const matchText = document.getElementById('coin-prediction-match');

    if (resultText) {
      resultText.className = 'result-text';
      resultText.textContent = 'FLIPPING...';
    }
    if (matchText) {
      matchText.className = 'prediction-match';
      matchText.textContent = `Hoping for ${this.userPick.toUpperCase()}...`;
    }

    if (window.soundEngine) window.soundEngine.playCoinFlip();

    const outcome = this.getRandomOutcome();

    // 5 to 8 full spins (1800 to 2880 degrees)
    const spins = (Math.floor(Math.random() * 4) + 5) * 360;

    // Calculate exact target rotation so final 3D face matches outcome 100%
    const baseRotation = Math.ceil(this.currentRotationY / 360) * 360 + spins;
    this.currentRotationY = baseRotation + (outcome === 'tails' ? 180 : 0);

    const coinEl = document.getElementById('coin');
    if (coinEl) {
      coinEl.style.transform = `rotateY(${this.currentRotationY}deg)`;
    }

    setTimeout(() => {
      if (stage) stage.classList.remove('flipping');
      if (window.soundEngine) window.soundEngine.playCoinLand();

      this.processResult(outcome);
      this.isFlipping = false;
      if (btnFlip) btnFlip.disabled = false;
      if (pickHeads) pickHeads.style.pointerEvents = 'auto';
      if (pickTails) pickTails.style.pointerEvents = 'auto';
    }, 3000);
  }

  async multiFlip(count) {
    if (this.isFlipping) return;
    
    const targetWins = Math.ceil(count / 2);
    let headsWins = 0;
    let tailsWins = 0;

    const resultText = document.getElementById('coin-result-text');
    const matchText = document.getElementById('coin-prediction-match');
    if (resultText) resultText.textContent = `SERIES: BEST ${targetWins} OF ${count}`;

    for (let i = 0; i < count; i++) {
      await new Promise((resolve) => {
        this.flipCoin();
        setTimeout(resolve, 3400);
      });

      const lastResult = this.stats.history[0];
      if (lastResult === 'heads') headsWins++;
      else tailsWins++;

      if (matchText) matchText.textContent = `Score: Heads ${headsWins} - Tails ${tailsWins}`;

      if (headsWins >= targetWins || tailsWins >= targetWins) break;
    }

    const seriesWinner = headsWins > tailsWins ? 'heads' : 'tails';
    const isSeriesWin = seriesWinner === this.userPick;

    if (resultText) {
      if (isSeriesWin) {
        resultText.className = 'result-text winner-glow';
        resultText.textContent = `🎉 YOU WON THE SERIES! (${seriesWinner.toUpperCase()})`;
      } else {
        resultText.className = 'result-text loser-glow';
        resultText.textContent = `💥 YOU LOST THE SERIES (${seriesWinner.toUpperCase()})`;
      }
    }
  }

  processResult(outcome) {
    const isWin = outcome === this.userPick;

    this.stats.totalFlips = (Number(this.stats.totalFlips) || 0) + 1;
    if (outcome === 'heads') this.stats.heads = (Number(this.stats.heads) || 0) + 1;
    else this.stats.tails = (Number(this.stats.tails) || 0) + 1;

    if (isWin) {
      this.stats.wins = (Number(this.stats.wins) || 0) + 1;
      this.stats.currentStreak = (Number(this.stats.currentStreak) || 0) + 1;
      const best = Number(this.stats.bestStreak) || 0;
      if (this.stats.currentStreak > best) {
        this.stats.bestStreak = this.stats.currentStreak;
      }
    } else {
      this.stats.currentStreak = 0;
    }

    this.stats.history.unshift(outcome);
    if (this.stats.history.length > 30) this.stats.history.pop();

    // MUST save stats FIRST before addXP triggers notifyAccountChange()
    this.saveStats();
    this.updateStatsUI();

    if (isWin) {
      if (window.soundEngine) window.soundEngine.playWheelWin();
      if (window.profileManager) window.profileManager.addXP(50, window.innerWidth / 2, window.innerHeight / 2);
    } else {
      if (window.profileManager) window.profileManager.triggerLoseEffect();
    }

    const resultText = document.getElementById('coin-result-text');
    const matchText = document.getElementById('coin-prediction-match');

    if (resultText) {
      if (isWin) {
        resultText.className = 'result-text winner-glow';
        resultText.textContent = `🎉 YOU WIN! (${outcome.toUpperCase()})`;
      } else {
        resultText.className = 'result-text loser-glow';
        resultText.textContent = `💥 YOU LOST! (${outcome.toUpperCase()})`;
      }
    }

    if (matchText) {
      if (isWin) {
        matchText.className = 'prediction-match win';
        matchText.textContent = `✓ Correct! Coin landed on ${outcome.toUpperCase()} 🔥 (Streak: ${this.stats.currentStreak})`;
      } else {
        matchText.className = 'prediction-match lose';
        matchText.textContent = `✗ Wrong! Coin landed on ${outcome.toUpperCase()} (You picked ${this.userPick.toUpperCase()})`;
      }
    }
  }

  updateStatsUI() {
    const elTotal = document.getElementById('stat-total-flips');
    const elWins = document.getElementById('stat-wins-count');
    const elWinRate = document.getElementById('stat-win-rate');
    const elHeads = document.getElementById('stat-heads-count');
    const elTails = document.getElementById('stat-tails-count');
    const elCurrentStreak = document.getElementById('stat-current-streak');
    const elBestStreak = document.getElementById('stat-best-streak');
    const propHeadsLabel = document.getElementById('prop-heads-label');
    const propTailsLabel = document.getElementById('prop-tails-label');
    const propHeadsFill = document.getElementById('prop-heads-fill');
    const propTailsFill = document.getElementById('prop-tails-fill');
    const historyList = document.getElementById('coin-history-list');

    if (elTotal) elTotal.textContent = this.stats.totalFlips;
    if (elWins) elWins.textContent = this.stats.wins;
    if (elHeads) elHeads.textContent = this.stats.heads;
    if (elTails) elTails.textContent = this.stats.tails;
    if (elCurrentStreak) elCurrentStreak.textContent = this.stats.currentStreak;
    if (elBestStreak) elBestStreak.textContent = this.stats.bestStreak;

    const winRate = this.stats.totalFlips > 0
      ? Math.round((this.stats.wins / this.stats.totalFlips) * 100)
      : 0;
    if (elWinRate) elWinRate.textContent = `${winRate}%`;

    const headsPct = this.stats.totalFlips > 0
      ? Math.round((this.stats.heads / this.stats.totalFlips) * 100)
      : 50;
    const tailsPct = 100 - headsPct;

    if (propHeadsLabel) propHeadsLabel.textContent = `Heads ${headsPct}%`;
    if (propTailsLabel) propTailsLabel.textContent = `Tails ${tailsPct}%`;
    if (propHeadsFill) propHeadsFill.style.width = `${headsPct}%`;
    if (propTailsFill) propTailsFill.style.width = `${tailsPct}%`;

    if (historyList) {
      if (this.stats.history.length === 0) {
        historyList.innerHTML = '<span class="empty-msg">No flips yet</span>';
      } else {
        historyList.innerHTML = this.stats.history
          .map(res => `<span class="history-pill ${res}">${res === 'heads' ? '👑 H' : '🛡️ T'}</span>`)
          .join('');
      }
    }
  }

  saveStats() {
    if (window.profileManager) {
      window.profileManager.saveGameStats('coin', this.stats);
    } else {
      localStorage.setItem('gamblr_coin_stats', JSON.stringify(this.stats));
    }
  }

  loadStats() {
    const defaultStats = {
      totalFlips: 0,
      heads: 0,
      tails: 0,
      wins: 0,
      currentStreak: 0,
      bestStreak: 0,
      history: []
    };

    let loaded = null;
    if (window.profileManager) {
      loaded = window.profileManager.getGameStats('coin', defaultStats);
    } else {
      const saved = localStorage.getItem('gamblr_coin_stats');
      if (saved) {
        try {
          loaded = JSON.parse(saved);
        } catch (e) {}
      }
    }

    this.stats = Object.assign({}, defaultStats, loaded || {});
    this.stats.totalFlips = Number(this.stats.totalFlips) || 0;
    this.stats.heads = Number(this.stats.heads) || 0;
    this.stats.tails = Number(this.stats.tails) || 0;
    this.stats.wins = Number(this.stats.wins) || 0;
    this.stats.currentStreak = Number(this.stats.currentStreak) || 0;
    this.stats.bestStreak = Number(this.stats.bestStreak) || 0;
    if (!Array.isArray(this.stats.history)) this.stats.history = [];
  }

  resetStats() {
    this.stats = {
      totalFlips: 0,
      heads: 0,
      tails: 0,
      wins: 0,
      currentStreak: 0,
      bestStreak: 0,
      history: []
    };
    this.saveStats();
    this.updateStatsUI();

    const matchText = document.getElementById('coin-prediction-match');
    const resultText = document.getElementById('coin-result-text');
    if (resultText) {
      resultText.className = 'result-text';
      resultText.textContent = 'READY TO FLIP';
    }
    if (matchText) {
      matchText.className = 'prediction-match';
      matchText.textContent = `Your Pick: ${this.userPick.toUpperCase()}`;
    }
  }
}

window.coinFlipManager = new CoinFlipManager();
