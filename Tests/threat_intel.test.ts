import { describe, expect, it } from 'vitest';
import {
  CommunityFeedThreatProvider,
  LocalHeuristicThreatProvider,
  ThreatIntelCoordinator,
  ThreatIntelligenceProvider,
} from '../Backend/src/services/threat_intel/provider.js';

describe('Phase 5 — Threat Intelligence & Reputation Layer', () => {
  describe('Local Heuristic Threat Provider', () => {
    it('accurately identifies authentic brand infrastructure', async () => {
      const provider = new LocalHeuristicThreatProvider();
      const result = await provider.checkThreat('paypal.com', 'DOMAIN');

      expect(result.reputation).toBe('AUTHENTIC_BRAND');
      expect(result.confidence).toBeGreaterThanOrEqual(90);
      expect(result.sourceName).toBe('Local Defensive Threat Intelligence');
      expect(result.isExternal).toBe(false);
    });

    it('identifies brand impersonation lookalikes as MALICIOUS', async () => {
      const provider = new LocalHeuristicThreatProvider();
      const result = await provider.checkThreat('chase-login-verify.com', 'DOMAIN');

      expect(result.reputation).toBe('MALICIOUS');
      expect(result.categories).toContain('BRAND_IMPERSONATION');
      expect(result.confidence).toBeGreaterThanOrEqual(80);
    });

    it('identifies abuse-heavy TLDs as SUSPICIOUS', async () => {
      const provider = new LocalHeuristicThreatProvider();
      const result = await provider.checkThreat('cheap-offers.top', 'DOMAIN');

      expect(result.reputation).toBe('SUSPICIOUS');
      expect(result.categories).toContain('HIGH_RISK_TLD');
    });
  });

  describe('Community Feed Provider & Unknown Domain Handling', () => {
    it('flags abused free tunneling domains as SUSPICIOUS', async () => {
      const provider = new CommunityFeedThreatProvider();
      const result = await provider.checkThreat('phishing-test.ngrok-free.app', 'DOMAIN');

      expect(result.reputation).toBe('SUSPICIOUS');
      expect(result.isExternal).toBe(true);
      expect(result.categories).toContain('DISPOSABLE_TUNNEL_HOST');
    });

    it('gracefully returns UNKNOWN for benign unlisted domains', async () => {
      const provider = new CommunityFeedThreatProvider();
      const result = await provider.checkThreat('my-small-local-bakery.com', 'DOMAIN');

      expect(result.reputation).toBe('UNKNOWN');
      expect(result.confidence).toBeLessThan(30);
    });
  });

  describe('Coordinator Consensus & Timeout Resilience', () => {
    it('aggregates multi-provider findings and determines consensus reputation', async () => {
      const coordinator = new ThreatIntelCoordinator();
      const aggregated = await coordinator.queryThreatIntel('usps-track-package.xyz');

      expect(aggregated.records.length).toBeGreaterThanOrEqual(2);
      expect(aggregated.sourcesConsulted.length).toBeGreaterThanOrEqual(2);
      expect(['MALICIOUS', 'SUSPICIOUS']).toContain(aggregated.consensusReputation);
      expect(['HIGH', 'CRITICAL']).toContain(aggregated.highestSeverity);
    });

    it('safely isolates failing or hanging providers without throwing', async () => {
      // Mock provider that throws an exception
      const brokenProvider: ThreatIntelligenceProvider = {
        providerName: 'Broken Flaky Provider',
        isAvailable: () => true,
        checkThreat: async () => {
          throw new Error('Connection reset by peer');
        },
      };

      const coordinator = new ThreatIntelCoordinator([brokenProvider]);
      const aggregated = await coordinator.queryThreatIntel('example.com');

      expect(aggregated).toBeDefined();
      expect(aggregated.records.length).toBe(1);
      expect(aggregated.records[0].reputation).toBe('UNKNOWN');
      expect(aggregated.records[0].sourceAttribution).toContain('Broken Flaky Provider');
    });

    it('enforces mandatory source attribution and preserves non-authoritative boundary', async () => {
      const coordinator = new ThreatIntelCoordinator();
      const aggregated = await coordinator.queryThreatIntel('chase.com');

      for (const record of aggregated.records) {
        expect(record.sourceName.length).toBeGreaterThan(0);
        expect(record.sourceAttribution.length).toBeGreaterThan(0);
        expect(typeof record.lookupDurationMs).toBe('number');
        // External intelligence must NEVER be labeled as DETERMINISTIC
        expect((record as any).source).not.toBe('DETERMINISTIC');
      }
    });
  });
});
