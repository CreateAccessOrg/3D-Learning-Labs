/* ═══════════════════════════════════════════════
   DIRECT MANIPULATION
   Drag the ball to spin around it. One gesture, low concept, works with mouse,
   touch and pen through Pointer Events. Pointer capture keeps a fast drag alive
   even when it leaves the element.
═══════════════════════════════════════════════ */

export function dragRotate(el, onDelta, { speed = 0.45 } = {}) {
    let active = false, id = null, lastX = 0, lastY = 0;
    el.style.touchAction = 'none';

    const down = e => {
        active = true; id = e.pointerId;
        lastX = e.clientX; lastY = e.clientY;
        el.setPointerCapture?.(id);
        el.classList.add('grabbing');
    };
    const move = e => {
        if (!active || e.pointerId !== id) return;
        onDelta((e.clientX - lastX) * speed, (e.clientY - lastY) * speed);
        lastX = e.clientX; lastY = e.clientY;
    };
    const end = e => {
        if (e.pointerId !== id) return;
        active = false;
        el.classList.remove('grabbing');
        try { el.releasePointerCapture(id); } catch { /* already released */ }
    };

    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
