import React from 'react';
import type { InvestigationReport } from '../types';
import {
  type AssessmentPanelData,
  deriveInvestigationAssessment,
} from '../utils/assessmentSummary';

export { type AssessmentPanelData, deriveInvestigationAssessment };

/**
 * Concise Investigation Assessment panel presented directly adjacent to the Investigation Score.
 */
export const InvestigationAssessmentPanel: React.FC<{ report: InvestigationReport }> = ({ report }) => {
  const assessment = deriveInvestigationAssessment(report);

  // Clean displayed badge text of any legacy encoding artifacts for UI presentation
  const displayBadgeText = assessment.badgeText.replace(/^[^A-Za-z0-9]+/, '').trim();

  const getStatusIcon = () => {
    switch (assessment.badgeType) {
      case 'critical':
      case 'high':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        );
      case 'ambiguous':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        );
      case 'clean':
      default:
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        );
    }
  };

  return (
    <div
      className={`assessment-panel-card card-${assessment.badgeType}`}
      role="region"
      aria-label="Investigation Assessment Summary"
    >
      <div className="assessment-header-row">
        <div className="section-label">INVESTIGATION ASSESSMENT</div>
        <div className={`assessment-status-badge badge-${assessment.badgeType}`}>
          {getStatusIcon()}
          <span>{displayBadgeText}</span>
        </div>
      </div>

      <div className="assessment-content-body">
        <div className="assessment-field-group">
          <div className="assessment-field-label">Category</div>
          <div className="assessment-category-text">{assessment.category}</div>
        </div>

        <div className="assessment-field-group">
          <div className="assessment-field-label">{assessment.headerText}</div>
          <ul className="assessment-items-list">
            {assessment.keyItems.map((item, index) => (
              <li key={index} className="assessment-item">
                <span className="assessment-bullet" aria-hidden="true">
                  &bull;
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="assessment-clarification-note">
        {assessment.clarification}
      </div>
    </div>
  );
};
