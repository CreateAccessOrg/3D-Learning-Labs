/* ═══════════════════════════════════════════════
   MATCH SCORING
   Given the player's material and the mystery target, how close are they?

   Scored only when they press Check, never live. A number that ticks up while
   you drag turns the game into "watch the meter", and they stop looking at the
   two balls - which is the one thing the game is trying to get them to do.
═══════════════════════════════════════════════ */

export const PASS = 85;

/* colors compared in linear space, where equal steps look equally different */
const s2l = c => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const toLinear = hex => {
    const n = hex.replace('#', '');
    return [0, 2, 4].map(i => s2l(parseInt(n.slice(i, i + 2), 16) / 255));
};
const colorDistance = (a, b) => {
    const la = toLinear(a), lb = toLinear(b);
    return Math.hypot(la[0] - lb[0], la[1] - lb[1], la[2] - lb[2]);
};

const clampScore = v => Math.max(0, Math.min(100, v));

/* Each part scores 100 at an exact hit and falls to 0 at a tolerance tuned so
   "obviously off" lands near zero and "close enough to fool the eye" stays high.
   Metal is a switch, so it is all or nothing. */
const COLOR_TOL = 0.5;
const ROUGH_TOL = 42;
const WEIGHT = { color: 0.34, roughness: 0.33, metal: 0.33 };

export function scoreMatch(you, target) {
    const parts = {
        color: clampScore((1 - colorDistance(you.color, target.color) / COLOR_TOL) * 100),
        roughness: clampScore((1 - Math.abs(you.roughness - target.roughness) / ROUGH_TOL) * 100),
        metal: you.metal === target.metal ? 100 : 0,
    };
    const total = Math.round(
        parts.color * WEIGHT.color +
        parts.roughness * WEIGHT.roughness +
        parts.metal * WEIGHT.metal
    );
    return { parts, total };
}

/* One actionable sentence: the single most-wrong thing, and which way to move
   it. One fix at a time is what a beginner can act on. */
export function matchTip(you, target, parts) {
    if (parts.metal === 0) {
        return target.metal
            ? 'The mystery ball is <b>metal</b>. Flip your metal switch on.'
            : 'The mystery ball is <b>not metal</b>. Turn your metal switch off.';
    }
    const worst = Object.entries(parts).sort((a, b) => a[1] - b[1])[0][0];
    if (worst === 'roughness') {
        return you.roughness < target.roughness
            ? 'Your ball is <b>too shiny</b>. Turn roughness up to make it duller.'
            : 'Your ball is <b>too dull</b>. Turn roughness down to make it shinier.';
    }
    return 'The <b>color</b> is off. Nudge R, G and B until it matches.';
}
