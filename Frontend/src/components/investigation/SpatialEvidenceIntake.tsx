import React, { useRef, useState } from 'react';
import type { ExampleCase, MessageType } from '../../types';
import type { AttachedEvidenceImage } from '../WorkstationInput';

export interface SpatialEvidenceIntakeProps {
  text: string;
  onChangeText: (text: string) => void;
  messageType: MessageType;
  onChangeMessageType: (type: MessageType) => void;
  onInvestigate: () => void;
  onClear: () => void;
  isLoading: boolean;
  examples: ExampleCase[];
  onSelectExample: (example: ExampleCase) => void;
  attachedImages?: AttachedEvidenceImage[];
  onAddImages?: (files: File[]) => void;
  onRemoveImage?: (id: string) => void;
  isScanning?: boolean;
  hasActiveReport?: boolean;
}

const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_SCREENSHOTS = 5;
const URL_REGEX = /(?:https?:\/\/|www\.)[^\s<>"'{}|\\^`]+/gi;

export const SpatialEvidenceIntake: React.FC<SpatialEvidenceIntakeProps> = ({
  text,
  onChangeText,
  messageType,
  onChangeMessageType,
  onInvestigate,
  onClear,
  isLoading,
  examples,
  onSelectExample,
  attachedImages = [],
  onAddImages,
  onRemoveImage,
  isScanning = false,
  hasActiveReport = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isAnonymized, setIsAnonymized] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-detect URLs from text
  const detectedUrls = React.useMemo(() => {
    return text.match(URL_REGEX) || [];
  }, [text]);

  const hasContent = text.trim().length > 0 || attachedImages.length > 0;
  const canSubmit = (text.trim().length >= 5 || attachedImages.length > 0 || detectedUrls.length > 0) && !isLoading;

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setFileError(null);

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (attachedImages.length + validFiles.length >= MAX_SCREENSHOTS) {
        setFileError(`Maximum limit of ${MAX_SCREENSHOTS} screenshots reached.`);
        break;
      }
      if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
        setFileError(`"${file.name}" is not supported. Use PNG, JPG, WebP, or GIF.`);
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setFileError(`"${file.name}" exceeds 5MB limit.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0 && onAddImages) {
      onAddImages(validFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const toggleAnonymization = () => {
    if (!isAnonymized) {
      let scrubbed = text;
      scrubbed = scrubbed.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE REDACTED]');
      scrubbed = scrubbed.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL REDACTED]');
      scrubbed = scrubbed.replace(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, '[CARD REDACTED]');
      onChangeText(scrubbed);
      setIsAnonymized(true);
    } else {
      setIsAnonymized(false);
    }
  };

  return (
    <div
      className={`forensic-intake-spatial-world ${isDragOver ? 'spatial-drag-active' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* =========================================================================
          SPATIAL PLANE 1: FLOATING SATELLITE EVIDENCE OBJECTS (Z: 60px to 120px)
          ========================================================================= */}
      <div className="satellite-evidence-constellation">
        {/* Shard A: Text Carrier Object (Z: 60px) */}
        <div className={`satellite-shard-obj text-shard ${text.trim().length > 0 ? 'active' : 'idle'}`}>
          <div className="shard-antenna-line" />
          <div className="shard-inner-chassis">
            <div className="shard-top-row">
              <span className="shard-type-tag">CARRIER // TXT</span>
              <span className={`shard-status-led ${text.trim().length > 0 ? 'online' : 'offline'}`} />
            </div>
            <div className="shard-main-metric">
              {text.trim().length > 0 ? `${text.length} CHARS` : 'EMPTY PAYLOAD'}
            </div>
            <div className="shard-sub-metric">
              {text.trim().length > 0
                ? `${text.split(/\s+/).filter(Boolean).length} WORDS OBSERVED`
                : 'Awaiting message text'}
            </div>
          </div>
        </div>

        {/* Shard B: Target URL Object (Z: 90px) */}
        <div className={`satellite-shard-obj url-shard ${detectedUrls.length > 0 ? 'active' : 'idle'} ${isScanning && detectedUrls.length > 0 ? 'scanning' : ''}`}>
          <div className="shard-antenna-line" />
          <div className="shard-inner-chassis">
            <div className="shard-top-row">
              <span className="shard-type-tag">TARGET // URI</span>
              <span className={`shard-status-led ${detectedUrls.length > 0 ? 'online' : 'offline'}`} />
            </div>
            <div className="shard-main-metric">
              {detectedUrls.length > 0 ? `${detectedUrls.length} LINK(S)` : '0 LINKS'}
            </div>
            <div className="shard-sub-metric">
              {isScanning && detectedUrls.length > 0
                ? 'ANALYZING URL SIGNALS…'
                : detectedUrls.length > 0
                ? detectedUrls[0].replace(/^https?:\/\//, '').slice(0, 22) + '…'
                : 'Passive scanner ready'}
            </div>
          </div>
        </div>

        {/* Shard C: Screenshot OCR Object (Z: 120px) */}
        <div
          className={`satellite-shard-obj img-shard ${attachedImages.length > 0 ? 'active' : 'idle'} ${isScanning && attachedImages.length > 0 ? 'scanning' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          style={{ cursor: 'pointer' }}
          title="Click to attach evidence screenshot"
        >
          <div className="shard-antenna-line" />
          <div className="shard-inner-chassis">
            <div className="shard-top-row">
              <span className="shard-type-tag">OCR // MULTIMODAL</span>
              <span className={`shard-status-led ${attachedImages.length > 0 ? 'online' : 'offline'}`} />
            </div>
            <div className="shard-main-metric">
              {attachedImages.length > 0 ? `${attachedImages.length} ATTACHED` : '+ DROP SCREENSHOT'}
            </div>
            <div className="shard-sub-metric">
              {isScanning && attachedImages.length > 0
                ? 'OCR // VISUAL EVIDENCE ANALYSIS'
                : attachedImages.length > 0
                ? `${attachedImages.length} of 5 queued`
                : 'PNG, JPG, WebP (Max 5)'}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SPATIAL PLANE 2: CENTRAL CARRIER CONSOLE (Z: 140px)
          ========================================================================= */}
      <div className="forensic-carrier-console-deck">
        {/* Holographic Header Bar */}
        <div className="console-hud-header">
          <div className="console-hud-title-wrap">
            <span className="console-radar-icon">◎</span>
            <span className="console-hud-name">
              {hasActiveReport ? 'EVIDENCE INTAKE // CASE REVISION' : 'FORENSIC INTAKE CONSOLE'}
            </span>
            <span className="console-hud-coords">
              {hasActiveReport ? 'ACTIVE CONTEXT // EDITABLE' : 'SEC // VOLATILE_BOUND_0x82F'}
            </span>
          </div>

          <div className="console-hud-stats">
            <span className="console-stat-pill">CHANNEL: {messageType.toUpperCase()}</span>
            <span className="console-stat-sep">/</span>
            <span className="console-stat-pill">RETENTION: ZERO</span>
          </div>
        </div>

        {/* Attached Screenshots Floating Filmstrip */}
        {attachedImages.length > 0 && (
          <div className="console-evidence-filmstrip">
            <div className="filmstrip-header-row">
              <div className="filmstrip-label">
                {isScanning ? 'OCR // VISUAL EVIDENCE ANALYSIS' : 'QUEUED MULTIMODAL EVIDENCE:'}
              </div>
              {isScanning && (
                <div className="filmstrip-scan-badge">
                  <span className="scanner-badge-text">[ FORENSIC SCAN ACTIVE ]</span>
                </div>
              )}
            </div>
            <div className="filmstrip-thumbnails">
              {attachedImages.map((img) => (
                <div key={img.id} className="filmstrip-thumb-cell">
                  <img src={img.previewUrl} alt={img.filename} className="filmstrip-img" />
                  {isScanning && (
                    <div className="filmstrip-scan-overlay" aria-hidden="true">
                      <div className="filmstrip-scan-line">
                        <div className="filmstrip-scan-beam-aura" />
                      </div>
                    </div>
                  )}
                  <div className="filmstrip-thumb-info">
                    <span className="thumb-fname">{img.filename}</span>
                    <span className="thumb-fsize">{(img.byteSize / 1024).toFixed(0)} KB</span>
                  </div>
                  {!isScanning && onRemoveImage && (
                    <button
                      type="button"
                      className="filmstrip-del-btn"
                      onClick={() => onRemoveImage(img.id)}
                      title="Detach this evidence image"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              {attachedImages.length < MAX_SCREENSHOTS && !isScanning && (
                <button
                  type="button"
                  className="filmstrip-add-slot"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className="add-plus">+</span>
                  <span>Add Another ({attachedImages.length}/{MAX_SCREENSHOTS})</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Recessed Carrier Inspection Chamber */}
        <div className={`console-recessed-chamber ${isScanning ? 'is-scanning' : ''}`}>
          <div className="chamber-line-counter">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i}>0{i + 1}</span>
            ))}
          </div>

          <textarea
            className="chamber-forensic-textarea"
            placeholder="Drop screenshot or paste suspected fraudulent text, phishing email, fake bank warning, or malicious URL here to isolate indicators..."
            value={text}
            onChange={(e) => onChangeText(e.target.value)}
            rows={6}
            aria-label="Suspected Fraudulent Evidence Input"
          />

          {/* Continuous Bidirectional Forensic Scanner Overlay (Non-blocking, pointer-events: none) */}
          {isScanning && (
            <div className="evidence-scan-overlay" aria-hidden="true">
              <div className="evidence-scan-line">
                <div className="evidence-scan-beam-aura" />
                <div className="evidence-scan-label">
                  {attachedImages.length > 0 && detectedUrls.length > 0 && text.trim().length > 0
                    ? 'SCANNING CASE // MULTIMODAL FORENSICS'
                    : attachedImages.length > 0
                    ? 'SCANNING CASE // OCR & VISUAL SIGNALS'
                    : detectedUrls.length > 0 && text.trim().length > 0
                    ? 'SCANNING CASE // FORENSIC PAYLOAD'
                    : detectedUrls.length > 0
                    ? 'SCANNING CASE // URL SIGNALS'
                    : 'SCANNING CASE'}
                </div>
              </div>
              <div className="scanner-reduced-motion-badge">
                [ FORENSIC SCAN ACTIVE ]
              </div>
            </div>
          )}
        </div>

        {fileError && (
          <div className="console-error-strip">
            <span className="console-err-icon">⚠</span>
            <span>{fileError}</span>
          </div>
        )}

        {/* Floating Operational Controls Dock */}
        <div className="console-dock-rail">
          <div className="dock-left-actions">
            {/* Screenshot Upload Button */}
            <button
              type="button"
              className="dock-tool-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={attachedImages.length >= MAX_SCREENSHOTS}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span>Add Screenshot ({attachedImages.length}/{MAX_SCREENSHOTS})</span>
            </button>

            {/* Ingestion Channel Selector */}
            <div className="dock-channel-pill">
              <span className="dock-label">Channel:</span>
              <select
                id="intake-channel-select"
                aria-label="Communication Channel"
                className="dock-select"
                value={messageType}
                onChange={(e) => onChangeMessageType(e.target.value as MessageType)}
              >
                <option value="sms">SMS / Text Message</option>
                <option value="email">Email Pretext</option>
                <option value="social_dm">Social Direct Message</option>
                <option value="messaging_app">Encrypted Chat (Telegram/WhatsApp)</option>
                <option value="marketplace">Marketplace / Classifieds</option>
                <option value="dating_app">Dating App</option>
                <option value="other">Unknown Vector</option>
              </select>
            </div>

            {/* In-Memory Anonymizer */}
            {text.length > 0 && (
              <button
                type="button"
                className={`dock-anonymize-btn ${isAnonymized ? 'active' : ''}`}
                onClick={toggleAnonymization}
                title="Locally scrub phone numbers, emails, and financial tokens in memory before analysis"
              >
                {isAnonymized ? '✓ PII Redacted' : 'Scrub Personal Info'}
              </button>
            )}
          </div>

          <div className="dock-right-actions">
            {hasContent && (
              <button
                type="button"
                className="dock-clear-btn"
                onClick={onClear}
                disabled={isLoading}
              >
                Clear
              </button>
            )}

            <button
              type="button"
              className="dock-analyze-btn"
              onClick={onInvestigate}
              disabled={!canSubmit || isScanning}
            >
              {isScanning ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                  <span>Scanning Evidence…</span>
                </>
              ) : isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                  <span>Isolating Vectors…</span>
                </>
              ) : hasActiveReport ? (
                <>
                  <span>ANALYZE AGAIN</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true" focusable="false">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                </>
              ) : (
                <>
                  <span>ANALYZE EVIDENCE</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true" focusable="false">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SPATIAL PLANE 3: SATELLITE FORENSIC PRESETS (Z: 40px)
          ========================================================================= */}
      {examples && examples.length > 0 && (
        <div className="forensic-presets-satellite-tray">
          <div className="presets-tray-header">
            <span className="presets-lead-icon">⌘</span>
            <span className="presets-lead-title">BENCHMARK TEST PRESETS:</span>
          </div>

          <div className="presets-satellite-chips">
            {examples.slice(0, 4).map((ex) => (
              <button
                key={ex.id}
                type="button"
                className="preset-satellite-chip"
                onClick={() => onSelectExample(ex)}
              >
                <div className="preset-chip-dot" />
                <div className="preset-chip-text">
                  <span className="preset-name">{ex.title}</span>
                  <span className="preset-cat">{ex.channel}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
