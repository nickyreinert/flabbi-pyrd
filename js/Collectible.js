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
        
        // Pulse effect for the shine
        const pulse = 1 + Math.sin(this.oscillation * 3) * 0.2;
        
        // Strong Glow
        ctx.shadowBlur = 20 * pulse;
        ctx.shadowColor = "#FFFF00";
        
        // Bulb Glass (Circle)
        ctx.fillStyle = "#FFFFE0"; // Light yellow
        ctx.beginPath();
        ctx.arc(0, -5, 15, 0, Math.PI * 2);
        ctx.fill();

        // Bulb Base (Screw thread - simplified)
        ctx.shadowBlur = 0; // Remove glow for the base
        ctx.fillStyle = "#A9A9A9"; // Dark Gray
        ctx.fillRect(-6, 8, 12, 8);
        
        // Thread details
        ctx.strokeStyle = "#696969";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-6, 10);
        ctx.lineTo(6, 10);
        ctx.moveTo(-6, 13);
        ctx.lineTo(6, 13);
        ctx.stroke();

        // Contact point
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(0, 18, 3, 0, Math.PI * 2);
        ctx.fill();

        // Filament (Glowing inside)
        ctx.shadowBlur = 5;
        ctx.shadowColor = "#FF4500"; // Orange-red glow
        ctx.strokeStyle = "#FF4500";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-5, -5);
        ctx.lineTo(-2, 0);
        ctx.lineTo(2, -5);
        ctx.lineTo(5, 0);
        ctx.stroke();
        
        ctx.restore();
    }

    getBounds() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    }
}
