/* ==========================================================================
   gamblr - Fullscreen Timed Pop-up Ad Manager
   ========================================================================== */

class AdManager {
  constructor() {
    this.intervalMs = 3 * 60 * 1000; // 3 minutes
    this.chance = 0.10; // 10% chance
    this.lockDurationSec = 10; // 10 seconds unskippable
    this.countdownTimer = null;
    this.checkInterval = null;
  }

  init() {
    this.bindEvents();
    this.startAdLoop();
  }

  bindEvents() {
    const closeBtn = document.getElementById('ad-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeAd());
    }
  }

  startAdLoop() {
    if (this.checkInterval) clearInterval(this.checkInterval);
    this.checkInterval = setInterval(() => {
      if (Math.random() < this.chance) {
        this.triggerAd();
      }
    }, this.intervalMs);
  }

  triggerAd() {
    const adOverlay = document.getElementById('fullscreen-ad');
    const closeBtn = document.getElementById('ad-close-btn');
    const timerSpan = document.getElementById('ad-timer-text');
    if (!adOverlay || !closeBtn) return;

    const adLink = document.querySelector('.ad-link-wrapper');
    const adImg = document.querySelector('.ad-fullscreen-img');
    if (adLink && adImg) {
      if (Math.random() < 0.5) {
        adLink.href = 'https://www.youtube.com/@M3owski';
        adImg.src = 'm3owski_ad.png';
        adImg.alt = 'Subscribe to @M3owski on YouTube!';
      } else {
        adLink.href = 'https://www.youtube.com/@strongbox22';
        adImg.src = 'yt_ad.png';
        adImg.alt = 'Subscribe to @strongbox22 on YouTube!';
      }
    }

    adOverlay.classList.remove('hidden');
    adOverlay.classList.add('active');

    let secondsLeft = this.lockDurationSec;
    closeBtn.disabled = true;
    closeBtn.classList.add('locked');
    if (timerSpan) timerSpan.textContent = `(${secondsLeft}s)`;

    if (this.countdownTimer) clearInterval(this.countdownTimer);

    this.countdownTimer = setInterval(() => {
      secondsLeft--;
      if (secondsLeft > 0) {
        if (timerSpan) timerSpan.textContent = `(${secondsLeft}s)`;
      } else {
        clearInterval(this.countdownTimer);
        closeBtn.disabled = false;
        closeBtn.classList.remove('locked');
        if (timerSpan) timerSpan.textContent = '';
      }
    }, 1000);
  }

  closeAd() {
    const adOverlay = document.getElementById('fullscreen-ad');
    const closeBtn = document.getElementById('ad-close-btn');
    if (!adOverlay || (closeBtn && closeBtn.disabled)) return;

    adOverlay.classList.remove('active');
    setTimeout(() => {
      adOverlay.classList.add('hidden');
    }, 300);
  }
}

window.adManager = new AdManager();
