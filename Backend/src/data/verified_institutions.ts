/**
 * Safe Out-of-Band Verification Directory
 * 
 * Curated registry of verified, official institutions and contact channels.
 * 
 * CRITICAL ARCHITECTURAL CONSTRAINTS:
 * 1. STATIC, CURATED REGISTRY ONLY — No dynamic web scraping, no WHOIS lookups.
 * 2. ZERO network requests — All data is statically verified with documented provenance.
 * 3. STRICT TRUST BOUNDARY — Information found in suspicious submissions is NEVER trusted.
 * 4. ABSENCE IS NOT A RISK SIGNAL — Unlisted organizations simply have no curated profile.
 */

import type {
  InstitutionVerificationMatch,
  ObservedIndicator,
  UrlAnalysisSummary,
  VerifiedInstitutionProfile,
} from '../types.js';

export interface InstitutionEntry extends VerifiedInstitutionProfile {
  aliases: string[];
  domainMatches: string[];
}

export const VERIFIED_INSTITUTION_REGISTRY: InstitutionEntry[] = [
  {
    id: 'inst_usps',
    organizationName: 'United States Postal Service (USPS)',
    category: 'LOGISTICS_POSTAL',
    jurisdiction: 'United States',
    officialPrimaryDomain: 'usps.com',
    officialLoginUrl: 'https://reg.usps.com/entreg/LoginAction_input',
    officialFraudHotline: '+1-877-876-2455',
    officialFraudEmail: 'spam@uspis.gov',
    safeVerificationGuidance:
      'USPS will never send unsolicited SMS text messages containing package tracking links unless you explicitly registered for text updates with a valid tracking number.',
    verificationSource: {
      sourceUrl: 'https://www.uspis.gov/news/scam-article/smishing-package-tracking-text-scams',
      sourceType: 'OFFICIAL_GOVERNMENT_PAGE',
      lastReviewedDate: '2026-01-15',
      registryVersion: '1.0.0',
    },
    aliases: ['usps', 'united states postal service', 'postal service', 'us post office', 'uspis'],
    domainMatches: ['usps.com', 'uspis.gov'],
  },
  {
    id: 'inst_fedex',
    organizationName: 'FedEx Corporation',
    category: 'LOGISTICS_POSTAL',
    jurisdiction: 'Global / Multi-Jurisdiction',
    officialPrimaryDomain: 'fedex.com',
    officialLoginUrl: 'https://www.fedex.com/en-us/login.html',
    officialFraudHotline: '+1-800-463-3339',
    officialFraudEmail: 'abuse@fedex.com',
    safeVerificationGuidance:
      'FedEx does not request payment, personal information, or passwords via unsolicited SMS or email. Track packages only at fedex.com/tracking.',
    verificationSource: {
      sourceUrl: 'https://www.fedex.com/en-us/trust-center/report-fraud.html',
      sourceType: 'OFFICIAL_FRAUD_PAGE',
      lastReviewedDate: '2026-01-15',
      registryVersion: '1.0.0',
    },
    aliases: ['fedex', 'federal express'],
    domainMatches: ['fedex.com'],
  },
  {
    id: 'inst_ups',
    organizationName: 'United Parcel Service (UPS)',
    category: 'LOGISTICS_POSTAL',
    jurisdiction: 'Global / Multi-Jurisdiction',
    officialPrimaryDomain: 'ups.com',
    officialLoginUrl: 'https://www.ups.com/lasso/login',
    officialFraudHotline: '+1-800-742-5877',
    officialFraudEmail: 'fraud@ups.com',
    safeVerificationGuidance:
      'UPS will not contact you demanding payment or personal data to release a package. Verify tracking numbers directly on ups.com.',
    verificationSource: {
      sourceUrl: 'https://www.ups.com/us/en/support/fraud-prevention.page',
      sourceType: 'OFFICIAL_FRAUD_PAGE',
      lastReviewedDate: '2026-01-15',
      registryVersion: '1.0.0',
    },
    aliases: ['ups', 'united parcel service'],
    domainMatches: ['ups.com'],
  },
  {
    id: 'inst_dhl',
    organizationName: 'DHL Express',
    category: 'LOGISTICS_POSTAL',
    jurisdiction: 'Global / Multi-Jurisdiction',
    officialPrimaryDomain: 'dhl.com',
    officialLoginUrl: 'https://identity.dhl.com',
    officialFraudHotline: '+1-800-225-5345',
    officialFraudEmail: 'phishing-dpdhl@dhl.com',
    safeVerificationGuidance:
      'DHL messages originate strictly from @dhl.com addresses. Any request for delivery fees via wire, crypto, or gift cards is fraudulent.',
    verificationSource: {
      sourceUrl: 'https://www.dhl.com/global-en/home/footer/fraud-awareness.html',
      sourceType: 'OFFICIAL_FRAUD_PAGE',
      lastReviewedDate: '2026-01-15',
      registryVersion: '1.0.0',
    },
    aliases: ['dhl', 'dhl express'],
    domainMatches: ['dhl.com'],
  },
  {
    id: 'inst_chase',
    organizationName: 'JPMorgan Chase Bank',
    category: 'FINANCIAL',
    jurisdiction: 'United States',
    officialPrimaryDomain: 'chase.com',
    officialLoginUrl: 'https://www.chase.com',
    officialFraudHotline: '+1-800-935-9935',
    officialFraudEmail: 'phishing@chase.com',
    safeVerificationGuidance:
      'Chase will NEVER call, text, or email asking for your password, one-time passcode (OTP), or debit card PIN. Use only the Chase Mobile app or chase.com.',
    verificationSource: {
      sourceUrl: 'https://www.chase.com/digital/resources/privacy-security/security/report-fraud',
      sourceType: 'OFFICIAL_FRAUD_PAGE',
      lastReviewedDate: '2026-01-15',
      registryVersion: '1.0.0',
    },
    aliases: ['chase', 'chase bank', 'jpmorgan chase', 'jp morgan chase'],
    domainMatches: ['chase.com', 'jpmorganchase.com'],
  },
  {
    id: 'inst_bofa',
    organizationName: 'Bank of America',
    category: 'FINANCIAL',
    jurisdiction: 'United States',
    officialPrimaryDomain: 'bankofamerica.com',
    officialLoginUrl: 'https://www.bankofamerica.com',
    officialFraudHotline: '+1-800-432-1000',
    officialFraudEmail: 'abuse@bankofamerica.com',
    safeVerificationGuidance:
      'Bank of America will never contact you asking to confirm sensitive security details via link. Call the number on the back of your card to verify any claim.',
    verificationSource: {
      sourceUrl: 'https://www.bankofamerica.com/security-center/report-suspicious-activities/',
      sourceType: 'OFFICIAL_FRAUD_PAGE',
      lastReviewedDate: '2026-01-15',
      registryVersion: '1.0.0',
    },
    aliases: ['bank of america', 'bofa', 'b of a'],
    domainMatches: ['bankofamerica.com'],
  },
  {
    id: 'inst_wells_fargo',
    organizationName: 'Wells Fargo',
    category: 'FINANCIAL',
    jurisdiction: 'United States',
    officialPrimaryDomain: 'wellsfargo.com',
    officialLoginUrl: 'https://www.wellsfargo.com',
    officialFraudHotline: '+1-800-869-3557',
    officialFraudEmail: 'reportphish@wellsfargo.com',
    safeVerificationGuidance:
      'Wells Fargo will never ask you to transfer funds to "protect" them or to read back a verification code sent to your phone.',
    verificationSource: {
      sourceUrl: 'https://www.wellsfargo.com/privacy-security/fraud/report/',
      sourceType: 'OFFICIAL_FRAUD_PAGE',
      lastReviewedDate: '2026-01-15',
      registryVersion: '1.0.0',
    },
    aliases: ['wells fargo', 'wellsfargo'],
    domainMatches: ['wellsfargo.com'],
  },
  {
    id: 'inst_citi',
    organizationName: 'Citibank / Citi',
    category: 'FINANCIAL',
    jurisdiction: 'Global / Multi-Jurisdiction',
    officialPrimaryDomain: 'citi.com',
    officialLoginUrl: 'https://www.citi.com',
    officialFraudHotline: '+1-800-374-9700',
    officialFraudEmail: 'spoof@citi.com',
    safeVerificationGuidance:
      'Citi will never request passwords or OTPs over unsolicited calls or texts. Access your account only by typing citi.com directly.',
    verificationSource: {
      sourceUrl: 'https://www.citi.com/privacy-security-center/report-fraud',
      sourceType: 'OFFICIAL_FRAUD_PAGE',
      lastReviewedDate: '2026-01-15',
      registryVersion: '1.0.0',
    },
    aliases: ['citi', 'citibank'],
    domainMatches: ['citi.com', 'citigroup.com'],
  },
  {
    id: 'inst_paypal',
    organizationName: 'PayPal',
    category: 'FINANCIAL',
    jurisdiction: 'Global / Multi-Jurisdiction',
    officialPrimaryDomain: 'paypal.com',
    officialLoginUrl: 'https://www.paypal.com/signin',
    officialFraudHotline: '+1-888-221-1161',
    officialFraudEmail: 'phishing@paypal.com',
    safeVerificationGuidance:
      'PayPal addresses you by your full registered name in communications, never generic greetings like "Dear Customer". Always log in directly at paypal.com.',
    verificationSource: {
      sourceUrl: 'https://www.paypal.com/us/security/report-fraud',
      sourceType: 'OFFICIAL_FRAUD_PAGE',
      lastReviewedDate: '2026-01-15',
      registryVersion: '1.0.0',
    },
    aliases: ['paypal'],
    domainMatches: ['paypal.com'],
  },
  {
    id: 'inst_apple',
    organizationName: 'Apple Inc.',
    category: 'TECH_IDENTITY',
    jurisdiction: 'Global / Multi-Jurisdiction',
    officialPrimaryDomain: 'apple.com',
    officialLoginUrl: 'https://appleid.apple.com',
    officialFraudHotline: '+1-800-275-2273',
    officialFraudEmail: 'reportphishing@apple.com',
    safeVerificationGuidance:
      'Apple will never ask for your Apple Account password or verification codes to provide support or unfreeze an account. Manage account security only at appleid.apple.com.',
    verificationSource: {
      sourceUrl: 'https://support.apple.com/en-us/102568',
      sourceType: 'OFFICIAL_HELP_PAGE',
      lastReviewedDate: '2026-01-15',
      registryVersion: '1.0.0',
    },
    aliases: ['apple', 'apple id', 'icloud', 'itunes'],
    domainMatches: ['apple.com', 'icloud.com'],
  },
  {
    id: 'inst_microsoft',
    organizationName: 'Microsoft',
    category: 'TECH_IDENTITY',
    jurisdiction: 'Global / Multi-Jurisdiction',
    officialPrimaryDomain: 'microsoft.com',
    officialLoginUrl: 'https://account.microsoft.com',
    officialFraudHotline: '+1-800-642-7676',
    officialFraudEmail: 'phish@office365.microsoft.com',
    safeVerificationGuidance:
      'Microsoft error and warning messages never include phone numbers to call. Microsoft will never proactively cold-call you to offer tech support.',
    verificationSource: {
      sourceUrl: 'https://support.microsoft.com/en-us/windows/protect-yourself-from-tech-support-scams-2ee17812-703f-40e7-a5e6-d64c0d0d10cf',
      sourceType: 'OFFICIAL_HELP_PAGE',
      lastReviewedDate: '2026-01-15',
      registryVersion: '1.0.0',
    },
    aliases: ['microsoft', 'windows defender', 'office 365', 'outlook', 'microsoft account'],
    domainMatches: ['microsoft.com', 'live.com', 'office.com'],
  },
  {
    id: 'inst_google',
    organizationName: 'Google',
    category: 'TECH_IDENTITY',
    jurisdiction: 'Global / Multi-Jurisdiction',
    officialPrimaryDomain: 'google.com',
    officialLoginUrl: 'https://accounts.google.com',
    officialFraudHotline: undefined,
    officialFraudEmail: undefined,
    safeVerificationGuidance:
      'Google never sends messages asking you to reply with your password, 2-step verification code, or personal data. Check your Google Account security directly at myaccount.google.com.',
    verificationSource: {
      sourceUrl: 'https://support.google.com/accounts/answer/75061',
      sourceType: 'OFFICIAL_HELP_PAGE',
      lastReviewedDate: '2026-01-15',
      registryVersion: '1.0.0',
    },
    aliases: ['google', 'gmail', 'google account'],
    domainMatches: ['google.com'],
  },
  {
    id: 'inst_amazon',
    organizationName: 'Amazon',
    category: 'COMMERCE',
    jurisdiction: 'Global / Multi-Jurisdiction',
    officialPrimaryDomain: 'amazon.com',
    officialLoginUrl: 'https://www.amazon.com/gp/navigation/redirector.html/ref=sign-in-redirect',
    officialFraudHotline: '+1-888-280-4331',
    officialFraudEmail: 'stop-spoofing@amazon.com',
    safeVerificationGuidance:
      'Amazon will never ask you to verify sensitive credentials or pay fees via gift cards, wire transfers, or third-party apps. Check official orders only in "Your Orders" at amazon.com.',
    verificationSource: {
      sourceUrl: 'https://www.amazon.com/gp/help/customer/display.html?nodeId=GRGRY7AQ3LMPXNCR',
      sourceType: 'OFFICIAL_HELP_PAGE',
      lastReviewedDate: '2026-01-15',
      registryVersion: '1.0.0',
    },
    aliases: ['amazon', 'amazon prime', 'amazon pay'],
    domainMatches: ['amazon.com'],
  },
  {
    id: 'inst_netflix',
    organizationName: 'Netflix',
    category: 'ENTERTAINMENT',
    jurisdiction: 'Global / Multi-Jurisdiction',
    officialPrimaryDomain: 'netflix.com',
    officialLoginUrl: 'https://www.netflix.com/login',
    officialFraudHotline: undefined,
    officialFraudEmail: 'phishing@netflix.com',
    safeVerificationGuidance:
      'Netflix will never ask you to input credit card details, bank account info, or Netflix passwords in an email or text message. Always manage membership directly at netflix.com/YourAccount.',
    verificationSource: {
      sourceUrl: 'https://help.netflix.com/en/node/65674',
      sourceType: 'OFFICIAL_HELP_PAGE',
      lastReviewedDate: '2026-01-15',
      registryVersion: '1.0.0',
    },
    aliases: ['netflix'],
    domainMatches: ['netflix.com'],
  },
  {
    id: 'inst_irs',
    organizationName: 'Internal Revenue Service (IRS)',
    category: 'GOVERNMENT',
    jurisdiction: 'United States',
    officialPrimaryDomain: 'irs.gov',
    officialLoginUrl: 'https://www.irs.gov/your-account',
    officialFraudHotline: '+1-800-829-1040',
    officialFraudEmail: 'phishing@irs.gov',
    safeVerificationGuidance:
      'The IRS never initiates contact with taxpayers by email, text messages, or social media to request personal or financial information. The IRS will never demand immediate payment using prepaid debit cards, gift cards, or wire transfers.',
    verificationSource: {
      sourceUrl: 'https://www.irs.gov/privacy-disclosure/report-phishing',
      sourceType: 'OFFICIAL_GOVERNMENT_PAGE',
      lastReviewedDate: '2026-01-15',
      registryVersion: '1.0.0',
    },
    aliases: ['irs', 'internal revenue service', 'tax refund', 'tax rebate'],
    domainMatches: ['irs.gov'],
  },
  {
    id: 'inst_ssa',
    organizationName: 'Social Security Administration (SSA)',
    category: 'GOVERNMENT',
    jurisdiction: 'United States',
    officialPrimaryDomain: 'ssa.gov',
    officialLoginUrl: 'https://www.ssa.gov/myaccount/',
    officialFraudHotline: '+1-800-269-0271',
    officialFraudEmail: undefined,
    safeVerificationGuidance:
      'The Social Security Administration will never threaten you with arrest or legal action, demand immediate payment, or promise a Social Security benefit approval in exchange for personal information or cash.',
    verificationSource: {
      sourceUrl: 'https://oig.ssa.gov/report/',
      sourceType: 'OFFICIAL_GOVERNMENT_PAGE',
      lastReviewedDate: '2026-01-15',
      registryVersion: '1.0.0',
    },
    aliases: ['ssa', 'social security', 'social security administration', 'ssn suspension'],
    domainMatches: ['ssa.gov'],
  },
];

/**
 * Deterministically finds a verified institution profile matching claimed pretexts in the input text.
 */
export function findInstitutionMatch(
  normalizedText: string,
  verifiedIndicators: ObservedIndicator[],
  urls: UrlAnalysisSummary[] = []
): InstitutionVerificationMatch {
  const lowerText = normalizedText.toLowerCase();

  // 1. Check indicators for IMPERSONATION or claimed brand name
  let matchedEntry: InstitutionEntry | undefined;

  // First pass: match by explicit aliases
  for (const entry of VERIFIED_INSTITUTION_REGISTRY) {
    for (const alias of entry.aliases) {
      // Word boundary match to prevent substrings like "ass" matching "usps" or similar
      const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const aliasRegex = new RegExp(`\\b${escapedAlias}\\b`, 'i');
      if (aliasRegex.test(lowerText)) {
        matchedEntry = entry;
        break;
      }
    }
    if (matchedEntry) break;
  }

  // Second pass: if not matched in text, check if any indicator mentions the institution
  if (!matchedEntry) {
    const impersonationInds = verifiedIndicators.filter(
      (i) => i.category === 'IMPERSONATION' || i.category === 'ACCOUNT_THREAT'
    );
    for (const ind of impersonationInds) {
      const indLower = `${ind.name} ${ind.explanation}`.toLowerCase();
      for (const entry of VERIFIED_INSTITUTION_REGISTRY) {
        if (entry.aliases.some((alias) => indLower.includes(alias))) {
          matchedEntry = entry;
          break;
        }
      }
      if (matchedEntry) break;
    }
  }

  if (!matchedEntry) {
    return {
      matched: false,
    };
  }

  // Analyze discrepancies between observed message coordinates and the curated official coordinates
  const discrepancyNotes: string[] = [];

  for (const urlItem of urls) {
    const domainLower = urlItem.domain.toLowerCase();
    const isOfficialDomain = matchedEntry.domainMatches.some(
      (official) => domainLower === official || domainLower.endsWith(`.${official}`)
    );

    if (!isOfficialDomain) {
      discrepancyNotes.push(
        `The link in the message ("${urlItem.domain}") does NOT match ${matchedEntry.organizationName}'s official domain (${matchedEntry.officialPrimaryDomain}).`
      );
    }
  }

  // Return sanitized profile without internal matching helper fields
  const profile: VerifiedInstitutionProfile = {
    id: matchedEntry.id,
    organizationName: matchedEntry.organizationName,
    category: matchedEntry.category,
    jurisdiction: matchedEntry.jurisdiction,
    officialPrimaryDomain: matchedEntry.officialPrimaryDomain,
    officialLoginUrl: matchedEntry.officialLoginUrl,
    officialFraudHotline: matchedEntry.officialFraudHotline,
    officialFraudEmail: matchedEntry.officialFraudEmail,
    safeVerificationGuidance: matchedEntry.safeVerificationGuidance,
    verificationSource: matchedEntry.verificationSource,
  };

  const independentGuidance =
    `Do NOT click links or call numbers provided in the message. Independently access ${matchedEntry.organizationName} by typing https://${matchedEntry.officialPrimaryDomain} into your browser or opening their official mobile app.`;

  return {
    matched: true,
    institution: profile,
    claimedPretext: matchedEntry.organizationName,
    messageDiscrepancyNotes: discrepancyNotes.length > 0 ? discrepancyNotes : undefined,
    independentChannelGuidance: independentGuidance,
  };
}
