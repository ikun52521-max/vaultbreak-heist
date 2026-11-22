// Vaultbreak — input: keyboard and mouse, with no dependencies.
// Keys are tracked by their `code` so layout does not matter. A click on
// the board sets a walk target; any movement key cancels it.

export function createInput(canvas) {
  const keys = new Set();
  let clickTarget = null;
  let clickAt = 0;

  const onKeyDown = (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    keys.add(e.code);
    if (isMoveKey(e.code)) clickTarget = null;
  };
  const onKeyUp = (e) => keys.delete(e.code);
  const onBlur = () => keys.clear();

  const onClick = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    clickTarget = { x, y };
    clickAt = performance.now();
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('click', onClick);

  return {
    keys,
    /** True while this key is held down. */
    down(code) {
      return keys.has(code);
    },
    /** True when any of these keys is held down. */
    any(codes) {
      return codes.some((c) => keys.has(c));
    },
    /** The current click-to-walk target, or null. */
    get clickTarget() {
      return clickTarget;
    },
    get clickAt() {
      return clickAt;
    },
    clearClick() {
      clickTarget = null;
    },
  };
}

function isMoveKey(code) {
  return (
    code === 'KeyW' || code === 'KeyA' || code === 'KeyS' || code === 'KeyD' ||
    code === 'ArrowUp' || code === 'ArrowDown' || code === 'ArrowLeft' || code === 'ArrowRight'
  );
}

/** The normalized movement vector from held keys, or null when idle. */
export function moveVector(input) {
  let x = 0;
  let y = 0;
  if (input.down('KeyA') || input.down('ArrowLeft')) x -= 1;
  if (input.down('KeyD') || input.down('ArrowRight')) x += 1;
  if (input.down('KeyW') || input.down('ArrowUp')) y -= 1;
  if (input.down('KeyS') || input.down('ArrowDown')) y += 1;
  if (x === 0 && y === 0) return null;
  const len = Math.hypot(x, y);
  return { x: x / len, y: y / len };
}
