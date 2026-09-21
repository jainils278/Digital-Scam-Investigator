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

  return (
    <div
      className={`assessment-panel-card card-${assessment.badgeType}`}
      role="region"
      aria-label="Investigation Assessment Summary"
    >
      <div className="assessment-header-row">
        <div className="section-label">INVESTIGATION ASSESSMENT</div>
        <div className={`assessment-status-badge badge-${assessment.badgeType}`}>
          {assessment.badgeText}
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
