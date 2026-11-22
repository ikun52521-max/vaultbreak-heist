// Vaultbreak — main: game states, the loop, movement, tools and staging.
// States: menu → playing ⇄ paused → caught → leveldone → playing … →
// victory. The loop is a fixed-step update with requestAnimationFrame;
// the renderer draws every frame, so a paused screenshot scene is stable.

import { BOARD, LEVELS, makeLevel } from './levels.js';
import { canSee } from './vision.js';
import { updateGuard } from './patrol.js';
import { nearestLoot, interactLoot, targetLootTaken, lootValue } from './loot.js';
import { updateAlarm, alarmState, ALARM_LOCKDOWN } from './alarm.js';
import { createInput, moveVector } from './input.js';
import { createAudio } from './audio.js';
import { renderScene, renderHud } from './render.js';

const WALK_SPEED = 210;
const SNEAK_SPEED = 120;
const DASH_SPEED = 560;
const DASH_TIME = 0.18;
const DASH_COOLDOWN = 1.2;
const THIEF_RADIUS = 13;
const SMOKE_DURATION = 4.5;
const SMOKE_RADIUS = 85;
const EMP_DURATION = 6;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const audio = createAudio();

const el = {
  alarmFill: document.getElementById('alarmFill'),
  alarmPct: document.getElementById('alarmPct'),
  alarmWrap: document.getElementById('alarmWrap'),
  lootValue: document.getElementById('lootValue'),
  timerLabel: document.getElementById('timerLabel'),
  smokeCount: document.getElementById('smokeCount'),
  empCount: document.getElementById('empCount'),
  levelLabel: document.getElementById('levelLabel'),
  objectiveLabel: document.getElementById('objectiveLabel'),
  muteBtn: document.getElementById('muteBtn'),
  toast: document.getElementById('toast'),
  menuOverlay: document.getElementById('menuOverlay'),
  caughtOverlay: document.getElementById('caughtOverlay'),
  caughtReason: document.getElementById('caughtReason'),
  levelOverlay: document.getElementById('levelOverlay'),
  levelDoneTitle: document.getElementById('levelDoneTitle'),
  levelDoneText: document.getElementById('levelDoneText'),
  levelDoneScore: document.getElementById('levelDoneScore'),
  winOverlay: document.getElementById('winOverlay'),
  winScore: document.getElementById('winScore'),
  winStats: document.getElementById('winStats'),
};

const game = {
  state: 'menu', // menu | playing | paused | caught | leveldone | victory
  levelIndex: 0,
  level: null,
  thief: null,
  alarm: 0,
  elapsed: 0,
  totalLoot: 0,
  totalTime: 0,
  tools: { smoke: 3, emp: 2 },
  dashLeft: 0,
  dashCooldown: 0,
  toastUntil: 0,
  prompt: '',
  time: 0,
  wasSeen: false,
  catches: 0,
};

function newThief(level) {
  return {
    x: level.player.x,
    y: level.player.y,
    facing: 0,
    sneaking: false,
    dashLeft: 0,
  };
}

function startLevel(index) {
  game.levelIndex = index;
  game.level = makeLevel(index);
  game.thief = newThief(game.level);
  game.alarm = 0;
  game.elapsed = 0;
  game.tools = { ...game.level.tools };
  game.dashLeft = 0;
  game.dashCooldown = 0;
  game.wasSeen = false;
  game.prompt = '';
  showOverlay(null);
  setState('playing');
  toast(`${game.level.name} — ${game.level.title}`);
  audio.unlock();
}

function setState(next) {
  game.state = next;
}

function showOverlay(which) {
  for (const o of [el.menuOverlay, el.caughtOverlay, el.levelOverlay, el.winOverlay]) {
    o.classList.remove('show');
  }
  if (which === 'menu') el.menuOverlay.classList.add('show');
  if (which === 'caught') el.caughtOverlay.classList.add('show');
  if (which === 'leveldone') el.levelOverlay.classList.add('show');
  if (which === 'victory') el.winOverlay.classList.add('show');
}

let toastTimer = null;
function toast(msg, ms = 2600) {
  el.toast.textContent = msg;
  el.toast.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.toast.style.display = 'none';
  }, ms);
}

/** Circle-vs-walls collision: slide along walls instead of sticking. */
function moveThief(dx, dy) {
  const t = game.thief;
  const level = game.level;
  const nx = t.x + dx;
  const ny = t.y + dy;
  const blocked = (x, y) => {
    if (x < THIEF_RADIUS || x > BOARD.w - THIEF_RADIUS) return true;
    if (y < THIEF_RADIUS || y > BOARD.h - THIEF_RADIUS) return true;
    for (const w of level.walls) {
      const cx = Math.max(w.x, Math.min(x, w.x + w.w));
      const cy = Math.max(w.y, Math.min(y, w.y + w.h));
      const ddx = x - cx;
      const ddy = y - cy;
      if (ddx * ddx + ddy * ddy < THIEF_RADIUS * THIEF_RADIUS) return true;
    }
    return false;
  };
  if (!blocked(nx, t.y)) t.x = nx;
  if (!blocked(t.x, ny)) t.y = ny;
}

function thiefInExit() {
  const e = game.level.exit;
  const t = game.thief;
  if (e.circle) {
    const cx = e.x + e.w / 2;
    const cy = e.y + e.h / 2;
    return Math.hypot(t.x - cx, t.y - cy) < e.w / 2;
  }
  return (
    t.x > e.x - 6 && t.x < e.x + e.w + 6 &&
    t.y > e.y - 6 && t.y < e.y + e.h + 6
  );
}

function useSmoke() {
  if (game.tools.smoke <= 0) {
    toast('No smoke bombs left.');
    return;
  }
  game.tools.smoke -= 1;
  game.level.smoke.push({ x: game.thief.x, y: game.thief.y, r: SMOKE_RADIUS, left: SMOKE_DURATION });
  audio.smoke();
  toast('Smoke out — the cones cannot see through it.');
}

function useEmp() {
  if (game.tools.emp <= 0) {
    toast('No EMP charges left.');
    return;
  }
  game.tools.emp -= 1;
  for (const cam of game.level.cameras) cam.disabled = EMP_DURATION;
  audio.emp();
  toast('EMP burst — cameras blind for 6 seconds.');
}

function update(dt) {
  const level = game.level;
  const thief = game.thief;

  // --- movement ---
  const vec = moveVector(input);
  thief.sneaking = input.down('ShiftLeft') || input.down('ShiftRight');
  if (game.dashCooldown > 0) game.dashCooldown -= dt;
  if (input.down('Space') && game.dashCooldown <= 0 && vec) {
    thief.dashLeft = DASH_TIME;
    game.dashCooldown = DASH_COOLDOWN;
    audio.dash();
  }
  let speed = thief.sneaking ? SNEAK_SPEED : WALK_SPEED;
  if (thief.dashLeft > 0) {
    thief.dashLeft -= dt;
    speed = DASH_SPEED;
  }
  if (vec) {
    moveThief(vec.x * speed * dt, vec.y * speed * dt);
    thief.facing = Math.atan2(vec.y, vec.x);
    input.clearClick();
  } else if (input.clickTarget) {
    const dx = input.clickTarget.x - thief.x;
    const dy = input.clickTarget.y - thief.y;
    const d = Math.hypot(dx, dy);
    if (d < 8) {
      input.clearClick();
    } else {
      const step = Math.min(d, speed * dt);
      moveThief((dx / d) * step, (dy / d) * step);
      thief.facing = Math.atan2(dy, dx);
    }
  }

  // --- tools (edge-triggered on keydown: track with a pressed set) ---
  if (pressed('Digit1') || pressed('KeyQ')) useSmoke();
  if (pressed('Digit2') || pressed('KeyF')) useEmp();

  // --- smoke clouds age out ---
  for (const s of level.smoke) s.left -= dt;
  level.smoke = level.smoke.filter((s) => s.left > 0);

  // --- cameras sweep and age out their EMP blindness ---
  for (const cam of level.cameras) {
    if (cam.disabled > 0) cam.disabled -= dt;
    cam.phase += cam.speed * dt;
    cam.angle = cam.base + Math.sin(cam.phase) * cam.sweep;
  }

  // --- who sees the thief? ---
  let guardsSeeing = 0;
  let camerasSeeing = 0;
  const seenBy = [];
  for (const guard of level.guards) {
    const res = canSee(
      guard.x, guard.y, guard.facing, guard.range, guard.arc,
      thief.x, thief.y, level.walls, level.smoke, thief.sneaking,
    );
    if (res.seen) {
      guardsSeeing++;
      seenBy.push(guard);
    }
  }
  for (const cam of level.cameras) {
    if (cam.disabled > 0) {
      cam.spotted = 0;
      continue;
    }
    const res = canSee(
      cam.x, cam.y, cam.angle, cam.range, cam.arc,
      thief.x, thief.y, level.walls, level.smoke, thief.sneaking,
    );
    cam.spotted = res.seen ? 1 : Math.max(0, cam.spotted - dt * 2);
    if (res.seen) camerasSeeing++;
  }
  const seen = guardsSeeing > 0 || camerasSeeing > 0;
  if (seen && !game.wasSeen) audio.spotted();
  game.wasSeen = seen;

  // --- alarm ---
  game.alarm = updateAlarm(game.alarm, dt, guardsSeeing, camerasSeeing, thief.sneaking);
  audio.alarmPulse(alarmState(game.alarm) === 'hot');

  // --- guards patrol / chase ---
  for (const guard of level.guards) {
    const res = canSee(
      guard.x, guard.y, guard.facing, guard.range, guard.arc,
      thief.x, thief.y, level.walls, level.smoke, thief.sneaking,
    );
    const outcome = updateGuard(guard, dt, res.seen, thief.x, thief.y);
    if (outcome === 'caught') return caught('A guard caught you in the open.');
  }
  if (game.alarm >= ALARM_LOCKDOWN) {
    return caught('The alarm hit 100% — the gallery locked down.');
  }

  // --- loot ---
  const near = nearestLoot(level, thief.x, thief.y);
  const holdingE = input.down('KeyE');
  if (near) {
    if (near.kind === 'vault') {
      game.prompt = near.crack > 0
        ? `Cracking the vault… ${Math.ceil(((near.crackTime - near.crack) / near.crackTime) * 100)}% — hold E`
        : 'Hold E to crack the vault';
      if (holdingE && Math.random() < dt * 6) audio.vaultCrack();
    } else {
      game.prompt = `Press E — ${near.name} ($${near.value})`;
    }
    const taken = interactLoot(near, dt, holdingE);
    if (taken) {
      if (taken.kind === 'vault') {
        audio.vaultOpen();
        toast(`Vault cracked — $${taken.value}!`);
      } else {
        audio.pickup();
        toast(`${taken.name} lifted — $${taken.value}.`);
      }
      if (taken.target) toast('Target secured — get to the exit!');
    }
  } else {
    game.prompt = '';
  }

  // --- exit ---
  if (targetLootTaken(level) && thiefInExit()) {
    return levelComplete();
  }

  game.elapsed += dt;
}

const pressedKeys = new Set();
/** True once per physical key press (edge trigger). */
function pressed(code) {
  if (!input.down(code)) return false;
  if (pressedKeys.has(code)) return false;
  pressedKeys.add(code);
  return true;
}
window.addEventListener('keyup', (e) => pressedKeys.delete(e.code));

function caught(reason) {
  game.catches++;
  game.state = 'caught';
  audio.stopAlarm();
  audio.caught();
  el.caughtReason.textContent = reason;
  showOverlay('caught');
}

function levelComplete() {
  const level = game.level;
  const value = lootValue(level);
  game.totalLoot += value;
  game.totalTime += game.elapsed;
  const timeBonus = Math.max(0, Math.round((level.par - game.elapsed) * 5));
  const score = value + timeBonus;
  audio.stopAlarm();
  audio.win();
  if (game.levelIndex >= LEVELS.length - 1) {
    el.winScore.innerHTML = `Total loot <b>$${game.totalLoot.toLocaleString('en-US')}</b> · time ${formatTime(game.totalTime)}`;
    el.winStats.textContent = `Rooms cleared: 3 · Times caught: ${game.catches} · Every room has a faster, quieter route — run it again.`;
    game.state = 'victory';
    showOverlay('victory');
  } else {
    el.levelDoneTitle.textContent = `${level.title} — CLEARED`;
    el.levelDoneText.textContent = `You slipped out with $${value.toLocaleString('en-US')} of loot. The next room is watching harder.`;
    el.levelDoneScore.innerHTML = `Room score <b>$${score.toLocaleString('en-US')}</b> (loot $${value} + time bonus $${timeBonus})`;
    game.state = 'leveldone';
    showOverlay('leveldone');
  }
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - game.lastNow) / 1000 || 0.016);
  game.lastNow = now;
  game.time += dt;

  if (game.state === 'playing') {
    if (pressed('KeyP')) {
      setState('paused');
      toast('Paused — press P to resume.');
    }
    update(dt);
  } else if (game.state === 'paused') {
    if (pressed('KeyP')) setState('playing');
  }
  if (input.down('KeyR') && (game.state === 'caught' || game.state === 'paused')) {
    startLevel(game.levelIndex);
  }
  if (pressed('KeyM')) {
    const muted = audio.toggleMute();
    el.muteBtn.textContent = muted ? 'Sound: OFF' : 'Sound: ON';
  }

  const level = game.level;
  if (level) {
    renderScene(ctx, {
      level,
      thief: game.thief,
      alarm: game.alarm,
      prompt: game.state === 'playing' ? game.prompt : '',
      t: game.time,
      targetDone: targetLootTaken(level),
    });
    renderHud(el, {
      level,
      alarm: game.alarm,
      loot: game.totalLoot + lootValue(level),
      elapsed: game.totalTime + game.elapsed,
      tools: game.tools,
    });
  }
}

// --- buttons ---
document.getElementById('startBtn').addEventListener('click', () => {
  game.totalLoot = 0;
  game.totalTime = 0;
  game.catches = 0;
  startLevel(0);
});
document.getElementById('retryBtn').addEventListener('click', () => startLevel(game.levelIndex));
document.getElementById('nextBtn').addEventListener('click', () => startLevel(game.levelIndex + 1));
document.getElementById('againBtn').addEventListener('click', () => {
  game.totalLoot = 0;
  game.totalTime = 0;
  game.catches = 0;
  startLevel(0);
});
el.muteBtn.addEventListener('click', () => {
  const muted = audio.toggleMute();
  el.muteBtn.textContent = muted ? 'Sound: OFF' : 'Sound: ON';
});
window.addEventListener('keydown', (e) => {
  audio.unlock();
  if (e.code === 'Enter' && game.state === 'menu') {
    document.getElementById('startBtn').click();
  }
  if (e.code === 'Enter' && game.state === 'leveldone') {
    document.getElementById('nextBtn').click();
  }
  if (e.code === 'Enter' && game.state === 'victory') {
    document.getElementById('againBtn').click();
  }
});
window.addEventListener('click', () => audio.unlock());

// --- screenshot staging: ?scene=cover|alarm|win freezes a real game state ---
function stageScene(name) {
  if (name === 'cover') {
    startLevel(0);
    const g = game.level.guards;
    g[0].x = 420; g[0].y = 150; g[0].facing = Math.PI / 2; g[0].waitLeft = 2;
    g[1].x = 860; g[1].y = 590; g[1].facing = -Math.PI / 2; g[1].waitLeft = 2;
    game.level.cameras[0].angle = Math.PI / 2 + 0.4;
    game.level.cameras[1].angle = 0.3;
    game.thief.x = 640; game.thief.y = 440; game.thief.facing = -Math.PI / 2;
    game.alarm = 22;
    setState('paused');
  } else if (name === 'alarm') {
    startLevel(1);
    const g = game.level.guards;
    g[1].x = 700; g[1].y = 430; g[1].facing = Math.atan2(500 - 430, 640 - 700);
    g[1].alert = 3; g[1].chaseX = 640; g[1].chaseY = 500;
    g[0].x = 220; g[0].y = 250; g[0].facing = Math.PI / 2; g[0].waitLeft = 2;
    g[2].x = 1060; g[2].y = 200; g[2].facing = Math.PI; g[2].waitLeft = 2;
    game.level.cameras[0].angle = Math.PI / 2 - 0.3;
    game.thief.x = 640; game.thief.y = 500; game.thief.facing = -Math.PI / 2;
    game.level.loot[0].crack = 1.4;
    game.alarm = 78;
    setState('paused');
  } else if (name === 'win') {
    game.totalLoot = 2750;
    game.totalTime = 312;
    game.catches = 1;
    startLevel(2);
    el.winScore.innerHTML = 'Total loot <b>$2,750</b> · time 5:12';
    el.winStats.textContent = 'Rooms cleared: 3 · Times caught: 1 · Every room has a faster, quieter route — run it again.';
    setState('victory');
    showOverlay('victory');
  }
}

// --- boot ---
game.level = makeLevel(0);
game.thief = newThief(game.level);
game.tools = { ...game.level.tools };
const params = new URLSearchParams(window.location.search);
const scene = params.get('scene');
if (scene) {
  stageScene(scene);
} else {
  showOverlay('menu');
}
game.lastNow = performance.now();
requestAnimationFrame(frame);
