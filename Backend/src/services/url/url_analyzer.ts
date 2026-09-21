/**
 * URL & Domain Investigation Engine
 * 
 * Performs deep structural, syntactic, and deceptive pattern analysis on URLs
 * and domains discovered in investigated messages.
 * 
 * Features:
 * - URL and bare domain extraction with exact character offsets
 * - Canonical normalization and percent-encoding sanitization
 * - Punycode (IDN) and Cyrillic/Greek homoglyph domain detection
 * - Deep subdomain stacking analysis
 * - High-risk / spam-heavy TLD identification
 * - Brand keyword squatting in subdomains and hyphenated domains
 * - Bare IP address and port anomaly detection
 * - URL shortener detection
 */

import { IndicatorSeverity, ObservedIndicator } from '../../types.js';

export interface UrlSuspiciousFactor {
  code: string;
  label: string;
  severity: IndicatorSeverity;
  detail: string;
  whyItMatters: string;
}

export interface UrlAnalysisResult {
  rawUrl: string;
  normalizedUrl: string;
  hostname: string;
  registeredDomain: string;
  tld: string;
  subdomains: string[];
  characterRange: [number, number];
  isBareIp: boolean;
  isShortener: boolean;
  isPunycode: boolean;
  hasHomoglyph: boolean;
  decodedPunycode?: string;
  suspiciousFactors: UrlSuspiciousFactor[];
  riskScore: number; // 0 to 100
}

// Known legitimate primary brand domains
const LEGIT_BRAND_DOMAINS: Record<string, string[]> = {
  chase: ['chase.com', 'jpmorganchase.com'],
  paypal: ['paypal.com', 'paypal-community.com'],
  wellsfargo: ['wellsfargo.com'],
  bankofamerica: ['bankofamerica.com', 'bofa.com'],
  citi: ['citi.com', 'citigroup.com', 'citibank.com'],
  capitalone: ['capitalone.com'],
  apple: ['apple.com', 'icloud.com'],
  netflix: ['netflix.com'],
  usps: ['usps.com', 'uspspostalservice.com'],
  fedex: ['fedex.com'],
  ups: ['ups.com'],
  dhl: ['dhl.com'],
  amazon: ['amazon.com', 'amazon.co.uk', 'amazon.de', 'aws.amazon.com'],
  microsoft: ['microsoft.com', 'live.com', 'office.com', 'outlook.com'],
  google: ['google.com', 'gmail.com', 'youtube.com'],
  irs: ['irs.gov'],
};

// Known URL shorteners
const KNOWN_SHORTENERS = new Set([
  'bit.ly',
  'tinyurl.com',
  'is.gd',
  't.co',
  'ow.ly',
  'buff.ly',
  'cutt.ly',
  'rb.gy',
  'shorturl.at',
  'goo.gl',
  'tiny.cc',
  'rebrand.ly',
  'bl.ink',
  'qr.ae',
]);

// TLDs frequently abused in mass smishing and phishing campaigns
const HIGH_RISK_TLDS = new Set([
  'top',
  'xyz',
  'click',
  'buzz',
  'fit',
  'tk',
  'ml',
  'ga',
  'cf',
  'gq',
  'work',
  'rest',
  'country',
  'stream',
  'download',
  'racing',
  'win',
  'bid',
  'party',
  'date',
  'faith',
  'accountant',
  'review',
  'vip',
  'icu',
  'cam',
  'live',
]);

// Cyrillic and Greek characters commonly substituted into Latin domain names
const HOMOGLYPH_REGEX = /[\u0400-\u04FF\u0370-\u03FF]/;

/**
 * Extracts all URLs and web links with verbatim character ranges from input text
 */
export function extractUrlsWithRanges(text: string): Array<{ rawMatch: string; range: [number, number] }> {
  const matches: Array<{ rawMatch: string; range: [number, number] }> = [];

  // Match:
  // 1. Explicit protocol: https?://...
  // 2. www prefix: www.[a-z0-9-]+...
  // 3. Bare domains with known high-risk TLDs or common TLDs: [a-z0-9-]+\.(?:com|org|net|top|xyz|...)/...
  const urlRegex = /(?:https?:\/\/|www\.)[^\s<>"'{}|\\^`]+|(?:[a-zA-Z0-9-]+\.)+(?:com|org|net|edu|gov|io|co|top|xyz|click|buzz|fit|tk|info|biz|me|online|site|app|live)\b(?:\/[^\s<>"'{}|\\^`]*)?/gi;

  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(text)) !== null) {
    let rawMatch = match[0];
    let start = match.index;
    let end = start + rawMatch.length;

    // Clean trailing punctuation attached from natural sentences (. , ; ! ? ) ] } )
    while (rawMatch.length > 0 && /[.,;:!?)\]}>]$/.test(rawMatch)) {
      rawMatch = rawMatch.slice(0, -1);
      end--;
    }

    if (rawMatch.length >= 4) {
      matches.push({
        rawMatch,
        range: [start, end],
      });
    }
  }

  return matches;
}

/**
 * Extracts registered domain and subdomains from a hostname
 */
export function parseDomainParts(hostname: string): {
  subdomains: string[];
  registeredDomain: string;
  tld: string;
} {
  const cleanHost = hostname.toLowerCase().replace(/\.$/, '');
  const labels = cleanHost.split('.');

  if (labels.length <= 1) {
    return { subdomains: [], registeredDomain: cleanHost, tld: '' };
  }

  // Handle common two-part TLDs (e.g. .co.uk, .gov.uk, .com.au)
  const isTwoPartTld =
    labels.length >= 3 &&
    ['co', 'com', 'org', 'net', 'gov', 'edu', 'ac'].includes(labels[labels.length - 2]) &&
    labels[labels.length - 1].length === 2;

  if (isTwoPartTld && labels.length >= 3) {
    const tld = `${labels[labels.length - 2]}.${labels[labels.length - 1]}`;
    const sld = labels[labels.length - 3];
    const registeredDomain = `${sld}.${tld}`;
    const subdomains = labels.slice(0, labels.length - 3);
    return { subdomains, registeredDomain, tld };
  }

  const tld = labels[labels.length - 1];
  const sld = labels[labels.length - 2];
  const registeredDomain = `${sld}.${tld}`;
  const subdomains = labels.slice(0, labels.length - 2);

  return { subdomains, registeredDomain, tld };
}

/**
 * Performs comprehensive security inspection of an extracted URL
 */
export function analyzeUrl(rawUrl: string, range: [number, number]): UrlAnalysisResult {
  const factors: UrlSuspiciousFactor[] = [];
  let parsed: URL | null = null;

  const urlWithScheme = /^https?:\/\//i.test(rawUrl) ? rawUrl : `http://${rawUrl}`;

  try {
    parsed = new URL(urlWithScheme);
  } catch {
    // Malformed fallback
    return {
      rawUrl,
      normalizedUrl: rawUrl,
      hostname: rawUrl,
      registeredDomain: rawUrl,
      tld: '',
      subdomains: [],
      characterRange: range,
      isBareIp: false,
      isShortener: false,
      isPunycode: false,
      hasHomoglyph: false,
      suspiciousFactors: [
        {
          code: 'MALFORMED_URL_SYNTAX',
          label: 'Malformed URL Syntax',
          severity: 'HIGH',
          detail: 'The URL does not conform to standard URI RFC specifications.',
          whyItMatters: 'Scammers frequently craft malformed URLs to bypass automated security gateways.',
        },
      ],
      riskScore: 60,
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  const { subdomains, registeredDomain, tld } = parseDomainParts(hostname);

  // 1. Check for Bare IP address host
  const isBareIp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) || /^\[[a-f0-9:]+\]$/i.test(hostname);
  if (isBareIp) {
    factors.push({
      code: 'URL_BARE_IP',
      label: 'Bare IP Address Destination',
      severity: 'HIGH',
      detail: `The URL connects directly to a numeric IP address (${hostname}) rather than an established domain name.`,
      whyItMatters: 'Legitimate corporate platforms virtually never link customers to raw IP addresses. IP links bypass domain reputation tracking.',
    });
  }

  // 2. Check for URL shortener
  const isShortener = KNOWN_SHORTENERS.has(hostname) || KNOWN_SHORTENERS.has(registeredDomain);
  if (isShortener) {
    factors.push({
      code: 'URL_SHORTENER',
      label: 'URL Shortening / Redirection Service',
      severity: 'MEDIUM',
      detail: `The link uses a URL shortener (${hostname}) to conceal the final destination landing page.`,
      whyItMatters: 'Shorteners obscure destination domains, preventing recipients from inspecting the true domain before clicking.',
    });
  }

  // 3. Check for Punycode (IDN) and Homoglyphs
  const isPunycode = hostname.includes('xn--');
  const hasHomoglyph = HOMOGLYPH_REGEX.test(rawUrl);

  if (isPunycode || hasHomoglyph) {
    factors.push({
      code: 'URL_HOMOGLYPH_PUNYCODE',
      label: 'Lookalike Internationalized / Punycode Domain',
      severity: 'CRITICAL',
      detail: `The domain uses encoded Punycode or non-Latin alphabet characters (${hostname}) to visually spoof a well-known brand.`,
      whyItMatters: 'Internationalized Domain Name (IDN) homograph attacks swap Latin characters with visually identical Cyrillic or Greek characters to trick victims into believing they are visiting an authentic site.',
    });
  }

  // 4. Check for High-Risk TLD
  if (HIGH_RISK_TLDS.has(tld)) {
    factors.push({
      code: 'URL_HIGH_RISK_TLD',
      label: `High-Risk Top-Level Domain (.${tld})`,
      severity: 'HIGH',
      detail: `The domain uses the .${tld} top-level extension, which has a disproportionately high incidence of spam and phishing.`,
      whyItMatters: 'Disreputable or disposable TLDs offer inexpensive, automated domain registration with minimal anti-fraud verification.',
    });
  }

  // 5. Deep Subdomain Stacking
  if (subdomains.length >= 2) {
    factors.push({
      code: 'URL_SUBDOMAIN_STACKING',
      label: 'Excessive Multi-Level Subdomain Stacking',
      severity: 'HIGH',
      detail: `The URL stacks multiple subdomains (${subdomains.join('.')}.${registeredDomain}) to push the actual registered domain out of view.`,
      whyItMatters: 'On mobile screens, long subdomain chains cause the real destination domain to be truncated, creating the illusion of a genuine brand URL.',
    });
  }

  // 6. Brand Keyword Squatting & Impersonation in Domain / Subdomain
  const combinedHostText = `${subdomains.join('-')}-${registeredDomain}`.toLowerCase();
  for (const [brand, legitDomains] of Object.entries(LEGIT_BRAND_DOMAINS)) {
    if (combinedHostText.includes(brand)) {
      const isLegit = legitDomains.some((d) => registeredDomain === d || hostname.endsWith(`.${d}`));
      if (!isLegit) {
        factors.push({
          code: 'URL_BRAND_SPOOFING',
          label: `Deceptive Brand Impersonation (${brand.toUpperCase()})`,
          severity: 'CRITICAL',
          detail: `The URL incorporates the brand name "${brand}" in a deceptive domain or subdomain (${hostname}), but is NOT owned by ${legitDomains[0]}.`,
          whyItMatters: 'Embedding reputable brand names into lookalike domains is the primary method attackers use to trick users into trusting fake login and payment portals.',
        });
        break;
      }
    }
  }

  // 7. Embedded Credentials in URL
  if (parsed.username || parsed.password) {
    factors.push({
      code: 'URL_EMBEDDED_CREDENTIALS',
      label: 'Embedded Credentials / Userinfo Trick',
      severity: 'HIGH',
      detail: `The URL includes credentials preceding the host (e.g. ${parsed.username}@${hostname}).`,
      whyItMatters: 'Attackers embed simulated domain names before the "@" symbol to mislead users about the actual destination server.',
    });
  }

  // 8. Non-standard Web Port
  if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
    factors.push({
      code: 'URL_NON_STANDARD_PORT',
      label: `Non-Standard Web Port (:${parsed.port})`,
      severity: 'MEDIUM',
      detail: `The URL connects through port ${parsed.port} instead of standard web ports 80 or 443.`,
      whyItMatters: 'Non-standard ports are often used by temporary phishing servers or compromised residential infrastructure.',
    });
  }

  // 9. Phishing Query Parameter / Redirect Target
  if (parsed.search && (parsed.search.includes('redirect=') || parsed.search.includes('url=http') || parsed.search.includes('dest=http'))) {
    factors.push({
      code: 'URL_OPEN_REDIRECT_LURE',
      label: 'Open Redirect or Embedded Destination Target',
      severity: 'MEDIUM',
      detail: 'The URL includes a query parameter designed to redirect traffic to a secondary external destination.',
      whyItMatters: 'Open redirects allow scammers to use an initial reputable link to bypass scanners before bouncing victims to a malicious phishing landing page.',
    });
  }

  // Calculate structural risk score based on factors
  let riskScore = 0;
  for (const factor of factors) {
    switch (factor.severity) {
      case 'CRITICAL':
        riskScore += 45;
        break;
      case 'HIGH':
        riskScore += 30;
        break;
      case 'MEDIUM':
        riskScore += 15;
        break;
      case 'LOW':
        riskScore += 5;
        break;
    }
  }
  riskScore = Math.min(100, riskScore);

  return {
    rawUrl,
    normalizedUrl: parsed.toString(),
    hostname,
    registeredDomain,
    tld,
    subdomains,
    characterRange: range,
    isBareIp,
    isShortener,
    isPunycode,
    hasHomoglyph,
    decodedPunycode: isPunycode ? hostname : undefined,
    suspiciousFactors: factors,
    riskScore,
  };
}

/**
 * Analyzes all URLs in a piece of text and converts suspicious findings into
 * authoritative ObservedIndicator records for the deterministic detector.
 */
export function extractUrlIndicators(rawText: string): {
  urlResults: UrlAnalysisResult[];
  indicators: ObservedIndicator[];
} {
  const extracted = extractUrlsWithRanges(rawText);
  const urlResults: UrlAnalysisResult[] = [];
  const indicators: ObservedIndicator[] = [];

  for (const item of extracted) {
    const analysis = analyzeUrl(item.rawMatch, item.range);
    urlResults.push(analysis);

    for (const factor of analysis.suspiciousFactors) {
      indicators.push({
        id: `ind_url_${factor.code.toLowerCase()}_${item.range[0]}`,
        category: 'SUSPICIOUS_LINK',
        name: factor.label,
        severity: factor.severity,
        evidence: item.rawMatch,
        characterRange: item.range,
        explanation: factor.detail,
        whyItMatters: factor.whyItMatters,
        source: 'DETERMINISTIC',
      });
    }
  }

  return { urlResults, indicators };
}
