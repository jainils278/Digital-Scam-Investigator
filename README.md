# Digital Scam Investigator

A privacy-preserving, evidence-first cybersecurity workstation for analyzing suspicious messages, emails, and URLs for scam indicators.

![CI](https://img.shields.io/badge/CI-passing-brightgreen)
![Tests](https://img.shields.io/badge/tests-132%20passed-brightgreen)
![Validation](https://img.shields.io/badge/validation-45%2F45%20PASS-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x%20%7C%206.x-blue)

## Project Overview

Digital Scam Investigator is an open-source defensive cybersecurity workstation engineered to evaluate suspicious communications—including SMS (smishing), email phishing, crypto schemes, extortion attempts, and imposter solicitations. Built with an evidence-first philosophy, the system isolates deterministic, verifiable signals before synthesizing contextual findings, ensuring every flagged suspicion is tied to literal source evidence.

The workstation serves security analysts, fraud investigators, and everyday digital citizens seeking rapid, explainable risk assessments without exposing sensitive personal communications to external cloud storage or persistent databases.

## Highlights

- Evidence-First Architecture: Every finding links directly to exact character offsets within the source text.
- Separation of Concerns: Strict boundary between deterministic evidence and generative AI interpretation.
- Zero Permanent Server Retention: Inputs are processed ephemerally in memory; no database or disk caching.
- Deterministic Scoring: Calculated on a transparent 0–100 weighted index rather than opaque statistical probabilities.
- Passive URL Inspection: Structural and heuristic analysis without triggering outbound web requests or following redirects.
- Fully Resilient Offline Fallback: Operates autonomously with a built-in rule and heuristic engine when AI providers are unavailable.
- Educational Focus: Translates raw risk telemetry into grounded defensive guidance and scam mechanism breakdowns.

## What Makes It Different?

Most scam detection utilities rely on one of two extremes: rigid keyword blocklists that miss evolving social engineering, or ungrounded generative AI prompts that hallucinate findings, leak user communications to cloud providers, and produce arbitrary risk percentages without verifiable backing.

Digital Scam Investigator enforces an **Evidence-First Architecture**:

- Grounded in Verifiable Evidence: The deterministic detection engine scans raw text for concrete lexical, syntactical, and cryptographic artifacts (e.g., urgency markers, credential harvesting phrases, suspicious domain structures, cryptocurrency addresses, and impersonation patterns). Every detected indicator records exact start and end character offsets.
- Strict Evidence Boundaries for AI: When enabled, the AI layer acts strictly as an advisory analyst. It receives the verified indicators and input metadata, explaining why the observed tactics are dangerous and how victims are exploited. The AI cannot invent new evidence or modify deterministic findings.
- Deterministic 0–100 Assessment: Risk scores are not black-box probability calculations. They represent a deterministic composite of indicator severities, threat weights, and corroborating factors.
- Zero Tracking or Active Probing: The application performs purely passive structural inspection on URLs, ensuring the user is never exposed to tracking beacons, weaponized redirects, or active server-side exploits during analysis.

## Four-Stage Architecture

```text
+-------------------------------------------------------------+
|                         User Input                          |
|         (SMS / Text, Email, Passive URL, Screenshot)        |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                      Observed Evidence                      |
|      (Deterministic Engine, Character Offsets, Tokens)       |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                      AI Interpretation                      |
|       (Contextual Reasoning Layer - Strict Evidence Fence)  |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                       Risk Assessment                       |
|         (Deterministic 0–100 Score & Standard Tier)         |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                      Defensive Actions                      |
|       (Actionable Mitigations, Evidence Graph, Education)    |
+-------------------------------------------------------------+
```

## Features

### Deterministic Scam Detection

- Scans messages across multiple specialized scam categories, including bank impersonation, advance-fee fraud (419), package delivery smishing, urgent credential harvesting, crypto giveaway scams, and fake tech support.
- Automatically maps exact character spans to identified indicators for direct visual inspection.
- Normalizes unicode variations, homoglyphs, and obfuscated text to counter basic evasion tactics.

### AI-Augmented Contextual Analysis

- Integrates optionally with OpenAI (GPT-4o) to synthesize complex social engineering narratives.
- Operates within a hardened evidence boundary: AI is given verified indicators as ground truth and cannot alter findings.
- Features automatic heuristic fallback when no API key is supplied or when network outages occur, maintaining uninterrupted operation.

### Passive URL Investigation

- Evaluates URL structure, suspicious top-level domains, punycode/homoglyph patterns, IP-based hosts, subdomain stacking, brand-squatting patterns, and other structural indicators.
- Performs exclusively passive structural analysis.
- Arbitrary outbound URL fetching and redirect following are strictly not performed by the investigation engine, keeping users safe from malicious payloads or token logging.

### Screenshot / OCR Investigation

- Ingests image files (PNG, JPEG, WebP) directly through the workstation interface.
- Extracts message bodies via OCR text preprocessing, feeding recognized text through the deterministic pipeline.
- Handles synthetic text tags and embedded test payloads cleanly without server-side file leakage.

### Evidence Graph

- Generates an interactive relationship diagram connecting entities, indicators, categories, and communication channels.
- Provides analysts with a clear visual topology of how deceptive techniques converge in a single attack.

### Threat Intelligence

- Cross-references extracted indicators against available threat-intelligence signatures and configured scam patterns.
- Correlates observed indicators with known fraudulent tactics and risk indicators.

### Scam Education

- Provides tailored learning modules based on the exact tactics identified in the investigated text.
- Explains the psychology behind urgency cues, false authority, and emotional manipulation.

## Risk Assessment Framework

The investigation score is a deterministic, non-probabilistic rating from 0 to 100 representing accumulated evidence severity:

| Score Range | Risk Level | Description | Recommended Defensive Action |
| --- | --- | --- | --- |
| 0–15 | Minimal | No significant suspicious indicators observed; standard communication patterns. | Maintain standard digital awareness; no immediate action required. |
| 16–40 | Low | Minor anomalies or generic marketing phrasing detected; low probability of malicious intent. | Verify sender authenticity through independent channels before responding. |
| 41–70 | Medium | Corroborating suspicious elements observed, such as unverified links or mild urgency. | Do not click links, download attachments, or share sensitive details. |
| 71–89 | High | Multiple strong scam indicators confirmed (e.g., impersonation, financial demands). | Cease all contact; report the message to service providers and relevant authorities. |
| 90–100 | Critical | Blatant scam signatures verified (e.g., OTP theft, active account suspension threats, known scam phrases). | Block sender immediately; secure related accounts and monitor credentials for exposure. |

## Validation & Test Suite

The system is validated through an extensive automated verification pipeline and an independent 45-case real-world benchmark:

| Metric | Result | Target Baseline | Status |
| --- | --- | --- | --- |
| Test Suites | 15 suites | 15 suites | PASS |
| Automated Tests | 132 tests | >= 112 tests | PASS |
| Failed Tests | 0 failures | 0 failures | PASS |
| 45-Case Validation Benchmark | 45 / 45 passed | 45 / 45 passed | PASS |
| - Scam Cases (S01–S15) | 15 / 15 passed | 15 / 15 passed | PASS |
| - Legitimate Cases (L01–L15) | 15 / 15 passed | 15 / 15 passed | PASS |
| - Ambiguous Cases (A01–A15) | 15 / 15 passed | 15 / 15 passed | PASS |

## Repository Architecture

```text
Digital-Scam-Investigator/
├── .github/
│   └── workflows/
│       └── ci.yml
├── Backend/
│   ├── src/
│   │   ├── config/
│   │   ├── data/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   ├── ocr/
│   │   │   ├── threat_intel/
│   │   │   ├── detector.ts
│   │   │   ├── education.ts
│   │   │   ├── evidence_intelligence.ts
│   │   │   ├── investigation.ts
│   │   │   ├── logger.ts
│   │   │   ├── normalizer.ts
│   │   │   ├── risk_engine.ts
│   │   │   ├── url_investigation.ts
│   │   │   └── validator.ts
│   │   ├── index.ts
│   │   └── types.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── Docs/
│   ├── ARCHITECTURE.md
│   ├── PRIVACY.md
│   └── VALIDATION.md
├── Frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── main.tsx
│   │   └── types.ts
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── Tests/
│   ├── validation/
│   │   ├── fixtures/
│   │   ├── run_45_validation_run.ts
│   │   └── validation_dataset.test.ts
│   ├── *.test.ts
│   └── tsconfig.json
├── .env.example
├── .gitignore
├── .oxlintrc.json
├── package.json
├── README.md
├── tsconfig.json
└── vitest.config.ts
```

## Technology Stack

| Layer | Component | Technology | Purpose |
| --- | --- | --- | --- |
| Frontend | UI Framework | React 19 + TypeScript | High-responsiveness investigation workstation interface |
| Frontend | Bundler & Server | Vite 8 | Fast ESM-based development server and production build |
| Frontend | Styling | Custom Vanilla CSS | Security-focused, distraction-free analytical interface |
| Backend | Application Runtime | Node.js (>= 20) + Express 5 | Resilient HTTP API with hardened security headers |
| Backend | Execution & Tooling | tsx + TypeScript 5.x / 6.x | Native TypeScript execution for dev and scripts |
| AI Integration | Contextual Engine | OpenAI API (GPT-4o) | Advisory threat analysis with strict evidence grounding |
| Testing | Test Framework | Vitest 5 | High-speed unit, integration, and adversarial test execution |
| Quality | Linter | oxlint | High-performance Rust-based static code analysis |

## Privacy & Security

Digital Scam Investigator is engineered under strict privacy constraints:

- Zero Server Retention: No database, file store, or cache records user-submitted message content.
- No Raw Text Logging: System logs contain only structured metadata, timings, and cryptographic IP hashes. Raw investigative content is never printed to server stdout or files.
- Client-Side History: Investigation history is stored exclusively in the user's browser localStorage. The server remains completely stateless.
- Server-Side Secret Management: OpenAI API keys and configuration values remain strictly on the backend and are never sent or exposed to the client browser.
- Passive Analysis Only: Arbitrary outbound URL fetching and redirect following are not performed, preventing tracking pixels or CSRF/SSRF attacks.
- Robust Fallback: When AI credentials are not supplied, detection falls back to local heuristics without requiring an external AI provider.

## Quick Start

### Prerequisites

- Node.js >= 20
- npm >= 10

### Installation & Setup

```bash
# Clone the repository
git clone https://github.com/jainils278/Digital-Scam-Investigator.git
cd Digital-Scam-Investigator

# Install workspace dependencies
npm install

# Configure environment variables
cp .env.example .env
```

### Environment Configuration

Configure optional settings in your .env file:

```env
PORT=3001
NODE_ENV=development
OPENAI_API_KEY=
AI_PROVIDER=heuristic
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=60
```

### Running the Application

```bash
# Start both backend and frontend development servers concurrently
npm run dev
```

The workstation interface will be accessible at http://localhost:5173 and the backend API at http://localhost:3001.

## Available Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Run backend and frontend servers concurrently for local development |
| `npm run server` | Run backend server only using tsx watch mode |
| `npm run client` | Run frontend development server only using Vite |
| `npm test` | Run all 15 automated Vitest test suites (132 tests) |
| `npm run test:watch` | Run Vitest in interactive watch mode |
| `npm run test:validation` | Run the complete 45-case end-to-end validation benchmark |
| `npm run build` | Compile backend and build frontend distribution package |
| `npm run build:backend` | Validate and typecheck backend TypeScript files |
| `npm run build:frontend` | Compile and bundle the frontend application with Vite |
| `npm run lint` | Perform static code analysis using oxlint |

## Documentation

For comprehensive technical documentation, refer to the following guides:

- [Docs/ARCHITECTURE.md](Docs/ARCHITECTURE.md) - Full technical architecture, component lifecycle, and data flow specifications.
- [Docs/PRIVACY.md](Docs/PRIVACY.md) - Complete privacy model, zero-retention guarantees, and logging constraints.
- [Docs/VALIDATION.md](Docs/VALIDATION.md) - Validation methodology, test suite categorization, and benchmark details.

## Important Disclaimer

Digital Scam Investigator is a defensive cybersecurity and educational research tool designed to assist analysts and users in identifying common social engineering and fraud patterns. It does not provide legal, financial, or certified forensic advice. Detection assessments are heuristic and evidence-based; they do not guarantee the maliciousness or legitimacy of any specific sender or message. Users must exercise independent judgment and verify high-consequence communications through official out-of-band channels.

## License

This project is open-source software licensed under the MIT License.
