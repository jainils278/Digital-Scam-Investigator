import React, { useState, useEffect, useRef } from 'react';

interface PipelineStage {
  step: string;
  name: string;
  category: string;
  badge: string;
  isDeterministic: boolean;
  shortTag: string;
  description: string;
  forensicProof: string;
  inputSnippet: string;
  outputSnippet: string;
  architectureFact: string;
  zDepth: number; // Z-depth in pixels for dimensional positioning
}

const PIPELINE_STAGES: PipelineStage[] = [
  {
    step: '01',
    name: 'Artifact Ingestion Boundary',
    category: 'RAW INPUT INGESTION',
    badge: 'STAGE 01 // VOLATILE NONCE',
    isDeterministic: true,
    shortTag: 'INPUT BOUNDARY',
    description: 'Accepts raw text, suspicious URLs, or screenshot images via client-side OCR into a volatile sandbox.',
    forensicProof: 'SHA-256 ephemeral request nonce assigned; zero disk writes, held purely in transient execution memory.',
    inputSnippet: 'POST /api/investigate -> Raw Payload [148 bytes, text/plain]',
    outputSnippet: 'EphemeralNonce: "nonce-9f82a1c" | MemoryBuffer: 0.04MB allocated',
    architectureFact: 'Zero server-side persistence. Once analyzed, memory is immediately garbage collected.',
    zDepth: 8,
  },
  {
    step: '02',
    name: 'Normalization & Index Mapping',
    category: 'CANONICAL DECODING',
    badge: 'STAGE 02 // BIJECTIVE MAP',
    isDeterministic: true,
    shortTag: 'HOMOGLYPH UNFOLDING',
    description: 'Unfolds homoglyphs and removes invisible zero-width characters while maintaining an exact forward index map back to original characters.',
    forensicProof: 'Bijective index array guarantees zero character-offset drift for downstream evidence anchors in raw text.',
    inputSnippet: 'Raw: "p\\u200Bay\\u0440al.com" [Invisible ZWSP + Cyrillic Small Letter Er]',
    outputSnippet: 'Canonical: "paypal.com" | ForwardMap: [0->0, 2->1, 3->2, 4->3, 5->4...]',
    architectureFact: 'Evasion techniques are rendered harmless without losing the exact byte location in the original message.',
    zDepth: 22,
  },
  {
    step: '03',
    name: 'Verified Indicator Extraction',
    category: 'STRUCTURAL DETECTION',
    badge: 'STAGE 03 // EVIDENCE ANCHORS',
    isDeterministic: true,
    shortTag: 'VERIFIED INDICATORS',
    description: 'Deterministic detectors identify exact suspicious phrases, lookalike domains, credential harvesters, and coercive pretexts.',
    forensicProof: 'Every indicator carries verified [start, end] character range offsets, category classification, and severity weights.',
    inputSnippet: 'Extractors: URL_LOOKALIKE + URGENCY_COERCION + FINANCIAL_PRETEXT',
    outputSnippet: 'Found 3 indicators: Lookalike [54..89], Urgency [0..23], Pretext [41..51]',
    architectureFact: 'Evidence is established before scoring. No indicator can be inferred without verifiable text or URL anchors.',
    zDepth: 38,
  },
  {
    step: '04',
    name: 'Deterministic Risk Engine',
    category: 'SCORING AUTHORITY',
    badge: 'STAGE 04 // MATHEMATICAL AUTHORITY',
    isDeterministic: true,
    shortTag: 'RISK FORMULA',
    description: 'Computes overall risk score (0-100) using locked base weights, compound synergy bonuses, and threshold clamping.',
    forensicProof: 'Scoring formula is pure deterministic code. AI cannot alter risk levels, add points, or soften findings.',
    inputSnippet: 'Base: 35 + 20 + 15 = 70 | Synergy: [COERCION + URL] = +15 bonus',
    outputSnippet: 'Total Score: 85/100 (HIGH RISK) | Clamped [0..100] | Pivot: LOOKALIKE_URL',
    architectureFact: 'Zero hallucinated certainty. The risk score is mathematically reproducible down to the single point.',
    zDepth: 26,
  },
  {
    step: '05',
    name: 'Contextual Interpretation Layer',
    category: 'DOWNSTREAM AI ANALYSIS',
    badge: 'STAGE 05 // STRICTLY DOWNSTREAM',
    isDeterministic: false,
    shortTag: 'AI CONTEXT LAYER',
    description: 'Generates human-readable narrative and psychological breakdown strictly downstream of verified evidence.',
    forensicProof: 'Contextual only. If AI times out or fails, deterministic report continues with 100% fidelity.',
    inputSnippet: 'Injected Context: Verified Indicators [3] + Score [85] + Institution [Chase]',
    outputSnippet: 'Analysis: "Attacker impersonates Chase banking alert using synthetic urgency..."',
    architectureFact: 'AI is downstream. The machine model never computes risk scores or invents evidence.',
    zDepth: 14,
  },
];

export const EvidenceFirstSection: React.FC = () => {
  const [selectedStageIdx, setSelectedStageIdx] = useState<number>(2); // Default to Stage 03 (Verified Indicators)
  const apparatusRef = useRef<HTMLDivElement | null>(null);

  const activeStage = PIPELINE_STAGES[selectedStageIdx];

  // Mouse-responsive parallax interaction (~0.20-0.30x relative response)
  useEffect(() => {
    const el = apparatusRef.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      return;
    }

    let targetRotX = 0;
    let targetRotY = 0;
    let targetPanX = 0;
    let targetPanY = 0;
    let currentRotX = 0;
    let currentRotY = 0;
    let currentPanX = 0;
    let currentPanY = 0;
    let animId: number;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const nx = (x - rect.width / 2) / (rect.width / 2);
      const ny = (y - rect.height / 2) / (rect.height / 2);

      // Subtle parallax response ~0.20-0.30x
      targetRotX = -ny * 4.5; // Max 4.5 deg tilt
      targetRotY = nx * 6;    // Max 6 deg tilt
      targetPanX = nx * 10;   // Max 10px pan
      targetPanY = ny * 8;    // Max 8px pan
    };

    const handleMouseLeave = () => {
      targetRotX = 0;
      targetRotY = 0;
      targetPanX = 0;
      targetPanY = 0;
    };

    const updateParallax = () => {
      currentRotX += (targetRotX - currentRotX) * 0.08;
      currentRotY += (targetRotY - currentRotY) * 0.08;
      currentPanX += (targetPanX - currentPanX) * 0.08;
      currentPanY += (targetPanY - currentPanY) * 0.08;

      el.style.setProperty('--apparatus-tilt-x', `${currentRotX.toFixed(2)}deg`);
      el.style.setProperty('--apparatus-tilt-y', `${currentRotY.toFixed(2)}deg`);
      el.style.setProperty('--apparatus-pan-x', `${currentPanX.toFixed(2)}px`);
      el.style.setProperty('--apparatus-pan-y', `${currentPanY.toFixed(2)}px`);

      animId = requestAnimationFrame(updateParallax);
    };

    animId = requestAnimationFrame(updateParallax);
    el.addEventListener('mousemove', handleMouseMove, { passive: true });
    el.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    return () => {
      cancelAnimationFrame(animId);
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <section id="evidence-first" className="landing-section evidence-first-section" aria-label="Evidence First Methodology">
      <div className="section-container">
        {/* Section Header */}
        <div className="section-header-block">
          <div className="section-label-tag">01 // CORE METHODOLOGY</div>
          <h2 className="section-title">
            Evidence comes before interpretation.
          </h2>
          <p className="section-desc">
            Conventional security tools use opaque probabilistic AI that hallucinates risk.
            Scamvera establishes deterministic, verified evidence first — ensuring every risk point is grounded in forensic fact.
          </p>
        </div>

        {/* Spatial 3D Pipeline Architecture */}
        <div ref={apparatusRef} className="spatial-pipeline-container">
          {/* Left: Suspended Vertical Forensic Analysis Apparatus */}
          <div className="pipeline-spatial-stage" role="tablist" aria-label="Forensic Investigation Pipeline Stages">
            {/* BACKGROUND: Dimensional Environment Gantry Grid & Depth Calibration */}
            <div className="apparatus-plane-back" aria-hidden="true">
              <div className="apparatus-gantry-backdrop" />
              <div className="apparatus-gantry-grid" />
              <div className="apparatus-depth-glow" />
              <div className="apparatus-gantry-ticks">
                <span className="gantry-tick tick-500">500mm // DOWNSTREAM AI</span>
                <span className="gantry-tick tick-375">375mm // RISK AUTHORITY</span>
                <span className="gantry-tick tick-250">250mm // EVIDENCE ANCHORS</span>
                <span className="gantry-tick tick-125">125mm // CANONICAL DECODE</span>
                <span className="gantry-tick tick-000">000mm // INGESTION BASE</span>
              </div>
            </div>

            {/* MIDGROUND: Heavy Vertical Evidence Spine with Mechanical Mounting Couplers & Signal */}
            <div className="apparatus-plane-mid" aria-hidden="true">
              <div className="spine-alloy-rail left-rail" />
              <div className="spine-alloy-rail right-rail" />

              {/* Mechanical Stage Brackets Locking each Component to the Central Spine */}
              <div className="spine-brackets-group">
                {[0, 1, 2, 3, 4].map((idx) => (
                  <div key={idx} className={`spine-mount-bracket bracket-pos-${idx} ${selectedStageIdx === idx ? 'bracket-active' : ''}`} />
                ))}
              </div>

              {/* Ascending Signal Conduit with Flowing Photon Pulse */}
              <div className="pipeline-svg-spine">
                <svg viewBox="0 0 100 520" preserveAspectRatio="none" className="spine-svg-canvas">
                  <defs>
                    <linearGradient id="spineGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
                      <stop offset="40%" stopColor="#38bdf8" stopOpacity="0.8" />
                      <stop offset="75%" stopColor="#818cf8" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.9" />
                    </linearGradient>
                    <filter id="spineGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>
                  {/* Structural Guide Track */}
                  <line x1="50" y1="20" x2="50" y2="500" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="6" />
                  {/* Central Conductor Line */}
                  <line x1="50" y1="20" x2="50" y2="500" stroke="url(#spineGradient)" strokeWidth="2.5" strokeDasharray="4 3" />
                  {/* Flowing Pulse Packet */}
                  <circle cx="50" cy="500" r="4.5" fill="#38bdf8" filter="url(#spineGlow)" className="spine-pulse-bead" />
                </svg>
              </div>

              {/* Floating Ambient Evidence Particles along the Gantry */}
              <div className="apparatus-particles-field">
                <div className="apparatus-particle p1" />
                <div className="apparatus-particle p2" />
                <div className="apparatus-particle p3" />
                <div className="apparatus-particle p4" />
              </div>
            </div>

            {/* FOREGROUND: Investigation Stage Components Positioned at Varying Z-Depths */}
            <div className="apparatus-plane-fore">
              {/* Downstream Badge Accent (Pointing out AI is strictly downstream) */}
              <div className="downstream-banner-tag" aria-hidden="true">
                <span className="downstream-arrow">▲</span>
                <span className="downstream-label">AI IS STRICTLY DOWNSTREAM</span>
              </div>

              {/* 5 Layered 3D Stage Planes attached to the Machine Spine */}
              <div className="pipeline-stage-stack">
                {/* Reverse mapping so Stage 05 (AI) is visually at the top and Stage 01 (Raw) at the base */}
                {[...PIPELINE_STAGES].reverse().map((stage) => {
                  const originalIdx = PIPELINE_STAGES.findIndex((s) => s.step === stage.step);
                  const isSelected = selectedStageIdx === originalIdx;
                  const isDownstreamAI = !stage.isDeterministic;

                  return (
                    <button
                      key={stage.step}
                      type="button"
                      role="tab"
                      id={`pipeline-tab-${stage.step}`}
                      aria-selected={isSelected}
                      aria-controls={`pipeline-panel-${stage.step}`}
                      className={`spatial-stage-plate ${isSelected ? 'plate-active' : ''} ${isDownstreamAI ? 'plate-ai-layer' : 'plate-deterministic'}`}
                      style={{
                        '--stage-depth': `${stage.zDepth}px`,
                        '--stage-order': originalIdx,
                      } as React.CSSProperties}
                      onClick={() => setSelectedStageIdx(originalIdx)}
                    >
                      {/* Physical Coupler Anchor Pin connecting to the Central Spine */}
                      <div className="plate-chassis-anchor" aria-hidden="true">
                        <span className="anchor-rivet" />
                        <span className="anchor-joint-line" />
                      </div>

                      <div className="plate-inner-grid">
                        <div className="plate-step-col">
                          <span className="plate-num">{stage.step}</span>
                          <div className="plate-node-indicator" />
                        </div>
                        <div className="plate-meta-col">
                          <div className="plate-header-row">
                            <span className="plate-name">{stage.name}</span>
                            <span className={`plate-badge ${stage.isDeterministic ? 'badge-deterministic' : 'badge-contextual'}`}>
                              {stage.isDeterministic ? 'DETERMINISTIC' : 'DOWNSTREAM AI'}
                            </span>
                          </div>
                          <p className="plate-tagline">{stage.shortTag} — {stage.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pipeline-base-label" aria-hidden="true">
                <span className="base-label-icon">▼</span>
                <span>RAW FORENSIC INGESTION BOUNDARY // ISOLATED</span>
              </div>
            </div>
          </div>

          {/* Right: High-Precision Forensic Telemetry Inspector */}
          <div
            className="pipeline-inspector-pane"
            id={`pipeline-panel-${activeStage.step}`}
            role="tabpanel"
            aria-labelledby={`pipeline-tab-${activeStage.step}`}
          >
            {/* Inspector Top Bar */}
            <div className="inspector-head">
              <div className="inspector-meta-row">
                <span className="inspector-badge">{activeStage.badge}</span>
                <span className={`inspector-status-badge ${activeStage.isDeterministic ? 'status-locked' : 'status-readonly'}`}>
                  {activeStage.isDeterministic ? 'MATHEMATICALLY LOCKED' : 'CONTEXTUAL READ-ONLY'}
                </span>
              </div>
              <h3 className="inspector-stage-title">{activeStage.name}</h3>
              <p className="inspector-stage-summary">{activeStage.description}</p>
            </div>

            {/* Real Forensic Telemetry Terminal Mock */}
            <div className="inspector-telemetry-box">
              <div className="telemetry-box-top">
                <div className="box-dots" aria-hidden="true">
                  <span className="b-dot b-red" />
                  <span className="b-dot b-yellow" />
                  <span className="b-dot b-green" />
                </div>
                <span className="box-channel-label">STAGE_EXECUTION_STREAM // PROVENANCE</span>
                <span className="box-mode-label">{activeStage.category}</span>
              </div>

              <div className="telemetry-box-body">
                <div className="telemetry-row">
                  <span className="t-key">STAGE INPUT:</span>
                  <code className="t-code text-cyan">{activeStage.inputSnippet}</code>
                </div>
                <div className="telemetry-row">
                  <span className="t-key">TRANSFORMATION:</span>
                  <code className="t-code text-green">{activeStage.outputSnippet}</code>
                </div>
                <div className="telemetry-row">
                  <span className="t-key">FORENSIC PROOF:</span>
                  <span className="t-val">{activeStage.forensicProof}</span>
                </div>
              </div>
            </div>

            {/* Architectural Rule Callout */}
            <div className="inspector-rule-card">
              <div className="rule-card-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div className="rule-card-content">
                <span className="rule-title">ARCHITECTURAL GUARANTEE</span>
                <p className="rule-desc">{activeStage.architectureFact}</p>
              </div>
            </div>

            {/* Contrast Strip: Conventional vs Scamvera */}
            <div className="pipeline-contrast-strip">
              <div className="contrast-side contrast-traditional">
                <div className="contrast-head text-muted">CONVENTIONAL CHATBOTS</div>
                <p className="contrast-body">
                  Speculative paragraphs based on ungrounded token probability. Generates false certainty and hallucinations without measurable evidence anchors.
                </p>
              </div>
              <div className="contrast-side contrast-scamvera">
                <div className="contrast-head text-cyan">SCAMVERA WORKSTATION</div>
                <p className="contrast-body">
                  Anchored to exact character offsets, verified institutional registries, and locked mathematical risk scoring. AI is strictly downstream and contextual.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
