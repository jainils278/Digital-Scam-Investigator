import { describe, expect, it } from 'vitest';
import {
  findInstitutionMatch,
  VERIFIED_INSTITUTION_REGISTRY,
} from '../Backend/src/data/verified_institutions.js';
import type { ObservedIndicator, UrlAnalysisSummary } from '../Backend/src/types.js';

describe('V3.1 Safe Out-of-Band Verification Directory', () => {
  it('validates complete provenance metadata across all registry entries', () => {
    expect(VERIFIED_INSTITUTION_REGISTRY.length).toBeGreaterThanOrEqual(16);

    for (const inst of VERIFIED_INSTITUTION_REGISTRY) {
      expect(inst.id).toMatch(/^inst_[a-z0-9_]+$/);
      expect(inst.organizationName).toBeDefined();
      expect(inst.organizationName.length).toBeGreaterThan(0);
      expect(inst.category).toMatch(/^(FINANCIAL|LOGISTICS_POSTAL|TECH_IDENTITY|GOVERNMENT|ENTERTAINMENT|COMMERCE)$/);
      expect(inst.jurisdiction).toBeDefined();
      expect(inst.officialPrimaryDomain).toMatch(/^[a-z0-9.-]+\.[a-z]{2,}$/);
      expect(inst.safeVerificationGuidance.length).toBeGreaterThan(10);

      // Verify verificationSource provenance
      expect(inst.verificationSource).toBeDefined();
      expect(inst.verificationSource.sourceUrl).toMatch(/^https:\/\//);
      expect(inst.verificationSource.sourceType).toMatch(
        /^(OFFICIAL_ORGANIZATION_SITE|OFFICIAL_FRAUD_PAGE|OFFICIAL_GOVERNMENT_PAGE|OFFICIAL_HELP_PAGE)$/
      );
      expect(inst.verificationSource.lastReviewedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(inst.verificationSource.registryVersion).toBe('1.0.0');
    }
  });

  it('matches supported institution from message text', () => {
    const text = 'USPS: Your package has an unpaid customs charge. Update address to avoid return.';
    const match = findInstitutionMatch(text, []);

    expect(match.matched).toBe(true);
    expect(match.institution).toBeDefined();
    expect(match.institution?.organizationName).toContain('United States Postal Service');
    expect(match.institution?.officialPrimaryDomain).toBe('usps.com');
    expect(match.independentChannelGuidance).toContain('https://usps.com');
  });

  it('detects domain discrepancy when message URL does not match official domain', () => {
    const text = 'Chase Bank: Urgent notice regarding your checking account. Log in at link below.';
    const fakeUrl: UrlAnalysisSummary = {
      url: 'https://chase-security-alert91.com/login',
      domain: 'chase-security-alert91.com',
      hostname: 'chase-security-alert91.com',
      isBareIp: false,
      isShortener: false,
      isPunycode: false,
      hasHomoglyph: false,
      tld: 'com',
      riskScore: 70,
      suspiciousFactorsCount: 2,
    };

    const match = findInstitutionMatch(text, [], [fakeUrl]);

    expect(match.matched).toBe(true);
    expect(match.institution?.officialPrimaryDomain).toBe('chase.com');
    expect(match.messageDiscrepancyNotes).toBeDefined();
    expect(match.messageDiscrepancyNotes).toHaveLength(1);
    expect(match.messageDiscrepancyNotes![0]).toContain('does NOT match');
    expect(match.messageDiscrepancyNotes![0]).toContain('chase-security-alert91.com');
    expect(match.messageDiscrepancyNotes![0]).toContain('chase.com');
  });

  it('does NOT flag discrepancy when message URL resolves to the official domain', () => {
    const text = 'Netflix: Verify your payment method at official portal.';
    const legitimateUrl: UrlAnalysisSummary = {
      url: 'https://www.netflix.com/login',
      domain: 'netflix.com',
      hostname: 'www.netflix.com',
      isBareIp: false,
      isShortener: false,
      isPunycode: false,
      hasHomoglyph: false,
      tld: 'com',
      riskScore: 0,
      suspiciousFactorsCount: 0,
    };

    const match = findInstitutionMatch(text, [], [legitimateUrl]);

    expect(match.matched).toBe(true);
    expect(match.institution?.officialPrimaryDomain).toBe('netflix.com');
    expect(match.messageDiscrepancyNotes).toBeUndefined();
  });

  it('matches via indicator context if brand name was extracted by detector', () => {
    const text = 'Urgent update regarding your financial card.';
    const ind: ObservedIndicator = {
      id: 'ind_1',
      category: 'IMPERSONATION',
      name: 'Bank of America Brand Impersonation',
      severity: 'HIGH',
      evidence: 'financial card',
      characterRange: [0, 14],
      explanation: 'Pretexting as Bank of America',
      whyItMatters: 'Impersonation vector',
      source: 'DETERMINISTIC',
    };

    const match = findInstitutionMatch(text, [ind]);
    expect(match.matched).toBe(true);
    expect(match.institution?.organizationName).toContain('Bank of America');
  });

  it('returns matched: false when no curated institution is referenced (unlisted entity)', () => {
    const text = 'Hi mom, I dropped my phone in the sink. Text me on this new number.';
    const match = findInstitutionMatch(text, []);

    expect(match.matched).toBe(false);
    expect(match.institution).toBeUndefined();
    expect(match.messageDiscrepancyNotes).toBeUndefined();
  });

  it('strict word boundary: does not match spurious substrings', () => {
    // "suspicious" contains "us"
    // "passport" contains "pass"
    const text = 'The suspicious package was placed in the passport office.';
    const match = findInstitutionMatch(text, []);

    expect(match.matched).toBe(false);
  });
});
