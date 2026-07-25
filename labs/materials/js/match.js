/* ═══════════════════════════════════════════════
   MATCH CHALLENGE
   A reference sphere appears next to the student's. They tune until the two
   read the same, then press Check match.

   Deliberately not live-scored. A number that ticks while you drag turns the
   exercise into "watch the readout go up", and the student stops looking at the
   spheres - which was the entire skill being taught. Scoring only on submit
   keeps their eyes on the render and makes the check a real commitment.
═══════════════════════════════════════════════ */
import * as THREE from 'three';
import { MATERIAL_PRESETS, MATCH_POOL, MATCH_PASS, SUBJECT_R } from './config.js';
import { camera } from './stage.js';
import { values, studentRoot, targetRoot, setMatchLayout, setTargetRecipe } from './subject.js';
import { state } from './state.js';

const resultEl = document.getElementById('match-result');
const pctEl = document.getElementById('mr-pct');
const noteEl = document.getElementById('mr-note');
const labels = {
    target: document.getElementById('label-target'),
    student: document.getElementById('label-student'),
};

/* ── scoring ──
   Each property scores 100 at an exact hit and falls to 0 at a tolerance chosen
   so "visibly wrong" lands near zero and "close enough to fool the eye" stays
   near full marks. */
const TOLERANCE = { color: 0.55, roughness: 34, metalness: 42 };
const WEIGHT = { color: 0.3, roughness: 0.35, metalness: 0.35 };

const colorA = new THREE.Color();
const colorB = new THREE.Color();

function colorDistance(a, b) {
    colorA.set(a);
    colorB.set(b);
    return Math.hypot(colorA.r - colorB.r, colorA.g - colorB.g, colorA.b - colorB.b);
}

function scoreOne(distance, tolerance) {
    return Math.max(0, 1 - distance / tolerance) * 100;
}

export function scoreMatch() {
    const target = MATERIAL_PRESETS[state.matchTarget];
    const parts = {
        color: scoreOne(colorDistance(values.color, target.color), TOLERANCE.color),
        roughness: scoreOne(Math.abs(values.roughness - target.roughness), TOLERANCE.roughness),
        metalness: scoreOne(Math.abs(values.metalness - target.metalness), TOLERANCE.metalness),
    };
    const total = Math.round(
        parts.color * WEIGHT.color +
        parts.roughness * WEIGHT.roughness +
        parts.metalness * WEIGHT.metalness
    );
    return { parts, total, target };
}

/* The single most useful sentence we can give back: name the property that is
   furthest off, and which way to move it. One correction at a time is what a
   beginner can act on. */
function buildNote({ parts, total, target }) {
    if (total >= MATCH_PASS) {
        return `<b>Matched.</b> That is ${target.label.toLowerCase()} - you read it off the sphere, not off a label.`;
    }
    const worst = Object.entries(parts).sort((a, b) => a[1] - b[1])[0][0];

    if (worst === 'metalness') {
        return values.metalness < target.metalness
            ? '<b>Metalness is too low.</b> Look at the reference: its reflections take on its own color instead of showing a white highlight. That only happens on metal.'
            : '<b>Metalness is too high.</b> The reference has a plain white highlight sitting on top of its color, which is what non-metals do.';
    }
    if (worst === 'roughness') {
        return values.roughness < target.roughness
            ? '<b>Too smooth.</b> Your highlight is tighter and sharper than the reference. Raise roughness to spread it out.'
            : '<b>Too rough.</b> Your highlight is broader and softer than the reference. Lower roughness to pull it in.';
    }
    return '<b>The color is off.</b> Compare the two spheres where the light is weakest - the base color reads more honestly there than in the highlight.';
}

export function checkMatch() {
    const result = scoreMatch();
    state.matchChecks++;
    if (result.total >= MATCH_PASS) state.matchPassed = true;

    pctEl.textContent = result.total;
    Object.entries(result.parts).forEach(([prop, score]) => {
        const bar = resultEl.querySelector(`.mr-row[data-prop="${prop}"] i`);
        if (bar) bar.style.width = `${Math.round(score)}%`;
    });
    noteEl.innerHTML = buildNote(result);
    resultEl.classList.toggle('pass', result.total >= MATCH_PASS);
    resultEl.classList.add('on');
    // restart the pop so a repeat check still registers as a new answer
    resultEl.classList.remove('bump');
    void resultEl.offsetWidth;
    resultEl.classList.add('bump');

    return result;
}

export function startMatch() {
    const pool = MATCH_POOL.filter(k => k !== state.matchTarget);
    state.matchTarget = pool[Math.floor(Math.random() * pool.length)];
    state.matchPassed = false;
    state.matchChecks = 0;

    setTargetRecipe(MATERIAL_PRESETS[state.matchTarget]);
    setMatchLayout(true);
    resultEl.classList.remove('on', 'pass', 'bump');
    Object.values(labels).forEach(l => l.classList.add('on'));
}

export function endMatch() {
    setMatchLayout(false);
    resultEl.classList.remove('on', 'pass', 'bump');
    Object.values(labels).forEach(l => l.classList.remove('on'));
}

/* ── floating labels ──
   Projected each frame so they stay pinned to their sphere while the student
   orbits. Anchored above the sphere rather than beside it, so the two never
   trade places when the camera swings past center.  */
const worldPoint = new THREE.Vector3();

function placeLabel(root, el) {
    root.getWorldPosition(worldPoint);
    worldPoint.y += SUBJECT_R + 0.42;
    worldPoint.project(camera);
    const x = (worldPoint.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-worldPoint.y * 0.5 + 0.5) * window.innerHeight;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    // behind the camera: z leaves [-1,1] and the projection flips
    el.style.opacity = worldPoint.z > 1 ? 0 : '';
}

export function updateMatchLabels() {
    if (!targetRoot.visible) return;
    placeLabel(targetRoot, labels.target);
    placeLabel(studentRoot, labels.student);
}
