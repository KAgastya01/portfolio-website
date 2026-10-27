# KAgastya01 Portfolio

A responsive, static portfolio site with six animated GitHub contribution visualizations. The contribution data is generated locally from GitHub's GraphQL API and loaded from `data/github.json`; the portfolio does not call GitHub at page-request time.

## Contribution visualizations

- **Contribution field:** animated calendar grid, contribution counter, and per-day hover details.
- **Commit skyline:** isometric daily blocks whose height reflects activity.
- **Weekly pulse:** weekly totals line that resolves into the calendar.
- **Contribution orbit:** circular weekday rings and a sweeping hand.
- **Streak trail:** recent 12-week activity trace and current streak count.
- **Activity, decoded:** terminal-inspired command typing and contribution glyphs.

All six canvases scale to their container and use a device-pixel ratio capped at 2. Animations start only when at least 40% of a canvas is visible, stop rendering off-screen, include Replay controls, and respect `prefers-reduced-motion`.

## Generate your real contribution data

Requirements: Node.js 18+ and a GitHub token, or the GitHub CLI (`gh`) authenticated with your account.

### Option A: GitHub CLI

```bash
gh auth login
npm run fetch-github
```

### Option B: Environment variable

Create a token with permission to read your public profile data, then set it in your shell. Do not commit the token or paste it into source files.

PowerShell:

```powershell
$env:GITHUB_TOKEN = "YOUR_TOKEN"
npm run fetch-github
```

macOS/Linux:

```bash
export GITHUB_TOKEN="YOUR_TOKEN"
npm run fetch-github
```

The script checks `GITHUB_TOKEN` first, then falls back to `gh auth token`. It makes one GraphQL request and writes only public contribution-calendar data to `data/github.json`. The token is never written to disk. If you use a token, close the terminal when finished and avoid saving it in shell history where possible.

To fetch another account, set `GITHUB_USERNAME` before running the command:

```bash
GITHUB_USERNAME=someuser npm run fetch-github
```

PowerShell:

```powershell
$env:GITHUB_USERNAME = "someuser"
npm run fetch-github
```

## Preview locally

Because browsers may block local JSON fetches from `file://`, serve the folder over HTTP. For example, with Python installed:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

The starter `data/github.json` intentionally contains no activity. Until you run the fetch command, the visualizations show a clear setup prompt rather than invented contributions.

## Deploy

Commit the generated `data/github.json` if you want the deployed portfolio to display that snapshot. The JSON contains dates and contribution counts, not credentials. Re-run `npm run fetch-github` and commit the updated JSON whenever you want to refresh it. The static page itself never needs a token.

## Project structure

```text
.
├── index.html
├── styles.css
├── script.js
├── github-activity.js
├── scripts/
│   └── fetch-github.mjs
├── data/
│   └── github.json
└── package.json
```
