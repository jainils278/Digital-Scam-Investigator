import React, { useEffect, useState } from 'react';

export const InvestigationProgress: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    'Validating input boundaries & normalizing Unicode characters...',
    'Scanning authoritative deterministic detection patterns...',
    'Executing contextual analysis & psychological trigger classification...',
    'Cross-verifying evidence integrity against original raw text...',
    'Computing explainable risk score & synthesizing defensive protocols...',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 600);

    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="progress-panel">
      <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔬</div>
      <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
        CYBER INVESTIGATION IN PROGRESS
      </h3>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
        Executing defensive multi-stage verification pipeline
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
              <span>{isDone ? '✓' : isActive ? '▶' : '○'}</span>
              <span>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
