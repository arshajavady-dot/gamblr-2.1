/* ==========================================================================
   gamblr - Mines Game Manager (5x5 Grid)
   ========================================================================== */

class MinesManager {
  constructor() {
    this.gridSize = 25; // 5x5
    this.bombCount = 3;
    this.mines = [];
    this.revealedCount = 0;
    this.currentMultiplier = 1.0;
    this.isPlaying = false;

    this.gamesPlayed = 0;
    this.wins = 0;
    this.losses = 0;
  }

  init() {
    this.gridElement = document.getElementById('mines-grid');
    this.btnStart = document.getElementById('btn-mines-start');
    this.btnCashout = document.getElementById('btn-mines-cashout');
    this.bombSelect = document.getElementById('mines-bomb-count');
    
    this.multiplierDisplay = document.getElementById('mines-multiplier');
    this.profitDisplay = document.getElementById('mines-profit');
    this.resultBanner = document.getElementById('mines-result-banner');
    this.resultText = document.getElementById('mines-result-text');
    this.historyList = document.getElementById('mines-history-list');

    this.statGames = document.getElementById('stat-mines-games');
    this.statWins = document.getElementById('stat-mines-wins');
    this.statLosses = document.getElementById('stat-mines-losses');
    this.btnReset = document.getElementById('btn-reset-mines-stats');

    this.loadStats();
    this.updateStatsUI();
    if (!this.gridElement) return;

    this.renderEmptyGrid();

    if (this.btnStart) this.btnStart.addEventListener('click', () => this.startGame());
    if (this.btnCashout) this.btnCashout.addEventListener('click', () => this.cashout());
    if (this.bombSelect) {
      this.bombSelect.addEventListener('change', (e) => {
        this.bombCount = parseInt(e.target.value, 10);
      });
    }
    if (this.btnReset) this.btnReset.addEventListener('click', () => this.resetStats());
  }

  renderEmptyGrid() {
    this.gridElement.innerHTML = '';
    for (let i = 0; i < this.gridSize; i++) {
      const tile = document.createElement('button');
      tile.className = 'mine-tile';
      tile.dataset.index = i;
      tile.innerHTML = '<span class="tile-content">?</span>';
      tile.disabled = true;
      this.gridElement.appendChild(tile);
    }
  }

  startGame() {
    this.isPlaying = true;
    this.revealedCount = 0;
    this.currentMultiplier = 1.0;
    
    // Generate mines
    this.mines = new Array(this.gridSize).fill(false);
    let placed = 0;
    while (placed < this.bombCount) {
      const idx = Math.floor(Math.random() * this.gridSize);
      if (!this.mines[idx]) {
        this.mines[idx] = true;
        placed++;
      }
    }

    this.btnStart.style.display = 'none';
    this.btnCashout.style.display = 'block';
    this.btnCashout.disabled = true; // Disabled until at least 1 gem revealed
    this.bombSelect.disabled = true;

    this.updateDisplays(1.0, 0);

    this.resultBanner.className = 'result-banner active';
    this.resultText.textContent = 'PICK A TILE';
    this.resultText.style.color = '#fff';

    // Render interactive grid
    this.gridElement.innerHTML = '';
    for (let i = 0; i < this.gridSize; i++) {
      const tile = document.createElement('button');
      tile.className = 'mine-tile active';
      tile.dataset.index = i;
      tile.innerHTML = '<span class="tile-content">?</span>';
      tile.addEventListener('click', () => this.revealTile(i, tile));
      this.gridElement.appendChild(tile);
    }
  }

  revealTile(index, tileElement) {
    if (!this.isPlaying || tileElement.classList.contains('revealed')) return;

    tileElement.classList.remove('active');
    tileElement.classList.add('revealed');

    if (this.mines[index]) {
      // Hit a mine!
      tileElement.classList.add('mine');
      tileElement.innerHTML = '<span class="tile-content">💣</span>';
      
      if (window.soundEngine && window.soundEngine.playMineExplosion) {
        window.soundEngine.playMineExplosion();
      }

      this.gameOver(false);
    } else {
      // Revealed a gem!
      tileElement.classList.add('gem');
      tileElement.innerHTML = '<span class="tile-content">💎</span>';

      this.revealedCount++;
      this.calculateMultiplier();
      this.btnCashout.disabled = false;

      if (window.soundEngine && window.soundEngine.playMineGem) {
        window.soundEngine.playMineGem(this.revealedCount);
      }

      // Check if all safe tiles revealed
      const safeTiles = this.gridSize - this.bombCount;
      if (this.revealedCount === safeTiles) {
        this.cashout();
      }
    }
  }

  calculateMultiplier() {
    // Fair odds multiplier calculation
    let mult = 1.0;
    for (let i = 0; i < this.revealedCount; i++) {
      mult *= (this.gridSize - i) / (this.gridSize - this.bombCount - i);
    }
    this.currentMultiplier = Math.round(mult * 100) / 100;
    this.updateDisplays(this.currentMultiplier, this.currentMultiplier);
  }

  updateDisplays(mult, profit) {
    if (this.multiplierDisplay) this.multiplierDisplay.textContent = mult.toFixed(2) + 'x';
    if (this.profitDisplay) this.profitDisplay.textContent = profit.toFixed(2) + 'x Multiplier';
  }

  cashout() {
    if (!this.isPlaying) return;
    this.gameOver(true);
  }

  gameOver(won) {
    this.isPlaying = false;
    this.gamesPlayed++;

    // Reveal all remaining mines and gems
    const tiles = this.gridElement.children;
    for (let i = 0; i < this.gridSize; i++) {
      tiles[i].disabled = true;
      if (!tiles[i].classList.contains('revealed')) {
        tiles[i].classList.add('revealed', 'dimmed');
        if (this.mines[i]) {
          tiles[i].innerHTML = '<span class="tile-content">💣</span>';
        } else {
          tiles[i].innerHTML = '<span class="tile-content">💎</span>';
        }
      }
    }

    if (won) {
      this.wins++;
      this.resultText.textContent = `CASHED OUT: ${this.currentMultiplier.toFixed(2)}x!`;
      this.resultText.style.color = '#00e676';
      this.resultBanner.className = 'result-banner active win';
      if (window.soundEngine) window.soundEngine.playCoinWin();
      if (window.profileManager) window.profileManager.addXP(Math.round(50 * this.currentMultiplier), window.innerWidth / 2, window.innerHeight / 2);
    } else {
      this.losses++;
      this.resultText.textContent = 'BOOM! YOU HIT A MINE!';
      this.resultText.style.color = '#ff3366';
      this.resultBanner.className = 'result-banner active lose';
      if (window.profileManager) window.profileManager.triggerLoseEffect();
    }

    this.btnStart.style.display = 'block';
    this.btnStart.textContent = 'PLAY AGAIN';
    this.btnCashout.style.display = 'none';
    this.bombSelect.disabled = false;

    this.saveStats();
    this.updateStats();
    this.addToHistory(won, this.currentMultiplier);
  }

  saveStats() {
    if (window.profileManager) {
      window.profileManager.saveGameStats('mines', { gamesPlayed: this.gamesPlayed, wins: this.wins, losses: this.losses });
    }
  }

  loadStats() {
    const defaultData = { gamesPlayed: 0, wins: 0, losses: 0 };
    if (window.profileManager) {
      const saved = window.profileManager.getGameStats('mines', defaultData);
      this.gamesPlayed = saved.gamesPlayed || 0;
      this.wins = saved.wins || 0;
      this.losses = saved.losses || 0;
    }
  }

  updateStatsUI() {
    this.updateStats();
  }

  updateStats() {
    if (this.statGames) this.statGames.textContent = this.gamesPlayed;
    if (this.statWins) this.statWins.textContent = this.wins;
    if (this.statLosses) this.statLosses.textContent = this.losses;
  }

  addToHistory(won, mult) {
    if (!this.historyList) return;
    const pill = document.createElement('div');
    pill.className = `history-pill ${won ? 'win' : 'lose'}`;
    pill.innerHTML = `
      <span class="history-pill-result">${this.bombCount}💣 Mode</span>
      <span class="history-pill-text">${won ? mult.toFixed(2) + 'x 💎' : '💥 BOOM'}</span>
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
    this.gamesPlayed = 0;
    this.wins = 0;
    this.losses = 0;
    this.saveStats();
    this.updateStats();
    if (this.historyList) this.historyList.innerHTML = '<span class="empty-msg">No games played</span>';
    this.renderEmptyGrid();
    if (this.resultBanner) this.resultBanner.className = 'result-banner';
    this.updateDisplays(1.0, 0);
  }
}

window.minesManager = new MinesManager();
