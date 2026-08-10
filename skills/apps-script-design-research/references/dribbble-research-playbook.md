# Dribbble research playbook

Use this playbook to find visual references while keeping research attributable, lightweight, and separate from production data flows.

## Recommended connection

### Mode A: public search links

Use this for design inspiration. It needs no credential and should be the default.

- Dribbble search: `https://dribbble.com/search/<query-slug>`
- Dribbble tag: `https://dribbble.com/tags/<tag-slug>`
- Search engine fallback: `site:dribbble.com/shots <query terms>`

Build queries in English because the public design vocabulary is broader. Combine terms from the following groups:

| Dimension | Examples |
| --- | --- |
| Product | inventory, approval, CRM, booking, finance |
| Surface | dashboard, mobile web app, dialog, sidebar |
| Pattern | data table, command palette, filter, wizard, empty state |
| Density | compact, data dense, executive, touch friendly |
| Style | minimal, editorial, playful, monochrome, soft contrast |

Example query set for an inventory approval app:

- `inventory approval dashboard data table`
- `mobile operations dashboard compact cards`
- `approval workflow detail panel`
- `enterprise empty state filter UI`

Keep the query string in the research notes. If a generated Dribbble route does not resolve, use Dribbble's search box or the constrained search-engine fallback rather than guessing shot URLs.

### Mode B: Dribbble API OAuth

Use this only for a real Dribbble account workflow that the user explicitly requests. The official API requires app registration and OAuth. Its documented shots listing returns the authenticated user's shots; do not present it as a global inspiration-search API.

Before implementation:

1. Confirm the required endpoint exists in the current official documentation.
2. Register a Dribbble OAuth application and configure the exact callback URL.
3. Request only the least-privilege scope; read-only account access normally uses `public`.
4. Store client credentials and refreshable secrets in Script Properties or an approved secret manager, never in HTML or source control.
5. Validate OAuth `state`, keep token exchange server-side, redact authorization data from logs, and plan revocation.
6. Respect rate-limit headers and use cache/conditional requests where appropriate.

Apps Script HTML Service redirects and deployment URLs can complicate third-party OAuth callbacks. Verify the chosen callback against Dribbble's current redirect rules before promising this architecture.

Official references:

- [Dribbble API v2 overview](https://developer.dribbble.com/v2/)
- [Dribbble OAuth](https://developer.dribbble.com/v2/oauth/)
- [Dribbble shots endpoints](https://developer.dribbble.com/v2/shots/)
- [Dribbble API terms and guidelines](https://developer.dribbble.com/terms/)

## Prohibited shortcut

Do not scrape public HTML with `UrlFetchApp`, browser automation, or a scheduled crawler. Do not copy, save, or build a searchable mirror of Dribbble content. The API guidelines say product use must rely on API-exposed data and prohibit scraping, copying, saving, or storing Dribbble data.

For a product feature that needs a durable inspiration library, store user-written notes and source URLs rather than Dribbble images or mirrored metadata. Ask the user to confirm rights before storing third-party assets.

## Reference selection

Collect five to eight references when the result set supports it:

- at least three different creators;
- a mix of close product matches and strong pattern matches;
- at least one mobile or narrow-layout reference when mobile matters;
- at least one reference with comparable data density;
- no more than two references that are visually near-identical.

Capture this matrix:

| Reference | Creator | URL | Direct observations | Useful pattern | Risk or mismatch |
| --- | --- | --- | --- | --- | --- |

An observation describes visible evidence, such as "filters remain above the result grid." An inference explains a possible reason, such as "this may reduce filter discovery cost." Keep them separate.

## Synthesis template

Translate the research into decisions:

| Area | Adopt | Adapt | Reject | Reason tied to user task |
| --- | --- | --- | --- | --- |
| Hierarchy |  |  |  |  |
| Layout |  |  |  |  |
| Typography |  |  |  |  |
| Color roles |  |  |  |  |
| Components |  |  |  |  |
| Motion |  |  |  |  |
| Responsive behavior |  |  |  |  |

Then define an original implementation brief:

- semantic color roles and accessible contrast targets;
- type scale and content hierarchy;
- spacing, radius, border, elevation, focus, and motion tokens;
- component anatomy and all interactive states;
- mobile, tablet, and desktop behavior;
- loading, empty, validation, forbidden, success, and failure states;
- `google.script.run` request, duplicate-action, and recovery behavior;
- originality changes that distinguish the result from every single reference.

