# Writing recovered from the old blog

The public Logseq archive links to **Agroecology in Nepal**, authored by “Fin”.
Its Blogger feed still contains four complete posts. They are now restored as
local Markdown, with original publication dates and links back to each post.

Source feed: <https://nepalcando.blogspot.com/feeds/posts/default?alt=json&max-results=50>

| Local slug | Published | Original post | Photos |
| --- | --- | --- | --- |
| `2015-himalayan-earthquake` | 2015-04-28 | <https://nepalcando.blogspot.com/2015/04/2015-himalayan-earthquake.html> | 10 |
| `high-up-in-the-hills` | 2015-02-18 | <https://nepalcando.blogspot.com/2015/02/high-in-hills.html> | 16 |
| `swayambhunath` | 2015-02-18 | <https://nepalcando.blogspot.com/2015/02/swayambhunath-golden-monkey-temple.html> | 9 |
| `down-the-rabbit-hole` | 2015-02-10 | <https://nepalcando.blogspot.com/2015/02/down-rabbit-hole.html> | 2 |

## What changed during recovery

- Blogger layout wrappers, inline font styles, and empty elements became plain
  Markdown paragraphs. Article wording was preserved, not rewritten into a
  retrospective. The normalized text of all four files was compared against
  the feed, excluding images and the documented date correction below.
- The earthquake post's “Saturday, May 25th” became “Saturday, April 25th”, with
  a footnote recording the correction. The post was published in April and
  describes the April 2015 earthquake.
- Contemporary estimates and the relief appeal remain historical text. A
  visible archive note makes this clear. The obsolete YouCaring address and
  shortened photo URL remain readable but are no longer clickable.
- All 37 original photographs were recovered from their full-size image
  links, kept in article order, orientation-corrected, resized to a maximum
  1200px edge, and saved as WebP without EXIF metadata. They live in
  `src/assets/writing/nepal/`, named by article slug and original image order.
  Astro emits local optimized images with dimensions and lazy loading. Alt
  text describes what is visible without guessing people's identities.
- Titles and publication dates come from the feed. Listing summaries, image
  descriptions, and archive notices are new editorial text.

The two older Logseq items, Wageningen and Beneficial Microbes, were short
notes rather than full articles. Their pages now identify that and quote the
actual archive wording, instead of presenting expanded, newly written
reflections as old posts. Both routes are retained.

## Background and UI changes in the same pass

The site is a personal record, not a hiring landing page: the contact pitch is
removed, the footer shows the email address, and the header links directly to
background controls. Gallant remains the shared typeface. The intro leaves
part of the shader unobscured; reading sections have a stronger backing.

The shaders previously had two WebGPU-only startup gates. Three's bundled
WebGL2 backend can render the existing fragment shaders, so the renderer now
uses that backend explicitly and startup no longer tests `navigator.gpu`.
Sound still requires an explicit action. Reduced motion and a saved visuals-off
preference still prevent automatic animation; neither is overwritten.

The WebGL2 renderer was exercised locally with real shaders, rather than a
mocked graphics-ready event. Do not confuse this with testing every physical
GPU or mobile device.
