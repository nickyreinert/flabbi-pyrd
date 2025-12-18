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

        // Draw Jargon on the longer pipe segment
        const bottomHeight = canvasHeight - this.bottomY;
        if (this.topHeight > bottomHeight) {
            this.drawVerticalJargon(ctx, this.x, 0, this.topHeight);
        } else {
            this.drawVerticalJargon(ctx, this.x, this.bottomY, bottomHeight);
        }
    }

    drawVerticalJargon(ctx, x, y, height) {
        ctx.save();
        // Center of the pipe segment
        ctx.translate(x + this.width / 2, y + height / 2);
        ctx.rotate(-Math.PI / 2); // Text runs bottom-to-top

        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Dynamic font sizing to fit height
        let fontSize = 20;
        ctx.font = `bold ${fontSize}px Arial`;
        let textWidth = ctx.measureText(this.jargon).width;
        
        // Fit text within pipe height (minus padding)
        const maxTextWidth = height - 20;
        while (textWidth > maxTextWidth && fontSize > 10) {
            fontSize--;
            ctx.font = `bold ${fontSize}px Arial`;
            textWidth = ctx.measureText(this.jargon).width;
        }

        // Draw text with outline
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.strokeText(this.jargon, 0, 0);
        ctx.fillText(this.jargon, 0, 0);

        ctx.restore();
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
