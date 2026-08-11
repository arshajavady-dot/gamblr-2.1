/* ==========================================================================
   gamblr - Magic 8-Ball Oracle Logic
   ========================================================================== */

const CLASSIC_RESPONSES = [
  // Affirmative (10)
  { text: "It is certain", type: "Affirmative" },
  { text: "It is decidedly so", type: "Affirmative" },
  { text: "Without a doubt", type: "Affirmative" },
  { text: "Yes definitely", type: "Affirmative" },
  { text: "You may rely on it", type: "Affirmative" },
  { text: "As I see it, yes", type: "Affirmative" },
  { text: "Most likely", type: "Affirmative" },
  { text: "Outlook good", type: "Affirmative" },
  { text: "Yes", type: "Affirmative" },
  { text: "Signs point to yes", type: "Affirmative" },
  // Non-committal (5)
  { text: "Reply hazy, try again", type: "Non-committal" },
  { text: "Ask again later", type: "Non-committal" },
  { text: "Better not tell you now", type: "Non-committal" },
  { text: "Cannot predict now", type: "Non-committal" },
  { text: "Concentrate and ask again", type: "Non-committal" },
  // Negative (5)
  { text: "Don't count on it", type: "Negative" },
  { text: "My reply is no", type: "Negative" },
  { text: "My sources say no", type: "Negative" },
  { text: "Outlook not so good", type: "Negative" },
  { text: "Very doubtful", type: "Negative" }
];

const GAMBLER_RESPONSES = [
  // High Roller Affirmative
  { text: "ALL IN! 🚀", type: "Affirmative" },
  { text: "HIT THE JACKPOT 🎰", type: "Affirmative" },
  { text: "DOUBLE DOWN 💰", type: "Affirmative" },
  { text: "LUCKY 7s AHEAD 🎲", type: "Affirmative" },
  { text: "HOUSE LOSES TODAY ✨", type: "Affirmative" },
  // High Roller Non-committal
  { text: "RE-SHUFFLE CARDS 🃏", type: "Non-committal" },
  { text: "CHECK THE POT 🪙", type: "Non-committal" },
  { text: "CALL THE BLUFF 👁️", type: "Non-committal" },
  // High Roller Negative
  { text: "BUSTED! 💥", type: "Negative" },
  { text: "FOLD YOUR HAND 🛑", type: "Negative" },
  { text: "BANKRUPT RISK ⚠️", type: "Negative" },
  { text: "THE HOUSE ALWAYS WINS 🏛️", type: "Negative" }
];

class Magic8BallManager {
  constructor() {
    this.isShaking = false;
    this.mode = 'classic'; // 'classic' or 'gambler'

    this.stats = {
      total: 0,
      affirmative: 0,
      nonCommittal: 0,
      negative: 0,
      history: []
    };

    this.loadStats();
  }

  init() {
    this.loadStats();
    this.bindEvents();
    this.updateStatsUI();
  }

  bindEvents() {
    const btnShake = document.getElementById('btn-shake');
    const eightballEl = document.getElementById('eightball');
    const qInput = document.getElementById('eightball-input');
    const btnClearQ = document.getElementById('btn-clear-q');
    const modeBtns = document.querySelectorAll('.mode-btn');
    const btnResetStats = document.getElementById('btn-reset-8ball-stats');

    if (btnShake) btnShake.addEventListener('click', () => this.shake());
    if (eightballEl) eightballEl.addEventListener('click', () => this.shake());

    if (qInput) {
      qInput.addEventListener('input', () => {
        if (btnClearQ) {
          if (qInput.value.length > 0) btnClearQ.classList.remove('hidden');
          else btnClearQ.classList.add('hidden');
        }
      });

      qInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.shake();
      });
    }

    if (btnClearQ) {
      btnClearQ.addEventListener('click', () => {
        if (qInput) qInput.value = '';
        btnClearQ.classList.add('hidden');
      });
    }

    modeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.mode = btn.dataset.mode;
      });
    });

    if (btnResetStats) {
      btnResetStats.addEventListener('click', () => this.resetStats());
    }
  }

  shake() {
    if (this.isShaking) return;
    this.isShaking = true;

    const eightball = document.getElementById('eightball');
    const btnShake = document.getElementById('btn-shake');
    const qInput = document.getElementById('eightball-input');
    const questionText = qInput ? qInput.value.trim() : '';

    if (btnShake) btnShake.disabled = true;

    // Reset view state
    if (eightball) {
      eightball.classList.remove('revealed');
      eightball.classList.add('shaking');
    }

    // Play shake audio effect
    if (window.soundEngine) window.soundEngine.play8BallShake();

    // Select response pool
    const pool = this.mode === 'gambler' ? GAMBLER_RESPONSES : CLASSIC_RESPONSES;
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    const chosen = pool[array[0] % pool.length];

    // Shake duration (1.2s)
    setTimeout(() => {
      if (eightball) {
        eightball.classList.remove('shaking');
        eightball.classList.add('revealed');
      }

      const answerEl = document.getElementById('eightball-answer');
      if (answerEl) answerEl.textContent = chosen.text;

      // Play mystical reveal sound
      if (window.soundEngine) window.soundEngine.play8BallReveal();

      this.processResult(chosen, questionText);
      this.isShaking = false;
      if (btnShake) btnShake.disabled = false;
    }, 1200);
  }

  processResult(chosen, questionText) {
    this.stats.total++;
    if (chosen.type === 'Affirmative') {
      this.stats.affirmative++;
    }
    else if (chosen.type === 'Non-committal') this.stats.nonCommittal++;
    else if (chosen.type === 'Negative') this.stats.negative++;

    const logEntry = {
      question: questionText || 'Mystic Consultation',
      answer: chosen.text,
      type: chosen.type,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    this.stats.history.unshift(logEntry);
    if (this.stats.history.length > 20) this.stats.history.pop();

    this.saveStats();
    this.updateStatsUI();
  }

  updateStatsUI() {
    const elTotal = document.getElementById('stat-8ball-total');
    const elPos = document.getElementById('stat-8ball-positive');
    const elNeg = document.getElementById('stat-8ball-negative');
    const historyList = document.getElementById('eightball-history-list');

    if (elTotal) elTotal.textContent = this.stats.total;
    if (elPos) elPos.textContent = this.stats.affirmative;
    if (elNeg) elNeg.textContent = this.stats.negative;

    if (historyList) {
      if (this.stats.history.length === 0) {
        historyList.innerHTML = '<span class="empty-msg">No consultations yet</span>';
      } else {
        historyList.innerHTML = this.stats.history
          .map(item => `
            <div class="oracle-history-item ${item.type}">
              <span class="oracle-q">"${escapeHtml(item.question)}" • ${item.time}</span>
              <span class="oracle-ans">${escapeHtml(item.answer)}</span>
            </div>
          `)
          .join('');
      }
    }
  }

  saveStats() {
    if (window.profileManager) {
      window.profileManager.saveGameStats('8ball', this.stats);
    } else {
      localStorage.setItem('gamblr_8ball_stats', JSON.stringify(this.stats));
    }
  }

  loadStats() {
    const defaultStats = {
      total: 0,
      affirmative: 0,
      nonCommittal: 0,
      negative: 0,
      history: []
    };

    if (window.profileManager) {
      this.stats = window.profileManager.getGameStats('8ball', defaultStats);
    } else {
      const saved = localStorage.getItem('gamblr_8ball_stats');
      if (saved) {
        try {
          this.stats = Object.assign(defaultStats, JSON.parse(saved));
        } catch (e) {}
      }
    }
  }

  resetStats() {
    this.stats = {
      total: 0,
      affirmative: 0,
      nonCommittal: 0,
      negative: 0,
      history: []
    };
    this.saveStats();
    this.updateStatsUI();

    const eightball = document.getElementById('eightball');
    if (eightball) eightball.classList.remove('revealed');
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

window.magic8BallManager = new Magic8BallManager();
