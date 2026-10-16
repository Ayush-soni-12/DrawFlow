import { FC } from 'react';
import { Copy, Check, Upload, RefreshCw } from 'lucide-react';

interface TopBarProps {
  presets: Array<{ id: string; name: string }>;
  selectedPreset: string;
  onSelectPreset: (id: string) => void;
  onUploadClick: () => void;
  onCopyWorkflow: () => void;
  copied: boolean;
  isLoading: boolean;
  nodeCount: number;
}

export const TopBar: FC<TopBarProps> = ({
  presets,
  selectedPreset,
  onSelectPreset,
  onUploadClick,
  onCopyWorkflow,
  copied,
  isLoading,
  nodeCount
}) => {
  return (
    <header className="top-bar">
      <div className="brand-section">
        <div className="brand-mark">DF</div>
        <span className="brand-title">DrawFlow</span>
        <span className="brand-tag">Whiteboard to n8n Automation</span>
      </div>

      <div className="controls-section">
        <label htmlFor="preset-select" className="sr-only" style={{ display: 'none' }}>
          Select Workflow Preset
        </label>
        <select
          id="preset-select"
          className="select-input"
          value={selectedPreset}
          onChange={(e) => onSelectPreset(e.target.value)}
          disabled={isLoading}
          aria-label="Preset diagram"
        >
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={onUploadClick}
          disabled={isLoading}
        >
          <Upload size={15} />
          <span>Upload Sketch</span>
        </button>

        <button
          type="button"
          className="btn btn-primary"
          onClick={onCopyWorkflow}
          disabled={isLoading || nodeCount === 0}
        >
          {isLoading ? (
            <>
              <RefreshCw size={15} className="spin" />
              <span>Analyzing...</span>
            </>
          ) : copied ? (
            <>
              <Check size={15} />
              <span>Copied for n8n</span>
            </>
          ) : (
            <>
              <Copy size={15} />
              <span>Copy for n8n (Ctrl+V)</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
