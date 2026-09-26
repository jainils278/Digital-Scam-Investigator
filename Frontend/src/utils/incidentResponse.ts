/**
 * Client-Side Incident Response Matrix
 * 
 * Provides instant, offline response guidance when the user selects or switches
 * their declared victim state in the workstation.
 * 
 * Adheres to strict zero-retention and zero-inference rules.
 */

import type {
  IncidentStep,
  ReportingChannel,
  VictimState,
  VictimStateResponse,
} from '../types';

interface StateDefinition {
  stateLabel: string;
  containmentUrgency: 'CRITICAL_CONTAINMENT' | 'ACTIVE_CONTAINMENT' | 'PREVENTATIVE';
  containmentSteps: IncidentStep[];
  evidencePreservationGuide: string;
  reportingChannels: ReportingChannel[];
}

const RESPONSE_MATRIX: Record<VictimState, StateDefinition> = {
  RECEIVED_MESSAGE_ONLY: {
    stateLabel: 'Received Message Only (No Interaction)',
    containmentUrgency: 'PREVENTATIVE',
    containmentSteps: [
      {
        stepNumber: 1,
        urgency: 'IMMEDIATE_ACTION',
        title: 'Do Not Interact',
        detail: 'Do not click any embedded links, open attachments, call phone numbers, or reply to the sender. Cease all engagement immediately.',
        category: 'CONTAINMENT',
      },
      {
        stepNumber: 2,
        urgency: 'WITHIN_1_HOUR',
        title: 'Block and Flag Sender',
        detail: 'Block the sender telephone number, email address, or social handle in your communication client and flag the message as junk or phishing.',
        category: 'CONTAINMENT',
      },
      {
        stepNumber: 3,
        urgency: 'WITHIN_24_HOURS',
        title: 'Verify Independent Context',
        detail: 'If the message purports to be from an organization you do business with, verify your account status by navigating directly to their official website or app independently.',
        category: 'AUTHENTICATION',
      },
    ],
    evidencePreservationGuide:
      'Preserve the raw message or take a clear full-screen screenshot showing the complete sender handle, header metadata, or phone number before deleting or filtering.',
    reportingChannels: [
      {
        name: 'Telecommunications / Carrier Spam Reporting',
        channelType: 'PLATFORM',
        sourceAttribution: 'Global telecom practice (e.g. forward SMS to 7726 where supported)',
      },
      {
        name: 'Email / Messaging Provider In-App Abuse Flag',
        channelType: 'PLATFORM',
        sourceAttribution: 'Built-in platform "Report Phishing" or "Report Spam" button',
      },
    ],
  },

  CLICKED_LINK: {
    stateLabel: 'Clicked Untrusted Link',
    containmentUrgency: 'ACTIVE_CONTAINMENT',
    containmentSteps: [
      {
        stepNumber: 1,
        urgency: 'IMMEDIATE_ACTION',
        title: 'Close Destination Tab',
        detail: 'Close the browser tab or popup immediately. Do not submit any forms, click subsequent prompts, or approve any permission requests.',
        category: 'CONTAINMENT',
      },
      {
        stepNumber: 2,
        urgency: 'WITHIN_1_HOUR',
        title: 'Clear Cache & Site Cookies',
        detail: 'Clear browser history, cookies, and local site storage for the domain visited to terminate any malicious tracking or session tokens.',
        category: 'CONTAINMENT',
      },
      {
        stepNumber: 3,
        urgency: 'WITHIN_24_HOURS',
        title: 'Inspect Downloads & Endpoint Scan',
        detail: 'Check your device downloads folder for any unrequested files or scripts and run an updated malware scan using your operating system security tools.',
        category: 'CONTAINMENT',
      },
    ],
    evidencePreservationGuide:
      'Copy the destination URL from your browser history without clicking it, and record the date and time you visited the link.',
    reportingChannels: [
      {
        name: 'Browser Safe Browsing Abuse Report',
        channelType: 'PLATFORM',
        sourceAttribution: 'Google Safe Browsing / Microsoft SmartScreen web reporting',
      },
    ],
  },

  ENTERED_CREDENTIALS: {
    stateLabel: 'Submitted Account Credentials',
    containmentUrgency: 'CRITICAL_CONTAINMENT',
    containmentSteps: [
      {
        stepNumber: 1,
        urgency: 'IMMEDIATE_ACTION',
        title: 'Change Password on Official Site',
        detail: 'Navigate directly to the official service website (via trusted bookmark or manual URL typing, NOT via message links) and immediately update your password.',
        category: 'AUTHENTICATION',
      },
      {
        stepNumber: 2,
        urgency: 'IMMEDIATE_ACTION',
        title: 'Terminate Active Sessions',
        detail: 'Access your account security settings and select "Log out of all devices" or "Revoke active sessions" to evict any unauthorized access.',
        category: 'AUTHENTICATION',
      },
      {
        stepNumber: 3,
        urgency: 'WITHIN_1_HOUR',
        title: 'Update Reused Passwords',
        detail: 'If you reused this password across any other personal or work services, immediately change passwords on those accounts to unique credentials.',
        category: 'AUTHENTICATION',
      },
      {
        stepNumber: 4,
        urgency: 'WITHIN_24_HOURS',
        title: 'Strengthen Multi-Factor Authentication',
        detail: 'Enable an authenticator app (TOTP) or hardware security key instead of SMS-based verification where supported.',
        category: 'AUTHENTICATION',
      },
    ],
    evidencePreservationGuide:
      'Record the exact username or email submitted, the exact URL of the phishing portal, and the precise timestamp of credential submission.',
    reportingChannels: [
      {
        name: 'Targeted Organization Account Security Desk',
        channelType: 'PLATFORM',
        sourceAttribution: 'Official compromised account / security support channel of the targeted service',
      },
    ],
  },

  DISCLOSED_OTP_OR_AUTH_CODE: {
    stateLabel: 'Disclosed One-Time Passcode (OTP) or 2FA Code',
    containmentUrgency: 'CRITICAL_CONTAINMENT',
    containmentSteps: [
      {
        stepNumber: 1,
        urgency: 'IMMEDIATE_ACTION',
        title: 'Access Account and Audit Security Settings',
        detail: 'Sign in to the official service immediately. Check for newly added unrecognized devices, secondary phone numbers, recovery email modifications, or forwarding rules.',
        category: 'AUTHENTICATION',
      },
      {
        stepNumber: 2,
        urgency: 'IMMEDIATE_ACTION',
        title: 'Revoke and Reset 2FA Factors',
        detail: 'Generate new recovery codes, revoke existing authenticator tokens or app passwords, and reset your two-factor configuration.',
        category: 'AUTHENTICATION',
      },
      {
        stepNumber: 3,
        urgency: 'WITHIN_1_HOUR',
        title: 'Notify Official Support Desk',
        detail: 'Contact the service customer support or security department immediately to alert them of active session hijacking attempt.',
        category: 'AUTHENTICATION',
      },
      {
        stepNumber: 4,
        urgency: 'WITHIN_24_HOURS',
        title: 'Review Recent Audit Logs & Transactions',
        detail: 'Inspect transaction histories, login logs, and outbound communication records for unauthorized changes performed while the attacker had access.',
        category: 'FINANCIAL',
      },
    ],
    evidencePreservationGuide:
      'Preserve the original SMS or push notification containing the OTP along with the exact time you relayed it to the adversary.',
    reportingChannels: [
      {
        name: 'Targeted Service Incident Support',
        channelType: 'PLATFORM',
        sourceAttribution: 'Official customer trust & security department',
      },
    ],
  },

  PROVIDED_PERSONAL_INFORMATION: {
    stateLabel: 'Provided Personal / Identity Information',
    containmentUrgency: 'ACTIVE_CONTAINMENT',
    containmentSteps: [
      {
        stepNumber: 1,
        urgency: 'IMMEDIATE_ACTION',
        title: 'Catalog Disclosed Identity Data',
        detail: 'List the exact items of personal data exposed (e.g. government ID number, date of birth, home address, mother maiden name).',
        category: 'CONTAINMENT',
      },
      {
        stepNumber: 2,
        urgency: 'WITHIN_1_HOUR',
        title: 'Place Credit Freeze or Fraud Alert',
        detail: 'Contact credit bureaus in your jurisdiction to place a fraud alert or credit freeze to block unauthorized credit line openings.',
        category: 'FINANCIAL',
      },
      {
        stepNumber: 3,
        urgency: 'WITHIN_24_HOURS',
        title: 'Prepare for Secondary Social Engineering',
        detail: 'Adversaries frequently use stolen personal details for high-conviction follow-up scams (such as fake bank fraud investigators or legal summons). Treat unexpected calls with heightened suspicion.',
        category: 'CONTAINMENT',
      },
    ],
    evidencePreservationGuide:
      'Document an itemized record of all identity attributes submitted and keep copies of the pretext communication.',
    reportingChannels: [
      {
        name: 'National Consumer Protection / Identity Theft Agency',
        channelType: 'GOVERNMENT',
        sourceAttribution: 'Official national consumer or identity protection portal in your jurisdiction',
      },
    ],
  },

  SENT_MONEY: {
    stateLabel: 'Transferred Funds / Sent Payment',
    containmentUrgency: 'CRITICAL_CONTAINMENT',
    containmentSteps: [
      {
        stepNumber: 1,
        urgency: 'IMMEDIATE_ACTION',
        title: 'Contact Originating Financial Institution',
        detail: 'Call your bank or card issuer emergency fraud hotline immediately (using the number on the physical card or verified official statement). Request an immediate wire recall, stop-payment, or chargeback dispute.',
        category: 'FINANCIAL',
      },
      {
        stepNumber: 2,
        urgency: 'IMMEDIATE_ACTION',
        title: 'Notify Intermediary Payment Platform',
        detail: 'If funds were sent via peer-to-peer payment app, wire service, or gift card, report the unauthorized fraudulent transaction immediately to the platform abuse desk with transaction reference numbers.',
        category: 'FINANCIAL',
      },
      {
        stepNumber: 3,
        urgency: 'WITHIN_1_HOUR',
        title: 'File Formal Police / Law Enforcement Report',
        detail: 'File an official crime report with your local police or national cybercrime portal. Retain the police report or reference number; financial institutions routinely require this for claim processing.',
        category: 'LEGAL_REPORTING',
      },
      {
        stepNumber: 4,
        urgency: 'WITHIN_24_HOURS',
        title: 'Beware of "Recovery" Scams',
        detail: 'Do NOT engage third-party "asset recovery" or "funds recovery" services. Any entity claiming they can hack or recover stolen money for an upfront fee is an advance-fee scam.',
        category: 'CONTAINMENT',
      },
    ],
    evidencePreservationGuide:
      'Preserve transaction receipts, transfer reference IDs, payment handler usernames, beneficiary bank routing/account numbers, and conversation logs demanding payment.',
    reportingChannels: [
      {
        name: 'Originating Bank / Financial Institution Fraud Team',
        channelType: 'BANK',
        sourceAttribution: 'Official phone number on back of payment card or monthly account statement',
      },
      {
        name: 'Peer-to-Peer / Money Transfer Service Fraud Department',
        channelType: 'PAYMENT_PROVIDER',
        sourceAttribution: 'Official in-app dispute and transaction fraud portal',
      },
      {
        name: 'Official Local or National Cybercrime Authority',
        channelType: 'LAW_ENFORCEMENT',
        sourceAttribution: 'Local police precinct or official government cybercrime intake agency',
      },
    ],
  },

  INSTALLED_SOFTWARE_OR_APP: {
    stateLabel: 'Installed Unknown Software or Mobile App',
    containmentUrgency: 'CRITICAL_CONTAINMENT',
    containmentSteps: [
      {
        stepNumber: 1,
        urgency: 'IMMEDIATE_ACTION',
        title: 'Isolate Device from Network',
        detail: 'Immediately disconnect the affected device from all internet connections: toggle Airplane Mode, turn off Wi-Fi and mobile data, or disconnect Ethernet cable.',
        category: 'CONTAINMENT',
      },
      {
        stepNumber: 2,
        urgency: 'IMMEDIATE_ACTION',
        title: 'Do Not Enter Credentials on This Device',
        detail: 'Do not attempt to sign in to banking, email, or sensitive accounts on the compromised system while software or persistent malware may be active.',
        category: 'CONTAINMENT',
      },
      {
        stepNumber: 3,
        urgency: 'WITHIN_1_HOUR',
        title: 'Uninstall App or Execute Clean Reinstall',
        detail: 'Boot device into Safe Mode to remove the malicious app. For high-privilege or persistent payloads, backup personal media/files and perform a clean factory reset.',
        category: 'CONTAINMENT',
      },
      {
        stepNumber: 4,
        urgency: 'WITHIN_24_HOURS',
        title: 'Reset Credentials from a Known-Clean Device',
        detail: 'Using a separate, uncompromised device, update passwords and terminate active sessions for accounts stored or accessed on the affected machine.',
        category: 'AUTHENTICATION',
      },
    ],
    evidencePreservationGuide:
      'Record the application name, installer package name, download source URL, and permissions requested before resetting the device.',
    reportingChannels: [
      {
        name: 'Platform App Store Security Intake',
        channelType: 'PLATFORM',
        sourceAttribution: 'Official platform application abuse portal (Google Play Protect / Apple App Store)',
      },
    ],
  },

  SHARED_SCREEN_OR_REMOTE_ACCESS: {
    stateLabel: 'Granted Remote Access or Screen Sharing',
    containmentUrgency: 'CRITICAL_CONTAINMENT',
    containmentSteps: [
      {
        stepNumber: 1,
        urgency: 'IMMEDIATE_ACTION',
        title: 'Sever Remote Session Immediately',
        detail: 'Immediately terminate the remote access application (e.g. AnyDesk, TeamViewer, QuickSupport) and disconnect the device from the network.',
        category: 'CONTAINMENT',
      },
      {
        stepNumber: 2,
        urgency: 'IMMEDIATE_ACTION',
        title: 'Uninstall Remote Management Software',
        detail: 'Uninstall the remote assistance tool used during the session and remove any configuration files or unattended access passwords created.',
        category: 'CONTAINMENT',
      },
      {
        stepNumber: 3,
        urgency: 'WITHIN_1_HOUR',
        title: 'Contact Financial Institution from Clean Device',
        detail: 'If online banking or password managers were visible while screen sharing was active, contact your bank immediately from a telephone or clean device to freeze accounts.',
        category: 'FINANCIAL',
      },
      {
        stepNumber: 4,
        urgency: 'WITHIN_24_HOURS',
        title: 'Full Malware and Persistence Audit',
        detail: 'Scan the system for remote backdoors, scheduled tasks, or secondary software quietly deposited by the operator.',
        category: 'CONTAINMENT',
      },
    ],
    evidencePreservationGuide:
      'Record the remote connection tool used, session ID number, timestamp, and duration of the remote session.',
    reportingChannels: [
      {
        name: 'Remote Desktop Vendor Abuse Desk',
        channelType: 'PLATFORM',
        sourceAttribution: 'Abuse reporting desk of the remote tool used (e.g. AnyDesk / TeamViewer abuse reporting)',
      },
      {
        name: 'Bank Fraud Operations',
        channelType: 'BANK',
        sourceAttribution: 'Financial institution fraud team if financial portals were displayed',
      },
    ],
  },

  UNKNOWN_STATE: {
    stateLabel: 'Status Unspecified',
    containmentUrgency: 'PREVENTATIVE',
    containmentSteps: [
      {
        stepNumber: 1,
        urgency: 'IMMEDIATE_ACTION',
        title: 'Maintain Defensive Posture',
        detail: 'Treat the message with high suspicion. Do not click links, open attachments, reply, or dial phone numbers listed in the message.',
        category: 'CONTAINMENT',
      },
      {
        stepNumber: 2,
        urgency: 'WITHIN_1_HOUR',
        title: 'Select Specific Action if Interacted',
        detail: 'If you clicked a link, shared codes, or transferred funds, declare your specific action in the workstation panel to receive immediate tailored containment instructions.',
        category: 'CONTAINMENT',
      },
      {
        stepNumber: 3,
        urgency: 'WITHIN_24_HOURS',
        title: 'Independent Confirmation',
        detail: 'Never use contact details provided in an unsolicited communication. Use verified official coordinates to confirm any claims.',
        category: 'AUTHENTICATION',
      },
    ],
    evidencePreservationGuide:
      'Keep the original suspicious message intact without editing or forwarding.',
    reportingChannels: [
      {
        name: 'Platform Anti-Phishing Intake',
        channelType: 'PLATFORM',
        sourceAttribution: 'Native in-app report spam or phishing mechanism',
      },
    ],
  },
};

export function getClientVictimStateResponse(
  declaredState?: VictimState
): VictimStateResponse {
  const state: VictimState = declaredState && RESPONSE_MATRIX[declaredState]
    ? declaredState
    : 'UNKNOWN_STATE';

  const definition = RESPONSE_MATRIX[state];

  return {
    declaredState: state,
    stateLabel: definition.stateLabel,
    containmentUrgency: definition.containmentUrgency,
    containmentSteps: definition.containmentSteps,
    evidencePreservationGuide: definition.evidencePreservationGuide,
    reportingChannels: definition.reportingChannels,
  };
}
