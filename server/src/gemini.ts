import { GoogleGenAI } from '@google/genai';
import { GraphEdge, GraphNode, NodeCategory } from '@drawflow/shared';

export interface RawExtractedGraph {
  nodes: Array<{
    id: string;
    label: string;
    category: NodeCategory;
    confidence?: number;
    bounds?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceIndex?: number;
    targetIndex?: number;
    branchLabel?: 'main' | 'true' | 'false' | 'error';
  }>;
}

const SYSTEM_INSTRUCTION = `You are DrawFlow, an expert automation architect and spatial diagram parser.
Your task is to analyze hand drawn whiteboard flowcharts and sketch diagrams, converting them into structured workflow graphs.

Instructions:
1. Identify all workflow step boxes and OCR their handwritten names (for example: "Shopify Webhook", "PostgreSQL", "Slack Alert", "Google Sheets", "If Approved").
2. Calculate normalized bounding box coordinates for each box on a scale of 0 to 1000: x, y, width, height.
3. Classify each node category into one of: trigger, action, condition, transform, database, notification, output.
4. Detect all directed arrows connecting boxes. For conditional branches, label branchLabel as "true", "false", or "main", and assign sourceIndex (0 for main/true, 1 for false).
5. Assign a confidence score between 0.0 and 1.0 for each detected node.

Respond ONLY with valid JSON following this exact structure:
{
  "nodes": [
    {
      "id": "node_1",
      "label": "Shopify Webhook",
      "category": "trigger",
      "confidence": 0.98,
      "bounds": { "x": 120, "y": 240, "width": 180, "height": 100 }
    }
  ],
  "edges": [
    {
      "id": "edge_1",
      "source": "node_1",
      "target": "node_2",
      "sourceIndex": 0,
      "targetIndex": 0,
      "branchLabel": "main"
    }
  ]
}`;

/**
 * Extracts a structured workflow graph from a whiteboard image using Google AI Studio.
 * Defaults to Gemma 4 (or model specified via AI_MODEL in .env).
 */
export async function extractGraphFromImage(
  base64DataUrl: string
): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server');
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = process.env.AI_MODEL || 'gemini-2.5-flash';

  // Parse mime type and raw base64 data
  let mimeType = 'image/png';
  let base64Data = base64DataUrl;

  const matches = base64DataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    mimeType = matches[1];
    base64Data = matches[2];
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'Analyze this whiteboard automation workflow drawing and extract its nodes and connection arrows into the requested JSON schema.'
            },
            {
              inlineData: {
                mimeType,
                data: base64Data
              }
            }
          ]
        }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '';
    const parsed: RawExtractedGraph = JSON.parse(text);

    if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
      throw new Error('AI response did not contain a valid nodes array');
    }

    // Convert raw extracted nodes to GraphNode with default positions
    const nodes: GraphNode[] = parsed.nodes.map((n, idx) => ({
      id: n.id || `node_${idx + 1}`,
      label: n.label || `Node ${idx + 1}`,
      category: n.category || 'action',
      n8nType: '', // Will be resolved by shared resolver
      typeVersion: 1,
      position: [0, 0], // Will be calculated by topological layout
      confidence: n.confidence ?? 0.9,
      bounds: n.bounds,
      parameters: {}
    }));

    const edges: GraphEdge[] = (parsed.edges || []).map((e, idx) => ({
      id: e.id || `edge_${idx + 1}`,
      source: e.source,
      target: e.target,
      sourceIndex: e.sourceIndex ?? 0,
      targetIndex: e.targetIndex ?? 0,
      branchLabel: e.branchLabel || 'main'
    }));

    return { nodes, edges };
  } catch (error) {
    console.error(`[DrawFlow AI] Failed with model ${modelName}:`, error);

    // Fallback to gemini-2.5-flash if Gemma 4 endpoint fails or is unavailable
    if (modelName !== 'gemini-2.5-flash') {
      console.log('[DrawFlow AI] Retrying with fallback model gemini-2.5-flash...');
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: 'Analyze this whiteboard automation workflow drawing and extract its nodes and connection arrows into the requested JSON schema.'
              },
              {
                inlineData: {
                  mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json'
        }
      });

      const fallbackText = fallbackResponse.text || '';
      const parsedFallback: RawExtractedGraph = JSON.parse(fallbackText);

      const nodes: GraphNode[] = (parsedFallback.nodes || []).map((n, idx) => ({
        id: n.id || `node_${idx + 1}`,
        label: n.label || `Node ${idx + 1}`,
        category: n.category || 'action',
        n8nType: '',
        typeVersion: 1,
        position: [0, 0],
        confidence: n.confidence ?? 0.9,
        bounds: n.bounds,
        parameters: {}
      }));

      const edges: GraphEdge[] = (parsedFallback.edges || []).map((e, idx) => ({
        id: e.id || `edge_${idx + 1}`,
        source: e.source,
        target: e.target,
        sourceIndex: e.sourceIndex ?? 0,
        targetIndex: e.targetIndex ?? 0,
        branchLabel: e.branchLabel || 'main'
      }));

      return { nodes, edges };
    }

    throw error;
  }
}
