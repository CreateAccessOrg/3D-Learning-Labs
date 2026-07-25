/* ═══════════════════════════════════════════════
   MAIN
   Start the lesson once the module loads; refresh the ball's readout when the
   webfonts land (the HUD is drawn in DOM, but keeping this hook is cheap and
   covers any late layout shift affecting the projected labels).
═══════════════════════════════════════════════ */
import { invalidateAll } from './render.js';
import { initLesson } from './lesson.js';

try {
    initLesson();
} catch (error) {
    console.error('lesson failed to start', error);
    document.getElementById('stage')?.setAttribute('data-failed', 'true');
}

if (document.fonts?.ready) document.fonts.ready.then(invalidateAll);
