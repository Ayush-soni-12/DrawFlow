import { GraphEdge, GraphNode, N8nConnections, N8nNode, N8nWorkflow } from './index';

/**
 * Sanitizes and makes node names unique for n8n.
 * n8n workflow connections reference nodes by their display `name`, not `id`.
 */
function makeNodeNamesUnique(nodes: GraphNode[]): Map<string, string> {
  const idToName = new Map<string, string>();
  const usedNames = new Map<string, number>();

  for (const node of nodes) {
    let baseName = node.label.trim() || 'Node';
    // Remove characters that might break json or n8n expressions
    baseName = baseName.replace(/[\n\r\t]/g, ' ').trim();

    const count = usedNames.get(baseName) || 0;
    if (count === 0) {
      usedNames.set(baseName, 1);
      idToName.set(node.id, baseName);
    } else {
      const uniqueName = `${baseName} ${count + 1}`;
      usedNames.set(baseName, count + 1);
      idToName.set(node.id, uniqueName);
    }
  }

  return idToName;
}

/**
 * Compiles intermediate DrawFlow GraphNode and GraphEdge data into a 100% compliant
 * official n8n workflow JSON structure ready for direct Ctrl+V pasting into an n8n canvas.
 */
export function compileToN8nWorkflow(
  name: string,
  nodes: GraphNode[],
  edges: GraphEdge[]
): N8nWorkflow {
  const idToName = makeNodeNamesUnique(nodes);

  // Compile nodes list
  const n8nNodes: N8nNode[] = nodes.map((node) => {
    const uniqueName = idToName.get(node.id) || node.label;
    return {
      id: node.id,
      name: uniqueName,
      type: node.n8nType,
      typeVersion: node.typeVersion || 1,
      position: [Math.round(node.position[0]), Math.round(node.position[1])],
      parameters: node.parameters || {},
      notesInFlow: Boolean(node.notes),
      notes: node.notes
    };
  });

  // Compile connection routing table
  // n8n format: connections[sourceNodeName].main[sourceOutputIndex] = [{ node: targetNodeName, type: 'main', index: targetInputIndex }]
  const connections: N8nConnections = {};

  for (const edge of edges) {
    const sourceName = idToName.get(edge.source);
    const targetName = idToName.get(edge.target);

    if (!sourceName || !targetName) continue;

    if (!connections[sourceName]) {
      connections[sourceName] = { main: [] };
    }

    const sourceOutIndex = Math.max(0, edge.sourceIndex || 0);
    const targetInIndex = Math.max(0, edge.targetIndex || 0);

    // Ensure array capacity up to sourceOutIndex
    const mainConnections = connections[sourceName].main!;
    while (mainConnections.length <= sourceOutIndex) {
      mainConnections.push([]);
    }

    mainConnections[sourceOutIndex].push({
      node: targetName,
      type: 'main',
      index: targetInIndex
    });
  }

  return {
    name: name.trim() || 'DrawFlow Generated Workflow',
    nodes: n8nNodes,
    connections,
    active: false,
    settings: {
      executionOrder: 'v1'
    },
    meta: {
      templateCredsSetupCompleted: true,
      instanceId: 'drawflow-ide'
    }
  };
}

/**
 * Formats an n8n workflow as a pretty printed JSON string for clipboard export.
 */
export function stringifyWorkflow(workflow: N8nWorkflow): string {
  return JSON.stringify(workflow, null, 2);
}
