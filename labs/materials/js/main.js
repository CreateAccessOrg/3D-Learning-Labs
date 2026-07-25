/* ═══════════════════════════════════════════════
   MAIN
   Wires up the DOM, starts the render loop, kicks off the lesson.
═══════════════════════════════════════════════ */
import { renderer, scene, camera, clock, tickCam, resetView, W, H } from './stage.js';
import { tickAnims } from './anim.js';
import { onControlChange } from './controls.js';
import { updateMatchLabels } from './match.js';
import { state } from './state.js';
import { runBeat, nextBeat, replayBeat, checkBeatComplete, onCheckMatch, onNewTarget } from './beats.js';

/* ── controls ── */
document.getElementById('btn-continue').addEventListener('click', nextBeat);
document.getElementById('btn-replay').addEventListener('click', replayBeat);
document.getElementById('btn-reset-view').addEventListener('click', resetView);
document.getElementById('btn-check').addEventListener('click', onCheckMatch);
document.getElementById('btn-new-target').addEventListener('click', onNewTarget);

onControlChange(checkBeatComplete);

/* Space advances, matching the navigate lab. Only when Continue is showing, so
   it can never skip past a demo the student is meant to be watching.
   preventDefault also stops Space from re-firing whichever dock button happens
   to still hold focus. */
window.addEventListener('keydown', e => {
    if (e.code !== 'Space') return;
    if (!document.getElementById('btn-continue').classList.contains('on')) return;
    e.preventDefault();
    nextBeat();
});

/* ── render loop ── */
function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    tickCam(dt);
    tickAnims(dt);
    if (state.beatIdx === 5) updateMatchLabels();
    renderer.render(scene, camera);
}
animate();

/* ── resize ── */
window.addEventListener('resize', () => {
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
    renderer.setSize(W(), H());
});

/* Keep --panel-h in sync with the caption panel's real height. On phones the
   panel becomes a full-width bottom bar and the dock stacks above it using this. */
const panelEl = document.getElementById('panel');
new ResizeObserver(() =>
    document.documentElement.style.setProperty('--panel-h', panelEl.offsetHeight + 'px')
).observe(panelEl);

/* ── go ──
   The pause is not cosmetic: the PMREM environment map is generated on the first
   frames, and starting the lesson under it half-built shows the student a
   material that then changes on its own. */
const loadEl = document.getElementById('loading');
setTimeout(() => {
    loadEl.classList.add('fade');
    setTimeout(() => { loadEl.style.display = 'none'; }, 800);
    runBeat(0);
}, 350);
