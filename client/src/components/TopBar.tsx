import { FC } from 'react';
import { Copy, Check, Upload, RefreshCw, Download, HelpCircle } from 'lucide-react';

interface TopBarProps {
  presets: Array<{ id: string; name: string; nodeCount?: number; edgeCount?: number; gapCount?: number }>;
  selectedPreset: string;
  onSelectPreset: (id: string) => void;
  onUploadClick: () => void;
  onCopyWorkflow: () => void;
  onDownloadWorkflow: () => void;
  onOpenShortcuts?: () => void;
  copied: boolean;
  isLoading: boolean;
  nodeCount: number;
  edgeCount: number;
  warningCount: number;
}

export const TopBar: FC<TopBarProps> = ({
  presets,
  selectedPreset,
  onSelectPreset,
  onUploadClick,
  onCopyWorkflow,
  onDownloadWorkflow,
  onOpenShortcuts,
  copied,
  isLoading,
  nodeCount,
  edgeCount,
  warningCount
}) => {
  return (
    <header className="top-bar">
      <div className="brand-section">
        <div className="brand-mark">DF</div>
        <span className="brand-title">DrawFlow</span>
        <span className="brand-tag">Whiteboard to n8n Automation</span>
        {nodeCount > 0 && (
          <div className="workflow-metrics-pill" title="Workflow topology overview">
            <span>{nodeCount} {nodeCount === 1 ? 'node' : 'nodes'}</span>
            <span className="metrics-sep">/</span>
            <span>{edgeCount} {edgeCount === 1 ? 'edge' : 'edges'}</span>
            {warningCount > 0 && (
              <>
                <span className="metrics-sep">/</span>
                <span className="metrics-warning">{warningCount} {warningCount === 1 ? 'warning' : 'warnings'}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Editable workflow name — threads directly into the n8n JSON export */}
      <div className="workflow-name-field">
        <label htmlFor="workflow-name-input" className="workflow-name-label">
          Workflow Name
        </label>
        <input
          id="workflow-name-input"
          type="text"
          className="workflow-name-input"
          value={workflowName}
          onChange={(e) => onWorkflowNameChange(e.target.value)}
          placeholder="Name your workflow…"
          maxLength={80}
          aria-label="Workflow name for n8n export"
          disabled={isLoading}
        />
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
          {presets.map((preset) => {
            // Build a richer label using edgeCount + gapCount from the server when present
            const meta: string[] = [];
            if (preset.nodeCount != null) meta.push(`${preset.nodeCount}n`);
            if (preset.edgeCount != null) meta.push(`${preset.edgeCount}e`);
            if (preset.gapCount != null) meta.push(`${preset.gapCount} gaps`);
            const suffix = meta.length ? ` (${meta.join(' · ')})` : '';
            return (
              <option key={preset.id} value={preset.id}>
                {preset.name}{suffix}
              </option>
            );
          })}
        </select>

        {onOpenShortcuts && (
          <button
            type="button"
            className="btn btn-secondary btn-icon-only"
            onClick={onOpenShortcuts}
            title="Keyboard shortcuts (?)"
            aria-label="View keyboard shortcuts"
          >
            <HelpCircle size={15} />
          </button>
        )}

        <button
          type="button"
          className="btn btn-secondary"
          onClick={onUploadClick}
          disabled={isLoading}
        >
          <Upload size={15} />
          <span>Upload Sketch</span>
        </button>

        {/* Download compiled workflow as a .json file for import into self-hosted n8n */}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onDownloadWorkflow}
          disabled={isLoading || nodeCount === 0}
          title="Download workflow JSON file"
        >
          <Download size={15} />
          <span>Download JSON</span>
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={onDownloadWorkflow}
          disabled={isLoading || nodeCount === 0}
          title="Download compiled workflow as JSON"
        >
          <Download size={15} />
          <span>Download JSON</span>
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
