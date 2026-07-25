/* ═══════════════════════════════════════════════
   RENDER PLUMBING

   Two things every figure on this page needs, done once here.

   1. Nothing animates. Every figure is a static picture until a slider moves,
      so views carry a dirty flag and redraw only when invalidated or resized.
      A page of five figures costs nothing while you are reading it.

   2. All the 3D figures share ONE WebGL context. The metalness figure alone
      wants three viewports; a context each would be wasteful and browsers cap
      how many a page may hold. So a single offscreen renderer draws each view
      in turn and the result is blitted into that figure's own 2D canvas.
═══════════════════════════════════════════════ */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const DPR = Math.min(window.devicePixelRatio || 1, 2);

/* ── the shared WebGL context ── */
const glCanvas = document.createElement('canvas');
export const renderer = new THREE.WebGLRenderer({
    canvas: glCanvas, antialias: true, alpha: true,
});
renderer.setPixelRatio(1);          // views already account for DPR themselves
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.setSize(16, 16, false);

/* One prefiltered environment, shared by every 3D figure.

   This is not decoration. A metal has no diffuse term, so everything you see on
   a metallic sphere is reflected surroundings - with no environment it renders
   as a black ball and the entire metalness section falls apart. */
const pmrem = new THREE.PMREMGenerator(renderer);
export const environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

let glW = 16, glH = 16;
function ensureGLSize(w, h) {
    if (w <= glW && h <= glH) return;
    glW = Math.max(glW, w);
    glH = Math.max(glH, h);
    renderer.setSize(glW, glH, false);
}

/* ── view registry ── */
const views = [];
let frameQueued = false;

function queue() {
    if (frameQueued) return;
    frameQueued = true;
    requestAnimationFrame(flush);
}

function flush() {
    frameQueued = false;
    for (const view of views) {
        if (!view.dirty || !view.visible) continue;
        view.dirty = false;
        view.paint();
    }
}

/* Figures below the fold never render until they scroll into view, and stop
   again once they leave. */
const observer = new IntersectionObserver(entries => {
    let woke = false;
    for (const entry of entries) {
        const view = views.find(v => v.canvas === entry.target);
        if (!view) continue;
        view.visible = entry.isIntersecting;
        if (entry.isIntersecting) { view.dirty = true; woke = true; }
    }
    if (woke) queue();
}, { rootMargin: '120px 0px' });

function sizeCanvas(view) {
    const cssW = view.canvas.clientWidth || 1;
    const cssH = Math.round(cssW / view.aspect);
    view.canvas.style.height = `${cssH}px`;
    const w = Math.round(cssW * DPR);
    const h = Math.round(cssH * DPR);
    if (view.canvas.width === w && view.canvas.height === h) return false;
    view.canvas.width = w;
    view.canvas.height = h;
    return true;
}

function makeView(canvas, aspect, paint) {
    const view = { canvas, aspect, paint, dirty: true, visible: false };
    views.push(view);
    observer.observe(canvas);
    sizeCanvas(view);
    view.invalidate = () => { view.dirty = true; queue(); };
    return view;
}

/* ── 2D figures ──
   draw(ctx, w, h, dpr) receives a canvas already sized for the display, with
   the transform scaled so it can work in CSS pixels. */
export function createCanvas2D(canvas, aspect, draw) {
    const ctx = canvas.getContext('2d');
    const view = makeView(canvas, aspect, () => {
        const w = canvas.width / DPR, h = canvas.height / DPR;
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        ctx.clearRect(0, 0, w, h);
        draw(ctx, w, h);
    });
    return view;
}

/* ── 3D figures ──
   Renders `scene` through `camera` into the shared context, then blits the
   result into this figure's own canvas. WebGL's origin is bottom-left, so the
   freshly drawn pixels sit at the BOTTOM of the shared canvas - hence the
   source-y of (glCanvas.height - h) rather than 0. */
export function createCanvas3D(canvas, aspect, scene, camera, beforeRender) {
    const ctx = canvas.getContext('2d');
    const view = makeView(canvas, aspect, () => {
        const w = canvas.width, h = canvas.height;
        ensureGLSize(w, h);
        if (beforeRender) beforeRender(w / h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setViewport(0, 0, w, h);
        renderer.setScissor(0, 0, w, h);
        renderer.setScissorTest(true);
        renderer.render(scene, camera);
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(glCanvas, 0, glCanvas.height - h, w, h, 0, 0, w, h);
    });
    return view;
}

/* Canvas text is measured against whatever font is loaded at draw time, so the
   2D figures need one redraw once the webfonts actually arrive. */
export function invalidateAll() {
    for (const view of views) view.dirty = true;
    queue();
}

/* ── resize ── */
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        for (const view of views) {
            if (sizeCanvas(view)) view.dirty = true;
        }
        queue();
    }, 120);
});

/* ── shared scene furniture ── */

/* Place a camera on a fixed orbit. The article never animates the camera; the
   view angle is a slider the reader drives, which is the difference between
   being shown a thing and being able to check it. */
export function placeOrbit(object, azimuthDeg, elevationDeg, radius, target) {
    const az = THREE.MathUtils.degToRad(azimuthDeg);
    const el = THREE.MathUtils.degToRad(elevationDeg);
    const horizontal = Math.cos(el) * radius;
    object.position.set(
        target.x + Math.sin(az) * horizontal,
        target.y + Math.sin(el) * radius,
        target.z + Math.cos(az) * horizontal
    );
    object.lookAt(target);
}

export { DPR };
