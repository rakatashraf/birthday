# Birthday photo slideshow

A static HTML, CSS, and JavaScript birthday slideshow with ten portraits, narration, original synthesized ambient music, a looping celebration scene, and an animated canvas charm layer. No framework, package installation, environment variables, or server is required.

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

Open `http://localhost:8000`. Photos are scaled proportionally to fit the available screen without cropping, stretching, hover zoom, or changes to the original files. Quotes occupy a separate row below the image. A portrait photo on a wide screen leaves space at the sides so the whole photo remains visible.

Music and narration attempt to start on page load. No sound button is shown. Browsers control audible autoplay and may require a real tap/click anywhere on the page or a keypress; the site retries audio from those events and cannot grant permission on the visitor's behalf. Narration availability also depends on the browser and installed voices. Playback continues even when speech is rejected or fails to complete.

The ambient soundtrack is an original eight-bar sequence synthesized locally with sine oscillators, soft envelopes, and quiet sustained chords. It includes no third-party recordings, samples, or downloaded tracks. Its code is included under the repository's existing MIT license. The existing WAV asset is retained for compatibility but is not played by this version.

The automated checks cover all asset references, the three Vercel output roots, synchronized HTML copies, and speech completion/error/timeout handling, including the full slideshow and celebration loop.


## Birthday atmosphere and narration

The image sits above an animated decorative layer of hearts, ribbons, balloons, cakes, gifts, and sparkles. Only the unused space around the opaque photo reveals the decorations. Captions remain in a separate row, and reduced-motion preferences disable the floating animation.

The music master gain is 0.38, increased from 0.16 (about +7.5 dB). The portrait margins use a canvas animation with floating hearts, sparkles, balloons, gifts, cakes, and symbols; the charms twinkle, rotate, drift upward, and respond gently to pointer movement while remaining behind the full photo. Narration uses normal pitch and near-normal speed, preferring installed natural/enhanced or online English voices when available. Browser speech quality still varies by device. A genuinely human recording or generated neural voiceover must replace browser synthesis for consistent natural narration; voice cloning has not been configured.
