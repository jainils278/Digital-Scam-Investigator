# Validation

## Overview

The Digital Scam Investigator includes a 45-case structured validation dataset for regression testing and product quality assessment.

## Dataset Composition

| Class      | Count | IDs      | Description                                      |
| ---------- | ----- | -------- | ------------------------------------------------ |
| Scam       | 15    | S01–S15  | Known scam patterns (phishing, advance-fee, etc.) |
| Legitimate | 15    | L01–L15  | Genuine messages that should not trigger alerts    |
| Ambiguous  | 15    | A01–A15  | Borderline cases requiring careful classification  |

## Running Validation

```bash
# Run the full 45-case validation benchmark
npm run test:validation

# Run the validation dataset as Vitest tests
npm test -- Tests/validation/validation_dataset.test.ts
```

## Validation Criteria

Each case is evaluated against:

- **Assessment state**: SCAM_DETECTED / LEGITIMATE / AMBIGUOUS
- **Risk tier**: CRITICAL / HIGH / ELEVATED / MODERATE / LOW / BENIGN
- **Category match**: Expected scam category vs. actual
- **Evidence offsets**: Detected indicator positions within the source text
- **AI boundary**: AI interpretations correctly bounded and labeled

## Current Results

```
Total Cases: 45
PASS:        45
PARTIAL:     0
FAIL:        0

By Class:
  Scam       (15): 15 PASS
  Legitimate (15): 15 PASS
  Ambiguous  (15): 15 PASS
```

## Fixture Location

The validation dataset is defined in:

```
Tests/validation/fixtures/validation_dataset.ts
```

The validation runner is at:

```
Tests/validation/run_45_validation_run.ts
```

## Adding New Cases

To add a validation case, add an entry to the `VALIDATION_CASES` array in `validation_dataset.ts` with:

- `id`: Unique case identifier (e.g., `S16`, `L16`, `A16`)
- `label`: Expected class (`SCAM`, `LEGITIMATE`, `AMBIGUOUS`)
- `text`: The message content to investigate
- `expectedCategory`: Expected scam category (for scam cases)
- `expectedRiskBand`: Expected risk tier
- `expectedEvidence`: Key evidence strings expected in the output
