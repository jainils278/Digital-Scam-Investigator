/**
 * Product Validation Run Script
 * Executes all 45 validation cases against the real live running API (http://localhost:3001/api/investigate)
 * and assesses the resulting report through the real UI derivation logic (deriveInvestigationAssessment).
 */

import fs from 'fs';
import path from 'path';
import request from 'supertest';
import { app } from '../../Backend/src/index.js';
import { VALIDATION_DATASET, ValidationCase } from './fixtures/validation_dataset.js';
import { deriveInvestigationAssessment, AssessmentPanelData } from '../../Frontend/src/utils/assessmentSummary.js';
import { InvestigationReport } from '../../Backend/src/types.js';

interface CaseRunResult {
  id: string;
  label: string;
  categoryExpected: string;
  categoryActual: string;
  categoryMatch: boolean;
  statusExpected: string;
  statusActual: string;
  statusMatch: boolean;
  riskBandExpected: string;
  riskBandActual: string;
  riskScore: number;
  riskBandMatch: boolean;
  evidenceStrengthExpected: string;
  evidenceStrengthActual: string;
  evidenceStrengthMatch: boolean;
  expectedEvidence: string[];
  actualEvidence: string[];
  evidenceCount: number;
  offsetsValid: boolean;
  offsetsDetails: Array<{ evidence: string; range: [number, number]; exactMatch: boolean; extracted: string }>;
  panelBadge: string;
  panelKeyItems: string[];
  panelClarification: string;
  forbiddenTermsFound: string[];
  aiBoundaryViolated: boolean;
  verdict: 'PASS' | 'PARTIAL' | 'FAIL';
  failureReasons: string[];
  notes: string;
}

const FORBIDDEN_TERMS = [
  'COMPLETELY SAFE',
  '100% LEGITIMATE',
  'NOT A SCAM',
  'CONFIRMED SCAM',
  'GUARANTEED FAKE',
  'DEFINITELY FRAUDULENT',
  'DEFINITELY COMPROMISED',
  'MONEY DEFINITELY STOLEN',
];

function checkRiskBand(expected: string, actual: string, score: number): boolean {
  if (expected === 'HIGH_OR_CRITICAL') {
    return actual === 'HIGH' || actual === 'CRITICAL';
  }
  if (expected === 'HIGH') {
    return actual === 'HIGH' || actual === 'CRITICAL';
  }
  if (expected === 'BENIGN') {
    return actual === 'BENIGN' && score === 0;
  }
  if (expected === 'BENIGN_OR_LOW') {
    return (actual === 'BENIGN' || actual === 'LOW') && score <= 40;
  }
  return expected === actual;
}

function checkEvidenceStrength(expected: string, actual: string): boolean {
  if (expected === 'MODERATE_OR_SUBSTANTIAL') {
    return actual === 'MODERATE' || actual === 'SUBSTANTIAL';
  }
  if (expected === 'MINIMAL_OR_LIMITED') {
    return actual === 'MINIMAL' || actual === 'LIMITED';
  }
  return expected === actual;
}

async function runCase(c: ValidationCase): Promise<CaseRunResult> {
  const failureReasons: string[] = [];

  // 1. Call API via supertest in-process (works with or without external running server)
  const res = await request(app)
    .post('/api/investigate')
    .send({
      text: c.text,
      messageType: c.channel,
    });

  if (res.status !== 200) {
    throw new Error(`API error for ${c.id}: ${res.status}`);
  }

  const json = res.body as { success: boolean; report: InvestigationReport };
  const report = json.report;

  // 2. Derive Assessment Panel Data
  const assessment: AssessmentPanelData = deriveInvestigationAssessment(report);

  // 3. Status Mapping
  let expectedStatus = 'SUSPICIOUS';
  if (c.label === 'LEGITIMATE') expectedStatus = 'NO_INDICATORS';
  if (c.label === 'AMBIGUOUS') expectedStatus = 'AMBIGUOUS';

  const statusMatch = assessment.state === expectedStatus;
  if (!statusMatch) {
    failureReasons.push(`Status mismatch: expected ${expectedStatus}, got ${assessment.state}`);
  }

  // 4. Risk Band Check
  const actualRiskLevel = report.riskAssessment.level;
  const actualRiskScore = report.riskAssessment.score;
  const riskBandMatch = checkRiskBand(c.expectedRiskBand, actualRiskLevel, actualRiskScore);
  if (!riskBandMatch) {
    failureReasons.push(`Risk band mismatch: expected ${c.expectedRiskBand}, got ${actualRiskLevel} (${actualRiskScore})`);
  }

  // 5. Evidence Strength Check
  const actualEvidenceStrength = report.riskAssessment.evidenceStrength;
  const evidenceStrengthMatch = checkEvidenceStrength(c.expectedEvidenceStrength, actualEvidenceStrength);
  if (!evidenceStrengthMatch) {
    failureReasons.push(`Evidence strength mismatch: expected ${c.expectedEvidenceStrength}, got ${actualEvidenceStrength}`);
  }

  // 6. Evidence & Offsets Check
  let offsetsValid = true;
  const offsetsDetails: Array<{ evidence: string; range: [number, number]; exactMatch: boolean; extracted: string }> = [];

  for (const ind of report.observedIndicators || []) {
    const start = ind.characterRange[0];
    const end = ind.characterRange[1];
    const extracted = report.rawText.substring(start, end);
    const exactMatch = extracted.toLowerCase() === ind.evidence.toLowerCase();

    if (!exactMatch) {
      offsetsValid = false;
      failureReasons.push(`Broken offset for "${ind.evidence}": substring at [${start}, ${end}] was "${extracted}"`);
    }

    offsetsDetails.push({
      evidence: ind.evidence,
      range: ind.characterRange,
      exactMatch,
      extracted,
    });

    // Check indicator source is deterministic
    if (ind.source && ind.source !== 'DETERMINISTIC') {
      failureReasons.push(`Indicator "${ind.name}" source is not DETERMINISTIC: ${ind.source}`);
    }
  }

  // Check expected evidence for SCAM
  const actualEvidences = (report.observedIndicators || []).map((i) => i.evidence);
  if (c.label === 'SCAM' && c.expectedEvidence.length > 0) {
    // Check if at least primary evidence pieces were identified
    const foundAny = c.expectedEvidence.some((exp) =>
      actualEvidences.some((act) => act.toLowerCase().includes(exp.toLowerCase()) || exp.toLowerCase().includes(act.toLowerCase()))
    );
    if (!foundAny) {
      failureReasons.push(`None of expected evidence phrases found in observed indicators.`);
    }
  }

  // Check expected indicators for LEGITIMATE (should be 0)
  if (c.label === 'LEGITIMATE' && (report.observedIndicators || []).length > 0) {
    failureReasons.push(`False positive: Legitimate message produced ${(report.observedIndicators || []).length} indicators`);
  }

  // Check expected indicators for AMBIGUOUS
  if (c.label === 'AMBIGUOUS' && actualRiskLevel === 'CRITICAL') {
    failureReasons.push(`Ambiguous message incorrectly escalated to CRITICAL risk`);
  }

  // 7. Forbidden Terms Check
  const forbiddenFound: string[] = [];
  const textToCheck = [
    assessment.badgeText,
    assessment.category,
    ...assessment.keyItems,
    assessment.clarification,
    report.disclaimer,
    ...report.defensiveRecommendations.map((r) => r.title + ' ' + r.detail),
  ].join(' ').toUpperCase();

  for (const term of FORBIDDEN_TERMS) {
    if (textToCheck.includes(term)) {
      forbiddenFound.push(term);
      failureReasons.push(`Forbidden term encountered in user-facing text: "${term}"`);
    }
  }

  // For legitimate state, strictly cannot contain "SAFE" as a standalone word in badge
  if (c.label === 'LEGITIMATE' && /\bSAFE\b/i.test(assessment.badgeText)) {
    forbiddenFound.push('SAFE');
    failureReasons.push(`Forbidden word "SAFE" found in legitimate badgeText`);
  }

  // 8. AI Boundary Check
  let aiBoundaryViolated = false;
  for (const ind of report.observedIndicators || []) {
    if (ind.source === 'AI' || ind.id.startsWith('ind_ai_')) {
      aiBoundaryViolated = true;
      failureReasons.push(`AI indicator penetrated deterministic observed evidence: ${ind.name}`);
    }
  }

  // 9. Category alignment
  const categoryMatch =
    assessment.category.toLowerCase().includes(c.category.toLowerCase()) ||
    c.category.toLowerCase().includes(assessment.category.toLowerCase()) ||
    (c.label === 'LEGITIMATE' && assessment.category === 'General Communication') ||
    (c.label === 'AMBIGUOUS' && (assessment.category.includes('Delivery') || assessment.category.includes('Payment') || assessment.category.includes('Account')));

  // 10. Final Verdict Determination
  let verdict: 'PASS' | 'PARTIAL' | 'FAIL' = 'PASS';
  if (failureReasons.length > 0) {
    // Determine severity:
    const isSevere =
      !statusMatch ||
      !riskBandMatch ||
      !offsetsValid ||
      forbiddenFound.length > 0 ||
      aiBoundaryViolated ||
      (c.label === 'SCAM' && (report.observedIndicators || []).length === 0) ||
      (c.label === 'LEGITIMATE' && (report.observedIndicators || []).length > 0);

    if (isSevere) {
      verdict = 'FAIL';
    } else {
      verdict = 'PARTIAL';
    }
  }

  return {
    id: c.id,
    label: c.label,
    categoryExpected: c.category,
    categoryActual: assessment.category,
    categoryMatch,
    statusExpected: expectedStatus,
    statusActual: assessment.state,
    statusMatch,
    riskBandExpected: c.expectedRiskBand,
    riskBandActual: actualRiskLevel,
    riskScore: actualRiskScore,
    riskBandMatch,
    evidenceStrengthExpected: c.expectedEvidenceStrength,
    evidenceStrengthActual: actualEvidenceStrength,
    evidenceStrengthMatch,
    expectedEvidence: c.expectedEvidence,
    actualEvidence: actualEvidences,
    evidenceCount: (report.observedIndicators || []).length,
    offsetsValid,
    offsetsDetails,
    panelBadge: assessment.badgeText,
    panelKeyItems: assessment.keyItems,
    panelClarification: assessment.clarification,
    forbiddenTermsFound: forbiddenFound,
    aiBoundaryViolated,
    verdict,
    failureReasons,
    notes: c.notes,
  };
}

async function main() {
  console.log(`Starting Validation Run for ${VALIDATION_DATASET.length} cases...`);
  const results: CaseRunResult[] = [];

  for (const c of VALIDATION_DATASET) {
    try {
      const res = await runCase(c);
      results.push(res);
      console.log(`[${res.verdict}] ${c.id} (${c.label}) - Score: ${res.riskScore} (${res.riskBandActual}) - State: ${res.statusActual} - Inds: ${res.evidenceCount}`);
      if (res.failureReasons.length > 0) {
        console.log(`       Issues: ${res.failureReasons.join('; ')}`);
      }
    } catch (err: any) {
      console.error(`FATAL ERROR on ${c.id}:`, err.message);
      results.push({
        id: c.id,
        label: c.label,
        categoryExpected: c.category,
        categoryActual: 'ERROR',
        categoryMatch: false,
        statusExpected: 'UNKNOWN',
        statusActual: 'ERROR',
        statusMatch: false,
        riskBandExpected: c.expectedRiskBand,
        riskBandActual: 'ERROR',
        riskScore: -1,
        riskBandMatch: false,
        evidenceStrengthExpected: c.expectedEvidenceStrength,
        evidenceStrengthActual: 'ERROR',
        evidenceStrengthMatch: false,
        expectedEvidence: c.expectedEvidence,
        actualEvidence: [],
        evidenceCount: 0,
        offsetsValid: false,
        offsetsDetails: [],
        panelBadge: 'ERROR',
        panelKeyItems: [],
        panelClarification: '',
        forbiddenTermsFound: [],
        aiBoundaryViolated: false,
        verdict: 'FAIL',
        failureReasons: [`API Exception: ${err.message}`],
        notes: c.notes,
      });
    }
  }

  // Save complete JSON result if requested
  if (process.env.SAVE_VALIDATION_RESULTS) {
    const outputPath = path.resolve('Tests/validation/validation_results.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`Saved detailed results to ${outputPath}`);
  }

  // Print Summary
  const passCount = results.filter((r) => r.verdict === 'PASS').length;
  const partialCount = results.filter((r) => r.verdict === 'PARTIAL').length;
  const failCount = results.filter((r) => r.verdict === 'FAIL').length;

  console.log('\n================ VALIDATION RUN SUMMARY ================');
  console.log(`Total Cases: ${results.length}`);
  console.log(`PASS:        ${passCount}`);
  console.log(`PARTIAL:     ${partialCount}`);
  console.log(`FAIL:        ${failCount}`);

  const scam = results.filter((r) => r.label === 'SCAM');
  const leg = results.filter((r) => r.label === 'LEGITIMATE');
  const amb = results.filter((r) => r.label === 'AMBIGUOUS');

  console.log('\nBy Class Breakdown:');
  console.log(`Scam       (15): PASS ${scam.filter((r) => r.verdict === 'PASS').length}, PARTIAL ${scam.filter((r) => r.verdict === 'PARTIAL').length}, FAIL ${scam.filter((r) => r.verdict === 'FAIL').length}`);
  console.log(`Legitimate (15): PASS ${leg.filter((r) => r.verdict === 'PASS').length}, PARTIAL ${leg.filter((r) => r.verdict === 'PARTIAL').length}, FAIL ${leg.filter((r) => r.verdict === 'FAIL').length}`);
  console.log(`Ambiguous  (15): PASS ${amb.filter((r) => r.verdict === 'PASS').length}, PARTIAL ${amb.filter((r) => r.verdict === 'PARTIAL').length}, FAIL ${amb.filter((r) => r.verdict === 'FAIL').length}`);
}

main().catch(console.error);
