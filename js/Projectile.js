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
