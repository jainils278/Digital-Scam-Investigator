/**
 * Defensive Recommendation Engine
 * 
 * Generates tailored, prioritized, and context-specific defensive protocols
 * based on verified indicators and risk level.
 */

import { DefensiveAction, ObservedIndicator, RiskLevel } from '../types.js';

export function generateDefensiveRecommendations(
  verifiedIndicators: ObservedIndicator[],
  riskLevel: RiskLevel,
  messageType: string
): DefensiveAction[] {
  const actions: DefensiveAction[] = [];
  const categories = new Set(verifiedIndicators.map((i) => i.category));

  if (riskLevel === 'BENIGN') {
    actions.push({
      id: 'rec_benign_hygiene',
      priority: 'RECOMMENDED',
      action: 'Standard Defensive Vigilance',
      detail:
        'No known suspicious indicators were detected in this message. Continue routine vigilance; never disclose passcodes or make unexpected payments without verifying through official channels.',
      category: 'General Hygiene',
    });
    return actions;
  }

  // 1. Credential Harvesting Mitigations
  if (categories.has('CREDENTIAL_HARVESTING')) {
    actions.push({
      id: 'rec_cred_never_share',
      priority: 'IMMEDIATE',
      action: 'Do NOT Disclose OTPs, Passwords, or PINs',
      detail:
        'Do not disclose a one-time passcode to someone who asks you to provide it. Unexpected OTP requests should be treated as a serious warning sign and independently verified through an official channel.',
      category: 'Credential Security',
    });
    actions.push({
      id: 'rec_cred_incident_response',
      priority: 'HIGH',
      action: 'Rotate Passwords Immediately If Compromised',
      detail:
        'If you already entered or sent credentials to this sender, immediately visit the official service, change your password, and terminate all active login sessions.',
      category: 'Incident Response',
    });
  }

  // 2. Financial Coercion Mitigations
  if (categories.has('FINANCIAL_COERCION')) {
    actions.push({
      id: 'rec_fin_halt_transfers',
      priority: 'IMMEDIATE',
      action: 'Do NOT Send Funds, Crypto, or Gift Cards',
      detail:
        'Halt all pending payment actions. Legitimate corporations and government agencies never mandate payment via gift cards, wire transfers, or cryptocurrency.',
      category: 'Asset Protection',
    });
    actions.push({
      id: 'rec_fin_bank_fraud',
      priority: 'HIGH',
      action: 'Alert Financial Institution Directly',
      detail:
        'If you shared card numbers or bank details, dial the verified customer service number printed directly on the physical back of your debit/credit card.',
      category: 'Financial Protection',
    });
  }

  // 3. Impersonation & Account Threat Mitigations
  if (categories.has('IMPERSONATION') || categories.has('ACCOUNT_THREAT')) {
    actions.push({
      id: 'rec_imp_direct_channel',
      priority: 'IMMEDIATE',
      action: 'Use Independent, Verified Channels Only',
      detail:
        'Do not call phone numbers provided in the message or reply to the sender. Instead, open a fresh browser window and independently search for the official organization portal or customer care hotline.',
      category: 'Identity Verification',
    });
    actions.push({
      id: 'rec_imp_official_app',
      priority: 'HIGH',
      action: 'Inspect In-App Message Centers',
      detail:
        'If a legitimate bank, courier, or utility has flagged your account, an official alert will always be visible inside their official authenticated mobile application or website dashboard.',
      category: 'Verification',
    });
  }

  // 4. Channel Diversion Mitigations
  if (categories.has('CHANNEL_DIVERSION')) {
    actions.push({
      id: 'rec_div_stay_on_platform',
      priority: 'HIGH',
      action: 'Refuse Off-Platform Communication',
      detail:
        'Do not transition to Telegram, WhatsApp, or personal email. Scammers deliberately move targets away from platforms where automated fraud monitoring and dispute protections exist.',
      category: 'Platform Safety',
    });
  }

  // 5. Reporting & Evidence Preservation (Personalized by Channel)
  if (messageType === 'sms') {
    actions.push({
      id: 'rec_report_7726',
      priority: 'RECOMMENDED',
      action: 'Forward Scam SMS to Carrier Shortcode 7726',
      detail:
        'Forward the suspicious message directly to 7726 (spells SPAM). Telecom carriers use this telemetry to investigate and block spam sender routes.',
      category: 'Reporting',
    });
    actions.push({
      id: 'rec_preserve_evidence',
      priority: 'RECOMMENDED',
      action: 'Capture Screenshot and Preserve Message',
      detail:
        'Take a clear screenshot including the sender phone number and timestamp if you plan to report this incident to your mobile carrier or fraud authorities.',
      category: 'Evidence Preservation',
    });
  } else if (messageType === 'email') {
    actions.push({
      id: 'rec_preserve_evidence',
      priority: 'RECOMMENDED',
      action: 'Preserve Original Email and Headers',
      detail:
        'If reporting this message to IT security or fraud authorities, preserve the raw message and full email headers before deleting or marking as spam.',
      category: 'Evidence Preservation',
    });
  } else if (messageType === 'social_dm') {
    actions.push({
      id: 'rec_preserve_evidence',
      priority: 'RECOMMENDED',
      action: 'Capture Profile Screenshot and Report to Platform',
      detail:
        'Capture the sender profile handle, conversation history, and report the account directly through the platform safety tools before blocking.',
      category: 'Evidence Preservation',
    });
  } else {
    actions.push({
      id: 'rec_preserve_evidence',
      priority: 'RECOMMENDED',
      action: 'Preserve Communication Record',
      detail:
        'Retain the exact message text and sender details before deletion if you intend to report the communication to fraud investigators.',
      category: 'Evidence Preservation',
    });
  }

  return actions;
}
