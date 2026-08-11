/* ==========================================================================
   gamblr - Main App Coordinator & View Router
   ========================================================================== */

let currentTabIndex = 0;
let isSwiping = false;
const TAB_ORDER = ['coin', '8ball', 'wheel', 'roulette', 'slots', 'dice', 'cookie', 'rps', 'cards', 'mines', 'plinko', 'race'];

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
    mines: document.getElementById('tab-mines'),
    plinko: document.getElementById('tab-plinko'),
    race: document.getElementById('tab-race'),
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
    mines: document.getElementById('view-mines'),
    plinko: document.getElementById('view-plinko'),
    race: document.getElementById('view-race'),
    home: document.getElementById('view-home'),
  };

  const newIndex = TAB_ORDER.indexOf(target);
  const direction = newIndex >= currentTabIndex ? 'left' : 'right';
  if (newIndex >= 0) currentTabIndex = newIndex;

  Object.values(tabs).forEach(t => {
    if (t) { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); }
  });
  if (tabs[target]) { tabs[target].classList.add('active'); tabs[target].setAttribute('aria-selected', 'true'); }

  // Sequential 2-Phase 3D Swipe Animation (Current mode wipes 100% off screen first)
  const currentActiveView = document.querySelector('.view-panel.active');
  const targetView = views[target];

  if (currentActiveView && targetView && currentActiveView !== targetView) {
    if (isSwiping) return;
    isSwiping = true;

    const outClass = direction === 'left' ? 'swipe-out-left' : 'swipe-out-right';
    const inClass = direction === 'left' ? 'swipe-in-right' : 'swipe-in-left';

    // Phase 1: Swipe active mode completely off screen
    currentActiveView.classList.add(outClass);

    setTimeout(() => {
      // Phase 2: Hide old view, show target view, and swipe it in
      currentActiveView.classList.remove('active', 'swipe-out-left', 'swipe-out-right');

      targetView.classList.remove('swipe-out-left', 'swipe-out-right');
      targetView.classList.add('active', inClass);

      setTimeout(() => {
        targetView.classList.remove('swipe-in-left', 'swipe-in-right');
        isSwiping = false;
      }, 220);
    }, 220);
  } else {
    Object.values(views).forEach(v => {
      if (v) v.classList.remove('active');
    });
    if (targetView) targetView.classList.add('active');
  }

  if (window.soundEngine && window.soundEngine.playTabSwitch) {
    window.soundEngine.playTabSwitch();
  }

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
  if (window.soundEngine) window.soundEngine.init();
  if (window.profileManager) window.profileManager.init();
  if (window.coinFlipManager) window.coinFlipManager.init();
  if (window.magic8BallManager) window.magic8BallManager.init();
  if (window.spinWheelManager) window.spinWheelManager.init();
  if (window.rouletteManager) window.rouletteManager.init();
  if (window.slotsManager) window.slotsManager.init();
  if (window.diceManager) window.diceManager.init();
  if (window.cookieManager) window.cookieManager.init();
  if (window.rpsManager) window.rpsManager.init();
  if (window.cardsManager) window.cardsManager.init();
  if (window.minesManager) window.minesManager.init();
  if (window.plinkoManager) window.plinkoManager.init();
  if (window.raceManager) window.raceManager.init();
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
  const tabMines = document.getElementById('tab-mines');
  const tabPlinko = document.getElementById('tab-plinko');
  const tabRace = document.getElementById('tab-race');

  if (tabCoin) tabCoin.addEventListener('click', () => switchTab('coin'));
  if (tab8Ball) tab8Ball.addEventListener('click', () => switchTab('8ball'));
  if (tabWheel) tabWheel.addEventListener('click', () => switchTab('wheel'));
  if (tabRoulette) tabRoulette.addEventListener('click', () => switchTab('roulette'));
  if (tabSlots) tabSlots.addEventListener('click', () => switchTab('slots'));
  if (tabDice) tabDice.addEventListener('click', () => switchTab('dice'));
  if (tabCookie) tabCookie.addEventListener('click', () => switchTab('cookie'));
  if (tabRps) tabRps.addEventListener('click', () => switchTab('rps'));
  if (tabCards) tabCards.addEventListener('click', () => switchTab('cards'));
  if (tabMines) tabMines.addEventListener('click', () => switchTab('mines'));
  if (tabPlinko) tabPlinko.addEventListener('click', () => switchTab('plinko'));
  if (tabRace) tabRace.addEventListener('click', () => switchTab('race'));

  const btnSound = document.getElementById('btn-sound');

  const updateDiscState = () => {
    if (!btnSound || !window.soundEngine) return;
    const isMuted = window.soundEngine.isMuted;
    btnSound.classList.toggle('playing', !isMuted);
    btnSound.classList.toggle('muted', isMuted);
    btnSound.setAttribute('title', isMuted ? 'Sound Muted (Click to Unmute)' : 'Sound Playing (Click to Mute)');
    btnSound.innerHTML = `<span class="disc-icon">${isMuted ? '🔇' : '🎵'}</span>`;
  };

  if (btnSound) {
    btnSound.addEventListener('click', () => {
      if (window.soundEngine) {
        window.soundEngine.toggleMute();
        updateDiscState();
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
      const pct = Math.min(100, Math.max(0, scrollRatio * 100));
      navSlider.value = pct;
      navSlider.style.background = `linear-gradient(90deg, #00ff9d ${pct}%, rgba(255, 255, 255, 0.08) ${pct}%)`;
    };

    navTabsContainer.addEventListener('scroll', updateSlider);
    window.addEventListener('resize', updateSlider);

    navSlider.addEventListener('input', (e) => {
      const maxScroll = navTabsContainer.scrollWidth - navTabsContainer.clientWidth;
      const pct = e.target.value;
      const targetScroll = (pct / 100) * maxScroll;
      navTabsContainer.scrollLeft = targetScroll;
      navSlider.style.background = `linear-gradient(90deg, #00ff9d ${pct}%, rgba(255, 255, 255, 0.08) ${pct}%)`;
    });

    // Initial check
    setTimeout(updateSlider, 100);
  }

  // Futuristic Splash Screen Intro Controller
  const splashScreen = document.getElementById('splash-screen');
  const splashProgress = document.getElementById('splash-progress');
  const splashStatus = document.getElementById('splash-status-text');
  const btnEnterCasino = document.getElementById('btn-enter-casino');
  const splashLoaderBox = document.querySelector('.splash-loader-box');

  if (splashScreen && splashProgress && splashStatus) {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 10;
      if (progress > 100) progress = 100;
      splashProgress.style.width = progress + '%';

      if (progress < 40) {
        splashStatus.textContent = 'INITIALIZING QUANTUM CORE...';
      } else if (progress < 75) {
        splashStatus.textContent = 'CONNECTING CASINO AUDIO ENGINE...';
      } else if (progress < 100) {
        splashStatus.textContent = 'PREPARING 11 HIGH-STAKES MODES...';
      } else {
        clearInterval(interval);
        splashStatus.textContent = 'SYSTEM READY.';
        if (btnEnterCasino && splashLoaderBox) {
          splashLoaderBox.style.display = 'none';
          btnEnterCasino.classList.remove('hidden');
        }
      }
    }, 70);

    const enterApp = () => {
      if (window.soundEngine) {
        window.soundEngine.init();
        if (window.soundEngine.playEnterCasino) {
          window.soundEngine.playEnterCasino();
        }
      }
      updateDiscState();
      splashScreen.classList.add('fade-out');
      setTimeout(() => {
        splashScreen.remove();
      }, 800);
    };

    if (btnEnterCasino) {
      btnEnterCasino.addEventListener('click', enterApp);
    }
  }

  // 1. Ambient Interactive Cyber Particle Field
  const canvas = document.getElementById('bg-particle-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const count = 45;
    let mouse = { x: width / 2, y: height / 2 };

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      window.currentMouseX = e.clientX;
      window.currentMouseY = e.clientY;
    });

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 2 + 1,
        color: Math.random() > 0.5 ? '#00ff9d' : '#00b4d8'
      });
    }

    const drawParticles = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.4;
        ctx.fill();

        // Draw connections to nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = (1 - dist / 120) * 0.15;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        // Draw connection to cursor
        const distMouse = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        if (distMouse < 150) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = '#00ff9d';
          ctx.globalAlpha = (1 - distMouse / 150) * 0.3;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1.0;
      requestAnimationFrame(drawParticles);
    };

    drawParticles();
  }

  // 2. 3D Holographic Card Mouse Tilt Effect
  const tiltableCards = document.querySelectorAll('.game-card, .stats-panel, .card-glass');
  tiltableCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.008)`;
      card.style.transition = 'transform 0.08s ease-out';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
      card.style.transition = 'transform 0.35s ease';
    });
  });

  console.log('⚡ gamblr initialized with 3D Cyber Swipe, 3D Card Tilt, Cyber Particle Field, Level XP System, and 12 High-Stakes Modes.');
});


