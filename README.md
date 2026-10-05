# CliqueAqui

## /brag

This repo includes the [`/brag`](https://github.com/latent-spaces/brag) agent skills (vendored from `latent-spaces/brag@cb89b9f`, MIT):

- `.claude/skills/brag/` — `/brag`, the full Hyperframes workflow (music + SFX bundled)
- `.claude/skills/brag-slim/` — `/brag-slim`, the single-file version

In Claude Code, from this repo, run `let's /brag` to turn the project into a short launch video. Output goes to `brag-output/` (git-ignored).

Requirements for the full workflow: Node.js 22+, FFmpeg on `PATH`, and the Hyperframes CLI (`npx hyperframes doctor`).
