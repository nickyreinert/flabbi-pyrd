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
