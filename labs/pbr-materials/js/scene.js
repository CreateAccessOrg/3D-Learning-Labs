/* ═══════════════════════════════════════════════
   SCENE
   One ball you are building, and a second "mystery" ball that appears only for
   the match game. Both share one light and one camera angle - a side-by-side
   comparison is worthless otherwise, which is the whole reason the light is
   fixed during the match.

   The background stays the figure card's own color; reflections come from a
   prefiltered environment instead, so a metal ball still has a real room to
   reflect while the page stays calm.
═══════════════════════════════════════════════ */
import * as THREE from 'three';
import { environment, placeOrbit } from './render.js';

const R = 1;
const SPREAD = 1.4;            // half the gap between the two balls in match mode
const DIST_SOLO = 4.3;
const DIST_MATCH = 5.4;        // pulled back so both balls fit the frame

const TARGET = new THREE.Vector3(0, 0, 0);
const geometry = new THREE.SphereGeometry(R, 128, 96);

function makeMaterial() {
    return new THREE.MeshStandardMaterial({
        color: 0xb9b9b4, roughness: 0.35, metalness: 0, envMapIntensity: 1,
    });
}

export function makeScene() {
    const scene = new THREE.Scene();
    scene.environment = environment;

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);

    const key = new THREE.DirectionalLight(0xfff4e6, 3.2);
    scene.add(key);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8d9099, 0.35));

    const youMat = makeMaterial();
    const mysteryMat = makeMaterial();

    const you = new THREE.Mesh(geometry, youMat);
    scene.add(you);
    const mystery = new THREE.Mesh(geometry, mysteryMat);
    mystery.visible = false;
    scene.add(mystery);

    let distance = DIST_SOLO;
    const setView = (az, el) => placeOrbit(camera, az, el, distance, TARGET);
    const setLight = (az, el = 34) => placeOrbit(key, az, el, 6, TARGET);

    function setMatchLayout(on) {
        mystery.visible = on;
        you.position.x = on ? SPREAD : 0;
        mystery.position.x = on ? -SPREAD : 0;
        distance = on ? DIST_MATCH : DIST_SOLO;
    }

    function applyMaterial(mat, { color, roughness, metal }) {
        mat.color.set(color);
        mat.roughness = roughness / 100;
        mat.metalness = metal;
    }

    const applyYou = v => applyMaterial(youMat, v);
    const applyMystery = v => applyMaterial(mysteryMat, v);

    /* Screen position of a ball's top, for placing its floating label. */
    const scratch = new THREE.Vector3();
    function labelPoint(canvas, mesh) {
        const w = canvas.clientWidth, h = canvas.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        camera.updateMatrixWorld();
        scratch.set(mesh.position.x, mesh.position.y + R + 0.32, mesh.position.z).project(camera);
        return {
            x: (scratch.x * 0.5 + 0.5) * w,
            y: (-scratch.y * 0.5 + 0.5) * h,
            visible: scratch.z < 1,
        };
    }

    return {
        scene, camera, you, mystery,
        setView, setLight, setMatchLayout,
        applyYou, applyMystery, labelPoint,
    };
}
