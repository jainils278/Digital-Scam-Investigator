/**
 * Threat Intelligence Provider Abstraction & Consensus Coordinator
 * 
 * Provides an extensible threat intelligence layer with:
 * 1. Multi-provider aggregation (Local curated heuristics + external threat feeds)
 * 2. Strict timeout and failure isolation (zero unhandled exceptions)
 * 3. Conflicting intelligence reconciliation
 * 4. Mandatory source attribution
 * 5. Strict segregation from deterministic physical evidence
 */

export type ThreatReputation =
  | 'MALICIOUS'
  | 'SUSPICIOUS'
  | 'NEUTRAL'
  | 'AUTHENTIC_BRAND'
  | 'UNKNOWN';

export interface ThreatIntelRecord {
  target: string;
  targetType: 'URL' | 'DOMAIN' | 'IP';
  reputation: ThreatReputation;
  confidence: number; // 0 to 100
  sourceName: string;
  sourceAttribution: string;
  isExternal: boolean;
  categories: string[];
  summary: string;
  lookupDurationMs: number;
  timestamp: string;
}

export interface AggregatedThreatIntel {
  records: ThreatIntelRecord[];
  consensusReputation: ThreatReputation;
  highestSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  sourcesConsulted: string[];
  hasExternalMatches: boolean;
}

export interface ThreatIntelligenceProvider {
  providerName: string;
  isAvailable(): boolean;
  checkThreat(target: string, type: 'URL' | 'DOMAIN' | 'IP'): Promise<ThreatIntelRecord>;
}

/**
 * High-speed built-in local threat intelligence database
 */
export class LocalHeuristicThreatProvider implements ThreatIntelligenceProvider {
  public providerName = 'Local Defensive Threat Intelligence';

  public isAvailable(): boolean {
    return true;
  }

  public async checkThreat(
    target: string,
    type: 'URL' | 'DOMAIN' | 'IP'
  ): Promise<ThreatIntelRecord> {
    const startTime = Date.now();
    const clean = target.toLowerCase().trim();

    // Known verified authentic entities
    const authenticDomains = [
      'chase.com',
      'paypal.com',
      'wellsfargo.com',
      'bankofamerica.com',
      'citi.com',
      'apple.com',
      'netflix.com',
      'usps.com',
      'fedex.com',
      'ups.com',
      'dhl.com',
      'amazon.com',
      'microsoft.com',
      'google.com',
      'irs.gov',
    ];

    if (authenticDomains.some((d) => clean === d || clean.endsWith(`.${d}`))) {
      return {
        target,
        targetType: type,
        reputation: 'AUTHENTIC_BRAND',
        confidence: 95,
        sourceName: this.providerName,
        sourceAttribution: 'Curated Verified Brand Infrastructure Registry',
        isExternal: false,
        categories: ['VERIFIED_BRAND_INFRASTRUCTURE'],
        summary: 'Target domain matches established primary infrastructure for a verified organization.',
        lookupDurationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    }

    // High risk TLDs
    if (/\.(?:top|xyz|click|buzz|fit|tk|ga|cf|gq|work|rest)$/i.test(clean)) {
      return {
        target,
        targetType: type,
        reputation: 'SUSPICIOUS',
        confidence: 75,
        sourceName: this.providerName,
        sourceAttribution: 'Defensive TLD Threat Scoring Model',
        isExternal: false,
        categories: ['HIGH_RISK_TLD', 'SPAM_ABUSE_ZONE'],
        summary: 'Target is registered under a top-level domain frequently utilized in automated smishing campaigns.',
        lookupDurationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    }

    // Deceptive brand hyphenation patterns
    if (
      /(?:chase|paypal|wellsfargo|apple|netflix|usps|fedex|irs|bank)-/i.test(clean) ||
      /-(?:login|verify|security|portal|update|support)\./i.test(clean)
    ) {
      return {
        target,
        targetType: type,
        reputation: 'MALICIOUS',
        confidence: 85,
        sourceName: this.providerName,
        sourceAttribution: 'Brand Impersonation & Typosquatting Heuristics',
        isExternal: false,
        categories: ['BRAND_IMPERSONATION', 'DECEPTIVE_TYPOSQUATTING'],
        summary: 'Target incorporates recognized brand keywords into an unauthorized lookalike domain structure.',
        lookupDurationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      target,
      targetType: type,
      reputation: 'NEUTRAL',
      confidence: 45,
      sourceName: this.providerName,
      sourceAttribution: 'Baseline Local Registry',
      isExternal: false,
      categories: ['STANDARD_DOMAIN'],
      summary: 'No adverse threat indicators or known impersonation patterns identified.',
      lookupDurationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Secondary threat provider simulating external community feeds with strict timeout defense
 */
export class CommunityFeedThreatProvider implements ThreatIntelligenceProvider {
  public providerName = 'Community Security Threat Exchange';

  public isAvailable(): boolean {
    return true;
  }

  public async checkThreat(
    target: string,
    type: 'URL' | 'DOMAIN' | 'IP'
  ): Promise<ThreatIntelRecord> {
    const startTime = Date.now();
    const clean = target.toLowerCase().trim();

    // Check for known disposable tunneling domains
    if (/(?:ngrok-free\.app|000webhostapp\.com|glitch\.me|workers\.dev)$/i.test(clean)) {
      return {
        target,
        targetType: type,
        reputation: 'SUSPICIOUS',
        confidence: 80,
        sourceName: this.providerName,
        sourceAttribution: 'Community Staging Abuse Feeds (Simulated)',
        isExternal: true,
        categories: ['DISPOSABLE_TUNNEL_HOST'],
        summary: 'Community sensors flag high rates of transient phishing abuse from this hosting platform.',
        lookupDurationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      target,
      targetType: type,
      reputation: 'UNKNOWN',
      confidence: 20,
      sourceName: this.providerName,
      sourceAttribution: 'Community Security Threat Exchange',
      isExternal: true,
      categories: ['NO_COMMUNITY_REPORTS'],
      summary: 'No active threat intelligence reports logged for this target.',
      lookupDurationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Threat Intelligence Coordinator
 * Coordinates queries across multiple providers with per-provider timeout boundaries.
 */
export class ThreatIntelCoordinator {
  private providers: ThreatIntelligenceProvider[] = [];

  constructor(customProviders?: ThreatIntelligenceProvider[]) {
    this.providers = customProviders || [
      new LocalHeuristicThreatProvider(),
      new CommunityFeedThreatProvider(),
    ];
  }

  /**
   * Queries all available threat providers for a target domain or URL.
   * Reconciles findings with defensive consensus.
   */
  public async queryThreatIntel(
    target: string,
    type: 'URL' | 'DOMAIN' | 'IP' = 'DOMAIN'
  ): Promise<AggregatedThreatIntel> {
    const records: ThreatIntelRecord[] = [];
    const sourcesConsulted: string[] = [];

    // Query providers in parallel with timeout boundary (2000ms max per provider)
    const promises = this.providers.map(async (p) => {
      sourcesConsulted.push(p.providerName);
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout querying ${p.providerName}`)), 2000)
        );
        const record = await Promise.race([p.checkThreat(target, type), timeoutPromise]);
        return record;
      } catch (err: any) {
        // Fallback gracefully on provider failure or timeout
        return {
          target,
          targetType: type,
          reputation: 'UNKNOWN' as ThreatReputation,
          confidence: 0,
          sourceName: p.providerName,
          sourceAttribution: `${p.providerName} (Offline / Unreachable)`,
          isExternal: true,
          categories: ['PROVIDER_QUERY_TIMEOUT'],
          summary: `Provider could not be reached: ${err?.message || 'Request timed out'}.`,
          lookupDurationMs: 2000,
          timestamp: new Date().toISOString(),
        };
      }
    });

    const results = await Promise.all(promises);
    records.push(...results);

    // Reconcile consensus reputation
    let consensusReputation: ThreatReputation = 'NEUTRAL';
    let highestSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';

    if (records.some((r) => r.reputation === 'MALICIOUS')) {
      consensusReputation = 'MALICIOUS';
      highestSeverity = 'CRITICAL';
    } else if (records.some((r) => r.reputation === 'SUSPICIOUS')) {
      consensusReputation = 'SUSPICIOUS';
      highestSeverity = 'HIGH';
    } else if (records.some((r) => r.reputation === 'AUTHENTIC_BRAND')) {
      consensusReputation = 'AUTHENTIC_BRAND';
      highestSeverity = 'LOW';
    } else if (records.every((r) => r.reputation === 'UNKNOWN')) {
      consensusReputation = 'UNKNOWN';
      highestSeverity = 'MEDIUM';
    }

    return {
      records,
      consensusReputation,
      highestSeverity,
      sourcesConsulted,
      hasExternalMatches: records.some((r) => r.isExternal && r.reputation !== 'UNKNOWN'),
    };
  }
}
