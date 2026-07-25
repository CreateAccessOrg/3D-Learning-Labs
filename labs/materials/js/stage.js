/* ═══════════════════════════════════════════════
   STAGE
   Renderer, scene, camera, orbit controls, and the fixed studio light rig.

   The rig is deliberately fixed and uncontrollable in this lab. Materials only
   read honestly under stable light - if the student can move the key light while
   judging roughness, they cannot tell which of the two changed the highlight.
   Lighting gets its own lab, where the rig is the subject and the material holds
   still instead.
═══════════════════════════════════════════════ */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CAMS, SUBJECT_Y } from './config.js';
import { state } from './state.js';

export const W = () => window.innerWidth;
export const H = () => window.innerHeight;

export const clock = new THREE.Clock();

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0ee);

export const camera = new THREE.PerspectiveCamera(38, W() / H(), 0.05, 100);
camera.position.copy(CAMS.hero.pos);

const canvas = document.getElementById('cv');
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(W(), H());
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

/* An environment map is what gives metals something to reflect. Without it,
   metalness 1 reads as a black ball and the whole metalness step falls apart. */
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

export const orbitCtrl = new OrbitControls(camera, canvas);
orbitCtrl.enableDamping = true;
orbitCtrl.dampingFactor = 0.08;
orbitCtrl.enablePan = false;          // nothing to pan to; keeps the subject centered
orbitCtrl.target.copy(CAMS.hero.look);
orbitCtrl.minDistance = 3.0;
orbitCtrl.maxDistance = 9.5;
orbitCtrl.minPolarAngle = 0.25;
orbitCtrl.maxPolarAngle = Math.PI / 2 - 0.06;   // stay above the floor
orbitCtrl.update();

/* ── studio rig ── */
const key = new THREE.SpotLight(0xffefdc, 26, 0, Math.PI / 5, 0.5, 1.4);
key.position.set(3.1, 5.0, 3.6);
key.target.position.set(0, SUBJECT_Y, 0);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.bias = -0.0004;
key.shadow.normalBias = 0.02;
scene.add(key, key.target);

const fill = new THREE.SpotLight(0xdce6ff, 7, 0, Math.PI / 4, 0.7, 1.4);
fill.position.set(-4.2, 2.6, 2.4);
fill.target.position.set(0, SUBJECT_Y, 0);
scene.add(fill, fill.target);

const rim = new THREE.SpotLight(0xffffff, 12, 0, Math.PI / 5, 0.6, 1.4);
rim.position.set(-1.8, 3.4, -4.6);
rim.target.position.set(0, SUBJECT_Y, 0);
scene.add(rim, rim.target);

scene.add(new THREE.HemisphereLight(0xffffff, 0x8d9099, 0.35));

/* ── floor ──
   Rough and near-white so it stays a stage rather than a surface the student
   starts reading. It catches the shadow, which is most of its job. */
const floor = new THREE.Mesh(
    new THREE.CircleGeometry(9, 64),
    new THREE.MeshStandardMaterial({ color: 0xe4e4df, roughness: 0.95, metalness: 0 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

/* ── scripted camera moves ──
   Beats ease the camera to a preset before a demo. While state.camLocked is true
   orbit is off and tickCam drives the camera; releasing hands control back. */
let camFrom = null, camFromLook = null, camTo = null, camToLook = null;
let camT = 1, camDur = 1;

export function setCam(key, instant = false) {
    const preset = CAMS[key];
    if (instant) {
        camera.position.copy(preset.pos);
        camera.lookAt(preset.look);
        orbitCtrl.target.copy(preset.look);
        orbitCtrl.update();
        camT = 1;
        return;
    }
    camFrom = camera.position.clone();
    camFromLook = orbitCtrl.target.clone();
    camTo = preset.pos.clone();
    camToLook = preset.look.clone();
    // A move the student can barely see reads as lag, so collapse it to a snap.
    camDur = camFrom.distanceTo(camTo) < 0.5 ? 0.001 : 0.85;
    camT = 0;
}

export function tickCam(dt) {
    // A scripted move and OrbitControls' damping both write the camera every
    // frame, so exactly one of them may run at a time or they fight and the
    // camera judders. The scripted move always wins while it is in flight.
    if (camT < 1 && camTo) {
        camT = Math.min(camT + dt / camDur, 1);
        const e = camT < .5 ? 4 * camT ** 3 : 1 - Math.pow(-2 * camT + 2, 3) / 2;
        camera.position.lerpVectors(camFrom, camTo, e);
        orbitCtrl.target.lerpVectors(camFromLook, camToLook, e);
        camera.lookAt(orbitCtrl.target);
        return;
    }
    if (orbitCtrl.enabled) orbitCtrl.update();
}

/* Hand camera control back to the student, orbiting around the preset's look. */
export function releaseCamera(key = 'hero') {
    orbitCtrl.target.copy(CAMS[key].look);
    state.camLocked = false;
    orbitCtrl.enabled = true;
    orbitCtrl.update();
}

export function resetView() {
    state.camLocked = false;
    orbitCtrl.enabled = true;
    setCam(state.beatIdx === 5 ? 'match' : 'hero');
}
