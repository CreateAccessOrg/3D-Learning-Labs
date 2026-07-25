/* ═══════════════════════════════════════════════
   CONFIG
   Static constants and lesson-wide settings.
═══════════════════════════════════════════════ */
import { V3 } from './utils.js';

/* total beats in the lesson (beats 0-6). Beat 0 is the intro and beat 6 is the
   celebration, so the numbered steps a student sees run 1-5. */
export const TOTAL_BEATS = 7;
export const NUMBERED_STEPS = TOTAL_BEATS - 2;

/* the subject sits here; every camera preset looks at it */
export const SUBJECT_Y = 1.25;
export const SUBJECT_R = 1.15;

/* how far apart the target and the student's sphere sit in the match beat */
export const MATCH_SPREAD = 1.55;

/* camera presets */
/* Every preset looks slightly above the sphere's center, which lifts the subject
   into the clear band of screen between the caption panel and the control dock. */
export const CAMS = {
    /* three-quarter hero framing - shows a lit side, a shaded side, and the
       terminator between them, which is where roughness reads most clearly */
    hero: { pos: V3(2.4, 2.6, 5.0), look: V3(0, SUBJECT_Y + 0.2, 0) },
    /* pushed in for the roughness beat so the highlight fills more of the frame */
    close: { pos: V3(1.7, 2.1, 3.6), look: V3(0, SUBJECT_Y + 0.2, 0) },
    /* pulled back and squared up so both spheres read at the same angle */
    match: { pos: V3(0, 2.4, 7.0), look: V3(0, SUBJECT_Y + 0.3, 0) },
};

/* ── material recipes ──
   Chosen to cover the 2x2 a beginner needs: rough/smooth crossed with
   metal/not-metal. Values are 0-100 to match the slider inputs directly.

   No clear coat: a second specular lobe is a look-dev concern, not a first-hour
   one, and it muddies the roughness lesson. Emissive is unlocked in free play
   instead - "this surface makes its own light" is a distinction beginners can
   see at a glance. */
export const MATERIAL_PRESETS = {
    clay: { label: 'Clay', color: '#c66f48', roughness: 82, metalness: 0 },
    plastic: { label: 'Plastic', color: '#ff9022', roughness: 34, metalness: 0 },
    rubber: { label: 'Rubber', color: '#22252b', roughness: 94, metalness: 0 },
    chrome: { label: 'Chrome', color: '#d8e0e8', roughness: 6, metalness: 100 },
    gold: { label: 'Gold', color: '#d6a526', roughness: 22, metalness: 100 },
    steel: { label: 'Brushed steel', color: '#a8adb4', roughness: 58, metalness: 100 },
};

/* ── the swatches offered on the color step ──
   The palette is the student's entire color vocabulary, so it has to contain
   every color the match challenge can ask for. Miss one and that target becomes
   unpassable no matter how well the roughness and metalness are read: a perfect
   answer would still lose the whole color weighting.

   Row 1 is free-choice hues for the color step. Row 2 is exactly the six recipe
   colors, so every reference in MATCH_POOL is reachable on the nose. Keep the
   two in sync when either changes. */
export const COLOR_SWATCHES = [
    '#ff9022', '#c0453a', '#ffda22', '#00aa00', '#3a6fa8', '#8b5cf6',
    '#c66f48', '#d6a526', '#a8adb4', '#d8e0e8', '#22252b', '#f2f0eb',
];

/* recipes the match challenge can hand out. Clay and plastic are left out -
   they are what the student has been tuning all lesson, so they are no test. */
export const MATCH_POOL = ['gold', 'rubber', 'chrome', 'steel'];

/* a match at or above this score unlocks Continue */
export const MATCH_PASS = 85;

/* the material the lesson opens on: mid roughness, no metal, plain grey. It
   deliberately looks like nothing in particular, so every change reads. */
export const START_MATERIAL = { color: '#b8b8b4', roughness: 50, metalness: 0, emissive: 0 };
