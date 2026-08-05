/* ==========================================================================
   gamblr - Main App Coordinator & View Router
   ========================================================================== */

function switchTab(target) {
  const tabs = {
    coin: document.getElementById('tab-coin'),
    '8ball': document.getElementById('tab-8ball'),
    wheel: document.getElementById('tab-wheel'),
  };
  const views = {
    coin: document.getElementById('view-coin'),
    '8ball': document.getElementById('view-8ball'),
    wheel: document.getElementById('view-wheel'),
  };

  Object.values(tabs).forEach(t => {
    if (t) { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); }
  });
  Object.values(views).forEach(v => {
    if (v) v.classList.remove('active');
  });

  if (tabs[target]) { tabs[target].classList.add('active'); tabs[target].setAttribute('aria-selected', 'true'); }
  if (views[target]) views[target].classList.add('active');

  if (target === 'wheel') {
    requestAnimationFrame(() => {
      if (window.spinWheelManager) window.spinWheelManager.drawWheel();
    });
  }
}

window.switchTab = switchTab;

document.addEventListener('DOMContentLoaded', () => {
  if (window.coinFlipManager) window.coinFlipManager.init();
  if (window.magic8BallManager) window.magic8BallManager.init();
  if (window.spinWheelManager) window.spinWheelManager.init();
  if (window.adManager) window.adManager.init();

  const tabCoin = document.getElementById('tab-coin');
  const tab8Ball = document.getElementById('tab-8ball');
  const tabWheel = document.getElementById('tab-wheel');

  if (tabCoin) tabCoin.addEventListener('click', () => switchTab('coin'));
  if (tab8Ball) tab8Ball.addEventListener('click', () => switchTab('8ball'));
  if (tabWheel) tabWheel.addEventListener('click', () => switchTab('wheel'));

  const btnSound = document.getElementById('btn-sound');
  const iconOn = document.getElementById('sound-icon-on');
  const iconOff = document.getElementById('sound-icon-off');

  if (btnSound) {
    btnSound.addEventListener('click', () => {
      if (window.soundEngine) {
        const isMuted = window.soundEngine.toggleMute();
        iconOn.classList.toggle('hidden', isMuted);
        iconOff.classList.toggle('hidden', !isMuted);
        btnSound.setAttribute('title', isMuted ? 'Sound Muted' : 'Sound On');
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const activeView = document.querySelector('.view-panel.active');

    if (e.code === 'Space') {
      e.preventDefault();
      if (activeView?.id === 'view-coin' && window.coinFlipManager) window.coinFlipManager.flipCoin();
      else if (activeView?.id === 'view-8ball' && window.magic8BallManager) window.magic8BallManager.shake();
      else if (activeView?.id === 'view-wheel' && window.spinWheelManager) window.spinWheelManager.spin();
    }

    if (e.key === '1') switchTab('coin');
    if (e.key === '2') switchTab('8ball');
    if (e.key === '3') switchTab('wheel');
  });

  console.log('⚡ gamblr initialized with 3 modes: Coin Flip, Magic 8-Ball, Spin Wheel & Fullscreen Ad System.');
});

