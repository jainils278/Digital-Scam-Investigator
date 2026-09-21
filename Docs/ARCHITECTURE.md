# Architecture

## System Overview

Digital Scam Investigator is a monorepo web application with a React frontend and Express backend, organized as npm workspaces.

```
┌──────────────────────────────────────────────────────┐
│                    Frontend (React)                  │
│  WorkstationInput → InvestigationReportView          │
│  EvidenceGraph, AssessmentPanel, EducationDeepDive   │
└───────────────────┬──────────────────────────────────┘
                    │ POST /api/investigate
                    │ POST /api/investigate-url
┌───────────────────▼──────────────────────────────────┐
│                   Backend (Express)                  │
│  ┌─────────────┐  ┌────────────┐  ┌───────────────┐ │
│  │  Validator   │  │ Rate Limit │  │ Security Hdrs │ │
│  └──────┬──────┘  └─────┬──────┘  └───────────────┘ │
│         ▼               ▼                            │
│  ┌──────────────────────────────────────────────┐    │
│  │           Investigation Service              │    │
│  │  Normalizer → Detector → Risk Engine         │    │
│  │  → AI Pipeline → Evidence Intelligence       │    │
│  │  → Threat Intel → Education → Recommender    │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

## Frontend (`Frontend/`)

| Module                           | Responsibility                                         |
| -------------------------------- | ------------------------------------------------------ |
| `App.tsx`                        | Root component, state management, API orchestration     |
| `WorkstationInput.tsx`           | Investigation input (text, URL, screenshot upload)      |
| `InvestigationReportView.tsx`    | Full investigation report layout                        |
| `InvestigationAssessmentPanel.tsx`| Evidence-grounded assessment summary beside risk score |
| `EvidenceGraphView.tsx`          | Interactive force-directed evidence relationship graph  |
| `EvidenceHighlighter.tsx`        | In-text evidence offset highlighting                    |
| `AiInterpretationSection.tsx`    | AI contextual analysis with clear boundary markers      |
| `EducationDeepDiveView.tsx`      | Scam tactic educational content                         |
| `RiskHero.tsx`                   | Visual risk score display                               |
| `UrlIntelSection.tsx`            | URL investigation results display                       |
| `utils/assessmentSummary.ts`     | Deterministic assessment summary generation             |

## Backend (`Backend/`)

### Services

| Service                  | Responsibility                                            |
| ------------------------ | --------------------------------------------------------- |
| `detector.ts`            | Pattern-based scam indicator detection (20+ categories)   |
| `normalizer.ts`          | Text normalization (Unicode, obfuscation, case folding)   |
| `risk_engine.ts`         | Multi-factor risk scoring and tier classification         |
| `investigation.ts`       | Investigation orchestration pipeline                      |
| `validator.ts`           | Input validation and sanitization                         |
| `recommender.ts`         | Defensive action recommendations                         |
| `logger.ts`              | Privacy-safe structured logging (zero raw-text)           |
| `ai/`                    | AI provider abstraction (OpenAI + local heuristic)        |
| `education/`             | Context-specific scam education content                   |
| `intelligence/`          | Evidence graph construction and analysis                  |
| `ocr/`                   | Screenshot text extraction pipeline                       |
| `threat_intel/`          | Threat intelligence cross-referencing                     |
| `url/`                   | URL resolution, domain analysis, SSRF protection          |

### Middleware

| Middleware               | Responsibility                                            |
| ------------------------ | --------------------------------------------------------- |
| `rate_limiter.ts`        | Sliding-window rate limiting per IP hash                  |
| `security_headers.ts`    | CSP, HSTS, X-Frame-Options, etc.                         |
| `request_tracer.ts`      | Request ID generation and correlation                     |

## Data Flow

1. User submits text/URL/screenshot via `WorkstationInput`
2. Frontend POSTs to `/api/investigate` or `/api/investigate-url`
3. Backend validates, normalizes, and runs the detection engine
4. Risk engine scores based on indicator count, severity, and category diversity
5. (Optional) AI provider adds contextual interpretation
6. Evidence intelligence builds relationship graph
7. Threat intel cross-references known patterns
8. Education module generates relevant scam awareness content
9. Full investigation report returned as JSON
10. Frontend renders interactive report with assessment panel

## Privacy Architecture

- No database — all processing is ephemeral in-memory
- Structured logs record only metadata (no user content)
- Client-side history via `localStorage`
- IP addresses hashed (SHA-256) in logs
- See [PRIVACY.md](PRIVACY.md) for details
