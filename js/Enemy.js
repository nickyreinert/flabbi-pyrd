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
