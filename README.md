# Birthday photo slideshow

A static HTML, CSS, and JavaScript birthday slideshow with ten portraits, visual captions, a user-provided background track, a looping celebration scene, and an animated canvas charm layer. No framework, package installation, environment variables, or server is required.

## Vercel deployment

Import `rakatashraf/birthday` and use the repository root as the Root Directory. The root `vercel.json` selects the **Other** framework preset, skips installation and compilation, and publishes `photo-collage` so `/` serves its `index.html` and `/assets/*` serves its media.

## Local preview and checks

From the repository root:

```sh
python3 -m http.server 8000 --directory photo-collage
node --test tests/slideshow.test.cjs
```

Open `http://localhost:8000`. Photos are scaled proportionally to fit the available screen without cropping, stretching, hover zoom, or changes to the original files. Quotes occupy a separate row below the image. A portrait photo on a wide screen leaves space at the sides so the whole photo remains visible.

The uploaded track is served as `photo-collage/assets/background-music.mp3`, configured to loop and start automatically. No sound button is shown. Browsers control audible autoplay and may require a real tap/click anywhere on the page or a keypress; the site retries playback from those events and cannot grant permission on the visitor's behalf. Captions are visual-only and browser text-to-speech is disabled.

The automated checks cover the canonical Vercel output, all asset references, the uploaded audio file, autoplay retry behavior, and the full slideshow and celebration loop.


## Birthday atmosphere

The image sits above an animated decorative layer of hearts, ribbons, balloons, cakes, gifts, and sparkles. Only the unused space around the opaque photo reveals the decorations. Captions remain in a separate row, and reduced-motion preferences disable the floating animation.

The portrait margins use a canvas animation with floating hearts, sparkles, balloons, gifts, cakes, and symbols; the charms twinkle, rotate, drift upward, and respond gently to pointer movement while remaining behind the full photo. The duplicate folder trees and unused synthesized/WAV audio were removed so the repository has one canonical app and one background track.
