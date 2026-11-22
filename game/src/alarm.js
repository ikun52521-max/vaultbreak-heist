// Vaultbreak — the alarm meter.
// Being seen fills the meter; hiding drains it. Guards fill it faster than
// cameras, and sneaking slows the fill. At 100 the night is over — the
// gallery locks down and the run ends. The meter is the game's tension:
// it forgives a brush with a cone and punishes standing in one.

export const ALARM_MAX = 100;
export const ALARM_LOCKDOWN = 100;
export const ALARM_WARNING = 70;

const GUARD_RATE = 30; // per second while a guard sees the thief
const CAMERA_RATE = 20; // per second while a camera sees the thief
const SNEAK_MULT = 0.5; // sneaking halves how fast the alarm fills
const DECAY_RATE = 9; // per second while nobody sees the thief

/**
 * Advance the alarm by dt. `watchers` is the count of guards and cameras
 * currently seeing the thief, split by kind. Returns the new alarm value.
 */
export function updateAlarm(alarm, dt, guardsSeeing, camerasSeeing, sneaking) {
  let next = alarm;
  if (guardsSeeing > 0 || camerasSeeing > 0) {
    let rate = guardsSeeing * GUARD_RATE + camerasSeeing * CAMERA_RATE;
    if (sneaking) rate *= SNEAK_MULT;
    next += rate * dt;
  } else {
    next -= DECAY_RATE * dt;
  }
  if (next < 0) next = 0;
  if (next > ALARM_MAX) next = ALARM_MAX;
  return next;
}

/** How the alarm reads: 'calm', 'warm', 'hot' or 'lockdown'. */
export function alarmState(alarm) {
  if (alarm >= ALARM_LOCKDOWN) return 'lockdown';
  if (alarm >= ALARM_WARNING) return 'hot';
  if (alarm >= 35) return 'warm';
  return 'calm';
}
