# 📜 SiteProof — Coding Rules & Engineering Standards

<div align="center">

<img src="./docs/assets/siteproof_workflow.jpg" width="100%" alt="SiteProof Architecture Workflow" />

**Core Engineering Guidelines, Deployment Rules, and Non-Negotiable Standards**

[![Linter: Oxlint Passed](https://img.shields.io/badge/Linter-Oxlint%20Passed-00F5A0?style=for-the-badge&logo=eslint)](#)
[![Tests: Vitest Enabled](https://img.shields.io/badge/Tests-Vitest%20Enabled-FCC72B?style=for-the-badge&logo=vitest)](#)
[![Security: Zero Secret Leakage](https://img.shields.io/badge/Security-Zero%20Secret%20Leakage-FF4B4B?style=for-the-badge&logo=securityscorecard)](#)

</div>

---

> [!TIP]
> **💡 How to View Visual Markdown in your IDE:**
> Press **`Ctrl + Shift + V`** (or click the **Open Preview to the Side** icon 📖 in the top-right corner of your editor window) to view the rendered images, diagrams, and live preview!
> Below, we have also drawn the visual charts directly in text so they are visible even without preview mode.

---

## 1. 🚨 Non-Negotiable Project Rules

> [!CAUTION]
> ### 1. Netlify Deployments: ALWAYS Use the `dist` Folder
> - **NEVER** deploy the root directory to Netlify or production hosts. Serving the root serves uncompiled `.jsx` source files, which breaks the live app.
> - **ALWAYS** compile the application locally first via `npm run build`, and deploy the resulting `dist` directory.
>
> ### 2. Automated Git Push & No-Tech Friction
> - The repository owner prefers an automated workflow without technical barriers.
> - Whenever code changes are finalized, automatically commit and push them to GitHub (`git add . ; git commit -m "..." ; git push`) without blocking the user for manual terminal execution.
>
> ### 3. Absolute Secret Security
> - **NEVER** commit `.env` files or hardcode API keys (e.g. `NVIDIA_API_KEY`, Supabase Service Role Keys) into frontend code or public repositories.
> - All private keys must remain strictly in Netlify Dashboard Environment Variables.

---

## 2. 🔄 Development & Verification Workflow

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ 1. Write Code   │───►   │ 2. Run Lint     │───►   │ 3. Run Tests    │
│    or Fix Bug   │       │    npm run lint │       │    npm run test │
└─────────────────┘       └────────┬────────┘       └────────┬────────┘
                                   │ Warnings?               │ Tests Pass?
                                   ▼                         ▼
                          ┌─────────────────┐       ┌─────────────────┐
                          │ 4. Build Dist   │───►   │ 5. Auto Push    │
                          │    npm run build│       │    git push     │
                          └─────────────────┘       └─────────────────┘
```

---

## 3. 📂 Repository Directory Layout

```
vibe codding/
├── .agents/                    # Agent instructions & skills
├── database/                   # Supabase migration scripts
│   └── supabase_migration.sql  # SQL schema (profiles, websites, scans)
├── docs/                       # Project documentation & visual assets
│   └── assets/                 # Architecture & UI diagrams
├── netlify/                    # Serverless Edge Tier
│   └── functions/              # Node/ESM serverless functions
│       └── utils/              # SSRF filters, JWT auth, CORS helpers
├── public/                     # Static public assets (favicons, icons)
├── src/                        # Client-Side Application
│   ├── components/             # Reusable UI components
│   ├── config/                 # Supabase client initialization
│   ├── contexts/               # React Contexts (Auth, Theme, Toast)
│   ├── pages/                  # Route-level screens (Landing, Report, etc.)
│   ├── services/               # API clients & audit pipeline logic
│   ├── styles/                 # Tailwind CSS v4 tokens & components
│   └── utils/                  # Formatters, URL validators, scoring math
├── netlify.toml                # Netlify redirects, headers, build commands
├── package.json                # Dependencies & scripts
└── vite.config.js              # Vite bundler & Vitest test setup
```

---

## 4. ⚛️ Frontend Standards (React 19 & Tailwind v4)

* **Component Structure**:
  - Use modern functional components with hooks (`useState`, `useMemo`, `useCallback`, `useEffect`).
  - Avoid bloated single-file monoliths. Extract sub-cards into focused components.
* **Route Code Splitting**:
  - All pages in `src/App.jsx` must be wrapped with `lazyWithRetry` to prevent chunk loading failures when a user keeps an old tab open across new deployments.
* **Accessibility**:
  - Keep the accessible skip-to-content link intact at the top of `App.jsx`.
  - Provide `aria-label` attributes on all icon-only buttons.
  - Maintain color contrast ratios exceeding 4.5:1 against the `#080C14` dark background.

---

## 5. 🛡️ Serverless & Security Standards

```
┌────────────────────────────────────────────────────────────────────────┐
│ SERVERLESS SECURITY CHECKS                                             │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Inbound URL -> Pass through isSafeUrl() (Blocks localhost & SSRF)   │
│ 2. Secrets Scan -> Redact exposed tokens to 6 chars (ghp_1a2b3c••••••) │
│ 3. Error Handling -> Generic message in 500 response, no stack traces   │
│ 4. CORS Filter -> Restrict or validate origin header safely            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 6. 🧼 Quality & Review Checklist

Before finalizing any changes to the codebase, verify:

- [x] **Build Check**: Does `npm run build` succeed with zero errors?
- [x] **Lint Check**: Does `npm run lint` report zero errors?
- [x] **No Secret Commits**: Are there any credentials or `.env` files staged in git?
- [x] **User Experience**: Is the user journey intuitive, fast, and translated into plain English?
- [x] **Dark-Mode Visual Fidelity**: Are brand colors (`#00F5A0`, `#080C14`) and card styles preserved?
