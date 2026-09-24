import React, { useRef, useState } from 'react';
import type { ExampleCase, MessageType } from '../types';

interface WorkstationInputProps {
  text: string;
  onChangeText: (text: string) => void;
  messageType: MessageType;
  onChangeMessageType: (type: MessageType) => void;
  onInvestigate: () => void;
  onClear: () => void;
  isLoading: boolean;
  examples: ExampleCase[];
  onSelectExample: (example: ExampleCase) => void;
  onInvestigateScreenshot?: (base64: string, filename: string) => void;
  onInvestigateUrl?: (url: string) => void;
}

type IngestionMode = 'text' | 'url' | 'screenshot';

export const WorkstationInput: React.FC<WorkstationInputProps> = ({
  text,
  onChangeText,
  messageType,
  onChangeMessageType,
  onInvestigate,
  onClear,
  isLoading,
  examples,
  onSelectExample,
  onInvestigateScreenshot,
  onInvestigateUrl,
}) => {
  const [ingestionMode, setIngestionMode] = useState<IngestionMode>('text');
  const [isAnonymized, setIsAnonymized] = useState(false);

  // URL Mode state
  const [urlInput, setUrlInput] = useState('');

  // Screenshot Mode state
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<{ name: string; size: number } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const characterCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  // PII mask preview function
  const handleToggleAnonymize = (enable: boolean) => {
    setIsAnonymized(enable);
    if (enable) {
      const masked = text
        .replace(/([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '[REDACTED_EMAIL]')
        .replace(/\b(?:\+?1[-. ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})\b/g, '[REDACTED_PHONE]')
        .replace(/\b(?:\d[ -]*?){13,16}\b/g, '[REDACTED_CARD]');
      onChangeText(masked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isLoading && text.trim().length >= 5) {
        onInvestigate();
      }
    }
  };

  // Screenshot file processing
  const handleProcessFile = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Only standard image files (PNG, JPEG, WebP, GIF) are supported.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size exceeds the 5MB maximum limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setScreenshotPreview(base64);
      setScreenshotFile({ name: file.name, size: file.size });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleRunScreenshotScan = () => {
    if (screenshotPreview && screenshotFile && onInvestigateScreenshot) {
      onInvestigateScreenshot(screenshotPreview, screenshotFile.name);
    }
  };

  const handleRunUrlScan = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (onInvestigateUrl) {
      onInvestigateUrl(trimmed);
    } else {
      onChangeText(`Target link to investigate: ${trimmed}`);
      onChangeMessageType('sms');
      onInvestigate();
    }
  };

  return (
    <div className="panel-card workstation-card" role="region" aria-label="Investigation Input">
      {/* Terminal Header & Mode Tabs */}
      <div className="panel-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <span style={{ fontWeight: 700, letterSpacing: '0.5px' }}>INVESTIGATION WORKSPACE</span>
        </div>

        {/* Ingestion Mode Switcher */}
        <div className="mode-toggle-group" style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            className={`btn-tab ${ingestionMode === 'text' ? 'active' : ''}`}
            onClick={() => setIngestionMode('text')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <span>Message Text</span>
          </button>
          <button
            type="button"
            className={`btn-tab ${ingestionMode === 'url' ? 'active' : ''}`}
            onClick={() => setIngestionMode('url')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            <span>Web Address (URL)</span>
          </button>
          <button
            type="button"
            className={`btn-tab ${ingestionMode === 'screenshot' ? 'active' : ''}`}
            onClick={() => setIngestionMode('screenshot')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <span>Screenshot / Image</span>
          </button>
        </div>
      </div>

      {/* MODE 1: TEXT / MESSAGE INGESTION */}
      {ingestionMode === 'text' && (
        <>
          {/* Quick Preset Selector */}
          <div className="preset-selector-row">
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Quick Examples:</span>
            <select
              className="preset-select"
              onChange={(e) => {
                const found = examples.find((ex) => ex.id === e.target.value);
                if (found) onSelectExample(found);
              }}
              defaultValue=""
              aria-label="Load example message"
            >
              <option value="" disabled>Select an example scenario...</option>
              {examples.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  [{ex.expectedRisk}] {ex.title}
                </option>
              ))}
            </select>
          </div>

          {/* Channel Selector */}
          <div className="channel-selector" role="group" aria-label="Message Channel">
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', alignSelf: 'center', marginRight: '4px' }}>
              Channel:
            </span>
            {(
              [
                { id: 'sms', label: 'SMS' },
                { id: 'email', label: 'Email' },
                { id: 'social_dm', label: 'Social DM' },
                { id: 'voice_transcript', label: 'Voice Transcript' },
                { id: 'unknown', label: 'Unknown' },
              ] as Array<{ id: MessageType; label: string }>
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                className={`channel-btn ${messageType === item.id ? 'active' : ''}`}
                onClick={() => onChangeMessageType(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Text Area */}
          <div className="input-wrapper">
            <textarea
              className="investigation-textarea"
              placeholder="Paste suspicious text message, email, chat message, or urgent notice to investigate..."
              value={text}
              onChange={(e) => onChangeText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={7}
              spellCheck={false}
              aria-label="Suspicious text to investigate"
            />
          </div>

          {/* Telemetry and metadata */}
          <div className="input-telemetry">
            <div className="telemetry-counts">
              <span>Characters: {characterCount.toLocaleString()} / 10,000</span>
              <span>Words: {wordCount.toLocaleString()}</span>
            </div>

            <div style={{ color: characterCount < 5 ? '#f59e0b' : '#34d399', fontSize: '12px' }}>
              {characterCount === 0
                ? 'Ready for input'
                : characterCount < 5
                ? 'Min 5 characters required'
                : 'Ready to investigate (Ctrl + Enter)'}
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="input-actions">
            <label className="privacy-toggle" title="Mask common emails, phone numbers, and card numbers before running scan">
              <input
                type="checkbox"
                checked={isAnonymized}
                onChange={(e) => handleToggleAnonymize(e.target.checked)}
              />
              <span>Redact PII Preview (Emails, Phones, Cards)</span>
            </label>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={onClear}
                disabled={isLoading || text.length === 0}
              >
                Clear
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={onInvestigate}
                disabled={isLoading || text.trim().length < 5 || text.length > 10000}
              >
                {isLoading ? 'Investigating...' : 'Run Investigation'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* MODE 2: DIRECT URL PROBER */}
      {ingestionMode === 'url' && (
        <div style={{ display: 'grid', gap: '16px', marginTop: '12px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Enter a web address or domain to analyze its structure, lookalike characters, and suspicious extensions. The analysis is passive and never visits the destination page directly.
          </p>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="investigation-textarea"
              style={{
                flex: 1,
                minWidth: '280px',
                height: '44px',
                padding: '10px 14px',
                fontSize: '14px',
                fontFamily: 'var(--font-mono)',
              }}
              placeholder="e.g. https://usps-redelivery-notice.top/track or chase-verify.com"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRunUrlScan()}
              disabled={isLoading}
              aria-label="URL to inspect"
            />
            <button
              type="button"
              className="btn-primary"
              onClick={handleRunUrlScan}
              disabled={isLoading || urlInput.trim().length === 0}
            >
              {isLoading ? 'Analyzing...' : 'Inspect Web Address'}
            </button>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <span>Passive structural analysis: the system does not visit the webpage or follow redirects.</span>
          </div>
        </div>
      )}

      {/* MODE 3: SCREENSHOT OCR DROPZONE */}
      {ingestionMode === 'screenshot' && (
        <div style={{ display: 'grid', gap: '16px', marginTop: '12px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Upload a screenshot of a suspicious message, email, or chat. We'll extract the visible text and check it for warning signs.
          </p>

          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleProcessFile(e.target.files[0]);
              }
            }}
          />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`screenshot-dropzone ${isDragOver ? 'drag-over' : ''} ${screenshotPreview ? 'has-preview' : ''}`}
          >
            {screenshotPreview ? (
              <div className="preview-container">
                <div className="preview-image-card">
                  <img
                    src={screenshotPreview}
                    alt="Uploaded screenshot preview"
                    className="preview-img-natural"
                  />
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600, marginTop: '10px' }}>
                  {screenshotFile?.name} ({(screenshotFile!.size / 1024).toFixed(1)} KB)
                </div>
                <span style={{ fontSize: '12px', color: 'var(--accent-cyan)', marginTop: '2px' }}>
                  Click or drag to choose a different image
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Drag &amp; drop screenshot here, or click to browse
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Supports PNG, JPEG, WebP, GIF (Max 5MB). Processed strictly in-memory (zero server disk storage).
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            {screenshotPreview && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setScreenshotPreview(null);
                  setScreenshotFile(null);
                }}
                disabled={isLoading}
              >
                Remove Image
              </button>
            )}

            <button
              type="button"
              className="btn-primary"
              onClick={handleRunScreenshotScan}
              disabled={isLoading || !screenshotPreview}
            >
              {isLoading ? 'Extracting & Scanning...' : 'Scan Screenshot'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
