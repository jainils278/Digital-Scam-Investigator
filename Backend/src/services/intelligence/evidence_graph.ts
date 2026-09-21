/**
 * Evidence Intelligence Engine
 * 
 * Generates:
 * 1. Unified Evidence Graph (Nodes & Edges linking message, URLs, domains, indicators, mitigations, actions)
 * 2. Causal Attack Sequence / Timeline (Sequence progression without fabricated timestamps)
 * 3. Contradictory & Mitigating Evidence Synthesis (Balanced assessment avoiding false binary forcing)
 */

import {
  DefensiveAction,
  EvidenceStrength,
  ObservedIndicator,
  RiskLevel,
  UrlAnalysisSummary,
} from '../../types.js';

export type GraphNodeType =
  | 'ARTIFACT'
  | 'INDICATOR'
  | 'URL'
  | 'DOMAIN'
  | 'REPUTATION'
  | 'MITIGATION'
  | 'DEFENSIVE_ACTION';

export type GraphEdgeType =
  | 'CONTAINS'
  | 'RESOLVES_TO'
  | 'HAS_REPUTATION'
  | 'COMPOUNDS_WITH'
  | 'LEADS_TO'
  | 'MITIGATED_BY'
  | 'TRIGGERS_ACTION';

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  severity?: string;
  metadata?: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: GraphEdgeType;
  label: string;
}

export interface EvidenceGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export type TimelineStage = 'HOOK' | 'PRESSURE' | 'EXPLOITATION' | 'COMPOUND_IMPACT';

export interface TimelineStep {
  stepIndex: number;
  stage: TimelineStage;
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

/**
 * Builds the complete Evidence Graph connecting all physical and contextual findings
 */
export function buildEvidenceGraph(
  reportId: string,
  rawText: string,
  indicators: ObservedIndicator[],
  urlSummaries: UrlAnalysisSummary[] = [],
  defensiveActions: DefensiveAction[] = [],
  mitigatingFactors: MitigatingFactor[] = []
): EvidenceGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  let edgeCounter = 1;

  const addEdge = (source: string, target: string, type: GraphEdgeType, label: string) => {
    edges.push({
      id: `edge_${edgeCounter++}`,
      source,
      target,
      type,
      label,
    });
  };

  // 1. Root Artifact Node
  const artifactId = `node_art_${reportId}`;
  nodes.push({
    id: artifactId,
    type: 'ARTIFACT',
    label: `Message Artifact (${rawText.length} chars)`,
    metadata: { length: rawText.length, preview: rawText.slice(0, 60) },
  });

  // 2. Indicator Nodes & Edges
  for (const ind of indicators) {
    const indNodeId = `node_ind_${ind.id}`;
    nodes.push({
      id: indNodeId,
      type: 'INDICATOR',
      label: ind.name,
      severity: ind.severity,
      metadata: { category: ind.category, evidence: ind.evidence },
    });
    addEdge(artifactId, indNodeId, 'CONTAINS', 'contains evidence');
  }

  // Detect compound synergies and draw relationship edges between indicators
  const urgencyInd = indicators.find((i) => i.category === 'URGENCY_PRESSURE');
  const threatInd = indicators.find((i) => i.category === 'ACCOUNT_THREAT');
  const credInd = indicators.find((i) => i.category === 'CREDENTIAL_HARVESTING');
  const finInd = indicators.find((i) => i.category === 'FINANCIAL_COERCION');
  const impInd = indicators.find((i) => i.category === 'IMPERSONATION');
  const linkInd = indicators.find((i) => i.category === 'SUSPICIOUS_LINK');

  if (urgencyInd && threatInd) {
    addEdge(
      `node_ind_${urgencyInd.id}`,
      `node_ind_${threatInd.id}`,
      'COMPOUNDS_WITH',
      'amplifies perceived urgency'
    );
  }

  if (threatInd && credInd) {
    addEdge(
      `node_ind_${threatInd.id}`,
      `node_ind_${credInd.id}`,
      'LEADS_TO',
      'forces credential verification'
    );
  }

  if (impInd && (linkInd || credInd)) {
    const target = linkInd ? `node_ind_${linkInd.id}` : `node_ind_${credInd!.id}`;
    addEdge(
      `node_ind_${impInd.id}`,
      target,
      'LEADS_TO',
      'lures victim to fake authority portal'
    );
  }

  if (urgencyInd && finInd) {
    addEdge(
      `node_ind_${urgencyInd.id}`,
      `node_ind_${finInd.id}`,
      'COMPOUNDS_WITH',
      'pressures immediate payment'
    );
  }

  // 3. URL and Domain Nodes & Edges
  for (let idx = 0; idx < urlSummaries.length; idx++) {
    const u = urlSummaries[idx];
    const urlNodeId = `node_url_${idx}`;
    nodes.push({
      id: urlNodeId,
      type: 'URL',
      label: u.url.length > 30 ? u.url.slice(0, 27) + '...' : u.url,
      severity: u.riskScore >= 60 ? 'HIGH' : u.riskScore >= 30 ? 'MEDIUM' : 'LOW',
      metadata: { fullUrl: u.url, riskScore: u.riskScore },
    });
    addEdge(artifactId, urlNodeId, 'CONTAINS', 'contains link');

    const domainNodeId = `node_dom_${idx}`;
    nodes.push({
      id: domainNodeId,
      type: 'DOMAIN',
      label: u.domain,
      metadata: { tld: u.tld, isBareIp: u.isBareIp, isPunycode: u.isPunycode },
    });
    addEdge(urlNodeId, domainNodeId, 'RESOLVES_TO', 'resolves to domain');

    if (u.reputationStatus) {
      const repNodeId = `node_rep_${idx}`;
      nodes.push({
        id: repNodeId,
        type: 'REPUTATION',
        label: `${u.reputationStatus} (${u.reputationSource || 'Threat Intel'})`,
        metadata: { details: u.threatDetails },
      });
      addEdge(domainNodeId, repNodeId, 'HAS_REPUTATION', 'intelligence status');
    }
  }

  // 4. Mitigating Factor Nodes
  for (let idx = 0; idx < mitigatingFactors.length; idx++) {
    const m = mitigatingFactors[idx];
    const mitNodeId = `node_mit_${idx}`;
    nodes.push({
      id: mitNodeId,
      type: 'MITIGATION',
      label: m.title,
      metadata: { description: m.description, impact: m.impact },
    });
    addEdge(artifactId, mitNodeId, 'MITIGATED_BY', 'mitigating signal');
  }

  // 5. High-Priority Defensive Action Nodes
  const immediateActions = defensiveActions.filter((a) => a.priority === 'IMMEDIATE').slice(0, 2);
  for (const act of immediateActions) {
    const actNodeId = `node_act_${act.id}`;
    nodes.push({
      id: actNodeId,
      type: 'DEFENSIVE_ACTION',
      label: act.action,
      severity: 'CRITICAL',
      metadata: { detail: act.detail },
    });

    if (credInd) {
      addEdge(`node_ind_${credInd.id}`, actNodeId, 'TRIGGERS_ACTION', 'requires remediation');
    } else if (threatInd) {
      addEdge(`node_ind_${threatInd.id}`, actNodeId, 'TRIGGERS_ACTION', 'requires verification');
    } else {
      addEdge(artifactId, actNodeId, 'TRIGGERS_ACTION', 'recommended step');
    }
  }

  return { nodes, edges };
}

/**
 * Builds an investigation timeline mapping the causal progression of the interaction
 */
export function buildInvestigationTimeline(
  indicators: ObservedIndicator[],
  rawText: string
): TimelineStep[] {
  const steps: TimelineStep[] = [];
  let stepIndex = 1;

  // 1. Stage: Hook / Inception
  const hookIndicators = indicators.filter(
    (i) => i.category === 'IMPERSONATION' || i.category === 'PRIZE_LOTTERY'
  );
  if (hookIndicators.length > 0) {
    const first = hookIndicators[0];
    steps.push({
      stepIndex: stepIndex++,
      stage: 'HOOK',
      title: `Pretext & Identity Hook (${first.name})`,
      description:
        'The sender establishes an authoritative or enticing pretext to capture recipient attention before presenting demands.',
      evidenceQuote: first.evidence,
      indicatorId: first.id,
    });
  }

  // 2. Stage: Pressure / Coercion
  const pressureIndicators = indicators.filter(
    (i) => i.category === 'URGENCY_PRESSURE' || i.category === 'ACCOUNT_THREAT'
  );
  if (pressureIndicators.length > 0) {
    const first = pressureIndicators[0];
    steps.push({
      stepIndex: stepIndex++,
      stage: 'PRESSURE',
      title: `Psychological Coercion (${first.name})`,
      description:
        'Artificial urgency or threatened negative consequences are introduced to bypass rational verification and rush the recipient.',
      evidenceQuote: first.evidence,
      indicatorId: first.id,
    });
  }

  // 3. Stage: Exploitation / Extraction Vector
  const extractionIndicators = indicators.filter(
    (i) =>
      i.category === 'CREDENTIAL_HARVESTING' ||
      i.category === 'FINANCIAL_COERCION' ||
      i.category === 'SUSPICIOUS_LINK' ||
      i.category === 'CHANNEL_DIVERSION'
  );
  for (const ext of extractionIndicators) {
    steps.push({
      stepIndex: stepIndex++,
      stage: 'EXPLOITATION',
      title: `Action Request (${ext.name})`,
      description:
        'The sender directs the recipient toward an irreversible extraction action (sending passcodes, clicking external links, or transferring funds).',
      evidenceQuote: ext.evidence,
      indicatorId: ext.id,
    });
  }

  // 4. Stage: Compound Impact (if multiple high-severity cues combine)
  if (steps.length >= 2) {
    steps.push({
      stepIndex: stepIndex++,
      stage: 'COMPOUND_IMPACT',
      title: 'High-Risk Multi-Vector Combination',
      description:
        'The simultaneous presence of identity pretext, coercive pressure, and extraction triggers constitutes a recognized attack archetype.',
    });
  }

  // If no indicators were detected
  if (steps.length === 0) {
    steps.push({
      stepIndex: 1,
      stage: 'HOOK',
      title: 'Baseline Message Scan Completed',
      description:
        'No multi-stage coercive manipulation sequence or extraction vectors were detected in the analyzed message.',
      evidenceQuote: rawText.length > 80 ? rawText.slice(0, 77) + '...' : rawText,
    });
  }

  return steps;
}

/**
 * Identifies mitigating and contradictory evidence to prevent false certainty
 */
export function identifyMitigatingFactors(
  rawText: string,
  indicators: ObservedIndicator[],
  urlSummaries: UrlAnalysisSummary[]
): MitigatingFactor[] {
  const factors: MitigatingFactor[] = [];
  const lower = rawText.toLowerCase();

  // 1. Check for authentic brand domain match
  const hasAuthenticBrand = urlSummaries.some((u) => u.reputationStatus === 'AUTHENTIC_BRAND');
  if (hasAuthenticBrand) {
    factors.push({
      code: 'AUTHENTIC_DOMAIN_MATCH',
      title: 'Links Point to Authenticated Official Domain',
      description:
        'The destination links in this communication align with official registered domains of the recognized institution.',
      impact: 'STRONG_MITIGATION',
    });
  }

  // 2. Absence of credential demands in an account notice
  const hasAccountNotice = indicators.some((i) => i.category === 'ACCOUNT_THREAT');
  const hasCredentialDemand = indicators.some((i) => i.category === 'CREDENTIAL_HARVESTING');
  if (hasAccountNotice && !hasCredentialDemand) {
    factors.push({
      code: 'NO_CREDENTIAL_SOLICITATION',
      title: 'No Direct Credential or Passcode Request',
      description:
        'While the message mentions account status, it does not directly solicit passwords, PINs, or one-time verification codes.',
      impact: 'MODERATE_MITIGATION',
    });
  }

  // 3. Direction to official application instead of third-party links
  if (
    /(?:official\s+(?:app|application|portal|website)|log\s*in\s+directly\s+through\s+your\s+app|open\s+the\s+official\s+app)/i.test(
      lower
    )
  ) {
    factors.push({
      code: 'OFFICIAL_APP_INSTRUCTION',
      title: 'Directs Recipient to Official Mobile Application',
      description:
        'The sender advises opening the official application independently rather than clicking an unverified external link.',
      impact: 'STRONG_MITIGATION',
    });
  }

  // 4. Educational or advisory warning context
  if (
    /(?:never\s+share\s+your\s+otp|beware\s+of\s+fraud|we\s+will\s+never\s+ask\s+for\s+your\s+password|security\s+tip)/i.test(
      lower
    )
  ) {
    factors.push({
      code: 'DEFENSIVE_ADVISORY_FRAMING',
      title: 'Contains Consumer Defensive Advisory Language',
      description:
        'The communication contains security advisory warnings instructing recipients to protect their authentication credentials.',
      impact: 'STRONG_MITIGATION',
    });
  }

  // 5. Standard non-threatening conversational tone
  if (indicators.length === 0 && rawText.length > 20) {
    factors.push({
      code: 'CONVERSATIONAL_BASELINE',
      title: 'Absence of Coercive Pressure or Urgent Deadlines',
      description:
        'The text exhibits normal conversational tone with no artificial deadlines, legal threats, or financial coercion.',
      impact: 'CAUTIONARY_OBSERVATION',
    });
  }

  return factors;
}

/**
 * Synthesizes evidence graph, causal timeline, and mitigating factors into an evidence intelligence report
 */
export function analyzeEvidenceIntelligence(
  reportId: string,
  rawText: string,
  indicators: ObservedIndicator[],
  riskLevel: RiskLevel,
  evidenceStrength: EvidenceStrength,
  urlSummaries: UrlAnalysisSummary[] = [],
  defensiveActions: DefensiveAction[] = []
): EvidenceIntelligenceSummary {
  const mitigatingFactors = identifyMitigatingFactors(rawText, indicators, urlSummaries);
  const timeline = buildInvestigationTimeline(indicators, rawText);
  const graph = buildEvidenceGraph(
    reportId,
    rawText,
    indicators,
    urlSummaries,
    defensiveActions,
    mitigatingFactors
  );

  // Derive uncertainty level
  let uncertaintyLevel: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW';
  if (indicators.length > 0 && mitigatingFactors.length > 0) {
    uncertaintyLevel = 'MODERATE';
  } else if (evidenceStrength === 'LIMITED' || (indicators.length === 1 && indicators[0].severity === 'LOW')) {
    uncertaintyLevel = 'HIGH';
  }

  // Construct plain-language evidence synthesis
  let evidenceSynthesis = '';
  if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
    evidenceSynthesis = `The evidence graph reveals a high-risk multi-vector pattern (${indicators.length} verified indicators) where initial pretexts connect directly into coercive calls to action. `;
    if (mitigatingFactors.length > 0) {
      evidenceSynthesis += `However, mitigating factors were noted (${mitigatingFactors.map((m) => m.title).join('; ')}), which warrants verifying claims directly before taking definitive action.`;
    } else {
      evidenceSynthesis +=
        'No mitigating signals were observed; strict defensive protocols should be enforced immediately.';
    }
  } else if (riskLevel === 'MEDIUM' || riskLevel === 'LOW') {
    evidenceSynthesis = `Isolated indicators were identified with ${uncertaintyLevel.toLowerCase()} analytical uncertainty. The communication warrants caution, but evidence does not conclusively prove malicious intent.`;
  } else {
    evidenceSynthesis =
      'Zero suspicious indicators were identified. The evidence graph displays a clean conversational baseline with no known social engineering patterns detected.';
  }

  return {
    graph,
    timeline,
    mitigatingFactors,
    uncertaintyLevel,
    evidenceSynthesis,
  };
}
