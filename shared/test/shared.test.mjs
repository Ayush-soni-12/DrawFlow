import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveNode,
  calculateTopologicalLayout,
  auditWorkflowGaps,
  applyGapRecommendation,
  compileToN8nWorkflow,
  stringifyWorkflow
} from '../dist/index.js';

test('AC-3: Curated node resolution for common automation nodes', () => {
  const webhook = resolveNode('Shopify Webhook');
  assert.equal(webhook.id, 'n8n-nodes-base.webhook');
  assert.equal(webhook.category, 'trigger');
  assert.equal(webhook.defaultParameters.httpMethod, 'POST');

  const slack = resolveNode('Send Slack alert');
  assert.equal(slack.id, 'n8n-nodes-base.slack');
  assert.equal(slack.category, 'notification');

  const postgres = resolveNode('PostgreSQL user query');
  assert.equal(postgres.id, 'n8n-nodes-base.postgres');
  assert.equal(postgres.category, 'database');
});

test('AC-4: Universal node resolver for unrecognized services with safe defaults', () => {
  // Arbitrary service name should normalize to camelCase slug
  const airtable = resolveNode('Custom Airtable Sync');
  assert.equal(airtable.id, 'n8n-nodes-base.airtable');
  assert.equal(airtable.category, 'database');
  assert.deepEqual(airtable.inputs, ['main']);
  assert.deepEqual(airtable.outputs, ['main']);

  const stripe = resolveNode('Stripe Payment Checkout', 'action');
  assert.equal(stripe.id, 'n8n-nodes-base.stripe');
  assert.equal(stripe.category, 'action');

  const zendesk = resolveNode('Zendesk Support Ticket');
  assert.equal(zendesk.id, 'n8n-nodes-base.zendesk');
  assert.ok(zendesk.inputs.length > 0);

  const customErp = resolveNode('Custom Internal ERP Sync');
  assert.equal(customErp.id, 'n8n-nodes-base.internalErp');
  assert.equal(customErp.category, 'action');
});

test('AC-1 & Topological Layout: Computes non-overlapping coordinates progressing left to right', () => {
  const nodes = [
    {
      id: 'node-1',
      label: 'Webhook',
      category: 'trigger',
      n8nType: 'n8n-nodes-base.webhook',
      typeVersion: 1,
      position: [0, 0],
      confidence: 1,
      parameters: {}
    },
    {
      id: 'node-2',
      label: 'Postgres',
      category: 'database',
      n8nType: 'n8n-nodes-base.postgres',
      typeVersion: 2,
      position: [0, 0],
      confidence: 1,
      parameters: {}
    },
    {
      id: 'node-3',
      label: 'Slack',
      category: 'notification',
      n8nType: 'n8n-nodes-base.slack',
      typeVersion: 2,
      position: [0, 0],
      confidence: 1,
      parameters: {}
    }
  ];

  const edges = [
    { id: 'e1', source: 'node-1', target: 'node-2', sourceIndex: 0, targetIndex: 0 },
    { id: 'e2', source: 'node-2', target: 'node-3', sourceIndex: 0, targetIndex: 0 }
  ];

  const laidOut = calculateTopologicalLayout(nodes, edges);
  assert.equal(laidOut.length, 3);

  const [n1, n2, n3] = laidOut;
  // Node 1 should be to the left of Node 2, and Node 2 to the left of Node 3
  assert.ok(n1.position[0] < n2.position[0]);
  assert.ok(n2.position[0] < n3.position[0]);
  assert.equal(n2.position[0] - n1.position[0], 240);
  assert.equal(n3.position[0] - n2.position[0], 240);
});

test('AC-1, AC-2, AC-3: Architectural gap advisor evaluates four rule categories, severities, and splicing', () => {
  const nodes = [
    {
      id: 'node-1',
      label: 'Shopify Webhook',
      category: 'trigger',
      n8nType: 'n8n-nodes-base.webhook',
      typeVersion: 1,
      position: [240, 300],
      confidence: 0.98,
      parameters: {}
    },
    {
      id: 'node-2',
      label: 'PostgreSQL Query',
      category: 'database',
      n8nType: 'n8n-nodes-base.postgres',
      typeVersion: 2,
      position: [480, 300],
      confidence: 0.95,
      parameters: {}
    },
    {
      id: 'node-3',
      label: 'Slack Notification',
      category: 'notification',
      n8nType: 'n8n-nodes-base.slack',
      typeVersion: 2,
      position: [720, 300],
      confidence: 0.96,
      parameters: {}
    }
  ];

  const edges = [
    { id: 'e1', source: 'node-1', target: 'node-2', sourceIndex: 0, targetIndex: 0 },
    { id: 'e2', source: 'node-2', target: 'node-3', sourceIndex: 0, targetIndex: 0 }
  ];

  const gaps = auditWorkflowGaps(nodes, edges);
  assert.equal(gaps.length, 4);

  // 1. Missing Formatter (Warning)
  const formatterGap = gaps.find((g) => g.ruleId === 'rule_missing_formatter');
  assert.ok(formatterGap);
  assert.equal(formatterGap.severity, 'warning');
  assert.equal(formatterGap.suggestedNode.category, 'transform');
  assert.equal(formatterGap.suggestedNode.n8nType, 'n8n-nodes-base.set');

  // 2. Missing Null Guard (Warning)
  const nullGuardGap = gaps.find((g) => g.ruleId === 'rule_missing_null_guard');
  assert.ok(nullGuardGap);
  assert.equal(nullGuardGap.severity, 'warning');
  assert.equal(nullGuardGap.suggestedNode.category, 'condition');
  assert.equal(nullGuardGap.suggestedNode.n8nType, 'n8n-nodes-base.if');

  // 3. Missing Loop Batching (Info)
  const batchingGap = gaps.find((g) => g.ruleId === 'rule_missing_batching');
  assert.ok(batchingGap);
  assert.equal(batchingGap.severity, 'info');
  assert.equal(batchingGap.suggestedNode.category, 'transform');
  assert.equal(batchingGap.suggestedNode.n8nType, 'n8n-nodes-base.splitInBatches');

  // 4. Missing Error Handler (Info)
  const errorGap = gaps.find((g) => g.ruleId === 'rule_missing_error_handler');
  assert.ok(errorGap);
  assert.equal(errorGap.severity, 'info');
  assert.equal(errorGap.suggestedNode.category, 'trigger');
  assert.equal(errorGap.suggestedNode.n8nType, 'n8n-nodes-base.errorTrigger');

  // Test AC-3: One-click auto-insert and edge rewiring with coordinate interpolation
  const rewired = applyGapRecommendation(nodes, edges, formatterGap);
  assert.equal(rewired.nodes.length, 4);
  assert.equal(rewired.edges.length, 3);
  assert.ok(rewired.edges.some((e) => e.target === formatterGap.suggestedNode.id));
  assert.ok(
    rewired.edges.some((e) => e.source === formatterGap.suggestedNode.id && e.target === 'node-2')
  );
  // Coordinate interpolation
  const splicedNode = rewired.nodes.find((n) => n.id === formatterGap.suggestedNode.id);
  assert.ok(splicedNode);
  assert.equal(splicedNode.position[0], Math.round((240 + 480) / 2));
  assert.equal(splicedNode.position[1], Math.round((300 + 300) / 2));
});

test('AC-2: Workflow compilation preserves multi-pin conditional branches and connections', () => {
  const nodes = [
    {
      id: 'node-if',
      label: 'If Condition',
      category: 'condition',
      n8nType: 'n8n-nodes-base.if',
      typeVersion: 2,
      position: [480, 300],
      confidence: 1,
      parameters: {}
    },
    {
      id: 'node-true',
      label: 'Slack VIP',
      category: 'notification',
      n8nType: 'n8n-nodes-base.slack',
      typeVersion: 2,
      position: [720, 200],
      confidence: 1,
      parameters: {}
    },
    {
      id: 'node-false',
      label: 'Slack Regular',
      category: 'notification',
      n8nType: 'n8n-nodes-base.slack',
      typeVersion: 2,
      position: [720, 400],
      confidence: 1,
      parameters: {}
    }
  ];

  const edges = [
    {
      id: 'e-true',
      source: 'node-if',
      target: 'node-true',
      sourceIndex: 0,
      targetIndex: 0,
      branchLabel: 'true'
    },
    {
      id: 'e-false',
      source: 'node-if',
      target: 'node-false',
      sourceIndex: 1,
      targetIndex: 0,
      branchLabel: 'false'
    }
  ];

  const workflow = compileToN8nWorkflow('Conditional Test Workflow', nodes, edges);
  assert.equal(workflow.name, 'Conditional Test Workflow');
  assert.equal(workflow.nodes.length, 3);

  // Check n8n multi-pin connection routing
  const ifConn = workflow.connections['If Condition'];
  assert.ok(ifConn);
  assert.ok(ifConn.main);
  // Branch 0 (true) connects to Slack VIP
  assert.equal(ifConn.main[0][0].node, 'Slack VIP');
  assert.equal(ifConn.main[0][0].index, 0);
  // Branch 1 (false) connects to Slack Regular
  assert.equal(ifConn.main[1][0].node, 'Slack Regular');
  assert.equal(ifConn.main[1][0].index, 0);

  const jsonStr = stringifyWorkflow(workflow);
  assert.ok(jsonStr.includes('Conditional Test Workflow'));
});

test('AC-1, AC-3, AC-5: Sequential gap resolution, Error Trigger handling, and n8n export', () => {
  const nodes = [
    {
      id: 'node-1',
      label: 'Shopify Webhook',
      category: 'trigger',
      n8nType: 'n8n-nodes-base.webhook',
      typeVersion: 1,
      position: [240, 300],
      confidence: 0.98,
      parameters: {}
    },
    {
      id: 'node-2',
      label: 'PostgreSQL Query',
      category: 'database',
      n8nType: 'n8n-nodes-base.postgres',
      typeVersion: 2,
      position: [480, 300],
      confidence: 0.95,
      parameters: {}
    },
    {
      id: 'node-3',
      label: 'Slack Notification',
      category: 'notification',
      n8nType: 'n8n-nodes-base.slack',
      typeVersion: 2,
      position: [720, 300],
      confidence: 0.96,
      parameters: {}
    }
  ];

  const edges = [
    { id: 'e1', source: 'node-1', target: 'node-2', sourceIndex: 0, targetIndex: 0 },
    { id: 'e2', source: 'node-2', target: 'node-3', sourceIndex: 0, targetIndex: 0 }
  ];

  // 1. Audit initial gaps
  const initialGaps = auditWorkflowGaps(nodes, edges);
  assert.equal(initialGaps.length, 4);

  // 2. Apply Formatter gap
  const formatterGap = initialGaps.find((g) => g.ruleId === 'rule_missing_formatter');
  assert.ok(formatterGap);
  const step1 = applyGapRecommendation(nodes, edges, formatterGap);

  // Re-audit: rule_missing_formatter should be resolved
  const gapsAfterFormatter = auditWorkflowGaps(step1.nodes, step1.edges);
  assert.ok(!gapsAfterFormatter.some((g) => g.ruleId === 'rule_missing_formatter'));

  // 3. Apply Null Guard gap
  const nullGuardGap = gapsAfterFormatter.find((g) => g.ruleId === 'rule_missing_null_guard');
  assert.ok(nullGuardGap);
  const step2 = applyGapRecommendation(step1.nodes, step1.edges, nullGuardGap);
  assert.equal(step2.nodes.length, 5); // Webhook, Format Payload, Postgres, Check Results Exist, Slack
  assert.equal(step2.edges.length, 4);

  // 4. Apply Error Trigger gap
  const errorGap = initialGaps.find((g) => g.ruleId === 'rule_missing_error_handler');
  assert.ok(errorGap);
  const step3 = applyGapRecommendation(step2.nodes, step2.edges, errorGap);
  assert.equal(step3.nodes.length, 6);
  // Error trigger attaches parallel trigger edge to target notification node
  const errorTriggerNode = step3.nodes.find((n) => n.n8nType.includes('errorTrigger'));
  assert.ok(errorTriggerNode);
  const errorEdge = step3.edges.find((e) => e.source === errorTriggerNode.id);
  assert.ok(errorEdge);
  assert.equal(errorEdge.branchLabel, 'error');

  // 5. Compile to n8n workflow and verify n8n compatibility
  const compiledWorkflow = compileToN8nWorkflow(
    'Production Ready Workflow',
    step3.nodes,
    step3.edges
  );
  assert.equal(compiledWorkflow.name, 'Production Ready Workflow');
  assert.equal(compiledWorkflow.nodes.length, 6);

  // Verify all suggested nodes carry proper n8n types
  const n8nNodeTypes = compiledWorkflow.nodes.map((n) => n.type);
  assert.ok(n8nNodeTypes.includes('n8n-nodes-base.set'));
  assert.ok(n8nNodeTypes.includes('n8n-nodes-base.if'));
  assert.ok(n8nNodeTypes.includes('n8n-nodes-base.errorTrigger'));

  // Ensure JSON export serializes cleanly
  const exportedJson = stringifyWorkflow(compiledWorkflow);
  const parsed = JSON.parse(exportedJson);
  assert.equal(parsed.nodes.length, 6);
  assert.ok(parsed.connections);
});
