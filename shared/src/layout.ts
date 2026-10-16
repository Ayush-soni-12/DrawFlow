import { GraphEdge, GraphNode } from './index';

export interface LayoutOptions {
  horizontalPitch?: number; // default 240px
  verticalPitch?: number; // default 160px
  startX?: number; // default 240px
  startY?: number; // default 300px
}

/**
 * Calculates a clean topological auto layout for n8n canvas nodes.
 * Computes non overlapping grid coordinates with horizontal progression (left to right)
 * and vertical branching tiers, ensuring imported workflows look professionally organized.
 */
export function calculateTopologicalLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: LayoutOptions = {}
): GraphNode[] {
  if (nodes.length === 0) return [];

  const horizontalPitch = options.horizontalPitch ?? 240;
  const verticalPitch = options.verticalPitch ?? 160;
  const startX = options.startX ?? 240;
  const startY = options.startY ?? 300;

  // Build adjacency and in degree maps
  const nodeIds = new Set(nodes.map((n) => n.id));
  const adj = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const node of nodes) {
    adj.set(node.id, []);
    inDegree.set(node.id, 0);
  }

  for (const edge of edges) {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      adj.get(edge.source)!.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }
  }

  // Determine ranks (horizontal layers)
  const ranks = new Map<string, number>();
  const queue: string[] = [];

  // Root nodes (triggers or zero in degree) start at rank 0
  for (const node of nodes) {
    const isTrigger = node.category === 'trigger';
    const degree = inDegree.get(node.id) || 0;
    if (degree === 0 || isTrigger) {
      ranks.set(node.id, 0);
      queue.push(node.id);
    }
  }

  // If every node has in degree > 0 (cycle), pick the first node as seed
  if (queue.length === 0 && nodes.length > 0) {
    ranks.set(nodes[0].id, 0);
    queue.push(nodes[0].id);
  }

  // Traverse and assign longest path ranks
  const visited = new Set<string>();
  let safetyCounter = 0;
  const maxIterations = nodes.length * 3;

  while (queue.length > 0 && safetyCounter < maxIterations) {
    safetyCounter++;
    const currentId = queue.shift()!;
    visited.add(currentId);
    const currentRank = ranks.get(currentId) || 0;

    const neighbors = adj.get(currentId) || [];
    for (const nextId of neighbors) {
      const existingRank = ranks.get(nextId) ?? -1;
      const proposedRank = currentRank + 1;

      if (proposedRank > existingRank) {
        ranks.set(nextId, proposedRank);
        if (!queue.includes(nextId)) {
          queue.push(nextId);
        }
      }
    }
  }

  // Assign any disconnected or unvisited nodes to rank 0 or highest rank
  for (const node of nodes) {
    if (!ranks.has(node.id)) {
      ranks.set(node.id, 0);
    }
  }

  // Group nodes by rank layer
  const layers = new Map<number, string[]>();
  for (const node of nodes) {
    const r = ranks.get(node.id) || 0;
    if (!layers.has(r)) {
      layers.set(r, []);
    }
    layers.get(r)!.push(node.id);
  }

  // Compute final (x, y) coordinates for each node
  const positionMap = new Map<string, [number, number]>();

  // Sort layers by rank ascending
  const sortedRanks = Array.from(layers.keys()).sort((a, b) => a - b);

  for (const rank of sortedRanks) {
    const nodeIdsInLayer = layers.get(rank)!;
    const layerCount = nodeIdsInLayer.length;
    const x = startX + rank * horizontalPitch;

    nodeIdsInLayer.forEach((nodeId, idx) => {
      // Center vertical distribution around startY
      const offset = (idx - (layerCount - 1) / 2) * verticalPitch;
      const y = Math.round(startY + offset);
      positionMap.set(nodeId, [x, y]);
    });
  }

  // Return updated nodes with calculated positions
  return nodes.map((node) => ({
    ...node,
    position: positionMap.get(node.id) || [startX, startY]
  }));
}
