import path from 'path';
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {
  AnalysisResponse,
  DrawFlowGraph,
  GraphEdge,
  GraphNode,
  N8nWorkflow,
  auditWorkflowGaps,
  calculateTopologicalLayout,
  compileToN8nWorkflow,
  resolveNode
} from '@drawflow/shared';
import { extractGraphFromImage } from './gemini';

// Load .env from cwd, server directory, or project root
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Predefined deterministic presets for instant testing
const PRESETS_DATA: Record<
  string,
  { name: string; description: string; nodes: GraphNode[]; edges: GraphEdge[] }
> = {
  'order-pipeline': {
    name: 'E-Commerce Order Pipeline',
    description: 'Webhook -> PostgreSQL -> Slack (Flags missing data formatter and null guard)',
    nodes: [
      {
        id: 'node-webhook',
        label: 'Shopify Webhook',
        category: 'trigger',
        n8nType: 'n8n-nodes-base.webhook',
        typeVersion: 1,
        position: [240, 300],
        confidence: 0.98,
        bounds: { x: 120, y: 240, width: 180, height: 100 },
        parameters: { httpMethod: 'POST', path: 'shopify-order' }
      },
      {
        id: 'node-postgres',
        label: 'PostgreSQL Customer Query',
        category: 'database',
        n8nType: 'n8n-nodes-base.postgres',
        typeVersion: 2.4,
        position: [480, 300],
        confidence: 0.95,
        bounds: { x: 420, y: 240, width: 180, height: 100 },
        parameters: {
          operation: 'executeQuery',
          query: 'SELECT * FROM customers WHERE email = $1'
        }
      },
      {
        id: 'node-slack',
        label: 'Slack Notification',
        category: 'notification',
        n8nType: 'n8n-nodes-base.slack',
        typeVersion: 2.1,
        position: [720, 300],
        confidence: 0.96,
        bounds: { x: 720, y: 240, width: 180, height: 100 },
        parameters: { channel: '#orders', text: 'New order received from customer' }
      }
    ],
    edges: [
      {
        id: 'edge-1',
        source: 'node-webhook',
        target: 'node-postgres',
        sourceIndex: 0,
        targetIndex: 0,
        branchLabel: 'main'
      },
      {
        id: 'edge-2',
        source: 'node-postgres',
        target: 'node-slack',
        sourceIndex: 0,
        targetIndex: 0,
        branchLabel: 'main'
      }
    ]
  },
  'lead-enrichment': {
    name: 'Lead Capture & CRM Sync',
    description: 'Form Trigger -> Airtable -> Gmail (Generates customer onboarding workflow)',
    nodes: [
      {
        id: 'node-form',
        label: 'Typeform Lead Trigger',
        category: 'trigger',
        n8nType: 'n8n-nodes-base.formTrigger',
        typeVersion: 2,
        position: [240, 300],
        confidence: 0.97,
        bounds: { x: 120, y: 240, width: 180, height: 100 },
        parameters: { formTitle: 'Enterprise Demo Request' }
      },
      {
        id: 'node-airtable',
        label: 'Airtable Sync',
        category: 'database',
        n8nType: 'n8n-nodes-base.airtable',
        typeVersion: 2,
        position: [480, 300],
        confidence: 0.93,
        bounds: { x: 420, y: 240, width: 180, height: 100 },
        parameters: { operation: 'append' }
      },
      {
        id: 'node-gmail',
        label: 'Send Welcome Email',
        category: 'notification',
        n8nType: 'n8n-nodes-base.gmail',
        typeVersion: 2.1,
        position: [720, 300],
        confidence: 0.94,
        bounds: { x: 720, y: 240, width: 180, height: 100 },
        parameters: { operation: 'send', subject: 'Welcome to our platform' }
      }
    ],
    edges: [
      {
        id: 'edge-1',
        source: 'node-form',
        target: 'node-airtable',
        sourceIndex: 0,
        targetIndex: 0,
        branchLabel: 'main'
      },
      {
        id: 'edge-2',
        source: 'node-airtable',
        target: 'node-gmail',
        sourceIndex: 0,
        targetIndex: 0,
        branchLabel: 'main'
      }
    ]
  },
  'devops-alerts': {
    name: 'DevOps Alert Router',
    description: 'Schedule Trigger -> HTTP Health Check -> Discord Bot Alert',
    nodes: [
      {
        id: 'node-schedule',
        label: 'Hourly Cron Trigger',
        category: 'trigger',
        n8nType: 'n8n-nodes-base.scheduleTrigger',
        typeVersion: 1.1,
        position: [240, 300],
        confidence: 0.99,
        bounds: { x: 120, y: 240, width: 180, height: 100 },
        parameters: { rule: { interval: [{ field: 'hours', intervalValue: 1 }] } }
      },
      {
        id: 'node-http',
        label: 'API Health Check',
        category: 'action',
        n8nType: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [480, 300],
        confidence: 0.94,
        bounds: { x: 420, y: 240, width: 180, height: 100 },
        parameters: { method: 'GET', url: 'https://status.example.com/health' }
      },
      {
        id: 'node-discord',
        label: 'Discord Alert Bot',
        category: 'notification',
        n8nType: 'n8n-nodes-base.discord',
        typeVersion: 2,
        position: [720, 300],
        confidence: 0.95,
        bounds: { x: 720, y: 240, width: 180, height: 100 },
        parameters: { resource: 'message', operation: 'send', content: 'Server Health Alert' }
      }
    ],
    edges: [
      {
        id: 'edge-1',
        source: 'node-schedule',
        target: 'node-http',
        sourceIndex: 0,
        targetIndex: 0,
        branchLabel: 'main'
      },
      {
        id: 'edge-2',
        source: 'node-http',
        target: 'node-discord',
        sourceIndex: 0,
        targetIndex: 0,
        branchLabel: 'main'
      }
    ]
  }
};

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'DrawFlow API',
    model: process.env.AI_MODEL || 'gemini-2.5-flash',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/presets', (_req: Request, res: Response) => {
  const presetsList = Object.entries(PRESETS_DATA).map(([id, data]) => ({
    id,
    name: data.name,
    description: data.description,
    nodeCount: data.nodes.length
  }));
  res.json(presetsList);
});

app.post('/api/analyze', async (req: Request, res: Response) => {
  try {
    const { image, presetId } = req.body;

    // Path A: User uploaded an image and GEMINI_API_KEY is configured
    if (image && process.env.GEMINI_API_KEY) {
      console.log(
        `[DrawFlow Server] Analyzing diagram with ${process.env.AI_MODEL || 'gemini-2.5-flash'}...`
      );
      const rawExtracted = await extractGraphFromImage(image);

      // Resolve node types and default parameters
      const resolvedNodes: GraphNode[] = rawExtracted.nodes.map((node) => {
        const def = resolveNode(node.label, node.category);
        return {
          ...node,
          n8nType: def.id,
          typeVersion: def.typeVersion,
          parameters: def.defaultParameters
        };
      });

      // Calculate non overlapping topological layout
      const laidOutNodes = calculateTopologicalLayout(resolvedNodes, rawExtracted.edges);

      // Audit for missing glue nodes
      const recommendations = auditWorkflowGaps(laidOutNodes, rawExtracted.edges);

      // Compile to valid n8n workflow
      const workflow: N8nWorkflow = compileToN8nWorkflow(
        'DrawFlow Whiteboard Workflow',
        laidOutNodes,
        rawExtracted.edges
      );

      const graph: DrawFlowGraph = {
        nodes: laidOutNodes,
        edges: rawExtracted.edges,
        recommendations
      };

      const response: AnalysisResponse = {
        success: true,
        graph,
        workflow,
        source: 'ai',
        message: `Workflow extracted successfully using ${process.env.AI_MODEL || 'gemini-2.5-flash'} via Google AI Studio.`
      };

      return res.json(response);
    }

    // Path B: Preset requested or fallback fixture
    const targetPresetKey = presetId && PRESETS_DATA[presetId] ? presetId : 'order-pipeline';
    const preset = PRESETS_DATA[targetPresetKey];

    // Run preset through topological layout and gap auditor
    const laidOutNodes = calculateTopologicalLayout(preset.nodes, preset.edges);
    const recommendations = auditWorkflowGaps(laidOutNodes, preset.edges);
    const workflow: N8nWorkflow = compileToN8nWorkflow(preset.name, laidOutNodes, preset.edges);

    const graph: DrawFlowGraph = {
      nodes: laidOutNodes,
      edges: preset.edges,
      recommendations
    };

    const response: AnalysisResponse = {
      success: true,
      graph,
      workflow,
      source: 'fallback_preset',
      presetName: targetPresetKey,
      message: process.env.GEMINI_API_KEY
        ? 'Loaded preset workflow.'
        : 'Loaded high fidelity demonstration preset. Configure GEMINI_API_KEY in server/.env for live Gemini 2.5 Flash vision extraction.'
    };

    return res.json(response);
  } catch (err) {
    console.error('[DrawFlow Server] Analysis error:', err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : 'Internal analysis error occurred'
    });
  }
});

app.listen(PORT, () => {
  console.log(`[DrawFlow Server] Listening on http://localhost:${PORT}`);
});
