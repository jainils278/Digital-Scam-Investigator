import React, { useRef, useState } from 'react';
import type { ExampleCase, MessageType } from '../types';

interface WorkstationInputProps {
  text: string;
  onChangeText: (newText: string) => void;
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
  const estimatedTokens = Math.ceil(characterCount / 4);

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
      alert('Only image files (PNG, JPEG, WebP, GIF) are supported.');
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
      onChangeText(`Suspicious link destination to investigate: ${trimmed}`);
      onChangeMessageType('sms');
      onInvestigate();
    }
  };

  return (
    <div className="panel-card">
      {/* Terminal Title & Ingestion Mode Switcher */}
      <div className="panel-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
        <div className="panel-title">
          <span>🔍</span>
          <span>INVESTIGATION TERMINAL</span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            className={`btn-secondary ${ingestionMode === 'text' ? 'active' : ''}`}
            onClick={() => setIngestionMode('text')}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              backgroundColor: ingestionMode === 'text' ? 'var(--bg-secondary)' : 'transparent',
              color: ingestionMode === 'text' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              borderColor: ingestionMode === 'text' ? 'var(--accent-cyan)' : 'var(--border-subtle)',
            }}
          >
            📝 Text / Message
          </button>
          <button
            type="button"
            className={`btn-secondary ${ingestionMode === 'url' ? 'active' : ''}`}
            onClick={() => setIngestionMode('url')}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              backgroundColor: ingestionMode === 'url' ? 'var(--bg-secondary)' : 'transparent',
              color: ingestionMode === 'url' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              borderColor: ingestionMode === 'url' ? 'var(--accent-cyan)' : 'var(--border-subtle)',
            }}
          >
            🔗 Direct URL Prober
          </button>
          <button
            type="button"
            className={`btn-secondary ${ingestionMode === 'screenshot' ? 'active' : ''}`}
            onClick={() => setIngestionMode('screenshot')}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              backgroundColor: ingestionMode === 'screenshot' ? 'var(--bg-secondary)' : 'transparent',
              color: ingestionMode === 'screenshot' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              borderColor: ingestionMode === 'screenshot' ? 'var(--accent-cyan)' : 'var(--border-subtle)',
            }}
          >
            📸 Screenshot OCR
          </button>
        </div>
      </div>

      {/* MODE 1: RAW TEXT INGESTION */}
      {ingestionMode === 'text' && (
        <>
          {/* Channel Selector */}
          <div className="channel-selector">
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', alignSelf: 'center', marginRight: '4px' }}>
              Channel:
            </span>
            {(
              [
                { id: 'sms', label: '📱 SMS / Smishing' },
                { id: 'email', label: '✉️ Email / Phishing' },
                { id: 'social_dm', label: '💬 Social Media DM' },
                { id: 'voice_transcript', label: '🎙️ Voice / Voicemail' },
                { id: 'unknown', label: '📋 Paste / Unknown' },
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

          {/* Educational Presets */}
          {examples.length > 0 && (
            <div className="presets-section">
              <div className="presets-label">
                <span>💡</span>
                <span>Safe Educational Presets (Click to Load):</span>
              </div>
              <div className="preset-chips">
                {examples.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    className="preset-chip"
                    onClick={() => onSelectExample(ex)}
                    title={`${ex.description} (Expected: ${ex.expectedRisk})`}
                  >
                    {ex.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Text Area */}
          <div className="input-wrapper">
            <textarea
              className="investigation-textarea"
              placeholder="Paste suspicious text message, phishing email, social media communication, or urgent notice to investigate..."
              value={text}
              onChange={(e) => onChangeText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={7}
              spellCheck={false}
            />
          </div>

          {/* Telemetry and metadata */}
          <div className="input-telemetry">
            <div className="telemetry-counts">
              <span>Characters: {characterCount} / 10,000</span>
              <span>Words: {wordCount}</span>
              <span>Est. Tokens: ~{estimatedTokens}</span>
            </div>

            <div style={{ color: characterCount < 5 ? '#f59e0b' : '#34d399' }}>
              {characterCount === 0
                ? 'Awaiting input'
                : characterCount < 5
                ? 'Min 5 characters required'
                : 'Ready for defensive scan (Ctrl + Enter)'}
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
                Clear Text
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={onInvestigate}
                disabled={isLoading || text.trim().length < 5 || text.length > 10000}
              >
                {isLoading ? 'Scanning Threat Indicators...' : '🛡️ Run Investigation'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* MODE 2: DIRECT URL PROBER */}
      {ingestionMode === 'url' && (
        <div style={{ display: 'grid', gap: '14px', marginTop: '10px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Submit a standalone URL or domain to inspect for lookalike brand spoofing, high-risk TLDs, Punycode tricks, and threat intelligence without visiting the page directly.
          </p>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="investigation-textarea"
              style={{ flex: 1, minWidth: '280px', height: '42px', padding: '10px 14px', fontSize: '14px', fontFamily: 'var(--font-mono)' }}
              placeholder="e.g. https://usps-redelivery-notice.top/track or chase-verify.com"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRunUrlScan()}
              disabled={isLoading}
            />
            <button
              type="button"
              className="btn-primary"
              onClick={handleRunUrlScan}
              disabled={isLoading || urlInput.trim().length === 0}
            >
              {isLoading ? 'Inspecting Domain...' : '🔍 Probe URL'}
            </button>
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🛡️</span>
            <span>Pre-resolution SSRF protection active: loopback, 127.0.0.1, private RFC-1918 subnets, and cloud metadata IPs are strictly blocked.</span>
          </div>
        </div>
      )}

      {/* MODE 3: SCREENSHOT OCR DROPZONE */}
      {ingestionMode === 'screenshot' && (
        <div style={{ display: 'grid', gap: '14px', marginTop: '10px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Upload or drop a screenshot of a suspicious SMS message, email alert, or chat screen. OCR extracts the text and runs it through the authoritative detection pipeline.
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
            style={{
              border: `2px dashed ${isDragOver ? 'var(--accent-cyan)' : 'var(--border-medium)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '28px',
              textAlign: 'center',
              backgroundColor: isDragOver ? 'rgba(56, 189, 248, 0.05)' : 'var(--bg-input)',
              cursor: 'pointer',
              transition: 'border-color 0.2s, background-color 0.2s',
            }}
          >
            {screenshotPreview ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <img
                  src={screenshotPreview}
                  alt="Screenshot preview"
                  style={{ maxHeight: '180px', maxWidth: '100%', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}
                />
                <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>
                  📷 {screenshotFile?.name} ({(screenshotFile!.size / 1024).toFixed(1)} KB)
                </div>
                <span style={{ fontSize: '11px', color: 'var(--accent-cyan)' }}>
                  Click or drop to choose a different image
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '36px' }}>📸</span>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Drag & Drop Screenshot here, or click to browse
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
              {isLoading ? 'Running OCR & Threat Scan...' : '🚀 Extract OCR & Run Investigation'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
