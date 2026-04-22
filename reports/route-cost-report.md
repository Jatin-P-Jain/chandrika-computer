# Route Cost Report

Generated at: 2026-04-22T12:51:08.810Z

| Route | Client JS (KB) | Unique Client JS (KB) | Server JS (KB) | Total (KB) | Client Chunks |
| --- | ---: | ---: | ---: | ---: | ---: |
| /daily-accounts/[accountDate] | 872.12 | 69.88 | 1.39 | 873.51 | 14 |
| /daily-accounts | 831.75 | 29.51 | 1.29 | 833.04 | 13 |
| / | 793.54 | 22.34 | 1.23 | 794.77 | 12 |
| /stamp-register | 778.63 | 7.43 | 1.30 | 779.93 | 12 |
| /photocopy-register | 778.58 | 7.38 | 1.30 | 779.88 | 12 |

## Notes

- Client JS is summed from route client reference chunk paths.
- Unique Client JS is the subset of route chunks not shared with any other route.
- Shared chunks are counted per route to represent per-route cost surface.
- Server JS is measured from .next/server/app/**/page.js for each route.