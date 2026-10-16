import { FC } from 'react';
import { GapRecommendation } from '@drawflow/shared';
import { GitBranch, AlertTriangle, Info, Cpu } from 'lucide-react';

interface StatusBarProps {
  nodeCount: number;
  edgeCount: number;
  warnings: number;
  hints: number;
  analysisSource: string; // 'ai' | 'fallback_preset' | ''
  statusMessage: string;
}

export const StatusBar: FC<StatusBarProps> = ({
  nodeCount,
  edgeCount,
  warnings,
  hints,
  analysisSource,
  statusMessage
}) => {
  const sourceLabel =
    analysisSource === 'ai'
      ? 'Gemini AI'
      : analysisSource === 'fallback_preset'
        ? 'Preset'
        : '';

  return (
    <footer className="status-bar" aria-label="Workflow status">
      {/* Left: node/edge stats */}
      <div className="status-bar-group">
        <span className="status-stat">
          <Cpu size={12} aria-hidden="true" />
          {nodeCount} {nodeCount === 1 ? 'node' : 'nodes'}
        </span>
        <span className="status-divider" aria-hidden="true" />
        <span className="status-stat">
          <GitBranch size={12} aria-hidden="true" />
          {edgeCount} {edgeCount === 1 ? 'edge' : 'edges'}
        </span>
      </div>

      {/* Centre: gap summary */}
      <div className="status-bar-group">
        {warnings > 0 && (
          <span className="status-stat status-stat-warning">
            <AlertTriangle size={12} aria-hidden="true" />
            {warnings} {warnings === 1 ? 'warning' : 'warnings'}
          </span>
        )}
        {hints > 0 && (
          <span className="status-stat status-stat-muted">
            <Info size={12} aria-hidden="true" />
            {hints} {hints === 1 ? 'hint' : 'hints'}
          </span>
        )}
        {warnings === 0 && hints === 0 && nodeCount > 0 && (
          <span className="status-stat status-stat-success">No gaps detected</span>
        )}
      </div>

      {/* Right: analysis source / status message */}
      <div className="status-bar-group">
        {statusMessage && (
          <span className="status-message" title={statusMessage}>
            {statusMessage.length > 60 ? statusMessage.slice(0, 58) + '…' : statusMessage}
          </span>
        )}
        {sourceLabel && (
          <span className="status-source-pill">{sourceLabel}</span>
        )}
      </div>
    </footer>
  );
};
