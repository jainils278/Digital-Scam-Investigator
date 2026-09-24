/**
 * Digital Scam Investigator - Full Investigation Report Generator
 * 
 * 100% Client-Side generation adhering to zero-retention privacy principles.
 * Compiles the existing structured InvestigationReport into a comprehensive,
 * self-contained, print-friendly and audit-ready HTML document.
 * 
 * Single source of truth: Uses the exact structured investigation report object,
 * preserving identical scoring, verified evidence, OCR telemetry, and passive URL findings.
 */

import type { InvestigationReport } from '../types';

export function generateFullInvestigationReport(report: InvestigationReport): void {
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
  } = report;

  const { score, level, evidenceStrength, primaryCategories, scoringRationale } = riskAssessment;

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
    targetUrl = rawText.replace(/target link to investigate:s*/i, '').trim();
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
        <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
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

      <!-- 3. Original Submission / Evidence Source -->
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

      <!-- 4. Verified Physical Evidence Findings -->
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

      <!-- 5. URL & Structural Analysis (Passive Structural Analysis) -->
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

      <!-- 6. Contextual AI Analysis (Clearly Separated) -->
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

      <!-- 7. Defensive Action Protocols -->
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

      <!-- 8. Assessment Basis, Methodology & Legal Disclaimer -->
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
</body>
</html>`;

  // Trigger download of the standalone HTML report
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `${id}_${investigationTypeLabel.replace(/[^a-zA-Z0-9]/g, '_')}_Report.html`;
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
