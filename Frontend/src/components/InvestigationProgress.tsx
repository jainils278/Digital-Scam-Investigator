import React, { useEffect, useState } from 'react';

export const InvestigationProgress: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    'Reading submitted content...',
    'Checking for known scam, impersonation, and fraud patterns...',
    'Analyzing links and claims...',
    'Evaluating urgency tactics and safety risks...',
    'Preparing your investigation report...',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 650);

    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="progress-panel" role="status" aria-live="polite">
      <div className="progress-spinner-container">
        <svg className="progress-spinner" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" strokeOpacity="0.2"></circle>
          <path d="M12 2a10 10 0 0 1 10 10"></path>
        </svg>
      </div>

      <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>
        Investigation in Progress
      </h3>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
        Evaluating communication patterns for potential safety risks
      </p>

      <div className="progress-steps">
        {steps.map((label, idx) => {
          const isDone = idx < currentStep;
          const isActive = idx === currentStep;

          return (
            <div
              key={label}
              className={`progress-step-item ${isActive ? 'active' : isDone ? 'done' : ''}`}
            >
              <span className="step-icon">
                {isDone ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : isActive ? (
                  <span className="active-dot"></span>
                ) : (
                  <span className="pending-dot"></span>
                )}
              </span>
              <span className="step-label">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
