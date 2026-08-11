/* ==========================================================================
   gamblr - Fortune Cookie Manager
   ========================================================================== */

class CookieManager {
  constructor() {
    this.isOpened = false;
    this.isAnimating = false;
    
    this.totalOpened = 0;
    this.goodCount = 0;
    this.badCount = 0;

    this.fortunes = [
      // Good Fortunes
      { text: "A thrilling time is in your immediate future.", type: "good" },
      { text: "Your hard work will soon pay off in ways you can't imagine.", type: "good" },
      { text: "Someone is looking up to you. Don't let them down.", type: "good" },
      { text: "Wealth awaits you very soon.", type: "good" },
      { text: "Your lucky numbers are 7, 13, and 42.", type: "good" },
      { text: "A pleasant surprise is waiting for you.", type: "good" },
      { text: "You will soon discover a hidden talent.", type: "good" },
      { text: "True love will show itself to you very soon.", type: "good" },
      { text: "The universe is aligning in your favor.", type: "good" },
      { text: "An old friend will bring you great news.", type: "good" },
      
      // Bad / Sarcastic Fortunes
      { text: "You will drop something important today.", type: "bad" },
      { text: "That thing you're worried about? Yeah, you should be.", type: "bad" },
      { text: "A pigeon has its sights set on your car.", type: "bad" },
      { text: "Your internet will disconnect at the worst possible moment.", type: "bad" },
      { text: "Don't look behind you.", type: "bad" },
      { text: "Tomorrow will be a test of your patience.", type: "bad" },
      { text: "You will step on a Lego in the near future.", type: "bad" },
      { text: "Expect a minor inconvenience very soon.", type: "bad" },
      { text: "The fortune you seek is in another cookie.", type: "bad" }
    ];
  }

  init() {
    this.stage = document.getElementById('cookie-stage');
    this.cookieWrapper = document.getElementById('cookie-wrapper');
    this.btnNew = document.getElementById('btn-new-cookie');
    this.btnReset = document.getElementById('btn-reset-cookie-stats');
    this.resultBanner = document.getElementById('cookie-result-banner');
    this.fortuneSlip = document.getElementById('fortune-slip');
    this.historyList = document.getElementById('cookie-history-list');

    this.statOpened = document.getElementById('stat-cookie-opened');
    this.statGood = document.getElementById('stat-cookie-good');
    this.statBad = document.getElementById('stat-cookie-bad');

    this.loadStats();
    this.updateStatsUI();
    if (!this.cookieWrapper) return;

    this.cookieWrapper.addEventListener('click', () => {
      if (!this.isOpened) this.crackCookie();
    });
    
    if (this.btnNew) {
      this.btnNew.addEventListener('click', () => {
        if (!this.isOpened) this.crackCookie();
        else this.resetCookie();
      });
    }
    
    if (this.btnReset) this.btnReset.addEventListener('click', () => this.resetStats());
  }

  async crackCookie() {
    if (this.isOpened || this.isAnimating) return;
    this.isAnimating = true;

    // Pick a fortune
    const randomArr = new Uint8Array(1);
    crypto.getRandomValues(randomArr);
    const fortune = this.fortunes[randomArr[0] % this.fortunes.length];

    this.fortuneSlip.textContent = fortune.text;

    // Animation classes
    this.cookieWrapper.classList.add('cracking');
    if (window.soundEngine) window.soundEngine.playCookieCrack();

    // Wait for crack animation
    await new Promise(resolve => setTimeout(resolve, 800));
    
    this.cookieWrapper.classList.remove('cracking');
    this.cookieWrapper.classList.add('opened');
    
    // Play a chime when slip comes out
    if (fortune.type === 'good') {
      if (window.soundEngine) setTimeout(() => window.soundEngine.playCoinWin(), 300);
    } else {
      if (window.soundEngine) setTimeout(() => window.soundEngine.playCoinFlip(), 300); // Thud
    }

    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for slip to slide out

    this.isOpened = true;
    this.isAnimating = false;
    this.btnNew.innerHTML = 'GET NEW COOKIE <span class="btn-shortcut">[SPACE]</span>';
    
    this.resultBanner.classList.add('active');

    this.updateStats(fortune);
  }

  updateStats(fortune) {
    this.totalOpened++;
    if (fortune.type === 'good') {
      this.goodCount++;
    }
    if (fortune.type === 'bad') this.badCount++;

    this.saveStats();
    this.updateStats();

    this.addToHistory(fortune);
  }

  saveStats() {
    if (window.profileManager) {
      window.profileManager.saveGameStats('cookie', { totalOpened: this.totalOpened, goodCount: this.goodCount, badCount: this.badCount });
    }
  }

  loadStats() {
    const defaultData = { totalOpened: 0, goodCount: 0, badCount: 0 };
    if (window.profileManager) {
      const saved = window.profileManager.getGameStats('cookie', defaultData);
      this.totalOpened = saved.totalOpened || 0;
      this.goodCount = saved.goodCount || 0;
      this.badCount = saved.badCount || 0;
    }
  }

  updateStatsUI() {
    this.updateStats();
  }

  updateStats() {
    if (this.statOpened) this.statOpened.textContent = this.totalOpened;
    if (this.statGood) this.statGood.textContent = this.goodCount;
    if (this.statBad) this.statBad.textContent = this.badCount;
  }

  addToHistory(fortune) {
    if (!this.historyList) return;
    const pill = document.createElement('div');
    pill.className = `history-pill ${fortune.type === 'good' ? 'win' : ''}`;
    pill.innerHTML = `
      <span class="history-pill-result">${fortune.type === 'good' ? '😇' : '👿'}</span>
      <span class="history-pill-text">${fortune.text}</span>
    `;

    if (this.historyList.querySelector('.empty-msg')) {
      this.historyList.innerHTML = '';
    }

    this.historyList.prepend(pill);

    if (this.historyList.children.length > 20) {
      this.historyList.lastChild.remove();
    }
  }

  resetCookie() {
    if (this.isAnimating || !this.isOpened) return;
    this.isOpened = false;
    if (this.btnNew) this.btnNew.innerHTML = 'CRACK COOKIE <span class="btn-shortcut">[SPACE]</span>';
    
    if (this.cookieWrapper) this.cookieWrapper.classList.remove('opened');
    if (this.resultBanner) this.resultBanner.classList.remove('active');
    if (this.fortuneSlip) this.fortuneSlip.textContent = '';
  }

  resetStats() {
    this.totalOpened = 0;
    this.goodCount = 0;
    this.badCount = 0;
    this.saveStats();
    this.updateStats();
    if (this.historyList) this.historyList.innerHTML = '<span class="empty-msg">No cookies opened</span>';
  }
}

window.cookieManager = new CookieManager();
