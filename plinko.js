/* ==========================================================================
   gamblr - Plinko Game Manager (HTML5 Canvas Physics)
   ========================================================================== */

class PlinkoManager {
  constructor() {
    this.ctx = null;
    this.pegs = [];
    this.buckets = [];
    this.balls = [];
    this.particles = [];
    
    this.multipliers = [10.0, 3.0, 1.5, 0.5, 0.2, 0.5, 1.5, 3.0, 10.0];
    this.bucketColors = [
      '#ff0055', '#ff4000', '#ffaa00', '#00e676', '#00b4d8', '#00e676', '#ffaa00', '#ff4000', '#ff0055'
    ];

    this.totalDrops = 0;
    this.bestWin = 0;

    this.animId = null;
  }

  init() {
    this.canvas = document.getElementById('plinko-canvas');
    this.btnDrop = document.getElementById('btn-plinko-drop');
    this.btnDrop5 = document.getElementById('btn-plinko-drop5');
    
    this.resultBanner = document.getElementById('plinko-result-banner');
    this.resultText = document.getElementById('plinko-result-text');
    this.historyList = document.getElementById('plinko-history-list');

    this.statDrops = document.getElementById('stat-plinko-drops');
    this.statBest = document.getElementById('stat-plinko-best');
    this.btnReset = document.getElementById('btn-reset-plinko-stats');

    this.loadStats();
    this.updateStatsUI();
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.setupBoard();

    if (this.btnDrop) this.btnDrop.addEventListener('click', () => this.dropBall());
    if (this.btnDrop5) this.btnDrop5.addEventListener('click', () => this.dropMulti(5));
    if (this.btnReset) this.btnReset.addEventListener('click', () => this.resetStats());

    this.startAnimationLoop();
  }

  setupBoard() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    this.pegs = [];
    const rows = 8;
    const startY = 60;
    const rowGap = 32;

    for (let r = 0; r < rows; r++) {
      const pegCount = r + 3;
      const spacing = 36;
      const startX = (width - (pegCount - 1) * spacing) / 2;
      for (let c = 0; c < pegCount; c++) {
        this.pegs.push({
          x: startX + c * spacing,
          y: startY + r * rowGap,
          radius: 5,
          hitTime: 0
        });
      }
    }

    // Setup buckets at the bottom
    this.buckets = [];
    const bucketCount = this.multipliers.length;
    const bucketWidth = width / bucketCount;
    const bucketY = height - 35;

    for (let i = 0; i < bucketCount; i++) {
      this.buckets.push({
        x: i * bucketWidth,
        y: bucketY,
        width: bucketWidth,
        height: 35,
        mult: this.multipliers[i],
        color: this.bucketColors[i]
      });
    }
  }

  dropBall() {
    const width = this.canvas.width;
    // Small random offset near center top
    const startX = width / 2 + (Math.random() * 8 - 4);
    
    this.balls.push({
      x: startX,
      y: 25,
      vx: (Math.random() * 2 - 1),
      vy: 1,
      radius: 7,
      color: '#00ff9d'
    });

    this.totalDrops++;
    this.updateStats();
  }

  dropMulti(count) {
    let delay = 0;
    for (let i = 0; i < count; i++) {
      setTimeout(() => this.dropBall(), delay);
      delay += 250;
    }
  }

  startAnimationLoop() {
    const loop = () => {
      this.updatePhysics();
      this.draw();
      this.animId = requestAnimationFrame(loop);
    };
    loop();
  }

  updatePhysics() {
    const gravity = 0.25;
    const bounce = 0.6;
    const friction = 0.98;

    for (let i = this.balls.length - 1; i >= 0; i--) {
      const b = this.balls[i];
      b.vy += gravity;
      b.vx *= friction;
      b.x += b.vx;
      b.y += b.vy;

      // Peg collisions
      for (let p of this.pegs) {
        const dx = b.x - p.x;
        const dy = b.y - p.y;
        const dist = Math.hypot(dx, dy);
        const minDist = b.radius + p.radius;

        if (dist < minDist) {
          p.hitTime = Date.now();
          
          // Sound
          if (window.soundEngine && window.soundEngine.playPegBounce) {
            window.soundEngine.playPegBounce();
          }

          // Bounce math
          const nx = dx / dist;
          const ny = dy / dist;
          const kx = b.vx - p.hitTime;
          
          b.x = p.x + nx * minDist;
          b.y = p.y + ny * minDist;

          b.vx = (nx * 2 + (Math.random() * 1.5 - 0.75)) * 1.8;
          b.vy = Math.abs(ny) * 2 + 1;
        }
      }

      // Check bucket collision
      const bucketY = this.canvas.height - 35;
      if (b.y >= bucketY) {
        // Find which bucket
        const bucketIndex = Math.floor(b.x / (this.canvas.width / this.buckets.length));
        const clampedIndex = Math.max(0, Math.min(this.buckets.length - 1, bucketIndex));
        const bucket = this.buckets[clampedIndex];

        this.onBallLand(bucket);

        // Spawn particles
        for (let k = 0; k < 12; k++) {
          this.particles.push({
            x: b.x,
            y: bucketY,
            vx: (Math.random() * 4 - 2),
            vy: -(Math.random() * 4 + 2),
            color: bucket.color,
            life: 1.0
          });
        }

        this.balls.splice(i, 1);
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life -= 0.04;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }
  }

  onBallLand(bucket) {
    const mult = bucket.mult;
    if (mult > this.bestWin) this.bestWin = mult;

    this.resultText.textContent = `LANDED: ${mult}x MULTIPLIER!`;
    this.resultText.style.color = bucket.color;
    this.resultBanner.className = 'result-banner active ' + (mult >= 1.5 ? 'win' : 'lose');

    if (mult >= 1.5) {
      if (window.soundEngine) window.soundEngine.playCoinWin();
      if (window.profileManager) window.profileManager.addXP(Math.round(30 * mult), window.innerWidth / 2, window.innerHeight / 2);
    }
    this.saveStats();
    this.updateStats();
    this.addToHistory(mult, bucket.color);
  }

  saveStats() {
    if (window.profileManager) {
      window.profileManager.saveGameStats('plinko', { totalDrops: this.totalDrops, bestWin: this.bestWin });
    }
  }

  loadStats() {
    const defaultData = { totalDrops: 0, bestWin: 0 };
    if (window.profileManager) {
      const saved = window.profileManager.getGameStats('plinko', defaultData);
      this.totalDrops = saved.totalDrops || 0;
      this.bestWin = saved.bestWin || 0;
    }
  }

  updateStatsUI() {
    this.updateStats();
  }

  draw() {
    if (!this.ctx) return;
    const width = this.canvas.width;
    const height = this.canvas.height;

    this.ctx.clearRect(0, 0, width, height);

    // Draw pegs
    const now = Date.now();
    for (let p of this.pegs) {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      
      const isLit = (now - p.hitTime < 150);
      this.ctx.fillStyle = isLit ? '#00ff9d' : 'rgba(255, 255, 255, 0.4)';
      this.ctx.shadowColor = isLit ? '#00ff9d' : 'transparent';
      this.ctx.shadowBlur = isLit ? 12 : 0;
      this.ctx.fill();
    }
    this.ctx.shadowBlur = 0;

    // Draw buckets
    for (let b of this.buckets) {
      this.ctx.fillStyle = b.color + '33'; // transparent background
      this.ctx.strokeStyle = b.color;
      this.ctx.lineWidth = 1;
      this.ctx.fillRect(b.x + 2, b.y, b.width - 4, b.height);
      this.ctx.strokeRect(b.x + 2, b.y, b.width - 4, b.height);

      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 11px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(b.mult + 'x', b.x + b.width / 2, b.y + 22);
    }

    // Draw balls
    for (let b of this.balls) {
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = b.color;
      this.ctx.shadowColor = b.color;
      this.ctx.shadowBlur = 10;
      this.ctx.fill();
    }
    this.ctx.shadowBlur = 0;

    // Draw particles
    for (let pt of this.particles) {
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
      this.ctx.fillStyle = pt.color;
      this.ctx.globalAlpha = pt.life;
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1.0;
  }

  updateStats() {
    if (this.statDrops) this.statDrops.textContent = this.totalDrops;
    if (this.statBest) this.statBest.textContent = this.bestWin > 0 ? this.bestWin + 'x' : '0x';
  }

  addToHistory(mult, color) {
    if (!this.historyList) return;
    const pill = document.createElement('div');
    pill.className = `history-pill ${mult >= 1.5 ? 'win' : 'lose'}`;
    pill.innerHTML = `
      <span class="history-pill-result">Plinko Drop</span>
      <span class="history-pill-text" style="color: ${color}">${mult}x</span>
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
    this.totalDrops = 0;
    this.bestWin = 0;
    this.balls = [];
    this.particles = [];
    this.saveStats();
    this.updateStats();
    if (this.historyList) this.historyList.innerHTML = '<span class="empty-msg">No drops yet</span>';
    if (this.resultBanner) this.resultBanner.className = 'result-banner';
  }
}

window.plinkoManager = new PlinkoManager();
