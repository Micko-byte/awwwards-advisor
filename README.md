# awwwards-advisor

A Claude Code skill that researches [Awwwards](https://www.awwwards.com) winners for one area of a website (hero, footer, nav, scroll transitions...), views the reference sites in a browser, and recommends a build tailored to your own frontend projects and stack.

- Names the exact page/section each idea comes from, with links to the live site and its Awwwards page.
- Writes a replication brief (layout, type, colour, motion, responsive, reduced-motion, file mapping) for the option you approve.
- Learns from your projects: `scripts/scan-projects.mjs` builds a local `profile.md` (libraries, fonts, colour tokens, patterns) and the skill keeps a decision log in it.
- Rebuilds the technique in your brand; it does not copy code, text or imagery.

## Install

```bash
git clone https://github.com/Micko-byte/awwwards-advisor ~/.claude/skills/awwwards-advisor
```

Needs Node 18+ for the scanner, and a browser tool (Claude's built-in browser pane or Claude in Chrome) for viewing references.

## Use

Ask Claude e.g. "run awwwards-advisor on the footer of my site". To build or refresh your profile:

```bash
node ~/.claude/skills/awwwards-advisor/scripts/scan-projects.mjs <project-folder> [<folder> ...]
```

`profile.md` is git-ignored because it contains your project paths and decisions. See `profile.example.md` for the shape.
