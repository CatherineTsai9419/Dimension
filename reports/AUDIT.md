# Portfolio performance audit — 2026-09-10

## Scope and findings

Baseline: clean `5cc2ac8` checkout; file content matches the original master checkout. Nine static HTML pages and five local CSS files; no application bundle, package manifest or build pipeline.

1. Large raster assets dominate loading. The referenced Aitify GIF is 50.91 MiB. PNGs such as TUE_pic04 (10.33 MiB, 3457×1958), TUE_pic01 (7.90 MiB, 3457×1647), EmotionalOcean_banner (6.75 MiB, 4321×1769), and TaoyuanGo_pic12 (6.68 MiB, 3463×2363) are large.
2. Works thumbnails Banner_02/Banner_03 are 5751×5751 and OneDegree is 5752×5751, despite a desktop 35vw card height. Hover scales images by 1.3, which also needs resolution headroom.
3. No original images had native lazy loading. Long case studies compete with first-screen resources; YouTube also loaded eagerly.
4. No original hero was incorrectly lazy loaded. Index has layered decorative first-screen blocks; case-study banners are full-width and animated. Their presentation should be preserved.
5. Index loaded unused AOS and jQuery. Most other pages loaded unused and sometimes duplicate jQuery; Works requires jQuery for filtering. Bootstrap is required by the navigation and Aitify carousel.
6. Head scripts synchronously blocked HTML parsing. Deferred scripts require matching deferred initialization.
7. All pages requested 18 Montserrat style/weight combinations. `display=swap` and preconnect already existed. Italic 200 is needed by navigation; italic 500 is inherited by the homepage typewriter. Raleway is named in CSS but not loaded; adding it would change current typography.
8. Most images lack reserved proportions, creating potential CLS during loading. Adding fixed HTML width/height can override an auto-sized CSS axis and reproduce the earlier distortion. Use `aspect-ratio: auto W / H` on non-homepage images, preserving natural ratios after decode.
9. Homepage wheel handlers repeatedly change width/position and can cause layout work. Existing transitions/animations are preserved pending interaction profiling.
10. Large files such as blackbackground.png (9.96 MiB) and bg_01.png (6.18 MiB) are not current HTML/CSS image references; their presence on disk is not itself a page-load cost. PNG/JPG are compressed formats; size alone does not prove they are uncompressed.

## Changes

- All nine HTML pages: use smaller lossless WebP alternatives where beneficial; preserve every original file. Full-size outputs were decoded and compared against original visible RGB pixels and alpha. Larger lossless JPEG conversions were neither referenced nor retained.
- `index.html`: responsive versions for five square decorative blocks, retaining full-size fallback; only the title receives high fetch priority. Keep the reveal portrait eager to preserve immediate interaction. Remove unused AOS/jQuery; defer Typewriter and Bootstrap with DOMContentLoaded initialization.
- `works.html`: responsive variants for square cards (480/960/1920 where smaller than original); retain the non-square OneDegree card's original dimensions. The declared sizes include hover headroom. Remove unused AOS and duplicate jQuery; retain filtering dependency.
- Other pages: lazy-load images below the initial banner, reserve their natural proportions, defer AOS/Bootstrap, refresh AOS after lazy images load, remove unused jQuery. About/Works header images stay eager. Input image buttons retain their original behavior: HTML input does not support native image lazy loading.
- `EmotionalOcean.html`: lazy-load the embedded YouTube frame.
- Font requests: remove only weight 800/900 in both styles; preserve 100–700, including italic variants, and retain swap/preconnect. Self-hosting/preloading fonts is deferred until critical font subsets can be measured.
- `css/`: unchanged. Brand colors, content, class names, animation definitions and breakpoints retained.
- `img/optimized/`: generated full-size assets plus 22 responsive variants; full-size preservation avoids intrinsic-size changes in uncertain layouts.
- `tools/`: conversion and verification scripts, plus local comparison server. Require Node, Sharp and Playwright; SHARP_MODULE/PLAYWRIGHT_MODULE can point to installed packages. Transformation scripts were used sequentially on the clean baseline and should not be blindly rerun on edited HTML.

## Validation

- Asset category: local references and full-size image dimensions checked; visible full-size pixels match originals. The first whitespace check found existing trailing spaces on a changed line; fixed before continuing.
- Resource category: all inline scripts parse; no missing local src references; git diff --check passes.
- Browser: all 9 pages at 390, 768 and 1440 CSS pixels compared against HEAD, with external fonts/CSS/JS loaded. Every image's width, height and x/y position after load agrees within 1 CSS pixel. Homepage responsive update additionally rechecked. Tests freeze CSS animations for geometry, not their motion timing.
- Interaction checks at mobile DPR 2: navigation collapse, homepage portrait reveal, typewriter and Works App filter pass without script errors. Full manual carousel/motion review remains recommended.
- No build command exists; static checks and browser verification substitute for build verification.
- Sandbox initially blocked CDN traffic; that run was discarded and browser checks rerun with network access.

## Lighthouse

Lighthouse 13.4.1, localhost, mobile simulated throttling, Performance category. One run per reported version, not a production/field benchmark. CDN timing and concurrent local activity can influence the comparison. Original JSON retained.

| Metric | Original | Final |
|---|---:|---:|
| Performance | 67 | 68 |
| FCP | 2.8 s | 2.8 s |
| LCP | 44.0 s | 15.8 s |
| CLS | 0 | 0 |
| TBT | 40 ms | 0 ms |

LCP improved substantially but remains poor. FCP did not improve in this run. CLS stays zero on the homepage; detail-page field CLS has not been measured. INP requires real interaction/field measurement and is not interchangeable with TBT. Score improvement is modest; do not infer a percentage score gain from file savings.

## Image accounting and remaining work

92 smaller full-size alternatives: 182,420,007 bytes → 112,903,974 bytes (38.1% reduction). This sums distinct full-size assets; it is neither initial page transfer nor the total repository size. Originals and responsive variants add disk space. See image-sizes.md and images.json for every file, exact dimensions, before/after bytes, usage decision, and variant sizes.

Deferred higher-risk work: animated GIF → video conversion (playback/autoplay/accessibility review), AVIF or lossy compression (visual approval), full responsive resizing of complex detail illustrations and the non-square thumbnail (measured target sizes and large-screen QA), wheel animation refactor (preserve feel), removing large CSS frameworks (coverage across interactions), font self-hosting, production cache/Brotli/CDN settings. These require further validation and were not silently applied. Large unused source assets and PSDs were not deleted.

No commit, push, PR update or deployment was performed.
