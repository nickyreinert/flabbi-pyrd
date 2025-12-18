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
