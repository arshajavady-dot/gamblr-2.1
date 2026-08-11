/* ==========================================================================
   gamblr - Rock Paper Scissors Manager
   ========================================================================== */

class RpsManager {
  constructor() {
    this.wins = 0;
    this.losses = 0;
    this.ties = 0;
    this.isPlaying = false;
    
    this.choices = ['rock', 'paper', 'scissors'];
    this.emojis = {
      rock: '✊',
      paper: '✋',
      scissors: '✌️'
    };
  }

  init() {
    this.stage = document.getElementById('rps-stage');
    this.btnRock = document.getElementById('btn-rps-rock');
    this.btnPaper = document.getElementById('btn-rps-paper');
    this.btnScissors = document.getElementById('btn-rps-scissors');
    this.playerHand = document.getElementById('rps-player-hand');
    this.aiHand = document.getElementById('rps-ai-hand');
    this.resultBanner = document.getElementById('rps-result-banner');
    this.resultText = document.getElementById('rps-result-text');
    this.historyList = document.getElementById('rps-history-list');

    this.statWins = document.getElementById('stat-rps-wins');
    this.statLosses = document.getElementById('stat-rps-losses');
    this.statTies = document.getElementById('stat-rps-ties');
    this.btnReset = document.getElementById('btn-reset-rps-stats');

    this.loadStats();
    this.updateStatsUI();
    if (!this.stage) return;
    
    if (this.btnRock) this.btnRock.addEventListener('click', () => this.play('rock'));
    if (this.btnPaper) this.btnPaper.addEventListener('click', () => this.play('paper'));
    if (this.btnScissors) this.btnScissors.addEventListener('click', () => this.play('scissors'));
    if (this.btnReset) this.btnReset.addEventListener('click', () => this.resetStats());
  }

  async play(playerChoice) {
    if (this.isPlaying) return;
    this.isPlaying = true;
    
    // Disable buttons
    this.btnRock.disabled = true;
    this.btnPaper.disabled = true;
    this.btnScissors.disabled = true;
    
    // Reset hands to rock for shaking animation
    this.playerHand.textContent = this.emojis.rock;
    this.aiHand.textContent = this.emojis.rock;
    
    this.resultBanner.classList.remove('active', 'win', 'lose', 'tie');
    this.resultText.textContent = 'ROCK, PAPER, SCISSORS...';
    this.resultText.style.color = '#fff';
    this.resultBanner.classList.add('active');

    // Add shaking animation
    this.playerHand.classList.add('shaking');
    this.aiHand.classList.add('shaking');
    
    if (window.soundEngine) window.soundEngine.playRpsClash(); // Play anticipation sound or clash

    // Wait for animation (3 shakes = ~1.2s)
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    this.playerHand.classList.remove('shaking');
    this.aiHand.classList.remove('shaking');
    
    // Determine AI choice
    const randomArr = new Uint8Array(1);
    crypto.getRandomValues(randomArr);
    const aiChoice = this.choices[randomArr[0] % 3];
    
    // Reveal hands
    this.playerHand.textContent = this.emojis[playerChoice];
    this.aiHand.textContent = this.emojis[aiChoice];
    
    // Evaluate result
    this.evaluate(playerChoice, aiChoice);
    
    this.isPlaying = false;
    this.btnRock.disabled = false;
    this.btnPaper.disabled = false;
    this.btnScissors.disabled = false;
  }
  
  evaluate(player, ai) {
    let result = '';
    
    if (player === ai) {
      result = 'tie';
      this.ties++;
      this.resultText.textContent = "IT'S A TIE!";
      this.resultText.style.color = '#a0a0a0';
      if (window.soundEngine) window.soundEngine.playCoinLand();
    } else if (
      (player === 'rock' && ai === 'scissors') ||
      (player === 'paper' && ai === 'rock') ||
      (player === 'scissors' && ai === 'paper')
    ) {
      result = 'win';
      this.wins++;
      this.resultText.textContent = 'YOU WIN!';
      this.resultText.style.color = '#00e676';
      if (window.soundEngine) window.soundEngine.playCoinWin();
      if (window.profileManager) window.profileManager.addXP(50, window.innerWidth / 2, window.innerHeight / 2);
    } else {
      result = 'lose';
      this.losses++;
      this.resultText.textContent = 'AI WINS!';
      this.resultText.style.color = '#ff3366';
      if (window.soundEngine) window.soundEngine.playCoinFlip();
      if (window.profileManager) window.profileManager.triggerLoseEffect();
    }
    
    this.resultBanner.classList.remove('win', 'lose', 'tie');
    this.resultBanner.classList.add(result);
    
    this.saveStats();
    this.updateStats();
    this.addToHistory(player, ai, result);
  }

  saveStats() {
    if (window.profileManager) {
      window.profileManager.saveGameStats('rps', { wins: this.wins, losses: this.losses, ties: this.ties });
    }
  }

  loadStats() {
    const defaultData = { wins: 0, losses: 0, ties: 0 };
    if (window.profileManager) {
      const saved = window.profileManager.getGameStats('rps', defaultData);
      this.wins = saved.wins || 0;
      this.losses = saved.losses || 0;
      this.ties = saved.ties || 0;
    }
  }

  updateStatsUI() {
    this.updateStats();
  }

  updateStats() {
    if (this.statWins) this.statWins.textContent = this.wins;
    if (this.statLosses) this.statLosses.textContent = this.losses;
    if (this.statTies) this.statTies.textContent = this.ties;
  }

  addToHistory(player, ai, result) {
    if (!this.historyList) return;
    const pill = document.createElement('div');
    pill.className = `history-pill ${result}`;
    
    let resultEmoji = '➖';
    if (result === 'win') resultEmoji = '👑';
    if (result === 'lose') resultEmoji = '💀';
    
    pill.innerHTML = `
      <span class="history-pill-result">${this.emojis[player]} vs ${this.emojis[ai]}</span>
      <span class="history-pill-text">${resultEmoji}</span>
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
    this.wins = 0;
    this.losses = 0;
    this.ties = 0;
    this.saveStats();
    this.updateStats();
    if (this.historyList) this.historyList.innerHTML = '<span class="empty-msg">No matches played</span>';
    if (this.resultBanner) this.resultBanner.classList.remove('active');
    if (this.playerHand) this.playerHand.textContent = '✊';
    if (this.aiHand) this.aiHand.textContent = '✊';
  }
}

window.rpsManager = new RpsManager();
