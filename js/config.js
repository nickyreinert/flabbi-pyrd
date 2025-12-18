// ============================
// CONSTANTS & CONFIGURATION
// ============================

const ASSETS = {
    bird: { src: 'assets/bird.svg', color: '#FFD700' }, // Gold fallback
    pipe: { src: 'assets/pipe.svg', color: '#2F4F4F' }, // Dark Slate Gray fallback
    bg:   { src: 'assets/bg.svg',   color: '#87CEEB' },  // Sky Blue fallback
    pacman: { src: 'assets/pacman.svg', color: '#FFFF00' },
    enemy_shoot: { src: 'assets/ghost_red.svg', color: '#FF0000' },
    enemy_eat: { src: 'assets/ghost_blue.svg', color: '#0000FF' },
    projectile: { src: 'assets/spit.svg', color: '#00BFFF' }
};

const JARGON_LIST = [
    "Align Stakeholders", 
    "Circle Back", 
    "Urgent: EOD", 
    "KPI Soup", 
    "Optimize Funnel", 
    "Low Budget", 
    "Viral Content", 
    "More Pop", 
    "Feedback Round", 
    "Do More w/ Less", 
    "Brand Purpose", 
    "Pivot to Pivot", 
    "Q1 Reset"
];

const GAME_STATE = {
    START: 'START',
    PLAYING: 'PLAYING',
    GAME_OVER: 'GAME_OVER',
    WON: 'WON'
};

const CONFIG = {
    GRAVITY_NORMAL: 0.5,
    GRAVITY_SIMPLE: 0.3,
    FLAP_POWER: -8,
    BIRD_SIZE: 40,
    PIPE_WIDTH: 80,
    PIPE_GAP_START: 0.5,
    PIPE_GAP_END: 0.2,
    PIPE_SPEED: 2.5,
    PIPE_POOL_SIZE: 6,
    PIPE_SPACING: 0.6,
    SIGNBOARD_HEIGHT: 50,
    SIGNBOARD_OFFSET: 20,
    PROJECTILE_SPEED: 10,
    ENEMY_SPEED: 3,
    ENEMY_SPAWN_RATE: 120 // Frames
};

const AUDIO_CONFIG = {
    FLAP: { freq: 200, type: 'sine', duration: 0.1, vol: 0.1 },
    SCORE: { freq: 500, type: 'square', duration: 0.1, vol: 0.05 },
    HIT: { freq: 80, type: 'sawtooth', duration: 0.3, vol: 0.2 },
    SHOOT: { freq: 400, type: 'square', duration: 0.05, vol: 0.05 },
    SHOOT_ECHO: { freq: 300, type: 'square', duration: 0.05, vol: 0.05 },
    EXPLOSION: { freq: 50, type: 'sawtooth', duration: 0.2, vol: 0.2 },
    COLLECT: { freq: 600, type: 'sine', duration: 0.1, vol: 0.1 },
    COLLECT_ECHO: { freq: 800, type: 'sine', duration: 0.2, vol: 0.1 }
};
