// Vaultbreak — loot: what the thief can lift, and vault cracking.
// Plain loot is grabbed instantly with E. A vault needs the thief to hold
// E beside it for its crackTime while staying out of sight — the alarm
// keeps rising while they work, so cracking is the tense part of the job.

export const GRAB_RADIUS = 46;
export const VAULT_RADIUS = 70;

/** The nearest loot the thief can interact with right now, or null. */
export function nearestLoot(level, px, py) {
  let best = null;
  let bestD = Infinity;
  for (const item of level.loot) {
    if (item.taken) continue;
    const radius = item.kind === 'vault' ? VAULT_RADIUS : GRAB_RADIUS;
    const d = Math.hypot(item.x - px, item.y - py);
    if (d < radius && d < bestD) {
      best = item;
      bestD = d;
    }
  }
  return best;
}

/**
 * Advance a held-E interaction by dt. Returns the item when it is taken
 * (instantly for plain loot, after crackTime for a vault), else null.
 * `holding` is whether E is down this frame.
 */
export function interactLoot(item, dt, holding) {
  if (!item || item.taken) return null;
  if (item.kind === 'vault') {
    if (!holding) {
      item.crack = 0;
      return null;
    }
    item.crack += dt;
    if (item.crack >= item.crackTime) {
      item.taken = true;
      item.crack = 0;
      return item;
    }
    return null;
  }
  // Plain loot is lifted only while E is held, as the prompt says.
  if (!holding) return null;
  item.taken = true;
  return item;
}

/** True when every target loot of the level has been taken. */
export function targetLootTaken(level) {
  return level.loot.filter((l) => l.target).every((l) => l.taken);
}

/** Total value of the loot taken so far in this level. */
export function lootValue(level) {
  return level.loot.filter((l) => l.taken).reduce((n, l) => n + l.value, 0);
}
