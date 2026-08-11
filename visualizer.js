class VisualizerManager {
  constructor() {
    this.canvas = document.getElementById('visualizer-canvas');
    this.ctx = null;
    this.animId = null;
    this.isInitialized = false;
  }

  init() {
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.isInitialized = true;
    this.startRenderLoop();
  }

  connectAudioEngine() {
    // Audio engine ready trigger
    this.init();
  }

  startRenderLoop() {
    if (this.animId) return;
    const render = () => {
      this.draw();
      this.animId = requestAnimationFrame(render);
    };
    render();
  }

  draw() {
    if (!this.ctx || !this.canvas) return;
    const width = this.canvas.width;
    const height = this.canvas.height;

    this.ctx.clearRect(0, 0, width, height);

    const isPlaying = window.soundEngine && 
                      window.soundEngine.bgAudio && 
                      !window.soundEngine.bgAudio.paused && 
                      !window.soundEngine.isMuted;

    const barCount = 16;
    const barWidth = Math.floor(width / barCount) - 2;
    const now = Date.now();
    const t = (window.soundEngine && window.soundEngine.bgAudio) ? window.soundEngine.bgAudio.currentTime : 0;

    for (let i = 0; i < barCount; i++) {
      let barHeight = 3;

      if (isPlaying) {
        // Track-synced rhythmic beat calculations based on bgAudio.currentTime
        const bass = Math.sin(t * 7.5 + (i % 4) * 0.8) * 0.4 + 0.6;
        const mid = Math.cos(t * 13.2 - i * 0.5) * 0.35 + 0.5;
        const treble = Math.sin(t * 21.4 + i * 1.2) * 0.25 + 0.5;
        
        const combined = (bass * 0.5 + mid * 0.35 + treble * 0.15);
        barHeight = combined * (height - 6) + 4;
      } else {
        // Subtle resting pulse when muted or paused
        barHeight = Math.sin(now * 0.003 + i * 0.4) * 2 + 3;
      }

      const x = i * (barWidth + 2);
      const y = height - barHeight;

      // Neon Gradient
      const gradient = this.ctx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, '#00b4d8');
      gradient.addColorStop(0.5, '#00ff9d');
      gradient.addColorStop(1, '#9d4edd');

      this.ctx.fillStyle = gradient;
      this.ctx.shadowColor = '#00ff9d';
      this.ctx.shadowBlur = isPlaying ? 8 : 2;

      // Draw rounded bar top
      this.ctx.beginPath();
      this.ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
      this.ctx.fill();
    }

    this.ctx.shadowBlur = 0;
  }
}

window.visualizerManager = new VisualizerManager();
