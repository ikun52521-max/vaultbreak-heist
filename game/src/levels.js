// Vaultbreak — level definitions. Each level is one room of the heist:
// walls (cover and routes), patrolling guards, sweeping cameras, loot and an exit.
// Coordinates are canvas pixels on a 1280 x 736 board.

export const BOARD = { w: 1280, h: 736 };

function wall(x, y, w, h, kind = 'wall') {
  return { x, y, w, h, kind };
}

export const LEVELS = [
  {
    id: 'gallery',
    name: 'Level 1',
    title: 'The Marble Gallery',
    objective: 'Steal the Emerald Scarab, then reach the service door.',
    par: 90,
    player: { x: 70, y: 660 },
    exit: { x: 1196, y: 24, w: 60, h: 76, label: 'SERVICE DOOR' },
    tools: { smoke: 3, emp: 2 },
    // Two long partition walls with a middle gap and side gaps: three routes
    // across the room (top corridor, middle cut, bottom corridor).
    walls: [
      wall(300, 300, 250, 26, 'partition'),
      wall(730, 300, 250, 26, 'partition'),
      wall(560, 268, 160, 110, 'plinth'),
      wall(170, 110, 130, 64, 'case'),
      wall(980, 110, 130, 64, 'case'),
      wall(170, 560, 130, 64, 'case'),
      wall(980, 560, 130, 64, 'case'),
      wall(620, 84, 40, 56, 'pillar'),
      wall(620, 596, 40, 56, 'pillar'),
    ],
    // Paintings hung on the walls, for the eye and for the renderer's art.
    paintings: [
      { x: 120, y: 30, w: 90, h: 56, hue: 210 },
      { x: 1070, y: 30, w: 90, h: 56, hue: 20 },
      { x: 30, y: 330, w: 56, h: 90, hue: 150 },
      { x: 1194, y: 330, w: 56, h: 90, hue: 280 },
    ],
    guards: [
      {
        path: [[220, 210], [1060, 210], [1060, 260], [220, 260]],
        speed: 74, range: 265, arc: 1.05, wait: 0.9,
      },
      {
        path: [[220, 540], [1060, 540], [1060, 470], [220, 470]],
        speed: 66, range: 250, arc: 1.05, wait: 1.2,
      },
    ],
    cameras: [
      { x: 640, y: 14, base: Math.PI / 2, sweep: 0.85, speed: 0.55, range: 330, arc: 0.8 },
      { x: 14, y: 368, base: 0, sweep: 0.7, speed: 0.45, range: 300, arc: 0.8 },
    ],
    loot: [
      { x: 150, y: 368, kind: 'gem', value: 500, name: 'Emerald Scarab', target: true },
      { x: 640, y: 60, kind: 'painting', value: 300, name: 'Moonlit Harbor' },
      { x: 1130, y: 368, kind: 'painting', value: 300, name: 'Portrait of a Fox' },
      { x: 640, y: 660, kind: 'gem', value: 200, name: 'Loose Diamonds' },
    ],
  },
  {
    id: 'vault',
    name: 'Level 2',
    title: 'The Vault Corridor',
    objective: 'Crack the vault (hold E), then slip out the west door.',
    par: 120,
    player: { x: 70, y: 70 },
    exit: { x: 24, y: 636, w: 60, h: 76, label: 'WEST DOOR' },
    tools: { smoke: 3, emp: 2 },
    // Staggered walls force a serpentine route: left lane down, middle lane
    // up, right lane down — never a straight line through.
    walls: [
      wall(420, 0, 26, 470, 'partition'),
      wall(834, 266, 26, 470, 'partition'),
      wall(120, 300, 170, 26, 'partition'),
      wall(990, 420, 170, 26, 'partition'),
      wall(560, 560, 160, 110, 'plinth'),
      wall(200, 120, 120, 60, 'case'),
      wall(960, 120, 120, 60, 'case'),
    ],
    paintings: [
      { x: 120, y: 30, w: 90, h: 56, hue: 45 },
      { x: 1070, y: 660, w: 90, h: 56, hue: 200 },
      { x: 470, y: 30, w: 90, h: 56, hue: 320 },
    ],
    guards: [
      { path: [[100, 210], [100, 620], [360, 620], [360, 210]], speed: 78, range: 260, arc: 1.05, wait: 0.7 },
      { path: [[500, 700], [500, 380], [800, 380], [800, 700]], speed: 72, range: 255, arc: 1.05, wait: 1.0 },
      { path: [[930, 200], [930, 380], [1130, 380], [1130, 200]], speed: 84, range: 270, arc: 1.0, wait: 0.6 },
    ],
    cameras: [
      { x: 640, y: 14, base: Math.PI / 2, sweep: 0.9, speed: 0.6, range: 330, arc: 0.8 },
      { x: 446, y: 470, base: Math.PI, sweep: 0.6, speed: 0.5, range: 280, arc: 0.8 },
      { x: 834, y: 266, base: 0, sweep: 0.6, speed: 0.5, range: 280, arc: 0.8 },
    ],
    loot: [
      { x: 640, y: 130, kind: 'vault', value: 1200, name: 'The Meridian Vault', target: true, crackTime: 2.6 },
      { x: 150, y: 640, kind: 'gem', value: 500, name: 'Ruby Tear' },
      { x: 1130, y: 80, kind: 'painting', value: 300, name: 'Storm Over the Docks' },
      { x: 640, y: 470, kind: 'gem', value: 250, name: 'Sapphire Chips' },
    ],
  },
  {
    id: 'rooftop',
    name: 'Level 3',
    title: 'Rooftop Getaway',
    objective: 'Lift the Star Sapphire and reach the helipad.',
    par: 120,
    player: { x: 70, y: 660 },
    exit: { x: 1150, y: 600, w: 106, h: 106, label: 'HELIPAD', circle: true },
    tools: { smoke: 3, emp: 3 },
    // Rooftop clutter: vents and AC units are the only cover under the
    // searchlights. Wide open lanes reward timing over hiding.
    walls: [
      wall(300, 160, 150, 90, 'vent'),
      wall(830, 160, 150, 90, 'vent'),
      wall(300, 480, 150, 90, 'vent'),
      wall(830, 480, 150, 90, 'vent'),
      wall(565, 330, 150, 80, 'vent'),
      wall(120, 330, 90, 80, 'vent'),
      wall(1070, 330, 90, 80, 'vent'),
    ],
    paintings: [],
    guards: [
      { path: [[260, 120], [1020, 120], [1020, 300], [260, 300]], speed: 88, range: 280, arc: 1.0, wait: 0.6 },
      { path: [[260, 620], [1020, 620], [1020, 430], [260, 430]], speed: 80, range: 275, arc: 1.0, wait: 0.8 },
    ],
    cameras: [
      { x: 640, y: 14, base: Math.PI / 2, sweep: 1.0, speed: 0.7, range: 430, arc: 0.7 },
      { x: 14, y: 368, base: 0, sweep: 0.8, speed: 0.6, range: 420, arc: 0.7 },
      { x: 1266, y: 368, base: Math.PI, sweep: 0.8, speed: 0.6, range: 420, arc: 0.7 },
    ],
    loot: [
      { x: 640, y: 130, kind: 'gem', value: 1500, name: 'The Star Sapphire', target: true },
      { x: 150, y: 470, kind: 'gem', value: 400, name: 'Topaz Shards' },
      { x: 1130, y: 470, kind: 'painting', value: 300, name: 'Skyline in Oils' },
      { x: 640, y: 620, kind: 'gem', value: 250, name: 'Loose Pearls' },
    ],
  },
];

/** A fresh runtime copy of a level: guards/cameras/loot get live state. */
export function makeLevel(index) {
  const def = LEVELS[index];
  const level = JSON.parse(JSON.stringify(def));
  level.index = index;
  level.guards = level.guards.map((g) => ({
    ...g,
    x: g.path[0][0],
    y: g.path[0][1],
    waypoint: 1,
    waitLeft: 0,
    facing: 0,
    alert: 0,
    chaseX: 0,
    chaseY: 0,
    seenFlash: 0,
  }));
  level.cameras = level.cameras.map((c) => ({
    ...c,
    angle: c.base,
    phase: 0,
    disabled: 0,
    spotted: 0,
  }));
  level.loot = level.loot.map((l) => ({ ...l, taken: false, crack: 0 }));
  level.smoke = [];
  return level;
}
