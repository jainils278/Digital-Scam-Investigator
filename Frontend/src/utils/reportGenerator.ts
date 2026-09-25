/**
 * Digital Scam Investigator - Full Investigation Report Generator
 * 
 * 100% Client-Side generation adhering to zero-retention privacy principles.
 * Compiles the existing structured InvestigationReport into a comprehensive,
 * self-contained, print-friendly and audit-ready HTML document with an integrated
 * client-side PDF download capability (no print dialog, zero external CDN dependencies).
 * 
 * Single source of truth: Uses the exact structured investigation report object,
 * preserving identical scoring, verified evidence, OCR telemetry, and passive URL findings.
 */

import type { InvestigationReport } from '../types';

/* ========================================================================== */
/* PDF Generation Primitives (Pure Client-Side / Offline / Zero Dependency)  */
/* ========================================================================== */

function escapePdfText(str: string): string {
  if (!str) return '';
  return str
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201C|\u201D/g, '"')
    .replace(/\u2014|\u2013/g, '-')
    .replace(/\u2022/g, '*')
    .replace(/\u2026/g, '...')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E]/g, ' ');
}

function wrapText(text: string, maxChars: number): string[] {
  if (!text) return [];
  const words = text.replace(/[\r\n]+/g, ' ').trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';
  for (const word of words) {
    if (!currentLine) {
      if (word.length > maxChars) {
        let rem = word;
        while (rem.length > maxChars) {
          lines.push(rem.slice(0, maxChars));
          rem = rem.slice(maxChars);
        }
        currentLine = rem;
      } else {
        currentLine = word;
      }
    } else if ((currentLine + ' ' + word).length <= maxChars) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      if (word.length > maxChars) {
        let rem = word;
        while (rem.length > maxChars) {
          lines.push(rem.slice(0, maxChars));
          rem = rem.slice(maxChars);
        }
        currentLine = rem;
      } else {
        currentLine = word;
      }
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

class SimplePdfWriter {
  private pages: string[] = [];
  private currentOps: string[] = [];
  private readonly left = 40;
  private readonly right = 555;
  private readonly width = 515;
  private readonly topMargin = 790;
  private readonly bottomMargin = 55;
  private y = 790;

  constructor() {
    this.startNewPage();
  }

  public getY(): number {
    return this.y;
  }

  public startNewPage(): void {
    if (this.currentOps.length > 0) {
      this.pages.push(this.currentOps.join('\n'));
      this.currentOps = [];
    }
    this.y = this.topMargin;
  }

  public checkSpace(needed: number): void {
    if (this.y - needed < this.bottomMargin) {
      this.startNewPage();
    }
  }

  public fillRect(x: number, y: number, w: number, h: number, r: number, g: number, b: number): void {
    this.currentOps.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`);
    this.currentOps.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re`);
    this.currentOps.push('f');
  }

  public strokeRect(x: number, y: number, w: number, h: number, r: number, g: number, b: number, lineWidth = 0.5): void {
    this.currentOps.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG`);
    this.currentOps.push(`${lineWidth.toFixed(2)} w`);
    this.currentOps.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re`);
    this.currentOps.push('S');
  }

  public drawLine(x1: number, y1: number, x2: number, y2: number, r: number, g: number, b: number, lineWidth = 0.5): void {
    this.currentOps.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG`);
    this.currentOps.push(`${lineWidth.toFixed(2)} w`);
    this.currentOps.push(`${x1.toFixed(2)} ${y1.toFixed(2)} m`);
    this.currentOps.push(`${x2.toFixed(2)} ${y2.toFixed(2)} l`);
    this.currentOps.push('S');
  }

  public drawText(text: string, font: 'F1' | 'F2' | 'F3' | 'F4', size: number, r: number, g: number, b: number, x = this.left, y = this.y): void {
    const escaped = escapePdfText(text);
    this.currentOps.push('BT');
    this.currentOps.push(`/${font} ${size} Tf`);
    this.currentOps.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`);
    this.currentOps.push(`${x.toFixed(2)} ${y.toFixed(2)} Td`);
    this.currentOps.push(`(${escaped}) Tj`);
    this.currentOps.push('ET');
  }

  public addLine(text: string, font: 'F1' | 'F2' | 'F3' | 'F4', size: number, r: number, g: number, b: number, lineHeight = size + 3, indent = 0): void {
    this.checkSpace(lineHeight);
    this.drawText(text, font, size, r, g, b, this.left + indent, this.y);
    this.y -= lineHeight;
  }

  public addParagraph(text: string, font: 'F1' | 'F2' | 'F3' | 'F4', size: number, r: number, g: number, b: number, lineHeight = size + 3, indent = 0, customWidth?: number): void {
    const w = customWidth || (this.width - indent);
    const maxChars = Math.floor(w / (size * (font === 'F2' ? 0.58 : 0.52)));
    const lines = wrapText(text, maxChars);
    for (const line of lines) {
      this.addLine(line, font, size, r, g, b, lineHeight, indent);
    }
  }

  public addQuote(text: string): void {
    this.checkSpace(24);
    this.drawLine(this.left + 4, this.y + 6, this.left + 4, this.y - 12, 0.22, 0.74, 0.97, 2);
    this.addParagraph(`"${text}"`, 'F3', 7.5, 0.75, 0.82, 0.90, 10.5, 12);
  }

  public addSectionHeading(title: string): void {
    this.checkSpace(28);
    this.y -= 6;
    this.drawLine(this.left, this.y + 11, this.right, this.y + 11, 0.22, 0.74, 0.97, 0.75);
    this.addLine(title.toUpperCase(), 'F2', 9.5, 0.22, 0.74, 0.97, 13);
    this.y -= 2;
  }

  public finalize(reportId: string): string[] {
    if (this.currentOps.length > 0) {
      this.pages.push(this.currentOps.join('\n'));
      this.currentOps = [];
    }
    const totalPages = this.pages.length;
    const finalized: string[] = [];
    for (let i = 0; i < totalPages; i++) {
      const footerOps = [
        '0.3 0.4 0.5 RG',
        '0.5 w',
        `${this.left.toFixed(2)} 42.00 m`,
        `${this.right.toFixed(2)} 42.00 l`,
        'S',
        'BT',
        '/F1 7.5 Tf',
        '0.58 0.64 0.72 rg',
        `${this.left.toFixed(2)} 30.00 Td`,
        `(${escapePdfText(`Scamvera Digital Scam Investigator • Confidential Investigation Report • ID: ${reportId}`)}) Tj`,
        'ET',
        'BT',
        '/F1 7.5 Tf',
        '0.58 0.64 0.72 rg',
        `${(this.right - 65).toFixed(2)} 30.00 Td`,
        `(${escapePdfText(`Page ${i + 1} of ${totalPages}`)}) Tj`,
        'ET',
      ];
      finalized.push(this.pages[i] + '\n' + footerOps.join('\n'));
    }
    return finalized;
  }
}

function assemblePdfDocument(pagesContentStreams: string[]): Uint8Array {
  const pageCount = pagesContentStreams.length;
  const pageObjIds: number[] = [];
  for (let i = 0; i < pageCount; i++) {
    pageObjIds.push(4 + i);
  }

  const objects: string[] = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  objects.push(`2 0 obj\n<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageCount} >>\nendobj`);
  objects.push(`3 0 obj\n<< /Font <<
    /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
    /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
    /F3 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>
    /F4 << /Type /Font /Subtype /Type1 /BaseFont /Courier >>
  >> >>\nendobj`);

  for (let i = 0; i < pageCount; i++) {
    const streamObjId = 4 + pageCount + i;
    objects.push(`${4 + i} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources 3 0 R /Contents ${streamObjId} 0 R >>\nendobj`);
  }

  const encoder = new TextEncoder();
  for (let i = 0; i < pageCount; i++) {
    const streamContent = pagesContentStreams[i];
    const streamObjId = 4 + pageCount + i;
    const streamLength = encoder.encode(streamContent).length;
    objects.push(`${streamObjId} 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj`);
  }

  const header = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  let body = '';
  const offsets: number[] = [];

  let currentOffset = encoder.encode(header).length;
  for (let i = 0; i < objects.length; i++) {
    offsets.push(currentOffset);
    const objStr = objects[i] + '\n';
    body += objStr;
    currentOffset += encoder.encode(objStr).length;
  }

  const startXref = currentOffset;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \r\n`;
  for (let i = 0; i < offsets.length; i++) {
    const offsetStr = String(offsets[i]).padStart(10, '0');
    xref += `${offsetStr} 00000 n \r\n`;
  }

  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;
  return encoder.encode(header + body + xref + trailer);
}

/**
 * Pure deterministic client-side PDF document generator.
 * Produces a valid, self-contained PDF 1.4 binary (Uint8Array).
 */
export function generateInvestigationPdfBytes(report: InvestigationReport): Uint8Array {
  const writer = new SimplePdfWriter();
  const {
    id,
    timestamp,
    inputMeta,
    rawText,
    observedIndicators,
    aiContext,
    riskAssessment,
    defensiveRecommendations,
    disclaimer,
    urlAnalysis,
    screenshotMeta,
    evidenceIntelligence,
    tactics,
    contradictions,
    missingEvidence,
  } = report;

  const { score, level, evidenceStrength, primaryCategories, waterfall } = riskAssessment;
  const formattedDate = new Date(timestamp).toUTCString();

  const isScreenshot = !!screenshotMeta;
  const isUrlMode = !!(urlAnalysis && urlAnalysis.length > 0);
  const modeLabel = isScreenshot
    ? 'SCREENSHOT / OCR INVESTIGATION'
    : isUrlMode
    ? 'DIRECT URL INVESTIGATION'
    : 'TEXT MESSAGE INVESTIGATION';

  // 1. Header Banner
  writer.fillRect(40, writer.getY() - 28, 515, 34, 0.04, 0.07, 0.13);
  writer.addLine('DIGITAL SCAM INVESTIGATOR - OFFICIAL AUDIT REPORT', 'F2', 12, 1, 1, 1, 15, 10);
  writer.addLine(`REPORT ID: ${id}  •  DATE: ${formattedDate}  •  MODE: ${modeLabel}`, 'F1', 7.5, 0.7, 0.8, 0.9, 14, 10);

  // 2. Risk Rating Banner
  writer.checkSpace(50);
  let r = 0.01, g = 0.52, b = 0.78;
  if (level === 'CRITICAL') { r = 0.86; g = 0.15; b = 0.15; }
  else if (level === 'HIGH') { r = 0.92; g = 0.35; b = 0.05; }
  else if (level === 'MEDIUM') { r = 0.85; g = 0.47; b = 0.02; }
  else if (level === 'LOW') { r = 0.02; g = 0.59; b = 0.41; }

  writer.fillRect(40, writer.getY() - 36, 515, 42, 0.07, 0.10, 0.18);
  writer.strokeRect(40, writer.getY() - 36, 515, 42, r, g, b, 1);
  writer.addLine(`OVERALL RISK RATING: ${score} / 100  [ ${level} RISK ]`, 'F2', 12.5, r, g, b, 16, 12);
  writer.addLine(`Evidence Strength: ${evidenceStrength}  •  Primary Categories: ${primaryCategories.join(', ') || 'None'}`, 'F1', 8, 0.8, 0.85, 0.9, 18, 12);

  // 3. Simple Executive Conclusion
  const getSimpleConclusion = () => {
    if (level === 'BENIGN' || level === 'LOW') {
      return `The ${isScreenshot ? 'image' : isUrlMode ? 'URL' : 'message'} does not contain recognized scam patterns currently checked by the system. However, this does not verify sender identity or guarantee authenticity.`;
    }
    if (level === 'CRITICAL' || level === 'HIGH') {
      return `The ${isScreenshot ? 'image' : isUrlMode ? 'URL' : 'message'} contains high-risk indicators associated with ${primaryCategories.join(' and ') || 'suspicious communications'}. Immediate caution is advised before clicking links, sharing information, or sending payments.`;
    }
    return `The ${isScreenshot ? 'image' : isUrlMode ? 'URL' : 'message'} contains cautionary warning signs commonly associated with ${primaryCategories.join(' and ') || 'suspicious communications'}. Verify the sender through trusted independent channels before responding.`;
  };
  writer.checkSpace(28);
  writer.addLine('INVESTIGATION CONCLUSION:', 'F2', 9, 0.22, 0.74, 0.97, 12);
  writer.addParagraph(getSimpleConclusion(), 'F1', 8, 0.2, 0.25, 0.3, 11, 8);

  // 4. Explainable Risk Waterfall Breakdown
  if (waterfall) {
    writer.addSectionHeading('Explainable Risk Waterfall Breakdown');
    writer.addLine(`Base Contributing Factors: +${waterfall.baseScore} pts`, 'F2', 8.5, 0.22, 0.74, 0.97, 12);
    const baseItems = waterfall.contributions.filter((c) => c.type === 'BASE_SEVERITY');
    for (const c of baseItems) {
      writer.addLine(`• ${c.label}: +${c.points} pts`, 'F2', 8, 0.3, 0.35, 0.4, 10.5, 8);
      writer.addParagraph(c.explanation, 'F1', 7.5, 0.4, 0.45, 0.5, 10, 16);
    }
    if (waterfall.synergyScore > 0) {
      writer.addLine(`Compound Risk Synergies: +${waterfall.synergyScore} pts`, 'F2', 8.5, 0.85, 0.47, 0.02, 12);
      const synItems = waterfall.contributions.filter((c) => c.type === 'COMPOUND_SYNERGY');
      for (const s of synItems) {
        writer.addLine(`• ${s.label}: +${s.points} pts`, 'F2', 8, 0.3, 0.35, 0.4, 10.5, 8);
        writer.addParagraph(s.explanation, 'F1', 7.5, 0.4, 0.45, 0.5, 10, 16);
      }
    }
    writer.addLine(`Total Raw Points: ${waterfall.rawTotalScore} pts`, 'F2', 8.5, 0.2, 0.25, 0.3, 11);
    if (waterfall.capAdjustment !== 0) {
      writer.addLine(`Upper Ceiling Clamping Adjustment: ${waterfall.capAdjustment} pts`, 'F1', 8, 0.5, 0.55, 0.6, 11);
    }
    writer.addLine(`Final Deterministic Score: ${waterfall.finalScore} / 100 (${level})`, 'F2', 9, r, g, b, 14);
  }

  // 5. 6-Stage Scam Attack Chain Progression
  if (evidenceIntelligence && evidenceIntelligence.timeline && evidenceIntelligence.timeline.length > 0) {
    writer.addSectionHeading('6-Stage Scam Attack Chain Progression');
    for (const step of evidenceIntelligence.timeline) {
      const isObserved = step.observedOrInferred === 'OBSERVED';
      const statusText = isObserved ? '[OBSERVED EVIDENCE]' : '[POTENTIAL CONSEQUENCE - NOT OBSERVED EVENT]';
      writer.checkSpace(24);
      writer.addLine(`${step.stageLabel || step.stage}: ${step.title}`, 'F2', 8.5, 0.1, 0.15, 0.2, 11.5);
      writer.addLine(`Status: ${statusText}`, 'F2', 7.5, isObserved ? 0.02 : 0.85, isObserved ? 0.59 : 0.47, isObserved ? 0.41 : 0.02, 10.5, 6);
      writer.addParagraph(step.description, 'F1', 7.5, 0.3, 0.35, 0.4, 10, 6);
      if (step.evidenceQuote) {
        writer.addQuote(step.evidenceQuote);
      }
    }
  }

  // 6. Pretext Contradiction Matrix
  if (contradictions && contradictions.totalFindings > 0) {
    writer.addSectionHeading(`Pretext Contradiction Matrix (${contradictions.totalFindings} Discrepancies)`);
    writer.addParagraph(contradictions.summary, 'F1', 8, 0.3, 0.35, 0.4, 11);
    for (const f of contradictions.findings) {
      writer.checkSpace(28);
      let cr = 0.22, cg = 0.74, cb = 0.97;
      if (f.classification === 'CONTRADICTION') { cr = 0.86; cg = 0.15; cb = 0.15; }
      else if (f.classification === 'ANOMALY') { cr = 0.85; cg = 0.47; cb = 0.02; }
      writer.addLine(`[${f.classification}] ${f.explanation}`, 'F2', 8.5, cr, cg, cb, 11.5);
      writer.addLine(`Claimed Pretext: ${f.claimedPretext}`, 'F1', 7.5, 0.25, 0.3, 0.35, 10, 6);
      writer.addLine(`Conflicting Evidence: ${f.conflictingEvidence}`, 'F1', 7.5, 0.25, 0.3, 0.35, 10, 6);
      writer.addParagraph(`Why It Matters: ${f.whyItMatters}`, 'F1', 7.5, 0.4, 0.45, 0.5, 10, 6);
    }
  }

  // 7. Psychological Tactic Fingerprinting
  if (tactics && tactics.tacticCount > 0) {
    writer.addSectionHeading(`Psychological Tactic Fingerprinting (${tactics.tacticCount} Patterns)`);
    writer.addParagraph(tactics.summary, 'F1', 8, 0.3, 0.35, 0.4, 11);
    for (const t of tactics.allTactics) {
      writer.checkSpace(28);
      writer.addLine(`• ${t.name} [${t.severity} SEVERITY]`, 'F2', 8.5, 0.45, 0.35, 0.75, 11.5);
      writer.addLine(`Targeted Vulnerability: ${t.targetedVulnerability}`, 'F1', 7.5, 0.25, 0.3, 0.35, 10, 6);
      writer.addLine(`Operational Pattern: ${t.patternDescription}`, 'F1', 7.5, 0.25, 0.3, 0.35, 10, 6);
      writer.addParagraph(`Why This Works: ${t.explanation}`, 'F1', 7.5, 0.4, 0.45, 0.5, 10, 6);
      writer.addLine(`Defensive Spotting Tip: ${t.spottingTip}`, 'F2', 7.5, 0.05, 0.45, 0.75, 11, 6);
    }
  }

  // 8. Verified Physical Evidence Findings
  writer.addSectionHeading(`Verified Physical Evidence (${observedIndicators.length} Findings)`);
  if (observedIndicators.length === 0) {
    writer.addParagraph('No suspicious indicators detected during the investigation scan.', 'F1', 8, 0.4, 0.45, 0.5, 11);
  } else {
    for (const ind of observedIndicators) {
      writer.checkSpace(28);
      writer.addLine(`• ${ind.name} [${ind.severity}] (Offset: [${ind.characterRange[0]} - ${ind.characterRange[1]}])`, 'F2', 8.5, 0.1, 0.15, 0.2, 11.5);
      writer.addQuote(ind.evidence);
      writer.addParagraph(`Finding Details: ${ind.explanation}`, 'F1', 7.5, 0.25, 0.3, 0.35, 10, 6);
      writer.addParagraph(`Why This Matters: ${ind.whyItMatters}`, 'F1', 7.5, 0.4, 0.45, 0.5, 10, 6);
    }
  }

  // 9. Missing Evidence & Evidentiary Completeness Advisor
  if (missingEvidence) {
    writer.addSectionHeading('Missing Evidence & Evidentiary Completeness Advisor');
    writer.addLine(`Completeness Level: ${missingEvidence.completenessRating}  •  Score: ${missingEvidence.completenessScore}/100`, 'F2', 8.5, 0.22, 0.74, 0.97, 11.5);
    writer.addParagraph(`Evidentiary Limitation Notice: ${missingEvidence.advisoryNote}`, 'F1', 7.5, 0.45, 0.5, 0.55, 10);
    for (const item of missingEvidence.missingEvidenceItems) {
      writer.checkSpace(26);
      writer.addLine(`• ${item.title} [${item.category}]`, 'F2', 8, 0.2, 0.25, 0.3, 11);
      writer.addParagraph(`What Scamvera Cannot Establish: ${item.whatIsMissing}`, 'F1', 7.5, 0.7, 0.2, 0.2, 10, 6);
      writer.addParagraph(`Why Unavailable: ${item.whyUnavailable}`, 'F1', 7.5, 0.4, 0.45, 0.5, 10, 6);
      writer.addParagraph(`Safe Verification Method: ${item.safeVerificationGuidance}`, 'F1', 7.5, 0.05, 0.5, 0.3, 10, 6);
      writer.addParagraph(`Analytical Significance: ${item.analyticalSignificance}`, 'F1', 7.5, 0.05, 0.45, 0.75, 10, 6);
    }
  }

  // 10. Original Submission
  writer.addSectionHeading('Original Submission / Evidence Source');
  if (isScreenshot) {
    writer.addLine(`Screenshot: ${screenshotMeta?.filename || 'screenshot'} (OCR Confidence: ${screenshotMeta?.ocrConfidence || 0}%, Characters: ${screenshotMeta?.extractedCharacterCount || rawText.length})`, 'F2', 8, 0.22, 0.74, 0.97, 11);
    writer.addParagraph(rawText, 'F4', 7.5, 0.2, 0.25, 0.3, 9.5, 6);
  } else if (isUrlMode) {
    writer.addLine(`Target URL: ${urlAnalysis?.[0]?.url || rawText}`, 'F2', 8, 0.22, 0.74, 0.97, 11);
  } else {
    writer.addLine(`Channel: ${inputMeta.messageType.toUpperCase()}  •  Length: ${inputMeta.characterCount} chars (${inputMeta.wordCount} words)`, 'F1', 7.5, 0.4, 0.45, 0.5, 10);
    writer.addParagraph(rawText, 'F4', 7.5, 0.2, 0.25, 0.3, 9.5, 6);
  }

  // 11. Passive URL Structural Analysis
  if (urlAnalysis && urlAnalysis.length > 0) {
    writer.addSectionHeading('Passive URL Structural Analysis');
    for (const u of urlAnalysis) {
      writer.checkSpace(24);
      writer.addLine(`URL: ${u.url}`, 'F2', 8, 0.05, 0.45, 0.75, 11);
      writer.addLine(`Domain: ${u.domain}  •  TLD: .${u.tld}  •  Structural Risk Score: ${u.riskScore}/100`, 'F1', 7.5, 0.3, 0.35, 0.4, 10, 6);
      writer.addLine(`Bare IP: ${u.isBareIp ? 'Yes' : 'No'}  •  Shortener: ${u.isShortener ? 'Yes' : 'No'}  •  Punycode: ${u.isPunycode ? 'Yes' : 'No'}  •  Homoglyph: ${u.hasHomoglyph ? 'Detected' : 'None'}`, 'F1', 7.5, 0.4, 0.45, 0.5, 10, 6);
      if (u.threatDetails) {
        writer.addLine(`Passive Threat Flag: ${u.threatDetails}`, 'F2', 7.5, 0.8, 0.2, 0.2, 10.5, 6);
      }
    }
  }

  // 12. Contextual AI Analysis
  writer.addSectionHeading('Contextual AI Analysis (Advisory Only)');
  writer.addParagraph('Notice: Contextual synthesis provides behavioral context and does not constitute physical evidence.', 'F3', 7.5, 0.45, 0.5, 0.55, 9.5);
  writer.addParagraph(aiContext.socialEngineeringTactics, 'F1', 8, 0.2, 0.25, 0.3, 10.5);
  if (aiContext.scamArchetypes && aiContext.scamArchetypes.length > 0) {
    writer.addLine(`Associated Scam Archetypes: ${aiContext.scamArchetypes.join(', ')}`, 'F1', 7.5, 0.3, 0.35, 0.4, 10);
  }
  if (aiContext.psychologicalTriggers && aiContext.psychologicalTriggers.length > 0) {
    writer.addLine(`Identified Persuasion Triggers: ${aiContext.psychologicalTriggers.join(', ')}`, 'F1', 7.5, 0.3, 0.35, 0.4, 10);
  }

  // 13. Prioritized Defensive Protocols
  writer.addSectionHeading('Prioritized Defensive Protocols');
  for (const act of defensiveRecommendations) {
    const isDoNot =
      act.action.toLowerCase().includes('not') ||
      act.action.toLowerCase().includes('halt') ||
      act.action.toLowerCase().includes('refuse') ||
      act.action.toLowerCase().includes('never');
    writer.checkSpace(20);
    writer.addLine(`[${isDoNot ? 'DO NOT' : 'DO'}] ${act.action}`, 'F2', 8, isDoNot ? 0.75 : 0.05, isDoNot ? 0.15 : 0.5, isDoNot ? 0.15 : 0.3, 11);
    writer.addParagraph(act.detail, 'F1', 7.5, 0.3, 0.35, 0.4, 10, 6);
  }

  // 14. Methodology & Legal Disclaimer
  writer.addSectionHeading('Assessment Methodology & Legal Disclaimer');
  writer.addParagraph(`Deterministic Basis: This investigation score (${score}/100) reflects verified accumulation of physical, structural, and behavioral indicators. Scoring is deterministic and does not rely on generative AI probabilities.`, 'F1', 7.5, 0.4, 0.45, 0.5, 9.5);
  writer.addParagraph('Zero-Retention Guarantee: No investigation data is stored on server infrastructure. Report compiled client-side in volatile memory.', 'F1', 7.5, 0.4, 0.45, 0.5, 9.5);
  writer.addParagraph(disclaimer, 'F1', 7.5, 0.4, 0.45, 0.5, 9.5);

  const pages = writer.finalize(id);
  return assemblePdfDocument(pages);
}

/**
 * Direct client-side PDF download trigger.
 */
export function downloadInvestigationPdf(report: InvestigationReport): void {
  const pdfBytes = generateInvestigationPdfBytes(report);
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `${report.id}_Investigation_Report.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}

/* ========================================================================== */
/* Inlined PDF Script for Standalone Offline HTML Report                     */
/* ========================================================================== */

function getInlinedPdfScript(): string {
  return `
function escapePdfText(str) {
  if (!str) return '';
  return str
    .replace(/\\u2018|\\u2019/g, "'")
    .replace(/\\u201C|\\u201D/g, '"')
    .replace(/\\u2014|\\u2013/g, '-')
    .replace(/\\u2022/g, '*')
    .replace(/\\u2026/g, '...')
    .replace(/\\\\/g, '\\\\\\\\')
    .replace(/\\(/g, '\\\\(')
    .replace(/\\)/g, '\\\\)')
    .replace(/[^\\x20-\\x7E]/g, ' ');
}

function wrapText(text, maxChars) {
  if (!text) return [];
  var words = text.replace(/[\\r\\n]+/g, ' ').trim().split(/\\s+/);
  var lines = [];
  var currentLine = '';
  for (var i = 0; i < words.length; i++) {
    var word = words[i];
    if (!currentLine) {
      if (word.length > maxChars) {
        var rem = word;
        while (rem.length > maxChars) {
          lines.push(rem.slice(0, maxChars));
          rem = rem.slice(maxChars);
        }
        currentLine = rem;
      } else {
        currentLine = word;
      }
    } else if ((currentLine + ' ' + word).length <= maxChars) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      if (word.length > maxChars) {
        var rem = word;
        while (rem.length > maxChars) {
          lines.push(rem.slice(0, maxChars));
          rem = rem.slice(maxChars);
        }
        currentLine = rem;
      } else {
        currentLine = word;
      }
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function SimplePdfWriter() {
  this.pages = [];
  this.currentOps = [];
  this.left = 40;
  this.right = 555;
  this.width = 515;
  this.topMargin = 790;
  this.bottomMargin = 55;
  this.y = this.topMargin;
  this.startNewPage();
}

SimplePdfWriter.prototype.getY = function() { return this.y; };
SimplePdfWriter.prototype.startNewPage = function() {
  if (this.currentOps.length > 0) {
    this.pages.push(this.currentOps.join('\\n'));
    this.currentOps = [];
  }
  this.y = this.topMargin;
};
SimplePdfWriter.prototype.checkSpace = function(needed) {
  if (this.y - needed < this.bottomMargin) {
    this.startNewPage();
  }
};
SimplePdfWriter.prototype.fillRect = function(x, y, w, h, r, g, b) {
  this.currentOps.push(r.toFixed(3) + ' ' + g.toFixed(3) + ' ' + b.toFixed(3) + ' rg');
  this.currentOps.push(x.toFixed(2) + ' ' + y.toFixed(2) + ' ' + w.toFixed(2) + ' ' + h.toFixed(2) + ' re');
  this.currentOps.push('f');
};
SimplePdfWriter.prototype.strokeRect = function(x, y, w, h, r, g, b, lineWidth) {
  lineWidth = lineWidth || 0.5;
  this.currentOps.push(r.toFixed(3) + ' ' + g.toFixed(3) + ' ' + b.toFixed(3) + ' RG');
  this.currentOps.push(lineWidth.toFixed(2) + ' w');
  this.currentOps.push(x.toFixed(2) + ' ' + y.toFixed(2) + ' ' + w.toFixed(2) + ' ' + h.toFixed(2) + ' re');
  this.currentOps.push('S');
};
SimplePdfWriter.prototype.drawLine = function(x1, y1, x2, y2, r, g, b, lineWidth) {
  lineWidth = lineWidth || 0.5;
  this.currentOps.push(r.toFixed(3) + ' ' + g.toFixed(3) + ' ' + b.toFixed(3) + ' RG');
  this.currentOps.push(lineWidth.toFixed(2) + ' w');
  this.currentOps.push(x1.toFixed(2) + ' ' + y1.toFixed(2) + ' m');
  this.currentOps.push(x2.toFixed(2) + ' ' + y2.toFixed(2) + ' l');
  this.currentOps.push('S');
};
SimplePdfWriter.prototype.drawText = function(text, font, size, r, g, b, x, y) {
  x = x !== undefined ? x : this.left;
  y = y !== undefined ? y : this.y;
  var escaped = escapePdfText(text);
  this.currentOps.push('BT');
  this.currentOps.push('/' + font + ' ' + size + ' Tf');
  this.currentOps.push(r.toFixed(3) + ' ' + g.toFixed(3) + ' ' + b.toFixed(3) + ' rg');
  this.currentOps.push(x.toFixed(2) + ' ' + y.toFixed(2) + ' Td');
  this.currentOps.push('(' + escaped + ') Tj');
  this.currentOps.push('ET');
};
SimplePdfWriter.prototype.addLine = function(text, font, size, r, g, b, lineHeight, indent) {
  lineHeight = lineHeight || (size + 3);
  indent = indent || 0;
  this.checkSpace(lineHeight);
  this.drawText(text, font, size, r, g, b, this.left + indent, this.y);
  this.y -= lineHeight;
};
SimplePdfWriter.prototype.addParagraph = function(text, font, size, r, g, b, lineHeight, indent, customWidth) {
  lineHeight = lineHeight || (size + 3);
  indent = indent || 0;
  var w = customWidth || (this.width - indent);
  var maxChars = Math.floor(w / (size * (font === 'F2' ? 0.58 : 0.52)));
  var lines = wrapText(text, maxChars);
  for (var i = 0; i < lines.length; i++) {
    this.addLine(lines[i], font, size, r, g, b, lineHeight, indent);
  }
};
SimplePdfWriter.prototype.addQuote = function(text) {
  this.checkSpace(24);
  this.drawLine(this.left + 4, this.y + 6, this.left + 4, this.y - 12, 0.22, 0.74, 0.97, 2);
  this.addParagraph('"' + text + '"', 'F3', 7.5, 0.75, 0.82, 0.90, 10.5, 12);
};
SimplePdfWriter.prototype.addSectionHeading = function(title) {
  this.checkSpace(28);
  this.y -= 6;
  this.drawLine(this.left, this.y + 11, this.right, this.y + 11, 0.22, 0.74, 0.97, 0.75);
  this.addLine(title.toUpperCase(), 'F2', 9.5, 0.22, 0.74, 0.97, 13);
  this.y -= 2;
};
SimplePdfWriter.prototype.finalize = function(reportId) {
  if (this.currentOps.length > 0) {
    this.pages.push(this.currentOps.join('\\n'));
    this.currentOps = [];
  }
  var totalPages = this.pages.length;
  var finalized = [];
  for (var i = 0; i < totalPages; i++) {
    var footerOps = [
      '0.3 0.4 0.5 RG',
      '0.5 w',
      this.left.toFixed(2) + ' 42.00 m',
      this.right.toFixed(2) + ' 42.00 l',
      'S',
      'BT',
      '/F1 7.5 Tf',
      '0.58 0.64 0.72 rg',
      this.left.toFixed(2) + ' 30.00 Td',
      '(' + escapePdfText('Scamvera Digital Scam Investigator • Confidential Investigation Report • ID: ' + reportId) + ') Tj',
      'ET',
      'BT',
      '/F1 7.5 Tf',
      '0.58 0.64 0.72 rg',
      (this.right - 65).toFixed(2) + ' 30.00 Td',
      '(' + escapePdfText('Page ' + (i + 1) + ' of ' + totalPages) + ') Tj',
      'ET'
    ];
    finalized.push(this.pages[i] + '\\n' + footerOps.join('\\n'));
  }
  return finalized;
};

function assemblePdfDocument(pagesContentStreams) {
  var pageCount = pagesContentStreams.length;
  var pageObjIds = [];
  for (var i = 0; i < pageCount; i++) {
    pageObjIds.push(4 + i);
  }

  var objects = [];
  objects.push('1 0 obj\\n<< /Type /Catalog /Pages 2 0 R >>\\nendobj');
  objects.push('2 0 obj\\n<< /Type /Pages /Kids [' + pageObjIds.map(function(id) { return id + ' 0 R'; }).join(' ') + '] /Count ' + pageCount + ' >>\\nendobj');
  objects.push('3 0 obj\\n<< /Font <<\\n' +
    '  /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\\n' +
    '  /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\\n' +
    '  /F3 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>\\n' +
    '  /F4 << /Type /Font /Subtype /Type1 /BaseFont /Courier >>\\n' +
    '>> >>\\nendobj');

  for (var i = 0; i < pageCount; i++) {
    var streamObjId = 4 + pageCount + i;
    objects.push((4 + i) + ' 0 obj\\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources 3 0 R /Contents ' + streamObjId + ' 0 R >>\\nendobj');
  }

  var encoder = new TextEncoder();
  for (var i = 0; i < pageCount; i++) {
    var streamContent = pagesContentStreams[i];
    var streamObjId = 4 + pageCount + i;
    var streamLength = encoder.encode(streamContent).length;
    objects.push(streamObjId + ' 0 obj\\n<< /Length ' + streamLength + ' >>\\nstream\\n' + streamContent + '\\nendstream\\nendobj');
  }

  var header = '%PDF-1.4\\n%\\xE2\\xE3\\xCF\\xD3\\n';
  var body = '';
  var offsets = [];

  var currentOffset = encoder.encode(header).length;
  for (var i = 0; i < objects.length; i++) {
    offsets.push(currentOffset);
    var objStr = objects[i] + '\\n';
    body += objStr;
    currentOffset += encoder.encode(objStr).length;
  }

  var startXref = currentOffset;
  var xref = 'xref\\n0 ' + (objects.length + 1) + '\\n0000000000 65535 f \\r\\n';
  for (var i = 0; i < offsets.length; i++) {
    var offsetStr = String(offsets[i]).padStart(10, '0');
    xref += offsetStr + ' 00000 n \\r\\n';
  }

  var trailer = 'trailer\\n<< /Size ' + (objects.length + 1) + ' /Root 1 0 R >>\\nstartxref\\n' + startXref + '\\n%%EOF\\n';
  return encoder.encode(header + body + xref + trailer);
}

function generateInvestigationPdfBytes(report) {
  var writer = new SimplePdfWriter();
  var id = report.id;
  var timestamp = report.timestamp;
  var inputMeta = report.inputMeta;
  var rawText = report.rawText;
  var observedIndicators = report.observedIndicators || [];
  var aiContext = report.aiContext || {};
  var riskAssessment = report.riskAssessment || {};
  var defensiveRecommendations = report.defensiveRecommendations || [];
  var disclaimer = report.disclaimer || '';
  var urlAnalysis = report.urlAnalysis || [];
  var screenshotMeta = report.screenshotMeta;
  var evidenceIntelligence = report.evidenceIntelligence;
  var tactics = report.tactics;
  var contradictions = report.contradictions;
  var missingEvidence = report.missingEvidence;

  var score = riskAssessment.score || 0;
  var level = riskAssessment.level || 'BENIGN';
  var evidenceStrength = riskAssessment.evidenceStrength || 'MINIMAL';
  var primaryCategories = riskAssessment.primaryCategories || [];
  var waterfall = riskAssessment.waterfall;
  var formattedDate = new Date(timestamp).toUTCString();

  var isScreenshot = !!screenshotMeta;
  var isUrlMode = !!(urlAnalysis && urlAnalysis.length > 0);
  var modeLabel = isScreenshot ? 'SCREENSHOT / OCR INVESTIGATION' : isUrlMode ? 'DIRECT URL INVESTIGATION' : 'TEXT MESSAGE INVESTIGATION';

  // 1. Header Banner
  writer.fillRect(40, writer.getY() - 28, 515, 34, 0.04, 0.07, 0.13);
  writer.addLine('DIGITAL SCAM INVESTIGATOR - OFFICIAL AUDIT REPORT', 'F2', 12, 1, 1, 1, 15, 10);
  writer.addLine('REPORT ID: ' + id + '  •  DATE: ' + formattedDate + '  •  MODE: ' + modeLabel, 'F1', 7.5, 0.7, 0.8, 0.9, 14, 10);

  // 2. Risk Rating Banner
  writer.checkSpace(50);
  var r = 0.01, g = 0.52, b = 0.78;
  if (level === 'CRITICAL') { r = 0.86; g = 0.15; b = 0.15; }
  else if (level === 'HIGH') { r = 0.92; g = 0.35; b = 0.05; }
  else if (level === 'MEDIUM') { r = 0.85; g = 0.47; b = 0.02; }
  else if (level === 'LOW') { r = 0.02; g = 0.59; b = 0.41; }

  writer.fillRect(40, writer.getY() - 36, 515, 42, 0.07, 0.10, 0.18);
  writer.strokeRect(40, writer.getY() - 36, 515, 42, r, g, b, 1);
  writer.addLine('OVERALL RISK RATING: ' + score + ' / 100  [ ' + level + ' RISK ]', 'F2', 12.5, r, g, b, 16, 12);
  writer.addLine('Evidence Strength: ' + evidenceStrength + '  •  Primary Categories: ' + (primaryCategories.join(', ') || 'None'), 'F1', 8, 0.8, 0.85, 0.9, 18, 12);

  // 3. Simple Executive Conclusion
  var simpleConclusion = '';
  if (level === 'BENIGN' || level === 'LOW') {
    simpleConclusion = 'The ' + (isScreenshot ? 'image' : isUrlMode ? 'URL' : 'message') + ' does not contain recognized scam patterns currently checked by the system. However, this does not verify sender identity or guarantee authenticity.';
  } else if (level === 'CRITICAL' || level === 'HIGH') {
    simpleConclusion = 'The ' + (isScreenshot ? 'image' : isUrlMode ? 'URL' : 'message') + ' contains high-risk indicators associated with ' + (primaryCategories.join(' and ') || 'suspicious communications') + '. Immediate caution is advised before clicking links, sharing information, or sending payments.';
  } else {
    simpleConclusion = 'The ' + (isScreenshot ? 'image' : isUrlMode ? 'URL' : 'message') + ' contains cautionary warning signs commonly associated with ' + (primaryCategories.join(' and ') || 'suspicious communications') + '. Verify the sender through trusted independent channels before responding.';
  }
  writer.checkSpace(28);
  writer.addLine('INVESTIGATION CONCLUSION:', 'F2', 9, 0.22, 0.74, 0.97, 12);
  writer.addParagraph(simpleConclusion, 'F1', 8, 0.2, 0.25, 0.3, 11, 8);

  // 4. Waterfall
  if (waterfall) {
    writer.addSectionHeading('Explainable Risk Waterfall Breakdown');
    writer.addLine('Base Contributing Factors: +' + waterfall.baseScore + ' pts', 'F2', 8.5, 0.22, 0.74, 0.97, 12);
    var baseItems = (waterfall.contributions || []).filter(function(c) { return c.type === 'BASE_SEVERITY'; });
    for (var i = 0; i < baseItems.length; i++) {
      var c = baseItems[i];
      writer.addLine('• ' + c.label + ': +' + c.points + ' pts', 'F2', 8, 0.3, 0.35, 0.4, 10.5, 8);
      writer.addParagraph(c.explanation, 'F1', 7.5, 0.4, 0.45, 0.5, 10, 16);
    }
    if (waterfall.synergyScore > 0) {
      writer.addLine('Compound Risk Synergies: +' + waterfall.synergyScore + ' pts', 'F2', 8.5, 0.85, 0.47, 0.02, 12);
      var synItems = (waterfall.contributions || []).filter(function(c) { return c.type === 'COMPOUND_SYNERGY'; });
      for (var i = 0; i < synItems.length; i++) {
        var s = synItems[i];
        writer.addLine('• ' + s.label + ': +' + s.points + ' pts', 'F2', 8, 0.3, 0.35, 0.4, 10.5, 8);
        writer.addParagraph(s.explanation, 'F1', 7.5, 0.4, 0.45, 0.5, 10, 16);
      }
    }
    writer.addLine('Total Raw Points: ' + waterfall.rawTotalScore + ' pts', 'F2', 8.5, 0.2, 0.25, 0.3, 11);
    if (waterfall.capAdjustment !== 0) {
      writer.addLine('Upper Ceiling Clamping Adjustment: ' + waterfall.capAdjustment + ' pts', 'F1', 8, 0.5, 0.55, 0.6, 11);
    }
    writer.addLine('Final Deterministic Score: ' + waterfall.finalScore + ' / 100 (' + level + ')', 'F2', 9, r, g, b, 14);
  }

  // 5. 6-Stage Attack Chain
  if (evidenceIntelligence && evidenceIntelligence.timeline && evidenceIntelligence.timeline.length > 0) {
    writer.addSectionHeading('6-Stage Scam Attack Chain Progression');
    for (var i = 0; i < evidenceIntelligence.timeline.length; i++) {
      var step = evidenceIntelligence.timeline[i];
      var isObs = step.observedOrInferred === 'OBSERVED';
      var statusText = isObs ? '[OBSERVED EVIDENCE]' : '[POTENTIAL CONSEQUENCE - NOT OBSERVED EVENT]';
      writer.checkSpace(24);
      writer.addLine((step.stageLabel || step.stage) + ': ' + step.title, 'F2', 8.5, 0.1, 0.15, 0.2, 11.5);
      writer.addLine('Status: ' + statusText, 'F2', 7.5, isObs ? 0.02 : 0.85, isObs ? 0.59 : 0.47, isObs ? 0.41 : 0.02, 10.5, 6);
      writer.addParagraph(step.description, 'F1', 7.5, 0.3, 0.35, 0.4, 10, 6);
      if (step.evidenceQuote) {
        writer.addQuote(step.evidenceQuote);
      }
    }
  }

  // 6. Contradictions
  if (contradictions && contradictions.totalFindings > 0) {
    writer.addSectionHeading('Pretext Contradiction Matrix (' + contradictions.totalFindings + ' Discrepancies)');
    writer.addParagraph(contradictions.summary, 'F1', 8, 0.3, 0.35, 0.4, 11);
    for (var i = 0; i < (contradictions.findings || []).length; i++) {
      var f = contradictions.findings[i];
      var cr = 0.22, cg = 0.74, cb = 0.97;
      if (f.classification === 'CONTRADICTION') { cr = 0.86; cg = 0.15; cb = 0.15; }
      else if (f.classification === 'ANOMALY') { cr = 0.85; cg = 0.47; cb = 0.02; }
      writer.checkSpace(28);
      writer.addLine('[' + f.classification + '] ' + f.explanation, 'F2', 8.5, cr, cg, cb, 11.5);
      writer.addLine('Claimed Pretext: ' + f.claimedPretext, 'F1', 7.5, 0.25, 0.3, 0.35, 10, 6);
      writer.addLine('Conflicting Evidence: ' + f.conflictingEvidence, 'F1', 7.5, 0.25, 0.3, 0.35, 10, 6);
      writer.addParagraph('Why It Matters: ' + f.whyItMatters, 'F1', 7.5, 0.4, 0.45, 0.5, 10, 6);
    }
  }

  // 7. Tactics
  if (tactics && tactics.tacticCount > 0) {
    writer.addSectionHeading('Psychological Tactic Fingerprinting (' + tactics.tacticCount + ' Patterns)');
    writer.addParagraph(tactics.summary, 'F1', 8, 0.3, 0.35, 0.4, 11);
    for (var i = 0; i < (tactics.allTactics || []).length; i++) {
      var t = tactics.allTactics[i];
      writer.checkSpace(28);
      writer.addLine('• ' + t.name + ' [' + t.severity + ' SEVERITY]', 'F2', 8.5, 0.45, 0.35, 0.75, 11.5);
      writer.addLine('Targeted Vulnerability: ' + t.targetedVulnerability, 'F1', 7.5, 0.25, 0.3, 0.35, 10, 6);
      writer.addLine('Operational Pattern: ' + t.patternDescription, 'F1', 7.5, 0.25, 0.3, 0.35, 10, 6);
      writer.addParagraph('Why This Works: ' + t.explanation, 'F1', 7.5, 0.4, 0.45, 0.5, 10, 6);
      writer.addLine('Defensive Spotting Tip: ' + t.spottingTip, 'F2', 7.5, 0.05, 0.45, 0.75, 11, 6);
    }
  }

  // 8. Physical Evidence
  writer.addSectionHeading('Verified Physical Evidence (' + observedIndicators.length + ' Findings)');
  if (observedIndicators.length === 0) {
    writer.addParagraph('No suspicious indicators detected during the investigation scan.', 'F1', 8, 0.4, 0.45, 0.5, 11);
  } else {
    for (var i = 0; i < observedIndicators.length; i++) {
      var ind = observedIndicators[i];
      writer.checkSpace(28);
      writer.addLine('• ' + ind.name + ' [' + ind.severity + '] (Offset: [' + ind.characterRange[0] + ' - ' + ind.characterRange[1] + '])', 'F2', 8.5, 0.1, 0.15, 0.2, 11.5);
      writer.addQuote(ind.evidence);
      writer.addParagraph('Finding Details: ' + ind.explanation, 'F1', 7.5, 0.25, 0.3, 0.35, 10, 6);
      writer.addParagraph('Why This Matters: ' + ind.whyItMatters, 'F1', 7.5, 0.4, 0.45, 0.5, 10, 6);
    }
  }

  // 9. Missing Evidence
  if (missingEvidence) {
    writer.addSectionHeading('Missing Evidence & Evidentiary Completeness Advisor');
    writer.addLine('Completeness Level: ' + missingEvidence.completenessRating + '  •  Score: ' + missingEvidence.completenessScore + '/100', 'F2', 8.5, 0.22, 0.74, 0.97, 11.5);
    writer.addParagraph('Evidentiary Limitation Notice: ' + missingEvidence.advisoryNote, 'F1', 7.5, 0.45, 0.5, 0.55, 10);
    for (var i = 0; i < (missingEvidence.missingEvidenceItems || []).length; i++) {
      var item = missingEvidence.missingEvidenceItems[i];
      writer.checkSpace(26);
      writer.addLine('• ' + item.title + ' [' + item.category + ']', 'F2', 8, 0.2, 0.25, 0.3, 11);
      writer.addParagraph('What Scamvera Cannot Establish: ' + item.whatIsMissing, 'F1', 7.5, 0.7, 0.2, 0.2, 10, 6);
      writer.addParagraph('Why Unavailable: ' + item.whyUnavailable, 'F1', 7.5, 0.4, 0.45, 0.5, 10, 6);
      writer.addParagraph('Safe Verification Method: ' + item.safeVerificationGuidance, 'F1', 7.5, 0.05, 0.5, 0.3, 10, 6);
      writer.addParagraph('Analytical Significance: ' + item.analyticalSignificance, 'F1', 7.5, 0.05, 0.45, 0.75, 10, 6);
    }
  }

  // 10. Original Submission
  writer.addSectionHeading('Original Submission / Evidence Source');
  if (isScreenshot) {
    writer.addLine('Screenshot: ' + (screenshotMeta.filename || 'screenshot') + ' (OCR Confidence: ' + (screenshotMeta.ocrConfidence || 0) + '%, Characters: ' + (screenshotMeta.extractedCharacterCount || rawText.length) + ')', 'F2', 8, 0.22, 0.74, 0.97, 11);
    writer.addParagraph(rawText, 'F4', 7.5, 0.2, 0.25, 0.3, 9.5, 6);
  } else if (isUrlMode) {
    writer.addLine('Target URL: ' + ((urlAnalysis[0] && urlAnalysis[0].url) || rawText), 'F2', 8, 0.22, 0.74, 0.97, 11);
  } else {
    writer.addLine('Channel: ' + inputMeta.messageType.toUpperCase() + '  •  Length: ' + inputMeta.characterCount + ' chars (' + inputMeta.wordCount + ' words)', 'F1', 7.5, 0.4, 0.45, 0.5, 10);
    writer.addParagraph(rawText, 'F4', 7.5, 0.2, 0.25, 0.3, 9.5, 6);
  }

  // 11. URL Structural Analysis
  if (urlAnalysis && urlAnalysis.length > 0) {
    writer.addSectionHeading('Passive URL Structural Analysis');
    for (var i = 0; i < urlAnalysis.length; i++) {
      var u = urlAnalysis[i];
      writer.checkSpace(24);
      writer.addLine('URL: ' + u.url, 'F2', 8, 0.05, 0.45, 0.75, 11);
      writer.addLine('Domain: ' + u.domain + '  •  TLD: .' + u.tld + '  •  Structural Risk Score: ' + u.riskScore + '/100', 'F1', 7.5, 0.3, 0.35, 0.4, 10, 6);
      writer.addLine('Bare IP: ' + (u.isBareIp ? 'Yes' : 'No') + '  •  Shortener: ' + (u.isShortener ? 'Yes' : 'No') + '  •  Punycode: ' + (u.isPunycode ? 'Yes' : 'No') + '  •  Homoglyph: ' + (u.hasHomoglyph ? 'Detected' : 'None'), 'F1', 7.5, 0.4, 0.45, 0.5, 10, 6);
      if (u.threatDetails) {
        writer.addLine('Passive Threat Flag: ' + u.threatDetails, 'F2', 7.5, 0.8, 0.2, 0.2, 10.5, 6);
      }
    }
  }

  // 12. Contextual AI Analysis
  writer.addSectionHeading('Contextual AI Analysis (Advisory Only)');
  writer.addParagraph('Notice: Contextual synthesis provides behavioral context and does not constitute physical evidence.', 'F3', 7.5, 0.45, 0.5, 0.55, 9.5);
  writer.addParagraph(aiContext.socialEngineeringTactics || '', 'F1', 8, 0.2, 0.25, 0.3, 10.5);
  if (aiContext.scamArchetypes && aiContext.scamArchetypes.length > 0) {
    writer.addLine('Associated Scam Archetypes: ' + aiContext.scamArchetypes.join(', '), 'F1', 7.5, 0.3, 0.35, 0.4, 10);
  }
  if (aiContext.psychologicalTriggers && aiContext.psychologicalTriggers.length > 0) {
    writer.addLine('Identified Persuasion Triggers: ' + aiContext.psychologicalTriggers.join(', '), 'F1', 7.5, 0.3, 0.35, 0.4, 10);
  }

  // 13. Defensive Protocols
  writer.addSectionHeading('Prioritized Defensive Protocols');
  for (var i = 0; i < defensiveRecommendations.length; i++) {
    var act = defensiveRecommendations[i];
    var isDoNot = act.action.toLowerCase().includes('not') || act.action.toLowerCase().includes('halt') || act.action.toLowerCase().includes('refuse') || act.action.toLowerCase().includes('never');
    writer.checkSpace(20);
    writer.addLine('[' + (isDoNot ? 'DO NOT' : 'DO') + '] ' + act.action, 'F2', 8, isDoNot ? 0.75 : 0.05, isDoNot ? 0.15 : 0.5, isDoNot ? 0.15 : 0.3, 11);
    writer.addParagraph(act.detail, 'F1', 7.5, 0.3, 0.35, 0.4, 10, 6);
  }

  // 14. Methodology & Disclaimer
  writer.addSectionHeading('Assessment Methodology & Legal Disclaimer');
  writer.addParagraph('Deterministic Basis: This investigation score (' + score + '/100) reflects verified accumulation of physical, structural, and behavioral indicators. Scoring is deterministic and does not rely on generative AI probabilities.', 'F1', 7.5, 0.4, 0.45, 0.5, 9.5);
  writer.addParagraph('Zero-Retention Guarantee: No investigation data is stored on server infrastructure. Report compiled client-side in volatile memory.', 'F1', 7.5, 0.4, 0.45, 0.5, 9.5);
  writer.addParagraph(disclaimer, 'F1', 7.5, 0.4, 0.45, 0.5, 9.5);

  var pages = writer.finalize(id);
  return assemblePdfDocument(pages);
}

function downloadInvestigationPdf() {
  var dataEl = document.getElementById('scamvera-report-data');
  if (!dataEl) {
    alert('Report data not found.');
    return;
  }
  try {
    var report = JSON.parse(dataEl.textContent);
    var pdfBytes = generateInvestigationPdfBytes(report);
    var blob = new Blob([pdfBytes], { type: 'application/pdf' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = (report.id || 'investigation') + '_Investigation_Report.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error generating PDF:', err);
    alert('Unable to generate PDF: ' + (err && err.message ? err.message : String(err)));
  }
}
`;
}

/* ========================================================================== */
/* Standalone HTML Report Builder                                             */
/* ========================================================================== */

export function buildReportHtml(report: InvestigationReport): string {
  const {
    id,
    timestamp,
    inputMeta,
    rawText,
    observedIndicators,
    aiContext,
    riskAssessment,
    defensiveRecommendations,
    disclaimer,
    urlAnalysis,
    screenshotMeta,
    evidenceIntelligence,
    tactics,
    contradictions,
    missingEvidence,
  } = report;

  const { score, level, evidenceStrength, primaryCategories, scoringRationale, waterfall } = riskAssessment;

  const formattedDate = new Date(timestamp).toUTCString();

  // Mode identification
  const isScreenshot = !!screenshotMeta;
  const isUrlMode = !!(urlAnalysis && urlAnalysis.length > 0);
  const investigationTypeLabel = isScreenshot
    ? 'Screenshot / OCR Investigation'
    : isUrlMode
    ? 'Direct URL Investigation'
    : 'Text Message Investigation';

  // Extract clean target URL if in URL mode
  let targetUrl = '';
  if (isUrlMode && urlAnalysis && urlAnalysis.length > 0) {
    targetUrl = urlAnalysis[0].url;
  } else if (rawText.toLowerCase().startsWith('target link to investigate:')) {
    targetUrl = rawText.replace(/target link to investigate:\s*/i, '').trim();
  }

  // Derive plain-language simple conclusion matching on-screen synthesis
  const getSimpleConclusion = () => {
    if (level === 'BENIGN' || level === 'LOW') {
      return `The ${isScreenshot ? 'image' : isUrlMode ? 'URL' : 'message'} does not contain recognized scam patterns currently checked by the system. However, this does not verify sender identity or guarantee authenticity.`;
    }
    if (level === 'CRITICAL' || level === 'HIGH') {
      return `The ${isScreenshot ? 'image' : isUrlMode ? 'URL' : 'message'} contains high-risk indicators associated with ${primaryCategories.join(' and ') || 'suspicious communications'}. Immediate caution is advised before clicking links, sharing information, or sending payments.`;
    }
    return `The ${isScreenshot ? 'image' : isUrlMode ? 'URL' : 'message'} contains cautionary warning signs commonly associated with ${primaryCategories.join(' and ') || 'suspicious communications'}. Verify the sender through trusted independent channels before responding.`;
  };

  const levelColor =
    level === 'CRITICAL'
      ? '#dc2626'
      : level === 'HIGH'
      ? '#ea580c'
      : level === 'MEDIUM'
      ? '#d97706'
      : level === 'LOW'
      ? '#059669'
      : '#0284c7';

  // Build the complete standalone HTML report
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Digital Scam Investigation Report - ${escapeHtml(id)}</title>
  <style>
    @media print {
      body { background: #fff !important; color: #111 !important; font-size: 11pt; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
      .report-card, .indicator-card, .raw-submission-box { border: 1px solid #ccc !important; box-shadow: none !important; background: #fafafa !important; color: #111 !important; }
      .header-band { background: #eee !important; color: #111 !important; border-bottom: 2px solid #333 !important; }
      .brand-title { color: #0284c7 !important; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #080c14;
      color: #f1f5f9;
      line-height: 1.5;
      padding: 32px 20px;
    }
    .report-wrapper {
      max-width: 880px;
      margin: 0 auto;
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    .header-band {
      background: #090e1a;
      border-bottom: 2px solid ${levelColor};
      padding: 24px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
    .brand-title {
      font-size: 18px;
      font-weight: 800;
      letter-spacing: 1px;
      color: #38bdf8;
    }
    .brand-sub {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #94a3b8;
    }
    .meta-box {
      text-align: right;
      font-size: 12px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      color: #cbd5e1;
    }
    .content-area {
      padding: 32px;
    }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #38bdf8;
      margin-bottom: 12px;
      border-bottom: 1px solid #1e293b;
      padding-bottom: 6px;
    }
    .hero-summary {
      background: #1e293b;
      border-radius: 8px;
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 24px;
      border-left: 6px solid ${levelColor};
    }
    .score-display {
      font-size: 44px;
      font-weight: 800;
      color: #ffffff;
      line-height: 1;
    }
    .score-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.5px;
      background: ${levelColor};
      color: #ffffff;
      margin-left: 10px;
    }
    .conclusion-box {
      background: rgba(56, 189, 248, 0.08);
      border-left: 4px solid #38bdf8;
      border-radius: 6px;
      padding: 14px 16px;
      margin-bottom: 28px;
      font-size: 13px;
      line-height: 1.6;
      color: #f1f5f9;
    }
    .raw-submission-box {
      background: #090e1a;
      border: 1px solid #334155;
      border-radius: 6px;
      padding: 16px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13px;
      white-space: pre-wrap;
      word-break: break-all;
      color: #e2e8f0;
      margin-bottom: 28px;
    }
    .indicator-card {
      background: #090e1a;
      border: 1px solid #1e293b;
      border-radius: 6px;
      padding: 14px 18px;
      margin-bottom: 12px;
    }
    .indicator-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .indicator-name {
      font-weight: 700;
      font-size: 14px;
      color: #f8fafc;
    }
    .indicator-severity {
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 3px;
      background: #334155;
      color: #f1f5f9;
    }
    .quote-box {
      background: rgba(56, 189, 248, 0.08);
      border-left: 3px solid #38bdf8;
      padding: 6px 12px;
      font-size: 13px;
      font-style: italic;
      color: #cbd5e1;
      margin: 8px 0;
    }
    .action-grid {
      display: grid;
      gap: 10px;
      margin-bottom: 28px;
    }
    .action-item {
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 13px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .action-do-not {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
    }
    .action-do {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #a7f3d0;
    }
    .disclaimer-box {
      background: #090e1a;
      border: 1px solid #1e293b;
      padding: 18px;
      border-radius: 6px;
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.6;
      margin-top: 28px;
    }
    .btn-print {
      background: #0284c7;
      color: white;
      border: none;
      padding: 10px 18px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      font-size: 13px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: background 0.15s ease;
    }
    .btn-print:hover { background: #0369a1; }
  </style>
</head>
<body>
  <div class="report-wrapper">
    <!-- Header -->
    <div class="header-band">
      <div>
        <div class="brand-title">DIGITAL SCAM INVESTIGATOR</div>
        <div class="brand-sub">OFFICIAL INVESTIGATION AUDIT REPORT</div>
      </div>
      <div class="meta-box">
        <div><strong>REPORT ID:</strong> ${escapeHtml(id)}</div>
        <div><strong>DATE:</strong> ${escapeHtml(formattedDate)}</div>
        <div><strong>MODE:</strong> ${escapeHtml(investigationTypeLabel.toUpperCase())}</div>
      </div>
      <div class="no-print" style="width: 100%; display: flex; justify-content: flex-end; margin-top: 8px;">
        <button class="btn-print" id="downloadPdfBtn" onclick="downloadInvestigationPdf()">Download as PDF</button>
      </div>
    </div>

    <div class="content-area">
      <!-- 1. Executive Assessment -->
      <div class="hero-summary">
        <div>
          <div style="font-size: 12px; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px;">Overall Risk Rating</div>
          <div style="display: flex; align-items: baseline;">
            <span class="score-display">${score}</span>
            <span style="font-size: 20px; color: #94a3b8; margin-left: 4px;">/ 100</span>
            <span class="score-badge">${level} RISK</span>
          </div>
          <div style="font-size: 12px; color: #cbd5e1; margin-top: 8px;">
            Evidence Strength: <strong>${evidenceStrength}</strong>
          </div>
        </div>
        <div style="max-width: 480px; font-size: 13px; color: #cbd5e1;">
          ${
            level === 'BENIGN'
              ? 'No recognized scam indicators were found in the submitted material. This reflects the absence of checked suspicious patterns and does not guarantee authenticity.'
              : `Verified indicators associated with ${primaryCategories.join(', ') || 'suspicious communications'} were identified during the defensive analysis.`
          }
        </div>
      </div>

      <!-- 2. Simple Executive Conclusion -->
      <div class="conclusion-box">
        <strong style="color: #38bdf8;">Investigation Conclusion:</strong> ${escapeHtml(getSimpleConclusion())}
      </div>

      <!-- 3. Explainable Risk Waterfall Breakdown -->
      ${
        waterfall
          ? `
      <div class="section-title">Explainable Risk Waterfall Breakdown</div>
      <div style="font-size: 12px; color: #94a3b8; margin-bottom: 12px;">
        Transparent mathematical decomposition of the deterministic risk calculation (${score}/100).
      </div>
      <div class="indicator-card" style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #1e293b;">
          <span style="font-size: 13px; font-weight: 700; color: #cbd5e1;">Base Contributing Factors:</span>
          <span style="font-size: 13px; font-weight: 700; color: #38bdf8;">+${waterfall.baseScore} pts</span>
        </div>
        ${waterfall.contributions
          .filter((c) => c.type === 'BASE_SEVERITY')
          .map(
            (c) => `
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; padding-left: 8px;">
            <span style="color: #cbd5e1;">&bull; ${escapeHtml(c.label)}</span>
            <span style="font-weight: 600; color: #38bdf8;">+${c.points} pts</span>
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px; padding-left: 16px;">${escapeHtml(c.explanation)}</div>
        `
          )
          .join('')}

        ${
          waterfall.synergyScore > 0
            ? `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; margin-bottom: 8px; padding-top: 8px; border-top: 1px dashed #334155;">
            <span style="font-size: 13px; font-weight: 700; color: #cbd5e1;">Compound Risk Synergies:</span>
            <span style="font-size: 13px; font-weight: 700; color: #f59e0b;">+${waterfall.synergyScore} pts</span>
          </div>
          ${waterfall.contributions
            .filter((s) => s.type === 'COMPOUND_SYNERGY')
            .map(
              (s) => `
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; padding-left: 8px;">
              <span style="color: #cbd5e1;">&bull; ${escapeHtml(s.label)}</span>
              <span style="font-weight: 600; color: #f59e0b;">+${s.points} pts</span>
            </div>
            <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px; padding-left: 16px;">${escapeHtml(s.explanation)}</div>
          `
            )
            .join('')}
        `
            : ''
        }

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 10px; border-top: 1px solid #334155; font-size: 13px; font-weight: 700;">
          <span style="color: #f8fafc;">Total Raw Points:</span>
          <span style="color: #38bdf8;">${waterfall.rawTotalScore} pts</span>
        </div>
        ${
          waterfall.capAdjustment !== 0
            ? `
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #94a3b8; margin-top: 4px;">
            <span>Upper Ceiling Clamping Adjustment:</span>
            <span>${waterfall.capAdjustment} pts</span>
          </div>
        `
            : ''
        }
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 14px; font-weight: 800; color: #ffffff; margin-top: 8px; padding: 8px 12px; background: rgba(56, 189, 248, 0.1); border-radius: 4px;">
          <span>Final Deterministic Score:</span>
          <span>${waterfall.finalScore} / 100 (${level})</span>
        </div>
      </div>
      `
          : ''
      }

      <!-- 4. Original Submission / Evidence Source -->
      ${
        isScreenshot
          ? `
          <!-- Original Screenshot Image (if supported) -->
          ${
            screenshotMeta?.previewDataUrl
              ? `
              <div class="section-title">Submitted Screenshot Image</div>
              <div style="margin-bottom: 24px; text-align: center;">
                <img src="${screenshotMeta.previewDataUrl}" alt="Submitted Screenshot Evidence" style="max-width: 100%; max-height: 480px; border-radius: 6px; border: 1px solid #334155; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);" />
              </div>
              `
              : ''
          }
          <!-- Extracted OCR Text -->
          <div class="section-title">Extracted OCR Text (OCR-Derived Information)</div>
          <div style="font-size: 12px; color: #38bdf8; margin-bottom: 8px;">
            Extracted via OCR from: <strong>${escapeHtml(screenshotMeta?.filename || 'screenshot')}</strong>
            (${((screenshotMeta?.byteSize || 0) / 1024).toFixed(1)} KB, OCR Confidence: <strong>${screenshotMeta?.ocrConfidence || 0}%</strong>, Characters: ${screenshotMeta?.extractedCharacterCount || rawText.length})
          </div>
          <div class="raw-submission-box">${escapeHtml(rawText)}</div>
          `
          : isUrlMode
          ? `
          <!-- Submitted Target URL -->
          <div class="section-title">Submitted Target URL</div>
          <div class="raw-submission-box" style="color: #38bdf8; font-weight: 600;">${escapeHtml(targetUrl || rawText)}</div>
          `
          : `
          <!-- Verbatim Text Submission -->
          <div class="section-title">Original Submission (Verbatim Text)</div>
          <div style="font-size: 12px; color: #94a3b8; margin-bottom: 8px;">
            Channel: <strong>${escapeHtml(inputMeta.messageType.toUpperCase())}</strong> &bull; Length: ${inputMeta.characterCount} characters (${inputMeta.wordCount} words)
          </div>
          <div class="raw-submission-box">${escapeHtml(rawText)}</div>
          `
      }

      <!-- 5. 6-Stage Scam Attack Chain Progression -->
      ${
        evidenceIntelligence && evidenceIntelligence.timeline && evidenceIntelligence.timeline.length > 0
          ? `
      <div class="section-title" style="margin-top: 24px;">6-Stage Scam Attack Chain Progression</div>
      <div style="font-size: 12px; color: #94a3b8; margin-bottom: 12px;">
        Chronological causal reconstruction mapping interaction progression from hook to potential consequence.
      </div>
      <div style="margin-bottom: 24px;">
        ${evidenceIntelligence.timeline
          .map((step) => {
            const isObserved = step.observedOrInferred === 'OBSERVED';
            const badgeColor = isObserved ? '#10b981' : '#f59e0b';
            const badgeBg = isObserved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)';
            const badgeText = isObserved ? 'OBSERVED' : 'POTENTIAL CONSEQUENCE';
            return `
            <div class="indicator-card">
              <div class="indicator-header">
                <div>
                  <span style="font-size: 11px; font-weight: 700; color: #38bdf8; text-transform: uppercase; margin-right: 8px;">${escapeHtml(step.stageLabel || step.stage)}</span>
                  <span class="indicator-name">${escapeHtml(step.title)}</span>
                </div>
                <span class="indicator-severity" style="background: ${badgeBg}; color: ${badgeColor};">${badgeText}</span>
              </div>
              <div style="font-size: 12px; color: #cbd5e1; margin-top: 4px; line-height: 1.5;">${escapeHtml(step.description)}</div>
              ${step.evidenceQuote ? `<div class="quote-box">"${escapeHtml(step.evidenceQuote)}"</div>` : ''}
            </div>`;
          })
          .join('')}
      </div>`
          : ''
      }

      <!-- 6. Pretext Contradiction Matrix -->
      ${
        contradictions && contradictions.totalFindings > 0
          ? `
      <div class="section-title" style="margin-top: 24px;">Pretext Contradiction Matrix (${contradictions.totalFindings} Discrepancies)</div>
      <div style="font-size: 12px; color: #94a3b8; margin-bottom: 12px;">
        ${escapeHtml(contradictions.summary)} (${contradictions.contradictionsCount} contradictions, ${contradictions.anomaliesCount} anomalies, ${contradictions.unsupportedClaimsCount} unsupported claims)
      </div>
      <div style="margin-bottom: 24px;">
        ${contradictions.findings
          .map((f) => {
            const badgeColor = f.classification === 'CONTRADICTION' ? '#ef4444' : f.classification === 'ANOMALY' ? '#f59e0b' : '#38bdf8';
            const badgeBg = f.classification === 'CONTRADICTION' ? 'rgba(239, 68, 68, 0.15)' : f.classification === 'ANOMALY' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(56, 189, 248, 0.15)';
            return `
            <div class="indicator-card" style="border-left: 3px solid ${badgeColor};">
              <div class="indicator-header">
                <span class="indicator-name">${escapeHtml(f.explanation)}</span>
                <span class="indicator-severity" style="background: ${badgeBg}; color: ${badgeColor};">${f.classification}</span>
              </div>
              <div style="font-size: 12px; color: #cbd5e1; margin-top: 4px;">
                <strong>Claimed Pretext:</strong> ${escapeHtml(f.claimedPretext)}
              </div>
              <div style="font-size: 12px; color: #cbd5e1; margin-top: 4px;">
                <strong>Conflicting Evidence:</strong> ${escapeHtml(f.conflictingEvidence)}
              </div>
              <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">
                <strong>Why It Matters:</strong> ${escapeHtml(f.whyItMatters)}
              </div>
            </div>`;
          })
          .join('')}
      </div>`
          : ''
      }

      <!-- 7. Psychological Tactic Fingerprinting -->
      ${
        tactics && tactics.tacticCount > 0
          ? `
      <div class="section-title" style="margin-top: 24px;">Psychological Tactic Fingerprinting (${tactics.tacticCount} Patterns)</div>
      <div style="font-size: 12px; color: #94a3b8; margin-bottom: 12px;">
        ${escapeHtml(tactics.summary)}
      </div>
      <div style="margin-bottom: 24px;">
        ${tactics.allTactics
          .map(
            (t) => `
          <div class="indicator-card">
            <div class="indicator-header">
              <span class="indicator-name" style="color: #a78bfa;">${escapeHtml(t.name)}</span>
              <span class="indicator-severity" style="background: rgba(167, 139, 250, 0.2); color: #c4b5fd;">${escapeHtml(t.severity)} SEVERITY</span>
            </div>
            <div style="font-size: 12px; color: #cbd5e1; margin-top: 4px;">
              <strong>Targeted Vulnerability:</strong> ${escapeHtml(t.targetedVulnerability)}
            </div>
            <div style="font-size: 12px; color: #cbd5e1; margin-top: 4px;">
              <strong>Operational Pattern:</strong> ${escapeHtml(t.patternDescription)}
            </div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">
              <strong>Why This Works:</strong> ${escapeHtml(t.explanation)}
            </div>
            <div style="font-size: 12px; color: #38bdf8; margin-top: 4px;">
              <strong>Defensive Spotting Tip:</strong> ${escapeHtml(t.spottingTip)}
            </div>
          </div>`
          )
          .join('')}
      </div>`
          : ''
      }

      <!-- 8. Verified Physical Evidence Findings -->
      <div class="section-title">Verified Physical Evidence (${observedIndicators.length} Findings)</div>
      ${
        observedIndicators.length === 0
          ? '<p style="font-size: 13px; color: #94a3b8; margin-bottom: 24px;">No suspicious indicators detected during the investigation scan.</p>'
          : observedIndicators
              .map(
                (ind) => `
            <div class="indicator-card">
              <div class="indicator-header">
                <span class="indicator-name">${escapeHtml(ind.name)}</span>
                <div>
                  <span style="font-size: 11px; font-family: monospace; color: #94a3b8; margin-right: 8px;">
                    Offset: [${ind.characterRange[0]} - ${ind.characterRange[1]}]
                  </span>
                  <span class="indicator-severity">${ind.severity}</span>
                </div>
              </div>
              <div class="quote-box">"${escapeHtml(ind.evidence)}"</div>
              <div style="font-size: 12px; color: #cbd5e1; margin-top: 6px;">
                <strong>Finding Details:</strong> ${escapeHtml(ind.explanation)}
              </div>
              <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">
                <strong>Why This Matters:</strong> ${escapeHtml(ind.whyItMatters)}
              </div>
            </div>`
              )
              .join('')
      }

      <!-- 9. Missing Evidence & Evidentiary Completeness Advisor -->
      ${
        missingEvidence
          ? `
      <div class="section-title" style="margin-top: 24px;">Missing Evidence &amp; Evidentiary Completeness Advisor</div>
      <div style="font-size: 12px; color: #94a3b8; margin-bottom: 12px;">
        Completeness Level: <strong>${escapeHtml(missingEvidence.completenessRating)}</strong> &bull; Score: <strong>${missingEvidence.completenessScore}/100</strong>
      </div>
      <div style="background: rgba(56, 189, 248, 0.05); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 6px; padding: 10px 14px; margin-bottom: 14px; font-size: 11px; color: #94a3b8; line-height: 1.5;">
        <strong>Evidentiary Limitation Notice:</strong> ${escapeHtml(missingEvidence.advisoryNote)}
      </div>
      <div style="margin-bottom: 24px;">
        ${missingEvidence.missingEvidenceItems
          .map(
            (item) => `
          <div class="indicator-card">
            <div class="indicator-header">
              <span class="indicator-name" style="color: #cbd5e1;">${escapeHtml(item.title)}</span>
              <span class="indicator-severity" style="background: #1e293b; color: #94a3b8;">${escapeHtml(item.category)}</span>
            </div>
            <div style="font-size: 12px; color: #fca5a5; margin-top: 4px;">
              <strong>What Scamvera Cannot Establish:</strong> ${escapeHtml(item.whatIsMissing)}
            </div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">
              <strong>Why Unavailable:</strong> ${escapeHtml(item.whyUnavailable)}
            </div>
            <div style="font-size: 12px; color: #a7f3d0; margin-top: 4px;">
              <strong>Safe Verification Method:</strong> ${escapeHtml(item.safeVerificationGuidance)}
            </div>
            <div style="font-size: 12px; color: #38bdf8; margin-top: 4px;">
              <strong>Analytical Significance:</strong> ${escapeHtml(item.analyticalSignificance)}
            </div>
          </div>`
          )
          .join('')}
      </div>`
          : ''
      }

      <!-- 10. URL & Structural Analysis (Passive Structural Analysis) -->
      ${
        urlAnalysis && urlAnalysis.length > 0
          ? `
          <div class="section-title" style="margin-top: 24px;">Passive URL Structural Analysis</div>
          <div style="font-size: 12px; color: #94a3b8; margin-bottom: 12px; line-height: 1.5;">
            Passive structural analysis found the following domain and structural indicators.
            <em>Note: This analysis is strictly passive and structural. The system does not visit the website, follow HTTP redirects, download remote content, or verify domain ownership.</em>
          </div>
          ${urlAnalysis
            .map(
              (u) => `
            <div class="indicator-card">
              <div style="font-weight: 700; font-size: 13px; color: #38bdf8; word-break: break-all;">${escapeHtml(u.url)}</div>
              <div style="font-size: 12px; color: #cbd5e1; margin-top: 6px; display: flex; flex-wrap: wrap; gap: 12px;">
                <span>Registered Domain: <strong>${escapeHtml(u.domain)}</strong></span>
                <span>TLD: <strong>.${escapeHtml(u.tld)}</strong></span>
                <span>Structural Risk Score: <strong>${u.riskScore}/100</strong></span>
              </div>
              <div style="font-size: 12px; color: #94a3b8; margin-top: 6px;">
                <span>Bare IP: ${u.isBareIp ? 'Yes' : 'No'}</span> &bull;
                <span>Shortener: ${u.isShortener ? 'Yes' : 'No'}</span> &bull;
                <span>Punycode: ${u.isPunycode ? 'Yes' : 'No'}</span> &bull;
                <span>Homoglyph: ${u.hasHomoglyph ? 'Detected' : 'None'}</span>
              </div>
              ${
                u.threatDetails
                  ? `<div style="font-size: 12px; color: #fca5a5; margin-top: 6px;"><strong>Passive Threat Flag:</strong> ${escapeHtml(u.threatDetails)}</div>`
                  : ''
              }
            </div>`
            )
            .join('')}
        `
          : ''
      }

      <!-- 11. Contextual AI Analysis (Clearly Separated) -->
      <div class="section-title" style="margin-top: 24px;">Contextual Analysis (Advisory Only)</div>
      <div class="indicator-card">
        <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px; text-transform: uppercase;">
          Notice: Contextual synthesis provides behavioral context and does not constitute physical evidence.
        </div>
        <div style="font-size: 13px; color: #e2e8f0; line-height: 1.6; margin-bottom: 12px;">
          ${escapeHtml(aiContext.socialEngineeringTactics)}
        </div>
        ${
          aiContext.scamArchetypes && aiContext.scamArchetypes.length > 0
            ? `<div style="font-size: 12px; color: #cbd5e1; margin-bottom: 6px;">
                <strong>Associated Scam Archetypes:</strong> ${escapeHtml(aiContext.scamArchetypes.join(', '))}
               </div>`
            : ''
        }
        ${
          aiContext.psychologicalTriggers && aiContext.psychologicalTriggers.length > 0
            ? `<div style="font-size: 12px; color: #cbd5e1;">
                <strong>Identified Persuasion Triggers:</strong> ${escapeHtml(aiContext.psychologicalTriggers.join(', '))}
               </div>`
            : ''
        }
      </div>

      <!-- 12. Defensive Action Protocols -->
      <div class="section-title" style="margin-top: 24px;">Prioritized Defensive Protocols</div>
      <div class="action-grid">
        ${defensiveRecommendations
          .map((act) => {
            const isDoNot =
              act.action.toLowerCase().includes('not') ||
              act.action.toLowerCase().includes('halt') ||
              act.action.toLowerCase().includes('refuse') ||
              act.action.toLowerCase().includes('never');
            return `
            <div class="action-item ${isDoNot ? 'action-do-not' : 'action-do'}">
              <span style="font-weight: 700;">${isDoNot ? '[DO NOT]' : '[DO]'}:</span>
              <div>
                <strong style="color: #f8fafc;">${escapeHtml(act.action)}</strong>
                <div style="font-size: 12px; margin-top: 2px; color: #cbd5e1;">${escapeHtml(act.detail)}</div>
              </div>
            </div>`;
          })
          .join('')}
      </div>

      <!-- 13. Assessment Basis, Methodology & Legal Disclaimer -->
      <div class="disclaimer-box">
        <div style="font-weight: 700; color: #cbd5e1; margin-bottom: 6px;">ASSESSMENT METHODOLOGY & LEGAL DISCLAIMER</div>
        <p style="margin-bottom: 6px;">
          <strong>Deterministic Algorithmic Basis:</strong> This investigation score (${score}/100) reflects the verified accumulation of physical, structural, and behavioral indicators detected in the submitted material. Scoring is strictly deterministic and does not rely on opaque generative AI probabilities.
        </p>
        ${
          scoringRationale && scoringRationale.length > 0
            ? `<p style="margin-bottom: 6px;">
                <strong>Scoring Factors:</strong> ${escapeHtml(scoringRationale.join('; '))}
               </p>`
            : ''
        }
        <p style="margin-bottom: 6px;">
          <strong>Investigation Limitations:</strong> Passive URL analysis checks syntax and domain indicators without active network crawling. OCR analysis operates on text extracted from user-supplied imagery and confidence is subject to image quality and contrast. Absence of detected patterns does not guarantee authenticity.
        </p>
        <p style="margin-bottom: 6px;">
          <strong>Zero-Retention Guarantee:</strong> No investigation data is stored by this application. This report was compiled client-side in volatile memory with zero server retention.
        </p>
        <p>${escapeHtml(disclaimer)}</p>
      </div>
    </div>
  </div>

  <script id="scamvera-report-data" type="application/json">${JSON.stringify(report).replace(/</g, '\\u003c')}</script>
  <script>
${getInlinedPdfScript()}
  </script>
</body>
</html>`;
  return html;
}

export function generateFullInvestigationReport(report: InvestigationReport): void {
  const html = buildReportHtml(report);
  const isScreenshot = !!report.screenshotMeta;
  const isUrlMode = !!(report.urlAnalysis && report.urlAnalysis.length > 0);
  const investigationTypeLabel = isScreenshot
    ? 'Screenshot_OCR'
    : isUrlMode
    ? 'URL'
    : 'Text';

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `${report.id}_${investigationTypeLabel}_Report.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
