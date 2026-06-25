// Canvas dimensions
export const CANVAS_W = 800;
export const CANVAS_H = 600;

// Player
export const PLAYER_W = 48;
export const PLAYER_H = 24;
export const PLAYER_SPEED = 5;
export const PLAYER_Y = CANVAS_H - 60;
export const BULLET_SPEED = 10;

// Aliens
export const ALIEN_BULLET_SPEED = 2.5;
export const ALIEN_COLS = 11;
export const ALIEN_ROWS = 5;
export const ALIEN_W = 36;
export const ALIEN_H = 24;
export const ALIEN_PAD_X = 16;
export const ALIEN_PAD_Y = 16;
export const ALIEN_DROP = 20;

// Barriers
export const BARRIER_COUNT = 4;
export const BARRIER_W = 64;
export const BARRIER_H = 36;
export const BARRIER_Y = CANVAS_H - 130;

// Alien types: 0=squid(top), 1=crab(mid), 2=octopus(bottom)
export const ALIEN_SCORES = [30, 20, 10];
export const ALIEN_COLORS = ['#ff4edd', '#44d4ff', '#66ff66'];

// UFO
export const UFO_Y = 50;
export const UFO_W = 48;
export const UFO_SPEED = 2.5;
export const UFO_INTERVAL_MIN = 15000;
export const UFO_INTERVAL_MAX = 25000;
