import React from 'react';

interface ReportDisclaimerProps {
  disclaimer: string;
  reportId: string;
  timestamp: string;
}

export const ReportDisclaimer: React.FC<ReportDisclaimerProps> = ({
  disclaimer,
  reportId,
  timestamp,
}) => {
  return (
    <div className="panel-card" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', borderStyle: 'dashed' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span>⚖️</span>
        <strong style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          Assessment Limitations & Defensive Disclaimer
        </strong>
      </div>

      <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '12px' }}>
        {disclaimer}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
        <span>Investigation Audit ID: {reportId}</span>
        <span>Generated: {new Date(timestamp).toLocaleString()}</span>
        <span>Environment: Defensive Cybersecurity Workstation v1.0</span>
      </div>
    </div>
  );
};
