// Vaultbreak — render: everything the player sees, drawn on one canvas.
// The look is deliberate, not a tile set: a dark gallery with a red carpet
// runner, gold-trimmed display cases, warm loot glow against cold blue
// danger cones, so safe cover, danger and loot read at a glance.

import { BOARD } from './levels.js';

const TAU = Math.PI * 2;

function conePath(ctx, x, y, facing, range, arc) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, facing - arc / 2, facing + arc / 2);
  ctx.closePath();
}

function drawCone(ctx, x, y, facing, range, arc, fill, edge) {
  conePath(ctx, x, y, facing, range, arc);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFloor(ctx, level, t) {
  // Dark slate tiles with a faint checker.
  ctx.fillStyle = '#191c26';
  ctx.fillRect(0, 0, BOARD.w, BOARD.h);
  const tile = 64;
  for (let y = 0; y < BOARD.h; y += tile) {
    for (let x = 0; x < BOARD.w; x += tile) {
      if (((x + y) / tile) % 2 === 0) {
        ctx.fillStyle = '#1d212e';
        ctx.fillRect(x, y, tile, tile);
      }
    }
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= BOARD.w; x += tile) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, BOARD.h); ctx.stroke();
  }
  for (let y = 0; y <= BOARD.h; y += tile) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(BOARD.w, y); ctx.stroke();
  }
  if (level.id === 'gallery') {
    // Red carpet runner down the middle of the gallery.
    ctx.fillStyle = '#5e1f24';
    ctx.fillRect(600, 0, 80, BOARD.h);
    ctx.fillStyle = '#7a2a30';
    ctx.fillRect(606, 0, 68, BOARD.h);
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 2;
    ctx.strokeRect(600, 0, 80, BOARD.h);
  }
  if (level.id === 'rooftop') {
    // Roof membrane seams and a faded helipad ring near the exit.
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 2;
    for (let x = 160; x < BOARD.w; x += 320) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, BOARD.h); ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(1203, 653, 78, 0, TAU);
    ctx.strokeStyle = 'rgba(120,220,130,0.25)';
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  // Vignette: darker corners, focus in the middle.
  const grad = ctx.createRadialGradient(640, 368, 240, 640, 368, 900);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, BOARD.w, BOARD.h);
  void t;
}

function drawWalls(ctx, level) {
  for (const w of level.walls) {
    const palette = {
      wall: ['#2c3247', '#3d4560', '#565f7d'],
      partition: ['#2a2f42', '#39405a', '#4d5878'],
      plinth: ['#3a2f22', '#54432e', '#7a6438'],
      case: ['#232a3d', '#2f3a55', '#c9a227'],
      pillar: ['#2e3448', '#414a66', '#5a6584'],
      vent: ['#272d3a', '#333b4c', '#4a5468'],
    }[w.kind] || ['#2c3247', '#3d4560', '#565f7d'];
    ctx.fillStyle = palette[0];
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = palette[1];
    ctx.fillRect(w.x, w.y, w.w, 6);
    ctx.fillRect(w.x, w.y, 6, w.h);
    ctx.strokeStyle = palette[2];
    ctx.lineWidth = 1.5;
    ctx.strokeRect(w.x + 0.75, w.y + 0.75, w.w - 1.5, w.h - 1.5);
    if (w.kind === 'case' || w.kind === 'plinth') {
      // Gold trim says "display": something valuable lives here.
      ctx.strokeStyle = '#c9a227';
      ctx.lineWidth = 2;
      ctx.strokeRect(w.x + 4, w.y + 4, w.w - 8, w.h - 8);
    }
    if (w.kind === 'vent') {
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 2;
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(w.x + 10, w.y + (w.h / 4) * i);
        ctx.lineTo(w.x + w.w - 10, w.y + (w.h / 4) * i);
        ctx.stroke();
      }
    }
  }
  // Board edge: a low parapet line so the room reads as enclosed.
  ctx.strokeStyle = '#4a5468';
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, BOARD.w - 3, BOARD.h - 3);
}

function drawPaintings(ctx, level) {
  for (const p of level.paintings) {
    ctx.fillStyle = '#6b5322';
    ctx.fillRect(p.x - 4, p.y - 4, p.w + 8, p.h + 8);
    ctx.fillStyle = `hsl(${p.hue}, 45%, 32%)`;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = `hsl(${p.hue}, 55%, 55%)`;
    ctx.beginPath();
    ctx.arc(p.x + p.w * 0.3, p.y + p.h * 0.35, p.w * 0.18, 0, TAU);
    ctx.fill();
    ctx.fillStyle = `hsl(${(p.hue + 60) % 360}, 50%, 45%)`;
    ctx.fillRect(p.x + p.w * 0.55, p.y + p.h * 0.55, p.w * 0.35, p.h * 0.3);
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(p.x, p.y, p.w, p.h);
  }
}

function drawExit(ctx, level, targetDone, t) {
  const e = level.exit;
  const pulse = 0.55 + 0.25 * Math.sin(t * 3);
  if (e.circle) {
    ctx.beginPath();
    ctx.arc(e.x + e.w / 2, e.y + e.h / 2, e.w / 2 - 4, 0, TAU);
    ctx.fillStyle = targetDone ? `rgba(80,220,120,${pulse})` : 'rgba(90,100,110,0.35)';
    ctx.fill();
    ctx.strokeStyle = targetDone ? '#7dff9e' : '#8b93a7';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#0b0d12';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('H', e.x + e.w / 2, e.y + e.h / 2);
  } else {
    ctx.fillStyle = targetDone ? `rgba(80,220,120,${pulse})` : 'rgba(90,100,110,0.35)';
    ctx.fillRect(e.x, e.y, e.w, e.h);
    ctx.strokeStyle = targetDone ? '#7dff9e' : '#8b93a7';
    ctx.lineWidth = 3;
    ctx.strokeRect(e.x, e.y, e.w, e.h);
    ctx.fillStyle = targetDone ? '#0b0d12' : '#cfd6e4';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.translate(e.x + e.w / 2, e.y + e.h / 2);
    ctx.fillText('EXIT', 0, 0);
    ctx.restore();
  }
  ctx.fillStyle = targetDone ? '#7dff9e' : '#8b93a7';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(e.label, e.x + e.w / 2, e.y + e.h + 16);
}

function drawLoot(ctx, level, t) {
  for (const item of level.loot) {
    if (item.taken) continue;
    const glow = 0.5 + 0.3 * Math.sin(t * 4 + item.x);
    if (item.kind === 'gem') {
      const grad = ctx.createRadialGradient(item.x, item.y, 2, item.x, item.y, 34);
      grad.addColorStop(0, `rgba(242,193,78,${glow})`);
      grad.addColorStop(1, 'rgba(242,193,78,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(item.x, item.y, 34, 0, TAU);
      ctx.fill();
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#f2c14e';
      ctx.fillRect(-9, -9, 18, 18);
      ctx.fillStyle = '#ffe9a8';
      ctx.fillRect(-5, -5, 10, 10);
      ctx.restore();
    } else if (item.kind === 'painting') {
      ctx.fillStyle = '#6b5322';
      ctx.fillRect(item.x - 22, item.y - 16, 44, 32);
      ctx.fillStyle = '#3f6fb5';
      ctx.fillRect(item.x - 18, item.y - 12, 36, 24);
      ctx.fillStyle = '#e8c96a';
      ctx.beginPath();
      ctx.arc(item.x - 6, item.y - 4, 6, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = `rgba(242,193,78,${glow})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(item.x - 22, item.y - 16, 44, 32);
    } else if (item.kind === 'vault') {
      // The vault: a big steel safe with a cracking progress ring.
      ctx.fillStyle = '#3a4152';
      roundRect(ctx, item.x - 34, item.y - 26, 68, 52, 6);
      ctx.fill();
      ctx.strokeStyle = '#c9a227';
      ctx.lineWidth = 3;
      roundRect(ctx, item.x - 34, item.y - 26, 68, 52, 6);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(item.x, item.y, 13, 0, TAU);
      ctx.fillStyle = '#232833';
      ctx.fill();
      ctx.strokeStyle = '#8b93a7';
      ctx.lineWidth = 2;
      ctx.stroke();
      if (item.crack > 0) {
        ctx.beginPath();
        ctx.arc(item.x, item.y, 22, -Math.PI / 2, -Math.PI / 2 + TAU * (item.crack / item.crackTime));
        ctx.strokeStyle = '#f2c14e';
        ctx.lineWidth = 4;
        ctx.stroke();
      }
      ctx.fillStyle = `rgba(242,193,78,${glow})`;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('VAULT', item.x, item.y + 40);
    }
    if (item.target) {
      ctx.fillStyle = '#f2c14e';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('★ ' + item.name.toUpperCase(), item.x, item.y - 30);
    }
  }
}

function drawGuard(ctx, guard, t) {
  const alerted = guard.alert > 0;
  const coneFill = alerted ? 'rgba(224,60,40,0.30)' : 'rgba(224,80,60,0.16)';
  const coneEdge = alerted ? 'rgba(255,90,70,0.65)' : 'rgba(224,80,60,0.35)';
  drawCone(ctx, guard.x, guard.y, guard.facing, guard.range, guard.arc, coneFill, coneEdge);
  // Body: dark uniform, pale face, direction tick.
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 15, 0, TAU);
  ctx.fillStyle = '#2b3248';
  ctx.fill();
  ctx.strokeStyle = alerted ? '#ff5a46' : '#7d8aa8';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 7, 0, TAU);
  ctx.fillStyle = '#d9c9a8';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(guard.x + Math.cos(guard.facing) * 22, guard.y + Math.sin(guard.facing) * 22);
  ctx.strokeStyle = '#e8e4d8';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (alerted) {
    const bob = Math.sin(t * 10) * 2;
    ctx.fillStyle = '#ff5a46';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', guard.x, guard.y - 24 + bob);
  }
}

function drawCamera(ctx, cam, t) {
  const disabled = cam.disabled > 0;
  const spotted = cam.spotted > 0.4;
  const facing = cam.angle;
  if (!disabled) {
    const fill = spotted ? 'rgba(255,200,60,0.30)' : 'rgba(255,200,60,0.15)';
    const edge = spotted ? 'rgba(255,200,60,0.7)' : 'rgba(255,200,60,0.35)';
    drawCone(ctx, cam.x, cam.y, facing, cam.range, cam.arc, fill, edge);
  }
  // Wall mount: a small dark box with a lens that follows the sweep.
  ctx.save();
  ctx.translate(cam.x, cam.y);
  ctx.rotate(facing);
  ctx.fillStyle = disabled ? '#3a4152' : '#232833';
  ctx.fillRect(-8, -6, 16, 12);
  ctx.beginPath();
  ctx.arc(9, 0, 5, 0, TAU);
  ctx.fillStyle = disabled ? '#555f75' : spotted ? '#ff5040' : '#ffd23e';
  ctx.fill();
  ctx.restore();
  if (disabled) {
    ctx.fillStyle = '#8b93a7';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('OFF', cam.x, cam.y - 16);
  }
  void t;
}

function drawSmoke(ctx, smoke) {
  for (const s of smoke) {
    const grad = ctx.createRadialGradient(s.x, s.y, 4, s.x, s.y, s.r);
    grad.addColorStop(0, 'rgba(200,205,215,0.55)');
    grad.addColorStop(1, 'rgba(200,205,215,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, TAU);
    ctx.fill();
  }
}

function drawThief(ctx, thief, t) {
  // Shadow, then the hooded figure: teal cloak, pale face, gold trim.
  ctx.beginPath();
  ctx.ellipse(thief.x, thief.y + 12, 14, 6, 0, 0, TAU);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fill();
  ctx.save();
  ctx.translate(thief.x, thief.y);
  ctx.rotate(thief.facing);
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-10, -11);
  ctx.lineTo(-6, 0);
  ctx.lineTo(-10, 11);
  ctx.closePath();
  ctx.fillStyle = '#1f8a7a';
  ctx.fill();
  ctx.strokeStyle = '#f2c14e';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, 7, 0, TAU);
  ctx.fillStyle = '#e8dcc0';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, 10, 0, TAU);
  ctx.strokeStyle = '#1f8a7a';
  ctx.lineWidth = 3;
  ctx.stroke();
  if (thief.sneaking) {
    ctx.fillStyle = '#9fb3d1';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SNEAK', thief.x, thief.y - 20);
  }
  if (thief.dashLeft > 0) {
    ctx.beginPath();
    ctx.arc(thief.x, thief.y, 18 + Math.sin(t * 20) * 2, 0, TAU);
    ctx.strokeStyle = 'rgba(120,220,255,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawAlarmVignette(ctx, alarm) {
  if (alarm < 35) return;
  const a = Math.min(0.5, (alarm - 35) / 130);
  const grad = ctx.createRadialGradient(640, 368, 300, 640, 368, 720);
  grad.addColorStop(0, 'rgba(212,40,30,0)');
  grad.addColorStop(1, `rgba(212,40,30,${a})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, BOARD.w, BOARD.h);
}

function drawPrompt(ctx, text, x, y) {
  if (!text) return;
  ctx.font = 'bold 14px sans-serif';
  const w = ctx.measureText(text).width + 20;
  ctx.fillStyle = 'rgba(10,12,18,0.85)';
  roundRect(ctx, x - w / 2, y - 32, w, 26, 6);
  ctx.fill();
  ctx.strokeStyle = '#f2c14e';
  ctx.lineWidth = 1.5;
  roundRect(ctx, x - w / 2, y - 32, w, 26, 6);
  ctx.stroke();
  ctx.fillStyle = '#ffe9a8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y - 18);
}

/** Draw the whole scene for one frame. `state` carries level, thief, alarm, prompt and time. */
export function renderScene(ctx, state) {
  const { level, thief, alarm, prompt, t } = state;
  drawFloor(ctx, level, t);
  drawExit(ctx, level, state.targetDone, t);
  drawPaintings(ctx, level);
  drawWalls(ctx, level);
  drawLoot(ctx, level, t);
  for (const cam of level.cameras) drawCamera(ctx, cam, t);
  for (const guard of level.guards) drawGuard(ctx, guard, t);
  drawSmoke(ctx, level.smoke);
  drawThief(ctx, thief, t);
  drawAlarmVignette(ctx, alarm);
  drawPrompt(ctx, prompt, thief.x, thief.y - 8);
}

/** Update the DOM HUD: alarm bar, loot, timer, tool counts, level label. */
export function renderHud(el, state) {
  const { level, alarm, loot, elapsed, tools } = state;
  el.alarmFill.style.width = `${alarm}%`;
  el.alarmPct.textContent = `${Math.round(alarm)}%`;
  el.alarmWrap.classList.toggle('hot', alarm >= 70);
  el.lootValue.textContent = `$${loot.toLocaleString('en-US')}`;
  const mins = Math.floor(elapsed / 60);
  const secs = Math.floor(elapsed % 60);
  el.timerLabel.textContent = `${mins}:${String(secs).padStart(2, '0')}`;
  el.smokeCount.textContent = String(tools.smoke);
  el.empCount.textContent = String(tools.emp);
  el.levelLabel.innerHTML = `<b>${level.name}</b> · ${level.title}`;
  el.objectiveLabel.textContent = level.objective;
}
