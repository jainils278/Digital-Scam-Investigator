import React from 'react';
import type { LocalHistoryItem } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: LocalHistoryItem[];
  onSelectHistoryItem: (item: LocalHistoryItem) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onSelectHistoryItem,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              ⏱️ Local Investigation History
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Stored locally on this device ({items.length} records)
            </p>
          </div>

          <button type="button" className="btn-secondary" onClick={onClose}>
            ✕ Close
          </button>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-muted)', backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', lineHeight: 1.5 }}>
          🔒 <strong>Privacy Assurance:</strong> Historical records are stored exclusively in your device's browser <code>localStorage</code> (zero server retention). Because original input text is retained locally to enable re-inspection, remember to use <strong>Clear Local History</strong> when using shared or public workstations.
        </div>

        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--text-muted)' }}>
            No previous investigations stored in local history.
          </div>
        ) : (
          <div style={{ maxHeight: '420px', overflowY: 'auto', marginBottom: '18px' }}>
            {items.map((item) => (
              <div
                key={item.id}
                className="history-item"
                onClick={() => {
                  onSelectHistoryItem(item);
                  onClose();
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`risk-level-badge badge-${item.riskLevel}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                      {item.riskScore}/100 {item.riskLevel}
                    </span>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--accent-cyan)' }}>
                      {item.messageType}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {new Date(item.timestamp).toLocaleDateString()}{' '}
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.preview}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>{item.primaryCategory}</span>
                  <span>{item.indicatorCount} verified indicators</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}
            onClick={() => {
              if (confirm('Clear all local investigation records?')) {
                onClearHistory();
              }
            }}
            disabled={items.length === 0}
          >
            🗑️ Clear Local History
          </button>

          <button type="button" className="btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
