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
        this.active = false;
    }

    reset(x, canvasHeight, gap, jargon) {
        this.x = x;
        this.gap = gap;
        this.jargon = jargon;
        this.active = true;
        const minHeight = 50;
        
        // Ensure we have enough space for the gap
        // Clamp gap to be at most canvasHeight - 100 (leaving 50px for top and bottom pipes)
        const safeGap = Math.max(50, Math.min(this.gap, canvasHeight - 100));
        
        const maxHeight = canvasHeight - safeGap - minHeight;
        
        // Ensure maxHeight is at least minHeight
        const safeMaxHeight = Math.max(minHeight, maxHeight);

        this.topHeight = Math.random() * (safeMaxHeight - minHeight) + minHeight;
        this.bottomY = this.topHeight + safeGap;
        
        this.passed = false;
        this.signRotation = (Math.random() * 0.2) - 0.1; // Random skew between -0.1 and 0.1 radians
    }

    update() {
        this.x -= CONFIG.PIPE_SPEED;
    }

    draw(ctx, assetLoader, canvasHeight) {
        if (!this.active) return;

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

        // Draw Jargon Sign on the longer pipe segment
        const bottomHeight = canvasHeight - this.bottomY;
        if (this.topHeight > bottomHeight) {
            this.drawSign(ctx, this.x, 0, this.topHeight);
        } else {
            this.drawSign(ctx, this.x, this.bottomY, bottomHeight);
        }
    }

    drawSign(ctx, x, y, height) {
        ctx.save();
        // Center of the pipe segment
        ctx.translate(x + this.width / 2, y + height / 2);
        
        // Apply random skew/rotation
        ctx.rotate(this.signRotation);

        // Sign style
        const fontSize = 24;
        ctx.font = `bold ${fontSize}px Arial`;
        const textMetrics = ctx.measureText(this.jargon);
        const paddingX = 20;
        const paddingY = 15;
        const signWidth = textMetrics.width + (paddingX * 2);
        const signHeight = fontSize + (paddingY * 2);

        // Draw Sign Board (White background with border)
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        
        // Draw a rounded rectangle for the sign
        this.roundRect(ctx, -signWidth / 2, -signHeight / 2, signWidth, signHeight, 5);
        ctx.fill();
        ctx.stroke();

        // Draw "Bolts"
        ctx.fillStyle = '#999';
        ctx.beginPath();
        ctx.arc(-signWidth/2 + 8, 0, 3, 0, Math.PI * 2);
        ctx.arc(signWidth/2 - 8, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw Text
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.jargon, 0, 0);

        ctx.restore();
    }

    roundRect(ctx, x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
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
