# Interactive Labs

A growing collection of free, hands-on 3D learning modules from CreateAccess.
Each lab teaches one skill through a guided, interactive walkthrough in the
browser: watch a demo, then try it yourself. No installs, no accounts.

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

## Contributing

Want to build a module, propose an idea, or suggest an improvement? See
[CONTRIBUTING.md](CONTRIBUTING.md) for how to get involved.

## License

Licensed under the [Apache License, Version 2.0](LICENSE.md).
