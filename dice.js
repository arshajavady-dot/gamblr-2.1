/* ==========================================================================
   gamblr - Dice Roller Manager
   ========================================================================== */

class DiceManager {
  constructor() {
    this.diceCount = 1;
    this.isRolling = false;
    
    this.totalRolls = 0;
    this.grandSum = 0;
  }

  init() {
    this.stage = document.getElementById('dice-stage');
    this.btnRoll = document.getElementById('btn-roll-dice');
    this.btnReset = document.getElementById('btn-reset-dice-stats');
    this.pickBtns = document.querySelectorAll('.dice-count-btns .pick-btn');
    this.resultBanner = document.getElementById('dice-result-banner');
    this.resultText = document.getElementById('dice-result-text');
    this.historyList = document.getElementById('dice-history-list');

    this.statRolls = document.getElementById('stat-dice-rolls');
    this.statSum = document.getElementById('stat-dice-sum');
    this.statAvg = document.getElementById('stat-dice-avg');

    this.loadStats();
    if (!this.stage || !this.btnRoll) return;

    this.btnRoll.addEventListener('click', () => this.roll());
    if (this.btnReset) this.btnReset.addEventListener('click', () => this.resetStats());

    this.pickBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.pickBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.diceCount = parseInt(e.target.dataset.count);
        this.renderDice(this.diceCount);
      });
    });

    // Initial render
    this.renderDice(this.diceCount);
  }

  renderDice(count) {
    this.stage.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const wrapper = document.createElement('div');
      wrapper.className = 'dice-wrapper';
      wrapper.id = `dice-${i}`;
      
      // Create 6 faces
      for (let f = 1; f <= 6; f++) {
        const face = document.createElement('div');
        face.className = `dice-face face-${f}`;
        // Create dots based on face value
        for(let d = 0; d < f; d++) {
          const dot = document.createElement('div');
          dot.className = 'dot';
          face.appendChild(dot);
        }
        wrapper.appendChild(face);
      }
      this.stage.appendChild(wrapper);
    }
  }

  async roll() {
    if (this.isRolling) return;
    this.isRolling = true;
    this.btnRoll.disabled = true;
    
    this.resultBanner.classList.remove('win');
    this.resultText.textContent = 'ROLLING...';
    this.resultText.style.color = '#fff';

    if (window.soundEngine) window.soundEngine.playSpinStart(); 

    const wrappers = this.stage.querySelectorAll('.dice-wrapper');
    const results = [];

    wrappers.forEach((wrapper, index) => {
      // Get random result 1-6
      const randomArr = new Uint8Array(1);
      crypto.getRandomValues(randomArr);
      const result = (randomArr[0] % 6) + 1;
      results.push(result);

      // Rotations to land on specific face
      const rotations = {
        1: { x: 360, y: 360 },
        2: { x: 360, y: 540 },
        3: { x: 360, y: 450 },
        4: { x: 360, y: 270 },
        5: { x: 270, y: 360 },
        6: { x: 450, y: 360 }
      };

      const spins = 3; 
      const targetRot = rotations[result];
      
      const rX = targetRot.x + (360 * spins);
      const rY = targetRot.y + (360 * spins);
      const rZ = (randomArr[0] % 3) * 90; 

      wrapper.style.transition = 'none';
      wrapper.style.transform = `rotateX(0deg) rotateY(0deg) rotateZ(0deg)`;
      
      void wrapper.offsetWidth;

      wrapper.style.transition = `transform ${1 + (index * 0.2)}s cubic-bezier(0.2, 0.8, 0.2, 1)`;
      wrapper.style.transform = `rotateX(${rX}deg) rotateY(${rY}deg) rotateZ(${rZ}deg)`;
    });

    await new Promise(resolve => setTimeout(resolve, 1000 + (this.diceCount * 200)));

    this.checkResult(results);
    this.isRolling = false;
    this.btnRoll.disabled = false;
  }

  checkResult(results) {
    this.totalRolls++;
    const sum = results.reduce((a, b) => a + b, 0);
    this.grandSum += sum;

    this.resultText.textContent = `TOTAL: ${sum}`;
    this.resultText.style.color = '#00b4d8';
    this.resultBanner.classList.add('win');

    if (window.soundEngine) window.soundEngine.playCoinWin();

    this.saveStats();
    this.updateStats();
    this.addToHistory(results, sum);
  }

  saveStats() {
    if (window.profileManager) {
      window.profileManager.saveGameStats('dice', { totalRolls: this.totalRolls, grandSum: this.grandSum });
    } else {
      localStorage.setItem('gamblr_dice_stats', JSON.stringify({ totalRolls: this.totalRolls, grandSum: this.grandSum }));
    }
  }

  loadStats() {
    const defaultData = { totalRolls: 0, grandSum: 0 };
    if (window.profileManager) {
      const saved = window.profileManager.getGameStats('dice', defaultData);
      this.totalRolls = saved.totalRolls || 0;
      this.grandSum = saved.grandSum || 0;
    }
  }

  updateStatsUI() {
    this.updateStats();
  }

  updateStats() {
    if (this.statRolls) this.statRolls.textContent = this.totalRolls;
    if (this.statSum) this.statSum.textContent = this.grandSum;
    
    const avg = this.totalRolls === 0 ? 0 : (this.grandSum / this.totalRolls).toFixed(1);
    if (this.statAvg) this.statAvg.textContent = avg;
  }

  addToHistory(results, sum) {
    if (!this.historyList) return;
    const pill = document.createElement('div');
    pill.className = 'history-pill win';
    pill.innerHTML = `
      <span class="history-pill-result">[ ${results.join(', ')} ]</span>
      <span class="history-pill-text">Sum: ${sum}</span>
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
    this.totalRolls = 0;
    this.grandSum = 0;
    this.saveStats();
    this.updateStats();
    if (this.historyList) this.historyList.innerHTML = '<span class="empty-msg">No rolls yet</span>';
    if (this.resultText) {
      this.resultText.textContent = 'TOTAL: 0';
      this.resultText.style.color = '#00b4d8';
    }
  }
}

window.diceManager = new DiceManager();
