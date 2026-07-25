/* ═══════════════════════════════════════════════
   MATERIAL DATA
   The named recipes for the preset buttons, and the target generator for the
   match game. One place, so the game and the presets never drift apart.

   Metal colors are measured reflectances converted to sRGB - which is why gold
   is a pale straw color, not the deep yellow people reach for. Values are 0-100
   for roughness and 0/1 for metal, matching the controls directly.
═══════════════════════════════════════════════ */

export const PRESETS = {
    plastic: { label: 'Plastic', color: '#ff9022', roughness: 30, metal: 0 },
    rubber: { label: 'Rubber', color: '#22252b', roughness: 95, metal: 0 },
    paint: { label: 'Wet paint', color: '#c0453a', roughness: 8, metal: 0 },
    gold: { label: 'Gold', color: '#ffdb93', roughness: 18, metal: 1 },
    copper: { label: 'Copper', color: '#fad1c2', roughness: 26, metal: 1 },
    iron: { label: 'Iron', color: '#c5c7c8', roughness: 45, metal: 1 },
};

/* HSL to hex, so target colors are always vivid and pleasant rather than the
   muddy browns a raw random RGB throws up most of the time. The player can still
   hit any of them exactly with the R/G/B sliders, so every target is winnable. */
function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
        const c = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return Math.round(255 * c).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

const rand = (lo, hi) => lo + Math.random() * (hi - lo);

/* A fresh mystery material. Metal is 60/40 toward non-metal, because a run of
   all-metal targets gets samey. Roughness snaps to fives so it is reachable
   without pixel-hunting the slider. */
export function randomTarget() {
    const metal = Math.random() < 0.4 ? 1 : 0;
    return {
        color: hslToHex(Math.floor(rand(0, 360)), rand(55, 90), rand(45, 64)),
        roughness: Math.round(rand(metal ? 12 : 15, metal ? 70 : 92) / 5) * 5,
        metal,
    };
}
