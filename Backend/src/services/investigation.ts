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
  UrlAnalysisSummary,
} from '../types.js';
import { AiProviderCoordinator } from './ai/factory.js';
import { detectIndicators } from './detector.js';
import { normalizeForAnalysis } from './normalizer.js';
import { generateEvidenceEducation } from './education/education_engine.js';
import { analyzeEvidenceIntelligence } from './intelligence/evidence_graph.js';
import { OcrService, validateImageBuffer } from './ocr/ocr_service.js';
import { generateDefensiveRecommendations } from './recommender.js';
import { calculateRiskAssessment } from './risk_engine.js';
import { LocalHeuristicReputationProvider } from './url/reputation_provider.js';
import { validateUrlForSafeFetch } from './url/ssrf_guard.js';
import { analyzeUrl, extractUrlsWithRanges } from './url/url_analyzer.js';
import { filterAndValidateIndicators } from './validator.js';

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
    const rawText = (request.text || '').trim();

    // 1. Strict Input Validation
    if (rawText.length < 5) {
      throw new Error('Input text is too short to investigate. Minimum 5 characters required.');
    }
    if (rawText.length > 10000) {
      throw new Error('Input text exceeds maximum allowed length of 10,000 characters.');
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

    // 6. Transparent Risk Engine
    const riskAssessment = calculateRiskAssessment(verifiedIndicators, rawText.length);

    // 7. Contextual Defensive Recommendations
    const defensiveRecommendations = generateDefensiveRecommendations(
      verifiedIndicators,
      riskAssessment.level,
      messageType
    );

    // 8. Word & Character Telemetry
    const wordCount = rawText.split(/\s+/).filter(Boolean).length;
    const reportId = `INV-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`;

    // 9. URL Analysis & Local Reputation Enrichment
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

    // 10. Evidence Intelligence (Graph, Timeline, Mitigating Evidence Synthesis)
    const evidenceIntelligence = analyzeEvidenceIntelligence(
      reportId,
      rawText,
      verifiedIndicators,
      riskAssessment.level,
      riskAssessment.evidenceStrength,
      urlSummaries,
      defensiveRecommendations
    );

    // 11. Evidence-Grounded Cybersecurity Education
    const education = generateEvidenceEducation(verifiedIndicators);

    // 12. Standard Defensive Cybersecurity Disclaimer
    const disclaimer =
      'This analysis identifies indicators and manipulation tactics commonly associated with scams. It is an algorithmic risk assessment, not definitive proof of sender identity, guilt, or innocence. Always verify high-stakes claims, payments, and account notices through known, trusted official channels.';

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
      evidenceIntelligence,
      education,
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
      throw new Error(
        extraction.warning ||
          'Could not extract sufficient readable text from the screenshot. Ensure the image is clear and contains readable text.'
      );
    }

    const validation = validateImageBuffer(imageBuffer);
    const report = await this.investigate({
      text: extraction.text,
      messageType: 'unknown',
    });

    report.screenshotMeta = {
      filename,
      mimeType: validation.mimeType || 'image/unknown',
      byteSize: imageBuffer.length,
      ocrConfidence: extraction.confidence,
      extractedCharacterCount: extraction.text.length,
      extractedTextPreview: extraction.text.slice(0, 120),
    };

    return report;
  }
}
