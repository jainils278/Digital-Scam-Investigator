import React, { useEffect, useRef, useState } from 'react';
import type { InvestigationReport, ExampleCase, MessageType, VictimState } from '../../types';
import type { AttachedEvidenceImage } from '../WorkstationInput';
import { SpatialParticles } from '../../scenes/investigation/SpatialParticles';
import { SpatialEvidenceIntake } from './SpatialEvidenceIntake';
import { SpatialRiskInstrument } from './SpatialRiskInstrument';
import { SpatialEvidenceField } from './SpatialEvidenceField';
import { SpatialEvidenceGraph } from './SpatialEvidenceGraph';
import { SpatialAttackChain } from './SpatialAttackChain';
import { SpatialTacticField } from './SpatialTacticField';
import { SpatialCounterfactualDiff } from './SpatialCounterfactualDiff';
import { SpatialResponseDirective } from './SpatialResponseDirective';
import { PrimaryReportOverview } from './PrimaryReportOverview';
import { InvestigationReportView } from '../InvestigationReportView';
import { downloadInvestigationPdf, generateFullInvestigationReport, downloadCaseJson } from '../../utils/reportGenerator';

interface InvestigationEnvironmentProps {
  // Input State
  inputText: string;
  onChangeInputText: (text: string) => void;
  messageType: MessageType;
  onChangeMessageType: (type: MessageType) => void;
  attachedImages: AttachedEvidenceImage[];
  onAddImages: (files: File[]) => void;
  onRemoveImage: (id: string) => void;
  victimState: VictimState;
  onChangeVictimState: (state: VictimState) => void;
  isLoading: boolean;
  onInvestigate: () => void;
  onClear: () => void;
  examples: ExampleCase[];
  onSelectExample: (example: ExampleCase) => void;

  // Active Report State
  report: InvestigationReport | null;
  selectedIndicatorId: string | null;
  onSelectIndicator: (id: string | null) => void;
  onDownloadReport: () => void;
  errorMessage: string | null;
  onDismissError: () => void;
}

export const InvestigationEnvironment: React.FC<InvestigationEnvironmentProps> = ({
  inputText,
  onChangeInputText,
  messageType,
  onChangeMessageType,
  attachedImages,
  onAddImages,
  onRemoveImage,
  victimState,
  onChangeVictimState,
  isLoading,
  onInvestigate,
  onClear,
  examples,
  onSelectExample,
  report,
  selectedIndicatorId,
  onSelectIndicator,
  onDownloadReport,
  errorMessage,
  onDismissError,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<'SPATIAL' | 'REPORT'>('SPATIAL');
  const [activeReportTab, setActiveReportTab] = useState<'OVERVIEW' | 'ADDITIONAL_INFO'>('OVERVIEW');
  const [isLocallyTriggered, setIsLocallyTriggered] = useState(false);

  // Synchronize forensic scanner with real investigation lifecycle
  const isScanning = (isLocallyTriggered || isLoading) && !errorMessage;

  const handleTriggerInvestigate = () => {
    setIsLocallyTriggered(true);
    onInvestigate();
  };

  // Reset local trigger during render once loading completes or errors
  if (isLocallyTriggered && (!isLoading || !!errorMessage)) {
    setIsLocallyTriggered(false);
  }

  // Inertial pointer camera interpolation for depth tilt and translation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouchOrCoarse =
      window.matchMedia('(pointer: coarse)').matches ||
      'ontouchstart' in window ||
      window.innerWidth < 768;

    if (prefersReducedMotion || isTouchOrCoarse) {
      el.style.setProperty('--cam-tilt-x', '0deg');
      el.style.setProperty('--cam-tilt-y', '0deg');
      el.style.setProperty('--cam-pan-x', '0px');
      el.style.setProperty('--cam-pan-y', '0px');
      return;
    }

    let rafId: number;
    let targetTiltX = 0;
    let targetTiltY = 0;
    let targetPanX = 0;
    let targetPanY = 0;
    let currentTiltX = 0;
    let currentTiltY = 0;
    let currentPanX = 0;
    let currentPanY = 0;

    const handlePointerMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const rawX = (e.clientX - rect.left) / rect.width - 0.5;
      const rawY = (e.clientY - rect.top) / rect.height - 0.5;
      const x = Math.max(-0.5, Math.min(0.5, rawX));
      const y = Math.max(-0.5, Math.min(0.5, rawY));
      
      // Clamped subtle background motion (~2.8 deg rotation, ~10px translation)
      targetTiltX = -y * 2.8;
      targetTiltY = x * 3.5;
      targetPanX = x * 10;
      targetPanY = y * 8;
    };

    const handlePointerLeave = () => {
      // Gently return to neutral without snapping
      targetTiltX = 0;
      targetTiltY = 0;
      targetPanX = 0;
      targetPanY = 0;
    };

    const smoothingFactor = 0.06; // Luxurious physical camera inertia

    const tick = () => {
      currentTiltX += (targetTiltX - currentTiltX) * smoothingFactor;
      currentTiltY += (targetTiltY - currentTiltY) * smoothingFactor;
      currentPanX += (targetPanX - currentPanX) * smoothingFactor;
      currentPanY += (targetPanY - currentPanY) * smoothingFactor;

      el.style.setProperty('--cam-tilt-x', `${currentTiltX.toFixed(3)}deg`);
      el.style.setProperty('--cam-tilt-y', `${currentTiltY.toFixed(3)}deg`);
      el.style.setProperty('--cam-pan-x', `${currentPanX.toFixed(3)}px`);
      el.style.setProperty('--cam-pan-y', `${currentPanY.toFixed(3)}px`);

      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('mouseleave', handlePointerLeave, { passive: true });
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseleave', handlePointerLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const scrollToModule = (id: string) => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div ref={containerRef} className="forensic-scene-viewport">
      {/* =========================================================================
          PLANE: FIXED PERSISTENT SPATIAL HUD (Z: 250px)
          ========================================================================= */}
      <header className="forensic-spatial-hud">
        <div className="hud-left-meta">
          <span className="hud-live-beacon" />
          <span className="hud-case-stamp">
            {report ? `CASE // SV-${report.id.slice(0, 8).toUpperCase()}` : 'INTAKE // READY FOR CARRIER'}
          </span>
          <span className="hud-sep">|</span>
          <span className="hud-crypto-status">VOLATILE 0-RETENTION BOUNDARY</span>
        </div>

        {report && (
          <div className="hud-center-switcher">
            <button
              type="button"
              className={`hud-mode-pill ${activeViewMode === 'SPATIAL' ? 'active' : ''}`}
              onClick={() => setActiveViewMode('SPATIAL')}
            >
              3D FORENSIC WORLD
            </button>
            <button
              type="button"
              className={`hud-mode-pill ${activeViewMode === 'REPORT' ? 'active' : ''}`}
              onClick={() => setActiveViewMode('REPORT')}
            >
              EDITORIAL CASE FILE
            </button>
          </div>
        )}

        <div className="hud-right-actions">
          {report && (
            <button
              type="button"
              className="hud-export-action-btn"
              onClick={onDownloadReport}
              title="Generate certified forensic report file (PDF/HTML/JSON)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>EXPORT CASE FILE</span>
            </button>
          )}
        </div>
      </header>

      {/* =========================================================================
          PLANE: 3D FORENSIC WORLD (PERSPECTIVE + MULTIPLE DEPTH PLANES)
          ========================================================================= */}
      <div className="forensic-3d-world">
        {/* Plane A: Deep Background Space (translateZ(-250px)) */}
        <div className="world-spatial-plane deep-background-plane">
          <SpatialParticles particleCount={45} className="world-particles" />
          <div className="world-coordinate-ticks" />
          <div className="world-distant-contours" />
          <div className="world-ambient-light" />
        </div>

        {/* Plane B: Spatial Datum & Network Horizon (translateZ(-100px)) */}
        <div className="world-spatial-plane datum-horizon-plane">
          <div className="datum-laser-line top-line" />
          <div className="datum-laser-line bottom-line" />
          <div className="datum-crosshair center-crosshair" />
        </div>

        {/* Plane C: Forensics Interactive Stage (Guaranteed sharp 2D rendering surface) */}
        <div className="interactive-stage-plane">
          {/* Friendly Error Banner */}
          {errorMessage && (
            <div className="spatial-error-banner" role="alert">
              <div className="spatial-error-left">
                <span className="spatial-error-icon">!</span>
                <div>
                  <strong>Investigation Notice</strong>
                  <p>{errorMessage}</p>
                </div>
              </div>
              <button type="button" className="spatial-error-dismiss" onClick={onDismissError}>
                Dismiss
              </button>
            </div>
          )}

          {/* Mode A: Spatial Evidence Intake (When no active report, remains visible & sharp throughout scanning) */}
          {!report && (
            <div className="spatial-intake-stage-wrapper">
              <SpatialEvidenceIntake
                text={inputText}
                onChangeText={onChangeInputText}
                messageType={messageType}
                onChangeMessageType={onChangeMessageType}
                onInvestigate={handleTriggerInvestigate}
                onClear={onClear}
                isLoading={isLoading}
                isScanning={isScanning}
                hasActiveReport={false}
                examples={examples}
                onSelectExample={onSelectExample}
                attachedImages={attachedImages}
                onAddImages={onAddImages}
                onRemoveImage={onRemoveImage}
              />
            </div>
          )}

          {/* Mode B: Active Investigation Case (Continuous 3D Forensic World with Persistent Intake) */}
          {report && activeViewMode === 'SPATIAL' && (
            <div className="spatial-active-case-stream">
              {/* 00: Persistent Evidence Intake (Always accessible for revision/re-investigation) */}
              <section id="mod-intake" className="spatial-module-section intake-persistent-section">
                <SpatialEvidenceIntake
                  text={inputText}
                  onChangeText={onChangeInputText}
                  messageType={messageType}
                  onChangeMessageType={onChangeMessageType}
                  onInvestigate={handleTriggerInvestigate}
                  onClear={onClear}
                  isLoading={isLoading}
                  isScanning={isScanning}
                  hasActiveReport={true}
                  examples={examples}
                  onSelectExample={onSelectExample}
                  attachedImages={attachedImages}
                  onAddImages={onAddImages}
                  onRemoveImage={onRemoveImage}
                />
              </section>

              {/* Progressive Disclosure Navigation Bar */}
              <div className="report-progressive-nav-bar" id="report-nav-bar">
                <div className="report-nav-pill-group">
                  <button
                    type="button"
                    className={`report-nav-pill ${activeReportTab === 'OVERVIEW' ? 'active' : ''}`}
                    onClick={() => setActiveReportTab('OVERVIEW')}
                    id="tab-report-overview"
                  >
                    Overview
                  </button>
                  <button
                    type="button"
                    className={`report-nav-pill ${activeReportTab === 'ADDITIONAL_INFO' ? 'active' : ''}`}
                    onClick={() => setActiveReportTab('ADDITIONAL_INFO')}
                    id="tab-report-additional-info"
                  >
                    Additional Information
                  </button>
                </div>

                <div className="report-nav-actions-group">
                  <button
                    type="button"
                    className="report-nav-action-btn"
                    onClick={() => downloadInvestigationPdf(report)}
                    id="nav-download-pdf-btn"
                    title="Download Official PDF Report"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>Download PDF</span>
                  </button>

                  <button
                    type="button"
                    className="report-nav-action-btn"
                    onClick={() => generateFullInvestigationReport(report)}
                    id="nav-download-html-btn"
                    title="Download Standalone HTML Report"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span>Download HTML</span>
                  </button>

                  <button
                    type="button"
                    className="report-nav-action-btn"
                    onClick={() => downloadCaseJson(report)}
                    id="nav-export-json-btn"
                    title="Export Structured Case JSON"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <span>Export JSON</span>
                  </button>

                  <button
                    type="button"
                    className="report-nav-action-btn editorial-view-btn"
                    onClick={() => setActiveViewMode('REPORT')}
                    id="nav-editorial-view-btn"
                    title="Switch to Editorial Case File View"
                  >
                    <span>Editorial File View →</span>
                  </button>
                </div>
              </div>

              {/* View 1: PRIMARY OVERVIEW (Default - Simple by Default) */}
              {activeReportTab === 'OVERVIEW' && (
                <PrimaryReportOverview
                  report={report}
                  onViewAdditionalInfo={() => {
                    setActiveReportTab('ADDITIONAL_INFO');
                    const nav = document.getElementById('report-nav-bar');
                    if (nav) nav.scrollIntoView({ behavior: 'smooth' });
                  }}
                  onDownloadPdf={() => downloadInvestigationPdf(report)}
                  onDownloadHtml={() => generateFullInvestigationReport(report)}
                  onDownloadJson={() => downloadCaseJson(report)}
                />
              )}

              {/* View 2: ADDITIONAL INFORMATION (Deep by Choice) */}
              {activeReportTab === 'ADDITIONAL_INFO' && (
                <div className="additional-info-container" id="additional-info-container">
                  {/* Investigator Jump Strip */}
                  <div className="additional-info-jump-strip">
                    <button
                      type="button"
                      className="back-to-overview-pill"
                      onClick={() => setActiveReportTab('OVERVIEW')}
                      id="btn-back-to-overview"
                    >
                      ← Back to Overview
                    </button>
                    <div className="jump-strip-links">
                      <button type="button" onClick={() => scrollToModule('mod-evidence')} className="jump-link-btn">
                        Evidence &amp; Matches
                      </button>
                      <button type="button" onClick={() => scrollToModule('mod-risk')} className="jump-link-btn">
                        Why this score?
                      </button>
                      <button type="button" onClick={() => scrollToModule('mod-chain')} className="jump-link-btn">
                        How the scam works
                      </button>
                      <button type="button" onClick={() => scrollToModule('mod-topology')} className="jump-link-btn">
                        Evidence connections
                      </button>
                      <button type="button" onClick={() => scrollToModule('mod-tactics')} className="jump-link-btn">
                        Scam tactics detected
                      </button>
                      <button type="button" onClick={() => scrollToModule('mod-counterfactual')} className="jump-link-btn">
                        Things that don't add up
                      </button>
                      <button type="button" onClick={() => scrollToModule('mod-containment')} className="jump-link-btn">
                        What you should do now
                      </button>
                    </div>
                  </div>

                  {/* 01: Evidence & Exact Matches */}
                  <section id="mod-evidence" className="spatial-module-section">
                    <div className="module-section-header-row">
                      <span className="module-section-number">01</span>
                      <h3 className="module-section-title">Evidence &amp; Exact Matches</h3>
                    </div>
                    <SpatialEvidenceField
                      rawText={report.rawText}
                      observedIndicators={report.observedIndicators}
                      screenshotMeta={report.screenshotMeta}
                      screenshotsMeta={report.screenshotsMeta}
                      selectedIndicatorId={selectedIndicatorId}
                      onSelectIndicator={onSelectIndicator}
                    />
                  </section>

                  {/* 02: Why this score? */}
                  <section id="mod-risk" className="spatial-module-section">
                    <div className="module-section-header-row">
                      <span className="module-section-number">02</span>
                      <h3 className="module-section-title">Why This Score?</h3>
                    </div>
                    <SpatialRiskInstrument
                      riskAssessment={report.riskAssessment}
                      observedIndicators={report.observedIndicators}
                      waterfall={report.riskAssessment.waterfall?.contributions}
                      selectedIndicatorId={selectedIndicatorId}
                      onSelectIndicator={onSelectIndicator}
                    />
                  </section>

                  {/* 03: How the scam works */}
                  <section id="mod-chain" className="spatial-module-section">
                    <div className="module-section-header-row">
                      <span className="module-section-number">03</span>
                      <h3 className="module-section-title">How The Scam Works</h3>
                    </div>
                    <SpatialAttackChain
                      timeline={report.evidenceIntelligence?.timeline}
                      observedIndicators={report.observedIndicators}
                    />
                  </section>

                  {/* 04: Evidence connections */}
                  <section id="mod-topology" className="spatial-module-section">
                    <div className="module-section-header-row">
                      <span className="module-section-number">04</span>
                      <h3 className="module-section-title">Evidence Connections</h3>
                    </div>
                    <SpatialEvidenceGraph
                      evidenceGraph={report.evidenceIntelligence?.graph}
                      observedIndicators={report.observedIndicators}
                      selectedIndicatorId={selectedIndicatorId}
                      onSelectIndicator={onSelectIndicator}
                    />
                  </section>

                  {/* 05: Scam tactics detected */}
                  <section id="mod-tactics" className="spatial-module-section">
                    <div className="module-section-header-row">
                      <span className="module-section-number">05</span>
                      <h3 className="module-section-title">Scam Tactics Detected</h3>
                    </div>
                    <SpatialTacticField
                      tacticProfile={report.tactics}
                      observedIndicators={report.observedIndicators}
                    />
                  </section>

                  {/* 06: Things that don't add up & Sensitivity */}
                  <section id="mod-counterfactual" className="spatial-module-section">
                    <div className="module-section-header-row">
                      <span className="module-section-number">06</span>
                      <h3 className="module-section-title">Things That Don't Add Up &amp; Sensitivity</h3>
                    </div>
                    <SpatialCounterfactualDiff
                      counterfactualAnalysis={report.counterfactuals}
                      obfuscationAnalysis={report.obfuscationAnalysis}
                      baselineScore={report.riskAssessment.score}
                    />
                  </section>

                  {/* 07: What you should do now & Containment */}
                  <section id="mod-containment" className="spatial-module-section">
                    <div className="module-section-header-row">
                      <span className="module-section-number">07</span>
                      <h3 className="module-section-title">What You Should Do Now &amp; Containment</h3>
                    </div>
                    <SpatialResponseDirective
                      defensiveRecommendations={report.defensiveRecommendations}
                      victimState={report.victimResponse?.declaredState || victimState}
                      onChangeVictimState={onChangeVictimState}
                      institutionVerification={report.institutionVerification}
                    />
                  </section>

                  {/* Return to Overview Footer */}
                  <div className="additional-info-footer-bar">
                    <button
                      type="button"
                      className="btn-return-overview"
                      onClick={() => {
                        setActiveReportTab('OVERVIEW');
                        const nav = document.getElementById('report-nav-bar');
                        if (nav) nav.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      ← Return to Simple Overview
                    </button>
                    <div className="additional-info-download-actions">
                      <button
                        type="button"
                        className="btn-download-report-subtle"
                        onClick={() => downloadInvestigationPdf(report)}
                      >
                        Download PDF
                      </button>
                      <button
                        type="button"
                        className="btn-download-report-subtle"
                        onClick={() => generateFullInvestigationReport(report)}
                      >
                        Download HTML
                      </button>
                      <button
                        type="button"
                        className="btn-download-report-subtle"
                        onClick={() => downloadCaseJson(report)}
                      >
                        Export JSON
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}


          {/* Mode C: Editorial Case File View */}
          {report && activeViewMode === 'REPORT' && (
            <div className="spatial-editorial-report-wrapper">
              <div className="spatial-report-top-strip">
                <button
                  type="button"
                  className="btn-secondary spatial-back-to-world-btn"
                  onClick={() => {
                    setActiveViewMode('SPATIAL');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  ← Return to 3D Investigation World
                </button>
                <span className="spatial-report-file-tag">
                  OFFICIAL EVIDENCE AUDIT // SV-CASE-{report.id.slice(0, 8).toUpperCase()}
                </span>
              </div>

              <InvestigationReportView
                report={report}
                selectedIndicatorId={selectedIndicatorId}
                onSelectIndicator={onSelectIndicator}
                onDownloadReport={onDownloadReport}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
