/* ═══════════════════════════════════════════════
   CONTROL DOCK
   The bottom-center rail of material controls.

   The dock is empty when the lesson starts and grows one control per step. This
   is the whole anti-clutter strategy: a student on the roughness step sees a
   roughness slider and nothing else, so there is never a question about which
   control the caption is talking about.
═══════════════════════════════════════════════ */
import { COLOR_SWATCHES, MATERIAL_PRESETS } from './config.js';
import { values, setValue, setValues, applyValues } from './subject.js';

const dock = document.getElementById('dock');
const listeners = [];

/* which controls are currently revealed, in dock order */
let visible = [];

export function onControlChange(fn) { listeners.push(fn); }
function emit(key) { listeners.forEach(fn => fn(key)); }

/* ── build ── */

const swatchRow = document.getElementById('swatches');
COLOR_SWATCHES.forEach(hex => {
    const b = document.createElement('button');
    b.className = 'swatch';
    b.style.background = hex;
    b.dataset.color = hex;
    b.setAttribute('aria-label', `color ${hex}`);
    b.addEventListener('click', () => {
        setValue('color', hex);
        syncFromValues();
        emit('color');
    });
    swatchRow.appendChild(b);
});

const recipeRow = document.getElementById('recipes');
Object.entries(MATERIAL_PRESETS).forEach(([key, preset]) => {
    const b = document.createElement('button');
    b.className = 'recipe';
    b.dataset.recipe = key;
    b.innerHTML = `<span class="recipe-ball" style="background:${preset.color}"></span>${preset.label}`;
    b.addEventListener('click', () => {
        // Emissive is not part of any recipe; leave whatever the student set.
        setValues({ color: preset.color, roughness: preset.roughness, metalness: preset.metalness });
        syncFromValues();
        emit('recipe:' + key);
    });
    recipeRow.appendChild(b);
});

const sliders = {};
['roughness', 'metalness', 'emissive'].forEach(key => {
    const input = document.querySelector(`input[data-ctl="${key}"]`);
    sliders[key] = input;
    input.addEventListener('input', () => {
        setValue(key, Number(input.value));
        syncFromValues();
        emit(key);
    });
});

/* ── reveal ── */

export function revealControls(keys) {
    visible = keys;
    dock.querySelectorAll('.ctl').forEach(el => {
        const on = keys.includes(el.dataset.group);
        el.classList.toggle('on', on);
    });
    dock.classList.toggle('on', keys.length > 0);
}

export function hideDock() { revealControls([]); }

/* Controls go dead while a demo drives them - a student grabbing the same slider
   mid-demo would fight the animation and see nonsense. */
export function lockDock(on) {
    dock.classList.toggle('locked', !!on);
}

/* Pulse a control so the student's eye lands on the thing the caption just named.
   Used when a step reveals a control without running a demo over it. */
export function flashControl(key) {
    const el = dock.querySelector(`.ctl[data-group="${key}"]`);
    if (!el) return;
    el.classList.remove('flash');
    void el.offsetWidth;   // restart the animation
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 2400);
}

/* ── value <-> DOM sync ── */

export function syncFromValues() {
    Object.entries(sliders).forEach(([key, input]) => {
        input.value = values[key] ?? 0;
        const out = document.querySelector(`.ctl-val[data-for="${key}"]`);
        if (out) out.textContent = ((values[key] ?? 0) / 100).toFixed(2);
    });
    swatchRow.querySelectorAll('.swatch').forEach(b => {
        b.classList.toggle('active', b.dataset.color.toLowerCase() === String(values.color).toLowerCase());
    });
    // Highlight a recipe only on an exact hit, so the button reads as "you are
    // here" rather than "close enough".
    recipeRow.querySelectorAll('.recipe').forEach(b => {
        const p = MATERIAL_PRESETS[b.dataset.recipe];
        b.classList.toggle('active',
            p.color.toLowerCase() === String(values.color).toLowerCase() &&
            p.roughness === values.roughness &&
            p.metalness === values.metalness);
    });
}

/* ── demo support ──
   Watch demos drive the real slider, not a fake one, so the number and the
   sphere move exactly as they will when the student does it themselves. */

export function demoSetSlider(key, value) {
    setValue(key, value);
    syncFromValues();
}

/* Viewport position of a slider's thumb, for the demo cursor to sit on. */
export function sliderThumbPoint(key) {
    const input = sliders[key];
    if (!input) return null;
    const r = input.getBoundingClientRect();
    const t = (Number(input.value) - Number(input.min)) / (Number(input.max) - Number(input.min));
    const thumb = 16;   // keeps the cursor on the knob at both ends of the track
    return { x: r.left + thumb / 2 + t * (r.width - thumb), y: r.top + r.height / 2 };
}

/* Viewport position of a swatch, for the demo cursor. */
export function swatchPoint(hex) {
    const b = swatchRow.querySelector(`.swatch[data-color="${hex}"]`);
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

applyValues();
syncFromValues();
