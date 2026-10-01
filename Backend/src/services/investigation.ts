/**
 * Master Investigation Orchestration Service
 * 
 * Coordinates the end-to-end investigation pipeline:
 * Input Validation -> Normalization -> Deterministic Detection -> AI Context ->
 * Evidence Cross-Validation -> Risk Engine -> Defensive Recommendations -> Structured Report
 */

import { randomUUID } from 'crypto';
import {
  InvestigateRequest,
  InvestigationReport,
  MessageType,
  ScreenshotMetadata,
  UrlAnalysisSummary,
} from '../types.js';
import { AiProviderCoordinator } from './ai/factory.js';
import { detectIndicators } from './detector.js';
import { normalizeForAnalysis } from './normalizer.js';
import { generateEvidenceEducation } from './education/education_engine.js';
import { analyzeEvidenceIntelligence } from './intelligence/evidence_graph.js';
import { analyzeTactics } from './intelligence/tactic_engine.js';
import { analyzeContradictions } from './intelligence/contradiction_engine.js';
import { assessEvidentiaryCompleteness } from './intelligence/missing_evidence_advisor.js';
import { generateCounterfactualAnalysis } from './intelligence/counterfactual_engine.js';
import { analyzeObfuscation } from './intelligence/obfuscation_analyzer.js';
import { generateVictimStateResponse } from './incident_response.js';
import { findInstitutionMatch } from '../data/verified_institutions.js';
import { OcrService, validateImageBuffer } from './ocr/ocr_service.js';
import { generateDefensiveRecommendations } from './recommender.js';
import { calculateRiskAssessment } from './risk_engine.js';
import { LocalHeuristicReputationProvider } from './url/reputation_provider.js';
import { validateUrlForSafeFetch } from './url/ssrf_guard.js';
import { analyzeUrl, extractUrlsWithRanges } from './url/url_analyzer.js';
import { filterAndValidateIndicators } from './validator.js';

export const MAX_SCREENSHOTS_PER_INVESTIGATION = 5;

export class InvestigationService {
  private aiCoordinator: AiProviderCoordinator;
  private urlReputationProvider: LocalHeuristicReputationProvider;

  constructor() {
    this.aiCoordinator = new AiProviderCoordinator();
    this.urlReputationProvider = new LocalHeuristicReputationProvider();
  }

  public getActiveAiProviderInfo() {
    return {
      providerName: this.aiCoordinator.getActiveProviderName(),
      isRealAi: this.aiCoordinator.isUsingRealAi(),
    };
  }

  public async investigate(request: InvestigateRequest): Promise<InvestigationReport> {
    const submittedText = (request.text || '').trim();
    const urls = (request.urls || []).map((u) => u.trim()).filter(Boolean);
    const images = request.images || [];

    if (images.length > MAX_SCREENSHOTS_PER_INVESTIGATION) {
      const err: any = new Error(
        `A maximum of ${MAX_SCREENSHOTS_PER_INVESTIGATION} screenshots can be investigated at once.`
      );
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const screenshotsMeta: ScreenshotMetadata[] = [];
    const ocrTextSegments: { filename?: string; text: string }[] = [];

    if (images.length > 0) {
      const ocrService = new OcrService();
      for (const img of images) {
        if (!img.imageBase64 || typeof img.imageBase64 !== 'string') continue;
        const base64Clean = img.imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
        const buffer = Buffer.from(base64Clean, 'base64');
        const validation = validateImageBuffer(buffer);

        if (!validation.isValid) {
          screenshotsMeta.push({
            filename: img.filename,
            mimeType: 'image/unknown',
            byteSize: buffer.length,
            ocrConfidence: 0,
            extractedCharacterCount: 0,
            extractedTextPreview: '',
            ocrError: validation.error || 'INVALID_IMAGE',
          });
          continue;
        }

        try {
          const extraction = await ocrService.extractText(buffer);
          if (extraction.success && extraction.text && extraction.text.trim().length >= 5) {
            screenshotsMeta.push({
              filename: img.filename,
              mimeType: validation.mimeType || 'image/png',
              byteSize: buffer.length,
              ocrConfidence: extraction.confidence,
              extractedCharacterCount: extraction.text.length,
              extractedTextPreview: extraction.text.slice(0, 120),
              warning: extraction.warning,
            });
            ocrTextSegments.push({ filename: img.filename, text: extraction.text.trim() });
          } else {
            screenshotsMeta.push({
              filename: img.filename,
              mimeType: validation.mimeType || 'image/png',
              byteSize: buffer.length,
              ocrConfidence: extraction.confidence || 0,
              extractedCharacterCount: extraction.text?.length || 0,
              extractedTextPreview: (extraction.text || '').slice(0, 120),
              ocrError:
                extraction.warning ||
                'Could not extract sufficient readable text from this screenshot. Ensure the image is clear and contains readable text.',
            });
          }
        } catch (ocrErr: any) {
          screenshotsMeta.push({
            filename: img.filename,
            mimeType: validation.mimeType || 'image/png',
            byteSize: buffer.length,
            ocrConfidence: 0,
            extractedCharacterCount: 0,
            extractedTextPreview: '',
            ocrError: ocrErr?.message || 'Failed to extract text from screenshot.',
          });
        }
      }
    }

    // If only images were provided and OCR extracted no text:
    if (images.length > 0 && ocrTextSegments.length === 0 && submittedText.length === 0 && urls.length === 0) {
      const firstInvalid = screenshotsMeta.find(
        (s) =>
          s.ocrError &&
          (s.ocrError.includes('EMPTY_IMAGE') ||
            s.ocrError.includes('OVERSIZED_IMAGE') ||
            s.ocrError.includes('UNSUPPORTED_IMAGE_FORMAT') ||
            s.ocrError.includes('UNSAFE_FORMAT'))
      );
      if (firstInvalid) {
        const err: any = new Error(firstInvalid.ocrError);
        err.code = 'INVALID_IMAGE';
        throw err;
      }
      const err: any = new Error(
        screenshotsMeta[0]?.ocrError ||
          'Could not extract sufficient readable text from the screenshot. Ensure the image is clear and contains readable text.'
      );
      err.code = 'LOW_CONTRAST_OR_UNREADABLE';
      throw err;
    }

    if (submittedText.length === 0 && ocrTextSegments.length === 0 && urls.length === 0) {
      const err: any = new Error('Input text is too short to investigate. Minimum 5 characters required.');
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    let rawText = '';
    const textBoundary = submittedText.length;
    let ocrBoundaryStart = -1;

    if (submittedText.length > 0) {
      rawText = submittedText;
    }

    const missingUrls = urls.filter((u) => !rawText.includes(u));
    if (missingUrls.length > 0) {
      rawText = rawText ? `${rawText}\n\n${missingUrls.join('\n')}` : missingUrls.join('\n');
    }

    if (ocrTextSegments.length > 0) {
      ocrBoundaryStart = rawText.length;
      const ocrCombined = ocrTextSegments.map((s) => s.text).join('\n\n');
      rawText = rawText ? `${rawText}\n\n${ocrCombined}` : ocrCombined;
    }

    // 1. Strict Input Validation
    if (rawText.length < 5) {
      throw new Error('Input text is too short to investigate. Minimum 5 characters required.');
    }
    if (images.length === 0 && rawText.length > 10000) {
      throw new Error('Input text exceeds maximum allowed length of 10,000 characters.');
    }
    if (rawText.length > 25000) {
      throw new Error('Combined investigation evidence exceeds maximum allowed length.');
    }

    const validChannels: MessageType[] = ['sms', 'email', 'social_dm', 'voice_transcript', 'unknown'];
    const messageType: MessageType = validChannels.includes(request.messageType as any)
      ? (request.messageType as MessageType)
      : 'unknown';

    // 2. Text Normalization (For matching only; preserves original text & index map)
    const normalizedResult = normalizeForAnalysis(rawText);

    // 3. Authoritative Deterministic Detection Engine
    const detectedIndicators = detectIndicators(normalizedResult);

    // 4. Contextual Analysis (OpenAI or Local Heuristic Fallback)
    const aiContext = await this.aiCoordinator.analyze(
      rawText,
      messageType,
      detectedIndicators
    );

    // 5. Evidence Cross-Validation & Range Alignment
    // Strips any phantom or unverified indicator
    const { verifiedIndicators } = filterAndValidateIndicators(
      detectedIndicators,
      rawText,
      normalizedResult
    );

    // Attribute evidence provenance to verified indicators
    for (const ind of verifiedIndicators) {
      const [start] = ind.characterRange;
      if (textBoundary > 0 && start < textBoundary) {
        ind.evidenceSource = 'TEXT';
      } else if (
        ind.category === 'SUSPICIOUS_LINK' ||
        ind.name.toLowerCase().includes('url') ||
        ind.name.toLowerCase().includes('link')
      ) {
        ind.evidenceSource = 'URL';
      } else if (ocrBoundaryStart >= 0 && start >= ocrBoundaryStart) {
        ind.evidenceSource = 'IMAGE_OCR';
      } else {
        ind.evidenceSource = textBoundary > 0 ? 'TEXT' : 'IMAGE_OCR';
      }
    }

    // 6. Word & Character Telemetry
    const wordCount = rawText.split(/\s+/).filter(Boolean).length;
    const reportId = `INV-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`;

    // 7. URL Analysis & Local Reputation Enrichment (Executed before risk calculation)
    const extractedUrls = extractUrlsWithRanges(rawText);
    const urlSummaries: UrlAnalysisSummary[] = [];
    for (const item of extractedUrls) {
      const analysis = analyzeUrl(item.rawMatch, item.range);
      const rep = await this.urlReputationProvider.checkUrl(analysis.normalizedUrl, analysis.registeredDomain);
      urlSummaries.push({
        url: analysis.rawUrl,
        domain: analysis.registeredDomain,
        hostname: analysis.hostname,
        isBareIp: analysis.isBareIp,
        isShortener: analysis.isShortener,
        isPunycode: analysis.isPunycode,
        hasHomoglyph: analysis.hasHomoglyph,
        tld: analysis.tld,
        riskScore: analysis.riskScore,
        suspiciousFactorsCount: analysis.suspiciousFactors.length,
        reputationStatus: rep.status,
        reputationSource: rep.source,
        threatDetails: rep.threatDetails,
      });
    }

    // 8. Safe Out-of-Band Verification Matcher (Executed before risk calculation)
    const institutionVerification = findInstitutionMatch(
      normalizedResult.normalizedText,
      verifiedIndicators,
      urlSummaries
    );

    // 9. Centralized Risk Scoring Engine (Incorporates indicators, URLs, and institution mismatch)
    const riskAssessment = calculateRiskAssessment(
      verifiedIndicators,
      rawText.length,
      urlSummaries,
      institutionVerification
    );

    // 10. Contextual Defensive Recommendations
    const defensiveRecommendations = generateDefensiveRecommendations(
      verifiedIndicators,
      riskAssessment.level,
      messageType
    );

    // 11. Evidence Intelligence (Graph, Timeline, Mitigating Evidence Synthesis)
    const evidenceIntelligence = analyzeEvidenceIntelligence(
      reportId,
      rawText,
      verifiedIndicators,
      riskAssessment.level,
      riskAssessment.evidenceStrength,
      urlSummaries,
      defensiveRecommendations
    );

    // 12. Evidence-Grounded Cybersecurity Education
    const education = generateEvidenceEducation(verifiedIndicators);

    // 13. V3.0 Deterministic Psychological Tactic Fingerprinting
    const tactics = analyzeTactics(verifiedIndicators, urlSummaries);

    // 14. V3.0 Pretext Contradiction Matrix
    const contradictions = analyzeContradictions(verifiedIndicators, urlSummaries, rawText);

    // 15. V3.0 Evidentiary Completeness & Missing Evidence Advisor
    const missingEvidence = assessEvidentiaryCompleteness(rawText, verifiedIndicators, urlSummaries);

    // 16. V3.1 Counterfactual Risk Sensitivity Analysis
    const counterfactuals = generateCounterfactualAnalysis(
      verifiedIndicators,
      riskAssessment,
      rawText.length
    );

    // 17. V3.1 The Attacker's Mask (Obfuscation & Evasion Diff)
    const obfuscationAnalysis = analyzeObfuscation(
      rawText,
      normalizedResult.obfuscationEvents
    );

    // 18. V3.1 Victim-State Incident Response Engine
    const victimResponse = generateVictimStateResponse(request.victimState);

    // 19. Standard Defensive Cybersecurity Disclaimer
    const disclaimer =
      'This analysis identifies indicators and manipulation tactics commonly associated with scams. It is an algorithmic risk assessment, not definitive proof of sender identity, guilt, or innocence. Always verify high-stakes claims, payments, and account notices through known, trusted official channels.';

    const evidenceSources: ('TEXT' | 'URL' | 'IMAGE')[] = [];
    if (submittedText.length > 0) evidenceSources.push('TEXT');
    if (screenshotsMeta.length > 0) evidenceSources.push('IMAGE');
    if (urlSummaries.length > 0 || urls.length > 0) evidenceSources.push('URL');

    return {
      id: reportId,
      timestamp: new Date().toISOString(),
      inputMeta: {
        characterCount: rawText.length,
        wordCount,
        messageType,
      },
      rawText,
      observedIndicators: verifiedIndicators,
      aiContext,
      riskAssessment,
      defensiveRecommendations,
      disclaimer,
      urlAnalysis: urlSummaries.length > 0 ? urlSummaries : undefined,
      screenshotMeta: screenshotsMeta.length > 0 ? screenshotsMeta[0] : undefined,
      screenshotsMeta: screenshotsMeta.length > 0 ? screenshotsMeta : undefined,
      evidenceSources: evidenceSources.length > 0 ? evidenceSources : undefined,
      evidenceIntelligence,
      education,
      tactics,
      contradictions,
      missingEvidence,
      victimResponse,
      counterfactuals,
      obfuscationAnalysis: obfuscationAnalysis.hasObfuscation ? obfuscationAnalysis : undefined,
      institutionVerification: institutionVerification.matched ? institutionVerification : undefined,
      analysisMethod: aiContext.analysisMethod,
      liveInspectionPerformed: false,
      urlDisclaimer: urlSummaries.length > 0
        ? 'ScamVera performed passive structural analysis only. The destination page was not loaded or executed. Live page content, ownership history, and sender identity were not verified.'
        : undefined,
    };
  }

  /**
   * Dedicated URL and Domain Deep Investigation
   * Safe against SSRF, inspects DNS resolution, redirects, and reputation.
   */
  public async investigateUrl(rawUrl: string) {
    const trimmed = (rawUrl || '').trim();
    if (!trimmed) {
      throw new Error('A URL string is required.');
    }

    // 1. SSRF Barrier: Ensure URL cannot access internal infrastructure or metadata
    const ssrfCheck = await validateUrlForSafeFetch(trimmed);
    if (!ssrfCheck.isSafe) {
      return {
        url: trimmed,
        isSafe: false,
        ssrfBlocked: true,
        reason: ssrfCheck.reason,
        analysis: analyzeUrl(trimmed, [0, trimmed.length]),
      };
    }

    // 2. Structural URL Analysis
    const analysis = analyzeUrl(trimmed, [0, trimmed.length]);

    // 3. Reputation Lookup
    const reputation = await this.urlReputationProvider.checkUrl(
      analysis.normalizedUrl,
      analysis.registeredDomain
    );

    return {
      url: trimmed,
      isSafe: true,
      ssrfBlocked: false,
      resolvedIps: ssrfCheck.resolvedIps,
      analysis,
      reputation,
    };
  }

  /**
   * Processes a screenshot image buffer:
   * Validates format & size -> Extracts text via OCR -> Feeds extracted text into investigation pipeline
   */
  public async investigateScreenshot(
    imageBuffer: Buffer,
    filename?: string
  ): Promise<InvestigationReport> {
    const ocrService = new OcrService();
    const extraction = await ocrService.extractText(imageBuffer);

    if (!extraction.success || !extraction.text || extraction.text.trim().length < 5) {
      const err: any = new Error(
        extraction.warning ||
          'Could not extract sufficient readable text from the screenshot. Ensure the image is clear and contains readable text.'
      );
      err.code = extraction.errorCode || 'LOW_CONTRAST_OR_UNREADABLE';
      throw err;
    }

    const validation = validateImageBuffer(imageBuffer);
    const report = await this.investigate({
      text: extraction.text,
      messageType: 'unknown',
    });

    const meta: ScreenshotMetadata = {
      filename,
      mimeType: validation.mimeType || 'image/unknown',
      byteSize: imageBuffer.length,
      ocrConfidence: extraction.confidence,
      extractedCharacterCount: extraction.text.length,
      extractedTextPreview: extraction.text.slice(0, 120),
    };

    report.screenshotMeta = meta;
    report.screenshotsMeta = [meta];
    report.evidenceSources = ['IMAGE'];

    return report;
  }
}
