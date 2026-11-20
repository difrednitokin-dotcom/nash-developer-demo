# Current mark

User-supplied `C:/Users/Hp/Downloads/14550194.webp`, copied unchanged to `nd-symbol.webp` (256 × 256, transparent).

- `nd-symbol.png`: lossless format conversion of the supplied WebP.
- `nd-symbol.svg`: self-contained SVG wrapper embedding that PNG, preserving its exact shape. White on the dark theme, inverted by CSS on the light theme.
- `favicon.svg` / `favicon.png`: white supplied mark inside a black square. Corner radius 24/256; mark 192/256, centered with 32/256 padding. Transparent outside the rounded corners.
- `favicon.ico`: PNG-backed 32-bit frames, 16/32/48/64/128/256 px.
- `apple-touch-icon.png`: same composition at 180 px.

`tools/build-brand.ps1` recreates the assets deterministically using FFmpeg for format conversion and Windows System.Drawing for icon packaging. No generative redesign was used.

The previous provided mark and wordmark are archived in `references/brand-original`; originals in the user's `Шаблон` folder remain unchanged. The UI kit now uses the current live brand component instead of the old wordmark bitmap.
