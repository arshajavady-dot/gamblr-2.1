/* ==========================================================================
   gamblr - Higher or Lower Card Manager
   ========================================================================== */

class CardsManager {
  constructor() {
    this.streak = 0;
    this.bestStreak = 0;
    this.gamesPlayed = 0;
    this.isPlaying = false;
    
    this.currentCard = null;
    
    // Cards setup
    this.suits = ['♠', '♥', '♦', '♣'];
    this.values = [
      { name: '2', val: 2 },
      { name: '3', val: 3 },
      { name: '4', val: 4 },
      { name: '5', val: 5 },
      { name: '6', val: 6 },
      { name: '7', val: 7 },
      { name: '8', val: 8 },
      { name: '9', val: 9 },
      { name: '10', val: 10 },
      { name: 'J', val: 11 },
      { name: 'Q', val: 12 },
      { name: 'K', val: 13 },
      { name: 'A', val: 14 }
    ];
  }

  init() {
    this.btnHigher = document.getElementById('btn-cards-higher');
    this.btnLower = document.getElementById('btn-cards-lower');
    this.btnStart = document.getElementById('btn-cards-start');
    
    this.cardContainer = document.getElementById('cards-display-container');
    this.currentCardElement = document.getElementById('cards-current-card');
    
    this.resultBanner = document.getElementById('cards-result-banner');
    this.resultText = document.getElementById('cards-result-text');
    this.historyList = document.getElementById('cards-history-list');

    this.statStreak = document.getElementById('stat-cards-streak');
    this.statBestStreak = document.getElementById('stat-cards-best');
    this.statGames = document.getElementById('stat-cards-games');
    this.btnReset = document.getElementById('btn-reset-cards-stats');

    this.loadStats();
    this.updateStatsUI();
    if (!this.cardContainer) return;
    
    if (this.btnHigher) this.btnHigher.addEventListener('click', () => this.guess('higher'));
    if (this.btnLower) this.btnLower.addEventListener('click', () => this.guess('lower'));
    if (this.btnStart) this.btnStart.addEventListener('click', () => this.startGame());
    if (this.btnReset) this.btnReset.addEventListener('click', () => this.resetStats());
  }

  drawRandomCard() {
    const randomArr = new Uint32Array(2);
    crypto.getRandomValues(randomArr);
    
    const suit = this.suits[randomArr[0] % this.suits.length];
    const valueObj = this.values[randomArr[1] % this.values.length];
    
    return {
      suit: suit,
      name: valueObj.name,
      val: valueObj.val,
      color: (suit === '♥' || suit === '♦') ? 'red' : 'black'
    };
  }

  startGame() {
    this.isPlaying = true;
    this.streak = 0;
    this.updateStats();
    
    this.btnStart.style.display = 'none';
    this.btnHigher.style.display = 'block';
    this.btnLower.style.display = 'block';
    
    this.resultBanner.classList.remove('active', 'win', 'lose');
    
    this.historyList.innerHTML = '<span class="empty-msg">New game started</span>';
    
    this.currentCard = this.drawRandomCard();
    this.renderCard(this.currentCardElement, this.currentCard);
  }

  async guess(choice) {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    
    this.btnHigher.disabled = true;
    this.btnLower.disabled = true;
    
    if (window.soundEngine) window.soundEngine.playCardDraw();
    
    // Create next card visually and slide it over
    const nextCard = this.drawRandomCard();
    
    // Render the old card fading out
    this.currentCardElement.classList.add('slide-out');
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    this.currentCardElement.classList.remove('slide-out');
    this.renderCard(this.currentCardElement, nextCard);
    this.currentCardElement.classList.add('slide-in');
    
    await new Promise(resolve => setTimeout(resolve, 300));
    this.currentCardElement.classList.remove('slide-in');
    
    // Evaluate
    this.evaluate(choice, this.currentCard, nextCard);
    this.currentCard = nextCard;
  }
  
  evaluate(choice, oldCard, newCard) {
    let won = false;
    let tie = (oldCard.val === newCard.val);
    
    if (!tie) {
      if (choice === 'higher' && newCard.val > oldCard.val) won = true;
      if (choice === 'lower' && newCard.val < oldCard.val) won = true;
    }
    
    if (won) {
      this.streak++;
      if (this.streak > this.bestStreak) this.bestStreak = this.streak;
      
      this.resultText.textContent = 'CORRECT!';
      this.resultText.style.color = '#00e676';
      this.resultBanner.className = 'result-banner active win';
      
      if (window.soundEngine) window.soundEngine.playCoinWin();
      if (window.profileManager) window.profileManager.addXP(50, window.innerWidth / 2, window.innerHeight / 2);
      
      this.addToHistory(choice, oldCard, newCard, true);
      
      this.isPlaying = true;
      this.btnHigher.disabled = false;
      this.btnLower.disabled = false;
    } else {
      // Lost
      this.gamesPlayed++;
      this.resultText.textContent = tie ? 'TIE... YOU LOSE!' : 'WRONG!';
      this.resultText.style.color = '#ff3366';
      this.resultBanner.className = 'result-banner active lose';
      
      if (window.soundEngine) window.soundEngine.playCoinFlip(); // Thud
      if (window.profileManager) window.profileManager.triggerLoseEffect();
      
      this.addToHistory(choice, oldCard, newCard, false);
      
      this.btnStart.style.display = 'block';
      this.btnStart.textContent = 'PLAY AGAIN';
      this.btnHigher.style.display = 'none';
      this.btnLower.style.display = 'none';
      this.btnHigher.disabled = false;
      this.btnLower.disabled = false;
    }
    
    this.saveStats();
    this.updateStats();
  }

  saveStats() {
    if (window.profileManager) {
      window.profileManager.saveGameStats('cards', { streak: this.streak, bestStreak: this.bestStreak, gamesPlayed: this.gamesPlayed });
    }
  }

  loadStats() {
    const defaultData = { streak: 0, bestStreak: 0, gamesPlayed: 0 };
    if (window.profileManager) {
      const saved = window.profileManager.getGameStats('cards', defaultData);
      this.streak = saved.streak || 0;
      this.bestStreak = saved.bestStreak || 0;
      this.gamesPlayed = saved.gamesPlayed || 0;
    }
  }

  updateStatsUI() {
    this.updateStats();
  }

  renderCard(el, cardObj) {
    if (!el) return;
    el.innerHTML = `
      <div class="card-inner ${cardObj.color}">
        <div class="card-top">${cardObj.name} ${cardObj.suit}</div>
        <div class="card-middle">${cardObj.suit}</div>
        <div class="card-bottom">${cardObj.name} ${cardObj.suit}</div>
      </div>
    `;
  }

  updateStats() {
    if (this.statStreak) this.statStreak.textContent = this.streak;
    if (this.statBestStreak) this.statBestStreak.textContent = this.bestStreak;
    if (this.statGames) this.statGames.textContent = this.gamesPlayed;
  }

  addToHistory(choice, oldCard, newCard, won) {
    if (!this.historyList) return;
    const pill = document.createElement('div');
    pill.className = `history-pill ${won ? 'win' : 'lose'}`;
    
    pill.innerHTML = `
      <span class="history-pill-result">${oldCard.name}${oldCard.suit} ➡️ ${newCard.name}${newCard.suit}</span>
      <span class="history-pill-text">${won ? '✅' : '❌'}</span>
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
    this.bestStreak = 0;
    this.gamesPlayed = 0;
    if (!this.isPlaying) this.streak = 0;
    this.saveStats();
    this.updateStats();
    if (this.historyList) this.historyList.innerHTML = '<span class="empty-msg">No history</span>';
  }
}

window.cardsManager = new CardsManager();
