import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { HistoryDrawer } from './components/HistoryDrawer';
import { InvestigationProgress } from './components/InvestigationProgress';
import { InvestigationReportView } from './components/InvestigationReportView';
import { ThreatReferenceModal } from './components/ThreatReferenceModal';
import { WorkstationInput } from './components/WorkstationInput';
import type { ExampleCase, InvestigationReport, LocalHistoryItem, MessageType } from './types';

const STORAGE_KEY = 'scam_investigator_history';

export const App: React.FC = () => {
  // Input State
  const [inputText, setInputText] = useState('');
  const [messageType, setMessageType] = useState<MessageType>('unknown');

  // Investigation Pipeline State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentReport, setCurrentReport] = useState<InvestigationReport | null>(null);
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string | null>(null);

  // External / System Telemetry
  const [examples, setExamples] = useState<ExampleCase[]>([]);
  const [activeAiMode, setActiveAiMode] = useState('Local Heuristic');
  const [isRealAi, setIsRealAi] = useState(false);

  // Modals & History
  const [history, setHistory] = useState<LocalHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);

  // 1. Initial Data Fetching (Health, Examples, Local History)
  useEffect(() => {
    // Fetch system health & active AI provider info
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.ai) {
          setActiveAiMode(data.ai.providerName);
          setIsRealAi(data.ai.isRealAi);
        }
      })
      .catch(() => {
        // Safe fallback
        setActiveAiMode('Local Heuristic Engine');
        setIsRealAi(false);
      });

    // Fetch educational presets
    fetch('/api/examples')
      .then((res) => res.json())
      .then((data) => {
        if (data.examples && Array.isArray(data.examples)) {
          setExamples(data.examples);
        }
      })
      .catch(() => {
        // Presets not critical
      });

    // Load local history from browser localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
    } catch {
      // Ignore localStorage parse errors
    }
  }, []);

  // Save history to localStorage
  const saveHistoryItem = (report: InvestigationReport) => {
    const newItem: LocalHistoryItem = {
      id: report.id,
      timestamp: report.timestamp,
      preview: report.rawText.slice(0, 100),
      characterCount: report.inputMeta.characterCount,
      messageType: report.inputMeta.messageType,
      riskScore: report.riskAssessment.score,
      riskLevel: report.riskAssessment.level,
      primaryCategory: report.riskAssessment.primaryCategories[0] || 'Unknown',
      indicatorCount: report.observedIndicators.length,
      report,
    };

    setHistory((prev) => {
      // Keep up to 20 recent records locally
      const updated = [newItem, ...prev.filter((item) => item.id !== report.id)].slice(0, 20);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Storage limit handled gracefully
      }
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignored
    }
  };

  // 2. Investigation Action
  const handleInvestigate = async () => {
    if (inputText.trim().length < 5) {
      setErrorMessage('Please enter at least 5 characters to run an investigation.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSelectedIndicatorId(null);

    try {
      const response = await fetch('/api/investigate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          messageType,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.error?.message || 'Failed to analyze text.');
      }

      const report: InvestigationReport = data.report;
      setCurrentReport(report);
      saveHistoryItem(report);

      // Smooth scroll to report view
      setTimeout(() => {
        const reportElem = document.getElementById('investigation-report-section');
        if (reportElem) {
          reportElem.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err: any) {
      setErrorMessage(err?.message || 'An error occurred while connecting to the investigation engine.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Screenshot OCR Investigation Action
  const handleInvestigateScreenshot = async (imageBase64: string, filename: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSelectedIndicatorId(null);

    try {
      const response = await fetch('/api/investigate/screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64,
          filename,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.error?.message || 'Failed to analyze screenshot image.');
      }

      const report: InvestigationReport = data.report;
      setInputText(report.rawText);
      setCurrentReport(report);
      saveHistoryItem(report);

      setTimeout(() => {
        const reportElem = document.getElementById('investigation-report-section');
        if (reportElem) {
          reportElem.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err: any) {
      setErrorMessage(err?.message || 'An error occurred during screenshot analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Direct URL Investigation Action
  const handleInvestigateUrl = async (url: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSelectedIndicatorId(null);

    try {
      // Run standard investigation on URL to generate full report with evidence graph and education
      const fullRes = await fetch('/api/investigate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `Target Link URL to inspect: ${url}`,
          messageType: 'sms',
        }),
      });

      const fullData = await fullRes.json();
      if (!fullRes.ok || !fullData.success) {
        throw new Error(fullData?.error?.message || 'Failed to probe target URL.');
      }

      const report: InvestigationReport = fullData.report;
      setInputText(url);
      setCurrentReport(report);
      saveHistoryItem(report);

      setTimeout(() => {
        const reportElem = document.getElementById('investigation-report-section');
        if (reportElem) {
          reportElem.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err: any) {
      setErrorMessage(err?.message || 'An error occurred during URL investigation.');
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Clear & Reset Actions
  const handleClear = () => {
    setInputText('');
    setErrorMessage(null);
    setCurrentReport(null);
    setSelectedIndicatorId(null);
  };

  const handleSelectExample = (example: ExampleCase) => {
    setInputText(example.text);
    setMessageType(example.channel);
    setErrorMessage(null);
  };

  const handleSelectHistoryItem = (item: LocalHistoryItem) => {
    setInputText(item.report.rawText);
    setMessageType(item.report.inputMeta.messageType);
    setCurrentReport(item.report);
    setSelectedIndicatorId(null);
    setErrorMessage(null);
  };

  const handleCopySummary = () => {
    if (!currentReport) return;
    const { riskAssessment, observedIndicators, aiContext } = currentReport;

    const summaryText = `DIGITAL SCAM INVESTIGATION REPORT (${currentReport.id})
Timestamp: ${new Date(currentReport.timestamp).toLocaleString()}
Risk Assessment: ${riskAssessment.score}/100 (${riskAssessment.level} RISK)
Evidence Strength: ${riskAssessment.evidenceStrength}
Primary Classifications: ${riskAssessment.primaryCategories.join(', ')}

OBSERVED EVIDENCE (${observedIndicators.length} verified indicators):
${observedIndicators
  .map((ind) => `• [${ind.severity}] "${ind.evidence}" — ${ind.name} (offset ${ind.characterRange[0]}-${ind.characterRange[1]})`)
  .join('\n')}

CONTEXTUAL ANALYSIS:
${aiContext.socialEngineeringTactics}

DEFENSIVE MITIGATIONS:
${currentReport.defensiveRecommendations.map((r) => `[${r.priority}] ${r.action}`).join('\n')}

DISCLAIMER:
${currentReport.disclaimer}`;

    navigator.clipboard.writeText(summaryText);
    alert('Investigation summary copied to clipboard.');
  };

  const handleExportJson = () => {
    if (!currentReport) return;
    const blob = new Blob([JSON.stringify(currentReport, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentReport.id}_investigation_report.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-container">
      {/* Workstation Header */}
      <Header
        activeAiMode={activeAiMode}
        isRealAi={isRealAi}
        historyCount={history.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenReference={() => setIsReferenceOpen(true)}
        onNewInvestigation={handleClear}
      />

      <main className="main-content">
        <div className="workstation-grid">
          {/* Primary Ingestion Terminal */}
          <WorkstationInput
            text={inputText}
            onChangeText={setInputText}
            messageType={messageType}
            onChangeMessageType={setMessageType}
            onInvestigate={handleInvestigate}
            onClear={handleClear}
            isLoading={isLoading}
            examples={examples}
            onSelectExample={handleSelectExample}
            onInvestigateScreenshot={handleInvestigateScreenshot}
            onInvestigateUrl={handleInvestigateUrl}
          />

          {/* Error Notice */}
          {errorMessage && (
            <div
              className="panel-card"
              style={{
                borderColor: 'var(--risk-critical-border)',
                backgroundColor: 'var(--risk-critical-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>⚠️</span>
                <span style={{ color: '#fca5a5', fontSize: '14px' }}>{errorMessage}</span>
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleInvestigate}
                style={{ fontSize: '12px' }}
              >
                Retry Scan
              </button>
            </div>
          )}

          {/* Progress State */}
          {isLoading && <InvestigationProgress />}

          {/* Unified Structured Investigation Report View */}
          {currentReport && !isLoading && (
            <InvestigationReportView
              report={currentReport}
              selectedIndicatorId={selectedIndicatorId}
              onSelectIndicator={setSelectedIndicatorId}
              onCopySummary={handleCopySummary}
              onExportJson={handleExportJson}
            />
          )}
        </div>
      </main>

      {/* History Drawer Modal */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        items={history}
        onSelectHistoryItem={handleSelectHistoryItem}
        onClearHistory={handleClearHistory}
      />

      {/* Threat Reference Guide Modal */}
      <ThreatReferenceModal
        isOpen={isReferenceOpen}
        onClose={() => setIsReferenceOpen(false)}
      />
    </div>
  );
};
