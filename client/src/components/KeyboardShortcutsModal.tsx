import { FC, useEffect } from 'react';
import { X, Command } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
}

const SHORTCUTS: ShortcutItem[] = [
  { keys: ['Ctrl', 'V'], description: 'Paste whiteboard sketch directly from clipboard' },
  { keys: ['Ctrl', 'Shift', 'C'], description: 'Copy compiled n8n workflow to clipboard' },
  { keys: ['Ctrl', 'Shift', 'D'], description: 'Download compiled workflow as JSON file' },
  { keys: ['?'], description: 'Toggle keyboard shortcuts reference' },
  { keys: ['Esc'], description: 'Deselect active node or close open drawer' }
];

export const KeyboardShortcutsModal: FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Command size={16} style={{ color: 'var(--accent)' }} />
            <h2 id="shortcuts-title" className="modal-title">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            type="button"
            className="btn-dismiss"
            onClick={onClose}
            aria-label="Close shortcuts dialog"
          >
            <X size={15} />
          </button>
        </div>

        <div className="modal-body">
          <div className="shortcuts-list">
            {SHORTCUTS.map((item, index) => (
              <div key={index} className="shortcut-row">
                <span className="shortcut-description">{item.description}</span>
                <div className="shortcut-keys">
                  {item.keys.map((k, kidx) => (
                    <span key={kidx} className="key-combo">
                      <kbd className="kbd">{k}</kbd>
                      {kidx < item.keys.length - 1 && <span className="key-plus">+</span>}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
