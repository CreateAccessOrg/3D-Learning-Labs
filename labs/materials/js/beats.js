/* ═══════════════════════════════════════════════
   BEAT SYSTEM
   Each beat reveals one control, plays a Watch demo over it, then waits for the
   student to use it themselves before Continue unlocks.

   The order is deliberate and it is the lesson: color is the property a beginner
   already understands, roughness is the one that changes everything and nobody
   guesses, metalness is the one that behaves unlike the other two. Each step
   only ever adds one new variable to the sphere in front of them.
═══════════════════════════════════════════════ */
import { TOTAL_BEATS, MATCH_PASS, START_MATERIAL } from './config.js';
import { state } from './state.js';
import { setCam, releaseCamera, orbitCtrl } from './stage.js';
import { runSequence, clearAnims } from './anim.js';
import { lerp } from './utils.js';
import { values, resetValues, setValues } from './subject.js';
import { startMatch, endMatch, checkMatch } from './match.js';
import {
    revealControls, hideDock, lockDock, flashControl,
    demoSetSlider, sliderThumbPoint, swatchPoint, syncFromValues,
} from './controls.js';
import {
    toggleDemoCursor, moveDemoCursor, setDemoCursorDown, getDemoCursorPoint,
} from './demoCursor.js';
import {
    setCaption, setMode, showWatch, hideWatch,
    showContinue, hideContinue, setProgress, showFinishButton,
} from './ui.js';

/* ── demo step builders ──
   Every demo drives the real control, so what the student watches is exactly
   what they are about to do. */

/* Ease the cursor from wherever it is to a point, recomputed each frame because
   the dock can still be settling into place when a demo starts. */
function cursorTo(getPoint, duration = 0.55) {
    let from = null;
    return {
        duration, fn: t => {
            const to = getPoint();
            if (!to) return;
            if (t === 0 || !from) from = { ...getDemoCursorPoint() };
            moveDemoCursor({ x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t) });
        },
    };
}

/* Drag a slider from one value to another with the cursor riding the thumb. */
function dragSlider(key, from, to, duration = 1.5) {
    return {
        duration, fn: t => {
            if (t === 0) setDemoCursorDown(true);
            demoSetSlider(key, Math.round(lerp(from, to, t)));
            moveDemoCursor(sliderThumbPoint(key));
        },
    };
}

/* Let go and hold still - the pause is where the student actually looks at the
   sphere instead of the moving control. */
function hold(key, duration = 0.9) {
    return {
        duration, fn: t => {
            if (t === 0) setDemoCursorDown(false);
            if (key) moveDemoCursor(sliderThumbPoint(key));
        },
    };
}

function clickSwatch(hex, duration = 0.5) {
    return {
        duration, fn: t => {
            if (t === 0) {
                setDemoCursorDown(true);
                setValues({ color: hex });
                syncFromValues();
            }
            if (t > 0.6) setDemoCursorDown(false);
        },
    };
}

/* Shared demo scaffolding: lock everything down, run the steps, hand back. */
function playDemo(steps, { camKey = 'hero', release = 'hero' } = {}) {
    orbitCtrl.enabled = false;
    state.beatLocked = true;
    state.camLocked = true;
    lockDock(true);
    showWatch();
    setCam(camKey);
    runSequence(steps, () => {
        toggleDemoCursor(false);
        setDemoCursorDown(false);
        lockDock(false);
        releaseCamera(release);
        hideWatch();
        state.beatLocked = false;
    });
}

/* ═══════════════════════════════════════════════ */

export function runBeat(idx) {
    state.beatIdx = idx;
    state.beatLocked = false;
    hideContinue();
    setMode(null);
    clearAnims();
    toggleDemoCursor(false);
    lockDock(false);

    /* reset per-beat interaction tracking */
    state.colorsTried = new Set();
    state.roughLow = false;
    state.roughHigh = false;
    state.metalOn = false;
    state.metalOff = false;
    state.recipesTried = new Set();

    if (idx !== 5) endMatch();
    setProgress(idx);

    switch (idx) {

        /* ─────────────────────────────────────────
           BEAT 0: meet the material
           Nothing to do but look. The sphere is deliberately plain grey so that
           every single change from here on is visible against it.
        ───────────────────────────────────────── */
        case 0:
            hideDock();
            resetValues();
            syncFromValues();
            setCam('hero', true);
            orbitCtrl.enabled = true;
            setCaption('', 'What a material is',
                'A material describes how a surface reacts to light. Change the material and you change how a 3D object looks, without touching its shape.<br><br>This is a plain grey sphere. Over the next few steps you will turn it into clay, gold, and rubber, using three controls.<br><span class="cap-tip"><b>Drag to orbit</b> around the sphere any time.</span>');
            setTimeout(showContinue, 900);
            break;

        /* ─────────────────────────────────────────
           BEAT 1: color
           The property they already understand, first, so the control dock and
           the Watch/Your Turn rhythm are learned on something easy.
        ───────────────────────────────────────── */
        case 1:
            revealControls(['color']);
            setCaption(1, 'Color',
                'The most obvious property of a surface: what color it is. <b>Click a swatch to recolor the sphere.</b>');
            playDemo([
                { duration: 0.5, fn: t => { if (t === 0) { toggleDemoCursor(true); moveDemoCursor(swatchPoint('#ff9022')); } } },
                cursorTo(() => swatchPoint('#c0453a'), 0.6),
                clickSwatch('#c0453a'),
                { duration: 0.7, fn: () => { } },
                cursorTo(() => swatchPoint('#3a6fa8'), 0.7),
                clickSwatch('#3a6fa8'),
                { duration: 0.8, fn: () => { } },
            ]);
            break;

        /* ─────────────────────────────────────────
           BEAT 2: roughness
           The important one. Demoed as a full sweep in both directions, because
           the lesson is the relationship between the slider and the size of the
           highlight - a single value shows nothing.
        ───────────────────────────────────────── */
        case 2:
            revealControls(['color', 'roughness']);
            // Park the slider where the demo below starts from. Without this a
            // student who hits Replay after dragging sees the knob teleport.
            setValues({ roughness: 50, metalness: 0 });
            syncFromValues();
            setCaption(2, 'Roughness',
                'Roughness is how scattered a surface is at a scale too small to see. It controls the <b>highlight</b>: the bright spot where the light source reflects back at you.<br><br><b>Drag roughness all the way up, then all the way down.</b> Watch the highlight, not the color.');
            playDemo([
                { duration: 0.6, fn: t => { if (t === 0) { toggleDemoCursor(true); moveDemoCursor(sliderThumbPoint('roughness')); } } },
                dragSlider('roughness', 50, 96, 1.5),
                hold('roughness', 1.2),   // broad, soft, barely there
                dragSlider('roughness', 96, 4, 1.9),
                hold('roughness', 1.2),   // tight, sharp, mirror-like
                dragSlider('roughness', 4, 45, 0.9),
            ], { camKey: 'close', release: 'close' });
            break;

        /* ─────────────────────────────────────────
           BEAT 3: metalness
           Near enough to a switch in practice, so it is demoed as one. The point
           to land is that metals tint their reflections and non-metals do not.
        ───────────────────────────────────────── */
        case 3:
            revealControls(['color', 'roughness', 'metalness']);
            // Roughness low enough that the reflection is legible - a metal at
            // high roughness just reads as grey mud and teaches nothing.
            setValues({ roughness: 25, metalness: 0 });
            syncFromValues();
            setCaption(3, 'Metalness',
                'Metalness asks one question: is this metal or not? There is very little in between.<br><br>Non-metals keep their color and get a <b>white</b> highlight. Metals have almost no color of their own - they show you the room, tinted. <b>Turn metalness up, then back down.</b>');
            playDemo([
                { duration: 0.6, fn: t => { if (t === 0) { toggleDemoCursor(true); moveDemoCursor(sliderThumbPoint('metalness')); } } },
                dragSlider('metalness', 0, 100, 1.3),
                hold('metalness', 1.4),
                dragSlider('metalness', 100, 0, 1.3),
                hold('metalness', 1.1),
                dragSlider('metalness', 0, 100, 0.9),
                hold('metalness', 0.8),
            ]);
            break;

        /* ─────────────────────────────────────────
           BEAT 4: the three together
           Recipes are revealed as presets to inspect, not as an answer key: the
           student clicks one and reads what the three sliders did.
        ───────────────────────────────────────── */
        case 4:
            revealControls(['color', 'roughness', 'metalness', 'recipes']);
            setValues({ ...START_MATERIAL });
            syncFromValues();
            setMode('interact');
            setCaption(4, 'Three controls is most of it',
                'Almost every everyday surface is some combination of those three. <b>Click two recipes and watch where the sliders land.</b><br><span class="cap-tip">Rubber and chrome differ by two sliders. Gold and brushed steel differ by one.</span>');
            flashControl('recipes');
            break;

        /* ─────────────────────────────────────────
           BEAT 5: the match challenge
           Lights are fixed and identical on both spheres. Said out loud in the
           caption, because it is the first question anyone asks.
        ───────────────────────────────────────── */
        case 5:
            revealControls(['color', 'roughness', 'metalness', 'check']);
            setValues({ ...START_MATERIAL });
            syncFromValues();
            startMatch();
            setCam('match');
            orbitCtrl.enabled = true;
            setMode('interact');
            setCaption(5, 'Match the reference',
                'On the left is a material you have not been given the recipe for. <b>Tune the right-hand sphere until the two read the same, then press Check match.</b><br><span class="cap-tip">Both spheres sit under the same fixed lights - only the material differs. You need ' + MATCH_PASS + '% to pass.</span>');
            break;

        /* ─────────────────────────────────────────
           BEAT 6: free play
        ───────────────────────────────────────── */
        case 6:
            revealControls(['color', 'roughness', 'metalness', 'emissive', 'recipes']);
            setCam('hero');
            orbitCtrl.enabled = true;
            setMode(null);
            setCaption('', '<span class="cap-celebrate-icon">🎉</span>You can read a material',
                'Color, roughness, metalness: the same three controls, under these names, in every 3D app you will ever open.<br><br>One extra is unlocked below. <b>Emissive</b> makes a surface give off its own light instead of only reflecting - which is the other half of this story, and the subject of the next lab.');
            document.getElementById('panel').classList.add('panel-celebrate');
            flashControl('emissive');
            setTimeout(showFinishButton, 300);
            break;
    }
}

/* ═══════════════════════════════════════════════
   COMPLETION CHECKS
   Called on every control change. Unlocks Continue once the beat's goal is met.
═══════════════════════════════════════════════ */
export function checkBeatComplete(key) {
    if (state.beatLocked) return;

    // Track first, gate second: a student who explores during the demo still
    // gets credit, but Continue only appears once it is their turn.
    switch (state.beatIdx) {
        case 1: if (key === 'color') state.colorsTried.add(String(values.color).toLowerCase()); break;
        case 2:
            if (key === 'roughness') {
                if (values.roughness <= 15) state.roughLow = true;
                if (values.roughness >= 80) state.roughHigh = true;
            }
            break;
        case 3:
            if (key === 'metalness') {
                if (values.metalness >= 80) state.metalOn = true;
                if (values.metalness <= 20) state.metalOff = true;
            }
            break;
        case 4: if (key && key.startsWith('recipe:')) state.recipesTried.add(key); break;
    }

    if (document.getElementById('btn-continue').classList.contains('on')) return;

    switch (state.beatIdx) {
        case 1: if (state.colorsTried.size >= 2) showContinue(); break;
        case 2: if (state.roughLow && state.roughHigh) showContinue(); break;
        case 3: if (state.metalOn && state.metalOff) showContinue(); break;
        case 4: if (state.recipesTried.size >= 2) showContinue(); break;
        case 5: if (state.matchPassed) showContinue(); break;
    }
}

/* ═══════════════════════════════════════════════
   NAVIGATION
═══════════════════════════════════════════════ */
export function nextBeat() {
    if (state.beatLocked) return;
    if (state.beatIdx < TOTAL_BEATS - 1) runBeat(state.beatIdx + 1);
}

export function replayBeat() {
    if (state.beatLocked) return;
    runBeat(state.beatIdx);
}

/* Check match lives outside the beat switch because it is a button, not a
   control change; it still has to feed the completion gate. */
export function onCheckMatch() {
    if (state.beatIdx !== 5) return;
    checkMatch();
    checkBeatComplete('check');
}

export function onNewTarget() {
    if (state.beatIdx !== 5) return;
    startMatch();
    setValues({ ...START_MATERIAL });
    syncFromValues();
}
