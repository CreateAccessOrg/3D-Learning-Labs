/* ═══════════════════════════════════════════════
   STATE
   Mutable runtime state shared across modules.
═══════════════════════════════════════════════ */
export const state = {
    /* beat flow */
    beatIdx: 0,
    beatLocked: false,   // true while a Watch demo is playing
    camLocked: false,    // true during scripted camera moves

    /* per-beat interaction tracking - reset at the top of each beat */
    colorsTried: new Set(),   // beat 1: distinct swatches clicked
    roughLow: false,          // beat 2: pushed roughness below 0.2
    roughHigh: false,         // beat 2: pushed roughness above 0.8
    metalOn: false,           // beat 3: pushed metalness above 0.8
    metalOff: false,          // beat 3: brought it back below 0.2
    recipesTried: new Set(),  // beat 4: recipes previewed

    /* match challenge (beat 5) */
    matchTarget: null,        // recipe key the student is chasing
    matchPassed: false,       // whether a check has come back at or above pass
    matchChecks: 0,           // how many times Check match has been pressed
};
