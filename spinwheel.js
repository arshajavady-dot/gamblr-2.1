/* ==========================================================================
   gamblr - Custom Spin Wheel Engine & Logic
   ========================================================================== */

const NEON_PALETTE = [
  '#00ff9d', '#ffd700', '#9d4edd', '#00b4d8', '#ff4d6d',
  '#ff9e00', '#70e000', '#3a0ca3', '#48cae4', '#f72585'
];

const PRESETS = {
  food: ["🍕 Pizza", "🍔 Burgers", "🌮 Tacos", "🍣 Sushi", "🥗 Salad", "🍜 Ramen"],
  yesno: ["YES! ✅", "NO! ❌", "MAYBE 🤔", "SPIN AGAIN 🔄"],
  dice: ["1 🎲", "2 🎲", "3 🎲", "4 🎲", "5 🎲", "6 🎲"],
  truth: ["Dare 🔥", "Truth 💡", "Pass 🛡️", "Double Dare ⚡"]
};

class SpinWheelManager {
  constructor() {
    this.segments = ["Option 1", "Option 2", "Option 3", "Option 4", "Option 5"];
    this.currentAngle = 0; // in radians
    this.isSpinning = false;
    this.lastTickSegment = -1;

    this.stats = {
      totalSpins: 0,
      history: []
    };

    this.loadData();
  }

  init() {
    this.loadData();
    this.bindEvents();
    this.renderSegmentEditor();
    this.drawWheel();
    this.updateStatsUI();
  }

  bindEvents() {
    const btnSpin = document.getElementById('btn-spin-wheel');
    const canvas = document.getElementById('wheel-canvas');
    const btnAdd = document.getElementById('btn-add-segment');
    const inputSegment = document.getElementById('segment-input');
    const btnResetStats = document.getElementById('btn-reset-wheel-stats');
    const presetBtns = document.querySelectorAll('.preset-btn');

    if (btnSpin) btnSpin.addEventListener('click', () => this.spin());
    if (canvas) canvas.addEventListener('click', () => this.spin());

    if (btnAdd && inputSegment) {
      const addHandler = () => {
        const val = inputSegment.value.trim();
        if (val) {
          this.segments.push(val);
          inputSegment.value = '';
          this.saveData();
          this.renderSegmentEditor();
          this.drawWheel();
        }
      };

      btnAdd.addEventListener('click', addHandler);
      inputSegment.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addHandler();
      });
    }

    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const presetKey = btn.dataset.preset;
        if (PRESETS[presetKey]) {
          this.segments = [...PRESETS[presetKey]];
          this.saveData();
          this.renderSegmentEditor();
          this.drawWheel();
        }
      });
    });

    if (btnResetStats) {
      btnResetStats.addEventListener('click', () => this.resetStats());
    }

    window.addEventListener('resize', () => this.drawWheel());
  }

  drawWheel() {
    const canvas = document.getElementById('wheel-canvas');
    if (!canvas) return;

    // Safety checks for hidden or unrendered canvas
    const width = canvas.clientWidth || 260;
    const height = canvas.clientHeight || 260;
    const radius = Math.min(width / 2, height / 2) - 15;

    if (radius <= 0) return; // Prevent negative radius DOMException

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const centerX = width / 2;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);

    if (this.segments.length === 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#151c2c';
      ctx.fill();
      ctx.strokeStyle = '#00ff9d';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 16px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Add options to spin!', centerX, centerY);
      return;
    }

    const numSegments = this.segments.length;
    const sliceAngle = (Math.PI * 2) / numSegments;

    // Draw outer glow border
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 6, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 255, 157, 0.4)';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Draw Slices
    for (let i = 0; i < numSegments; i++) {
      const startAngle = this.currentAngle + i * sliceAngle;
      const endAngle = startAngle + sliceAngle;
      const color = NEON_PALETTE[i % NEON_PALETTE.length];

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = color;
      ctx.fill();

      ctx.strokeStyle = '#07090e';
      ctx.lineWidth = 3;
      ctx.stroke();

      const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      grad.addColorStop(0, 'rgba(0,0,0,0.15)');
      grad.addColorStop(0.7, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.35)');

      ctx.fillStyle = grad;
      ctx.fill();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = '#07090e';
      ctx.shadowColor = 'rgba(255,255,255,0.4)';
      ctx.shadowBlur = 4;
      ctx.font = '700 15px Outfit, sans-serif';

      const text = this.segments[i];
      const maxTextWidth = radius - 45;
      ctx.fillText(truncateText(ctx, text, maxTextWidth), radius - 20, 0);

      ctx.restore();
    }

    // Draw Center Cap / Pin Knob
    ctx.beginPath();
    ctx.arc(centerX, centerY, Math.min(28, radius * 0.3), 0, Math.PI * 2);
    ctx.fillStyle = '#07090e';
    ctx.fill();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, Math.min(12, radius * 0.15), 0, Math.PI * 2);
    ctx.fillStyle = '#ffd700';
    ctx.fill();
  }

  spin() {
    if (this.isSpinning || this.segments.length < 2) return;
    this.isSpinning = true;

    const btnSpin = document.getElementById('btn-spin-wheel');
    if (btnSpin) btnSpin.disabled = true;

    const banner = document.getElementById('wheel-result-banner');
    if (banner) {
      banner.innerHTML = '<span class="result-text">SPINNING...</span>';
    }

    const numSegments = this.segments.length;
    const sliceAngle = (Math.PI * 2) / numSegments;
    const randomRotations = (Math.floor(Math.random() * 5) + 6) * Math.PI * 2;
    const randomOffset = Math.random() * Math.PI * 2;
    const targetAngle = this.currentAngle + randomRotations + randomOffset;

    const duration = 4500;
    const startTime = performance.now();
    const startAngle = this.currentAngle;
    const deltaAngle = targetAngle - startAngle;

    this.lastTickSegment = -1;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const ease = 1 - Math.pow(1 - progress, 3);
      this.currentAngle = startAngle + deltaAngle * ease;

      const normalizedAngle = (2 * Math.PI - (this.currentAngle % (2 * Math.PI)) - Math.PI / 2 + Math.PI * 4) % (2 * Math.PI);
      const currentSegment = Math.floor(normalizedAngle / sliceAngle) % numSegments;

      if (currentSegment !== this.lastTickSegment) {
        if (window.soundEngine) window.soundEngine.playWheelTick();
        this.lastTickSegment = currentSegment;

        const needle = document.getElementById('wheel-pointer');
        if (needle) {
          needle.classList.remove('tick');
          void needle.offsetWidth;
          needle.classList.add('tick');
        }
      }

      this.drawWheel();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isSpinning = false;
        if (btnSpin) btnSpin.disabled = false;

        const winner = this.segments[currentSegment];
        if (window.soundEngine) window.soundEngine.playWheelWin();
        this.processResult(winner);
      }
    };

    requestAnimationFrame(animate);
  }

  processResult(winner) {
    this.stats.totalSpins++;
    
    const logEntry = {
      winner,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    this.stats.history.unshift(logEntry);
    if (this.stats.history.length > 25) this.stats.history.pop();

    this.saveData();
    this.updateStatsUI();

    const banner = document.getElementById('wheel-result-banner');
    if (banner) {
      banner.innerHTML = `
        <span class="result-text winner-glow">WINNER: ${escapeHtml(winner)} 🎉</span>
      `;
    }
  }

  renderSegmentEditor() {
    const listEl = document.getElementById('segment-list');
    if (!listEl) return;

    if (this.segments.length === 0) {
      listEl.innerHTML = '<span class="empty-msg">No options added yet</span>';
      return;
    }

    listEl.innerHTML = this.segments.map((seg, idx) => `
      <div class="segment-tag" style="border-color: ${NEON_PALETTE[idx % NEON_PALETTE.length]}">
        <span class="color-dot" style="background: ${NEON_PALETTE[idx % NEON_PALETTE.length]}"></span>
        <span class="tag-text">${escapeHtml(seg)}</span>
        <button class="remove-btn" onclick="window.spinWheelManager.removeSegment(${idx})" title="Remove">✕</button>
      </div>
    `).join('');
  }

  removeSegment(idx) {
    if (this.isSpinning) return;
    this.segments.splice(idx, 1);
    this.saveData();
    this.renderSegmentEditor();
    this.drawWheel();
  }

  updateStatsUI() {
    const elTotal = document.getElementById('stat-wheel-total');
    const elCount = document.getElementById('stat-wheel-options');
    const historyList = document.getElementById('wheel-history-list');

    if (elTotal) elTotal.textContent = this.stats.totalSpins;
    if (elCount) elCount.textContent = this.segments.length;

    if (historyList) {
      if (this.stats.history.length === 0) {
        historyList.innerHTML = '<span class="empty-msg">No spins yet</span>';
      } else {
        historyList.innerHTML = this.stats.history
          .map(item => `
            <div class="history-pill wheel-win">
              <span class="symbol">🎯</span> ${escapeHtml(item.winner)}
            </div>
          `)
          .join('');
      }
    }
  }

  saveData() {
    if (window.profileManager) {
      window.profileManager.saveGameStats('wheel', { segments: this.segments, stats: this.stats });
    } else {
      localStorage.setItem('gamblr_wheel_segments', JSON.stringify(this.segments));
      localStorage.setItem('gamblr_wheel_stats', JSON.stringify(this.stats));
    }
  }

  loadStats() {
    this.loadData();
  }

  loadData() {
    const defaultData = { segments: ['🍕 Pizza', '🍔 Burger', '🍣 Sushi', '🌮 Tacos'], stats: { totalSpins: 0, history: [] } };
    if (window.profileManager) {
      const saved = window.profileManager.getGameStats('wheel', defaultData);
      if (saved.segments) this.segments = saved.segments;
      if (saved.stats) this.stats = Object.assign({ totalSpins: 0, history: [] }, saved.stats);
    } else {
      const savedSegs = localStorage.getItem('gamblr_wheel_segments');
      if (savedSegs) {
        try { this.segments = JSON.parse(savedSegs); } catch (e) {}
      }
      const savedStats = localStorage.getItem('gamblr_wheel_stats');
      if (savedStats) {
        try { this.stats = Object.assign(this.stats, JSON.parse(savedStats)); } catch (e) {}
      }
    }
  }

  resetStats() {
    this.stats = { totalSpins: 0, history: [] };
    this.saveData();
    this.updateStatsUI();

    const banner = document.getElementById('wheel-result-banner');
    if (banner) banner.innerHTML = '<span class="result-text">READY TO SPIN</span>';
  }
}

function truncateText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(truncated + '…').width > maxWidth) {
    truncated = truncated.substring(0, truncated.length - 1);
  }
  return truncated + '…';
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

window.spinWheelManager = new SpinWheelManager();
