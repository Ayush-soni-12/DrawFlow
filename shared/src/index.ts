export type NodeCategory =
  'trigger' | 'action' | 'condition' | 'transform' | 'database' | 'notification' | 'output';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DrawFlowNode {
  id: string;
  label: string;
  category: NodeCategory;
  n8nType: string;
  parameters: Record<string, any>;
  bounds?: BoundingBox;
  isSuggested?: boolean;
  notes?: string;
}

export interface DrawFlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  conditionBranch?: 'true' | 'false' | 'main' | 'error';
}

export interface GapRecommendation {
  id: string;
  title: string;
  description: string;
  severity: 'warning' | 'info' | 'critical';
  sourceNodeId: string;
  targetNodeId: string;
  suggestedNode: DrawFlowNode;
  reason: string;
}

export interface DrawFlowGraph {
  nodes: DrawFlowNode[];
  edges: DrawFlowEdge[];
  recommendations: GapRecommendation[];
}

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, any>;
  notesInFlow?: boolean;
  notes?: string;
}

export interface N8nConnectionItem {
  node: string;
  type: string;
  index: number;
}

export type N8nConnections = Record<
  string,
  {
    main?: N8nConnectionItem[][];
  }
>;

export interface N8nWorkflow {
  name: string;
  nodes: N8nNode[];
  connections: N8nConnections;
  active?: boolean;
  settings?: Record<string, any>;
  meta?: {
    templateCredsSetupCompleted?: boolean;
    instanceId?: string;
  };
}

export interface AnalysisResponse {
  success: boolean;
  graph: DrawFlowGraph;
  workflow: N8nWorkflow;
  source: 'ai' | 'fallback_preset';
  presetName?: string;
  message?: string;
}
