# Site fonts

Sun Gallant is the display face for the site name and headings. Its license is
published at `public/fonts/gallant-LICENSE.txt`.

IBM Plex Sans is the reading face for body text, captions, and controls. The
unmodified Regular (400), Italic (400), and SemiBold (600) WOFF2 files come from
IBM's Plex repository, pinned to commit
`71f558992315a12ca1f06a2215d57962a1992162`:

`https://github.com/IBM/plex/tree/71f558992315a12ca1f06a2215d57962a1992162/packages/plex-sans/fonts/complete/woff2`

Its SIL Open Font License is published at
`public/fonts/ibm-plex-sans-LICENSE.txt`.

The fonts are served locally. Only Gallant and Plex Sans Regular are preloaded;
italic and semibold are requested when used. Code uses the system monospace face.
