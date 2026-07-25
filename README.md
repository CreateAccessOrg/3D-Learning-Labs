# Interactive Labs

Monorepo for the CreateAccess 3D learning modules. The repo root is the landing
page; each module lives in its own folder under `labs/`.

```
index.html                      landing page (markup + inline CSS)
assets/                         landing page images
labs/
  navigate-and-transform/       Navigate + Transform lab
  materials/                    Materials lab (color, roughness, metalness)
```

Labs share a narrative shape: a docked caption panel drives numbered steps, each
one running a "Watch" demo and then waiting for the student to do the same thing
themselves before Continue unlocks. Controls are revealed as the step that
teaches them arrives, never before.

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

## Deploy

Published with GitHub Pages at
https://createaccessorg.github.io/Navigate-and-Transform-Lab/. The landing page
is served from the root, and the lab from
`/Navigate-and-Transform-Lab/labs/navigate-and-transform/`.

`.nojekyll` keeps Pages from running Jekyll over the files.
