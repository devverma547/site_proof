# 🏗️ SiteProof — System & Software Architecture

<div align="center">

![SiteProof Architecture](docs/assets/siteproof_overview.jpg)

**High-Throughput Parallel Audit Pipeline with Serverless AI Orchestration**

[![Frontend: React 19 + Vite 8](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite%208-61DAFB?style=for-the-badge&logo=react)](#)
[![Backend: Netlify Functions (ESM)](https://img.shields.io/badge/Backend-Netlify%20Functions%20(ESM)-00C7B7?style=for-the-badge&logo=netlify)](#)
[![Database: Supabase PostgreSQL RLS](https://img.shields.io/badge/Database-Supabase%20Postgres%20RLS-3ECF8E?style=for-the-badge&logo=supabase)](#)
[![Security: Hardened Headers & Secret Redaction](https://img.shields.io/badge/Security-A%2B%20Hardened%20Headers-00F5A0?style=for-the-badge&logo=shieldsdotio)](#)

</div>

---

## 1. 🌐 System Topology Overview

SiteProof separates concerns between an ultra-fast client-side React SPA, a secure serverless edge tier, and specialized third-party diagnostic and AI services:

```mermaid
graph TB
    subgraph Client Tier ["💻 Client Tier (Browser)"]
        UI["React 19 SPA (Vite + Tailwind CSS v4)"]
        Router["React Router 7 (Lazy Loaded Chunks)"]
        State["Context State (Auth, Theme, Toast)"]
        Cache["Browser Session & URL Cache"]
        UI --> Router
        UI --> State
        UI --> Cache
    end

    subgraph Edge Tier ["⚡ Netlify Serverless Edge Functions"]
        FN_MAIN["analyze.mjs (Main Orchestrator)"]
        FN_PS["analyze-pagespeed.mjs (PageSpeed AI)"]
        FN_OBS["analyze-observatory.mjs (Mozilla Security)"]
        FN_SEC["analyze-secrets.mjs (Bundle AST Scanner)"]
        FN_CODE["analyze-code.mjs (GitHub Inspector)"]
        Utils["Shared Utils (SSRF Protection, Auth, JSON parser)"]
        
        FN_MAIN --> Utils
        FN_PS --> Utils
        FN_OBS --> Utils
        FN_SEC --> Utils
        FN_CODE --> Utils
    end

    subgraph Data Tier ["🗄️ Cloud Data Tier (Supabase)"]
        SupaAuth["Supabase Auth (Google OAuth & JWT)"]
        SupaDB["PostgreSQL Database (RLS Enforced)"]
        T_Prof[("profiles")]
        T_Web[("websites")]
        T_Scan[("scans (Metadata Only)")]
        SupaDB --> T_Prof
        SupaDB --> T_Web
        SupaDB --> T_Scan
    end

    subgraph External Engines ["🔌 External Diagnostic & AI Services"]
        PageSpeed["Google PageSpeed Insights API"]
        Observatory["Mozilla Observatory API"]
        NvidiaNIM["NVIDIA NIM AI (DeepSeek / Llama 3)"]
        GitHubAPI["GitHub REST API"]
    end

    %% Interactions
    UI -->|1. Sign in & session| SupaAuth
    UI -->|2. Lightweight scan logs| SupaDB
    UI -->|3. Public Performance Scan| PageSpeed
    UI -->|4. Parallel Deep Analysis| Edge Tier

    FN_PS -->|PageSpeed metrics + AI synthesis| NvidiaNIM
    FN_OBS -->|HTTP Security Headers| Observatory
    FN_SEC -->|Script tags inspection| UI
    FN_CODE -->|Repo inspection| GitHubAPI
    FN_CODE -->|Code review prompts| NvidiaNIM
```

---

## 2. ⚡ The "Split-the-Brain" Parallel Audit Pipeline

> [!TIP]
> Traditional monolithic web audit engines can take 60–90 seconds and often hit cloud serverless execution timeouts (typically 10–26s on free tiers). SiteProof implements a **"Split-the-Brain" parallel architecture**:
> - Client handles the fast public PageSpeed query directly.
> - Client concurrently fans out sub-requests to isolated Netlify functions.
> - Total scan completion drops to **15–25 seconds**, completely eliminating serverless timeouts.

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser
    participant Scanner as scanner.service.js
    participant PageSpeed as Google PageSpeed API
    participant FN_PS as analyze-pagespeed.mjs
    participant FN_OBS as analyze-observatory.mjs
    participant FN_SEC as analyze-secrets.mjs
    participant FN_CODE as analyze-code.mjs
    participant Supa as Supabase Database

    User->>Scanner: analyzeSite(url, githubRepo)
    Scanner->>Supa: Create pending scan record
    
    par Step 1: Client Query
        Scanner->>PageSpeed: Run client-side Lighthouse check
        PageSpeed-->>Scanner: Raw Lighthouse metrics (CWV, SEO, a11y)
    end

    par Step 2: Fan-Out Parallel Serverless Execution
        Scanner->>FN_PS: POST metrics -> NVIDIA AI analysis
        Scanner->>FN_OBS: POST url -> Mozilla Observatory scan
        Scanner->>FN_SEC: POST url -> Fetch scripts & scan for token leaks
        opt Optional GitHub Repo
            Scanner->>FN_CODE: POST repo -> Inspect dependencies & structure
        end
    end

    FN_PS-->>Scanner: AI Executive Summary & Scores
    FN_OBS-->>Scanner: Security Grade (A-F) & Missing Headers
    FN_SEC-->>Scanner: Leaked Secrets Inventory (Masked)
    FN_CODE-->>Scanner: Code Quality Score & Suggestions

    Scanner->>Scanner: Merge JSON into Unified 7-Module Report
    Scanner->>Supa: Update scan status to 'completed' with scores
    Scanner-->>User: Render interactive Report Dashboard
```

---

## 3. 🗺️ Frontend Route Architecture

The frontend is built with **React 19** and **React Router 7**, employing an auto-recovering lazy-loading mechanism ([`lazyWithRetry`](file:///c:/Users/Lenovo/Documents/vibe%20codding/src/App.jsx#L15)) that automatically recovers from stale Vite chunk hashes during rolling deployments:

| Route Path | Component File | Auth State | Purpose |
| :--- | :--- | :--- | :--- |
| `/` | [`LandingPage.jsx`](file:///c:/Users/Lenovo/Documents/vibe%20codding/src/pages/landing/LandingPage.jsx) | Public | High-converting hero, live URL scan bar, value propositions, FAQ |
| `/sample-report` | [`SampleReportPage.jsx`](file:///c:/Users/Lenovo/Documents/vibe%20codding/src/pages/report/SampleReportPage.jsx) | Public | Instant interactive demo report without needing a live URL |
| `/report/:reportId` | [`ReportPage.jsx`](file:///c:/Users/Lenovo/Documents/vibe%20codding/src/pages/report/ReportPage.jsx) | Public/Auth | Full 7-module audit dashboard, circular gauges, AI prompt copy tool |
| `/dashboard` | [`DashboardPage.jsx`](file:///c:/Users/Lenovo/Documents/vibe%20codding/src/pages/dashboard/DashboardPage.jsx) | Protected | User workspace, active monitored sites, recent scores |
| `/history` | [`HistoryPage.jsx`](file:///c:/Users/Lenovo/Documents/vibe%20codding/src/pages/history/HistoryPage.jsx) | Protected | Chronological archive of past audits with score trends |
| `/login` | [`LoginPage.jsx`](file:///c:/Users/Lenovo/Documents/vibe%20codding/src/pages/auth/LoginPage.jsx) | Guest | Google OAuth & Email/password login |
| `/signup` | [`SignupPage.jsx`](file:///c:/Users/Lenovo/Documents/vibe%20codding/src/pages/auth/SignupPage.jsx) | Guest | User registration with email verification |
| `/forgot-password` | [`ForgotPasswordPage.jsx`](file:///c:/Users/Lenovo/Documents/vibe%20codding/src/pages/auth/ForgotPasswordPage.jsx) | Guest | Password reset request form |
| `/reset-password` | [`ResetPasswordPage.jsx`](file:///c:/Users/Lenovo/Documents/vibe%20codding/src/pages/auth/ResetPasswordPage.jsx) | Guest | Set new password with Supabase token |
| `/auth/callback` | [`AuthCallback.jsx`](file:///c:/Users/Lenovo/Documents/vibe%20codding/src/pages/auth/AuthCallback.jsx) | Public | OAuth exchange handler for Google redirects |
| `/about` | [`AboutPage.jsx`](file:///c:/Users/Lenovo/Documents/vibe%20codding/src/pages/about/AboutPage.jsx) | Public | Product background, philosophy, and team mission |
| `/contact` | [`ContactPage.jsx`](file:///c:/Users/Lenovo/Documents/vibe%20codding/src/pages/contact/ContactPage.jsx) | Public | Support form and inquiry routing |
| `/404` | [`NotFoundPage.jsx`](file:///c:/Users/Lenovo/Documents/vibe%20codding/src/pages/errors/NotFoundPage.jsx) | Public | Graceful error state with return CTA |

---

## 4. ⚡ Serverless Functions Specification

All sensitive logic, third-party tokens, and AI calls are isolated in `netlify/functions/`:

```
netlify/functions/
├── analyze.mjs              # Main fallback entry point
├── analyze-pagespeed.mjs    # Passes Lighthouse data to NVIDIA DeepSeek AI
├── analyze-observatory.mjs  # Calls Mozilla Observatory API for HTTP security
├── analyze-secrets.mjs      # Fetches client scripts & scans 25+ secret regexes
├── analyze-code.mjs         # Fetches GitHub repo structure & evaluates code
└── utils/
    ├── auth.mjs             # Supabase JWT token verification
    ├── cors.mjs             # CORS origin validation & options handling
    ├── json.mjs             # Robust JSON response sanitization
    ├── ssrf.mjs             # IP / hostname whitelist & SSRF blocking
    └── supabase.mjs         # Serverless Supabase admin client
```

---

## 5. 🗄️ Database & Storage Strategy

> [!NOTE]
> **Minimal Storage Pattern (~300 bytes per scan)**
> To keep Supabase operating comfortably within free tier limits, SiteProof intentionally avoids saving large, bloated raw JSON trees or HTML snapshots to the database. Only core metadata (scores, timestamps, domain, user ID) is persisted in the [`scans`](file:///c:/Users/Lenovo/Documents/vibe%20codding/database/supabase_migration.sql#L52) table. Full diagnostic reports are cached in the browser's session storage and regenerated on-demand.

```mermaid
erDiagram
    PROFILES ||--o{ WEBSITES : manages
    PROFILES ||--o{ SCANS : executes
    WEBSITES ||--o{ SCANS : associates

    PROFILES {
        uuid id PK
        text name
        text avatar_url
        text plan "free | pro | enterprise"
        int scans_this_month
        timestamp created_at
    }

    WEBSITES {
        uuid id PK
        uuid user_id FK
        text url
        text domain
        text name
        text github_repo
        int last_score
        timestamp last_scanned_at
    }

    SCANS {
        uuid id PK
        uuid user_id FK
        uuid website_id FK
        text url
        text domain
        text status "pending | running | completed | failed"
        int overall_score
        int security_score
        int performance_score
        int seo_score
        int a11y_score
        timestamp created_at
    }
```

---

## 6. 🛡️ Security & Defensive Architecture

SiteProof enforces multi-tiered defensive mechanisms across both the client and serverless boundaries:

```mermaid
graph LR
    subgraph Inbound Protection
        I1[URL Normalization] --> I2[SSRF Filter: Blocks Localhost & 169.254.169.254]
    end
    subgraph Processing Safety
        P1[NVIDIA API Key Server-Only] --> P2[Secret Redaction: Masks to 6 Chars]
        P2 --> P3[Generic 500 Responses: Zero Stack Leakage]
    end
    subgraph Browser Hardening
        B1[Strict-Transport-Security] --> B2[X-Frame-Options: DENY]
        B2 --> B3[X-Content-Type-Options: nosniff]
        B3 --> B4[Content Security Policy]
    end
```

* **SSRF Mitigation**: URLs entered for scanning are strictly vetted against private and metadata IP ranges (`127.0.0.1`, `10.0.0.0/8`, `192.168.0.0/16`, `169.254.169.254`).
* **Secret Redaction**: When client tokens are detected, the response caps visible characters at 6 characters (`ghp_3a9f••••••••`) to prevent echoing live secrets to viewers.
* **HTTP Security Headers**: Defined in [`netlify.toml`](file:///c:/Users/Lenovo/Documents/vibe%20codding/netlify.toml#L31-L40), ensuring A+ grades for the SiteProof application itself.
