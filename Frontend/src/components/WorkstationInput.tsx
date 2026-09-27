import React, { useRef, useState, useEffect } from 'react';
import type { ExampleCase, MessageType, VictimState } from '../types';

export interface AttachedEvidenceImage {
  id: string;
  file: File;
  previewUrl: string;
  filename: string;
  byteSize: number;
}

export interface WorkstationInputProps {
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
  // Legacy optional props retained for backwards compatibility
  onInvestigateScreenshot?: (base64: string, filename: string) => void;
  onInvestigateUrl?: (url: string) => void;
  victimState?: VictimState;
  onChangeVictimState?: (state: VictimState) => void;
}

const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_SCREENSHOTS = 5;
const URL_REGEX = /(?:https?:\/\/|www\.)[^\s<>"'{}|\\^`]+/gi;

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
  attachedImages,
  onAddImages,
  onRemoveImage,
  victimState,
  onChangeVictimState,
}) => {
  const [localImages, setLocalImages] = useState<AttachedEvidenceImage[]>([]);
  const [isAnonymized, setIsAnonymized] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const images = attachedImages !== undefined ? attachedImages : localImages;

  // Local fallback handlers if parent doesn't provide onAddImages/onRemoveImage
  const addFiles = (files: File[]) => {
    setFileError(null);
    const validMimes = SUPPORTED_IMAGE_TYPES;
    const newItems: AttachedEvidenceImage[] = [];

    for (const file of files) {
      if (images.length + newItems.length >= MAX_SCREENSHOTS) {
        setFileError(`You can attach up to ${MAX_SCREENSHOTS} screenshots per investigation.`);
        break;
      }

      if (!validMimes.includes(file.type)) {
        setFileError(`"${file.name}" can't be used. Please choose a PNG, JPG, WebP, or GIF image.`);
        continue;
      }

      if (file.size > MAX_IMAGE_BYTES) {
        setFileError(`"${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 5MB.`);
        continue;
      }

      if (file.size === 0) {
        setFileError(`"${file.name}" contains 0 bytes.`);
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

    if (onAddImages) {
      onAddImages(files);
    } else if (newItems.length > 0) {
      setLocalImages((prev) => [...prev, ...newItems]);
    }
  };

  const removeImage = (id: string) => {
    setFileError(null);
    if (onRemoveImage) {
      onRemoveImage(id);
    } else {
      setLocalImages((prev) => {
        const found = prev.find((i) => i.id === id);
        if (found?.previewUrl) {
          URL.revokeObjectURL(found.previewUrl);
        }
        return prev.filter((i) => i.id !== id);
      });
    }
  };

  // Revoke any local preview URLs on unmount if local state was used
  useEffect(() => {
    return () => {
      localImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, [localImages]);

  // URL extraction preview
  const detectedUrls = text.match(URL_REGEX) || [];
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

  const hasUsableEvidence = text.trim().length >= 5 || images.length > 0 || detectedUrls.length > 0;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isLoading && hasUsableEvidence) {
        onInvestigate();
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div
      className={`panel-card workstation-card unified-composer-card ${isDragOver ? 'drag-over' : ''}`}
      role="region"
      aria-label="Unified Investigation Composer"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header & Mental Model Guidance */}
      <div className="panel-header" style={{ flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between' }}>
        <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <span style={{ fontWeight: 700, letterSpacing: '0.5px' }}>INVESTIGATION WORKSPACE</span>
        </div>

        <div className="composer-evidence-status-pill">
          <span className="bullet-dot-emerald"></span>
          <span>Unified Multimodal Intake</span>
        </div>
      </div>

      {/* Clear mental model headline */}
      <div className="composer-guidance-bar">
        <div className="composer-headline">What would you like to investigate?</div>
        <p className="composer-subhead">
          Paste a suspicious message, email, web address, or add screenshots. You can combine multiple pieces of evidence into one unified investigation.
        </p>
      </div>

      {/* Quick Preset Selector & Channel Bar */}
      <div className="composer-controls-row">
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
      </div>

      {/* Primary Composer Textarea */}
      <div className="input-wrapper composer-input-wrapper">
        <textarea
          className="investigation-textarea"
          placeholder="Paste a message, email, URL, or suspicious text... You can also add screenshots below to investigate all evidence together."
          value={text}
          onChange={(e) => onChangeText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          rows={6}
          spellCheck={false}
          aria-label="Investigation evidence text, message, or web address"
        />

        {/* Drag-over overlay feedback */}
        {isDragOver && (
          <div className="drag-over-overlay">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--accent-cyan)' }}>
              Drop screenshot to add evidence
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Supports PNG, JPG, WebP, GIF (Max 5MB each)
            </div>
          </div>
        )}
      </div>

      {/* Automatic URL Detection Chip */}
      {detectedUrls.length > 0 && (
        <div className="url-detected-chip" role="status" aria-live="polite">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2.2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
          <span className="url-detected-text">
            {detectedUrls.length === 1 ? (
              <>Web address recognized (<strong>{detectedUrls[0]}</strong>) — passive structural intelligence &amp; homoglyph inspection will run automatically.</>
            ) : (
              <>{detectedUrls.length} web addresses recognized — passive structural intelligence enabled for all links.</>
            )}
          </span>
        </div>
      )}

      {/* Secondary Action: Add Screenshot + Native File Input */}
      <div className="composer-secondary-bar">
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              addFiles(Array.from(e.target.files));
              e.target.value = '';
            }
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-add-screenshot"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || images.length >= MAX_SCREENSHOTS}
            title={images.length >= MAX_SCREENSHOTS ? `Maximum ${MAX_SCREENSHOTS} screenshots attached` : 'Add screenshot evidence'}
            aria-label="Add screenshot"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>{images.length > 0 ? `Add another screenshot (${images.length}/${MAX_SCREENSHOTS})` : '＋ Add screenshot'}</span>
          </button>

          <span className="screenshot-format-hint">
            PNG, JPG, WebP, GIF up to 5MB. Processed strictly in-memory (zero server disk storage).
          </span>
        </div>
      </div>

      {/* File Validation Alert if an invalid/oversized file was dropped */}
      {fileError && (
        <div className="composer-file-error" role="alert">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span style={{ flex: 1, fontSize: '12px', color: '#fca5a5' }}>{fileError}</span>
          <button
            type="button"
            onClick={() => setFileError(null)}
            className="error-dismiss-btn"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* Evidence Tray — Appears ONLY when evidence has actually been added */}
      {images.length > 0 && (
        <div className="evidence-tray" role="region" aria-label="Attached Screenshot Evidence">
          <div className="evidence-tray-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="evidence-tray-title">Attached Evidence</span>
              <span className="evidence-tray-count">({images.length} of {MAX_SCREENSHOTS})</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              OCR text extraction will be performed in-memory during investigation
            </span>
          </div>

          <div className="evidence-tray-grid">
            {images.map((img, idx) => (
              <div key={img.id} className="evidence-item-card">
                <div className="evidence-item-thumb-wrapper">
                  <img src={img.previewUrl} alt={`Screenshot ${idx + 1}: ${img.filename}`} className="evidence-item-thumb" />
                </div>
                <div className="evidence-item-meta">
                  <div className="evidence-item-filename" title={img.filename}>
                    {img.filename}
                  </div>
                  <div className="evidence-item-sub">
                    <span className="evidence-item-size">{(img.byteSize / 1024).toFixed(1)} KB</span>
                    <span className="evidence-item-badge">Image evidence</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="evidence-item-remove-btn"
                  onClick={() => removeImage(img.id)}
                  aria-label={`Remove screenshot ${img.filename}`}
                  title="Remove screenshot"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            ))}

            {images.length < MAX_SCREENSHOTS && (
              <button
                type="button"
                className="evidence-item-add-more"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                aria-label="Attach another screenshot"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>Add another</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Telemetry and metadata */}
      <div className="input-telemetry">
        <div className="telemetry-counts">
          <span>Characters: {characterCount.toLocaleString()} / 10,000</span>
          <span>Words: {wordCount.toLocaleString()}</span>
          {images.length > 0 && <span> • Images: {images.length}</span>}
        </div>

        <div style={{ color: !hasUsableEvidence ? '#94a3b8' : characterCount < 5 && images.length === 0 ? '#f59e0b' : '#34d399', fontSize: '12px' }}>
          {!hasUsableEvidence
            ? 'Add a message, URL, or screenshot to investigate'
            : characterCount > 0 && characterCount < 5 && images.length === 0
            ? 'Min 5 characters required'
            : 'Ready to investigate (Ctrl + Enter)'}
        </div>
      </div>

      {/* Optional Declared Victim Interaction Status */}
      {onChangeVictimState && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <span style={{ fontWeight: 600 }}>Interaction Status:</span>
          <select
            value={victimState || 'RECEIVED_MESSAGE_ONLY'}
            onChange={(e) => onChangeVictimState(e.target.value as VictimState)}
            style={{
              background: 'var(--bg-card, #0f172a)',
              color: 'var(--text-primary, #f1f5f9)',
              border: '1px solid var(--border-color, #334155)',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
            disabled={isLoading}
            aria-label="Victim Interaction Status"
          >
            <option value="RECEIVED_MESSAGE_ONLY">Received message only (No interaction)</option>
            <option value="CLICKED_LINK">Clicked a link</option>
            <option value="ENTERED_CREDENTIALS">Entered passwords / credentials</option>
            <option value="DISCLOSED_OTP_OR_AUTH_CODE">Shared OTP / 2FA code</option>
            <option value="PROVIDED_PERSONAL_INFORMATION">Provided personal information</option>
            <option value="SENT_MONEY">Sent money / gift cards</option>
            <option value="INSTALLED_SOFTWARE_OR_APP">Installed software / app</option>
            <option value="SHARED_SCREEN_OR_REMOTE_ACCESS">Shared screen / remote access</option>
            <option value="UNKNOWN_STATE">Unsure / other</option>
          </select>
        </div>
      )}

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
            disabled={isLoading || (text.length === 0 && images.length === 0)}
          >
            Clear
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={onInvestigate}
            disabled={isLoading || !hasUsableEvidence || (images.length === 0 && text.trim().length < 5)}
          >
            {isLoading ? 'Investigating...' : 'Run Investigation →'}
          </button>
        </div>
      </div>
    </div>
  );
};
