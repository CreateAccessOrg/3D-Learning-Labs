# Interactive Labs

A growing collection of free, hands-on 3D learning modules from CreateAccess.
Each lab teaches one skill through a guided, interactive walkthrough in the
browser — watch a demo, then try it yourself. No installs, no accounts.

This is the monorepo behind them: the repo root is the landing page that links
out to every lab, and each module lives in its own folder under `labs/`.

```
index.html                      landing page (markup + inline CSS)
assets/                         landing page images
labs/                           interactive labs
```

Labs are meant to teach creators 3D concepts in a fun, interactive way.

## Run it

No build step. Modules use ES modules and load `.glb` assets, so open it through
a server rather than `file://`:

```bash
npx serve .
# → http://localhost:3000
```

## Adding a module

1. Drop the module in `labs/<module-name>/` with its own `index.html` and
   relative `css/`, `js/`, `assets/` paths.
2. Add a screenshot to `assets/`.
3. Copy a `.card` block in the root `index.html` and point `href` at
   `labs/<module-name>/`.

## Contributing a module or idea

These labs grow from what people want to teach and learn. There are three ways
to get involved, from most to least hands-on:

- **Build a module (Pull Request).** Follow *Adding a module* above, then open a
  PR against `main`. Include a short note on what the module teaches and a
  screenshot so it's easy to review.
- **Propose a module (Issue).** Not ready to build it? Open an Issue describing
  the concept, including the skill or idea it teaches, the interaction you imagine, and
  who it's for. A rough sketch is plenty; we'll shape it together.
- **Suggest an improvement (Issue).** Spotted something confusing, broken, or
  worth adding to an existing lab? Open an Issue and tell us what you'd change.

No idea is too small, and you don't need to know the codebase to suggest one!
