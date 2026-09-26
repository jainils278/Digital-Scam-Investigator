/**
 * Digital Scam Investigator - Frontend Types
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
  evidence: string;
  characterRange: [number, number];
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
  score: number;
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
  previewDataUrl?: string;
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

// --- V3.1 Interactive Workstation Types ---

export type CounterfactualScope = 'INDICATOR' | 'CATEGORY';

export interface CounterfactualScenario {
  scope: CounterfactualScope;
  targetIndicatorId?: string;
  targetCategory?: IndicatorCategory;
  removedIndicatorIds: string[];
  counterfactualScore: number;
  scoreDelta: number;
  counterfactualLevel: RiskLevel;
  brokenSynergies: string[];
  explanation: string;
}

export interface CounterfactualAnalysis {
  baselineScore: number;
  scenarios: CounterfactualScenario[];
  primaryPivotFactor?: string;
}

export interface ObfuscationEvent {
  id: string;
  type: 'HOMOGLYPH' | 'ZERO_WIDTH_CHAR';
  rawChar: string;
  normalizedChar: string;
  rawIndex: number;
  unicodeHex: string;
  description: string;
}

export interface DiffToken {
  text: string;
  isObfuscated: boolean;
  type?: 'HOMOGLYPH' | 'ZERO_WIDTH_CHAR';
  originalChars?: string;
  decodedChars?: string;
  unicodeHex?: string;
}

export interface ObfuscationAnalysis {
  hasObfuscation: boolean;
  totalEvasionChars: number;
  typesDetected: string[];
  diffTokens: DiffToken[];
  summary: string;
}

export type VictimState =
  | 'RECEIVED_MESSAGE_ONLY'
  | 'CLICKED_LINK'
  | 'ENTERED_CREDENTIALS'
  | 'DISCLOSED_OTP_OR_AUTH_CODE'
  | 'PROVIDED_PERSONAL_INFORMATION'
  | 'SENT_MONEY'
  | 'INSTALLED_SOFTWARE_OR_APP'
  | 'SHARED_SCREEN_OR_REMOTE_ACCESS'
  | 'UNKNOWN_STATE';

export interface ReportingChannel {
  name: string;
  jurisdiction?: string;
  channelType:
    | 'PAYMENT_PROVIDER'
    | 'BANK'
    | 'PLATFORM'
    | 'GOVERNMENT'
    | 'LAW_ENFORCEMENT'
    | 'OTHER';
  sourceUrl?: string;
  sourceAttribution?: string;
}

export interface IncidentStep {
  stepNumber: number;
  urgency:
    | 'IMMEDIATE_ACTION'
    | 'WITHIN_1_HOUR'
    | 'WITHIN_24_HOURS';
  title: string;
  detail: string;
  category:
    | 'CONTAINMENT'
    | 'AUTHENTICATION'
    | 'FINANCIAL'
    | 'LEGAL_REPORTING';
}

export interface VictimStateResponse {
  declaredState: VictimState;
  stateLabel: string;
  containmentUrgency:
    | 'CRITICAL_CONTAINMENT'
    | 'ACTIVE_CONTAINMENT'
    | 'PREVENTATIVE';
  containmentSteps: IncidentStep[];
  evidencePreservationGuide: string;
  reportingChannels: ReportingChannel[];
}

export type InstitutionCategory =
  | 'FINANCIAL'
  | 'LOGISTICS_POSTAL'
  | 'TECH_IDENTITY'
  | 'GOVERNMENT'
  | 'ENTERTAINMENT'
  | 'COMMERCE';

export interface VerificationSource {
  sourceUrl: string;
  sourceType:
    | 'OFFICIAL_ORGANIZATION_SITE'
    | 'OFFICIAL_FRAUD_PAGE'
    | 'OFFICIAL_GOVERNMENT_PAGE'
    | 'OFFICIAL_HELP_PAGE';
  lastReviewedDate: string;
  registryVersion: string;
}

export interface VerifiedInstitutionProfile {
  id: string;
  organizationName: string;
  category: InstitutionCategory;
  jurisdiction: string;
  officialPrimaryDomain: string;
  officialLoginUrl?: string;
  officialFraudHotline?: string;
  officialFraudEmail?: string;
  safeVerificationGuidance: string;
  verificationSource: VerificationSource;
}

export interface InstitutionVerificationMatch {
  matched: boolean;
  institution?: VerifiedInstitutionProfile;
  claimedPretext?: string;
  messageDiscrepancyNotes?: string[];
  independentChannelGuidance?: string;
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
  victimResponse?: VictimStateResponse;
  counterfactuals?: CounterfactualAnalysis;
  obfuscationAnalysis?: ObfuscationAnalysis;
  institutionVerification?: InstitutionVerificationMatch;
}

export interface ExampleCase {
  id: string;
  title: string;
  channel: MessageType;
  expectedRisk: RiskLevel;
  preview: string;
  text: string;
  description: string;
}

export interface LocalHistoryItem {
  id: string;
  timestamp: string;
  preview: string;
  characterCount: number;
  messageType: MessageType;
  riskScore: number;
  riskLevel: RiskLevel;
  primaryCategory: string;
  indicatorCount: number;
  report: InvestigationReport;
}
