// Vaultbreak — guard patrols and chases.
// A guard walks its waypoint loop, pauses at each corner to look around,
// and chases the thief for a few seconds after spotting them. A guard that
// loses the thief returns to its route instead of camping the last spot.

const CHASE_SPEED_MULT = 1.55;
const CHASE_MEMORY = 3.2;
const CATCH_RADIUS = 26;

/** Move a point toward a target by at most `step`, returning the new point. */
function stepToward(x, y, tx, ty, step) {
  const dx = tx - x;
  const dy = ty - y;
  const d = Math.hypot(dx, dy);
  if (d <= step || d === 0) return { x: tx, y: ty, arrived: true, angle: Math.atan2(dy, dx) };
  return { x: x + (dx / d) * step, y: y + (dy / d) * step, arrived: false, angle: Math.atan2(dy, dx) };
}

/**
 * Advance one guard by dt seconds. `seen` says whether the guard can see
 * the thief right now, and (tx,ty) is the thief's position.
 * Returns 'caught' when the guard reaches the thief, else null.
 */
export function updateGuard(guard, dt, seen, tx, ty) {
  if (seen) {
    guard.alert = CHASE_MEMORY;
    guard.chaseX = tx;
    guard.chaseY = ty;
    guard.seenFlash = 0.5;
  } else if (guard.alert > 0) {
    guard.alert -= dt;
  }
  if (guard.seenFlash > 0) guard.seenFlash -= dt;

  if (guard.alert > 0) {
    // Chase: run at the thief's last seen spot, re-aiming while visible.
    const speed = guard.speed * CHASE_SPEED_MULT;
    const res = stepToward(guard.x, guard.y, guard.chaseX, guard.chaseY, speed * dt);
    guard.x = res.x;
    guard.y = res.y;
    guard.facing = res.angle;
    const d = Math.hypot(tx - guard.x, ty - guard.y);
    if (d < CATCH_RADIUS) return 'caught';
    if (res.arrived && !seen) guard.alert = Math.min(guard.alert, 0.6);
    return null;
  }

  // Patrol: walk the waypoint loop, pausing at each corner to scan.
  if (guard.waitLeft > 0) {
    guard.waitLeft -= dt;
    // Slowly scan while waiting: sweep the facing back and forth.
    guard.facing += Math.sin(performance.now() / 700 + guard.x) * 0.002;
    return null;
  }
  const target = guard.path[guard.waypoint];
  const res = stepToward(guard.x, guard.y, target[0], target[1], guard.speed * dt);
  guard.x = res.x;
  guard.y = res.y;
  guard.facing = res.angle;
  if (res.arrived) {
    guard.waypoint = (guard.waypoint + 1) % guard.path.length;
    guard.waitLeft = guard.wait || 0;
  }
  return null;
}

/** A guard's cone is dangerous only while it is patrolling or chasing. */
export function guardCone(guard) {
  return { x: guard.x, y: guard.y, facing: guard.facing, range: guard.range, arc: guard.arc };
}
