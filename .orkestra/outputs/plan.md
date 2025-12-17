# Implementation Plan: Flappy Bird Clone

## 1. Project Overview
We are building a Flappy Bird clone using vanilla HTML, CSS, and JavaScript. The goal is to have a functional game with a start screen, game loop, and game over screen.

## 2. Architecture

### 2.1 HTML Structure (`index.html`)
The HTML will serve as the container for the game canvas and UI overlays.
- **Container**: `#game-container` (Relative positioning context)
- **Canvas**: `<canvas id="game-canvas">` (Where the game renders)
- **UI Layer**: `#ui-layer` (Absolute positioning over canvas)
    - **Start Screen**: `#start-screen` (Title, Instructions)
    - **Score**: `#score-display` (Live score during gameplay)
    - **Game Over**: `#game-over-screen` (Final score, Restart button)

### 2.2 CSS Styling (`css/style.css`)
- **Layout**: Flexbox for centering the game container on the page.
- **Game Container**: Fixed dimensions (e.g., 320px x 480px) to mimic mobile aspect ratio.
- **Typography**: Simple, readable fonts.
- **States**: Utility classes like `.hidden` to toggle UI screens.
- **Colors**: CSS variables for easy theming (sky blue background, green pipes).

### 2.3 JavaScript Logic (`js/app.js`)
The game will run on a standard game loop using `requestAnimationFrame`.

#### Core Modules/Objects:
1.  **Game Loop**: Manages the timing and updates.
2.  **Input Handler**: Listens for clicks/taps/spacebar to trigger "jump".
3.  **Bird Entity**:
    - Properties: `x`, `y`, `velocity`, `gravity`, `jumpStrength`.
    - Methods: `update()`, `draw()`, `flap()`.
4.  **Pipe Manager**:
    - Manages an array of pipe objects.
    - Spawns new pipes at intervals.
    - Updates pipe positions.
    - Removes off-screen pipes.
5.  **Collision Detection**:
    - Checks overlap between Bird rect and Pipe rects.
    - Checks floor/ceiling collision.
6.  **Game State Manager**:
    - States: `READY`, `PLAYING`, `GAME_OVER`.
    - Handles transitions (e.g., resetting variables on restart).

## 3. Step-by-Step Implementation Strategy

1.  **Setup**: Create files and basic HTML boilerplate.
2.  **Rendering**: Set up the Canvas context and draw a static bird.
3.  **Physics**: Implement gravity and the jump mechanic.
4.  **Pipes**: Implement pipe spawning and movement logic.
5.  **Collision**: Add collision detection to end the game.
6.  **UI & Polish**: Add start/end screens and score counting.
