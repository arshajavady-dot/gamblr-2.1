/* ==========================================================================
   gamblr - Main App Coordinator & View Router
   ========================================================================== */

function switchTab(target) {
  const tabs = {
    coin: document.getElementById('tab-coin'),
    '8ball': document.getElementById('tab-8ball'),
    wheel: document.getElementById('tab-wheel'),
    roulette: document.getElementById('tab-roulette'),
    slots: document.getElementById('tab-slots'),
    dice: document.getElementById('tab-dice'),
    cookie: document.getElementById('tab-cookie'),
    rps: document.getElementById('tab-rps'),
    cards: document.getElementById('tab-cards'),
  };
  const views = {
    coin: document.getElementById('view-coin'),
    '8ball': document.getElementById('view-8ball'),
    wheel: document.getElementById('view-wheel'),
    roulette: document.getElementById('view-roulette'),
    slots: document.getElementById('view-slots'),
    dice: document.getElementById('view-dice'),
    cookie: document.getElementById('view-cookie'),
    rps: document.getElementById('view-rps'),
    cards: document.getElementById('view-cards'),
    home: document.getElementById('view-home'),
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

  if (target === 'roulette') {
    requestAnimationFrame(() => {
      if (window.rouletteManager) window.rouletteManager.drawWheel();
    });
  }
}

window.switchTab = switchTab;

document.addEventListener('DOMContentLoaded', () => {
  if (window.coinFlipManager) window.coinFlipManager.init();
  if (window.magic8BallManager) window.magic8BallManager.init();
  if (window.spinWheelManager) window.spinWheelManager.init();
  if (window.rouletteManager) window.rouletteManager.init();
  if (window.slotsManager) window.slotsManager.init();
  if (window.diceManager) window.diceManager.init();
  if (window.cookieManager) window.cookieManager.init();
  if (window.rpsManager) window.rpsManager.init();
  if (window.cardsManager) window.cardsManager.init();
  if (window.adManager) window.adManager.init();

  const tabCoin = document.getElementById('tab-coin');
  const tab8Ball = document.getElementById('tab-8ball');
  const tabWheel = document.getElementById('tab-wheel');
  const tabRoulette = document.getElementById('tab-roulette');
  const tabSlots = document.getElementById('tab-slots');
  const tabDice = document.getElementById('tab-dice');
  const tabCookie = document.getElementById('tab-cookie');
  const tabRps = document.getElementById('tab-rps');
  const tabCards = document.getElementById('tab-cards');

  if (tabCoin) tabCoin.addEventListener('click', () => switchTab('coin'));
  if (tab8Ball) tab8Ball.addEventListener('click', () => switchTab('8ball'));
  if (tabWheel) tabWheel.addEventListener('click', () => switchTab('wheel'));
  if (tabRoulette) tabRoulette.addEventListener('click', () => switchTab('roulette'));
  if (tabSlots) tabSlots.addEventListener('click', () => switchTab('slots'));
  if (tabDice) tabDice.addEventListener('click', () => switchTab('dice'));
  if (tabCookie) tabCookie.addEventListener('click', () => switchTab('cookie'));
  if (tabRps) tabRps.addEventListener('click', () => switchTab('rps'));
  if (tabCards) tabCards.addEventListener('click', () => switchTab('cards'));

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
      else if (activeView?.id === 'view-roulette' && window.rouletteManager) window.rouletteManager.predictNext();
      else if (activeView?.id === 'view-slots' && window.slotsManager) window.slotsManager.spin();
      else if (activeView?.id === 'view-dice' && window.diceManager) window.diceManager.roll();
      else if (activeView?.id === 'view-cookie' && window.cookieManager) {
        if (!window.cookieManager.isOpened) window.cookieManager.crackCookie();
        else window.cookieManager.resetCookie();
      }
    }

    if (e.key === '1') switchTab('coin');
    if (e.key === '2') switchTab('8ball');
    if (e.key === '3') switchTab('wheel');
    if (e.key === '4') switchTab('roulette');
    if (e.key === '5') switchTab('slots');
    if (e.key === '6') switchTab('dice');
    if (e.key === '7') switchTab('cookie');
    if (e.key === '8') switchTab('rps');
    if (e.key === '9') switchTab('cards');
  });

  // Slider Logic for Nav Tabs
  const navTabsContainer = document.getElementById('nav-tabs-container');
  const navSlider = document.getElementById('nav-slider');

  if (navTabsContainer && navSlider) {
    const updateSlider = () => {
      const maxScroll = navTabsContainer.scrollWidth - navTabsContainer.clientWidth;
      if (maxScroll <= 0) {
        navSlider.style.display = 'none';
        return;
      } else {
        navSlider.style.display = 'block';
      }
      
      const scrollRatio = navTabsContainer.scrollLeft / maxScroll;
      navSlider.value = scrollRatio * 100;
    };

    navTabsContainer.addEventListener('scroll', updateSlider);
    window.addEventListener('resize', updateSlider);

    navSlider.addEventListener('input', (e) => {
      const maxScroll = navTabsContainer.scrollWidth - navTabsContainer.clientWidth;
      const targetScroll = (e.target.value / 100) * maxScroll;
      navTabsContainer.scrollLeft = targetScroll;
    });

    // Initial check
    setTimeout(updateSlider, 100);
  }

  console.log('⚡ gamblr initialized with 8 modes: Coin Flip, Magic 8-Ball, Spin Wheel, Roulette Predictor, Slot Machine, Dice Roller, Fortune Cookie, Rock Paper Scissors, Higher or Lower.');
});


