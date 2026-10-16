export type NodeCategory =
  'trigger' | 'action' | 'condition' | 'transform' | 'database' | 'notification' | 'output';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GraphNode {
  id: string;
  label: string;
  category: NodeCategory;
  n8nType: string;
  typeVersion: number;
  parameters: Record<string, unknown>;
  bounds?: BoundingBox;
  position: [number, number];
  confidence: number;
  isSuggested?: boolean;
  notes?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  sourceIndex: number; // 0 for main/true, 1 for false
  targetIndex: number; // 0 for main
  branchLabel?: 'main' | 'true' | 'false' | 'error';
}

export interface RegistryNodeDefinition {
  id: string;
  name: string;
  displayName: string;
  category: NodeCategory;
  typeVersion: number;
  defaultParameters: Record<string, unknown>;
  inputs: string[];
  outputs: string[];
  aliases: string[];
  icon: string;
}

export interface GapRecommendation {
  id: string;
  ruleId: string;
  title: string;
  description: string;
  severity: 'warning' | 'info';
  sourceNodeId: string;
  targetNodeId: string;
  reason: string;
  suggestedNode: GraphNode;
  isDismissed?: boolean;
}

export interface DrawFlowGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  recommendations: GapRecommendation[];
}

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, unknown>;
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
  settings?: Record<string, unknown>;
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

export { CURATED_NODE_REGISTRY } from './registry';
export {
  resolveNode,
  inferCategory,
  normalizeLabel,
  toCamelCase,
  getAllCuratedNodes
} from './resolver';
export { calculateTopologicalLayout } from './layout';
export type { LayoutOptions } from './layout';
export { auditWorkflowGaps, applyGapRecommendation } from './linter';
export { compileToN8nWorkflow, stringifyWorkflow } from './compiler';
