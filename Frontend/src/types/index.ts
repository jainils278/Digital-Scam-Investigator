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

export interface RiskAssessment {
  score: number;
  level: RiskLevel;
  evidenceStrength: EvidenceStrength;
  evidenceStrengthExplanation: string;
  primaryCategories: string[];
  scoringRationale: string[];
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

export interface TimelineStep {
  stepIndex: number;
  stage: 'HOOK' | 'PRESSURE' | 'EXPLOITATION' | 'COMPOUND_IMPACT';
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
