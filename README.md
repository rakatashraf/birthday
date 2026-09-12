# Birthday photo slideshow

A static HTML, CSS, and JavaScript birthday slideshow with ten portraits, optional narration and music, and a looping celebration scene. No framework, package installation, environment variables, or server is required.

## Vercel deployment

Import `rakatashraf/birthday` and use the repository root as the Root Directory (recommended). The root `vercel.json` selects the **Other** framework preset, skips installation and compilation, and publishes `photo-collage` so `/` serves its `index.html` and `/assets/*` serves its media.

Existing Vercel projects with Root Directory `photo-collage` or `photo-collage/photo-collage` are also supported by a local `vercel.json` publishing `.`. These configurations intentionally override incompatible framework, install, build, and output settings. Keep the existing project's Git integration connected to `main` for production deployments.

The nested folder is an existing identical copy retained for compatibility with projects that already point there. Update both HTML copies when editing the slideshow. All original media is retained.

## Local preview and checks

From the repository root:

```sh
python3 -m http.server 8000 --directory photo-collage
node --test tests/slideshow.test.cjs
```

Open `http://localhost:8000`. The show starts silently. Use **Enable sound** to enable browser narration and background music, or **Mute sound** to turn them off. Speech availability depends on the browser and installed voices; the slideshow continues when narration is unavailable, rejected, or fails to complete.

The automated checks cover all asset references, the three Vercel output roots, synchronized HTML copies, and speech completion/error/timeout handling, including the full slideshow and celebration loop.
