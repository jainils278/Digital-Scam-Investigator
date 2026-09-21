/**
 * Evidence-Grounded Cybersecurity Education Engine
 * 
 * Generates tailored educational briefings strictly grounded in the physical
 * indicators observed in the investigated artifact.
 * 
 * Teaches users the psychological persuasion mechanics, attacker playbooks,
 * and concrete rules of thumb to recognize similar attacks in the future.
 */

import { IndicatorCategory, ObservedIndicator } from '../../types.js';

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

const EDUCATIONAL_KNOWLEDGE_BASE: Record<
  IndicatorCategory,
  Omit<EducationalModule, 'id' | 'groundedInIndicatorId'>
> = {
  URGENCY_PRESSURE: {
    category: 'URGENCY_PRESSURE',
    title: 'Deconstructing Artificial Urgency',
    tacticName: 'Cognitive Overload & Panic Induction',
    psychologicalMechanism:
      'Human brains switch from deliberate analytical thinking to impulsive reactive behavior when exposed to imminent threats. Attackers impose artificial deadlines (e.g. "within 24 hours" or "immediate action required") to induce a state of acute anxiety where victims overlook obvious warning signs.',
    attackerPlaybook: [
      '1. Create acute time pressure ("Act now or face immediate suspension").',
      '2. Pair the deadline with a severe consequence (arrest, account freeze, legal action).',
      '3. Offer a simple, immediate exit path (click link, send code, call number) to resolve the crisis.',
    ],
    spottingTips: [
      'Look for short, arbitrary timeframes coupled with catastrophic threats.',
      'Notice high-pressure language: "FINAL NOTICE", "URGENT", "IMMEDIATELY".',
      'Remember that legitimate organizations allow reasonable time to respond to billing or account issues.',
    ],
    ruleOfThumb:
      'Legitimate institutions will never penalize you for taking 15 minutes to pause, breathe, and contact them through a known official phone number.',
    realWorldAnalogy:
      'Like high-pressure door-to-door sales tactics that insist a "special deal expires the moment you leave the room", urgency is designed to prevent second opinions.',
  },

  ACCOUNT_THREAT: {
    category: 'ACCOUNT_THREAT',
    title: 'The Account Suspension Playbook',
    tacticName: 'Loss of Access & Fear of Interruption',
    psychologicalMechanism:
      'Modern life depends heavily on digital accounts (banking, email, parcel delivery). Threatening to deactivate or freeze these accounts triggers an immediate fear of disruption and financial loss.',
    attackerPlaybook: [
      '1. Falsely alert recipient of unauthorized access or account suspension.',
      '2. Imply that inaction will lead to total loss of funds or permanent closure.',
      '3. Demand immediate identity "verification" to lift the supposed restriction.',
    ],
    spottingTips: [
      'Check whether the sender addresses you by your real full name or generic "Dear Customer".',
      'Do not click the provided link. Instead, independently navigate to the service app to check your account status.',
      'Real bank fraud alerts ask you to confirm a transaction ("Did you spend $45? Reply YES or NO"), not log in to enter passwords.',
    ],
    ruleOfThumb:
      'If your account is genuinely restricted, logging in through your usual bookmark or mobile app will display the same notice safely.',
    realWorldAnalogy:
      'Like an imposter claiming your car will be towed unless you give them your keys right now on the sidewalk.',
  },

  CREDENTIAL_HARVESTING: {
    category: 'CREDENTIAL_HARVESTING',
    title: 'How Real-Time One-Time Passcode (OTP) Relay Attacks Work',
    tacticName: 'Authentication Bypass & Session Takeover',
    psychologicalMechanism:
      'Victims often assume that one-time codes are routine verification tokens. In reality, an OTP is the final cryptographic barrier protecting their account.',
    attackerPlaybook: [
      '1. Attacker obtains your username/password or phone number from a previous data breach.',
      '2. Attacker initiates a real login or wire transfer on your bank\'s actual portal.',
      '3. The bank triggers an OTP to your phone.',
      '4. Attacker pretends to be the bank and asks you for the code to "cancel the fraud".',
      '5. You provide the OTP, and the attacker inputs it to complete the unauthorized transfer.',
    ],
    spottingTips: [
      'Read the actual SMS containing the OTP carefully; it usually states "DO NOT SHARE THIS CODE WITH ANYONE".',
      'Bank customer support representatives NEVER need your passcode or PIN to view your account.',
      'Any caller or message asking you to "read back the code" is an attacker executing an OTP interception attack.',
    ],
    ruleOfThumb:
      'Your OTP is the digital key to your account. Anyone asking you to share it is attempting to enter on your behalf.',
    realWorldAnalogy:
      'Like someone knocking on your front door saying they are building security, and asking you to unlock your deadbolt so they can check if your locks work.',
  },

  FINANCIAL_COERCION: {
    category: 'FINANCIAL_COERCION',
    title: 'Irreversible Payment Exploitation',
    tacticName: 'Unrecoverable Payment Extraction (Gift Cards & Crypto)',
    psychologicalMechanism:
      'Attackers steer victims away from credit cards and official bank transfers because standard financial channels have fraud reversal and chargeback protections.',
    attackerPlaybook: [
      '1. Fabricate an unexpected fee (customs clearance, unpaid taxes, computer repair fine).',
      '2. Insist on payment through gift cards (Apple, Target, Google Play) or Bitcoin ATM.',
      '3. Request photos of the gift card redemption codes or transfer to a crypto wallet address.',
      '4. Cash out the funds instantly across distributed international exchanges.',
    ],
    spottingTips: [
      'No legitimate company, tax agency (IRS), utility, or courier accepts retail gift cards as payment.',
      'Requests for wire transfers (Western Union) or cryptocurrency are permanent and cannot be refunded.',
      'Advance fees to release "lottery winnings" or "undelivered packages" are always fraudulent.',
    ],
    ruleOfThumb:
      'If someone asks you to pay a bill with gift cards or Bitcoin, it is 100% a scam without exception.',
    realWorldAnalogy:
      'Like a cashier at a grocery store asking you to pay for your milk with casino chips.',
  },

  IMPERSONATION: {
    category: 'IMPERSONATION',
    title: 'Brand & Authority Impersonation',
    tacticName: 'Transferred Authority & Pretexting',
    psychologicalMechanism:
      'Humans are conditioned to comply with recognized institutions (banks, postal services, government agencies). Attackers borrow this credibility by copying brand names and phrasing.',
    attackerPlaybook: [
      '1. Identify popular consumer services (USPS, Chase, Netflix, PayPal).',
      '2. Spoof the sender name or register a lookalike domain (e.g. usps-track-package.com).',
      '3. Send mass notifications expecting that a percentage of recipients actually use that service.',
    ],
    spottingTips: [
      'Look closely at the sender phone number or email address; official entities use shortcodes (e.g. 5-digit numbers) or authenticated corporate email domains.',
      'Inspect the full domain name before clicking.',
      'Notice impersonal greetings like "Dear Customer" instead of your actual name.',
    ],
    ruleOfThumb:
      'Trust your own navigation, not inbound prompts. Open a new browser tab and type the official URL yourself.',
    realWorldAnalogy:
      'Like a stranger wearing an unbranded fluorescent vest and hard hat claiming they need to inspect your jewelry.',
  },

  SUSPICIOUS_LINK: {
    category: 'SUSPICIOUS_LINK',
    title: 'Deconstruct Deceptive URLs & Phishing Domains',
    tacticName: 'Domain Lookalikes & Redirection Traps',
    psychologicalMechanism:
      'Attackers exploit mobile device interfaces that truncate long web addresses, betting that users will only read the first few words of a domain.',
    attackerPlaybook: [
      '1. Register lookalike domain using hyphenation (e.g. wellsfargo-verification.com) or cheap TLDs (.top, .xyz).',
      '2. Create an exact pixel-perfect clone of the official login page.',
      '3. Record entered credentials, session cookies, and 2FA tokens.',
    ],
    spottingTips: [
      'Identify the root domain: read backward from the first slash "/" to find the real registered domain.',
      'Watch out for bare numeric IP addresses (e.g. http://192.0.2.1/login).',
      'Beware of URL shorteners (bit.ly, tinyurl) in text messages claiming to be from official institutions.',
    ],
    ruleOfThumb:
      'A hyphenated domain like "chase-update.com" is NOT chase.com. Always verify the registered domain directly.',
    realWorldAnalogy:
      'Like a fake storefront erected overnight next to a real bank with a cardboard sign reading "ATM Relocated Inside".',
  },

  CHANNEL_DIVERSION: {
    category: 'CHANNEL_DIVERSION',
    title: 'Off-Platform Communication Diversion',
    tacticName: 'Moderation Evasion',
    psychologicalMechanism:
      'Attackers isolate victims by steering them away from marketplace or job platforms that have automated fraud detection and moderation.',
    attackerPlaybook: [
      '1. Contact victim on official platform (Upwork, LinkedIn, Facebook Marketplace).',
      '2. Quickly request moving communication to Telegram, WhatsApp, or personal email.',
      '3. Once off-platform, execute advance-fee fraud or fake check scams without platform oversight.',
    ],
    spottingTips: [
      'Legitimate employers and buyers conduct business and payments through the platform where you met.',
      'Be wary of recruiters who refuse voice/video calls or insist on text-only Telegram interviews.',
    ],
    ruleOfThumb:
      'Keep all interactions within the monitored platform where consumer protections and dispute resolution exist.',
    realWorldAnalogy:
      'Like a shop employee asking you to step into a dark alleyway to complete your transaction.',
  },

  PRIZE_LOTTERY: {
    category: 'PRIZE_LOTTERY',
    title: 'Windfall & Lottery Baiting',
    tacticName: 'Greed & Euphoria Exploitation',
    psychologicalMechanism:
      'The prospect of unexpected wealth creates excitement that lowers skepticism and prompts victims to comply with minor fee requests.',
    attackerPlaybook: [
      '1. Inform recipient they won a massive prize in a contest they never entered.',
      '2. Request personal identity documents to "verify eligibility".',
      '3. Demand payment for "administrative taxes" or "clearance fees" before the funds can be released.',
    ],
    spottingTips: [
      'You cannot win a contest or lottery you did not enter.',
      'Legitimate lotteries deduct taxes from winnings; they never ask winners to pay upfront fees.',
    ],
    ruleOfThumb:
      'Unsolicited prizes that require upfront fees are always advance-fee scams.',
    realWorldAnalogy:
      'Like receiving a letter claiming you won a new sports car, but you have to wire $500 for the keys.',
  },

  EMOTIONAL_MANIPULATION: {
    category: 'EMOTIONAL_MANIPULATION',
    title: 'Technical Evasion & Character Obfuscation',
    tacticName: 'Security Scanner Evasion',
    psychologicalMechanism:
      'Attackers modify text formatting to confuse automated spam filters while keeping the message visually readable to human victims.',
    attackerPlaybook: [
      '1. Insert zero-width spaces or Cyrillic homoglyphs into words like "p-a-y-p-a-l" or "v-e-r-i-f-y".',
      '2. Automated security gateways fail to recognize standard keywords.',
      '3. The human recipient reads the message normally and falls into the trap.',
    ],
    spottingTips: [
      'Be wary of messages with strange character spacing, mixed alphabets, or unusual punctuation inside words.',
    ],
    ruleOfThumb:
      'Legitimate corporate communications do not contain hidden Unicode characters or mixed foreign alphabets.',
    realWorldAnalogy:
      'Like a burglar using invisible spray to walk past an infrared motion detector.',
  },

  BENIGN_INDICATOR: {
    category: 'BENIGN_INDICATOR',
    title: 'General Cybersecurity Awareness',
    tacticName: 'Defensive Verification Habits',
    psychologicalMechanism: 'Proactive verification protects against zero-day social engineering.',
    attackerPlaybook: ['Maintain vigilance even when messages appear harmless.'],
    spottingTips: ['Verify unexpected communications through trusted independent channels.'],
    ruleOfThumb: 'When in doubt, verify before you click.',
    realWorldAnalogy: 'Like checking both ways before crossing a one-way street.',
  },
};

/**
 * Generates an evidence-grounded educational briefing tailored strictly
 * to the verified indicators detected in the investigation report.
 */
export function generateEvidenceEducation(
  observedIndicators: ObservedIndicator[]
): EducationBriefing {
  const categoriesPresent = new Set(observedIndicators.map((i) => i.category));
  const modules: EducationalModule[] = [];

  for (const category of categoriesPresent) {
    const template = EDUCATIONAL_KNOWLEDGE_BASE[category];
    if (template) {
      const matchingInd = observedIndicators.find((i) => i.category === category);
      modules.push({
        ...template,
        id: `edu_${category.toLowerCase()}`,
        groundedInIndicatorId: matchingInd ? matchingInd.id : 'unknown',
      });
    }
  }

  // General defensive habits
  const generalHygieneAdvice = [
    'Always navigate to banking and retail websites directly through your own bookmarks or official mobile apps, never via text message links.',
    'Enable multi-factor authentication (MFA) using an authenticator app (like Google Authenticator or hardware security keys) rather than SMS where possible.',
    'Treat all unexpected inbound urgent requests as unverified until independently confirmed.',
  ];

  let summary = '';
  if (modules.length > 0) {
    summary = `This educational briefing breaks down the ${modules.length} specific persuasion tactic${
      modules.length === 1 ? '' : 's'
    } detected in the investigated message. Review the attacker playbook and rules of thumb below to recognize similar manipulation in the future.`;
  } else {
    summary =
      'No scam manipulation tactics were detected in this message. Practice general cybersecurity hygiene by verifying unexpected financial or account claims independently.';
  }

  return {
    modules,
    generalHygieneAdvice,
    summary,
  };
}
