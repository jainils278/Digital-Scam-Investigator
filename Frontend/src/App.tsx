import React, { useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { HistoryDrawer } from './components/HistoryDrawer';
import { ThreatReferenceModal } from './components/ThreatReferenceModal';
import type { AttachedEvidenceImage } from './components/WorkstationInput';
import { InvestigationEnvironment } from './components/investigation/InvestigationEnvironment';
import { CinematicLanding } from './components/landing/CinematicLanding';
import type { EvidenceImageInput, ExampleCase, InvestigationReport, LocalHistoryItem, MessageType, VictimState } from './types';
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
  // Navigation & View Routing State
  const [currentView, setCurrentView] = useState<'landing' | 'workstation'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const hash = window.location.hash;
      const search = new URLSearchParams(window.location.search);
      if (path === '/investigate' || hash === '#investigate' || search.get('view') === 'investigate') {
        return 'workstation';
      }
    }
    return 'landing';
  });

  // Input State
  const [inputText, setInputText] = useState('');
  const [attachedImages, setAttachedImages] = useState<AttachedEvidenceImage[]>([]);
  const [messageType, setMessageType] = useState<MessageType>('unknown');
  const [victimState, setVictimState] = useState<VictimState>('RECEIVED_MESSAGE_ONLY');

  // Investigation Pipeline State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentReport, setCurrentReport] = useState<InvestigationReport | null>(null);
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string | null>(null);

  // Clean up object URLs on component unmount
  const attachedImagesRef = useRef<AttachedEvidenceImage[]>(attachedImages);
  useEffect(() => {
    attachedImagesRef.current = attachedImages;
  }, [attachedImages]);

  useEffect(() => {
    return () => {
      attachedImagesRef.current.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, []);

  const handleAddImages = (files: File[]) => {
    const validMimes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    const newItems: AttachedEvidenceImage[] = [];

    for (const file of files) {
      if (attachedImages.length + newItems.length >= 5) {
        setErrorMessage('You can attach a maximum of 5 screenshots per investigation.');
        break;
      }
      if (!validMimes.includes(file.type)) {
        setErrorMessage(`"${file.name}" can't be used. Please choose a PNG, JPG, WebP, or GIF image.`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage(`"${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 5MB.`);
        continue;
      }
      if (file.size === 0) {
        setErrorMessage(`"${file.name}" contains 0 bytes.`);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      newItems.push({
        id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        previewUrl,
        filename: file.name,
        byteSize: file.size,
      });
    }

    if (newItems.length > 0) {
      setAttachedImages((prev) => [...prev, ...newItems]);
    }
  };

  const handleRemoveImage = (id: string) => {
    setAttachedImages((prev) => {
      const found = prev.find((i) => i.id === id);
      if (found?.previewUrl) {
        URL.revokeObjectURL(found.previewUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

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
    // Strip previewDataUrl before saving to localStorage to maintain zero retention & prevent quota issues
    const cleanReport: InvestigationReport = {
      ...report,
      screenshotMeta: report.screenshotMeta
        ? { ...report.screenshotMeta, previewDataUrl: undefined }
        : undefined,
      screenshotsMeta: report.screenshotsMeta
        ? report.screenshotsMeta.map((s) => ({ ...s, previewDataUrl: undefined }))
        : undefined,
    };

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
      report: cleanReport,
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

  // 2. Unified Multimodal Investigation Action
  const handleInvestigate = async () => {
    const trimmedText = inputText.trim();
    const hasText = trimmedText.length >= 5;
    const hasImages = attachedImages.length > 0;
    const hasUrl = /(?:https?:\/\/|www\.)[^\s<>"'{}|\\^`]+/gi.test(trimmedText);

    if (!hasText && !hasImages && !hasUrl) {
      setErrorMessage('Add a message, URL, or screenshot to investigate.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSelectedIndicatorId(null);

    try {
      // Convert attached images to base64 in-memory
      let imagePayloads: EvidenceImageInput[] | undefined = undefined;
      if (attachedImages.length > 0) {
        imagePayloads = await Promise.all(
          attachedImages.map((img) => {
            return new Promise<EvidenceImageInput>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  imageBase64: reader.result as string,
                  filename: img.filename,
                });
              };
              reader.onerror = reject;
              reader.readAsDataURL(img.file);
            });
          })
        );
      }

      const response = await fetch('/api/investigate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: trimmedText || undefined,
          images: imagePayloads,
          messageType,
          victimState,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.error?.message || 'Failed to complete investigation analysis.');
      }

      const report: InvestigationReport = data.report;

      // Attach client-side object preview URLs so thumbnails display immediately in the report
      if (attachedImages.length > 0) {
        if (report.screenshotsMeta && report.screenshotsMeta.length > 0) {
          report.screenshotsMeta.forEach((meta, idx) => {
            if (attachedImages[idx]) {
              meta.previewDataUrl = attachedImages[idx].previewUrl;
            }
          });
        }
        if (report.screenshotMeta && attachedImages[0]) {
          report.screenshotMeta.previewDataUrl = attachedImages[0].previewUrl;
        }
      }

      setCurrentReport(report);
      saveHistoryItem(report);
    } catch (err: any) {
      setErrorMessage(formatFriendlyError(err, 'An error occurred while connecting to the investigation engine.'));
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Clear & Reset Actions
  const handleClear = () => {
    setInputText('');
    attachedImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setAttachedImages([]);
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
    attachedImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setAttachedImages([]);
    setInputText(item.report.rawText);
    setMessageType(item.report.inputMeta.messageType);
    setCurrentReport(item.report);
    setSelectedIndicatorId(null);
    setErrorMessage(null);
  };

  // 1b. Synchronize native browser history / popstate
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      const search = new URLSearchParams(window.location.search);
      if (path === '/investigate' || hash === '#investigate' || search.get('view') === 'investigate') {
        setCurrentView('workstation');
      } else {
        setCurrentView('landing');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLaunchWorkstation = () => {
    if (window.location.pathname !== '/investigate') {
      window.history.pushState(null, '', '/investigate');
    }
    setCurrentView('workstation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateHome = () => {
    if (window.location.pathname !== '/') {
      window.history.pushState(null, '', '/');
    }
    setCurrentView('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 6. Unified Report Download Action
  const handleDownloadReport = () => {
    if (!currentReport) return;
    generateFullInvestigationReport(currentReport);
  };

  if (currentView === 'landing') {
    return <CinematicLanding onLaunchWorkstation={handleLaunchWorkstation} />;
  }

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
        onNavigateHome={handleNavigateHome}
      />

      <main className="main-content">
        <InvestigationEnvironment
          inputText={inputText}
          onChangeInputText={setInputText}
          messageType={messageType}
          onChangeMessageType={setMessageType}
          attachedImages={attachedImages}
          onAddImages={handleAddImages}
          onRemoveImage={handleRemoveImage}
          victimState={victimState}
          onChangeVictimState={setVictimState}
          isLoading={isLoading}
          onInvestigate={handleInvestigate}
          onClear={handleClear}
          examples={examples}
          onSelectExample={handleSelectExample}
          report={currentReport}
          selectedIndicatorId={selectedIndicatorId}
          onSelectIndicator={setSelectedIndicatorId}
          onDownloadReport={handleDownloadReport}
          errorMessage={errorMessage}
          onDismissError={() => setErrorMessage(null)}
        />
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
