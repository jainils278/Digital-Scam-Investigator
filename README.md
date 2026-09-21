# Digital Scam Investigator

A privacy-preserving, evidence-first cybersecurity workstation for analyzing suspicious messages, emails, and URLs for scam indicators.

## Features

- **Deterministic Scam Detection** - Pattern-based engine covering 20+ scam categories (phishing, advance-fee, crypto, impersonation, OTP theft, etc.)
- **AI-Augmented Contextual Analysis** - Optional OpenAI integration for nuanced threat interpretation with strict human-AI evidence boundaries
- **URL Investigation** - Resolves shortened URLs, analyzes domain reputation, with full SSRF protection
- **Screenshot OCR** - Extract and analyze text from screenshots of suspicious messages
- **Evidence Graph** - Interactive visualization of detected indicators and their relationships
- **Investigation Assessment Panel** - Grounded, evidence-based risk summary with defensive recommendations
- **Threat Intelligence** - Cross-references known threat databases for reported scam patterns
- **Scam Education** - Context-specific educational content explaining detected scam tactics
- **Zero Server Retention** - All user data is processed ephemerally; no database, no disk storage

## Architecture

```text
Frontend/    React + TypeScript + Vite (investigation workstation UI)
Backend/     Express + TypeScript (detection engine, AI pipeline, URL analysis)
Tests/       Vitest unit/integration/adversarial tests + 45-case validation suite
Docs/        Architecture, privacy, and validation documentation
```

## Quick Start

### Prerequisites

- Node.js >= 20
- npm >= 10

### Setup

```bash
# Install all dependencies (workspaces)
npm install

# Copy environment template
cp .env.example .env
# (Optional) Add your OpenAI API key to .env for AI-augmented analysis

# Start development servers (backend + frontend)
npm run dev
```

The frontend runs on `http://localhost:5173` and the backend API on `http://localhost:3001`.

### Scripts

| Command                | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `npm run dev`          | Start both backend and frontend dev servers       |
| `npm run server`       | Start backend only (tsx watch)                    |
| `npm run client`       | Start frontend only (Vite dev)                    |
| `npm test`             | Run all automated tests                          |
| `npm run test:watch`   | Run tests in watch mode                           |
| `npm run test:validation` | Run 45-case validation benchmark               |
| `npm run build`        | Typecheck backend + build frontend for production |
| `npm run lint`         | Lint with oxlint                                  |

## Testing

The project includes comprehensive test coverage:

- **15 test suites** covering detector, risk engine, normalizer, validator, URL investigation, OCR pipeline, adversarial inputs, security headers, rate limiter, threat intelligence, evidence intelligence, education, integration, provider failure modes, and validation dataset
- **Automated test suite** with 0 failures
- **45-case validation benchmark** (15 scam, 15 legitimate, 15 ambiguous) - all passing

```bash
npm test                    # Unit + integration + adversarial tests
npm run test:validation     # 45-case validation benchmark
```

## Privacy

Digital Scam Investigator is designed with privacy as a core architectural constraint:

- Zero permanent server retention of user-submitted content
- Zero raw-text logging - structured metadata only
- Client-side investigation history (browser localStorage)
- Built-in PII redaction preview
- Fully offline fallback when no AI API key is configured

See [Docs/PRIVACY.md](Docs/PRIVACY.md) for the complete privacy architecture.

## License

MIT
