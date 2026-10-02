# Hosting and HTTPS

The site is a static Astro build deployed to GitHub Pages by
`.github/workflows/publish.yml`. The intended public address is
`https://www.small-solutions.ca/`. Cloudflare is not required for HTTPS.

## Current state (checked 2026-10-02)

- Authoritative nameservers are `dns.rebel.com` and `dns2.rebel.com`.
- Both `small-solutions.ca` and `www.small-solutions.ca` resolve to
  `54.208.21.117`, an HTTP forwarding server. Neither accepts HTTPS connections
  from the check environment.
- HTTP requests redirect to
  `http://bigfin.github.io/smallSolutions/#/page/smallsolutions`.
  GitHub then redirects to HTTPS. The old `#/page/...` route is no longer used.
- `https://bigfin.github.io/smallSolutions/` responds successfully over HTTPS.
- The domain has Google mail records. Preserve mail and TXT records; only the
  website records need changing. A nameserver migration is unnecessary.
- Reading the GitHub Pages settings through `gh api` timed out, so the repository's
  custom-domain and certificate settings have not been confirmed.

These are observations, not changes made to the live service. Visitors arriving
through the HTTP forwarding address already end up on a secure GitHub URL, so
this domain repair alone is not proof that WebGPU will work on their device.

## Prepared build change

The workflow now takes `PUBLIC_SITE_URL` and `PUBLIC_SITE_BASE` from
`actions/configure-pages` outputs instead of assuming a `github.io` origin and
`/smallSolutions` path. It will therefore build for either the existing project
URL or the custom domain root, according to the live Pages settings.

Publishing these changes does not change DNS or nameservers. In repository
**Settings → Pages → Build and deployment**, select **GitHub Actions** as the
source, rather than the legacy `gh-pages` branch.

## Cutover (requires permission and account access)

1. Publish and verify the updated workflow before switching domains. Consider
   [verifying ownership in GitHub](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages)
   first; use the TXT value GitHub provides, without replacing existing TXT records.
2. In the repository's **Settings → Pages**, set **Custom domain** to
   `www.small-solutions.ca`. Set the domain in GitHub before pointing DNS at
   GitHub Pages, to avoid leaving an unclaimed domain pointing at shared hosting.
3. Re-run **Deploy site** after saving the custom domain. Confirm the build uses
   the custom origin and `/` base path. Coordinate this with the DNS change:
   GitHub redirects the old project URL to the custom domain, so a temporary
   interruption is possible during the switch.
4. At Rebel, disable the old website forwarding and replace the website DNS
   records with the records below. Preserve unrelated records, especially
   Google's MX records and all mail-related TXT records.
5. Once GitHub finishes its DNS check and provisions the certificate, enable
   **Enforce HTTPS**. GitHub says this option can take up to 24 hours to become
   available. Verify both domain variants, redirects, asset loading, and a
   project detail page before calling the cutover complete.

### Website DNS records

| Type | Name | Value |
| --- | --- | --- |
| CNAME | `www` | `bigfin.github.io` |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |

Remove the conflicting website A records pointing at `54.208.21.117` rather
than adding GitHub addresses alongside them. The CNAME is a hostname only:
no scheme, repository name, or path. With both apex and `www` records configured,
GitHub Pages redirects the apex to the configured `www` domain.

For this Actions-based deployment, a `public/CNAME` file is not required and
would not configure the domain: the repository's Pages settings own it.

Source: [GitHub's custom-domain guide](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

## Local build checks

Custom domain:

```sh
PUBLIC_SITE_URL=https://www.small-solutions.ca PUBLIC_SITE_BASE=/ bun run test
```

Existing project URL:

```sh
PUBLIC_SITE_URL=https://bigfin.github.io PUBLIC_SITE_BASE=/smallSolutions bun run test
```

WebGPU also requires browser/device support. Test actual rendering on a supported
device separately from HTTPS; the headless graphics engine failed on both the
original site and the refreshed site during local checks.
