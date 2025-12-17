# Flappy Corp - Development Plan

## Project Overview
**Task:** Build "Flappy Corp" - a Flappy Bird clone with a corporate satire theme.

**Tech Stack:** Vanilla JavaScript, HTML5 Canvas, CSS3. No frameworks.

**Output:** Single HTML file (or separate files if preferred) containing the complete game logic.

---

## 1. Architecture & Setup

### Pattern
- Single Page Application (SPA) with a main `Game` class

### Loop
- Use `requestAnimationFrame` for the game loop (Update → Draw)

### Canvas
- Full-screen responsive canvas
- Handle high-DPI displays (Retina) by scaling the internal resolution vs CSS size

### State Management
- Simple state machine: `START`, `PLAYING`, `GAME_OVER`

---

## 2. Core Mechanics

### Physics
- Implement gravity (constant downward acceleration)
- Implement flap (instant upward velocity)

### Input
- Bind Spacebar, Click, and TouchStart to the flap action

### Object Pooling
- **DO NOT** create/destroy obstacles
- Create a fixed pool of 6 pipe pairs and recycle them when they exit the screen

### Collision
- Axis-Aligned Bounding Box (AABB)
- Pixel-perfect is not needed, but hitboxes should be forgiving (slightly smaller than sprites)

---

## 3. The "Corporate" Twist (Crucial)

### Obstacles
- Pipes are office pillars
- Attached to each pipe is a "signboard"

### Text Rendering
- When a pipe is recycled, pick a random string from the "Jargon List" and render it onto the signboard using `ctx.fillText`

### Jargon List
```javascript
["Align Stakeholders", "Circle Back", "Urgent: EOD", "KPI Soup", "Optimize Funnel", 
 "Low Budget", "Viral Content", "More Pop", "Feedback Round", "Do More w/ Less", 
 "Brand Purpose", "Pivot to Pivot", "Q1 Reset"]
```

### Text Logic
- Ensure text is centered and legible
- If the string is too long, scale the font size down slightly to fit the signboard width

---

## 4. Asset Management & Visuals (The "Switcheroo" System)

### Asset Manifest
Create a constant dictionary `ASSETS` at the top of the file:

```javascript
const ASSETS = {
    bird: { src: 'assets/bird.png', color: '#FFD700' }, // Gold fallback
    pipe: { src: 'assets/pipe.png', color: '#2F4F4F' }, // Dark Slate Gray fallback
    bg:   { src: 'assets/bg.png',   color: '#87CEEB' }  // Sky Blue fallback
};
```

### Loader System
- Implement a simple `AssetLoader` that preloads these images

### Rendering Logic (Crucial)
In your `draw()` methods (for Bird, Pipe, etc.), implement a fallback check:

- **IF** the image is loaded and ready: Use `ctx.drawImage()`
- **ELSE**: Use `ctx.fillStyle = ASSETS.key.color` and `ctx.fillRect()`

**Benefit:** This allows the game to be playable immediately with colored rectangles (prototyping phase) and automatically switch to sprites once the files are added, without changing the code logic.

---

## 5. UI Overlay

### Start
- Message: "Happy New Year! Ready to clear 2026?"
- Button: "Start"

### HUD
- Current Score (top center)

### Game Over
- Message: "You cleared {score} challenges."
- Button: "Play Again"

---

## 6. Mobile Responsiveness

- Prevent default touch behaviors (scrolling/zooming) on the canvas
- Ensure the game scales correctly on portrait and landscape modes

---

## Deliverable

Start by writing:
1. The `index.html` structure
2. The core `game.js` logic that handles:
   - The game loop
   - Player physics
   - Basic pipe rendering with the fallback system
