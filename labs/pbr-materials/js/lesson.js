/* ═══════════════════════════════════════════════
   LESSON
   The progression. One persistent ball on the stage; a panel that walks through
   stages, revealing one more control each time, and finishing on the match game.

   No scripted camera, no forced waiting - each stage just shows what it needs
   and lets the player poke at it. Next/Back move between stages; the match stage
   adds its own Check and New buttons.
═══════════════════════════════════════════════ */
import { createCanvas3D } from './render.js';
import { bindSliders, bindRGB, bindChoices, readout } from './controls.js';
import { dragRotate, clamp } from './interact.js';
import { makeScene } from './scene.js';
import { PRESETS, randomTarget } from './materials.js';
import { scoreMatch, matchTip, PASS } from './match.js';

/* which control groups each stage shows, plus its words */
const STAGES = [
    {
        kicker: '', title: 'Build a material',
        text: 'Every object in a game or movie is a plain grey shape wearing a <b>material</b>. That is what makes it look like gold, or rubber, or a shiny red car. Let us make some.',
        groups: [], next: "Let's go",
    },
    {
        kicker: 'Step 1 of 4', title: 'Give it a color',
        text: 'Slide <b>R</b>, <b>G</b> and <b>B</b> to mix any color you want. A color is really just those three numbers. Drag the ball to spin it around.',
        groups: ['color'],
    },
    {
        kicker: 'Step 2 of 4', title: 'Shiny or dull?',
        text: '<b>Roughness</b> is how polished the surface is. Slide it down for a mirror shine, up for a chalky, dull look. Watch the bright spot spread out.',
        groups: ['color', 'roughness'],
    },
    {
        kicker: 'Step 3 of 4', title: 'Is it metal?',
        text: 'Flip <b>metal</b> on. See how the whole thing changes? Metals barely have a color of their own; they show off the room around them instead.',
        groups: ['color', 'roughness', 'metal'],
    },
    {
        kicker: 'Step 4 of 4', title: 'Move the light',
        text: 'One more slider: slide the <b>light</b> around the ball and watch the shine chase it. The bright spot is really a little reflection of the light itself.',
        groups: ['color', 'roughness', 'metal', 'light'],
    },
    {
        kicker: 'Challenge', title: 'Match the mystery ball',
        text: 'On the left is a mystery material. <b>Copy it on the right</b> using your controls, then press Check to see how close you got.',
        groups: ['color', 'roughness', 'metal', 'match'], mode: 'match', next: 'Skip',
    },
    {
        kicker: 'Done', title: 'You made it! 🎉',
        text: 'Color, roughness, metal: the same three controls the pros use in every 3D app there is. Play as long as you like, or try a recipe.',
        groups: ['color', 'roughness', 'metal', 'light', 'presets'], last: true,
    },
];

export function initLesson() {
    const stage = document.getElementById('stage');
    const canvas = document.getElementById('cv');
    const panel = document.getElementById('panel');
    const hud = document.getElementById('hud');
    const setReadout = readout(panel);

    const scn = makeScene();
    const view = createCanvas3D(canvas, 900 / 560, scn.scene, scn.camera);

    const state = {
        stage: 0,
        you: { color: '#ff9022', roughness: 30, metal: 0 },
        target: null,
        camAz: 0, camEl: 8, lightAz: 38,
        checked: false, passed: false,
    };

    const labels = {
        you: document.getElementById('label-you'),
        mystery: document.getElementById('label-mystery'),
    };

    /* ── the ball ── */
    function refreshBall() {
        scn.applyYou(state.you);
        const r = state.you.roughness;
        hud.textContent = state.you.metal ? 'metal'
            : r < 14 ? 'glossy' : r > 72 ? 'matte' : 'plastic';
        placeLabels();
        view.invalidate();
    }

    function placeLabels() {
        if (STAGES[state.stage].mode !== 'match') return;
        for (const [key, mesh] of [['you', scn.you], ['mystery', scn.mystery]]) {
            const p = scn.labelPoint(canvas, mesh);
            const el = labels[key];
            el.style.left = `${p.x}px`;
            el.style.top = `${p.y}px`;
            el.style.opacity = p.visible ? '1' : '0';
        }
    }

    dragRotate(canvas, (dx, dy) => {
        state.camAz += dx;
        state.camEl = clamp(state.camEl - dy, -14, 82);
        scn.setView(state.camAz, state.camEl);
        placeLabels();
        view.invalidate();
    });

    /* ── controls ── */
    const sliders = bindSliders(panel, (name, value) => {
        if (name === 'roughness') { state.you.roughness = value; refreshBall(); }
        if (name === 'light') { state.lightAz = value; scn.setLight(value); view.invalidate(); }
    });

    const rgb = bindRGB(panel, hex => { state.you.color = hex; refreshBall(); }, state.you.color);

    const metalSeg = bindChoices(panel, '.seg-metal button', value => {
        state.you.metal = Number(value);
        refreshBall();
    }, '0');

    bindChoices(panel, '.preset', key => {
        const p = PRESETS[key];
        if (!p) return;
        rgb.set(p.color);
        sliders.set('roughness', p.roughness);
        metalSeg.select(String(p.metal));
    });

    /* ── match game ── */
    const result = document.getElementById('result');

    function newTarget() {
        state.target = randomTarget();
        state.checked = false;
        state.passed = false;
        scn.applyMystery(state.target);
        result.classList.remove('on', 'pass');
        view.invalidate();
    }

    function check() {
        const { parts, total } = scoreMatch(state.you, state.target);
        state.checked = true;
        state.passed = total >= PASS;

        document.getElementById('score-num').textContent = total;
        for (const [prop, val] of Object.entries(parts)) {
            const bar = result.querySelector(`.bar[data-prop="${prop}"] i`);
            if (bar) bar.style.width = `${Math.round(val)}%`;
        }
        document.getElementById('score-tip').innerHTML = state.passed
            ? '<b>Nailed it!</b> Press New ball to try another, or move on.'
            : matchTip(state.you, state.target, parts);
        result.classList.toggle('pass', state.passed);
        result.classList.add('on');
        result.classList.remove('bump'); void result.offsetWidth; result.classList.add('bump');
    }

    document.getElementById('btn-check').addEventListener('click', check);
    document.getElementById('btn-new').addEventListener('click', newTarget);

    /* ── stage flow ── */
    function showGroups(list) {
        panel.querySelectorAll('.group').forEach(g => {
            g.classList.toggle('on', list.includes(g.dataset.group));
        });
    }

    function runStage(i) {
        state.stage = i;
        const s = STAGES[i];

        document.getElementById('kicker').textContent = s.kicker;
        document.getElementById('kicker').style.display = s.kicker ? '' : 'none';
        document.getElementById('title').innerHTML = s.title;
        document.getElementById('text').innerHTML = s.text;
        showGroups(s.groups);

        const match = s.mode === 'match';
        scn.setMatchLayout(match);
        scn.setView(state.camAz, state.camEl);
        labels.you.classList.toggle('show', match);
        labels.mystery.classList.toggle('show', match);
        if (match && !state.target) newTarget();
        else if (match) { scn.applyMystery(state.target); }
        refreshBall();

        // footer
        const back = document.getElementById('btn-back');
        const next = document.getElementById('btn-next');
        const finish = document.getElementById('btn-finish');
        back.style.visibility = i === 0 ? 'hidden' : 'visible';
        next.textContent = s.next || 'Next';
        next.style.display = s.last ? 'none' : '';
        finish.style.display = s.last ? '' : 'none';

        renderDots();
    }

    function renderDots() {
        const dots = document.getElementById('dots');
        dots.innerHTML = '';
        STAGES.forEach((_, i) => {
            const d = document.createElement('button');
            d.className = 'dot' + (i === state.stage ? ' now' : '') + (i < state.stage ? ' done' : '');
            d.type = 'button';
            d.setAttribute('aria-label', `Go to stage ${i + 1}`);
            d.addEventListener('click', () => runStage(i));
            dots.appendChild(d);
        });
    }

    document.getElementById('btn-next').addEventListener('click', () => {
        if (state.stage < STAGES.length - 1) runStage(state.stage + 1);
    });
    document.getElementById('btn-back').addEventListener('click', () => {
        if (state.stage > 0) runStage(state.stage - 1);
    });

    window.addEventListener('resize', placeLabels);

    scn.setView(state.camAz, state.camEl);
    scn.setLight(state.lightAz);
    runStage(0);
}
