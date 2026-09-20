# Product Requirements Document (PRD)

## 1. Product overview
SiteProof is an AI-powered website quality and remediation platform built for founders, agencies, developers, and product teams who need to validate whether a site is launch-ready, client-ready, or fix-worthy.

The core value proposition is simple: users paste a website URL, receive a fast technical audit, and get clear, actionable guidance to improve the site. SiteProof goes beyond static scoring by turning findings into AI-ready fix prompts that can be copied into coding tools such as Cursor, Bolt, v0, Lovable, or ChatGPT.

## 2. Problem we solve
AI-generated and rapidly built websites often ship with issues that are hard to spot without specialized tooling:
- performance regressions and poor Core Web Vitals
- SEO and indexability problems
- accessibility gaps
- security header and compliance weaknesses
- exposed client-side secrets or risky bundles
- poor UX and conversion issues
- vague or incomplete recommendations for remediation

Most teams do not have a fast, credible way to answer the question: "Is this site actually production-ready, and what should we fix first?"

## 3. Product vision
SiteProof should become the trust layer for AI-built websites.

It should help users move confidently from:
- idea → live prototype
- prototype → production-quality site
- website → optimized, safer, and more conversion-ready experience

## 4. Target users
### 4.1 Founders and small business owners
They need a fast read on launch quality, SEO health, and conversion blockers without hiring an expensive audit team.

### 4.2 Agencies and freelancers
They need a fast way to generate client-ready reports, identify risks, and communicate improvements clearly.

### 4.3 AI-assisted developers and vibe coders
They want technical issues explained in plain English and paired with direct AI prompts that can be fed back into their IDEs or AI coding workflow.

### 4.4 Product teams and review stakeholders
They need a consistent scorecard and issue inventory to compare builds, identify regressions, and decide launch readiness.

## 5. Core user journeys
### Journey A: One-click audit
1. User lands on the marketing site.
2. User enters a URL and optional GitHub repository.
3. Product runs a multi-layer scan.
4. User sees an overall score, critical issues, and an AI summary.
5. User takes the next action: fix, compare, or save the report.

### Journey B: Authenticated history
1. User creates an account or logs in.
2. Product stores previous scan results.
3. User revisits a prior report and compares quality over time.
4. User reads recommendations and decides what to fix next.

### Journey C: AI remediation workflow
1. Product generates a structured AI prompt.
2. User copies it into Cursor, v0, Bolt, or ChatGPT.
3. User applies the requested changes.
4. User re-runs the audit to validate the improvement.

## 6. Functional requirements
### 6.1 Marketing and acquisition
- polished landing page with a clear value proposition
- high-visibility CTA to start a scan
- trust-building copy and product proof points
- persona-based messaging for founders, agencies, and developers

### 6.2 Website scanning
- accept a publicly accessible website URL
- validate and sanitize the input before analysis
- optionally accept a GitHub repo URL for deeper code inspection
- support multi-step scanning without blocking the user interface

### 6.3 Audit modules
The product must evaluate the site across these dimensions:
- performance and Core Web Vitals
- SEO and indexability
- accessibility and usability
- security headers and implementation risk
- mobile responsiveness
- UI and layout quality
- content quality and clarity
- legal and compliance signals
- technical runtime health
- conversion and funnel effectiveness
- technology stack detection
- AI-generated remediation guidance

### 6.4 AI summary generation
- summarize technical findings in readable language
- rank issue severity clearly
- generate actionable remediation recommendations
- produce code-generation prompts suitable for AI-assisted development workflows

### 6.5 User accounts and saved reports
- allow account creation and login via Supabase auth
- save reports associated with a user account
- preserve report history and allow revisiting past scans
- support comparison and trend review over time

### 6.6 Security and safe operation
- keep all sensitive keys and API tokens out of the browser
- require secure backend processing for AI and external service calls
- validate GitHub and URL inputs before use
- detect leaked secrets or risky bundle behavior where possible

## 7. Non-functional requirements
- each standard audit should complete within a realistic target of under 2 minutes
- the UI should feel fast and responsive across desktop and mobile devices
- the experience must degrade gracefully when external services fail or rate-limit
- security headers and deployment hardening should be applied in production config
- the product should be maintainable and extensible as the scan engine evolves

## 8. Product success metrics
The product is considered successful if it achieves:
- reliable scan completion for valid public URLs
- strong conversion from landing page visitors to starting a scan
- users return to review previous reports
- higher value perception from credible issue summaries and fix guidance
- faster time-to-fix through actionable AI prompts

## 9. Launch criteria
The product is launch-ready when:
- scan flow works reliably for real public sites
- report output is clear, actionable, and trustworthy
- auth and saved history work consistently
- the UI looks polished and conversion-focused
- deployment configuration is secure and stable

## 10. Scope
### In scope for launch
- marketing site and onboarding flow
- website scanning and audit workflow
- AI remediation guidance
- authenticated history and report persistence
- secure backend orchestration and deployment integration

### Out of scope for the initial launch
- enterprise team workspaces
- enterprise billing, quotas, and subscriptions
- custom white-label flows for every client
- advanced collaboration features
- full multi-page workflow automation beyond the core audit experience

## 11. Product positioning
SiteProof should position itself as:
- the “quality control layer” for AI-generated websites
- a technical audit tool that turns findings into action
- a bridge between a live website and the fix workflow required to improve it

## 12. Risks and dependencies
- external scan APIs may rate-limit requests or fail partially
- some sites may block automated inspection or return inconsistent data
- GitHub repo checks depend on repository accessibility and permissions
- AI output quality depends on model quality and prompt design

## 13. Functional acceptance criteria
- A user can enter a URL and start a scan from the landing page.
- The app returns an overall score and a clear list of issues.
- The app identifies the most important security or SEO concerns.
- Users can review prior reports when logged in.
- The app keeps sensitive credentials server-side and never exposes them in the browser.
- The interface remains responsive and easy to understand across common screen sizes.

## 14. Product direction summary
The product should feel premium, technical, and dependable. It is not just a scanner; it is a decision-support system that helps users understand site quality, prioritize fixes, and act quickly with the help of AI.
