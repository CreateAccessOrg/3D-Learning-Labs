/* ═══════════════════════════════════════════════
   SUBJECT
   The sphere the student is texturing, plus the reference sphere used by the
   match challenge.

   A sphere and only a sphere. Swapping shapes mid-lesson costs a beginner the
   one fixed point they are comparing against, and every material cue this lab
   teaches - highlight size, reflection color, terminator softness - reads on a
   sphere better than on anything else. That is why look-dev uses reference balls.
═══════════════════════════════════════════════ */
import * as THREE from 'three';
import { scene } from './stage.js';
import { SUBJECT_Y, SUBJECT_R, MATCH_SPREAD, START_MATERIAL } from './config.js';

function makeMaterial() {
    return new THREE.MeshPhysicalMaterial({
        color: 0xb8b8b4,
        roughness: 0.5,
        metalness: 0,
        emissive: 0x000000,
        emissiveIntensity: 1,
        envMapIntensity: 1.0,
    });
}

export const studentMaterial = makeMaterial();
export const targetMaterial = makeMaterial();

const geometry = new THREE.SphereGeometry(SUBJECT_R, 96, 64);

export const studentRoot = new THREE.Group();
studentRoot.position.set(0, SUBJECT_Y, 0);
scene.add(studentRoot);

export const targetRoot = new THREE.Group();
targetRoot.position.set(-MATCH_SPREAD, SUBJECT_Y, 0);
targetRoot.visible = false;
scene.add(targetRoot);

const studentMesh = new THREE.Mesh(geometry, studentMaterial);
studentMesh.castShadow = true;
studentMesh.receiveShadow = true;
studentRoot.add(studentMesh);

const targetMesh = new THREE.Mesh(geometry, targetMaterial);
targetMesh.castShadow = true;
targetMesh.receiveShadow = true;
targetRoot.add(targetMesh);

/* ── current values ──
   Held here as 0-100 numbers so the sliders, the presets, and the match scoring
   all speak the same units and nothing has to convert twice. */
export const values = { ...START_MATERIAL };

export function applyValues(target = studentMaterial, v = values) {
    target.color.set(v.color);
    target.roughness = v.roughness / 100;
    target.metalness = v.metalness / 100;
    // Emissive borrows the base color: a beginner expects a red ball to glow
    // red, and a separate emissive color picker is one control too many.
    target.emissive.set(v.color);
    target.emissiveIntensity = (v.emissive ?? 0) / 100;
}

export function setValue(key, value) {
    values[key] = value;
    applyValues();
}

export function setValues(patch) {
    Object.assign(values, patch);
    applyValues();
}

export function resetValues() {
    Object.assign(values, START_MATERIAL);
    applyValues();
}

export function setTargetRecipe(preset) {
    applyValues(targetMaterial, { ...preset, emissive: 0 });
}

/* Slide the student's sphere aside so the reference can sit next to it. Both
   spheres share a light rig and a camera angle, which is the only way a side by
   side comparison is worth anything. */
export function setMatchLayout(on) {
    targetRoot.visible = on;
    studentRoot.position.x = on ? MATCH_SPREAD : 0;
}

applyValues();
