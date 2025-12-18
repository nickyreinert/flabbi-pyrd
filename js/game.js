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

        // Re-initialize pipes if they exist (handle resize)
        if (this.pipes && this.pipes.length > 0 && this.state === GAME_STATE.START) {
             const initialGap = CONFIG.PIPE_GAP_START * this.logicalHeight;
             const spacing = CONFIG.PIPE_SPACING * this.logicalWidth;
             this.pipes.forEach((pipe, i) => {
                pipe.reset(
                    this.logicalWidth + i * spacing,
                    this.logicalHeight,
                    initialGap
                );
            });
        }
    }

    setupEventListeners() {
        // Start button
        document.getElementById('startBtn').addEventListener('click', () => this.startGame('start'));
        
        // Restart button
        document.getElementById('restartBtn').addEventListener('click', () => this.startGame('restart'));
        
        // Share button
        document.getElementById('shareBtn').addEventListener('click', () => this.openShareModal());

        // Share Modal Close
        document.getElementById('closeShareBtn').addEventListener('click', () => {
            document.getElementById('shareModal').classList.add('hidden');
        });

        // Share Platform Buttons
        document.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleShare(e.target.closest('.share-btn').dataset.platform));
        });

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
                if (e.code === 'ArrowRight') {
                    e.preventDefault();
                    this.adjustGameSpeed(1.1); // Speed up by 10%
                }
                if (e.code === 'ArrowLeft') {
                    e.preventDefault();
                    this.adjustGameSpeed(0.9); // Slow down by 10%
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

    adjustGameSpeed(factor) {
        CONFIG.PIPE_SPEED *= factor;
        CONFIG.ENEMY_SPEED *= factor;
        CONFIG.PROJECTILE_SPEED *= factor;
        this.bgSpeed *= factor;

        // Update existing enemies velocity
        this.enemies.forEach(enemy => {
            enemy.vx *= factor;
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
        const rawGravity = parseFloat(document.getElementById('sys_g').value);
        const rawGap = parseFloat(document.getElementById('sys_gp').value);
        const rawSpacing = parseFloat(document.getElementById('sys_sp').value);
        
        // Validate and enforce minimums
        const newGravity = (isNaN(rawGravity) || rawGravity < 0) ? CONFIG.GRAVITY_NORMAL : rawGravity;
        const newGap = (isNaN(rawGap) || rawGap < 0.05) ? 0.2 : rawGap; // Min 5% gap
        const newSpacing = (isNaN(rawSpacing) || rawSpacing < 0.2) ? 0.6 : rawSpacing; // Min 20% spacing

        const cursorControl = document.getElementById('sys_cr').checked;
        const funMode = document.getElementById('sys_fn').checked;

        // Apply to Config
        CONFIG.GRAVITY_NORMAL = newGravity;
        CONFIG.PIPE_GAP_END = newGap;
        CONFIG.PIPE_SPACING = newSpacing;

        // Apply immediately to current game state
        this.bird.gravity = newGravity;
        this.bird.cursorControl = cursorControl;
        this.bird.funMode = funMode;
        
        // Note: Pipe gap/spacing will apply to new pipes generated
        
        this.toggleCheatModal();
    }

    startGame(source = 'start') {
        // Initialize Audio Context on user interaction
        this.audio.init();

        this.state = GAME_STATE.PLAYING;
        this.score = 0;
        
        // Reset Speeds (in case they were modified by cheats)
        CONFIG.PIPE_SPEED = 2.5;
        CONFIG.ENEMY_SPEED = 3;
        CONFIG.PROJECTILE_SPEED = 10;
        this.bgSpeed = 1;

        // Reset Achievements
        Object.keys(this.achievements).forEach(k => this.achievements[k].unlocked = false);

        // Set difficulty
        this.bird.gravity = CONFIG.GRAVITY_NORMAL;

        // Reset bird
        this.bird.reset(100, this.logicalHeight / 2);
        
        // Reset entities
        this.projectiles = [];
        this.enemies = [];
        this.collectibles = [];
        this.frameCount = 0;

        // Reset pipes
        this.jargonQueue = [...JARGON_LIST].sort(() => Math.random() - 0.5);
        
        const initialGap = CONFIG.PIPE_GAP_START * this.logicalHeight;
        const spacing = CONFIG.PIPE_SPACING * this.logicalWidth;
        this.pipes.forEach((pipe, i) => {
            const jargon = this.jargonQueue.pop() || "Bonus";
            pipe.reset(
                this.logicalWidth + i * spacing,
                this.logicalHeight,
                initialGap,
                jargon
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

    gameWon() {
        this.state = GAME_STATE.WON;
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.getElementById('gameOverMessage').textContent = `YOU WON! You are fully aligned for 2026! Score: ${this.score}`;
        this.audio.score();
    }

    openShareModal() {
        // Generate Screenshot
        const dataUrl = this.canvas.toDataURL('image/png');
        document.getElementById('sharePreview').src = dataUrl;
        
        // Show Modal
        document.getElementById('shareModal').classList.remove('hidden');
    }

    handleShare(platform) {
        const text = `I cleared ${this.score} challenges in Flappy Corp! Can you beat my 2026 readiness score? #FlappyCorp`;
        const url = window.location.href;
        let shareUrl = '';

        switch(platform) {
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text + ' ' + url)}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
                break;
            case 'xing':
                shareUrl = `https://www.xing.com/spi/shares/new?url=${encodeURIComponent(url)}`;
                break;
            case 'email':
                shareUrl = `mailto:?subject=Flappy Corp Score&body=${encodeURIComponent(text + '\n\nPlay here: ' + url)}`;
                break;
        }

        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400');
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
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const item = this.collectibles[i];
            item.update();
            if (item.markedForDeletion) {
                this.collectibles.splice(i, 1);
                continue;
            }
            
            // Check Collision
            if (this.checkRectCollision(this.bird.getBounds(), item.getBounds())) {
                item.markedForDeletion = true;
                this.score += 3;
                document.getElementById('score').textContent = this.score;
                this.audio.collect();
                this.showToast("ACTIONABLE INSIGHT! (+3)");
            }
        }

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
            if (!pipe.active) return;

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
                const activePipes = this.pipes.filter(p => p.active);
                const lastPipe = activePipes.reduce((max, p) => 
                    p.x > max.x ? p : max
                );
                
                // Calculate dynamic gap
                const gapStart = CONFIG.PIPE_GAP_START * this.logicalHeight;
                const gapEnd = CONFIG.PIPE_GAP_END * this.logicalHeight;
                const spacing = CONFIG.PIPE_SPACING * this.logicalWidth;

                // Shrink gap based on score (e.g. -5px per point), capped at PIPE_GAP_END
                let nextGap = Math.max(gapEnd, gapStart - (this.score * 5));

                // Safety check for NaN
                let nextX = lastPipe.x + spacing;
                if (isNaN(nextX)) {
                    nextX = this.logicalWidth + spacing;
                }

                const jargon = this.jargonQueue.pop();
                if (jargon) {
                    pipe.reset(nextX, this.logicalHeight, nextGap, jargon);
                } else {
                    pipe.active = false;
                    if (this.pipes.every(p => !p.active)) {
                        this.gameWon();
                    }
                }
            }

            // Check collision
            if (pipe.active && this.checkCollision(this.bird, pipe)) {
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
