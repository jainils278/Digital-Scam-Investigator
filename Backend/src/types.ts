/**
 * Digital Scam Investigator - Core Domain Types & Contracts
 * 
 * Strict separation between:
 * 1. Observed Evidence (Deterministic, verbatim from input text)
 * 2. AI Interpretation (Contextual analysis, strictly segregated from physical evidence)
 * 3. Risk Assessment (Calculated 0-100 assessment score, not statistical probability)
 * 4. Defensive Recommendations (Actionable remediation steps)
 */

export type MessageType = 'sms' | 'email' | 'social_dm' | 'voice_transcript' | 'unknown';

export type IndicatorSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IndicatorCategory =
  | 'URGENCY_PRESSURE'
  | 'FINANCIAL_COERCION'
  | 'CREDENTIAL_HARVESTING'
  | 'ACCOUNT_THREAT'
  | 'PRIZE_LOTTERY'
  | 'IMPERSONATION'
  | 'CHANNEL_DIVERSION'
  | 'SUSPICIOUS_LINK'
  | 'EMOTIONAL_MANIPULATION'
  | 'BENIGN_INDICATOR';

export interface ObservedIndicator {
  id: string;
  category: IndicatorCategory;
  name: string;
  severity: IndicatorSeverity;
  evidence: string; // Exact verbatim quote from original user input
  characterRange: [number, number]; // [startIndex, endIndex] in original raw text
  explanation: string;
  whyItMatters: string;
  source: 'DETERMINISTIC';
}

export interface UnverifiedInference {
  claim: string;
  rationale: string;
}

export interface AiContextAnalysis {
  mode: 'OPENAI_REAL' | 'LOCAL_HEURISTIC';
  providerName: string;
  scamArchetypes: string[];
  psychologicalTriggers: string[];
  socialEngineeringTactics: string;
  ambiguityAssessment: string;
  unverifiedInferences: UnverifiedInference[];
}

export type RiskLevel = 'BENIGN' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type EvidenceStrength = 'SUBSTANTIAL' | 'MODERATE' | 'LIMITED' | 'MINIMAL';

export interface RiskContribution {
  id: string;
  label: string;
  category: IndicatorCategory | 'COMPOUND_SYNERGY' | 'CAP_ADJUSTMENT' | 'MITIGATING_DISCOUNT';
  points: number;
  type: 'BASE_SEVERITY' | 'COMPOUND_SYNERGY' | 'CAP_ADJUSTMENT' | 'MITIGATING_DISCOUNT';
  sourceIndicatorId?: string;
  characterRange?: [number, number];
  evidenceQuote?: string;
  explanation: string;
}

export interface RiskWaterfallBreakdown {
  baseScore: number;
  synergyScore: number;
  rawTotalScore: number;
  capAdjustment: number;
  finalScore: number;
  contributions: RiskContribution[];
}

export interface RiskAssessment {
  score: number; // 0 to 100
  level: RiskLevel;
  evidenceStrength: EvidenceStrength;
  evidenceStrengthExplanation: string;
  primaryCategories: string[];
  scoringRationale: string[];
  waterfall?: RiskWaterfallBreakdown;
  isNonProbabilisticNotice: string;
}

export interface DefensiveAction {
  id: string;
  priority: 'IMMEDIATE' | 'HIGH' | 'RECOMMENDED';
  action: string;
  detail: string;
  category: string;
}

export interface UrlAnalysisSummary {
  url: string;
  domain: string;
  hostname: string;
  isBareIp: boolean;
  isShortener: boolean;
  isPunycode: boolean;
  hasHomoglyph: boolean;
  tld: string;
  riskScore: number;
  suspiciousFactorsCount: number;
  reputationStatus?: string;
  reputationSource?: string;
  threatDetails?: string;
}

export interface ScreenshotMetadata {
  filename?: string;
  mimeType: string;
  byteSize: number;
  ocrConfidence: number;
  extractedCharacterCount: number;
  extractedTextPreview: string;
}

export interface GraphNode {
  id: string;
  type: 'ARTIFACT' | 'INDICATOR' | 'URL' | 'DOMAIN' | 'REPUTATION' | 'MITIGATION' | 'DEFENSIVE_ACTION';
  label: string;
  severity?: string;
  metadata?: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'CONTAINS' | 'RESOLVES_TO' | 'HAS_REPUTATION' | 'COMPOUNDS_WITH' | 'LEADS_TO' | 'MITIGATED_BY' | 'TRIGGERS_ACTION';
  label: string;
}

export interface EvidenceGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export type TimelineStage =
  | 'HOOK'
  | 'TRUST_AUTHORITY'
  | 'PRESSURE'
  | 'REQUEST'
  | 'EXPLOITATION'
  | 'POTENTIAL_IMPACT'
  | 'COMPOUND_IMPACT';

export interface TimelineStep {
  stepIndex: number;
  stage: TimelineStage;
  stageLabel?: string;
  observedOrInferred?: 'OBSERVED' | 'PROJECTED_CONSEQUENCE';
  title: string;
  description: string;
  evidenceQuote?: string;
  indicatorId?: string;
}

export interface MitigatingFactor {
  code: string;
  title: string;
  description: string;
  impact: 'STRONG_MITIGATION' | 'MODERATE_MITIGATION' | 'CAUTIONARY_OBSERVATION';
}

export interface EvidenceIntelligenceSummary {
  graph: EvidenceGraph;
  timeline: TimelineStep[];
  mitigatingFactors: MitigatingFactor[];
  uncertaintyLevel: 'LOW' | 'MODERATE' | 'HIGH';
  evidenceSynthesis: string;
}

export interface EducationalModule {
  id: string;
  category: IndicatorCategory;
  title: string;
  tacticName: string;
  psychologicalMechanism: string;
  attackerPlaybook: string[];
  spottingTips: string[];
  ruleOfThumb: string;
  realWorldAnalogy: string;
  groundedInIndicatorId: string;
}

export interface EducationBriefing {
  modules: EducationalModule[];
  generalHygieneAdvice: string[];
  summary: string;
}

export interface TacticFingerprint {
  id: string;
  name: string;
  category: IndicatorCategory;
  severity: IndicatorSeverity;
  constituentIndicatorIds: string[];
  targetedVulnerability: string;
  patternDescription: string;
  explanation: string;
  spottingTip: string;
}

export interface TacticProfile {
  primaryTactic?: TacticFingerprint;
  allTactics: TacticFingerprint[];
  tacticCount: number;
  summary: string;
}

export type ContradictionClassification = 'CONTRADICTION' | 'ANOMALY' | 'UNSUPPORTED_CLAIM';

export interface ContradictionFinding {
  id: string;
  ruleId: string;
  classification: ContradictionClassification;
  severity: IndicatorSeverity;
  claimedPretext: string;
  conflictingEvidence: string;
  sourceIndicatorIds: string[];
  explanation: string;
  whyItMatters: string;
}

export interface ContradictionAnalysis {
  hasContradictions: boolean;
  totalFindings: number;
  contradictionsCount: number;
  anomaliesCount: number;
  unsupportedClaimsCount: number;
  findings: ContradictionFinding[];
  summary: string;
}

export type MissingEvidenceCategory =
  | 'SENDER_IDENTITY'
  | 'DESTINATION_INFRASTRUCTURE'
  | 'ORIGINAL_CHANNEL'
  | 'TRANSACTION_AUDIT'
  | 'MESSAGE_CONTEXT';

export interface MissingEvidenceItem {
  id: string;
  category: MissingEvidenceCategory;
  title: string;
  whatIsMissing: string;
  whyUnavailable: string;
  safeVerificationGuidance: string;
  analyticalSignificance: string;
}

export interface EvidentiaryCompletenessAssessment {
  completenessScore: number;
  completenessRating: 'HIGH' | 'MODERATE' | 'LOW';
  establishedFacts: string[];
  unestablishedHypotheses: string[];
  missingEvidenceItems: MissingEvidenceItem[];
  advisoryNote: string;
}

export interface InvestigationReport {
  id: string;
  timestamp: string;
  inputMeta: {
    characterCount: number;
    wordCount: number;
    messageType: MessageType;
  };
  rawText: string;
  observedIndicators: ObservedIndicator[];
  aiContext: AiContextAnalysis;
  riskAssessment: RiskAssessment;
  defensiveRecommendations: DefensiveAction[];
  disclaimer: string;
  urlAnalysis?: UrlAnalysisSummary[];
  screenshotMeta?: ScreenshotMetadata;
  evidenceIntelligence?: EvidenceIntelligenceSummary;
  education?: EducationBriefing;
  tactics?: TacticProfile;
  contradictions?: ContradictionAnalysis;
  missingEvidence?: EvidentiaryCompletenessAssessment;
}

export interface InvestigateRequest {
  text: string;
  messageType?: MessageType;
}

export interface InvestigateSuccessResponse {
  success: true;
  report: InvestigationReport;
}

export interface InvestigateErrorResponse {
  success: false;
  error: {
    code: 'VALIDATION_ERROR' | 'INVESTIGATION_ERROR' | 'RATE_LIMITED' | 'SERVER_ERROR';
    message: string;
  };
}

export type InvestigateResponse = InvestigateSuccessResponse | InvestigateErrorResponse;

export interface ExampleCase {
  id: string;
  title: string;
  channel: MessageType;
  expectedRisk: RiskLevel;
  preview: string;
  text: string;
  description: string;
}
