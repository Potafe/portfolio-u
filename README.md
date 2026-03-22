# portfolio-u

A code-first portfolio site that auto-generates itself from a single LaTeX résumé file. Drop in your `.sty`, run `yarn dev`, and get a fully animated, dark-themed portfolio — no manual JSON editing, no CMS, no config files to maintain.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)



## What it looks like

| Section | Features |
|---|---|
| **Loading Screen** | Terminal-style boot sequence with step-by-step progress |
| **Hero** | Animated name split, typing role effect, skill chips, magnetic social links |
| **About** | Bio paragraph, stats grid (years of exp, projects shipped, etc.), education card |
| **Experience** | Scroll-fill timeline, entry animation, active-section glow dot |
| **Projects** | 3-D tilt cards, spotlight glow, `layoutId` zoom-expand to full case study modal (Problem → Solution → Impact) |
| **Beyond Code** | Extracurricular cards with entrance animations |
| **Navbar** | Fixed top, GSAP entrance, scroll-aware backdrop blur, active-section tracking, mobile drawer |



## Tech stack

| Layer | Library |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + TypeScript 5 (strict) |
| Primary animation | Framer Motion 12 |
| Timeline / scroll animations | GSAP 3 + ScrollTrigger |
| Smooth scroll | Lenis 1.3 |
| Styling | Raw CSS modules in `globals.css` (dark-first, no Tailwind utilities) |
| Linting | ESLint 10 + `@typescript-eslint`, commitlint, husky |



## Using this for your own portfolio

The entire site is driven by **one file**: `src/data/resume.sty`.

### 1. Fork / clone

```bash
git clone https://github.com/Potafe/portfolio-u.git
cd portfolio-u
yarn install
```

### 2. Replace the résumé

Delete `src/data/resume.sty` and add your own file with the same name. The parser expects the following LaTeX structure:

```latex
% ── Contact ────────────────────────────────────────────────────────────────
\begin{document}
\begin{center}
    {\Huge \scshape Your Full Name} \\ \vspace{1pt}
    \small +1 555-000-0000 ~ $|$ ~
    \href{mailto:you@example.com}{\underline{you@example.com}} ~ $|$ ~
    \href{https://linkedin.com/in/you}{\faIcon{linkedin} LinkedIn} ~ $|$ ~
    \href{https://github.com/you}{\faIcon{github} GitHub}
\end{center}

% ── Education ──────────────────────────────────────────────────────────────
\section{Education}
  \resumeSubHeadingListStart
    \resumeSubheading
      {Your University}{City, Country}
      {B.Tech / B.S. in Computer Science}{Aug. 2020 -- May 2024}
      \resumeItemListStart
        \resumeItem{GPA: 3.9/4.0}
      \resumeItemListEnd
  \resumeSubHeadingListEnd

% ── Experience ─────────────────────────────────────────────────────────────
\section{Experience}
  \resumeSubHeadingListStart
    \resumeSubheading
      {Software Engineer}{Jan 2024 -- Present}
      {Acme Corp}{Remote}
      \resumeItemListStart
        \resumeItem{Built X, improved Y by Z\%}
      \resumeItemListEnd
  \resumeSubHeadingListEnd

% ── Projects ───────────────────────────────────────────────────────────────
\section{Projects}
  \resumeSubHeadingListStart
    \resumeProjectHeading
        {\textbf{My Project} $|$ \emph{React, Node.js, PostgreSQL} $|$ \projectlink{https://github.com/you/project}}{Jan 2024}
        \resumeItemListStart
          \resumeItem{What it does and the impact it had}
        \resumeItemListEnd
  \resumeSubHeadingListEnd

% ── Skills ─────────────────────────────────────────────────────────────────
\section{Technical Skills}
 \begin{itemize}[leftmargin=0.15in, label={}]
    \small{\item{
     \textbf{Languages}{: JavaScript, TypeScript, Python, Go} \\
     \textbf{Frameworks}{: React, Next.js, Express, FastAPI} \\
     \textbf{Tools}{: Docker, Git, AWS, PostgreSQL}
    }}
 \end{itemize}

% ── Extracurriculars (optional) ────────────────────────────────────────────
\section{Extra-Curricular Activities}
  \resumeSubHeadingListStart
    \resumeSubheading
      {Club President}{Sep 2022 -- May 2023}
      {Coding Club, Your University}{City}
      \resumeItemListStart
        \resumeItem{Organised 10+ workshops, grew membership by 3×}
      \resumeItemListEnd
  \resumeSubHeadingListEnd
```

> **Rules the parser enforces**
> - `\resumeSubheading{role}{date}{org}{location}` — used for both Experience and Education
> - `\resumeProjectHeading{...}` — title, tech stack inside `\emph{}`, optional `\projectlink{url}`
> - `\textbf{Category}{: item1, item2}` inside a Skills `itemize` block
> - `\resumeItem{text}` for bullet points everywhere

### 3. Run it

```bash
yarn dev        # http://localhost:3000
yarn build      # production build
yarn start      # serve the production build
```

The API route `GET /api/resume` reads `src/data/resume.sty` at runtime and returns parsed JSON. Every page reload reflects your latest résumé edits — no build step needed during development.

### 4. Personalise

| What | Where |
|---|---|
| Colour accent (default purple `#7c3aed`) | `src/styles/globals.css` — search `7c3aed` |
| Bio paragraph in About section | Edit `About.tsx` around the hardcoded bio string |
| Project challenge/solution keywords | `deriveChallenge()` in `Projects.tsx` |
| Section order | `src/app/page.tsx` |
| Fonts | `globals.css` `:root` / `html` block |



## Project structure

```
src/
├── app/
│   ├── api/resume/route.ts   # GET — parses resume.sty → JSON
│   ├── layout.tsx            # Root layout: Lenis smooth scroll + Navbar
│   └── page.tsx              # Orchestrates loading → sections
├── animations/
│   ├── heroAnimation.ts      # GSAP entrance timeline + orb float
│   └── scrollReveal.ts       # ScrollTrigger helpers (stagger, scramble)
├── components/
│   ├── sections/             # Hero, About, Experience, Projects, Extracurriculars, Contact
│   └── ui/                   # Button, Navbar, SmoothScroll
├── data/
│   └── resume.sty            # ← YOUR ONLY INPUT
├── hooks/
│   ├── parseResume.ts        # LaTeX → Resume object
│   └── useGsap.ts            # useGsapContext, useScrollReveal, useMagnetic
├── styles/
│   └── globals.css           # All styles (dark theme, sections, components)
└── types/
    └── resume.types.ts       # TypeScript types for the parsed Resume
```



## Scripts

```bash
yarn dev          # Next.js dev server with Turbopack
yarn build        # Production build + type-check
yarn lint         # ESLint
yarn lint:sarif   # ESLint → SARIF (for SonarQube / GitHub Code Scanning)
```



## Roadmap / next steps

Contributions and ideas welcome. Rough priority order:

- [ ] **Resume download** — Add a floating "Download PDF" button that serves the original `.sty`-compiled PDF or generates one via `puppeteer`/`@react-pdf/renderer` from the parsed data
- [ ] **Cloud hosting with custom domain** — Terraform/CDK module for AWS (CloudFront + S3 static export, or App Runner for SSR) or GCP (Cloud Run + Cloud CDN); include GitHub Actions CI/CD pipeline and custom domain wiring
- [ ] **Remote résumé fetching** — Accept a URL via an env var (`RESUME_URL`) so the API route fetches the `.sty` from a GitHub Gist, S3 bucket, or Dropbox link instead of reading from disk — no re-deploy required to update content
- [ ] **Real-time résumé sync** — Watch the remote source for changes (polling or webhook) and trigger an ISR revalidation (`revalidatePath`) so the live site always reflects the latest version within seconds
- [ ] **`/api/resume` public endpoint** — Expose the parsed JSON as a documented REST endpoint so other tools (CLI, VS Code extension, Raycast widget) can consume it
- [ ] **Theme switcher** — Light / dark / system toggle with CSS custom-property swapping, persisted to `localStorage`
- [ ] **OG image generation** — Auto-generate a social-preview card via `@vercel/og` using the parsed name, title, and top skills
- [ ] **i18n** — Pull translated bullet points from the `.sty` or a YAML sidecar and add a language selector
- [ ] **Analytics** — Self-hosted Plausible or Umami integration (privacy-first, no cookie banner needed)
- [ ] **Contact form** — Wire up the existing `Contact.tsx` stub with Resend / Nodemailer and a rate-limited API route
- [ ] **Accessibility audit** — Automated axe-core checks in CI and a keyboard-navigation pass on all interactive elements
- [ ] **Performance** — `next/image` for any photos, font subsetting, bundle analysis with `@next/bundle-analyzer`



## Contributing

1. Fork the repo and create a branch: `git checkout -b feat/your-feature`
2. Commit using conventional commits: `feat:`, `fix:`, `chore:` (enforced by commitlint + husky)
3. Open a pull request against `main`



## License

[MIT](LICENSE) — free to use for personal portfolios. Attribution appreciated.
