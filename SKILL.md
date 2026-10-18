---
name: awwwards-advisor
description: Design-inspiration advisor that researches Awwwards for a specific area of a website (hero, nav, footer, scroll transitions, portfolio grid, e-commerce, 3D, typography, colour) and recommends what to build, tailored to the user's own frontend projects and stack. Use when the user asks for design inspiration, "what do winning sites do for X", references Awwwards, or wants a design decision on a section of their site.
---

# Awwwards Advisor

Turns Awwwards into a decision aid: find real winning sites for one design area, extract the technique, then recommend what fits *this user's* stack and taste.

## 1. Load the user's profile
Read `profile.md` next to this file. It lists their libraries, fonts, colour tokens, patterns and past decisions across projects.
- If missing or older than ~30 days, refresh it first:
  `node ~/.claude/skills/awwwards-advisor/scripts/scan-projects.mjs <roots...>`
  Roots: ask the user which project folders to scan (the script searches each to depth 3 for `package.json`). Remember the answer in `profile.md`. (The script keeps the Decision log when regenerating.)
- If the user is working in a specific project, also skim that project's actual components for the area in question.

## 2. Pin down the area
One design area per run (hero, nav, footer, page transition, card grid, cursor, loader, pricing, etc.). If the user was vague, pick the most likely one and say so; ask only if two readings would give very different answers.

## 3. Pull references from Awwwards
Use WebFetch (fall back to `mcp__firecrawl__firecrawl_scrape`) on filtered listings. Verified URL patterns:
- Latest winners: `https://www.awwwards.com/websites/sites_of_the_day/`
- By tag/category: `/websites/<tag>/` e.g. `scrolling`, `animation`, `3d`, `portfolio`, `e-commerce`, `fashion`, `architecture`, `single-page`, `ui-design`
- By tech: `/websites/react/`, `/websites/webgl/`, `/websites/webflow/`, `/websites/shopify/`
- By font: `/websites/<Font%20Name>/`; by colour: `/websites/%23HEX/`
- Pagination: `?page=N`

Pick the filter that matches the area AND the user's stack (e.g. `react` + `scrolling`). Choose 3-5 sites, then **actually view every one you will cite**: navigate to its link in the built-in browser (`mcp__Claude_Browser__navigate`), scroll to the exact section, take screenshots (desktop 1440 and mobile 390 via `resize_window`), and watch the motion by scrolling/hovering and re-screenshotting. Also open its Awwwards page for jury scores and credits. Text-only `WebFetch` is for shortlisting, not for judging a design; never describe a site's look or motion from markup alone. If a site blocks the browser or fails to load, say so and drop it or label the details "unverified". Extract concrete technique: layout, motion type and timing, type scale, colour approach, interaction details. Listing pages show only name, developer and award - no tech tags - so open each site (or its `awwwards.com/sites/<slug>` page) to learn technique; view-source for library hints (gsap, lenis, three) when useful. Prefer recent winners (Site of the Day / Developer Award). Do not invent details you did not see; if a page didn't load, say so.

## 4. Recommend
Output, kept short:
1. **References** - 3-5 sites. Each one states, specifically, *where on that site* the design comes from: the page and section (e.g. "homepage, footer, last ~100vh" / "case-study page, hero") plus what you saw there. Every reference MUST carry two clickable links so the user can see what they are approving: the live site URL (deep-link to the page/anchor when one exists) and its Awwwards page (`https://www.awwwards.com/sites/<slug>`, or the listing page it came from if the slug is unknown). Mark which reference each recommendation is based on, and mark any detail you could not verify. Never recommend or build from a reference you have not linked.
2. **Pattern** - the common technique across them.
3. **Recommendation for you** - one primary option, one alternative. Tie it to their profile: use libraries they already have (e.g. GSAP vs Framer Motion if one is already installed), match their fonts/tokens, note what's *new* to add and its cost (bundle size, mobile perf).
4. **Pitfalls** - performance, mobile, accessibility (reduced motion), and anything that clashes with their existing projects.
5. **Replication brief** - for the recommended option, a spec Claude can build from in the target project (see section 4b). Include it after approval, or up front if the user asked for it.
6. **Approval gate** - end by asking which reference/option they approve, pointing back to the links above. Do not edit their code until they approve one.

Be opinionated. Awwwards sites optimise for jury wow, not conversion or Kenyan mobile bandwidth - flag when a trend is a poor fit for the user's audience.

## 4b. Replication brief
Evidence first: re-open the approved reference's link (even if you viewed it during research, view it again now with the build in mind), go to the exact page/section in the built-in browser (`mcp__Claude_Browser__*`) at desktop (1440) and mobile (390), screenshot it, and read computed styles / `@keyframes` / inline transitions via `javascript_tool` (inspection only). Without that, mark values as "estimated". WebFetch markup alone is not enough for motion or type scale. Keep the reference tab open while building and look back at it as you go, not only at the end.

Write the brief with these headings, each tied to what was observed:
- **Source** - site, page, section, links, viewport(s) captured.
- **Layout** - grid/columns, section height, spacing scale, alignment, z-order of layers.
- **Type** - role, size (px/clamp), weight, case, tracking, line-height.
- **Colour** - fill, text, accent, gradients, and the closest tokens in the target project.
- **Motion** - per element: trigger (load / scroll / hover / in-view), property animated, duration, easing, delay/stagger, scrub vs once, loop. Name the library to use from the user's profile (GSAP ScrollTrigger / framer-motion / Lenis) and give the call shape, not copied source.
- **Responsive** - what changes at tablet/mobile; what is removed on touch.
- **Reduced motion and perf** - fallback state, what is GPU-only (transform/opacity), cost on mid-range Android.
- **Map to project** - which file/component to change, which tokens/fonts to reuse, what to leave alone.

Replicate the technique and layout in the user's own brand. Do not copy source code, copy text, images, logos or illustrations from the reference, and do not pixel-clone it. After building, screenshot the result at both viewports and compare against the reference captures.

## 5. Learn
After the user picks a direction, append one line to the **Decision log** in `profile.md`: date, project, area, choice, reference site, reason. Future runs should respect past choices and flag when a new suggestion contradicts one.
