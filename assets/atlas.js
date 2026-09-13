globalThis.LB ||= {};
globalThis.LB.Atlas = {
  frameWidth: 32,
  frameHeight: 48,
  strideX: 34,
  strideY: 50,
  actors: [
    "player",
    "ana",
    "bruno",
    "carla",
    "diego",
    "elisa",
    "felipe",
    "marina",
  ],
  animations: {
    walk: { start: 0, count: 6, fps: 9 },
    idle: { start: 6, count: 2, fps: 2 },
    talk: { start: 8, count: 3, fps: 3 },
    stamp: { start: 11, count: 5, fps: 15 },
    deliver: { start: 16, count: 6, fps: 12 },
    react: { start: 22, count: 3, fps: 5 },
  },
  directions: ["down", "up", "left", "right"],
};
