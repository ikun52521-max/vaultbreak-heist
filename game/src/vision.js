// Vaultbreak — vision: line of sight and vision-cone checks.
// Walls block sight; smoke clouds block sight; sneaking shortens the range
// at which a watcher can pick the thief out.

/** True when segment (x1,y1)-(x2,y2) touches rectangle r. */
export function segmentHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tmin = 0;
  let tmax = 1;
  // Slab test on x then y.
  for (let axis = 0; axis < 2; axis++) {
    const d = axis === 0 ? dx : dy;
    const o = axis === 0 ? x1 : y1;
    const lo = axis === 0 ? r.x : r.y;
    const hi = axis === 0 ? r.x + r.w : r.y + r.h;
    if (Math.abs(d) < 1e-9) {
      if (o < lo || o > hi) return false;
    } else {
      let t1 = (lo - o) / d;
      let t2 = (hi - o) / d;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return false;
    }
  }
  return true;
}

/** True when the watcher at (ex,ey) has an unobstructed line to (tx,ty). */
export function hasLineOfSight(ex, ey, tx, ty, walls) {
  for (const w of walls) {
    if (segmentHitsRect(ex, ey, tx, ty, w)) return false;
  }
  return true;
}

/** Smallest absolute difference between two angles, in radians. */
export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

function insideSmoke(x, y, smoke) {
  for (const s of smoke) {
    const dx = x - s.x;
    const dy = y - s.y;
    if (dx * dx + dy * dy < s.r * s.r) return true;
  }
  return false;
}

function smokeBlocks(ex, ey, tx, ty, smoke) {
  // A smoke cloud between watcher and thief hides the thief; a watcher
  // standing inside smoke cannot see out of it either.
  if (insideSmoke(ex, ey, smoke)) return true;
  for (const s of smoke) {
    // Segment-circle test: does the sight line pass through the cloud?
    const dx = tx - ex;
    const dy = ty - ey;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return false;
    let t = ((s.x - ex) * dx + (s.y - ey) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const cx = ex + t * dx;
    const cy = ey + t * dy;
    const ddx = s.x - cx;
    const ddy = s.y - cy;
    if (ddx * ddx + ddy * ddy < s.r * s.r * 0.55) return true;
  }
  return false;
}

/**
 * Can watcher (ex,ey,facing,range,arc) see the thief at (tx,ty)?
 * Sneaking halves the effective range. Returns {seen, dist} where seen is
 * false when the thief is out of range, outside the cone, behind a wall or
 * hidden by smoke.
 */
export function canSee(ex, ey, facing, range, arc, tx, ty, walls, smoke, sneaking) {
  const dx = tx - ex;
  const dy = ty - ey;
  const dist = Math.hypot(dx, dy);
  const effRange = sneaking ? range * 0.62 : range;
  if (dist > effRange) return { seen: false, dist };
  if (dist > 12 && angleDiff(Math.atan2(dy, dx), facing) > arc / 2) return { seen: false, dist };
  if (insideSmoke(tx, ty, smoke)) return { seen: false, dist };
  if (smokeBlocks(ex, ey, tx, ty, smoke)) return { seen: false, dist };
  if (!hasLineOfSight(ex, ey, tx, ty, walls)) return { seen: false, dist };
  return { seen: true, dist };
}
