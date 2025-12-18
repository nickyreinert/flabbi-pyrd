// ============================
// AUDIO CONTROLLER
// ============================

class AudioController {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTone(freq, type, duration, vol = 0.1) {
        if (!this.enabled) return;
        
        // Ensure context is initialized
        if (!this.ctx) {
            this.init();
        }
        
        // Resume context if suspended (browser policy)
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    flap() {
        this.playTone(AUDIO_CONFIG.FLAP.freq, AUDIO_CONFIG.FLAP.type, AUDIO_CONFIG.FLAP.duration, AUDIO_CONFIG.FLAP.vol);
    }

    score() {
        this.playTone(AUDIO_CONFIG.SCORE.freq, AUDIO_CONFIG.SCORE.type, AUDIO_CONFIG.SCORE.duration, AUDIO_CONFIG.SCORE.vol);
    }

    hit() {
        this.playTone(AUDIO_CONFIG.HIT.freq, AUDIO_CONFIG.HIT.type, AUDIO_CONFIG.HIT.duration, AUDIO_CONFIG.HIT.vol);
    }

    shoot() {
        this.playTone(AUDIO_CONFIG.SHOOT.freq, AUDIO_CONFIG.SHOOT.type, AUDIO_CONFIG.SHOOT.duration, AUDIO_CONFIG.SHOOT.vol);
        setTimeout(() => this.playTone(AUDIO_CONFIG.SHOOT_ECHO.freq, AUDIO_CONFIG.SHOOT_ECHO.type, AUDIO_CONFIG.SHOOT_ECHO.duration, AUDIO_CONFIG.SHOOT_ECHO.vol), 50);
    }

    explosion() {
        this.playTone(AUDIO_CONFIG.EXPLOSION.freq, AUDIO_CONFIG.EXPLOSION.type, AUDIO_CONFIG.EXPLOSION.duration, AUDIO_CONFIG.EXPLOSION.vol);
    }

    collect() {
        this.playTone(AUDIO_CONFIG.COLLECT.freq, AUDIO_CONFIG.COLLECT.type, AUDIO_CONFIG.COLLECT.duration, AUDIO_CONFIG.COLLECT.vol);
        setTimeout(() => this.playTone(AUDIO_CONFIG.COLLECT_ECHO.freq, AUDIO_CONFIG.COLLECT_ECHO.type, AUDIO_CONFIG.COLLECT_ECHO.duration, AUDIO_CONFIG.COLLECT_ECHO.vol), 100);
    }
}
