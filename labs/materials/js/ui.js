/* ═══════════════════════════════════════════════
   UI HELPERS
   Caption panel, Watch/Your Turn badge, progress bar, Continue and Replay.
═══════════════════════════════════════════════ */
import { NUMBERED_STEPS, TOTAL_BEATS } from './config.js';

function tog(id, on) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('on', !!on);
}

/* Whether the current beat ran a demo, so Replay is only offered where there is
   something to replay. Set by showWatch, consumed by hideWatch, cleared on
   setMode(null) at the top of each beat. */
let currentBeatHadWatch = false;

export function setCaption(step, title, body) {
    const stepEl = document.getElementById('cap-step');
    const titleEl = document.getElementById('cap-title');
    const bodyEl = document.getElementById('cap-body');

    titleEl.classList.remove('on');
    bodyEl.classList.remove('on');

    setTimeout(() => {
        stepEl.textContent = step ? `Step ${step} of ${NUMBERED_STEPS}` : '';
        titleEl.innerHTML = title || '';
        bodyEl.innerHTML = body || '';
        stepEl.classList.toggle('on', !!step);
        if (title) titleEl.classList.add('on');
        if (body) bodyEl.classList.add('on');
    }, 150);
}

export function setMode(mode) {
    const badge = document.getElementById('status-badge');
    const badgeText = badge.querySelector('.badge-text');
    const panel = document.getElementById('panel');
    if (!mode) {
        badge.classList.remove('on', 'watching', 'interacting');
        panel.classList.remove('panel-watching', 'panel-interacting');
        currentBeatHadWatch = false;
        tog('btn-replay', false);
        return;
    }
    const isWatch = mode === 'watch';
    if (badgeText) badgeText.textContent = isWatch ? 'Watch' : 'Your Turn';
    badge.className = isWatch ? 'watching on' : 'interacting on';
    panel.classList.toggle('panel-watching', isWatch);
    panel.classList.toggle('panel-interacting', !isWatch);
}

export function showWatch() {
    currentBeatHadWatch = true;
    tog('btn-replay', false);
    setMode('watch');
}

export function hideWatch() {
    setMode('interact');
    if (currentBeatHadWatch) tog('btn-replay', true);
}

export function showContinue() {
    tog('btn-continue', true);
    tog('kbd-hint', true);
}

export function hideContinue() {
    tog('btn-continue', false);
    tog('kbd-hint', false);
    const fin = document.getElementById('btn-finish');
    if (fin) fin.classList.remove('on');
    document.getElementById('panel').classList.remove('panel-celebrate');
}

export function setProgress(idx) {
    const pct = idx <= 0 ? 0 : (idx / (TOTAL_BEATS - 1)) * 100;
    document.getElementById('prog-fill').style.width = pct + '%';
}

export function showFinishButton() {
    const fin = document.getElementById('btn-finish');
    if (fin) fin.classList.add('on');
}
