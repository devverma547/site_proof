# 🎨 SiteProof — UI/UX Design Direction & Design System

<div align="center">

![SiteProof Design](docs/assets/siteproof_overview.jpg)

**The Obsidian & Mint Cyberpunk Aesthetic for High-Trust Web Quality Audits**

[![Theme: Dark-First Obsidian](https://img.shields.io/badge/Theme-Dark--First%20Obsidian-080C14?style=for-the-badge&logoColor=00F5A0)](#)
[![Accent: Electric Mint (#00F5A0)](https://img.shields.io/badge/Accent-Electric%20Mint%20%2300F5A0-00F5A0?style=for-the-badge&logoColor=080C14)](#)
[![Typography: Plus Jakarta Sans + JetBrains Mono](https://img.shields.io/badge/Typography-Plus%20Jakarta%20%7C%20JetBrains-38BDF8?style=for-the-badge)](#)

</div>

---

## 1. 🌟 Design Vision & Personality

SiteProof is designed to convey **instant technical authority, speed, and trust**. 
It looks like a high-end security command center, but speaks in simple, friendly, and non-intimidating plain English.

```mermaid
mindmap
  root((SiteProof Aesthetic))
    Visual Mood
      Dark Obsidian Canvas
      Electric Mint Highlights
      Subtle Glassmorphism
      Crisp Data Gauges
    Emotional Impact
      Unshakable Trust
      Effortless Speed
      High-Leverage AI Empowerment
      Jargon-Free Clarity
    Component Feel
      Thin Glowing Borders
      Tactile Micro-Interactions
      Smooth Motion Accents
```

---

## 2. 🎨 Color Token Palette

The entire color system is defined in [`src/styles/tokens.css`](file:///c:/Users/Lenovo/Documents/vibe%20codding/src/styles/tokens.css) using Tailwind CSS v4 custom theme tokens:

| Token Name | Hex Code | RGB | Visual Preview | Purpose & Usage |
| :--- | :--- | :--- | :---: | :--- |
| `--color-brand` | `#00F5A0` | `0, 245, 160` | 🟢 | **Primary Accent**: CTAs, active states, circular gauge fills, success |
| `--color-brand-hover` | `#00E093` | `0, 224, 147` | 🟢 | **Button Hover**: Hover state on primary interactive elements |
| `--color-brand-obsidian`| `#080C14` | `8, 12, 20` | ⚫ | **Primary Canvas**: The deep dark background across all views |
| `--color-card-bg` | `#0D1627` | `13, 22, 39` | 🌌 | **Card Surface**: Container cards, elevated modals, data tables |
| `--color-card-border` | `rgba(0, 245, 160, 0.12)`| `0, 245, 160, 0.12` | ❇️ | **Subtle Glow Borders**: Thin 1px borders surrounding card elements |
| `--color-secondary` | `#3B82F6` | `59, 130, 246` | 🔵 | **Tech Accent**: Secondary buttons, links, telemetry lines |
| `--color-warning` | `#F59E0B` | `245, 158, 11` | 🟡 | **Warning**: Moderate severity flags, score tier 50–79 |
| `--color-danger` | `#EF4444` | `239, 68, 68` | 🔴 | **Critical Alert**: Leaked secrets, missing security headers, score < 50 |

---

## 3. ✍️ Typography & Font Hierarchy

SiteProof uses three specialized Google Fonts tailored for modern web applications:

```
Headings & Display:     Outfit / Plus Jakarta Sans (Bold, high-impact titles)
Body & Microcopy:       Plus Jakarta Sans / Inter (Clean legibility at all scales)
Scores, Code & URLs:    JetBrains Mono (Monospaced data, status codes, prompt boxes)
```

```mermaid
graph LR
    H1["Hero Headline<br>Outfit Bold 56px<br>#F3F4F6"] --> H2["Section Header<br>Plus Jakarta Sans 28px<br>#F3F4F6"]
    H2 --> Body["Body Text<br>Inter Regular 15px<br>#9CA3AF"]
    H2 --> Mono["Technical Data / Prompts<br>JetBrains Mono 13px<br>#00F5A0"]
```

---

## 4. 📐 Wireframe Layout Blueprints

### 4.1 Landing Page Architecture (`/`)
```
+-------------------------------------------------------------------------+
| [Logo: 🛡️ SiteProof]         About   Sample Report   Contact    [Log In] |
+-------------------------------------------------------------------------+
|                                                                         |
|                Audit, Secure & Fix Your Website in 15s                 |
|             The Quality & Remediation Engine for AI-Built Sites          |
|                                                                         |
|      +-----------------------------------------------------------+      |
|      | 🔗 https://your-website.com            | [🚀 Run AI Audit] |      |
|      +-----------------------------------------------------------+      |
|              [Or view an interactive instant sample report ->]          |
|                                                                         |
|   [⚡ Core Web Vitals]   [🛡️ Mozilla Security]   [🔑 Secret Detection]  |
|                                                                         |
+-------------------------------------------------------------------------+
```

### 4.2 Report Dashboard Architecture (`/report/:reportId`)
```
+-------------------------------------------------------------------------+
| 🌐 audit: example-site.com            Overall Score: [ 94 / 100 🟢 ]   |
+-------------------------------------------------------------------------+
|  [ ⚡ Performance: 91 ]  [ 🛡️ Security: A+ ]  [ 🔍 SEO: 98 ]  [ ♿ A11y: 95 ]  |
+-------------------------------------------------------------------------+
|                                                                         |
|  📋 AI Plain-English Executive Summary                                  |
|  "Your site loads in 1.2s and has great SEO. However, your CSP header  |
|   is missing and your Google Analytics token was exposed in bundle.js"  |
|                                                                         |
|  🤖 Ready-to-Use AI Fix Prompt (Click to Copy)                          |
|  +-------------------------------------------------------------------+  |
|  | prompt: "Add strict Content-Security-Policy headers in           |  |
|  | netlify.toml and move process.env.GA_TOKEN to serverless..."     |  |
|  |                                                [📋 Copy Prompt]   |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  📂 Detailed Modules:                                                   |
|  - [⚡ Performance Deep Dive]    - [🛡️ Mozilla Observatory Breakdown]   |
|  - [🔐 Secret Leak Analysis]     - [📦 GitHub Repo Inspection]         |
+-------------------------------------------------------------------------+
```

---

## 5. 🧩 Component Anatomy

### 5.1 Circular Score Gauges
* **Radius & Stroke**: SVG circular rings with stroke dash-offset animations driven by Framer Motion.
* **Tier Colors**:
  - `90 – 100`: Mint Green (`#00F5A0`) — Optimal / Production Ready
  - `70 – 89`: Electric Cyan (`#38BDF8`) — Good / Minor Polish Needed
  - `50 – 69`: Amber Gold (`#F59E0B`) — Fair / Noticeable Regressions
  - `0 – 49`: Crimson Red (`#EF4444`) — Critical Fix Required

### 5.2 The AI Fix Prompt Card
* Monospaced code box with syntax highlighting.
* Instant 1-click **"Copy Prompt"** with visual checkmark feedback.
* Targeted tool tags: `Cursor`, `Bolt.new`, `v0`, `Lovable`, `ChatGPT`.
