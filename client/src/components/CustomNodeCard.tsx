import { FC } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { GraphNode } from '@drawflow/shared';

export interface CustomNodeData extends GraphNode {
  [key: string]: unknown;
}

export const CustomNodeCard: FC<NodeProps> = ({ data, selected }) => {
  const node = data as unknown as CustomNodeData;

  const isTrigger = node.category === 'trigger';
  const isCondition = node.category === 'condition';
  const confidencePercent = Math.round((node.confidence || 1) * 100);

  return (
    <div className={`flow-node-card ${selected ? 'selected' : ''}`}>
      {/* Target input handle (triggers do not have input) */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Left}
          style={{
            background: '#94a3b8',
            width: 8,
            height: 8,
            borderRadius: 2,
            border: '2px solid #0f172a'
          }}
        />
      )}

      <div className="node-header">
        <span className="node-category-pill">{node.category || 'action'}</span>
        <span className="node-confidence">{confidencePercent}%</span>
      </div>

      <div className="node-body">
        <div className="node-label">{node.label}</div>
        <div className="node-type">{node.n8nType}</div>

        {node.isSuggested && <div className="node-suggested-badge">Suggested Glue Node</div>}
      </div>

      {/* Source output handle(s) */}
      {isCondition ? (
        <>
          {/* Multi pin handle for conditional branches: pin 0 (true) and pin 1 (false) */}
          <Handle
            id="pin-0"
            type="source"
            position={Position.Right}
            style={{
              top: '35%',
              background: '#10b981',
              width: 8,
              height: 8,
              borderRadius: 2,
              border: '2px solid #0f172a'
            }}
          />
          <Handle
            id="pin-1"
            type="source"
            position={Position.Right}
            style={{
              top: '65%',
              background: '#f43f5e',
              width: 8,
              height: 8,
              borderRadius: 2,
              border: '2px solid #0f172a'
            }}
          />
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          style={{
            background: '#f97316',
            width: 8,
            height: 8,
            borderRadius: 2,
            border: '2px solid #0f172a'
          }}
        />
      )}
    </div>
  );
};
