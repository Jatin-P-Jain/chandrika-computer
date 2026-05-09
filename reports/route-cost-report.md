# Route Cost Report

Generated at: 2026-05-09T03:41:35.810Z

| Route | Client JS (KB) | Unique Client JS (KB) | Server JS (KB) | Total (KB) | Client Chunks |
| --- | ---: | ---: | ---: | ---: | ---: |
| /daily-accounts/[accountDate] | 870.11 | 67.32 | 1.39 | 871.50 | 14 |
| /daily-accounts | 832.17 | 29.38 | 1.34 | 833.51 | 13 |
| / | 795.13 | 23.37 | 1.26 | 796.39 | 12 |
| /photocopy-register | 778.72 | 6.96 | 1.34 | 780.06 | 12 |
| /stamp-register | 778.44 | 6.68 | 1.33 | 779.77 | 12 |

## Notes

- Client JS is summed from route client reference chunk paths.
- Unique Client JS is the subset of route chunks not shared with any other route.
- Shared chunks are counted per route to represent per-route cost surface.
- Server JS is measured from .next/server/app/**/page.js for each route.