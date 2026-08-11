/* ==========================================================================
   gamblr - Slot Machine Manager
   ========================================================================== */

class SlotMachineManager {
  constructor() {
    this.symbols = ['🍒', '🍋', '💎', '7️⃣', '🔔', '🍉'];
    this.symbolHeight = 116; // Defined in CSS
    this.isSpinning = false;
    this.spins = 0;
    this.wins = 0;
    this.jackpots = 0;
  }

  init() {
    this.reels = [
      document.getElementById('reel-1')?.querySelector('.slot-strip'),
      document.getElementById('reel-2')?.querySelector('.slot-strip'),
      document.getElementById('reel-3')?.querySelector('.slot-strip')
    ];
    this.btnSpin = document.getElementById('btn-spin-slots');
    this.btnReset = document.getElementById('btn-reset-slots-stats');
    this.resultBanner = document.getElementById('slots-result-banner');
    this.resultText = document.getElementById('slots-result-text');
    this.winLine = document.querySelector('.win-line');
    this.historyList = document.getElementById('slots-history-list');

    this.statSpins = document.getElementById('stat-slots-spins');
    this.statWins = document.getElementById('stat-slots-wins');
    this.statJackpots = document.getElementById('stat-slots-jackpots');
    this.statRate = document.getElementById('stat-slots-rate');

    this.loadStats();
    if (!this.btnSpin || !this.reels[0]) return;

    this.btnSpin.addEventListener('click', () => this.spin());
    if (this.btnReset) this.btnReset.addEventListener('click', () => this.resetStats());

    // Initialize strips
    this.reels.forEach(strip => {
      this.populateStrip(strip, 50);
    });

    this.updateStats();
  }

  populateStrip(strip, count) {
    strip.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const sym = document.createElement('div');
      sym.className = 'slot-symbol';
      const randomArr = new Uint8Array(1);
      crypto.getRandomValues(randomArr);
      sym.textContent = this.symbols[randomArr[0] % this.symbols.length];
      strip.appendChild(sym);
    }
  }

  async spin() {
    if (this.isSpinning) return;
    this.isSpinning = true;
    this.btnSpin.disabled = true;
    this.btnSpin.classList.add('spinning');
    this.winLine.classList.remove('active');
    
    this.resultBanner.classList.remove('win', 'jackpot');
    this.resultText.textContent = 'SPINNING...';
    this.resultText.style.color = '#fff';

    if (window.soundEngine) window.soundEngine.playSpinStart();

    const results = [];

    for (let i = 0; i < this.reels.length; i++) {
      const strip = this.reels[i];
      const randomArr = new Uint8Array(1);
      crypto.getRandomValues(randomArr);
      const targetSymbolIndex = randomArr[0] % this.symbols.length;
      results.push(this.symbols[targetSymbolIndex]);

      const spinCount = 20 + (i * 10);
      
      strip.style.transition = 'none';
      strip.style.transform = `translateY(0px)`;
      
      this.populateStrip(strip, spinCount + 3);
      strip.children[spinCount].textContent = results[i];

      void strip.offsetWidth;

      strip.style.transition = `transform ${2 + i * 0.5}s cubic-bezier(0.1, 0.7, 0.1, 1)`;
      strip.style.transform = `translateY(-${spinCount * this.symbolHeight}px)`;
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

    this.checkWin(results);
    this.isSpinning = false;
    this.btnSpin.disabled = false;
    this.btnSpin.classList.remove('spinning');
  }

  checkWin(results) {
    this.spins++;
    const [r1, r2, r3] = results;
    
    let isWin = false;
    let isJackpot = false;
    let message = 'NO WIN';
    let color = '#fff';

    if (r1 === r2 && r2 === r3) {
      isWin = true;
      if (r1 === '7️⃣' || r1 === '💎') {
        isJackpot = true;
        this.jackpots++;
        message = 'JACKPOT!!!';
        color = '#ffd700';
      } else {
        message = 'BIG WIN!';
        color = '#00e676';
      }
      this.wins++;
    } else if (r1 === r2 || r2 === r3 || r1 === r3) {
      isWin = true;
      this.wins++;
      message = 'SMALL WIN';
      color = '#00b4d8';
    }

    this.resultText.textContent = message;
    this.resultText.style.color = color;

    if (isWin) {
      this.winLine.classList.add('active');
      this.resultBanner.classList.add(isJackpot ? 'jackpot' : 'win');
      if (window.soundEngine) window.soundEngine.playWinSound();
      if (window.profileManager) window.profileManager.addXP(isJackpot ? 150 : 50, window.innerWidth / 2, window.innerHeight / 2);
    } else {
      if (window.soundEngine) window.soundEngine.playCoinFlip(); 
      if (window.profileManager) window.profileManager.triggerLoseEffect();
    }

    this.saveStats();
    this.updateStats();
    this.addToHistory(results, message, isWin, isJackpot);
  }

  saveStats() {
    if (window.profileManager) {
      window.profileManager.saveGameStats('slots', {
        spins: this.spins,
        wins: this.wins,
        jackpots: this.jackpots
      });
    } else {
      localStorage.setItem('gamblr_slots_stats', JSON.stringify({ spins: this.spins, wins: this.wins, jackpots: this.jackpots }));
    }
  }

  loadStats() {
    const defaultData = { spins: 0, wins: 0, jackpots: 0 };
    if (window.profileManager) {
      const saved = window.profileManager.getGameStats('slots', defaultData);
      this.spins = saved.spins || 0;
      this.wins = saved.wins || 0;
      this.jackpots = saved.jackpots || 0;
    }
  }

  updateStatsUI() {
    this.updateStats();
  }

  updateStats() {
    if (this.statSpins) this.statSpins.textContent = this.spins;
    if (this.statWins) this.statWins.textContent = this.wins;
    if (this.statJackpots) this.statJackpots.textContent = this.jackpots;
    const rate = this.spins === 0 ? 0 : Math.round((this.wins / this.spins) * 100);
    if (this.statRate) this.statRate.textContent = `${rate}%`;
  }

  addToHistory(results, resultText, isWin, isJackpot) {
    if (!this.historyList) return;
    const pill = document.createElement('div');
    pill.className = `history-pill ${isJackpot ? 'jackpot' : isWin ? 'win' : ''}`;
    pill.innerHTML = `
      <span class="history-pill-result">${results.join(' ')}</span>
      <span class="history-pill-text">${resultText}</span>
    `;

    if (this.historyList.querySelector('.empty-msg')) {
      this.historyList.innerHTML = '';
    }

    this.historyList.prepend(pill);

    if (this.historyList.children.length > 20) {
      this.historyList.lastChild.remove();
    }
  }

  resetStats() {
    this.spins = 0;
    this.wins = 0;
    this.jackpots = 0;
    this.saveStats();
    this.updateStats();
    if (this.historyList) this.historyList.innerHTML = '<span class="empty-msg">No spins yet</span>';
    if (this.resultText) {
      this.resultText.textContent = 'READY TO SPIN';
      this.resultText.style.color = '#ff0080';
    }
    if (this.winLine) this.winLine.classList.remove('active');
  }
}

window.slotsManager = new SlotMachineManager();
