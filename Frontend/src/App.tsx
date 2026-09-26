import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { HistoryDrawer } from './components/HistoryDrawer';
import { InvestigationProgress } from './components/InvestigationProgress';
import { InvestigationReportView } from './components/InvestigationReportView';
import { ThreatReferenceModal } from './components/ThreatReferenceModal';
import { WorkstationInput } from './components/WorkstationInput';
import type { ExampleCase, InvestigationReport, LocalHistoryItem, MessageType, VictimState } from './types';
import { generateFullInvestigationReport } from './utils/reportGenerator';

const STORAGE_KEY = 'scam_investigator_history';

function formatFriendlyError(err: any, fallbackMessage: string): string {
  const code = err?.code || '';
  const raw = err?.message || fallbackMessage;

  if (code === 'OCR_PROVIDER_ERROR' || raw.includes('OCR_PROVIDER_ERROR')) {
    return 'The optical recognition service encountered a provider issue. Please try again or paste the text directly.';
  }
  if (code === 'OCR_CONFIGURATION_ERROR' || raw.includes('OCR_CONFIGURATION_ERROR')) {
    return 'Optical character recognition is currently not configured. Please paste the message text directly.';
  }
  if (
    code === 'LOW_CONTRAST_OR_UNREADABLE' ||
    raw.includes('LOW_CONTRAST_OR_UNREADABLE') ||
    raw.includes('No clear text could be recognized') ||
    raw.includes('Could not extract sufficient readable text')
  ) {
    return "We couldn't read enough text from this image. Try uploading a clearer screenshot with the message fully visible.";
  }
  if (code === 'OVERSIZED_IMAGE' || raw.includes('OVERSIZED_IMAGE')) {
    return 'The image file size exceeds the 5MB maximum limit. Please upload a smaller image.';
  }
  if (
    code === 'INVALID_IMAGE' ||
    raw.includes('UNSUPPORTED_IMAGE_FORMAT') ||
    raw.includes('UNSAFE_FORMAT')
  ) {
    return 'Please upload a standard image file (PNG, JPEG, WebP, or GIF).';
  }
  if (code === 'EMPTY_IMAGE' || raw.includes('EMPTY_IMAGE')) {
    return 'The selected image file contains zero bytes. Please select a valid screenshot.';
  }
  if (raw.includes('Failed to fetch') || raw.includes('NetworkError')) {
    return 'Unable to connect to the investigation engine. Please verify that the server is running.';
  }
  return raw;
}

export const App: React.FC = () => {
  // Input State
  const [inputText, setInputText] = useState('');
  const [messageType, setMessageType] = useState<MessageType>('unknown');
  const [victimState, setVictimState] = useState<VictimState>('RECEIVED_MESSAGE_ONLY');

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
      // Ignore parse errors
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
      primaryCategory: report.riskAssessment.primaryCategories[0] || 'General Communication',
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

  // 2. Text Investigation Action
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
          victimState,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.error?.message || 'Failed to analyze text.');
      }

      const report: InvestigationReport = data.report;
      setCurrentReport(report);
      saveHistoryItem(report);

      setTimeout(() => {
        const reportElem = document.getElementById('investigation-report-section');
        if (reportElem) {
          reportElem.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err: any) {
      setErrorMessage(formatFriendlyError(err, 'An error occurred while connecting to the investigation engine.'));
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
        const error: any = new Error(data?.error?.message || 'Failed to analyze screenshot image.');
        error.code = data?.error?.code;
        throw error;
      }

      const report: InvestigationReport = data.report;
      if (report.screenshotMeta) {
        report.screenshotMeta.previewDataUrl = imageBase64;
      }
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
      setErrorMessage(formatFriendlyError(err, 'An error occurred during screenshot analysis.'));
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
      const fullRes = await fetch('/api/investigate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `Target link to investigate: ${url}`,
          messageType: 'sms',
        }),
      });

      const fullData = await fullRes.json();
      if (!fullRes.ok || !fullData.success) {
        throw new Error(fullData?.error?.message || 'Failed to inspect target URL.');
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
      setErrorMessage(formatFriendlyError(err, 'An error occurred during URL investigation.'));
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

  // 6. Unified Report Download Action
  const handleDownloadReport = () => {
    if (!currentReport) return;
    generateFullInvestigationReport(currentReport);
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
        hasActiveReport={!!currentReport}
        onDownloadReport={handleDownloadReport}
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
            victimState={victimState}
            onChangeVictimState={setVictimState}
          />

          {/* Friendly Error Notice */}
          {errorMessage && (
            <div
              className="panel-card error-card"
              role="alert"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <div>
                  <div style={{ color: '#fca5a5', fontSize: '14px', fontWeight: 600 }}>Investigation Notice</div>
                  <div style={{ color: '#f87171', fontSize: '13px', marginTop: '2px' }}>{errorMessage}</div>
                </div>
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setErrorMessage(null)}
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                Dismiss
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
              onDownloadReport={handleDownloadReport}
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
