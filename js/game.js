// ============================
// CONSTANTS & CONFIGURATION
// ============================

const ASSETS = {
    bird: { src: 'assets/bird.png', color: '#FFD700' }, // Gold fallback
    pipe: { src: 'assets/pipe.png', color: '#2F4F4F' }, // Dark Slate Gray fallback
    bg:   { src: 'assets/bg.svg',   color: '#87CEEB' },  // Sky Blue fallback
    pacman: { src: 'assets/pacman.png', color: '#FFFF00' },
    enemy_shoot: { src: 'assets/ghost_red.png', color: '#FF0000' },
    enemy_eat: { src: 'assets/ghost_blue.png', color: '#0000FF' },
    projectile: { src: 'assets/bullet.png', color: '#00FF00' }
};

const JARGON_LIST = [
    "Align Stakeholders", 
    "Circle Back", 
    "Urgent: EOD", 
    "KPI Soup", 
    "Optimize Funnel", 
    "Low Budget", 
    "Viral Content", 
    "More Pop", 
    "Feedback Round", 
    "Do More w/ Less", 
    "Brand Purpose", 
    "Pivot to Pivot", 
    "Q1 Reset"
];

const GAME_STATE = {
    START: 'START',
    PLAYING: 'PLAYING',
    GAME_OVER: 'GAME_OVER'
};

const CONFIG = {
    GRAVITY_NORMAL: 0.5,
    GRAVITY_SIMPLE: 0.3,
    FLAP_POWER: -8,
    BIRD_SIZE: 40,
    PIPE_WIDTH: 80,
    PIPE_GAP_START: 500,
    PIPE_GAP_END: 180,
    PIPE_SPEED: 2.5,
    PIPE_POOL_SIZE: 6,
    PIPE_SPACING: 600,
    SIGNBOARD_HEIGHT: 50,
    SIGNBOARD_OFFSET: 20,
    PROJECTILE_SPEED: 10,
    ENEMY_SPEED: 3,
    ENEMY_SPAWN_RATE: 120 // Frames
};

const AUDIO_CONFIG = {
    FLAP: { freq: 200, type: 'sine', duration: 0.1, vol: 0.1 },
    SCORE: { freq: 500, type: 'square', duration: 0.1, vol: 0.05 },
    HIT: { freq: 80, type: 'sawtooth', duration: 0.3, vol: 0.2 },
    SHOOT: { freq: 400, type: 'square', duration: 0.05, vol: 0.05 },
    SHOOT_ECHO: { freq: 300, type: 'square', duration: 0.05, vol: 0.05 },
    EXPLOSION: { freq: 50, type: 'sawtooth', duration: 0.2, vol: 0.2 },
    COLLECT: { freq: 600, type: 'sine', duration: 0.1, vol: 0.1 },
    COLLECT_ECHO: { freq: 800, type: 'sine', duration: 0.2, vol: 0.1 }
};

// ============================
// AUDIO CONTROLLER
// ============================

class AudioController {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = true;
    }

    playTone(freq, type, duration, vol = 0.1) {
        if (!this.enabled) return;
        
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

// ============================
// ASSET LOADER
// ============================

class AssetLoader {
    constructor() {
        this.images = {};
        this.loadedCount = 0;
        this.totalAssets = Object.keys(ASSETS).length;
    }

    load(callback) {
        Object.keys(ASSETS).forEach(key => {
            const img = new Image();
            img.onload = () => {
                this.loadedCount++;
                if (this.loadedCount === this.totalAssets && callback) {
                    callback();
                }
            };
            img.onerror = () => {
                console.warn(`Failed to load ${key} from ${ASSETS[key].src}, using fallback color`);
                this.loadedCount++;
                if (this.loadedCount === this.totalAssets && callback) {
                    callback();
                }
            };
            img.src = ASSETS[key].src;
            this.images[key] = img;
        });
    }

    isReady(key) {
        return this.images[key] && this.images[key].complete && this.images[key].naturalWidth > 0;
    }

    get(key) {
        return this.images[key];
    }
}

// ============================
// PROJECTILE CLASS
// ============================

class Projectile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 10;
        this.height = 10;
        this.markedForDeletion = false;
    }

    update() {
        this.x += CONFIG.PROJECTILE_SPEED;
        if (this.x > 2000) this.markedForDeletion = true; // Cleanup
    }

    draw(ctx, assetLoader) {
        if (assetLoader.isReady('projectile')) {
            ctx.drawImage(assetLoader.get('projectile'), this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = ASSETS.projectile.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    getBounds() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    }
}

// ============================
// COLLECTIBLE CLASS
// ============================

class Collectible {
    constructor(canvasWidth, canvasHeight) {
        this.x = canvasWidth;
        this.y = Math.random() * (canvasHeight - 200) + 100;
        this.width = 40;
        this.height = 40;
        this.markedForDeletion = false;
        this.text = "ACTIONABLE INSIGHT";
        this.oscillation = 0;
    }

    update() {
        this.x -= CONFIG.PIPE_SPEED;
        this.oscillation += 0.1;
        this.y += Math.sin(this.oscillation) * 2; // Float up and down
        
        if (this.x + this.width < 0) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        
        // Draw Golden Glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#FFD700";
        
        // Draw Box
        ctx.fillStyle = "#FFD700";
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Draw Text (Floating above)
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#FFD700";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.fillText("INSIGHT", 0, -this.height/2 - 10);
        
        ctx.restore();
    }

    getBounds() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    }
}

// ============================
// ENEMY CLASS
// ============================

class Enemy {
    constructor(canvasWidth, canvasHeight) {
        this.x = canvasWidth;
        this.y = Math.random() * (canvasHeight - 100) + 50;
        this.width = 30;
        this.height = 30;
        this.type = Math.random() > 0.5 ? 'SHOOTABLE' : 'EATABLE';
        this.markedForDeletion = false;
        
        // Physics
        const speed = CONFIG.ENEMY_SPEED + Math.random();
        this.vx = -speed;
        this.vy = (Math.random() - 0.5) * 5; // Random vertical velocity
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x + this.width < 0 || this.x > 3000) this.markedForDeletion = true;
    }

    draw(ctx, assetLoader) {
        const assetKey = this.type === 'SHOOTABLE' ? 'enemy_shoot' : 'enemy_eat';
        
        if (assetLoader.isReady(assetKey)) {
            ctx.drawImage(assetLoader.get(assetKey), this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = ASSETS[assetKey].color;
            // Draw circle for enemies
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    getBounds() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    }
}

// ============================
// BIRD CLASS
// ============================

class Bird {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.BIRD_SIZE;
        this.height = CONFIG.BIRD_SIZE;
        this.velocity = 0;
        this.rotation = 0;
        this.gravity = CONFIG.GRAVITY_NORMAL;
        this.cursorControl = false;
        this.funMode = false;
    }

    flap() {
        if (this.cursorControl) return;
        this.velocity = CONFIG.FLAP_POWER;
    }

    update() {
        if (this.cursorControl) {
            // Direct velocity control, no gravity
            this.y += this.velocity;
            this.rotation = 0;
        } else {
            this.velocity += this.gravity;
            this.y += this.velocity;
            // Update rotation based on velocity
            this.rotation = Math.min(Math.max(this.velocity * 3, -30), 90);
        }
    }

    draw(ctx, assetLoader) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        
        if (this.funMode) {
            // Pacman rotation logic (always face right or movement direction)
            ctx.rotate(0); 
            if (assetLoader.isReady('pacman')) {
                ctx.drawImage(assetLoader.get('pacman'), -this.width/2, -this.height/2, this.width, this.height);
            } else {
                // Draw Pacman fallback
                ctx.fillStyle = ASSETS.pacman.color;
                ctx.beginPath();
                ctx.arc(0, 0, this.width/2, 0.2 * Math.PI, 1.8 * Math.PI);
                ctx.lineTo(0, 0);
                ctx.fill();
            }
        } else {
            ctx.rotate(this.rotation * Math.PI / 180);
            if (assetLoader.isReady('bird')) {
                ctx.drawImage(
                    assetLoader.get('bird'),
                    -this.width / 2,
                    -this.height / 2,
                    this.width,
                    this.height
                );
            } else {
                ctx.fillStyle = ASSETS.bird.color;
                ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
            }
        }

        ctx.restore();
    }

    getBounds() {
        // Forgiving hitbox (10% smaller)
        const padding = this.width * 0.1;
        return {
            x: this.x + padding,
            y: this.y + padding,
            width: this.width - padding * 2,
            height: this.height - padding * 2
        };
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.velocity = 0;
        this.rotation = 0;
    }
}

// ============================
// PIPE CLASS
// ============================

class Pipe {
    constructor() {
        this.x = 0;
        this.topHeight = 0;
        this.bottomY = 0;
        this.width = CONFIG.PIPE_WIDTH;
        this.passed = false;
        this.jargon = '';
    }

    reset(x, canvasHeight, gap) {
        this.x = x;
        this.gap = gap || CONFIG.PIPE_GAP_START;
        const minHeight = 50;
        // Ensure we have enough space for the gap
        const safeGap = Math.min(this.gap, canvasHeight - 100);
        const maxHeight = canvasHeight - safeGap - 50;
        
        this.topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
        this.bottomY = this.topHeight + safeGap;
        this.passed = false;
        this.jargon = JARGON_LIST[Math.floor(Math.random() * JARGON_LIST.length)];
    }

    update() {
        this.x -= CONFIG.PIPE_SPEED;
    }

    draw(ctx, assetLoader, canvasHeight) {
        const pipeReady = assetLoader.isReady('pipe');

        // Draw top pipe
        if (pipeReady) {
            ctx.drawImage(
                assetLoader.get('pipe'),
                this.x,
                0,
                this.width,
                this.topHeight
            );
        } else {
            ctx.fillStyle = ASSETS.pipe.color;
            ctx.fillRect(this.x, 0, this.width, this.topHeight);
        }

        // Draw bottom pipe
        if (pipeReady) {
            ctx.drawImage(
                assetLoader.get('pipe'),
                this.x,
                this.bottomY,
                this.width,
                canvasHeight - this.bottomY
            );
        } else {
            ctx.fillStyle = ASSETS.pipe.color;
            ctx.fillRect(this.x, this.bottomY, this.width, canvasHeight - this.bottomY);
        }

        // Draw signboard on top pipe
        this.drawSignboard(ctx, this.x, this.topHeight - CONFIG.SIGNBOARD_HEIGHT - CONFIG.SIGNBOARD_OFFSET);
    }

    drawSignboard(ctx, x, y) {
        const boardWidth = this.width * 1.5;
        const boardHeight = CONFIG.SIGNBOARD_HEIGHT;
        const boardX = x - (boardWidth - this.width) / 2;

        // Signboard background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(boardX, y, boardWidth, boardHeight);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(boardX, y, boardWidth, boardHeight);

        // Text
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Dynamic font sizing
        let fontSize = 16;
        ctx.font = `bold ${fontSize}px Arial`;
        let textWidth = ctx.measureText(this.jargon).width;

        while (textWidth > boardWidth - 10 && fontSize > 10) {
            fontSize--;
            ctx.font = `bold ${fontSize}px Arial`;
            textWidth = ctx.measureText(this.jargon).width;
        }

        ctx.fillText(this.jargon, boardX + boardWidth / 2, y + boardHeight / 2);
    }

    getBounds() {
        return {
            top: { x: this.x, y: 0, width: this.width, height: this.topHeight },
            bottom: { x: this.x, y: this.bottomY, width: this.width, height: 1000 }
        };
    }

    isOffScreen() {
        return this.x + this.width < 0;
    }
}

// ============================
// GESTURE CONTROLLER
// ============================

class GestureController {
    constructor(element, callbacks) {
        this.element = element;
        this.onCircle = callbacks.onCircle;
        
        this.strokes = [];
        this.isDrawing = false;
        this.currentStroke = null;
        
        this.init();
    }

    init() {
        this.element.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.element.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.element.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
    }

    handleTouchStart(e) {
        const now = Date.now();
        const touch = e.changedTouches[0];
        
        // Gesture Logic
        this.isDrawing = true;
        this.currentStroke = {
            startX: touch.clientX,
            startY: touch.clientY,
            lastX: touch.clientX,
            lastY: touch.clientY,
            endX: touch.clientX,
            endY: touch.clientY,
            pathLength: 0,
            startTime: now
        };
    }

    handleTouchMove(e) {
        if (!this.isDrawing || !this.currentStroke) return;
        const touch = e.changedTouches[0];
        
        // Calculate distance from last point
        const dx = touch.clientX - this.currentStroke.lastX;
        const dy = touch.clientY - this.currentStroke.lastY;
        this.currentStroke.pathLength += Math.sqrt(dx*dx + dy*dy);
        
        // Update last and end
        this.currentStroke.lastX = touch.clientX;
        this.currentStroke.lastY = touch.clientY;
        this.currentStroke.endX = touch.clientX;
        this.currentStroke.endY = touch.clientY;
    }

    handleTouchEnd(e) {
        if (!this.isDrawing || !this.currentStroke) return;
        this.isDrawing = false;
        
        const now = Date.now();
        const dx = this.currentStroke.endX - this.currentStroke.startX;
        const dy = this.currentStroke.endY - this.currentStroke.startY;
        const distStartToEnd = Math.sqrt(dx*dx + dy*dy);
        
        // Check for "O" (Circle)
        // Logic: Long path (>150px), but start and end are close (<60px)
        if (this.currentStroke.pathLength > 150 && distStartToEnd < 60) {
             if (this.onCircle) this.onCircle();
             this.strokes = []; // Reset
             return;
        }
        
        // Cleanup old strokes (older than 1s)
        this.strokes = this.strokes.filter(s => now - s.timestamp < 1000);
        this.currentStroke = null;
    }
}

// ============================
// GAME CLASS
// ============================

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Handle high-DPI displays
        this.setupCanvas();
        
        this.assetLoader = new AssetLoader();
        this.audio = new AudioController();
        this.state = GAME_STATE.START;
        this.score = 0;
        this.bgX = 0;
        this.bgSpeed = 1; // Speed of background scrolling
        
        this.bird = new Bird(100, this.canvas.height / 2);
        this.pipes = [];
        this.projectiles = [];
        this.enemies = [];
        this.collectibles = [];
        this.frameCount = 0;
        
        this.achievements = {
            5: { unlocked: false, msg: "Baseline Established." },
            10: { unlocked: false, msg: "Stakeholders Impressed." },
            20: { unlocked: false, msg: "You’re Basically a Case Study." }
        };

        // Create pipe pool
        for (let i = 0; i < CONFIG.PIPE_POOL_SIZE; i++) {
            this.pipes.push(new Pipe());
        }
        
        this.setupEventListeners();
        
        // Initialize Gesture Controller
        this.gestureController = new GestureController(this.canvas, {
            onCircle: () => this.toggleCheatModal()
        });

        this.assetLoader.load(() => {
            console.log('Assets loaded (or fallbacks ready)');
        });
        
        this.lastTime = 0;
        this.requestId = null;
        
        // Start game loop
        this.gameLoop(0);
    }

    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        this.ctx.scale(dpr, dpr);
        
        // Store logical dimensions
        this.logicalWidth = rect.width;
        this.logicalHeight = rect.height;
    }

    setupEventListeners() {
        // Start button
        document.getElementById('startBtn').addEventListener('click', () => this.startGame('start'));
        
        // Restart button
        document.getElementById('restartBtn').addEventListener('click', () => this.startGame('restart'));
        
        // Share button
        document.getElementById('shareBtn').addEventListener('click', () => this.shareResult());

        // Flap controls
        const flapHandler = (e) => {
            if (this.state === GAME_STATE.PLAYING) {
                e.preventDefault();
                this.bird.flap();
                this.audio.flap();
            }
        };
        
        window.addEventListener('keydown', (e) => {
            if (this.bird.cursorControl) {
                if (e.code === 'ArrowUp') {
                    e.preventDefault();
                    this.bird.velocity = -5;
                }
                if (e.code === 'ArrowDown') {
                    e.preventDefault();
                    this.bird.velocity = 5;
                }
            } else if (e.code === 'Space') {
                flapHandler(e);
            }

            // Shoot Projectile (Fun Mode)
            if (e.code === 'KeyS' && this.bird.funMode) {
                this.projectiles.push(new Projectile(this.bird.x + this.bird.width, this.bird.y + this.bird.height/2));
                this.audio.shoot();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (this.bird.cursorControl) {
                if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
                    this.bird.velocity = 0;
                }
            }
        });
        
        this.canvas.addEventListener('click', flapHandler);
        this.canvas.addEventListener('touchstart', flapHandler, { passive: false });
        
        // Prevent scrolling on mobile
        document.body.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
        
        // Handle resize
        window.addEventListener('resize', () => {
            this.setupCanvas();
        });

        // Cheat Code Listener
        let keySequence = [];
        const cheatCode = "iddqd";
        window.addEventListener('keydown', (e) => {
            keySequence.push(e.key.toLowerCase());
            if (keySequence.length > cheatCode.length) {
                keySequence.shift();
            }
            if (keySequence.join('') === cheatCode) {
                this.toggleCheatModal();
            }
        });

        // Cheat Modal Controls
        document.getElementById('sys_ok').addEventListener('click', () => this.applyCheats());
        document.getElementById('sys_cl').addEventListener('click', () => this.toggleCheatModal());
        
        // Live update values in modal
        const paramMap = {
            'sys_g': 'disp_g',
            'sys_gp': 'disp_gp',
            'sys_sp': 'disp_sp'
        };

        Object.keys(paramMap).forEach(id => {
            document.getElementById(id).addEventListener('input', (e) => {
                document.getElementById(paramMap[id]).textContent = e.target.value;
            });
        });
    }

    toggleCheatModal() {
        const modal = document.getElementById('sysConfig');
        const isHidden = modal.classList.contains('hidden');
        
        if (isHidden) {
            // Open Modal
            modal.classList.remove('hidden');
            
            // Populate current values
            const currentGravity = this.bird.gravity || CONFIG.GRAVITY_NORMAL;
            document.getElementById('sys_g').value = currentGravity;
            document.getElementById('disp_g').textContent = currentGravity;
            
            // Use PIPE_GAP_END as the configurable value for now
            document.getElementById('sys_gp').value = CONFIG.PIPE_GAP_END;
            document.getElementById('disp_gp').textContent = CONFIG.PIPE_GAP_END;
            
            document.getElementById('sys_sp').value = CONFIG.PIPE_SPACING;
            document.getElementById('disp_sp').textContent = CONFIG.PIPE_SPACING;
            
            document.getElementById('sys_cr').checked = this.bird.cursorControl;
            document.getElementById('sys_fn').checked = this.bird.funMode;

            // Pause game if playing
            if (this.state === GAME_STATE.PLAYING) {
                this.paused = true;
            }
        } else {
            // Close Modal
            modal.classList.add('hidden');
            if (this.state === GAME_STATE.PLAYING) {
                this.paused = false;
            }
        }
    }

    applyCheats() {
        const newGravity = parseFloat(document.getElementById('sys_g').value);
        const newGap = parseInt(document.getElementById('sys_gp').value);
        const newSpacing = parseInt(document.getElementById('sys_sp').value);
        const cursorControl = document.getElementById('sys_cr').checked;
        const funMode = document.getElementById('sys_fn').checked;

        // Apply to Config
        CONFIG.GRAVITY_NORMAL = newGravity; // Update base config
        CONFIG.PIPE_GAP_END = newGap; // Update the target gap
        CONFIG.PIPE_SPACING = newSpacing;

        // Apply immediately to current game state
        this.bird.gravity = newGravity;
        this.bird.cursorControl = cursorControl;
        this.bird.funMode = funMode;
        
        // Note: Pipe gap/spacing will apply to new pipes generated
        
        this.toggleCheatModal();
    }

    startGame(source = 'start') {
        this.state = GAME_STATE.PLAYING;
        this.score = 0;
        
        // Reset Achievements
        Object.keys(this.achievements).forEach(k => this.achievements[k].unlocked = false);

        // Set difficulty
        const selectorName = `difficulty_${source}`;
        const mode = document.querySelector(`input[name="${selectorName}"]:checked`).value;
        this.difficulty = mode;
        this.bird.gravity = mode === 'simple' ? CONFIG.GRAVITY_SIMPLE : CONFIG.GRAVITY_NORMAL;

        // Reset bird
        this.bird.reset(100, this.logicalHeight / 2);
        
        // Reset entities
        this.projectiles = [];
        this.enemies = [];
        this.collectibles = [];
        this.frameCount = 0;

        // Reset pipes
        const initialGap = CONFIG.PIPE_GAP_START;
        this.pipes.forEach((pipe, i) => {
            pipe.reset(
                this.logicalWidth + i * CONFIG.PIPE_SPACING,
                this.logicalHeight,
                initialGap
            );
        });
        
        // Update UI
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('score').textContent = '0';
    }

    gameOver() {
        if (this.state !== GAME_STATE.GAME_OVER) {
            this.audio.hit();
        }
        this.state = GAME_STATE.GAME_OVER;
        
        // Update UI
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.getElementById('gameOverMessage').textContent = `You cleared ${this.score} challenges. Let’s make 2026 ridiculously good.`;
    }

    shareResult() {
        const text = `I cleared ${this.score} challenges in Flappy Corp! Can you beat my 2026 readiness score? #FlappyCorp`;
        if (navigator.share) {
            navigator.share({
                title: 'Flappy Corp',
                text: text,
                url: window.location.href
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast("Result copied to clipboard!");
            }).catch(() => {
                this.showToast("Failed to copy result.");
            });
        }
    }

    showToast(msg) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = msg;
        container.appendChild(toast);
        
        // Remove after animation (3s total: 0.5 in + 2 wait + 0.5 out)
        setTimeout(() => {
            if (toast.parentElement) toast.remove();
        }, 3000);
    }

    checkAchievements() {
        if (this.achievements[this.score] && !this.achievements[this.score].unlocked) {
            this.achievements[this.score].unlocked = true;
            this.showToast(this.achievements[this.score].msg);
            this.audio.score(); // Extra ding
        }
    }

    update() {
        if (this.state !== GAME_STATE.PLAYING || this.paused) return;

        this.frameCount++;

        // Update background position
        this.bgX -= this.bgSpeed;
        if (this.bgX <= -this.logicalWidth) {
            this.bgX = 0;
        }

        // Update bird
        this.bird.update();

        // Check Achievements
        this.checkAchievements();

        // Spawn Collectibles (Rare: 1% chance every 60 frames)
        if (this.frameCount % 60 === 0 && Math.random() < 0.05) {
            this.collectibles.push(new Collectible(this.logicalWidth, this.logicalHeight));
        }

        // Spawn Enemies (Fun Mode)
        if (this.bird.funMode && this.frameCount % CONFIG.ENEMY_SPAWN_RATE === 0) {
            this.enemies.push(new Enemy(this.logicalWidth, this.logicalHeight));
        }

        // Update Projectiles
        this.projectiles.forEach((proj, index) => {
            proj.update();
            if (proj.markedForDeletion) {
                this.projectiles.splice(index, 1);
            }
        });

        // Update Enemies
        this.enemies.forEach((enemy, index) => {
            enemy.update();

            // Bounce off floor/ceiling
            if (enemy.y <= 0 || enemy.y + enemy.height >= this.logicalHeight) {
                enemy.vy *= -1;
            }

            // Bounce off pipes
            this.pipes.forEach(pipe => {
                const bounds = pipe.getBounds();
                if (this.checkRectCollision(enemy.getBounds(), bounds.top)) {
                    this.resolveEnemyCollision(enemy, bounds.top);
                }
                if (this.checkRectCollision(enemy.getBounds(), bounds.bottom)) {
                    this.resolveEnemyCollision(enemy, bounds.bottom);
                }
            });

            if (enemy.markedForDeletion) {
                this.enemies.splice(index, 1);
            }
        });

        // Update Collectibles
        this.collectibles.forEach((item, index) => {
            item.update();
            if (item.markedForDeletion) {
                this.collectibles.splice(index, 1);
            }
            
            // Check Collision
            if (this.checkRectCollision(this.bird.getBounds(), item.getBounds())) {
                item.markedForDeletion = true;
                this.score += 3;
                document.getElementById('score').textContent = this.score;
                this.audio.collect();
                this.showToast("ACTIONABLE INSIGHT! (+3)");
            }
        });

        // Check Projectile Collisions
        this.projectiles.forEach((proj, pIndex) => {
            // Vs Enemies
            this.enemies.forEach((enemy, eIndex) => {
                if (this.checkRectCollision(proj.getBounds(), enemy.getBounds())) {
                    if (enemy.type === 'SHOOTABLE') {
                        enemy.markedForDeletion = true;
                        proj.markedForDeletion = true;
                        this.score += 5; // Bonus score
                        document.getElementById('score').textContent = this.score;
                        this.audio.explosion();
                    }
                }
            });

            // Vs Pipes
            this.pipes.forEach(pipe => {
                const bounds = pipe.getBounds();
                if (this.checkRectCollision(proj.getBounds(), bounds.top) || 
                    this.checkRectCollision(proj.getBounds(), bounds.bottom)) {
                    proj.markedForDeletion = true;
                }
            });
        });

        // Check Enemy Collisions (Vs Bird)
        this.enemies.forEach((enemy, index) => {
            if (this.checkRectCollision(this.bird.getBounds(), enemy.getBounds())) {
                if (enemy.type === 'EATABLE') {
                    enemy.markedForDeletion = true;
                    this.score += 2; // Bonus score
                    document.getElementById('score').textContent = this.score;
                    this.audio.score();
                } else if (enemy.type === 'SHOOTABLE') {
                    this.gameOver();
                }
            }
        });

        // Check if bird hits floor or ceiling
        if (this.bird.y + this.bird.height > this.logicalHeight || this.bird.y < 0) {
            this.gameOver();
            return;
        }

        // Update pipes
        this.pipes.forEach(pipe => {
            pipe.update();

            // Check for score
            if (!pipe.passed && pipe.x + pipe.width < this.bird.x) {
                pipe.passed = true;
                this.score++;
                document.getElementById('score').textContent = this.score;
                this.audio.score();
            }

            // Recycle pipe
            if (pipe.isOffScreen()) {
                const lastPipe = this.pipes.reduce((max, p) => 
                    p.x > max.x ? p : max
                );
                
                // Calculate dynamic gap
                let nextGap = CONFIG.PIPE_GAP_START;
                if (this.difficulty === 'normal') {
                    // Shrink gap based on score (e.g. -5px per point), capped at PIPE_GAP_END
                    nextGap = Math.max(CONFIG.PIPE_GAP_END, CONFIG.PIPE_GAP_START - (this.score * 5));
                }

                pipe.reset(lastPipe.x + CONFIG.PIPE_SPACING, this.logicalHeight, nextGap);
            }

            // Check collision
            if (this.checkCollision(this.bird, pipe)) {
                this.gameOver();
            }
        });
    }

    checkRectCollision(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    }

    checkCollision(bird, pipe) {
        const birdBounds = bird.getBounds();
        const pipeBounds = pipe.getBounds();

        // AABB collision detection
        const hitTop = this.checkRectCollision(birdBounds, pipeBounds.top);
        const hitBottom = this.checkRectCollision(birdBounds, pipeBounds.bottom);

        return hitTop || hitBottom;
    }

    resolveEnemyCollision(enemy, rect) {
        // Calculate overlaps
        const enemyCenter = { x: enemy.x + enemy.width/2, y: enemy.y + enemy.height/2 };
        const rectCenter = { x: rect.x + rect.width/2, y: rect.y + rect.height/2 };
        
        const dx = enemyCenter.x - rectCenter.x;
        const dy = enemyCenter.y - rectCenter.y;
        
        const combinedHalfWidth = (enemy.width + rect.width) / 2;
        const combinedHalfHeight = (enemy.height + rect.height) / 2;
        
        const overlapX = combinedHalfWidth - Math.abs(dx);
        const overlapY = combinedHalfHeight - Math.abs(dy);
        
        if (overlapX < overlapY) {
            // Horizontal collision
            enemy.vx = -enemy.vx;
            // Push out
            if (dx > 0) enemy.x += overlapX; else enemy.x -= overlapX;
        } else {
            // Vertical collision
            enemy.vy = -enemy.vy;
            // Push out
            if (dy > 0) enemy.y += overlapY; else enemy.y -= overlapY;
        }
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);

        // Draw background
        if (this.assetLoader.isReady('bg')) {
            const bgImage = this.assetLoader.get('bg');
            // Draw first copy
            this.ctx.drawImage(
                bgImage,
                this.bgX,
                0,
                this.logicalWidth,
                this.logicalHeight
            );
            // Draw second copy
            this.ctx.drawImage(
                bgImage,
                this.bgX + this.logicalWidth,
                0,
                this.logicalWidth,
                this.logicalHeight
            );
        } else {
            this.ctx.fillStyle = ASSETS.bg.color;
            this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
        }

        // Draw pipes
        this.pipes.forEach(pipe => {
            pipe.draw(this.ctx, this.assetLoader, this.logicalHeight);
        });

        // Draw Enemies
        this.enemies.forEach(enemy => {
            enemy.draw(this.ctx, this.assetLoader);
        });

        // Draw Collectibles
        this.collectibles.forEach(item => {
            item.draw(this.ctx);
        });

        // Draw Projectiles
        this.projectiles.forEach(proj => {
            proj.draw(this.ctx, this.assetLoader);
        });

        // Draw bird
        this.bird.draw(this.ctx, this.assetLoader);
    }

    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update();
        this.draw();

        this.requestId = requestAnimationFrame((t) => this.gameLoop(t));
    }
}

// ============================
// INITIALIZE GAME
// ============================

window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
