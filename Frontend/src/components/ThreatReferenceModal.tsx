import React from 'react';

interface ThreatReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThreatReferenceModal: React.FC<ThreatReferenceModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              📖 Threat Intelligence & Scam Anatomy Guide
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Defensive cybersecurity reference for evaluating suspicious communications
            </p>
          </div>

          <button type="button" className="btn-secondary" onClick={onClose}>
            ✕ Close
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '550px', overflowY: 'auto', paddingRight: '6px' }}>
          {/* Section 1 */}
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ color: '#ef4444', fontSize: '14px', marginBottom: '6px' }}>
              1. The Golden Rule of MFA / OTP Codes
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              One-Time Passcodes (OTPs) sent by your bank, email provider, or social media are intended strictly for your personal verification. <strong>Do not disclose a one-time passcode to someone who asks you to provide it.</strong> Unexpected OTP requests should be treated as a serious warning sign and independently verified through an official channel.
            </p>
          </div>

          {/* Section 2 */}
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ color: '#f97316', fontSize: '14px', marginBottom: '6px' }}>
              2. Artificial Urgency & The Amygdala Hijack
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Attackers deliberately manufacture short deadlines (e.g. <em>"within 2 hours or your account will be deleted"</em>) to trigger panic. Neurologically, acute anxiety suppresses analytical thinking. Always pause: legitimate legal and financial notices are communicated via registered mail or verified in-app dashboards, not frantic SMS demands.
            </p>
          </div>

          {/* Section 3 */}
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ color: '#f59e0b', fontSize: '14px', marginBottom: '6px' }}>
              3. Untraceable Payment Demands (Gift Cards & Crypto)
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              No government agency (IRS, Social Security, Police) or legitimate corporate supplier ever accepts payment in retail gift cards (Apple, Steam, Google Play) or direct cryptocurrency transfers. Once digital codes are transmitted, they are liquidated globally within minutes with zero recourse for recovery.
            </p>
          </div>

          {/* Section 4 */}
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ color: '#38bdf8', fontSize: '14px', marginBottom: '6px' }}>
              4. Channel Diversion Tactics (Moving to Telegram / WhatsApp)
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              In freelance, job, and marketplace fraud, scammers immediately steer targets off Upwork, LinkedIn, or Facebook onto Telegram or WhatsApp. They do this to avoid automated spam triggers, account bans, and platform transaction protections.
            </p>
          </div>

          {/* Section 5 */}
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ color: '#a855f7', fontSize: '14px', marginBottom: '6px' }}>
              5. Evasion via Zero-Width & Homoglyphs
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Advanced phishers insert invisible Unicode zero-width characters (e.g. <code>p\u200Bassword</code>) or substitute Cyrillic/Greek characters that look identical to Latin letters (e.g. Cyrillic <code>а</code> instead of Latin <code>a</code>) to evade basic keyword filters. Our detector normalizes and flags these evasion attempts.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
          <button type="button" className="btn-primary" onClick={onClose}>
            Close Reference
          </button>
        </div>
      </div>
    </div>
  );
};
