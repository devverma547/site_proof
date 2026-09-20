# Coding Standards and Contribution Rules

## 1. Purpose
This document defines how SiteProof should be built, reviewed, and maintained. It exists to keep the product secure, consistent, performant, and aligned with the user experience goals of a premium AI audit platform.

## 2. Core engineering principles
- optimize for clarity, maintainability, and trust
- prefer robust and understandable solutions over clever shortcuts
- protect secrets and user data at every layer
- keep the product polished enough for a premium SaaS launch
- prefer testable logic and explicit failure states

## 3. Frontend standards
### React and component rules
- use functional components with hooks
- keep route-level logic in page components and feature logic in services/helpers
- reuse components when patterns repeat
- avoid large monolithic components when smaller components would be clearer

### UI and UX rules
- preserve the dark premium visual language with green accent highlights
- keep information architecture clear and not overloaded
- ensure focus states, contrast, and accessibility are maintained
- prefer direct, useful labels over overly clever microcopy

## 4. Backend and API standards
- use Netlify Functions for any request that involves secrets, AI, or protected business logic
- validate payloads and URL inputs before invoking external services
- centralize auth and CORS handling inside reusable utilities
- keep functions small, explicit, and testable

## 5. Security rules
- never commit or expose `.env` values
- never hardcode secret keys in browser code
- always validate URLs, repo strings, and user-provided values
- enforce auth on protected flows and consider edge cases explicitly
- treat all third-party API responses as untrusted until validated

## 6. Data and state rules
- keep user-specific data behind auth-aware flows
- use Supabase session state consistently across auth and report history
- avoid saving unvalidated or malformed report data
- store only the minimum metadata needed for a useful user experience

## 7. Performance rules
- lazy-load routes where practical
- avoid unnecessary re-renders and repeated expensive calls
- use cache checks for repeated scans when appropriate
- keep large payloads and heavy logic out of the render cycle

## 8. Quality and verification rules
- test bug fixes and feature changes with relevant coverage when possible
- prefer a failing test before implementing a fix for a bug
- run lint or validation checks before merging changes
- verify that scan outputs still match the expected shape before rendering them in UI

## 9. Error handling rules
- handle failures gracefully with actionable user-facing messages
- do not leak stack traces or internals to end users unless clearly safe
- log backend issues with enough detail for debugging without exposing secrets
- design fallback states for external service outages

## 10. File organization expectations
- `src/pages` — route-level screens
- `src/components` — reusable UI
- `src/services` — API and scanning logic
- `src/utils` — formatters, validators, and calculation helpers
- `src/contexts` — global app state providers
- `netlify/functions` — serverless backend logic

## 11. Naming conventions
- use camelCase for JavaScript variables and functions
- use PascalCase for React components
- keep module names descriptive and aligned with feature purpose
- prefer explicit names over generic ones like `data`, `info`, or `helper`

## 12. Review checklist before merge
Before merging any change, confirm:
- the code follows the product’s design and UX direction
- security concerns have been checked
- no secrets are exposed in source or client code
- the change works in the expected user flow
- tests or validation steps were run where relevant

## 13. Non-negotiable standards
- no secret leakage
- no auth bypasses or unsafe route assumptions
- no undocumented environment variables
- no UI drift away from the premium dark-tech product direction
- no unverifiable claims in docs, product messaging, or code comments

## 14. Team standard
The project should favor reliability and trust over novelty. SiteProof is a product where confidence matters: the product must feel accurate, useful, and polished enough for real users to act on the output.
