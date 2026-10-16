import { GapRecommendation, GraphEdge, GraphNode } from './index';
import { resolveNode } from './resolver';

/**
 * Audits a workflow graph for common architectural omissions such as:
 * 1. Missing payload formatters between webhooks and databases or notification nodes (Warning).
 * 2. Missing null guards or conditional branches after database queries or API calls (Warning).
 * 3. Omitted error handlers on sensitive financial or write operations (Info).
 * 4. Omitted loop batching when processing arrays against rate-limited endpoints (Info).
 */
export function auditWorkflowGaps(nodes: GraphNode[], edges: GraphEdge[]): GapRecommendation[] {
  const recommendations: GapRecommendation[] = [];
  const nodeMap = new Map<string, GraphNode>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  let gapSequence = 1;

  // Check if graph already contains an error handler node or error branch
  const hasExistingErrorHandler =
    nodes.some(
      (n) => n.n8nType.includes('errorTrigger') || n.label.toLowerCase().includes('error')
    ) || edges.some((e) => e.branchLabel === 'error');

  // Track error handler flagged nodes to prevent duplicates
  const flaggedErrorNodes = new Set<string>();

  for (const edge of edges) {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);

    if (!sourceNode || !targetNode) continue;

    // Rule 1: Trigger / Webhook directly feeding a Database or Notification (rule_missing_formatter)
    // Whiteboards often omit an Edit Fields (Set) node to sanitize or rename raw payload keys.
    const isSourceRawTrigger = sourceNode.category === 'trigger';
    const isTargetDataSink =
      targetNode.category === 'database' ||
      targetNode.category === 'notification' ||
      targetNode.n8nType.includes('postgres') ||
      targetNode.n8nType.includes('sheets') ||
      targetNode.n8nType.includes('slack') ||
      targetNode.n8nType.includes('airtable');

    if (
      isSourceRawTrigger &&
      isTargetDataSink &&
      !targetNode.isSuggested &&
      !sourceNode.isSuggested
    ) {
      const setDef = resolveNode('Edit Fields', 'transform');
      const suggestedNodeId = `suggested_set_${gapSequence++}`;

      recommendations.push({
        id: `gap_missing_formatter_${sourceNode.id}_${targetNode.id}`,
        ruleId: 'rule_missing_formatter',
        title: 'Missing Data Formatter',
        description: `Direct connection from ${sourceNode.label} to ${targetNode.label} may cause schema mismatches or unformatted text.`,
        severity: 'warning',
        sourceNodeId: sourceNode.id,
        targetNodeId: targetNode.id,
        reason:
          'Webhook payloads typically require field mapping, key renaming, or date formatting before inserting into a database or posting to chat.',
        suggestedNode: {
          id: suggestedNodeId,
          label: 'Format Payload',
          category: 'transform',
          n8nType: setDef.id,
          typeVersion: setDef.typeVersion,
          parameters: setDef.defaultParameters,
          position: [
            Math.round((sourceNode.position[0] + targetNode.position[0]) / 2),
            Math.round((sourceNode.position[1] + targetNode.position[1]) / 2)
          ],
          confidence: 0.95,
          isSuggested: true,
          notes: 'Auto recommended by DrawFlow to format raw webhook data'
        }
      });
    }

    // Rule 2: Database Query or API Call directly triggering an external Action or Notification (rule_missing_null_guard)
    // Whiteboards rarely draw the null check needed when a database row is not found.
    const isSourceDataLookup =
      sourceNode.category === 'database' ||
      (sourceNode.category === 'action' && sourceNode.n8nType.includes('http'));
    const isTargetExternalAction =
      targetNode.category === 'notification' || targetNode.category === 'action';

    if (isSourceDataLookup && isTargetExternalAction && !targetNode.isSuggested) {
      const ifDef = resolveNode('If', 'condition');
      const suggestedNodeId = `suggested_if_${gapSequence++}`;

      recommendations.push({
        id: `gap_missing_null_guard_${sourceNode.id}_${targetNode.id}`,
        ruleId: 'rule_missing_null_guard',
        title: 'Missing Null Check / Guard',
        description: `Direct connection from ${sourceNode.label} to ${targetNode.label} without validating whether records were returned.`,
        severity: 'warning',
        sourceNodeId: sourceNode.id,
        targetNodeId: targetNode.id,
        reason:
          'If the database query or API returns empty results, downstream notification actions will fail or transmit blank templates.',
        suggestedNode: {
          id: suggestedNodeId,
          label: 'Check Results Exist',
          category: 'condition',
          n8nType: ifDef.id,
          typeVersion: ifDef.typeVersion,
          parameters: ifDef.defaultParameters,
          position: [
            Math.round((sourceNode.position[0] + targetNode.position[0]) / 2),
            Math.round((sourceNode.position[1] + targetNode.position[1]) / 2) - 40
          ],
          confidence: 0.9,
          isSuggested: true,
          notes: 'Auto recommended by DrawFlow to verify record existence'
        }
      });
    }

    // Rule 4: Bulk array producer directly feeding a rate-limited external API or notification (rule_missing_batching)
    // Whiteboards omit pagination or loop controls when querying multiple items.
    const isSourceBulkProducer =
      sourceNode.category === 'database' ||
      sourceNode.n8nType.includes('airtable') ||
      sourceNode.n8nType.includes('sheets') ||
      sourceNode.label.toLowerCase().includes('search') ||
      sourceNode.label.toLowerCase().includes('list') ||
      sourceNode.label.toLowerCase().includes('get all');

    const isTargetRateLimitedService =
      targetNode.category === 'notification' ||
      (targetNode.category === 'action' && targetNode.n8nType.includes('http')) ||
      targetNode.n8nType.includes('slack') ||
      targetNode.n8nType.includes('gmail') ||
      targetNode.n8nType.includes('discord') ||
      targetNode.n8nType.includes('telegram');

    if (isSourceBulkProducer && isTargetRateLimitedService && !targetNode.isSuggested) {
      const batchDef = resolveNode('Split In Batches', 'transform');
      const suggestedNodeId = `suggested_batch_${gapSequence++}`;

      recommendations.push({
        id: `gap_missing_batching_${sourceNode.id}_${targetNode.id}`,
        ruleId: 'rule_missing_batching',
        title: 'Missing Batch Splitter / Loop',
        description: `Direct connection from ${sourceNode.label} to ${targetNode.label} may overwhelm rate limits if multiple records are returned.`,
        severity: 'info',
        sourceNodeId: sourceNode.id,
        targetNodeId: targetNode.id,
        reason:
          'Bulk records from queries should pass through Split In Batches to paginate items safely before invoking external APIs.',
        suggestedNode: {
          id: suggestedNodeId,
          label: 'Split In Batches',
          category: 'transform',
          n8nType: batchDef.id,
          typeVersion: batchDef.typeVersion,
          parameters: batchDef.defaultParameters,
          position: [
            Math.round((sourceNode.position[0] + targetNode.position[0]) / 2),
            Math.round((sourceNode.position[1] + targetNode.position[1]) / 2) + 40
          ],
          confidence: 0.88,
          isSuggested: true,
          notes: 'Auto recommended by DrawFlow to paginate bulk record arrays'
        }
      });
    }
  }

  // Rule 3: Critical write or payment operations without an Error Trigger handler (rule_missing_error_handler)
  // Scans for nodes performing mutations, charges, or database writes with no error branch.
  if (!hasExistingErrorHandler) {
    for (const node of nodes) {
      const labelLower = node.label.toLowerCase();
      const typeLower = node.n8nType.toLowerCase();
      const isCriticalWriteOperation =
        node.category === 'database' ||
        typeLower.includes('stripe') ||
        typeLower.includes('charge') ||
        labelLower.includes('payment') ||
        labelLower.includes('order') ||
        labelLower.includes('insert') ||
        labelLower.includes('update') ||
        labelLower.includes('delete') ||
        labelLower.includes('charge');

      if (isCriticalWriteOperation && !node.isSuggested && !flaggedErrorNodes.has(node.id)) {
        flaggedErrorNodes.add(node.id);
        const errorDef = resolveNode('Error Trigger', 'trigger');
        const suggestedNodeId = `suggested_error_${gapSequence++}`;

        // Find connected target or fallback to this node
        const connectedEdge = edges.find((e) => e.source === node.id);
        const targetNodeId = connectedEdge ? connectedEdge.target : node.id;

        recommendations.push({
          id: `gap_missing_error_handler_${node.id}`,
          ruleId: 'rule_missing_error_handler',
          title: 'Missing Error Handler',
          description: `Critical write operation in ${node.label} has no workflow error catch branch.`,
          severity: 'info',
          sourceNodeId: node.id,
          targetNodeId,
          reason:
            'Payment and database write operations should have an Error Trigger handler to catch unhandled rejections and notify the team.',
          suggestedNode: {
            id: suggestedNodeId,
            label: 'Catch Workflow Errors',
            category: 'trigger',
            n8nType: errorDef.id,
            typeVersion: errorDef.typeVersion,
            parameters: errorDef.defaultParameters,
            position: [node.position[0], node.position[1] + 160],
            confidence: 0.85,
            isSuggested: true,
            notes: 'Auto recommended by DrawFlow for workflow error alerting'
          }
        });
      }
    }
  }

  return recommendations;
}

/**
 * Applies a gap recommendation by inserting the suggested glue node
 * and rewiring edges so the workflow runs safely.
 */
export function applyGapRecommendation(
  nodes: GraphNode[],
  edges: GraphEdge[],
  recommendation: GapRecommendation
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodeMap = new Map<string, GraphNode>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  const sourceNode = nodeMap.get(recommendation.sourceNodeId);
  const targetNode = nodeMap.get(recommendation.targetNodeId);

  // Safe intermediate coordinate interpolation
  let posX = recommendation.suggestedNode.position[0];
  let posY = recommendation.suggestedNode.position[1];

  if (sourceNode && targetNode && sourceNode.id !== targetNode.id) {
    posX = Math.round((sourceNode.position[0] + targetNode.position[0]) / 2);
    posY = Math.round((sourceNode.position[1] + targetNode.position[1]) / 2);

    // If source and target are horizontally very close, offset slightly
    if (Math.abs(targetNode.position[0] - sourceNode.position[0]) < 100) {
      posX += 120;
    }
  } else if (sourceNode) {
    posX = sourceNode.position[0];
    posY = sourceNode.position[1] + 160;
  }

  const suggestedNode: GraphNode = {
    ...recommendation.suggestedNode,
    position: [posX, posY],
    isSuggested: true
  };

  const newNodes = [...nodes, suggestedNode];

  // If the suggested node is a trigger (e.g. Error Trigger), triggers have 0 inputs.
  // They do not break or splice an existing edge; they attach as a parallel trigger.
  if (suggestedNode.category === 'trigger') {
    const newEdges = [...edges];
    const targetToConnect =
      targetNode && targetNode.id !== sourceNode?.id
        ? targetNode.id
        : (nodes.find((n) => n.category === 'notification' || n.category === 'action')?.id ??
          sourceNode?.id);

    if (targetToConnect) {
      newEdges.push({
        id: `edge_${suggestedNode.id}_to_${targetToConnect}`,
        source: suggestedNode.id,
        target: targetToConnect,
        sourceIndex: 0,
        targetIndex: 0,
        branchLabel: 'error'
      });
    }
    return { nodes: newNodes, edges: newEdges };
  }

  // Normal glue node (Set, If, Split In Batches, etc.):
  // Splicing algorithm:
  // Remove the old direct edge from source to target, and insert two new edges:
  // edge 1: source -> suggestedNode
  // edge 2: suggestedNode -> target
  const newEdges: GraphEdge[] = [];
  let rewired = false;

  for (const edge of edges) {
    if (
      edge.source === recommendation.sourceNodeId &&
      edge.target === recommendation.targetNodeId &&
      !rewired
    ) {
      rewired = true;

      // Source to suggested node (preserves original sourceIndex and branchLabel)
      newEdges.push({
        id: `edge_${recommendation.sourceNodeId}_to_${suggestedNode.id}`,
        source: recommendation.sourceNodeId,
        target: suggestedNode.id,
        sourceIndex: edge.sourceIndex,
        targetIndex: 0,
        branchLabel: edge.branchLabel
      });

      // Suggested node to target (connects to original targetIndex)
      newEdges.push({
        id: `edge_${suggestedNode.id}_to_${recommendation.targetNodeId}`,
        source: suggestedNode.id,
        target: recommendation.targetNodeId,
        sourceIndex: 0,
        targetIndex: edge.targetIndex,
        branchLabel: 'main'
      });
    } else {
      newEdges.push(edge);
    }
  }

  // If no direct edge matched, add connecting edges safely
  if (!rewired && sourceNode && targetNode && sourceNode.id !== targetNode.id) {
    newEdges.push({
      id: `edge_${recommendation.sourceNodeId}_to_${suggestedNode.id}`,
      source: recommendation.sourceNodeId,
      target: suggestedNode.id,
      sourceIndex: 0,
      targetIndex: 0,
      branchLabel: 'main'
    });
    newEdges.push({
      id: `edge_${suggestedNode.id}_to_${recommendation.targetNodeId}`,
      source: suggestedNode.id,
      target: recommendation.targetNodeId,
      sourceIndex: 0,
      targetIndex: 0,
      branchLabel: 'main'
    });
  }

  return { nodes: newNodes, edges: newEdges };
}
