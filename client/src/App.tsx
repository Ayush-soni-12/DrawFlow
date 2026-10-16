import { useState, useEffect, useCallback, useMemo, useRef, ChangeEvent } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  GraphNode,
  GraphEdge,
  GapRecommendation,
  N8nWorkflow,
  calculateTopologicalLayout,
  auditWorkflowGaps,
  applyGapRecommendation,
  compileToN8nWorkflow,
  stringifyWorkflow
} from '@drawflow/shared';

import { TopBar } from './components/TopBar';
import { DualPaneLayout } from './components/DualPaneLayout';
import { WhiteboardViewer } from './components/WhiteboardViewer';
import { CustomNodeCard } from './components/CustomNodeCard';
import { NodeInspectorDrawer } from './components/NodeInspectorDrawer';
import { Plus, Check, Info, X } from 'lucide-react';

interface PresetItem {
  id: string;
  name: string;
  description: string;
  nodeCount: number;
}

export default function App() {
  const [presets, setPresets] = useState<PresetItem[]>([
    {
      id: 'order-pipeline',
      name: 'E-Commerce Order Pipeline',
      description: 'Webhook -> PostgreSQL -> Slack',
      nodeCount: 3
    },
    {
      id: 'lead-enrichment',
      name: 'Lead Capture & CRM Sync',
      description: 'Form Trigger -> Airtable -> Gmail',
      nodeCount: 3
    },
    {
      id: 'devops-alerts',
      name: 'DevOps Alert Router',
      description: 'Schedule Trigger -> HTTP Health Check -> Discord Bot Alert',
      nodeCount: 3
    }
  ]);
  const [selectedPreset, setSelectedPreset] = useState('order-pipeline');
  const [workflowName, setWorkflowName] = useState('DrawFlow Workflow');
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<GraphEdge[]>([]);
  const [recommendations, setRecommendations] = useState<GapRecommendation[]>([]);
  const [dismissedRecIds, setDismissedRecIds] = useState<Set<string>>(new Set());
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeWorkflow, setActiveWorkflow] = useState<N8nWorkflow | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | undefined>(undefined);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Register custom node type
  const nodeTypes = useMemo(
    () => ({
      custom: CustomNodeCard
    }),
    []
  );

  // Synchronize GraphNodes and GraphEdges to ReactFlow nodes and edges
  const syncToCanvas = useCallback(
    (gNodes: GraphNode[], gEdges: GraphEdge[]) => {
      // 1. Calculate topological auto layout
      const laidOut = calculateTopologicalLayout(gNodes, gEdges);

      // 2. Map to React Flow Node objects
      const rfNodes: Node[] = laidOut.map((n) => ({
        id: n.id,
        type: 'custom',
        position: { x: n.position[0], y: n.position[1] },
        data: { ...n },
        selected: n.id === selectedNodeId
      }));

      // 3. Map to React Flow Edge objects
      const rfEdges: Edge[] = gEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceIndex > 0 ? `pin-${e.sourceIndex}` : undefined,
        style: { stroke: '#94a3b8', strokeWidth: 2 },
        animated: false
      }));

      setNodes(rfNodes);
      setEdges(rfEdges);

      // 4. Audit architectural gaps
      const gaps = auditWorkflowGaps(laidOut, gEdges);
      setRecommendations(gaps);

      // 5. Compile to valid n8n workflow
      const compiled = compileToN8nWorkflow(workflowName || 'DrawFlow Workflow', laidOut, gEdges);
      setActiveWorkflow(compiled);
    },
    [setNodes, setEdges, selectedNodeId, workflowName]
  );

  // Synchronize React Flow node selection when selectedNodeId changes
  useEffect(() => {
    setNodes((prevNodes) =>
      prevNodes.map((n) => ({
        ...n,
        selected: n.id === selectedNodeId
      }))
    );
  }, [selectedNodeId, setNodes]);

  // Selected node object for inspector drawer
  const selectedNode = useMemo(() => {
    return graphNodes.find((n) => n.id === selectedNodeId) || null;
  }, [graphNodes, selectedNodeId]);

  // Parameter update handler: updates graph state, re-layouts, and recompiles n8n clipboard export
  const handleUpdateNode = useCallback(
    (nodeId: string, patch: Partial<GraphNode>) => {
      setGraphNodes((prevNodes) => {
        const updated = prevNodes.map((n) => (n.id === nodeId ? { ...n, ...patch } : n));
        syncToCanvas(updated, graphEdges);
        return updated;
      });
    },
    [graphEdges, syncToCanvas]
  );

  // Fetch presets list from backend
  useEffect(() => {
    fetch('/api/presets')
      .then((res) => res.json())
      .then((data: PresetItem[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setPresets(data);
        }
      })
      .catch((err) => console.log('Presets fetch error, using local defaults:', err));
  }, []);

  // Request analysis from backend (by presetId or uploaded image)
  const requestAnalysis = useCallback(
    async (params: { presetId?: string; image?: string }) => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        });

        const data = await res.json();
        if (data.success && data.graph) {
          setGraphNodes(data.graph.nodes);
          setGraphEdges(data.graph.edges);
          if (data.workflow) {
            setActiveWorkflow(data.workflow);
          }
          syncToCanvas(data.graph.nodes, data.graph.edges);
          if (data.message) {
            setStatusMessage(data.message);
          }
        }
      } catch (err) {
        console.error('Analysis request failed:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [syncToCanvas]
  );

  // Load initial preset
  useEffect(() => {
    requestAnalysis({ presetId: 'order-pipeline' });
  }, [requestAnalysis]);

  // Filter visible recommendations (excluding dismissed ones)
  const visibleRecommendations = useMemo(() => {
    return recommendations.filter((r) => !dismissedRecIds.has(r.id));
  }, [recommendations, dismissedRecIds]);

  const warningCount = useMemo(() => {
    return visibleRecommendations.filter((r) => r.severity === 'warning').length;
  }, [visibleRecommendations]);

  const infoCount = useMemo(() => {
    return visibleRecommendations.filter((r) => r.severity === 'info').length;
  }, [visibleRecommendations]);

  // Handle Preset Change
  const handleSelectPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    setPreviewImageUrl(undefined);
    setDismissedRecIds(new Set());
    setSelectedNodeId(null);
    requestAnalysis({ presetId });
  };

  // Trigger file upload dialog
  const handleUploadTrigger = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle direct custom image upload (from drag-and-drop or clipboard paste)
  const handleUploadCustomImage = useCallback(
    (dataUrl: string) => {
      setPreviewImageUrl(dataUrl);
      setSelectedPreset('custom-upload');
      setDismissedRecIds(new Set());
      setSelectedNodeId(null);
      requestAnalysis({ image: dataUrl });
    },
    [requestAnalysis]
  );

  // Handle file upload
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      handleUploadCustomImage(base64Url);
    };
    reader.readAsDataURL(file);
  };

  // Handle Copy for n8n (Ctrl+V)
  const handleCopyWorkflow = () => {
    if (!activeWorkflow) return;
    const jsonText = stringifyWorkflow(activeWorkflow);
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Dismiss a gap recommendation
  const handleDismiss = useCallback((recId: string) => {
    setDismissedRecIds((prev) => {
      const next = new Set(prev);
      next.add(recId);
      return next;
    });
  }, []);

  // Reset all dismissed recommendations
  const handleResetDismissed = useCallback(() => {
    setDismissedRecIds(new Set());
  }, []);

  // Handle Auto Insert of recommended glue node
  const handleAutoInsert = (recommendation: GapRecommendation) => {
    const rewired = applyGapRecommendation(graphNodes, graphEdges, recommendation);
    setGraphNodes(rewired.nodes);
    setGraphEdges(rewired.edges);
    syncToCanvas(rewired.nodes, rewired.edges);
  };

  // Left pane content
  const leftPaneContent = (
    <>
      <div className="pane-header">
        <span>Whiteboard Sketch</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {graphNodes.length} nodes detected
        </span>
      </div>

      <div className="pane-content">
        <WhiteboardViewer
          nodes={graphNodes}
          previewUrl={previewImageUrl}
          presetName={selectedPreset}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
          onUploadImage={handleUploadCustomImage}
          onTriggerUploadClick={handleUploadTrigger}
        />

        {statusMessage && (
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--surface-active)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <Info size={14} style={{ flexShrink: 0, color: 'var(--accent)' }} />
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="advice-section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="section-label">Architecture Advice</span>
              {dismissedRecIds.size > 0 && (
                <button
                  type="button"
                  onClick={handleResetDismissed}
                  className="btn-text-action"
                  title="Restore dismissed recommendations"
                >
                  Reset ({dismissedRecIds.size})
                </button>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {warningCount > 0 && (
                <span className="advice-count-pill warning">
                  {warningCount} {warningCount === 1 ? 'warning' : 'warnings'}
                </span>
              )}
              {infoCount > 0 && (
                <span className="advice-count-pill info">
                  {infoCount} {infoCount === 1 ? 'hint' : 'hints'}
                </span>
              )}
              {visibleRecommendations.length === 0 && (
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--status-success)' }}>
                  0 gaps
                </span>
              )}
            </div>
          </div>

          {visibleRecommendations.length === 0 ? (
            <div className="advice-empty-card">
              <Check size={14} style={{ color: 'var(--status-success)', flexShrink: 0 }} />
              <span>
                {dismissedRecIds.size > 0
                  ? 'All active recommendations resolved or dismissed!'
                  : 'All glue nodes and data formatters verified!'}
              </span>
            </div>
          ) : (
            visibleRecommendations.map((rec) => {
              const isWarning = rec.severity === 'warning';
              return (
                <div
                  key={rec.id}
                  className={`advice-card ${isWarning ? 'advice-card-warning' : 'advice-card-info'}`}
                >
                  <div className="advice-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`advice-tag ${isWarning ? 'tag-warning' : 'tag-info'}`}>
                        {isWarning ? 'Warning' : 'Optimization'}
                      </span>
                      <span className="advice-title">{rec.title}</span>
                    </div>
                    <button
                      type="button"
                      className="btn-dismiss"
                      onClick={() => handleDismiss(rec.id)}
                      aria-label={`Dismiss ${rec.title}`}
                      title="Dismiss recommendation"
                    >
                      <X size={13} />
                    </button>
                  </div>
                  <div className="advice-body">{rec.description}</div>
                  {rec.reason && (
                    <div className="advice-reason">
                      <span className="reason-label">Why: </span>
                      {rec.reason}
                    </div>
                  )}
                  <div className="advice-footer">
                    <button
                      type="button"
                      className="btn-insert"
                      onClick={() => handleAutoInsert(rec)}
                    >
                      <Plus
                        size={12}
                        style={{ display: 'inline', verticalAlign: -1, marginRight: 4 }}
                      />
                      Auto-Insert {rec.suggestedNode.label}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );

  // Right pane content
  const rightPaneContent = (
    <>
      <div className="pane-header">
        <span>Interactive n8n Canvas</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Paste with Ctrl+V inside n8n
          </span>
        </div>
      </div>

      <div className="flow-container" style={{ position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          onPaneClick={() => setSelectedNodeId(null)}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#334155" />
          <Controls
            style={{
              backgroundColor: '#1e293b',
              borderColor: '#334155',
              borderRadius: 4,
              boxShadow: 'none'
            }}
          />
        </ReactFlow>

        <NodeInspectorDrawer
          node={selectedNode}
          isOpen={selectedNodeId !== null}
          onClose={() => setSelectedNodeId(null)}
          onUpdateNode={handleUpdateNode}
        />
      </div>
    </>
  );

  return (
    <div className="app-container">
      {/* Hidden file input for uploading custom sketches */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />

      <TopBar
        presets={presets}
        selectedPreset={selectedPreset}
        onSelectPreset={handleSelectPreset}
        onUploadClick={handleUploadTrigger}
        onCopyWorkflow={handleCopyWorkflow}
        copied={copied}
        isLoading={isLoading}
        nodeCount={graphNodes.length}
        workflowName={workflowName}
        onWorkflowNameChange={setWorkflowName}
      />

      <DualPaneLayout leftPane={leftPaneContent} rightPane={rightPaneContent} />
    </div>
  );
}
