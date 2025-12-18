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
            
            // Animate Mouth (Open/Closed every 150ms)
            const mouthOpen = Math.floor(Date.now() / 150) % 2 === 0;

            if (mouthOpen && assetLoader.isReady('pacman')) {
                ctx.drawImage(assetLoader.get('pacman'), -this.width/2, -this.height/2, this.width, this.height);
            } else {
                // Draw Closed Mouth (Full Circle)
                ctx.fillStyle = ASSETS.pacman.color;
                ctx.beginPath();
                ctx.arc(0, 0, this.width/2, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                
                // Draw Eye
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(0, -this.height/4, 3, 0, Math.PI * 2);
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
