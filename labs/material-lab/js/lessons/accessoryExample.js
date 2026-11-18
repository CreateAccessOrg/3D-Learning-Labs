import * as THREE from 'three';

// The four-piece back module from the original lab, shown as a reference only.
// It never enters project/history, so a demonstration cannot satisfy practice.
// Taking it apart lifts one piece at a time and names its shape, so the
// backpack reads as "simple shapes put together" rather than one object.
const STAGGER = 520, TRAVEL = 760;
export function createAccessoryExample(creator) {
  const { stage } = creator.viewport;
  const root = new THREE.Group();
  root.name = 'Back module example';
  const specs = [
    ['body', 'Cube', new THREE.BoxGeometry(1, 1, 1), [0, 1.8, -.74], [.84, .94, .34], '#3a91b8', [-1, -.1, -.56]],
    ['detail', 'Cube', new THREE.BoxGeometry(1, 1, 1), [0, 1.46, -.95], [.48, .2, .14], '#25303c', [-1, -.5, -1.05]],
    ['antenna', 'Cylinder', new THREE.CylinderGeometry(.5, .5, 1, 24), [.26, 2.46, -.83], [.05, .58, .05], '#f2f0eb', [-1.11, .2, -.47]],
    ['beacon', 'Sphere', new THREE.SphereGeometry(.5, 24, 16), [.26, 2.79, -.83], [.22, .22, .22], '#ff9022', [-1.11, .5, -.47]],
  ];
  const wrap = document.getElementById('canvas-wrap');
  const pieces = specs.map(([name, shape, geometry, position, scale, color, offset]) => {
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: .48 }));
    mesh.name = name;
    mesh.position.fromArray(position); mesh.scale.fromArray(scale);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.raycast = () => {};
    root.add(mesh);
    const label = document.createElement('div');
    label.className = 'accessory-piece-label';
    label.textContent = shape;
    label.hidden = true;
    wrap?.append(label);
    return { mesh, label, home: mesh.position.clone(), offset: new THREE.Vector3(...offset) };
  });
  let frame = 0, transitionFrame = 0, labelFrame = 0, shown = false, savedCamera = null, buildCamera = null, cancelSeparation = null, cancelTransition = null;
  const ease = t => t * t * (3 - 2 * t);
  // `amount` is one number for every piece, or a function giving each piece its own.
  const pose = amount => pieces.forEach(({ mesh, home, offset }, index) => mesh.position.copy(home).addScaledVector(offset, typeof amount === 'function' ? amount(index) : amount));
  const labels = visible => pieces.forEach(({ label }, index) => { label.hidden = !(typeof visible === 'function' ? visible(index) : visible); });
  const anchor = new THREE.Vector3();
  function placeLabels() {
    if (!wrap) return;
    const bounds = wrap.getBoundingClientRect();
    for (const { mesh, label } of pieces) {
      if (label.hidden) continue;
      mesh.getWorldPosition(anchor); anchor.y += mesh.scale.y / 2;
      anchor.project(stage.camera);
      label.style.left = `${(anchor.x * .5 + .5) * bounds.width}px`;
      label.style.top = `${(-anchor.y * .5 + .5) * bounds.height}px`;
    }
  }
  // Labels follow their pieces while the learner orbits the example.
  function followLabels() {
    placeLabels();
    if (shown && typeof requestAnimationFrame === 'function') labelFrame = requestAnimationFrame(followLabels);
  }
  const opacity = value => pieces.forEach(({ mesh }) => {
    const transparent = value < 1;
    if (mesh.material.transparent !== transparent) {
      mesh.material.transparent = transparent;
      mesh.material.needsUpdate = true;
    }
    mesh.material.opacity = value;
  });
  function separate() {
    if (!shown) return Promise.resolve(false);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { pose(1); labels(true); placeLabels(); return Promise.resolve(true); }
    return new Promise(resolve => {
      cancelSeparation = () => resolve(false);
      const start = performance.now();
      const total = STAGGER * (pieces.length - 1) + TRAVEL;
      function tick(now) {
        const elapsed = now - start, t = Math.min(1, elapsed / total);
        pose(index => ease(Math.min(1, Math.max(0, (elapsed - index * STAGGER) / TRAVEL))));
        labels(index => elapsed >= index * STAGGER);
        if (t < 1 && shown) frame = requestAnimationFrame(tick);
        else { cancelSeparation = null; resolve(shown); }
      }
      frame = requestAnimationFrame(tick);
    });
  }
  function show() {
    if (shown) return;
    shown = true; pose(0);
    const bot = creator.viewport.getObject('gizmobot');
    if (bot) {
      bot.updateWorldMatrix(true, false);
      // Creation Studio displays the GLB in its native orientation; the old lab turned
      // its model around. Align that lab's reference coordinates to the back.
      root.matrix.copy(bot.matrixWorld).multiply(new THREE.Matrix4().makeRotationY(Math.PI));
      root.matrixAutoUpdate = false;
    }
    stage.scene.add(root);
    savedCamera = { position: stage.camera.position.clone(), target: stage.orbitCtrl.target.clone() };
    const origin = new THREE.Vector3().setFromMatrixPosition(root.matrix);
    stage.camera.position.copy(origin).add(new THREE.Vector3(3.2, 2.8, -4.8));
    stage.orbitCtrl.target.copy(origin).add(new THREE.Vector3(0, 1.65, -.2));
    stage.orbitCtrl.update();
    // Building happens on Gizmobot's back, so the lesson continues from behind, pulled
    // back far enough to show the antenna pieces that appear above the backpack.
    buildCamera = { position: origin.clone().add(new THREE.Vector3(6.9, 4.7, -6.7)), target: origin.clone().add(new THREE.Vector3(0, 2.7, -.8)) };
    followLabels();
  }
  function detach(view) {
    if (!shown) return;
    shown = false;
    cancelAnimationFrame(frame); cancelAnimationFrame(transitionFrame); cancelAnimationFrame(labelFrame);
    labels(false);
    root.removeFromParent(); cancelSeparation?.(); cancelSeparation = null;
    if (view) {
      stage.camera.position.copy(view.position); stage.orbitCtrl.target.copy(view.target); stage.orbitCtrl.update();
    }
    opacity(1);
  }
  function hide() {
    cancelTransition?.(); cancelTransition = null;
    detach(savedCamera);
  }
  /** Put the example away and settle on the view used for building. */
  function leave() {
    cancelTransition?.(); cancelTransition = null;
    detach(buildCamera);
  }
  function transitionOut() {
    if (!shown) return Promise.resolve(false);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !buildCamera) { leave(); return Promise.resolve(true); }
    cancelAnimationFrame(frame); cancelSeparation?.(); cancelSeparation = null;
    labels(false);
    const fromPosition = stage.camera.position.clone();
    const fromTarget = stage.orbitCtrl.target.clone();
    return new Promise(resolve => {
      let settled = false;
      const finish = value => { if (settled) return; settled = true; resolve(value); };
      cancelTransition = () => finish(false);
      const start = performance.now();
      function tick(now) {
        if (!shown) { finish(false); return; }
        const t = Math.min(1, (now - start) / 1100);
        const eased = ease(t);
        // Snap back together first, so the whole backpack is seen once more before it fades.
        pose(1 - ease(Math.min(1, t / .55)));
        opacity(1 - Math.max(0, (t - .7) / .3));
        stage.camera.position.lerpVectors(fromPosition, buildCamera.position, eased);
        stage.orbitCtrl.target.lerpVectors(fromTarget, buildCamera.target, eased);
        stage.orbitCtrl.update();
        if (t < 1) transitionFrame = requestAnimationFrame(tick);
        else {
          transitionFrame = 0; cancelTransition = null;
          detach(buildCamera); finish(true);
        }
      }
      transitionFrame = requestAnimationFrame(tick);
    });
  }
  return { show, hide, leave, separate, transitionOut, dispose() { hide(); pieces.forEach(({ mesh, label }) => { label.remove(); mesh.geometry.dispose(); mesh.material.dispose(); }); } };
}
