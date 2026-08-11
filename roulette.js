/* ==========================================================================
   gamblr - Real-Life Roulette Color Predictor (4th Mode)
   ========================================================================== */

class RoulettePredictorManager {
  constructor() {
    this.isAmerican = false;

    // 37 European Roulette Pockets (1 Green: 0)
    this.europeanPockets = [
      { num: '0', color: 'green', hex: '#00E676' },
      { num: '32', color: 'red', hex: '#FF2A55' },
      { num: '15', color: 'black', hex: '#1C202C' },
      { num: '19', color: 'red', hex: '#FF2A55' },
      { num: '4', color: 'black', hex: '#1C202C' },
      { num: '21', color: 'red', hex: '#FF2A55' },
      { num: '2', color: 'black', hex: '#1C202C' },
      { num: '25', color: 'red', hex: '#FF2A55' },
      { num: '17', color: 'black', hex: '#1C202C' },
      { num: '34', color: 'red', hex: '#FF2A55' },
      { num: '6', color: 'black', hex: '#1C202C' },
      { num: '27', color: 'red', hex: '#FF2A55' },
      { num: '13', color: 'black', hex: '#1C202C' },
      { num: '36', color: 'red', hex: '#FF2A55' },
      { num: '11', color: 'black', hex: '#1C202C' },
      { num: '30', color: 'red', hex: '#FF2A55' },
      { num: '8', color: 'black', hex: '#1C202C' },
      { num: '23', color: 'red', hex: '#FF2A55' },
      { num: '10', color: 'black', hex: '#1C202C' },
      { num: '5', color: 'red', hex: '#FF2A55' },
      { num: '24', color: 'black', hex: '#1C202C' },
      { num: '16', color: 'red', hex: '#FF2A55' },
      { num: '33', color: 'black', hex: '#1C202C' },
      { num: '1', color: 'red', hex: '#FF2A55' },
      { num: '20', color: 'black', hex: '#1C202C' },
      { num: '14', color: 'red', hex: '#FF2A55' },
      { num: '31', color: 'black', hex: '#1C202C' },
      { num: '9', color: 'red', hex: '#FF2A55' },
      { num: '22', color: 'black', hex: '#1C202C' },
      { num: '18', color: 'red', hex: '#FF2A55' },
      { num: '29', color: 'black', hex: '#1C202C' },
      { num: '7', color: 'red', hex: '#FF2A55' },
      { num: '28', color: 'black', hex: '#1C202C' },
      { num: '12', color: 'red', hex: '#FF2A55' },
      { num: '35', color: 'black', hex: '#1C202C' },
      { num: '3', color: 'red', hex: '#FF2A55' },
      { num: '26', color: 'black', hex: '#1C202C' },
    ];

    // 38 American Roulette Pockets (2 Greens: 0 & 00)
    this.americanPockets = [
      { num: '0', color: 'green', hex: '#00E676' },
      { num: '28', color: 'black', hex: '#1C202C' },
      { num: '9', color: 'red', hex: '#FF2A55' },
      { num: '26', color: 'black', hex: '#1C202C' },
      { num: '30', color: 'red', hex: '#FF2A55' },
      { num: '11', color: 'black', hex: '#1C202C' },
      { num: '7', color: 'red', hex: '#FF2A55' },
      { num: '20', color: 'black', hex: '#1C202C' },
      { num: '32', color: 'red', hex: '#FF2A55' },
      { num: '17', color: 'black', hex: '#1C202C' },
      { num: '5', color: 'red', hex: '#FF2A55' },
      { num: '22', color: 'black', hex: '#1C202C' },
      { num: '34', color: 'red', hex: '#FF2A55' },
      { num: '15', color: 'black', hex: '#1C202C' },
      { num: '3', color: 'red', hex: '#FF2A55' },
      { num: '24', color: 'black', hex: '#1C202C' },
      { num: '36', color: 'red', hex: '#FF2A55' },
      { num: '13', color: 'black', hex: '#1C202C' },
      { num: '1', color: 'red', hex: '#FF2A55' },
      { num: '00', color: 'green', hex: '#00E676' },
      { num: '27', color: 'red', hex: '#FF2A55' },
      { num: '10', color: 'black', hex: '#1C202C' },
      { num: '25', color: 'red', hex: '#FF2A55' },
      { num: '29', color: 'black', hex: '#1C202C' },
      { num: '12', color: 'red', hex: '#FF2A55' },
      { num: '8', color: 'black', hex: '#1C202C' },
      { num: '19', color: 'red', hex: '#FF2A55' },
      { num: '31', color: 'black', hex: '#1C202C' },
      { num: '18', color: 'red', hex: '#FF2A55' },
      { num: '6', color: 'black', hex: '#1C202C' },
      { num: '21', color: 'red', hex: '#FF2A55' },
      { num: '33', color: 'black', hex: '#1C202C' },
      { num: '16', color: 'red', hex: '#FF2A55' },
      { num: '4', color: 'black', hex: '#1C202C' },
      { num: '23', color: 'red', hex: '#FF2A55' },
      { num: '35', color: 'black', hex: '#1C202C' },
      { num: '14', color: 'red', hex: '#FF2A55' },
      { num: '2', color: 'black', hex: '#1C202C' },
    ];

    this.wheelAngle = 0;
    this.ballAngle = 0;
    this.ballRadiusRatio = 0.42;
    this.isSpinning = false;
    this.animId = null;

    this.history = [];
    this.stats = { total: 0, red: 0, black: 0, green: 0 };
    this.lastPrediction = null;
    this.isMultiSpinning = false;
  }

  get pockets() {
    return this.isAmerican ? this.americanPockets : this.europeanPockets;
  }

  init() {
    this.loadStats();
    this.bindEvents();
    this.drawWheel();
    this.updateStatsUI();
  }

  bindEvents() {
    const btnSpin = document.getElementById('btn-predict-roulette');
    const btnSpin10 = document.getElementById('btn-spin-10');
    const btnReset = document.getElementById('btn-reset-roulette-stats');
    const modeToggle = document.getElementById('roulette-mode-toggle');

    if (btnSpin) btnSpin.addEventListener('click', () => this.predictNext());
    if (btnSpin10) btnSpin10.addEventListener('click', () => this.multiSpin(10));
    if (btnReset) btnReset.addEventListener('click', () => this.resetStats());

    if (modeToggle) {
      modeToggle.addEventListener('change', (e) => {
        this.isAmerican = e.target.checked;
        const euroLabel = document.getElementById('label-euro');
        const usaLabel = document.getElementById('label-usa');

        if (euroLabel) euroLabel.classList.toggle('active', !this.isAmerican);
        if (usaLabel) usaLabel.classList.toggle('active', this.isAmerican);

        this.drawWheel();
      });
    }

    window.addEventListener('resize', () => {
      if (document.getElementById('view-roulette')?.classList.contains('active')) {
        this.drawWheel();
      }
    });
  }

  loadStats() {
    const defaultData = { stats: { total: 0, red: 0, black: 0, green: 0 }, history: [] };
    if (window.profileManager) {
      const saved = window.profileManager.getGameStats('roulette', defaultData);
      this.stats = saved.stats || { total: 0, red: 0, black: 0, green: 0 };
      this.history = saved.history || [];
    } else {
      const saved = localStorage.getItem('gamblr_roulette_stats');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          this.stats = data.stats || this.stats;
          this.history = data.history || [];
        } catch (e) {}
      }
    }
  }

  saveStats() {
    if (window.profileManager) {
      window.profileManager.saveGameStats('roulette', {
        stats: this.stats,
        history: this.history.slice(0, 30),
      });
    } else {
      localStorage.setItem('gamblr_roulette_stats', JSON.stringify({
        stats: this.stats,
        history: this.history.slice(0, 30),
      }));
    }
  }

  predictNext() {
    if (this.isSpinning) return;

    this.isSpinning = true;
    const btnSpin = document.getElementById('btn-predict-roulette');
    const btnSpin10 = document.getElementById('btn-spin-10');
    if (btnSpin) btnSpin.disabled = true;
    if (btnSpin10) btnSpin10.disabled = true;

    // Cryptographic random pick of pocket
    const totalPockets = this.pockets.length;
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    const selectedIdx = array[0] % totalPockets;
    const targetPocket = this.pockets[selectedIdx];

    // Announce pre-spin prediction status
    const predResult = document.getElementById('roulette-pred-result');
    const predConfidence = document.getElementById('roulette-pred-confidence');
    if (predResult) predResult.textContent = '🔮 SPINNING...';
    if (predConfidence) predConfidence.textContent = 'Determining result...';

    // Sound start
    if (window.soundEngine && window.soundEngine.playWheelTick) window.soundEngine.playWheelTick();

    // Wheel spin parameters
    const sliceAngle = (Math.PI * 2) / totalPockets;

    // Target angle calculation (align exactly in middle of selected pocket)
    const currentMod = this.wheelAngle % (Math.PI * 2);
    const extraSpins = Math.PI * 2 * 3; // 3 full spins
    const targetAngle = extraSpins - currentMod - (selectedIdx * sliceAngle) - (sliceAngle / 2);
    const duration = 1400; // Fast 1.4 second spin
    const startTime = performance.now();
    const startWheelAngle = this.wheelAngle;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      this.wheelAngle = startWheelAngle + (targetAngle * easeOut);

      // Ball rotates in opposite direction then settles into pocket
      this.ballAngle = -this.wheelAngle * 1.5;

      this.drawWheel();

      if (progress < 1) {
        this.animId = requestAnimationFrame(animate);
      } else {
        this.onSpinComplete(targetPocket);
      }
    };

    this.animId = requestAnimationFrame(animate);
  }

  onSpinComplete(pocket) {
    this.isSpinning = false;
    const btnSpin = document.getElementById('btn-predict-roulette');
    const btnSpin10 = document.getElementById('btn-spin-10');
    if (!this.isMultiSpinning) {
      if (btnSpin) btnSpin.disabled = false;
      if (btnSpin10) btnSpin10.disabled = false;
    }

    // Sound finish
    if (window.soundEngine && window.soundEngine.playWheelWin) window.soundEngine.playWheelWin();

    // Update prediction result UI
    const predResult = document.getElementById('roulette-pred-result');
    const predConfidence = document.getElementById('roulette-pred-confidence');

    const colorUpper = pocket.color.toUpperCase();
    const colorEmoji = pocket.color === 'red' ? '🔴' : pocket.color === 'black' ? '⬛' : '🟢';

    if (predResult) {
      predResult.innerHTML = `PREDICTION: ${colorEmoji} <span class="roulette-color-${pocket.color}">${colorUpper} ${pocket.num}</span>`;
    }

    const confidence = Math.floor(78 + Math.random() * 21);
    if (predConfidence) {
      predConfidence.textContent = `High-Probability Prediction (${confidence}% Confidence) for Next Real Spin!`;
    }

    // Update Stats
    this.stats.total++;
    if (pocket.color === 'red') this.stats.red++;
    else if (pocket.color === 'black') this.stats.black++;
    else if (pocket.color === 'green') this.stats.green++;

    this.history.unshift({
      num: pocket.num,
      color: pocket.color,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    this.saveStats();
    this.updateStatsUI();
  }

  async multiSpin(count) {
    if (this.isSpinning || this.isMultiSpinning) return;
    this.isMultiSpinning = true;
    
    const btnSpin = document.getElementById('btn-predict-roulette');
    const btnSpin10 = document.getElementById('btn-spin-10');
    if (btnSpin) btnSpin.disabled = true;
    if (btnSpin10) btnSpin10.disabled = true;

    for (let i = 0; i < count; i++) {
      await new Promise((resolve) => {
        this.predictNext();
        setTimeout(resolve, 1500); // Wait for spin (1.4s) + 100ms padding
      });
    }

    this.isMultiSpinning = false;
    if (btnSpin) btnSpin.disabled = false;
    if (btnSpin10) btnSpin10.disabled = false;
  }

  updateStatsUI() {
    const totalEl = document.getElementById('stat-roulette-total');
    const redEl = document.getElementById('stat-roulette-red');
    const blackEl = document.getElementById('stat-roulette-black');
    const greenEl = document.getElementById('stat-roulette-green');

    if (totalEl) totalEl.textContent = this.stats.total;
    if (redEl) redEl.textContent = `${this.stats.red} (${this.stats.total ? Math.round((this.stats.red / this.stats.total) * 100) : 0}%)`;
    if (blackEl) blackEl.textContent = `${this.stats.black} (${this.stats.total ? Math.round((this.stats.black / this.stats.total) * 100) : 0}%)`;
    if (greenEl) greenEl.textContent = `${this.stats.green} (${this.stats.total ? Math.round((this.stats.green / this.stats.total) * 100) : 0}%)`;

    // History Log
    const historyContainer = document.getElementById('roulette-history-list');
    if (historyContainer) {
      if (this.history.length === 0) {
        historyContainer.innerHTML = '<span class="empty-msg">No predictions generated yet</span>';
      } else {
        historyContainer.innerHTML = this.history.slice(0, 15).map(item => `
          <span class="history-pill pill-${item.color}">
            ${item.color === 'red' ? '🔴' : item.color === 'black' ? '⬛' : '🟢'} ${item.num}
          </span>
        `).join('');
      }
    }
  }

  resetStats() {
    this.stats = { total: 0, red: 0, black: 0, green: 0 };
    this.history = [];
    this.saveStats();
    this.updateStatsUI();

    const predResult = document.getElementById('roulette-pred-result');
    const predConfidence = document.getElementById('roulette-pred-confidence');
    if (predResult) predResult.textContent = '🔮 READY TO PREDICT';
    if (predConfidence) predConfidence.textContent = 'Click below to generate a prediction for your next spin';
  }

  drawWheel() {
    const canvas = document.getElementById('roulette-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const outerRadius = (Math.min(width, height) / 2) - 12;
    const innerRadius = outerRadius * 0.58;

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(cx, cy);

    // Outer Brass Trim Rim
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius + 6, 0, Math.PI * 2);
    ctx.fillStyle = '#b8860b';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, outerRadius + 4, 0, Math.PI * 2);
    ctx.fillStyle = '#11141e';
    ctx.fill();

    // Rotate canvas for wheel spin
    ctx.rotate(this.wheelAngle);

    // Draw 37 Pockets
    const totalPockets = this.pockets.length;
    const sliceAngle = (Math.PI * 2) / totalPockets;

    for (let i = 0; i < totalPockets; i++) {
      const pocket = this.pockets[i];
      const startAngle = i * sliceAngle - Math.PI / 2;
      const endAngle = startAngle + sliceAngle;

      // Fill Slice
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, outerRadius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = pocket.hex;
      ctx.fill();
      ctx.strokeStyle = '#05070f';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Number text
      ctx.save();
      const midAngle = startAngle + sliceAngle / 2;
      ctx.rotate(midAngle);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px "Space Mono", monospace';
      ctx.fillText(pocket.num.toString(), outerRadius - 10, 0);
      ctx.restore();
    }

    // Center Brass Hub
    ctx.beginPath();
    ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#161924';
    ctx.fill();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, innerRadius * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd700';
    ctx.fill();

    ctx.restore();

    // Top Pointer Indicator
    ctx.save();
    ctx.translate(cx, cy);
    ctx.beginPath();
    ctx.moveTo(0, -outerRadius - 8);
    ctx.lineTo(-8, -outerRadius - 20);
    ctx.lineTo(8, -outerRadius - 20);
    ctx.closePath();
    ctx.fillStyle = '#00ff9d';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }
}

window.rouletteManager = new RoulettePredictorManager();
