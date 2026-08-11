/* ==========================================================================
   gamblr - Animal Racing Manager (2D Canvas Race Simulator)
   ========================================================================== */

class RaceManager {
  constructor() {
    this.ctx = null;
    this.userPick = 'turtle'; // default

    this.racers = [
      { id: 'turtle', name: 'Turtle', emoji: '🐢', color: '#00e676', progress: 0, speed: 0, lane: 0, finishRank: 0 },
      { id: 'snail', name: 'Snail', emoji: '🐌', color: '#ffaa00', progress: 0, speed: 0, lane: 1, finishRank: 0 },
      { id: 'rabbit', name: 'Rabbit', emoji: '🐇', color: '#00b4d8', progress: 0, speed: 0, lane: 2, finishRank: 0 },
      { id: 'cheetah', name: 'Cheetah', emoji: '🐆', color: '#ff3366', progress: 0, speed: 0, lane: 3, finishRank: 0 }
    ];

    this.isRacing = false;
    this.finishedCount = 0;
    this.animId = null;

    this.totalRaces = 0;
    this.userWins = 0;
  }

  init() {
    this.canvas = document.getElementById('race-canvas');
    this.btnStart = document.getElementById('btn-race-start');
    this.pickContainer = document.getElementById('race-picker');
    
    this.resultBanner = document.getElementById('race-result-banner');
    this.resultText = document.getElementById('race-result-text');
    this.commentary = document.getElementById('race-commentary');
    this.historyList = document.getElementById('race-history-list');

    this.statRaces = document.getElementById('stat-race-total');
    this.statWins = document.getElementById('stat-race-wins');
    this.statWinRate = document.getElementById('stat-race-winrate');
    this.btnReset = document.getElementById('btn-reset-race-stats');

    this.loadStats();
    this.updateStatsUI();
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.setupPicker();

    if (this.btnStart) this.btnStart.addEventListener('click', () => this.startRace());
    if (this.btnReset) this.btnReset.addEventListener('click', () => this.resetStats());

    this.drawTrack();
  }

  setupPicker() {
    if (!this.pickContainer) return;
    const buttons = this.pickContainer.querySelectorAll('.pick-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.isRacing) return;
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.userPick = btn.dataset.racer;
      });
    });
  }

  startRace() {
    if (this.isRacing) return;
    this.isRacing = true;
    this.finishedCount = 0;
    this.btnStart.disabled = true;

    // Reset racers
    this.racers.forEach(r => {
      r.progress = 0;
      r.finishRank = 0;
      r.speed = Math.random() * 0.4 + 0.3;
    });

    this.resultBanner.className = 'result-banner active';
    this.resultText.textContent = 'AND THEY ARE OFF!';
    this.resultText.style.color = '#fff';
    this.commentary.textContent = 'The racers leap from the starting line!';

    if (window.soundEngine && window.soundEngine.playSpinStart) {
      window.soundEngine.playSpinStart();
    }

    this.raceLoop();
  }

  raceLoop() {
    const loop = () => {
      this.updateRace();
      this.drawTrack();

      if (this.finishedCount < 4) {
        this.animId = requestAnimationFrame(loop);
      } else {
        this.onRaceEnd();
      }
    };
    loop();
  }

  updateRace() {
    const trackLength = this.canvas.width - 90; // Start at 50, finish at width-40

    this.racers.forEach(r => {
      if (r.progress >= trackLength) return;

      // Random speed fluctuations & turbo bursts
      if (Math.random() < 0.05) {
        r.speed = Math.random() * 0.8 + 0.3; // change pace
      }
      
      // Rare boost
      if (Math.random() < 0.008) {
        r.speed += 1.2;
        this.commentary.textContent = `${r.emoji} ${r.name} gets a TURBO BOOST! ⚡`;
      }

      r.progress += r.speed;

      if (r.progress >= trackLength) {
        r.progress = trackLength;
        this.finishedCount++;
        r.finishRank = this.finishedCount;

        if (this.finishedCount === 1) {
          this.commentary.textContent = `🥇 ${r.emoji} ${r.name} TAKES FIRST PLACE!`;
        }
      }
    });
  }

  drawTrack() {
    if (!this.ctx) return;
    const width = this.canvas.width;
    const height = this.canvas.height;

    this.ctx.clearRect(0, 0, width, height);

    const laneHeight = height / 4;

    // Draw lanes
    for (let i = 0; i < 4; i++) {
      const y = i * laneHeight;
      this.ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.06)';
      this.ctx.fillRect(0, y, width, laneHeight);

      // Lane divider
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();

      // Lane number
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      this.ctx.font = 'bold 12px sans-serif';
      this.ctx.fillText(`L${i+1}`, 15, y + laneHeight / 2 + 4);
    }

    // Start Line
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(50, 0);
    this.ctx.lineTo(50, height);
    this.ctx.stroke();

    // Finish Line Checkered
    const finishX = width - 40;
    this.ctx.fillStyle = '#ffffff';
    for (let y = 0; y < height; y += 10) {
      if ((y / 10) % 2 === 0) {
        this.ctx.fillRect(finishX, y, 8, 10);
        this.ctx.fillRect(finishX + 8, y + 5, 8, 5);
      } else {
        this.ctx.fillRect(finishX + 8, y, 8, 10);
      }
    }

    // Draw racers
    this.racers.forEach(r => {
      const y = r.lane * laneHeight + laneHeight / 2;
      const x = 50 + r.progress;

      // Draw Emoji
      this.ctx.font = '28px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(r.emoji, x, y);

      // Draw Rank if finished
      if (r.finishRank > 0) {
        this.ctx.fillStyle = r.finishRank === 1 ? '#ffd700' : '#ffffff';
        this.ctx.font = 'bold 12px sans-serif';
        this.ctx.fillText(`#${r.finishRank}`, x + 24, y);
      }
    });
  }

  onRaceEnd() {
    this.isRacing = false;
    this.btnStart.disabled = false;
    this.totalRaces++;

    // Find winner
    const winner = this.racers.find(r => r.finishRank === 1);
    const userWon = (winner.id === this.userPick);

    if (userWon) {
      this.userWins++;
      this.resultText.textContent = `YOU WON! ${winner.emoji} ${winner.name.toUpperCase()} WON THE RACE!`;
      this.resultText.style.color = '#00e676';
      this.resultBanner.className = 'result-banner active win';
      if (window.soundEngine) window.soundEngine.playCoinWin();
      if (window.profileManager) window.profileManager.addXP(100, window.innerWidth / 2, window.innerHeight / 2);
    } else {
      this.resultText.textContent = `${winner.emoji} ${winner.name.toUpperCase()} WINS! BETTER LUCK NEXT TIME!`;
      this.resultText.style.color = '#ff3366';
      this.resultBanner.className = 'result-banner active lose';
      if (window.profileManager) window.profileManager.triggerLoseEffect();
    }

    this.saveStats();
    this.updateStats();
    this.addToHistory(winner, userWon);
  }

  saveStats() {
    if (window.profileManager) {
      window.profileManager.saveGameStats('race', { totalRaces: this.totalRaces, userWins: this.userWins });
    }
  }

  loadStats() {
    const defaultData = { totalRaces: 0, userWins: 0 };
    if (window.profileManager) {
      const saved = window.profileManager.getGameStats('race', defaultData);
      this.totalRaces = saved.totalRaces || 0;
      this.userWins = saved.userWins || 0;
    }
  }

  updateStatsUI() {
    this.updateStats();
  }

  updateStats() {
    if (this.statRaces) this.statRaces.textContent = this.totalRaces;
    if (this.statWins) this.statWins.textContent = this.userWins;
    
    const rate = this.totalRaces > 0 ? Math.round((this.userWins / this.totalRaces) * 100) : 0;
    if (this.statWinRate) this.statWinRate.textContent = rate + '%';
  }

  addToHistory(winner, userWon) {
    if (!this.historyList) return;
    const pill = document.createElement('div');
    pill.className = `history-pill ${userWon ? 'win' : 'lose'}`;
    pill.innerHTML = `
      <span class="history-pill-result">Race Winner: ${winner.emoji} ${winner.name}</span>
      <span class="history-pill-text">${userWon ? '🏆 WIN' : '❌ LOST'}</span>
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
    this.totalRaces = 0;
    this.userWins = 0;
    this.saveStats();
    this.updateStats();
    if (this.historyList) this.historyList.innerHTML = '<span class="empty-msg">No races yet</span>';
    if (this.resultBanner) this.resultBanner.className = 'result-banner';
    this.drawTrack();
  }
}

window.raceManager = new RaceManager();
