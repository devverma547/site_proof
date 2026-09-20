# 🛡️ SiteProof — Product Requirements Document (PRD)

<div align="center">

<img src="./docs/assets/siteproof_overview.jpg" width="100%" alt="SiteProof Dashboard Overview" />

**The Trust Layer & Quality Remediation Engine for AI-Built Websites**

[![Status: Production-Ready MVP](https://img.shields.io/badge/Status-Production--Ready%20MVP-00F5A0?style=for-the-badge&logo=statuspage&logoColor=080C14)](#)
[![Stack: React 19 + Netlify + Supabase](https://img.shields.io/badge/Stack-React%2019%20%7C%20Netlify%20%7C%20Supabase-38BDF8?style=for-the-badge&logo=react)](#)
[![AI: NVIDIA NIM / DeepSeek](https://img.shields.io/badge/AI-NVIDIA%20NIM%20DeepSeek-76B900?style=for-the-badge&logo=nvidia)](#)

</div>

---

> [!TIP]
> **💡 How to View Visual Markdown in your IDE:**
> Press **`Ctrl + Shift + V`** (or click the **Open Preview to the Side** icon 📖 in the top-right corner of your editor window) to view the rendered images, diagrams, and live preview!
> Below, we have also drawn the visual charts directly in text so they are visible even without preview mode.

---

## 1. 🎯 Product Vision & Core Mission

> [!IMPORTANT]
> **Core Philosophy: "Explain like I'm 5, Fix like a Staff Engineer."**
> Rapid website builders, vibe coders, and non-technical founders often build websites without knowing whether their code leaks API secrets, violates security policies, or lags on mobile devices. SiteProof translates complex technical diagnostic data into **plain English insights** and **direct AI prompt fixes** you can copy-paste straight into tools like Cursor, Bolt, Lovable, v0, or ChatGPT.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                SITEPROOF PRODUCT WORKFLOW                              │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│   [ 🌐 Live Website URL ]                                                              │
│              │                                                                         │
│              ▼                                                                         │
│   [ ⚡ Multi-Engine Parallel Audit ]                                                    │
│      ├── Google PageSpeed Insights (Performance & SEO)                                 │
│      ├── Mozilla Observatory API (HTTP Security Headers)                               │
│      ├── Client Script Secret AST Scanner (Token Leaks)                                │
│      └── GitHub Repository Inspector (Dependencies & Code Health)                      │
│              │                                                                         │
│              ▼                                                                         │
│   [ 📊 Plain-English Health Scorecard (0-100 Score + Severity Chips) ]                 │
│              │                                                                         │
│              ▼                                                                         │
│   [ 🤖 Actionable AI Remediation Fix Prompts (NVIDIA DeepSeek) ]                       │
│              │                                                                         │
│              ▼                                                                         │
│   [ 💻 1-Click "Copy Prompt" -> Paste into Cursor / Bolt / v0 / ChatGPT ]             │
│              │                                                                         │
│              ▼                                                                         │
│   [ 🚀 Fast, Hardened, and Verified Production Site ]                                  │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

<div align="center">

<img src="./docs/assets/siteproof_workflow.jpg" width="100%" alt="SiteProof Workflow Pipeline" />

</div>

---

## 2. 🧩 The Problems We Solve

AI website generators and low-code platforms allow anyone to spin up a web app in minutes. However, they frequently suffer from silent, critical vulnerabilities:

| Category | Problem in AI-Generated Sites | How SiteProof Solves It |
| :--- | :--- | :--- |
| ⚡ **Performance** | Bloated bundles, unoptimized media, failing Core Web Vitals (LCP, CLS, FID) | Real-time PageSpeed Insights telemetry with exact asset optimization cues |
| 🔒 **Security Headers** | Missing CSP, HSTS, X-Frame-Options (vulnerable to clickjacking & XSS) | Live Mozilla Observatory scan with letter grades and header configurations |
| 🔑 **Secret Leaks** | Hardcoded API keys, Supabase service roles, AWS credentials in client JS | Regex-based client-bundle AST scanner with strict key masking |
| 🔍 **SEO & Discoverability** | Broken meta tags, missing canonical URLs, unindexed SPAs | Technical SEO inspection checking robot tags, OpenGraph, and semantic tags |
| 🧑‍💻 **Remediation Gap** | Users don't know what cryptic errors mean or how to write code to fix them | Generates structured code prompts with file context ready for AI code editors |
| 🧪 **Demo Friction** | Non-technical users hesitate to test their live site or lack credentials | Zero-barrier interactive **Sample Report (`/sample-report`)** preview |

---

## 3. 👥 Target Personas

```
┌─────────────────────────┬─────────────────────────┬─────────────────────────┐
│ NON-TECHNICAL FOUNDERS  │ VIBE CODERS & BUILDERS  │ AGENCIES & FREELANCERS  │
├─────────────────────────┼─────────────────────────┼─────────────────────────┤
│ • Understand launch     │ • Building with Cursor, │ • Client-ready audit    │
│   readiness instantly.  │   Bolt, v0, Lovable.    │   reports & delivery.   │
│ • Zero tech jargon.     │ • Rapid test-fix-retest │ • Demonstrable proof of │
│ • Verify contractors'   │   workflow loop.        │   performance & SEO.    │
│   deliverables.         │ • Copy-paste AI prompts.│ • Pre-launch checklist. │
└─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

---

## 4. 🧭 Core User Journeys

### Journey A: Instant One-Click Audit (Zero Friction)
1. User lands on homepage (`/`).
2. Enters a URL (e.g., `https://my-site.com`) and optional GitHub repository.
3. System runs parallel audits across PageSpeed, Mozilla Observatory, and Secret Scanner.
4. Dashboard displays overall score (0–100), severity-ranked issues, and plain-English summary.
5. User clicks **"Copy Fix Prompt"** and pastes into Cursor or ChatGPT to resolve the issue.

### Journey B: Interactive Sample Report (No Website Needed)
For visitors who don't yet have a live URL or want to explore SiteProof's capabilities before running a scan:
1. User clicks **"View Sample Report"** on the landing page or navigates to `/sample-report`.
2. The UI instantly loads an audited report demonstrating realistic scores, identified security vulnerabilities, and generated prompt solutions.
3. User explores the module cards, toggles severity filters, and tests the "Copy Prompt" button.

### Journey C: Authenticated History & Trend Tracking
1. User signs in with **Google OAuth** or email password via Supabase.
2. Every scan performed is linked to their profile in the `scans` table.
3. User visits `/dashboard` or `/history` to re-open past reports, track score improvements, and manage multiple domains.

---

## 5. ⚙️ Scanning Modules Matrix

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              7-MODULE AUDIT TAXONOMY                                   │
├─────────────────────────┬──────────────────────────────────────────────────────────────┤
│ 1. Core Web Vitals      │ LCP, FID, CLS, Total Blocking Time, bundle load time         │
│ 2. Technical SEO        │ Meta tags, OpenGraph, Twitter cards, viewport, canonicals    │
│ 3. Accessibility        │ Color contrast ratios, image alt tags, ARIA roles, semantics │
│ 4. Mozilla Observatory  │ CSP, HSTS, X-Frame-Options, X-Content-Type-Options (A+ to F) │
│ 5. Secret Token Scanner │ 25+ AST regex checks for exposed API keys (masked to 6 chars)│
│ 6. GitHub Code Quality  │ Dependency health, outdated packages, repo structure         │
│ 7. NVIDIA AI Remediation│ Plain-English executive summaries & copyable Cursor prompts  │
└─────────────────────────┴──────────────────────────────────────────────────────────────┘
```

---

## 6. 🔐 Security & Privacy Specifications

> [!CAUTION]
> **Client-Side Safety Rules**
> - **Zero Key Exposure**: `NVIDIA_API_KEY` and Supabase Service Role keys are strictly kept on the server inside Netlify serverless functions.
> - **SSRF Protection**: URL inputs are sanitized and restricted against loopback (`127.0.0.1`), link-local (`169.254.169.254`), and internal network addresses.
> - **Secret Redaction**: When client secret leaks are detected, only the first 6 characters are rendered with the remainder masked (`ghp_123456••••••••`).
> - **Lightweight Database footprint**: Supabase only stores lightweight scan metadata (~300 bytes) without persisting full raw page scrapes, protecting user confidentiality and database free tier storage.

---

## 7. 🚀 Launch Criteria & Acceptance Matrix

- [x] **Instant Scan**: Public website URL can be audited within 15–30 seconds.
- [x] **Plain English Translation**: All warnings include a "Why this matters" explanation without developer jargon.
- [x] **Copy-Paste Fix Prompts**: Users can click "Copy Prompt" and paste directly into Cursor or ChatGPT.
- [x] **Demo Experience**: `/sample-report` allows visitors to inspect an interactive audit report immediately.
- [x] **Supabase Authentication**: Users can log in with Google OAuth or Email and view scan history on `/history`.
- [x] **Dark Obsidian Aesthetic**: High-end cyberpunk/SaaS aesthetic using `#080C14` and `#00F5A0` accents.
