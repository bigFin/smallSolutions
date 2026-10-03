# Recovered project media

The public Logseq export on `gh-pages` contains useful project images and notes
that were not carried into the first Astro rewrite. This pass uses those public
materials, not `docs/private/` or résumé drafts.

Archive revision: `d9593623aef87c38cec7ff0347a942f6fead0833`.
Its `index.html` contains the exported Logseq database, including image references
and their surrounding project notes. Original media remain in that Git history.

## Images

The selected files are now self-hosted under `src/assets/projects/`. They have
been orientation-corrected, reduced to a maximum 1600px edge, and converted to
WebP without EXIF metadata. Charts use lossless WebP compression after resizing.
Astro generates smaller responsive variants for list previews and detail pages.
Images are not cropped in the page layout; detail images link to the full-size
local asset for inspecting charts and small hardware details.

| Local asset | Source |
| --- | --- |
| `avenue-dashboard.webp` | `gh-pages:assets/image_1688423776023_0.png` |
| `mac-telemetry.webp` | Existing `public/assets/mac-controller.png`; archive equivalent `image_1688434936436_0.png` |
| `plantlet-chambers.webp` | `gh-pages:assets/20220301_165831_1688424417458_0.jpg` |
| `plantlet-room.webp` | `gh-pages:assets/20210602_093135_1688425663509_0.jpg` |
| `plantlet-roots.webp` | `gh-pages:assets/image_1688424512297_0.png` |
| `meristem-three-weeks.webp` | `gh-pages:assets/image_1688424237233_0.png` |
| `meristem-two-weeks.webp` | `gh-pages:assets/image_1688426235943_0.png` |
| `analytical-lab.webp` | `gh-pages:assets/20220512_154003_1688425376241_0.jpg` |
| `analytical-samples.webp` | `gh-pages:assets/20220705_113812_1688425280982_0.jpg` |
| `analytical-chromatogram.webp` | `gh-pages:assets/image_1688436117795_0.png` |
| `prismatic-overview.webp` | `bigFin/Prismatic:infoGraphic8.jpg`, source blob `4e598e05036d4b1d0fbdf4978afca23eb9bd7a1a` |

The original public asset URLs are retained rather than breaking possible
external links. The Prismatic overview no longer depends on an external image
request. It is labelled as an original V1 / FinMax design sheet, not as evidence
of a current product-performance claim.

## Copy supported by the archive

- Avenue: the old page explicitly says co-founder. Its pictured prototype
  dashboard shows northbound/southbound counts in May–June 2023; the caption
  distinguishes it from the current platform.
- MAC: the old notes specify ESP32 hardware, circuit design in KiCad, and
  InfluxDB/Grafana. The image is telemetry, not a photograph of hardware;
  its alternative text and caption now say so.
- Plantlet finishing: KiCad, ESP8266, C++, InfluxDB/Grafana, Docker, and Linux
  are named in the old project notes. The room and chamber photographs were
  embedded in that page.
- Meristem work: the archive explicitly labels the two-week and three-week
  post-dissection photographs. They are presented as recorded stages, not a
  controlled comparison or a claim about propagation success.
- Analytical chemistry: the old notes describe lab design, procurement,
  setup, installation/operational qualifications, and method development for
  simultaneous quantitation of 14 compounds. No throughput or accuracy figures
  have been added.
- Prismatic: the [project README](https://github.com/bigFin/Prismatic) supports
  Finlay's design/build role, the University of Guelph collaborators, the
  organogenesis/regeneration motivation, NodeMCU, Eagle, hand assembly in Guelph,
  and the nine-channel Photon design in the V2 notes. The V2 design is not
  represented as a verified shipped product. The repository currently contains
  an overview, not released circuit/firmware files; the page no longer claims
  that those files are available there.

Other archived material (including the postharvest equipment, photobiology room,
posters, and old motivational graphics) has not been added just to fill space.
