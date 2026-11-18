import { createGuidance } from './guidance.js';

const PRIMITIVES = new Set(['cube', 'sphere', 'cylinder', 'cone', 'plane']);
// New pieces appear near where they belong, so nobody hauls a shape across the scene.
// The body lands on Gizmobot's back; later pieces float a gap from the piece they join.
// Size and exact placement are the learner's choice.
const BODY_SPAWN = [-2, 1.8, -1];
const SPAWN_GAP = .6;
// Pieces count as joined when their boxes meet or overlap, give or take this much.
const JOIN_SLACK = .1;
const copy = value => structuredClone(value);
const distance = (a, b) => Math.hypot(...a.map((value, index) => value - b[index]));
const maxDifference = (a, b) => Math.max(...a.map((value, index) => Math.abs(value - b[index])));

// Each step is one visible result. Small prerequisite clicks (choosing a tool
// or an Outliner row) belong inside the step that needs them, not in a step of
// their own. `spotlight` marks the steps that introduce a new control.
const step = (id, title, body, target, ready, options = {}) => ({
  id, title, body, target, ready,
  terms: ['Move', 'Scale', 'Snap', 'Surface', 'Outliner', 'Hierarchy', 'Parent', 'Base Color', 'Appearance', 'Undo'].filter(term => body.includes(term)),
  ...options,
});
const STEPS = [
  step('example', 'Objects are made of simple shapes', 'This backpack is four simple shapes put together. Choose “Take it apart” to see each one.', '.viewport', c => c.exampleSeen),
  step('add-body', 'Add the Backpack Body', 'Open “Add” and choose “Cube”. It appears on Gizmobot’s back: the start of your backpack.', '#add-toggle', c => Boolean(c.bodyId), { add: 'cube', creates: 'body', inspector: true, spotlight: true }),
  step('shape-body', 'Shape the Backpack Body', 'Choose “Scale” and drag its handles to shape the backpack. It stays in place while its proportions change.', '[data-tool="scale"]', c => c.bodyScaled(), { scale: true, selectEntity: 'body', spotlight: true }),
  step('add-pocket', 'Add a Pocket', 'Open “Add” and choose “Cube” again: it appears behind the backpack. Scale it into a pocket, any size you like.', '#add-toggle', c => Boolean(c.detailId) && c.entityChanged(c.detailId, 'size', .1), { add: 'cube', creates: 'detail', scale: true }),
  step('choose-snap', 'Turn on Surface Snap', 'Open the arrow beside “Snap” and choose “Surface”. Snap turns on: faces now stick to nearby objects.', '.snap-control', c => c.surfaceSnapOn(), { snap: true, spotlight: true }),
  step('place-pocket', 'Snap the Pocket onto the backpack', 'Choose “Move” and drag the Pocket against the backpack, wherever you want it. Snap closes the gap and holds it flush.', '[data-tool="move"]', c => c.surfaceSnapOn() && c.detailTouchesBody(), { move: true, snap: true, selectEntity: 'detail' }),
  step('add-mast', 'Build the Antenna Mast', 'Open “Add” and choose “Cylinder”: it appears above the backpack. Use “Scale” to make it an antenna, then “Move” to place it on the backpack wherever you like.', '#add-toggle', c => Boolean(c.cylinderId) && c.entityChanged(c.cylinderId, 'size', .1) && c.mastPlaced(), { add: 'cylinder', creates: 'cylinder', scale: true, move: true, snap: true }),
  step('add-tip', 'Top it with the Antenna Tip', 'Open “Add” and choose “Sphere”: it appears above the mast. Use “Scale” to size it, then “Move” to place it on the mast.', '#add-toggle', c => Boolean(c.sphereId) && c.antennaTipPlaced(), { add: 'sphere', creates: 'sphere', scale: true, move: true, snap: true }),
  step('materials', 'Change material (color)', 'Select each piece in the Outliner, the object list on the right, and change its Base Color under Appearance. Give all four pieces a color you like.', '.inspector-section[data-section="appearance"]', c => c.materialsStyled(), { appearance: true, selectEntity: 'body', references: ['Material Lab'], spotlight: true }),
  step('attach-tip', 'Attach the Tip to the Mast', 'Your pieces touch, but they are still four separate objects. Choose Antenna Tip in the Outliner, then under Hierarchy set Parent to Antenna Mast.', '.scene-panel', c => c.tipParented(), { hierarchy: true, select: 'sphere', spotlight: true }),
  step('attach-rest', 'Attach everything to the Body', 'Antenna Mast is selected: set its Parent to Backpack Body. Then choose Backpack Pocket in the Outliner and do the same.', '.parent-select', c => c.mastParented() && c.detailParented(), { hierarchy: true, selectEntity: 'cylinder' }),
  step('move-together', 'Move the backpack as one', 'Choose Backpack Body in the Outliner, then use “Move” to drag it. Every piece comes along, because a parent carries whatever is attached to it.', '.scene-panel', c => c.hierarchyBuilt() && c.bodyMovedAsParent(), { move: true, select: 'body', continueLabel: 'Finish lesson' }),
];

function lessonCapabilities(index, created = {}, spawn = null) {
  const step = STEPS[index];
  const move = Boolean(step.move), scale = Boolean(step.scale), appearance = Boolean(step.appearance);
  // Add stays open only until this step's piece exists, so one step makes one piece.
  const add = Boolean(step.add) && !created[step.creates];
  return {
    tools: { select: true, move, rotate: false, scale, add },
    shapes: Object.fromEntries([...PRIMITIVES].map(type => [type, add && step.add === type])),
    shapeNames: { cube: step.id === 'add-body' ? 'Backpack Body' : 'Backpack Pocket', cylinder: 'Antenna Mast', sphere: 'Antenna Tip', cone: null, plane: null },
    shapeSpawns: Object.fromEntries([...PRIMITIVES].map(type => [type, add && step.add === type ? spawn : null])),
    panels: { scene: true, inspector: true, bottomEditor: false },
    inspectorSections: { transform: move || scale, geometry: false, appearance, hierarchy: Boolean(step.hierarchy) },
    transformFields: { position: move, rotation: false, scale },
    appearance: { baseColor: appearance, roughness: false, metalness: false, emissive: false, readOnly: false },
    actions: { duplicate: false, delete: false, visibility: false, rename: false, group: false, ungroup: false, reparent: Boolean(step.hierarchy) },
    features: { studio: false, snap: Boolean(step.snap), snapSettings: Boolean(step.snap), view: false },
  };
}

const freePlayCapabilities = {
  tools: { select: true, move: true, rotate: true, scale: true, add: true },
  shapes: { cube: true, sphere: true, cylinder: true, cone: true, plane: true },
  shapeNames: { cube: null, sphere: null, cylinder: null, cone: null, plane: null },
  shapeSpawns: { cube: null, sphere: null, cylinder: null, cone: null, plane: null },
  panels: { scene: true, inspector: true, bottomEditor: true },
  inspectorSections: { transform: true, geometry: true, appearance: true, hierarchy: true },
  transformFields: { position: true, rotation: true, scale: true },
  appearance: { baseColor: true, roughness: true, metalness: true, emissive: true, readOnly: false },
  actions: { duplicate: true, delete: true, visibility: true, rename: true, group: true, ungroup: true, reparent: true },
  features: { studio: true, snap: true, snapSettings: true, view: true },
};

/** Compose the Model an Accessory lesson over an initialised Creation Studio. */
export async function createAccessoryLesson(creator, { guidance: suppliedGuidance, example: suppliedExample } = {}) {
  if (!creator?.project || !creator?.setCapabilities) throw new TypeError('A ready Creation Studio instance is required');
  await creator.viewport?.ready;

  const { project } = creator;
  const guidance = suppliedGuidance || createGuidance();
  const example = suppliedExample || (creator.viewport?.stage
    ? (await import('./accessoryExample.js')).createAccessoryExample(creator)
    : null);
  const helpButton = document.getElementById('help-toggle');
  const productTag = document.querySelector('.prototype-tag');
  const priorTitle = document.title;
  const priorTag = productTag?.textContent;
  const initialIds = new Set(project.entities.map(entity => entity.id));
  let index = 0;
  let complete = false;
  let finished = false;
  let bodyId = null;
  let detailId = null;
  let cylinderId = null;
  let sphereId = null;
  let stepBaseline = new Map();
  let exampleSeen = false;
  let transitioning = false;
  let appliedCapabilities = '';

  const primitives = () => project.entities.filter(entity => PRIMITIVES.has(entity.type));
  const authored = type => primitives().filter(entity => entity.type === type && !initialIds.has(entity.id));
  const dimensions = entity => {
    if (!entity) return null;
    const geometry = entity.components.geometry || {};
    const base = entity.type === 'cube' ? [geometry.width, geometry.height, geometry.depth]
      : entity.type === 'sphere' ? [geometry.radius * 2, geometry.radius * 2, geometry.radius * 2]
      : entity.type === 'cylinder' ? [geometry.radius * 2, geometry.height, geometry.radius * 2]
      : [1, 1, 1];
    return base.map((value, axis) => value * entity.components.transform.scale[axis]);
  };
  const bounds = entity => {
    const size = dimensions(entity), position = entity?.components.transform.position;
    if (!size || !position) return null;
    return { min: position.map((value, axis) => value - size[axis] / 2), max: position.map((value, axis) => value + size[axis] / 2) };
  };
  const snapshot = entity => entity ? {
    position: copy(entity.components.transform.position),
    size: [
      ...entity.components.transform.scale,
      ...Object.values(entity.components.geometry || {}),
    ],
    material: copy(entity.components.material || null),
  } : null;

  const ids = () => ({ body: bodyId, detail: detailId, cylinder: cylinderId, sphere: sphereId });
  const context = {
    activeTool: tool => creator.tools?.getActive?.() === tool,
    selected: name => project.selection.activeId === ids()[name],
    snapSettingsOpen: () => Boolean(document.querySelector('.snap-settings')?.open),
    snapping: () => creator.tools?.getSnapping?.(),
    get exampleSeen() { return exampleSeen; },
    get bodyId() { return bodyId; },
    get detailId() { return detailId; },
    get cylinderId() { return cylinderId; },
    get sphereId() { return sphereId; },
    entityChanged(id, key, threshold) {
      const entity = project.get(id), before = stepBaseline.get(id);
      if (!entity || !before) return false;
      const now = snapshot(entity)?.[key];
      return key === 'position' ? distance(now, before[key]) >= threshold : maxDifference(now, before[key]) >= threshold;
    },
    bodyChanged(key, threshold) { return this.entityChanged(bodyId, key, threshold); },
    bodyScaled() {
      return this.bodyChanged('size', .2);
    },
    surfaceSnapOn() {
      const settings = creator.tools?.getSnapSettings?.();
      return Boolean(settings?.enabled && settings.mode === 'surface');
    },
    detailTouchesBody() {
      const a = bounds(project.get(detailId)), b = bounds(project.get(bodyId));
      if (!a || !b) return false;
      return [0, 1, 2].some(axis => {
        const gap = Math.min(Math.abs(a.max[axis] - b.min[axis]), Math.abs(b.max[axis] - a.min[axis]));
        const others = [0, 1, 2].filter(index => index !== axis);
        return gap <= .055 && others.every(index => a.max[index] >= b.min[index] && a.min[index] <= b.max[index]);
      });
    },
    // The gist of "attached": the two pieces meet or overlap. Where and how is up to the learner.
    joined(aId, bId) {
      const a = bounds(project.get(aId)), b = bounds(project.get(bId));
      return Boolean(a && b && [0, 1, 2].every(axis => a.max[axis] >= b.min[axis] - JOIN_SLACK && a.min[axis] <= b.max[axis] + JOIN_SLACK));
    },
    mastPlaced() { return this.joined(cylinderId, bodyId); },
    antennaTipPlaced() { return this.joined(sphereId, cylinderId); },
    materialChanged(id) {
      const entity = project.get(id), before = stepBaseline.get(id)?.material;
      return Boolean(entity?.components.material && before
        && entity.components.material.color !== before.color);
    },
    materialsStyled() {
      return [bodyId, detailId, cylinderId, sphereId].every(id => id && this.materialChanged(id));
    },
    tipParented() { return project.get(sphereId)?.parentId === cylinderId; },
    mastParented() { return project.get(cylinderId)?.parentId === bodyId; },
    detailParented() { return project.get(detailId)?.parentId === bodyId; },
    hierarchyBuilt() {
      return project.get(detailId)?.parentId === bodyId && project.get(cylinderId)?.parentId === bodyId
        && project.get(sphereId)?.parentId === cylinderId;
    },
    bodyMovedAsParent() {
      return this.entityChanged(bodyId, 'position', .2);
    },
  };

  function refreshKnownEntities() {
    const cubes = authored('cube');
    if (!project.get(bodyId)) bodyId = cubes[0]?.id || null;
    if (!project.get(detailId)) detailId = cubes.find(entity => entity.id !== bodyId)?.id || null;
    if (!project.get(cylinderId)) cylinderId = authored('cylinder')[0]?.id || null;
    if (!project.get(sphereId)) sphereId = authored('sphere')[0]?.id || null;
    for (const id of [bodyId, detailId, cylinderId, sphereId]) {
      const entity = project.get(id);
      if (entity && !stepBaseline.has(id)) stepBaseline.set(id, snapshot(entity));
    }
  }

  function exposeState() {
    return Object.freeze({ step: index, stepId: STEPS[index].id, total: STEPS.length, complete, finished });
  }

  function evaluate() {
    refreshKnownEntities();
    if (finished) return;
    applyCapabilities();
    const next = Boolean(STEPS[index].ready(context));
    if (next !== complete) { complete = next; guidance.setComplete(complete); }
  }

  // Where this step's new piece appears, worked out from the pieces already built.
  function spawnFor(step) {
    const body = project.get(bodyId), mast = project.get(cylinderId);
    const bp = body?.components.transform.position, bs = dimensions(body), ms = dimensions(mast);
    if (step.creates === 'body') return { position: BODY_SPAWN };
    // Cubes and cylinders are 1 tall and deep before scaling; spheres are 1.2 across.
    if (step.creates === 'detail' && bs) return { position: [bp[0], bp[1], bp[2] - bs[2] / 2 - SPAWN_GAP - .5] };
    if (step.creates === 'cylinder' && bs) return { position: [bp[0], bp[1] + bs[1] / 2 + SPAWN_GAP + .5, bp[2]] };
    if (step.creates === 'sphere' && ms) {
      const mp = mast.components.transform.position;
      return { position: [mp[0], mp[1] + ms[1] / 2 + SPAWN_GAP + .6, mp[2]] };
    }
    return null;
  }

  function applyCapabilities() {
    const next = lessonCapabilities(index, { body: bodyId, detail: detailId, cylinder: cylinderId, sphere: sphereId }, spawnFor(STEPS[index]));
    const key = JSON.stringify(next);
    if (key === appliedCapabilities) return;
    appliedCapabilities = key;
    creator.setCapabilities(next);
  }

  function enter(nextIndex, exampleAlreadyHidden = false) {
    if (index === 0 && nextIndex !== 0 && !exampleAlreadyHidden) (example?.leave || example?.hide)?.call(example);
    index = nextIndex;
    const step = STEPS[index];
    if (index === 0) example?.show?.();
    complete = false;
    refreshKnownEntities();
    // No handles until the new piece exists, so the previous piece is not reshaped by mistake.
    if (step.select || step.creates) project.selection.clear();
    const selectedId = ids()[step.selectEntity];
    if (selectedId && project.get(selectedId)) project.selection.set(selectedId);
    applyCapabilities();
    // Snap is on only while its control is showing, and its menu closes once a choice is made.
    if (!step.snap && creator.tools?.getSnapping?.()) creator.tools.setSnapping(false);
    if (step.id !== 'choose-snap') { const settings = document.querySelector('.snap-settings'); if (settings) settings.open = false; }
    const narrow = globalThis.matchMedia?.('(max-width: 900px)').matches;
    const inspectorTarget = /scene-panel|inspector|parent-select/.test(step.target);
    const needsInspector = inspectorTarget || Boolean(step.inspector || step.select || step.hierarchy || step.appearance);
    creator.setDock?.(!narrow || needsInspector ? 'pinned' : 'closed');
    stepBaseline = new Map(project.entities.map(entity => [entity.id, snapshot(entity)]));
    complete = false;
    guidance.show({
      step: index + 1, total: STEPS.length, title: step.title, body: step.body, terms: step.terms, references: step.references,
      target: step.target, placement: inspectorTarget ? 'left' : 'right', spotlight: Boolean(step.spotlight),
      continueLabel: step.continueLabel || 'Continue', canContinue: false,
      actionLabel: index === 0 ? 'Take it apart' : null,
      onAction: async () => {
        if (index !== 0 || finished) return false;
        const seen = await example?.separate?.();
        if (!seen || index !== 0 || finished) return false;
        exampleSeen = true;
        evaluate();
        return true;
      },
      onContinue: async () => {
        if (!complete || transitioning) return;
        if (index === 0) {
          transitioning = true;
          complete = false;
          guidance.setComplete(false);
          if (example?.transitionOut) await example.transitionOut();
          else (example?.leave || example?.hide)?.call(example);
          if (finished) return;
          transitioning = false;
          enter(1, true);
        } else if (index < STEPS.length - 1) enter(index + 1);
        else finish();
      },
    });
    evaluate();
  }

  function finish() {
    if (finished) return;
    finished = true;
    unsubscribe?.(); unsubscribeTools?.(); document.removeEventListener?.('toggle', evaluate, true);
    creator.setCapabilities(freePlayCapabilities);
    guidance.destroy();
    example?.hide?.();
    example?.dispose?.();
    if (helpButton) helpButton.hidden = false;
    if (productTag && priorTag) productTag.textContent = priorTag;
    document.title = priorTitle;
  }

  document.addEventListener?.('toggle', evaluate, true);
  const unsubscribe = project.subscribe(evaluate);
  const unsubscribeTools = creator.tools?.subscribe?.(evaluate);
  const api = Object.freeze({
    get state() { return exposeState(); },
    next() { if (complete && !finished) index < STEPS.length - 1 ? enter(index + 1) : finish(); },
    destroy() {
      unsubscribe?.(); unsubscribeTools?.(); document.removeEventListener?.('toggle', evaluate, true); guidance.destroy();
      example?.hide?.(); example?.dispose?.();
      if (!finished) creator.setCapabilities(freePlayCapabilities);
      if (helpButton) helpButton.hidden = false;
      if (productTag && priorTag) productTag.textContent = priorTag;
      document.title = priorTitle;
      finished = true;
    },
  });
  creator.lesson = api;
  creator.showGuide?.(false);
  if (helpButton) helpButton.hidden = true;
  if (productTag) productTag.textContent = 'Accessory lesson';
  document.title = 'Model an Accessory · CreateAccess Creation Studio';
  enter(0);
  return api;
}

export { STEPS };
