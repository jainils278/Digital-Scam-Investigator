/**
 * Deterministic Detection Engine
 * 
 * Authoritative source of truth for observed physical evidence.
 * Operates on normalized text while preserving exact character offsets into the user's raw text.
 * 
 * Implements contextual, combinatorial pattern matching rather than simple isolated keywords,
 * minimizing false positives for benign messages.
 */

import { IndicatorCategory, IndicatorSeverity, ObservedIndicator } from '../types.js';
import { NormalizedResult, mapNormalizedRangeToRaw } from './normalizer.js';
import { extractUrlIndicators } from './url/url_analyzer.js';

interface RuleDefinition {
  id: string;
  category: IndicatorCategory;
  name: string;
  severity: IndicatorSeverity;
  pattern: RegExp;
  explanation: string;
  whyItMatters: string;
}

// Rules ordered with precision-first patterns
const RULES: RuleDefinition[] = [
  // --- CREDENTIAL & AUTHENTICATION HARVESTING ---
  {
    id: 'ind_cred_otp',
    category: 'CREDENTIAL_HARVESTING',
    name: 'Direct One-Time Passcode (OTP) / PIN / Credential Solicitation',
    severity: 'CRITICAL',
    pattern: /(?:send(?:ing)?|share|sharing|reply\s+with|provide|providing|enter(?:ing)?|confirm(?:ing)?|submit(?:ting)?|input|type)\s+(?:your|the)?\s*(?:(?:upi|login|account|security|secret|portal)\s+)*(?:otp|one[-\s]time[-\s]passcode|one[-\s]time[-\s]password|2fa\s*code|two[-\s]factor\s*code|verification\s*code|security\s*code|pin|secret\s*pin|password|passcode|credentials)/i,
    explanation: 'The message explicitly demands a one-time passcode (OTP), PIN, password, or security credential.',
    whyItMatters: 'Do not disclose a one-time passcode to someone who asks you to provide it. Unexpected OTP requests should be treated as a serious warning sign and independently verified through an official channel.',
  },
  {
    id: 'ind_cred_multi_harvest',
    category: 'CREDENTIAL_HARVESTING',
    name: 'Compound Financial & Credential Harvesting Request',
    severity: 'CRITICAL',
    pattern: /(?:(?:card\s*number|card\s*details|cvv)\s*(?:and|,)\s*(?:otp|pin|password)|(?:otp|pin)\s*(?:and|,)\s*(?:card\s*number|cvv))/i,
    explanation: 'The message solicits multiple high-risk credential and payment card elements simultaneously.',
    whyItMatters: 'Bundled requests for passwords, card numbers, and one-time passcodes indicate broad credential harvesting portals.',
  },
  {
    id: 'ind_cred_login_lure',
    category: 'CREDENTIAL_HARVESTING',
    name: 'Urgent Credential Verification Lure',
    severity: 'HIGH',
    pattern: /(?:log[-\s]?in|sign[-\s]?in)\s+(?:immediately\s+to\s+verify|here\s+to\s+unlock|to\s+prevent\s+closure|to\s+confirm\s+identity)/i,
    explanation: 'The message instructs the recipient to immediately log in via an external trigger to maintain access.',
    whyItMatters: 'Phishing attacks rely on urgent calls to log in, directing victims to spoofed replica portals that harvest credentials.',
  },
  {
    id: 'ind_cred_card_extract',
    category: 'CREDENTIAL_HARVESTING',
    name: 'Solicitation of Gift Card or Payment Card Numbers',
    severity: 'HIGH',
    pattern: /(?:send|share|provide|enter)\s+(?:us\s+)?(?:the\s+)?(?:card\s+numbers?|pin\s+numbers?|card\s+digits?)\s+immediately/i,
    explanation: 'The sender requests immediate transmission of card numbers or PINs.',
    whyItMatters: 'Demanding card numbers or gift card redemption codes extracts immediate, irreversible value.',
  },

  // --- FINANCIAL COERCION & IRREVERSIBLE PAYMENTS ---
  {
    id: 'ind_fin_gift_cards',
    category: 'FINANCIAL_COERCION',
    name: 'Demand for Gift Card Payment',
    severity: 'CRITICAL',
    pattern: /(?:buy|purchase|send|pay\s+with|payment\s+via)\s+(?:[₹$€£]?\s*\d+[\d,]*\s+(?:in\s+|worth\s+of\s+)?)*(?:apple\s*gift\s*cards?|google\s*play\s*cards?|steam\s*cards?|gift\s*cards?|vanilla\s*visa|target\s*gift\s*card)/i,
    explanation: 'The sender requests payment or verification via retail gift cards.',
    whyItMatters: 'No legitimate government agency, utility, or business accepts gift cards as payment. Gift cards are untraceable and non-refundable, making them a hallmark of advance-fee and extortion scams.',
  },
  {
    id: 'ind_fin_crypto',
    category: 'FINANCIAL_COERCION',
    name: 'Cryptocurrency Transfer / Wallet Demand',
    severity: 'HIGH',
    pattern: /\b(?:bitcoin|btc|ethereum|crypto\s*wallet|usdt|wire\s*transfer|western\s*union|moneygram)\b(?:\s+(?:address|to\s*claim|immediately|deposit|transfer|wallet))?|\beth\b(?:\s+(?:address|wallet|transfer|deposit|to\s+claim)|\s*:\s*0x[a-fA-F0-9]{40})|\b(?:send|transfer|pay|deposit)\s+(?:[₹$€£]?\s*\d+(?:\.\d+)?\s+)?\beth\b/i,
    explanation: 'The communication solicits funds through irreversible cryptocurrency transfers or wire services.',
    whyItMatters: 'Cryptocurrency transactions cannot be reversed or frozen once broadcast, preventing victims from recovering funds once fraudulent intent is discovered.',
  },
  {
    id: 'ind_fin_secure_funds',
    category: 'FINANCIAL_COERCION',
    name: 'Urgent Fund Protection / Securing Pretext',
    severity: 'HIGH',
    pattern: /(?:secure\s+your\s+funds|protect\s+your\s+(?:balance|funds|money))/i,
    explanation: 'The communication urges the recipient to take immediate action to "secure" or "protect" their funds.',
    whyItMatters: 'Scammers instruct victims to transfer funds or call fraudulent numbers under the false pretense of protecting their bank balance.',
  },
  {
    id: 'ind_fin_investment_solicitation',
    category: 'FINANCIAL_COERCION',
    name: 'High-Yield Investment Opportunity Solicitation',
    severity: 'HIGH',
    pattern: /(?:exclusive\s+investment\s+opportunity|invest\s+[₹$€£]?\d+[\d,]*\s+(?:today|now))/i,
    explanation: 'The communication solicits upfront investment funds under the pretext of an exclusive opportunity.',
    whyItMatters: 'Unsolicited investment offers promising rapid returns are standard vectors for advance-fee investment fraud.',
  },
  {
    id: 'ind_fin_refund_lure',
    category: 'FINANCIAL_COERCION',
    name: 'Refund Enticement / Cancellation Refund Lure',
    severity: 'HIGH',
    pattern: /(?:receive|claim|get)\s+(?:your\s+)?refund\b/i,
    explanation: 'The message promises a refund to lure the recipient into responding or contacting support.',
    whyItMatters: 'Scammers use the promise of a refund to manipulate victims into calling fraudulent numbers or entering banking credentials.',
  },
  {
    id: 'ind_fin_advance_fee',
    category: 'FINANCIAL_COERCION',
    name: 'Advance Clearance / Redelivery / Registration Fee Request',
    severity: 'HIGH',
    pattern: /(?:pay\s+[₹$€£]?\s*\d+[\d,]*(?:\.\d{2})?\s+(?:redelivery|delivery|reschedule|registration|processing|application|clearance|onboarding)\s*(?:fee|charges?)|(?:processing|clearance|release|activation|redelivery|reschedule|registration)\s*(?:fee|charges?)|delivery\s*(?:fee|charges?)\s*(?:of|is)?\s*[₹$€£]?\s*\d+(?:\.\d{2})?)/i,
    explanation: 'The message demands an upfront processing, registration, or delivery fee before funds, packages, or winnings can be released.',
    whyItMatters: 'Advance-fee scams fabricate small administrative hurdles to extract money from victims before vanishing.',
  },
  {
    id: 'ind_fin_investment_fraud',
    category: 'FINANCIAL_COERCION',
    name: 'Guaranteed Investment / High-Yield Return Lure',
    severity: 'HIGH',
    pattern: /(?:guaranteed\s+(?:returns?|profit|daily\s*income)(?:\s+of\s+[₹$€£]?\d+[\d,]*)?|(?:100%|risk[-\s]free|double\s+your\s+money)\s+(?:returns?|profit|investment)|receive\s+guaranteed\s+(?:returns?|profit)(?:\s+of\s+[₹$€£]?\d+[\d,]*)?)/i,
    explanation: 'The message promises guaranteed or unrealistic financial returns on upfront capital investments.',
    whyItMatters: 'No legitimate investment can guarantee risk-free returns. High-yield investment fraud relies on unrealistic promises to lure capital.',
  },
  {
    id: 'ind_fin_fake_invoice',
    category: 'FINANCIAL_COERCION',
    name: 'Automatic Renewal / Unauthorized Subscription Charge',
    severity: 'HIGH',
    pattern: /(?:automatically\s+renew\s+for\s+[₹$€£]?\d|subscription\s+(?:has\s+been|will\s+be)\s+renewed\s+for\s+[₹$€£]?\d|charged\s+[₹$€£]\s*\d[\d,]*(?:\.\d{2})?\s+for\s+your\s+(?:renewal|subscription))/i,
    explanation: 'The message fabricates an impending or processed subscription renewal charge to induce panic.',
    whyItMatters: 'Reverse invoice scams falsely claim large impending renewal charges to trick victims into calling fraudulent support centers.',
  },
  {
    id: 'ind_fin_toll_debt',
    category: 'FINANCIAL_COERCION',
    name: 'Outstanding Highway Toll / Transit Debt Notice',
    severity: 'HIGH',
    pattern: /(?:outstanding\s+(?:highway\s+)?toll|unpaid\s+toll\s+(?:invoice|bill|balance)|toll\s+balance\s+due)/i,
    explanation: 'The message asserts an unpaid toll road fee or transit penalty requiring immediate payment.',
    whyItMatters: 'Smishing campaigns impersonating highway and road toll authorities use nominal debts to trick drivers into entering payment information on phishing sites.',
  },
  {
    id: 'ind_fin_immediate_transfer',
    category: 'FINANCIAL_COERCION',
    name: 'Immediate Financial Transfer / UPI Payment Demand',
    severity: 'HIGH',
    pattern: /(?:transfer|send|pay)\s+[₹$€£]?\s*\d[\d,]*(?:\.\d{2})?\s+(?:immediately|urgently|to\s+this\s+upi)/i,
    explanation: 'The message demands an immediate money transfer or UPI payment.',
    whyItMatters: 'Urgent payment demands bypass standard verification procedures to extract unrecoverable funds.',
  },

  // --- ACCOUNT DISRUPTION & INTIMIDATION ---
  {
    id: 'ind_threat_suspension',
    category: 'ACCOUNT_THREAT',
    name: 'Account / Service Suspension or Disconnection Threat',
    severity: 'HIGH',
    pattern: /(?:(?:account|pan|card|access|service|profile)\s*(?:has\s*been|is|will\s*be)\s*(?:suspended|blocked|frozen|terminated|restricted|locked|deactivated|closed)|access\s*will\s*be\s*revoked|prevent\s+account\s+closure)/i,
    explanation: 'The message threatens imminent restriction, suspension, or closure of an account or service.',
    whyItMatters: 'Threatening account access creates an acute sense of anxiety, rushing victims into reacting impulsively before verifying sender authenticity.',
  },
  {
    id: 'ind_threat_utility_shutoff',
    category: 'ACCOUNT_THREAT',
    name: 'Essential Utility Disconnection Threat',
    severity: 'HIGH',
    pattern: /(?:electricity|power|water|gas)\s*(?:supply|connection|service)?\s*(?:will\s*be\s*(?:disconnected|shut\s*off|cut\s*off|terminated)|disconnection)/i,
    explanation: 'The communication threatens disconnection of residential or commercial electricity, power, or utility service.',
    whyItMatters: 'Threatening essential utilities exploits acute domestic fear to rush victims into making unverified payments.',
  },
  {
    id: 'ind_threat_compromise',
    category: 'ACCOUNT_THREAT',
    name: 'Compromised Account Intimidation Claim',
    severity: 'HIGH',
    pattern: /(?:account\s+(?:has\s+been|is)\s+compromised|detected\s+suspicious\s+activity\s+on\s+your\s+account)/i,
    explanation: 'The communication claims the recipient\'s account has been breached or compromised.',
    whyItMatters: 'Scammers falsely claim an account is already compromised to justify unusual "protective" requests like purchasing gift cards or providing credentials.',
  },
  {
    id: 'ind_threat_legal',
    category: 'ACCOUNT_THREAT',
    name: 'Legal Coercion / Law Enforcement Threat',
    severity: 'CRITICAL',
    pattern: /(?:arrest\s*warrant|law\s*enforcement|fbi\s*agent|irs\s*penalt|legal\s*action\s*(?:will\s*be\s*taken|pending)|avoid\s+legal\s+action|court\s*summons|police\s*department)/i,
    explanation: 'The sender leverages the threat of criminal prosecution, arrest, or severe legal penalties.',
    whyItMatters: 'Impersonating law enforcement or tax authorities to threaten immediate arrest is an aggressive coercion tactic used to terrorize victims into submission.',
  },

  // --- URGENCY & ARTIFICIAL DEADLINES ---
  {
    id: 'ind_urg_consequence',
    category: 'URGENCY_PRESSURE',
    name: 'Artificial Deadline with Negative Consequence',
    severity: 'HIGH',
    pattern: /(?:within\s+\d+\s*(?:hours?|hrs?|minutes?|mins?|days?)|before\s+end\s+of\s+day|by\s+midnight)\s+(?:to\s+(?:avoid|prevent|receive|claim)|or|otherwise)\s*(?:your\s+account\s+will|legal\s+action|service\s+will|you\s+will\s+be|funds\s+will\s+be|additional\s+penalt(?:y|ies)?|the\s+refund)?/i,
    explanation: 'The message couples an artificial deadline directly with a severe penalty or action requirement.',
    whyItMatters: 'Imposing strict, short deadlines prevents victims from seeking second opinions or contacting official customer support.',
  },
  {
    id: 'ind_urg_immediate_call',
    category: 'URGENCY_PRESSURE',
    name: 'Urgent Call-To-Action Pressure',
    severity: 'MEDIUM',
    pattern: /(?:urgent[:!]|act\s+now|respond\s+immediately|immediate\s+action\s+required|urgent\s+attention\s+required|final\s+(?:warning|notice)|last\s+notice|action\s+required\s+immediately)/i,
    explanation: 'The message employs high-pressure urgency cues demanding immediate response.',
    whyItMatters: 'Artificial urgency bypasses rational scrutiny, prompting victims to overlook suspicious indicators such as unusual sender addresses or strange domain names.',
  },
  {
    id: 'ind_urg_deadline_action',
    category: 'URGENCY_PRESSURE',
    name: 'Urgent Same-Day Rescheduling / Action Deadline',
    severity: 'MEDIUM',
    pattern: /(?:today\s+to\s+(?:reschedule|claim|avoid|cancel|prevent)|reschedule\s+delivery\s*:\s*https?:\/\/)/i,
    explanation: 'The message imposes a same-day deadline to reschedule delivery or claim funds.',
    whyItMatters: 'Artificial deadlines induce rushed compliance before victims can verify claims through official delivery channels.',
  },
  {
    id: 'ind_urg_scarcity',
    category: 'URGENCY_PRESSURE',
    name: 'Artificial Scarcity Pressure',
    severity: 'HIGH',
    pattern: /(?:limited\s+(?:slots?|seats?|spots?|time\s*offer)|few\s+slots?\s+left)/i,
    explanation: 'The message uses artificial scarcity cues to pressure immediate compliance.',
    whyItMatters: 'Scarcity pressure prevents victims from deliberating or seeking independent financial advice.',
  },
  {
    id: 'ind_urg_pay_immediate',
    category: 'FINANCIAL_COERCION',
    name: 'Immediate Bill / Debt Settlement Demand',
    severity: 'HIGH',
    pattern: /(?:pay|settle)\s+(?:your\s+)?(?:outstanding\s+bill|due[s]?|bill)\s+immediately/i,
    explanation: 'The message demands immediate payment of an allegedly outstanding utility or service bill.',
    whyItMatters: 'Combining immediate payment commands with essential services forces victims into hasty transfers without verification.',
  },
  {
    id: 'ind_lure_reverse_call',
    category: 'URGENCY_PRESSURE',
    name: 'Urgent Reverse Phone Call Lure',
    severity: 'HIGH',
    pattern: /(?:call|contact)\s+(?:\+?\d[\d\s-]{6,}\d\s+)?(?:immediately|urgently)\b/i,
    explanation: 'The message instructs the recipient to immediately call a provided phone number under the pretext of fraud prevention or cancellation.',
    whyItMatters: 'Reverse phone lures direct victims to fraudulent call centers where scammers impersonating bank agents coerce them into transferring funds or handing over credentials.',
  },

  // --- PRIZE, LOTTERY & RECRUITMENT LURES ---
  {
    id: 'ind_prize_win',
    category: 'PRIZE_LOTTERY',
    name: 'Unsolicited Prize / Selection Win Claim',
    severity: 'HIGH',
    pattern: /(?:congratulations!?|selected\s+as\s+(?:a|the)?\s*winner|claim\s+your\s+(?:\$?\d[\d,]*|prize|reward|grant|unclaimed\s*funds))/i,
    explanation: 'The message claims the recipient has won a contest, lottery, or has been selected for an unsolicited reward.',
    whyItMatters: 'Unsolicited prize or selection notifications exploit excitement to lure victims into paying fees or handing over personal information.',
  },
  {
    id: 'ind_lure_job',
    category: 'PRIZE_LOTTERY',
    name: 'Unsolicited Work-From-Home / Recruitment Lure',
    severity: 'HIGH',
    pattern: /(?:selected\s+for\s+(?:a\s+)?(?:work[-\s]from[-\s]home|remote\s*job|online\s*job)|work[-\s]from[-\s]home\s+position\s+paying\s+[₹$€£]?\d)/i,
    explanation: 'The message offers an unsolicited, lucrative remote or work-from-home employment opportunity.',
    whyItMatters: 'Work-from-home scams use promises of high, easy income to extract upfront registration fees or recruit victims as money mules.',
  },

  // --- IMPERSONATION SIGNATURES ---
  {
    id: 'ind_imp_authority',
    category: 'IMPERSONATION',
    name: 'Tax Authority / Government Department Notice',
    severity: 'HIGH',
    pattern: /(?:income\s*tax\s*(?:department|office|dept)|tax\s*department|internal\s*revenue\s*service|irs|enforcement\s*directorate)\s*(?:notice|alert|summons)?/i,
    explanation: 'The message claims to be an official notification or summons from a tax or government authority.',
    whyItMatters: 'Tax authority impersonation intimidates recipients by manufacturing false accusations of unpaid dues and legal repercussions.',
  },
  {
    id: 'ind_imp_tx_alert',
    category: 'IMPERSONATION',
    name: 'Unverified Transaction Attempt Alert',
    severity: 'HIGH',
    pattern: /(?:(?:transaction|charge|debit)\s+(?:was\s+)?attempted|unauthorized\s+(?:transaction|charge|debit|activity|transfer))\s*(?:on\s+your\s+account)?/i,
    explanation: 'The message claims an unauthorized transaction was attempted on the recipient\'s account.',
    whyItMatters: 'Fabricated transaction alerts generate immediate panic regarding account security, prompting impulsive calls to fraudulent support numbers.',
  },
  {
    id: 'ind_imp_authority_internal',
    category: 'IMPERSONATION',
    name: 'Security Team / Support Impersonation',
    severity: 'HIGH',
    pattern: /(?:this\s+is\s+(?:the\s+)?(?:security\s*team|fraud\s*department|it\s*helpdesk|support\s*team|bank\s*manager))/i,
    explanation: 'The sender claims to be from the internal security or fraud team.',
    whyItMatters: 'Impersonating internal security personnel builds rapid false trust to solicit passwords or authorization tokens.',
  },
  {
    id: 'ind_imp_bank',
    category: 'IMPERSONATION',
    name: 'Financial Institution / Fraud Alert Impersonation',
    severity: 'HIGH',
    pattern: /(?:wells\s*fargo|chase\s*bank|bank\s*of\s*america|citibank|paypal|venmo|capital\s*one)[:\s-]+(?:security\s*alert|fraud\s*alert|unauthorized\s*activity|notice|alert)/i,
    explanation: 'The message mimics official fraud or security alerts from major financial institutions.',
    whyItMatters: 'Financial impersonation leverages established consumer trust to induce panic regarding unauthorized charges.',
  },
  {
    id: 'ind_imp_delivery',
    category: 'IMPERSONATION',
    name: 'Courier / Postal Delivery Problem Impersonation',
    severity: 'HIGH',
    pattern: /(?:usps|ups|fedex|dhl|postal\s*service)[:\s-]+(?:package|tracking|delivery\s*notice|delivery\s*failure|redelivery|customs\s*fee|parcel\s*on\s*hold|address\s*incomplete)/i,
    explanation: 'The communication mimics delivery notifications from parcel couriers claiming delivery failure.',
    whyItMatters: 'Package delivery scams (smishing) take advantage of routine online shopping habits to trick people into clicking phishing links and entering card details.',
  },

  // --- COMMUNICATION DIVERSION & EMOTIONAL MANIPULATION ---
  {
    id: 'ind_div_channel',
    category: 'CHANNEL_DIVERSION',
    name: 'Off-Platform Communication Diversion',
    severity: 'HIGH',
    pattern: /(?:contact|message|reach)\s+(?:our\s*(?:agent|recruiter|hr|manager|team)|my\s*(?:manager|hr))\s+on\s+(?:whatsapp|telegram|signal|viber)|(?:telegram|whatsapp|signal)\s*(?:username|number|link|group|channel)\s*:\s*[@+\w]/i,
    explanation: 'The sender insists on shifting communication from the original platform to encrypted messaging apps like Telegram or WhatsApp.',
    whyItMatters: 'Scammers divert victims to private messaging platforms to evade platform fraud monitoring, moderation, and automated account bans.',
  },
  {
    id: 'ind_div_call_restriction',
    category: 'CHANNEL_DIVERSION',
    name: 'Communication / Phone Call Avoidance Pretext',
    severity: 'HIGH',
    pattern: /(?:don't\s+call|do\s+not\s+call)\s+(?:me\s+)?(?:right\s+now|at\s+the\s+moment)|(?:phone\s+(?:isn't|is\s+not)\s+working|cannot\s+(?:take|answer)\s+calls)/i,
    explanation: 'The sender explicitly instructs the recipient not to place phone calls, citing technical difficulties.',
    whyItMatters: 'Imposters fabricating an emergency insist on text-only communication to prevent the victim from hearing their actual voice.',
  },
  {
    id: 'ind_lure_emergency_money',
    category: 'EMOTIONAL_MANIPULATION',
    name: 'Urgent Distress / Emergency Money Solicitation',
    severity: 'HIGH',
    pattern: /(?:need\s+money\s+urgently|stuck\s+and\s+need\s+money|emergency\s+(?:funds|cash)\s+needed)/i,
    explanation: 'The sender claims to be stranded or in an emergency needing urgent financial assistance.',
    whyItMatters: 'Impersonating friends or family members in sudden distress exploits emotional empathy to bypass financial verification.',
  },

  // --- SUSPICIOUS LINK SYNTAXES ---
  {
    id: 'ind_link_ip',
    category: 'SUSPICIOUS_LINK',
    name: 'Bare IP Address URL',
    severity: 'HIGH',
    pattern: /(?:https?:\/\/)?\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?(?:\/[^\s]*)?/i,
    explanation: 'The text contains a direct numeric IP address instead of an authenticated domain name.',
    whyItMatters: 'Legitimate services rarely share bare IP addresses with consumers. Scammers use them to bypass domain registration checks and domain-based reputation filters.',
  },
  {
    id: 'ind_link_spoofed_keyword',
    category: 'SUSPICIOUS_LINK',
    name: 'Hyphenated Lookalike Phishing Domain Pattern',
    severity: 'HIGH',
    pattern: /(?:https?:\/\/)?(?:[a-z0-9-]+\.)?(?:usps-redelivery|chase-secure|paypal-verify|wellsfargo-login|fedex-tracking|apple-support-id|netflix-update|refund-confirm|delivery-update|electricity-help|toll-payment|verify-account|account-update|login-verify)[a-z0-9-]*\.[a-z]{2,}/i,
    explanation: 'The link features a hyphenated brand lookalike or deceptive action domain designed to masquerade as an official portal.',
    whyItMatters: 'Typosquatting and hyphenated deceptive domains are deliberately registered to deceive users on mobile devices where full URLs may be truncated.',
  },
];

/**
 * Runs deterministic indicator detection against the normalized input.
 * Extracts verbatim substrings from the original rawText using the index map.
 */
export function detectIndicators(normalizedResult: NormalizedResult): ObservedIndicator[] {
  const { rawText, normalizedText, indexMap, hasZeroWidthCharacters, hasHomoglyphs } = normalizedResult;
  const indicators: ObservedIndicator[] = [];
  const matchedRanges: Array<[number, number]> = [];

  // Helper to check for overlapping ranges
  const isOverlapping = (start: number, end: number): boolean => {
    return matchedRanges.some(
      ([mStart, mEnd]) => Math.max(start, mStart) < Math.min(end, mEnd)
    );
  };

  // 1. Check for evasion techniques (Zero-width characters / Homoglyphs)
  if (hasZeroWidthCharacters) {
    indicators.push({
      id: 'ind_evasion_zerowidth',
      category: 'EMOTIONAL_MANIPULATION',
      name: 'Hidden Zero-Width Unicode Characters Detected',
      severity: 'HIGH',
      evidence: '[Invisible Unicode / Zero-Width Space Characters]',
      characterRange: [0, rawText.length],
      explanation: 'The text contains hidden, non-rendering zero-width Unicode characters embedded within words.',
      whyItMatters: 'Cybercriminals insert invisible characters between letters to break automated keyword scanners and spam filters while keeping text readable to humans.',
      source: 'DETERMINISTIC',
    });
  }

  if (hasHomoglyphs) {
    indicators.push({
      id: 'ind_evasion_homoglyph',
      category: 'EMOTIONAL_MANIPULATION',
      name: 'Confusable Homoglyph Characters Detected',
      severity: 'HIGH',
      evidence: '[Cyrillic/Greek Alphabet Lookalike Characters Substitutions]',
      characterRange: [0, rawText.length],
      explanation: 'The text substitutes standard Latin characters with identical-looking Cyrillic or Greek homoglyphs.',
      whyItMatters: 'Homoglyph substitution (e.g. replacing Latin "a" with Cyrillic "а") is used in advanced phishing to fool security filters and masquerade as legitimate brand names.',
      source: 'DETERMINISTIC',
    });
  }

  // 2. Iterate through deterministic pattern rules
  for (const rule of RULES) {
    // Create global copy of regex to find all matches
    const globalRegex = new RegExp(rule.pattern.source, rule.pattern.flags.includes('g') ? rule.pattern.flags : rule.pattern.flags + 'g');
    let match: RegExpExecArray | null;

    while ((match = globalRegex.exec(normalizedText)) !== null) {
      const normStart = match.index;
      const normEnd = match.index + match[0].length;

      // Defensive Advisory Guard: Check if preceding text contains negative/educational phrasing
      // (e.g. "Never share your OTP", "Scammers often ask to provide passwords")
      if (
        rule.category === 'CREDENTIAL_HARVESTING' ||
        rule.category === 'FINANCIAL_COERCION' ||
        rule.category === 'ACCOUNT_THREAT'
      ) {
        const precedingSlice = normalizedText.slice(Math.max(0, normStart - 65), normStart).toLowerCase();
        const hasNegationOrDefensiveContext = /(?:never|do\s+not|don't|should\s+not|refuse\s+to|beware\s+of|caution|scammers?\s+(?:often\s+)?(?:ask|request|try|demand|instruct)|fake\s+messages?\s+(?:often\s+)?ask)\s+[^.!?\n]*$/i.test(precedingSlice);
        if (hasNegationOrDefensiveContext) {
          continue; // Legitimate defensive warning or educational context; do not flag as attack demand
        }
      }

      // Map back to verbatim raw text range
      const [rawStart, rawEnd] = mapNormalizedRangeToRaw(normStart, normEnd, indexMap, rawText.length);
      const verbatimEvidence = rawText.slice(rawStart, rawEnd);

      // Avoid redundant duplicate or highly overlapping indicators from the same rule
      if (verbatimEvidence.trim().length > 0 && !isOverlapping(rawStart, rawEnd)) {
        indicators.push({
          id: `${rule.id}_${rawStart}`,
          category: rule.category,
          name: rule.name,
          severity: rule.severity,
          evidence: verbatimEvidence,
          characterRange: [rawStart, rawEnd],
          explanation: rule.explanation,
          whyItMatters: rule.whyItMatters,
          source: 'DETERMINISTIC',
        });
        matchedRanges.push([rawStart, rawEnd]);
      }
    }
  }

  // 3. Extract and inspect URLs/domains with structural risk and exact character offsets
  const { indicators: urlIndicators } = extractUrlIndicators(rawText);
  for (const urlInd of urlIndicators) {
    const [start, end] = urlInd.characterRange;
    if (!isOverlapping(start, end)) {
      indicators.push(urlInd);
      matchedRanges.push([start, end]);
    }
  }

  return indicators;
}
