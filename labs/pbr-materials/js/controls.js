/* ═══════════════════════════════════════════════
   CONTROLS
   Declarative bindings for the widgets under each figure. The markup in
   index.html is the source of truth; this file only wires it up.
═══════════════════════════════════════════════ */

const FORMATS = {
    unit: v => (v / 100).toFixed(2),
    deg: v => `${Math.round(v)}°`,
    pct: v => `${Math.round(v)}%`,
    raw: v => String(v),
};

/* The filled part of a slider track is painted by CSS from --fill, refreshed on
   every input and once at startup. */
function paint(input) {
    const min = Number(input.min), max = Number(input.max);
    const pct = ((Number(input.value) - min) / (max - min)) * 100;
    input.style.setProperty('--fill', `${pct}%`);
    const out = input.closest('.slider')?.querySelector('output');
    if (out) out.textContent = (FORMATS[input.dataset.format] || FORMATS.raw)(Number(input.value));
}

/* Bind the labelled sliders in a figure. Scoped to [data-name] so it never
   grabs the R/G/B inputs, which are handled by bindRGB below. onChange fires on
   input and once immediately, so a figure never restates its start values. */
export function bindSliders(root, onChange) {
    const inputs = [...root.querySelectorAll('input[type="range"][data-name]')];
    inputs.forEach(input => {
        const emit = () => { paint(input); onChange(input.dataset.name, Number(input.value)); };
        input.addEventListener('input', emit);
        emit();
    });
    return {
        set(name, value) {
            const input = inputs.find(i => i.dataset.name === name);
            if (!input) return;
            input.value = value;
            paint(input);
            onChange(name, Number(input.value));
        },
    };
}

/* Three channel sliders that build a color. Reports a hex string, so a figure
   only ever deals in one color value however the reader got there.

   Color as three numbers you slide is itself part of the lesson: a middle
   schooler leaves knowing a color IS a triple, not an item from a menu. */
export function bindRGB(root, onChange, initialHex) {
    const chip = root.querySelector('[data-rgb-chip]');
    const hexOut = root.querySelector('[data-rgb-hex]');
    const inputs = ['r', 'g', 'b'].map(k => root.querySelector(`input[data-rgb="${k}"]`));
    if (inputs.some(i => !i)) return { set() { }, read: () => initialHex };

    const read = () => '#' + inputs
        .map(i => Number(i.value).toString(16).padStart(2, '0')).join('');

    const refresh = () => {
        inputs.forEach(i => {
            const out = i.closest('.rgb-row')?.querySelector('output');
            if (out) out.textContent = i.value;
        });
        const hex = read();
        if (chip) chip.style.background = hex;
        if (hexOut) hexOut.textContent = hex.toUpperCase();
        onChange(hex);
    };

    const set = hex => {
        const n = hex.replace('#', '');
        inputs[0].value = parseInt(n.slice(0, 2), 16);
        inputs[1].value = parseInt(n.slice(2, 4), 16);
        inputs[2].value = parseInt(n.slice(4, 6), 16);
        refresh();
    };

    inputs.forEach(i => i.addEventListener('input', refresh));
    set(initialHex || read());
    return { set, read };
}

/* A row of buttons behaving as one radio group - swatches, presets, or a
   two-state segmented toggle. aria-pressed carries the state so CSS and screen
   readers agree. */
export function bindChoices(root, selector, onPick, initial) {
    const buttons = [...root.querySelectorAll(selector)];
    const select = value => {
        buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.value === value)));
        onPick(value);
    };
    buttons.forEach(b => b.addEventListener('click', () => select(b.dataset.value)));
    if (initial !== undefined) select(initial);
    return { select };
}

/* Fill a readout element's [data-out] slots by key. */
export function readout(root) {
    const slots = new Map(
        [...root.querySelectorAll('[data-out]')].map(el => [el.dataset.out, el])
    );
    return values => {
        for (const [key, value] of Object.entries(values)) {
            const el = slots.get(key);
            if (el) el.textContent = value;
        }
    };
}
