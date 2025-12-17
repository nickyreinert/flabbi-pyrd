// ============================
// CONSTANTS & CONFIGURATION
// ============================

const ASSETS = {
    bird: { src: 'assets/bird.png', color: '#FFD700' }, // Gold fallback
    pipe: { src: 'assets/pipe.png', color: '#2F4F4F' }, // Dark Slate Gray fallback
    bg:   { src: 'assets/bg.png',   color: '#87CEEB' }  // Sky Blue fallback
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
    GRAVITY: 0.5,
    FLAP_POWER: -8,
    BIRD_SIZE: 40,
    PIPE_WIDTH: 80,
    PIPE_GAP: 180,
    PIPE_SPEED: 2.5,
    PIPE_POOL_SIZE: 6,
    PIPE_SPACING: 300,
    SIGNBOARD_HEIGHT: 50,
    SIGNBOARD_OFFSET: 20
};

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
    }

    flap() {
        this.velocity = CONFIG.FLAP_POWER;
    }

    update() {
        this.velocity += CONFIG.GRAVITY;
        this.y += this.velocity;

        // Update rotation based on velocity
        this.rotation = Math.min(Math.max(this.velocity * 3, -30), 90);
    }

    draw(ctx, assetLoader) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
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

    reset(x, canvasHeight) {
        this.x = x;
        const minHeight = 50;
        const maxHeight = canvasHeight - CONFIG.PIPE_GAP - 50;
        this.topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
        this.bottomY = this.topHeight + CONFIG.PIPE_GAP;
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
// GAME CLASS
// ============================

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Handle high-DPI displays
        this.setupCanvas();
        
        this.assetLoader = new AssetLoader();
        this.state = GAME_STATE.START;
        this.score = 0;
        
        this.bird = new Bird(100, this.canvas.height / 2);
        this.pipes = [];
        
        // Create pipe pool
        for (let i = 0; i < CONFIG.PIPE_POOL_SIZE; i++) {
            this.pipes.push(new Pipe());
        }
        
        this.setupEventListeners();
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
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        
        // Restart button
        document.getElementById('restartBtn').addEventListener('click', () => this.startGame());
        
        // Flap controls
        const flapHandler = (e) => {
            if (this.state === GAME_STATE.PLAYING) {
                e.preventDefault();
                this.bird.flap();
            }
        };
        
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                flapHandler(e);
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
    }

    startGame() {
        this.state = GAME_STATE.PLAYING;
        this.score = 0;
        
        // Reset bird
        this.bird.reset(100, this.logicalHeight / 2);
        
        // Reset pipes
        this.pipes.forEach((pipe, i) => {
            pipe.reset(
                this.logicalWidth + i * CONFIG.PIPE_SPACING,
                this.logicalHeight
            );
        });
        
        // Update UI
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('score').textContent = '0';
    }

    gameOver() {
        this.state = GAME_STATE.GAME_OVER;
        
        // Update UI
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.getElementById('finalScore').textContent = `You cleared ${this.score} challenges.`;
    }

    update() {
        if (this.state !== GAME_STATE.PLAYING) return;

        // Update bird
        this.bird.update();

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
            }

            // Recycle pipe
            if (pipe.isOffScreen()) {
                const lastPipe = this.pipes.reduce((max, p) => 
                    p.x > max.x ? p : max
                );
                pipe.reset(lastPipe.x + CONFIG.PIPE_SPACING, this.logicalHeight);
            }

            // Check collision
            if (this.checkCollision(this.bird, pipe)) {
                this.gameOver();
            }
        });
    }

    checkCollision(bird, pipe) {
        const birdBounds = bird.getBounds();
        const pipeBounds = pipe.getBounds();

        // AABB collision detection
        const hitTop = (
            birdBounds.x < pipeBounds.top.x + pipeBounds.top.width &&
            birdBounds.x + birdBounds.width > pipeBounds.top.x &&
            birdBounds.y < pipeBounds.top.y + pipeBounds.top.height &&
            birdBounds.y + birdBounds.height > pipeBounds.top.y
        );

        const hitBottom = (
            birdBounds.x < pipeBounds.bottom.x + pipeBounds.bottom.width &&
            birdBounds.x + birdBounds.width > pipeBounds.bottom.x &&
            birdBounds.y < pipeBounds.bottom.y + pipeBounds.bottom.height &&
            birdBounds.y + birdBounds.height > pipeBounds.bottom.y
        );

        return hitTop || hitBottom;
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);

        // Draw background
        if (this.assetLoader.isReady('bg')) {
            this.ctx.drawImage(
                this.assetLoader.get('bg'),
                0,
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
