import React, { useState } from 'react';
import type { DefensiveAction, VictimState, InstitutionVerificationMatch } from '../../types';
import { getClientVictimStateResponse } from '../../utils/incidentResponse';

interface SpatialResponseDirectiveProps {
  defensiveRecommendations: DefensiveAction[];
  victimState?: VictimState;
  onChangeVictimState?: (state: VictimState) => void;
  institutionVerification?: InstitutionVerificationMatch;
}

const VICTIM_STATES: { state: VictimState; label: string; desc: string }[] = [
  {
    state: 'RECEIVED_MESSAGE_ONLY',
    label: 'Received Message Only',
    desc: 'You received or read the suspicious message or image, but took no action.',
  },
  {
    state: 'CLICKED_LINK',
    label: 'Clicked Link',
    desc: 'You clicked or opened the link in the message, but did not enter data.',
  },
  {
    state: 'ENTERED_CREDENTIALS',
    label: 'Entered Credentials',
    desc: 'You submitted a username, password, PIN, or login credentials.',
  },
  {
    state: 'DISCLOSED_OTP_OR_AUTH_CODE',
    label: 'Disclosed OTP / 2FA Code',
    desc: 'You shared a one-time passcode or two-factor SMS authentication token.',
  },
  {
    state: 'PROVIDED_PERSONAL_INFORMATION',
    label: 'Disclosed Personal Details',
    desc: 'You submitted SSN, ID documents, address, or banking numbers.',
  },
  {
    state: 'SENT_MONEY',
    label: 'Sent Money / Funds',
    desc: 'You executed a wire transfer, crypto payment, gift card, or peer payment.',
  },
];

export const SpatialResponseDirective: React.FC<SpatialResponseDirectiveProps> = ({
  defensiveRecommendations,
  victimState = 'RECEIVED_MESSAGE_ONLY',
  onChangeVictimState,
  institutionVerification,
}) => {
  const [selectedState, setSelectedState] = useState<VictimState>(victimState);

  // Client-side incident response calculation from dedicated utility
  const dynamicResponse = getClientVictimStateResponse(selectedState);

  // Segregate recommendations into Do vs Don't
  const { doItems, dontItems } = React.useMemo(() => {
    const dos: string[] = [];
    const donts: string[] = [];

    defensiveRecommendations.forEach((rec) => {
      const lower = rec.action.toLowerCase();
      if (
        lower.startsWith('do not') ||
        lower.startsWith("don't") ||
        lower.includes('refuse') ||
        lower.includes('halt') ||
        lower.includes('never')
      ) {
        donts.push(rec.action);
      } else {
        dos.push(rec.action);
      }
    });

    // Ensure baseline directives exist
    if (donts.length === 0) {
      donts.push('Do NOT click links, open attachments, or dial callback numbers embedded in this communication.');
      donts.push('Do NOT share one-time authentication codes or passwords with any inbound caller or sender.');
    }
    if (dos.length === 0) {
      dos.push('Navigate independently to the organization’s verified official application or portal.');
      dos.push('Report the malicious sender address or phone number to your institution’s fraud operations department.');
    }

    return { doItems: dos, dontItems: donts };
  }, [defensiveRecommendations]);

  const handleStateChange = (st: VictimState) => {
    setSelectedState(st);
    if (onChangeVictimState) {
      onChangeVictimState(st);
    }
  };

  return (
    <div className="spatial-response-directive-root">
      {/* Module Header */}
      <div className="spatial-section-header">
        <div className="spatial-section-tag">
          <span className="spatial-section-num">07</span>
          <span className="spatial-section-bracket">//</span>
          <span className="spatial-section-title">INCIDENT CONTAINMENT & RESPONSE DIRECTIVE</span>
        </div>
        <div className="spatial-telemetry-badge">
          <span>OPERATIONAL RESPONSE MODE</span>
          <span className="spatial-badge-sep">|</span>
          <span>IMMEDIATE ACTIONS</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="spatial-response-container">
        {/* Victim State Interactive Radio Strip */}
        <div className="spatial-victim-state-pod">
          <div className="spatial-pod-header">
            <span className="spatial-pod-title">DECLARE SITUATIONAL EXPOSURE LEVEL:</span>
            <span className="spatial-pod-sub">SELECT WHAT OCCURRED TO RECEIVE RELEVANT CONTAINMENT PROTOCOLS</span>
          </div>

          <div className="spatial-victim-chips-grid">
            {VICTIM_STATES.map((vs) => {
              const isSelected = selectedState === vs.state;
              return (
                <button
                  key={vs.state}
                  type="button"
                  className={`spatial-victim-chip ${isSelected ? 'active' : ''}`}
                  onClick={() => handleStateChange(vs.state)}
                >
                  <div className="spatial-chip-radio">
                    {isSelected && <span className="spatial-chip-inner-dot" />}
                  </div>
                  <div className="spatial-chip-meta">
                    <div className="spatial-chip-label">{vs.label}</div>
                    <div className="spatial-chip-desc">{vs.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Containment Emergency Directive Banner */}
        {dynamicResponse && selectedState !== 'RECEIVED_MESSAGE_ONLY' && (
          <div className="spatial-emergency-containment-banner">
            <div className="spatial-containment-lead">
              <span className="spatial-alert-flasher">!</span>
              <div>
                <strong>IMMEDIATE ACTION PROTOCOL ACTIVATED: {dynamicResponse.stateLabel}</strong>
                <p>URGENCY LEVEL: {dynamicResponse.containmentUrgency}</p>
              </div>
            </div>
            {dynamicResponse.containmentSteps && dynamicResponse.containmentSteps.length > 0 && (
              <div className="spatial-containment-checklist">
                <div className="checklist-title">CRITICAL STEPS IN NEXT 30 MINUTES:</div>
                <ul>
                  {dynamicResponse.containmentSteps.map((step, idx) => (
                    <li key={idx}>
                      <span className="chk-box">☐</span> <strong>{step.title}:</strong> {step.detail}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Operational Directives: Do vs Don't Segregated Matrix */}
        <div className="spatial-directives-matrix">
          {/* Negative Constraints (WHAT NOT TO DO) */}
          <div className="spatial-directive-col dont">
            <div className="spatial-directive-col-header">
              <div className="spatial-directive-icon-circle dont">✕</div>
              <div>
                <h4 className="spatial-directive-h">WHAT NOT TO DO</h4>
                <span className="spatial-directive-sub">NEGATIVE CONSTRAINTS TO HALT ADVERSARIAL GAIN</span>
              </div>
            </div>

            <ul className="spatial-directive-list">
              {dontItems.map((item, idx) => (
                <li key={idx} className="spatial-directive-item dont">
                  <span className="spatial-item-bullet dont">✕</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Positive Containment (WHAT TO DO) */}
          <div className="spatial-directive-col do">
            <div className="spatial-directive-col-header">
              <div className="spatial-directive-icon-circle do">✓</div>
              <div>
                <h4 className="spatial-directive-h">WHAT TO DO</h4>
                <span className="spatial-directive-sub">POSITIVE CONTAINMENT ACTIONS</span>
              </div>
            </div>

            <ul className="spatial-directive-list">
              {doItems.map((item, idx) => (
                <li key={idx} className="spatial-directive-item do">
                  <span className="spatial-item-bullet do">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Verified Directory Preview Strip */}
        <div className="spatial-verified-directory-strip">
          <div className="spatial-directory-left">
            <span className="spatial-dir-badge">TRUSTED VERIFICATION DIRECTORY</span>
            <span className="spatial-dir-desc">
              {institutionVerification?.institution
                ? `Matched Institution: ${institutionVerification.institution.organizationName} (${institutionVerification.institution.safeVerificationGuidance})`
                : 'Never use phone numbers or links from the message. Always contact verified official channels.'}
            </span>
          </div>
          <div className="spatial-directory-pills">
            <div className="spatial-dir-pill">
              <span className="dir-org">Chase Fraud Dept</span>
              <span className="dir-contact">1-800-935-9935</span>
            </div>
            <div className="spatial-dir-pill">
              <span className="dir-org">USPS Postal Inspection</span>
              <span className="dir-contact">1-877-876-2455</span>
            </div>
            <div className="spatial-dir-pill">
              <span className="dir-org">FTC Scam Registry</span>
              <span className="dir-contact">ReportFraud.ftc.gov</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
