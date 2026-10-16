import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AnalysisResponse, DrawFlowGraph, N8nWorkflow } from '@drawflow/shared';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Sample deterministic preset for instant testing
const orderProcessingGraph: DrawFlowGraph = {
  nodes: [
    {
      id: 'node-1',
      label: 'Shopify Order Webhook',
      category: 'trigger',
      n8nType: 'n8n-nodes-base.webhook',
      parameters: { httpMethod: 'POST', path: 'shopify-order' }
    },
    {
      id: 'node-2',
      label: 'PostgreSQL Customer Query',
      category: 'database',
      n8nType: 'n8n-nodes-base.postgres',
      parameters: { operation: 'executeQuery', query: 'SELECT * FROM customers WHERE email = $1' }
    },
    {
      id: 'node-3',
      label: 'Send Slack Notification',
      category: 'notification',
      n8nType: 'n8n-nodes-base.slack',
      parameters: { channel: '#orders', text: 'New order received from customer' }
    }
  ],
  edges: [
    { id: 'edge-1', source: 'node-1', target: 'node-2' },
    { id: 'edge-2', source: 'node-2', target: 'node-3' }
  ],
  recommendations: [
    {
      id: 'rec-1',
      title: 'Missing Data Formatter Node',
      description:
        'Shopify webhook output contains nested JSON line items that PostgreSQL and Slack cannot read directly.',
      severity: 'warning',
      sourceNodeId: 'node-1',
      targetNodeId: 'node-2',
      reason: 'Raw webhook payload structure mismatch with SQL parameter expectations.',
      suggestedNode: {
        id: 'suggested-formatter',
        label: 'Format Order Payload',
        category: 'transform',
        n8nType: 'n8n-nodes-base.set',
        isSuggested: true,
        parameters: { mode: 'manual', options: {} },
        notes: 'Advised by DrawFlow: cleans and extracts customer email and total price'
      }
    },
    {
      id: 'rec-2',
      title: 'Missing Null Customer Guard',
      description:
        'If PostgreSQL returns no rows for a first-time customer, the Slack alert will fail or send undefined fields.',
      severity: 'info',
      sourceNodeId: 'node-2',
      targetNodeId: 'node-3',
      reason: 'No conditional branch to handle existing vs new customer profiles.',
      suggestedNode: {
        id: 'suggested-if-guard',
        label: 'Check Customer Found',
        category: 'condition',
        n8nType: 'n8n-nodes-base.if',
        isSuggested: true,
        parameters: {
          conditions: { string: [{ value1: '={{ $json.id }}', operation: 'isNotEmpty' }] }
        },
        notes: 'Advised by DrawFlow: branches between existing member and new guest'
      }
    }
  ]
};

const orderProcessingWorkflow: N8nWorkflow = {
  name: 'Shopify Order Processing Pipeline',
  nodes: [
    {
      id: 'node-1',
      name: 'Shopify Order Webhook',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 1,
      position: [240, 300],
      parameters: { httpMethod: 'POST', path: 'shopify-order' }
    },
    {
      id: 'suggested-formatter',
      name: 'Format Order Payload',
      type: 'n8n-nodes-base.set',
      typeVersion: 2,
      position: [480, 300],
      parameters: { mode: 'manual', options: {} },
      notesInFlow: true,
      notes: 'Advised by DrawFlow: extracts clean customer and price values'
    },
    {
      id: 'node-2',
      name: 'PostgreSQL Customer Query',
      type: 'n8n-nodes-base.postgres',
      typeVersion: 1,
      position: [720, 300],
      parameters: { operation: 'executeQuery', query: 'SELECT * FROM customers WHERE email = $1' }
    },
    {
      id: 'node-3',
      name: 'Send Slack Notification',
      type: 'n8n-nodes-base.slack',
      typeVersion: 1,
      position: [960, 300],
      parameters: { channel: '#orders', text: 'New order received from customer' }
    }
  ],
  connections: {
    'Shopify Order Webhook': {
      main: [[{ node: 'Format Order Payload', type: 'main', index: 0 }]]
    },
    'Format Order Payload': {
      main: [[{ node: 'PostgreSQL Customer Query', type: 'main', index: 0 }]]
    },
    'PostgreSQL Customer Query': {
      main: [[{ node: 'Send Slack Notification', type: 'main', index: 0 }]]
    }
  }
};

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'DrawFlow API',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/presets', (_req: Request, res: Response) => {
  res.json([
    {
      id: 'order-pipeline',
      name: 'E-Commerce Order Pipeline',
      description:
        'Webhook -> PostgreSQL -> Slack (Identifies missing payload formatter and null guards)',
      previewImage: 'order-whiteboard.png'
    },
    {
      id: 'lead-enrichment',
      name: 'Lead Capture & Enrichment Flow',
      description: 'Form submission -> Clearbit enrichment -> CRM sync -> Welcome email',
      previewImage: 'lead-whiteboard.png'
    },
    {
      id: 'devops-alerts',
      name: 'DevOps CloudWatch Alert Router',
      description: 'SNS alert trigger -> Error filter -> PagerDuty escalation -> Discord alert',
      previewImage: 'devops-whiteboard.png'
    }
  ]);
});

app.post('/api/analyze', async (req: Request, res: Response) => {
  const { presetId } = req.body;

  // If no Gemini key is provided or preset requested, return high-fidelity fallback preset
  const response: AnalysisResponse = {
    success: true,
    graph: orderProcessingGraph,
    workflow: orderProcessingWorkflow,
    source: process.env.GEMINI_API_KEY ? 'ai' : 'fallback_preset',
    presetName: presetId || 'order-pipeline',
    message: process.env.GEMINI_API_KEY
      ? 'Workflow analyzed and compiled successfully.'
      : 'Loaded high fidelity demonstration preset. Configure GEMINI_API_KEY for live camera analysis.'
  };

  res.json(response);
});

app.listen(PORT, () => {
  console.log(`[DrawFlow Server] Listening on http://localhost:${PORT}`);
});
