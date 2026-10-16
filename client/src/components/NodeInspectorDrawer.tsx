import { FC, useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { GraphNode, NodeCategory } from '@drawflow/shared';
import { X, Sliders, Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface NodeInspectorDrawerProps {
  node: GraphNode | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateNode: (nodeId: string, patch: Partial<GraphNode>) => void;
}

const CATEGORIES: NodeCategory[] = [
  'trigger',
  'action',
  'condition',
  'transform',
  'database',
  'notification',
  'output'
];

export const NodeInspectorDrawer: FC<NodeInspectorDrawerProps> = ({
  node,
  isOpen,
  onClose,
  onUpdateNode
}) => {
  const [newParamKey, setNewParamKey] = useState('');
  const [newParamVal, setNewParamVal] = useState('');

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !node) return null;

  const handleLabelChange = (e: ChangeEvent<HTMLInputElement>) => {
    onUpdateNode(node.id, { label: e.target.value });
  };

  const handleCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onUpdateNode(node.id, { category: e.target.value as NodeCategory });
  };

  const handleN8nTypeChange = (e: ChangeEvent<HTMLInputElement>) => {
    onUpdateNode(node.id, { n8nType: e.target.value });
  };

  const handleNotesChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateNode(node.id, { notes: e.target.value });
  };

  const handleParamChange = (key: string, value: unknown) => {
    const updated = {
      ...(node.parameters || {}),
      [key]: value
    };
    onUpdateNode(node.id, { parameters: updated });
  };

  const handleDeleteParam = (key: string) => {
    const updated = { ...(node.parameters || {}) };
    delete updated[key];
    onUpdateNode(node.id, { parameters: updated });
  };

  const handleAddParam = (e: FormEvent) => {
    e.preventDefault();
    if (!newParamKey.trim()) return;
    handleParamChange(newParamKey.trim(), newParamVal.trim());
    setNewParamKey('');
    setNewParamVal('');
  };

  const confidencePercent = Math.round((node.confidence || 1) * 100);
  const parameters = node.parameters || {};
  const paramEntries = Object.entries(parameters);

  return (
    <aside className="node-inspector-drawer" aria-label="Node Inspector">
      {/* Drawer Header */}
      <div className="inspector-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sliders size={16} style={{ color: 'var(--accent)' }} />
          <span className="inspector-title">Node Inspector</span>
          <span className="node-category-pill">{node.category}</span>
        </div>
        <button
          type="button"
          className="btn-dismiss"
          onClick={onClose}
          aria-label="Close inspector"
          title="Close drawer (Escape)"
        >
          <X size={15} />
        </button>
      </div>

      {/* Drawer Body */}
      <div className="inspector-body">
        {/* Detection Metadata */}
        <div className="inspector-meta-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={13} style={{ color: 'var(--status-success)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Confidence: <strong style={{ color: 'var(--text)' }}>{confidencePercent}%</strong>
            </span>
          </div>
          {node.isSuggested && <span className="advice-tag tag-warning">Suggested Glue Node</span>}
        </div>

        {/* Node Label Field */}
        <div className="form-group">
          <label htmlFor="node-label-input" className="form-label">
            Step Label
          </label>
          <input
            id="node-label-input"
            type="text"
            className="form-input"
            value={node.label}
            onChange={handleLabelChange}
            placeholder="e.g. Shopify Webhook"
          />
        </div>

        {/* Node Category Field */}
        <div className="form-group">
          <label htmlFor="node-category-select" className="form-label">
            Category
          </label>
          <select
            id="node-category-select"
            className="select-input"
            style={{ width: '100%' }}
            value={node.category}
            onChange={handleCategoryChange}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Resolved n8n Type */}
        <div className="form-group">
          <label htmlFor="node-n8ntype-input" className="form-label">
            n8n Integration Type
          </label>
          <input
            id="node-n8ntype-input"
            type="text"
            className="form-input form-input-mono"
            value={node.n8nType}
            onChange={handleN8nTypeChange}
            placeholder="e.g. n8n-nodes-base.webhook"
          />
        </div>

        {/* Node Notes */}
        <div className="form-group">
          <label htmlFor="node-notes-textarea" className="form-label">
            Notes / Description
          </label>
          <textarea
            id="node-notes-textarea"
            className="form-textarea"
            rows={2}
            value={node.notes || ''}
            onChange={handleNotesChange}
            placeholder="Optional operational notes or rationale..."
          />
        </div>

        {/* Configured Parameters */}
        <div className="form-group">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 6
            }}
          >
            <label className="form-label" style={{ marginBottom: 0 }}>
              Node Parameters ({paramEntries.length})
            </label>
          </div>

          <div className="param-list">
            {paramEntries.length === 0 ? (
              <div className="param-empty">No custom parameters configured.</div>
            ) : (
              paramEntries.map(([key, val]) => (
                <div key={key} className="param-row">
                  <span className="param-key" title={key}>
                    {key}
                  </span>
                  <input
                    type="text"
                    className="param-val-input"
                    value={typeof val === 'object' ? JSON.stringify(val) : String(val ?? '')}
                    onChange={(e) => handleParamChange(key, e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-param-delete"
                    onClick={() => handleDeleteParam(key)}
                    aria-label={`Delete parameter ${key}`}
                    title="Remove parameter"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add Parameter Form */}
          <form onSubmit={handleAddParam} className="add-param-form">
            <input
              type="text"
              placeholder="Param Key"
              className="param-val-input"
              style={{ width: '40%' }}
              value={newParamKey}
              onChange={(e) => setNewParamKey(e.target.value)}
            />
            <input
              type="text"
              placeholder="Value"
              className="param-val-input"
              style={{ flex: 1 }}
              value={newParamVal}
              onChange={(e) => setNewParamVal(e.target.value)}
            />
            <button
              type="submit"
              className="btn btn-secondary"
              style={{ height: 28, padding: '0 8px', fontSize: 11 }}
              disabled={!newParamKey.trim()}
              title="Add parameter"
            >
              <Plus size={12} />
            </button>
          </form>
        </div>
      </div>

      {/* Drawer Footer */}
      <div className="inspector-footer">
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Edits update canvas and n8n export instantly
        </span>
      </div>
    </aside>
  );
};
