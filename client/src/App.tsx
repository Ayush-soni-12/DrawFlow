import { useState, useEffect } from 'react';

interface ServerStatus {
  status: string;
  service: string;
  geminiConfigured: boolean;
  timestamp: string;
}

export default function App() {
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [copied, setCopied] = useState(false);
  const [activePreset, setActivePreset] = useState('order-pipeline');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data: ServerStatus) => setServerStatus(data))
      .catch((err) => console.log('Backend starting up...', err));
  }, []);

  const handleCopy = () => {
    // Copy sample n8n workflow JSON to clipboard
    const sampleWorkflow = {
      name: 'Shopify Order Processing Pipeline (DrawFlow)',
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
          parameters: {
            operation: 'executeQuery',
            query: 'SELECT * FROM customers WHERE email = $1'
          }
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

    navigator.clipboard.writeText(JSON.stringify(sampleWorkflow, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Top Navigation */}
      <header className="app-header">
        <div className="brand-group">
          <div className="brand-logo">D</div>
          <div>
            <h1 className="brand-title">DrawFlow</h1>
          </div>
          <span className="badge-tag">Whiteboard to n8n</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: 'var(--text-secondary)'
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: serverStatus ? 'var(--accent-emerald)' : 'var(--accent-amber)'
              }}
            />
            {serverStatus ? 'API Connected' : 'Connecting backend...'}
          </div>

          <button
            id="btn-copy-n8n"
            className="btn btn-success"
            onClick={handleCopy}
            title="Copies valid n8n JSON. Switch to n8n canvas and press Ctrl+V"
          >
            {copied ? '✓ Copied to Clipboard!' : 'Copy for n8n (Ctrl+V)'}
          </button>
        </div>
      </header>

      {/* Main Split View */}
      <main className="workspace-container">
        {/* Left: Presets & Upload */}
        <section className="sidebar-panel">
          <div>
            <h2
              style={{
                fontSize: '14px',
                fontWeight: 600,
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: '12px',
                letterSpacing: '0.05em'
              }}
            >
              Whiteboard Presets
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div
                id="preset-order"
                className={`preset-card ${activePreset === 'order-pipeline' ? 'active' : ''}`}
                onClick={() => setActivePreset('order-pipeline')}
              >
                <div className="preset-title">E-Commerce Order Pipeline</div>
                <div className="preset-desc">
                  Webhook &rarr; Database &rarr; Slack (Flags missing transformer)
                </div>
              </div>

              <div
                id="preset-leads"
                className={`preset-card ${activePreset === 'lead-enrichment' ? 'active' : ''}`}
                onClick={() => setActivePreset('lead-enrichment')}
              >
                <div className="preset-title">Lead Capture & Enrichment</div>
                <div className="preset-desc">
                  Form &rarr; API Lookup &rarr; CRM Sync (Flags rate limiting)
                </div>
              </div>

              <div
                id="preset-devops"
                className={`preset-card ${activePreset === 'devops-alerts' ? 'active' : ''}`}
                onClick={() => setActivePreset('devops-alerts')}
              >
                <div className="preset-title">DevOps CloudWatch Router</div>
                <div className="preset-desc">
                  SNS Trigger &rarr; PagerDuty &rarr; Discord (Flags error guard)
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2
              style={{
                fontSize: '14px',
                fontWeight: 600,
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: '12px',
                letterSpacing: '0.05em'
              }}
            >
              Upload Custom Sketch
            </h2>
            <div
              id="dropzone"
              style={{
                border: '2px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '24px 16px',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.02)',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📷</div>
              <div style={{ fontSize: '13px', fontWeight: 500 }}>Drop whiteboard photo here</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                PNG, JPG or WEBP up to 10MB
              </div>
            </div>
          </div>
        </section>

        {/* Center: Canvas View */}
        <section className="canvas-panel" style={{ padding: '24px', overflowY: 'auto' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}
          >
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Workflow Topology</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                3 detected nodes, 2 architectural gap recommendations
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="badge-tag">Autolayout Active</span>
            </div>
          </div>

          {/* Workflow Sequence Preview */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '32px 16px',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              overflowX: 'auto'
            }}
          >
            {/* Node 1 */}
            <div
              style={{
                minWidth: '180px',
                padding: '16px',
                background: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-active)'
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--accent-cyan)',
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}
              >
                Trigger Node
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '4px' }}>
                Shopify Webhook
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                POST /shopify-order
              </div>
            </div>

            <div style={{ color: 'var(--text-muted)', fontSize: '18px' }}>&rarr;</div>

            {/* Suggested Node (Pulsing Amber) */}
            <div
              style={{
                minWidth: '200px',
                padding: '16px',
                background: 'rgba(245, 158, 11, 0.1)',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--accent-amber)',
                boxShadow: '0 0 15px rgba(245, 158, 11, 0.2)'
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--accent-amber)',
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}
              >
                Suggested Glue Node
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '4px' }}>
                Format Order Payload
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Edit Fields (Set)
              </div>
            </div>

            <div style={{ color: 'var(--text-muted)', fontSize: '18px' }}>&rarr;</div>

            {/* Node 2 */}
            <div
              style={{
                minWidth: '180px',
                padding: '16px',
                background: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--accent-primary)',
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}
              >
                Database Node
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '4px' }}>
                PostgreSQL Query
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Find customer by email
              </div>
            </div>

            <div style={{ color: 'var(--text-muted)', fontSize: '18px' }}>&rarr;</div>

            {/* Node 3 */}
            <div
              style={{
                minWidth: '180px',
                padding: '16px',
                background: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--accent-emerald)',
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}
              >
                Notification Node
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '4px' }}>Slack Alert</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Post to #orders
              </div>
            </div>
          </div>
        </section>

        {/* Right: Architectural Gap Advisor */}
        <aside className="advisor-panel">
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}
            >
              <h2
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.05em'
                }}
              >
                Architecture Advisor
              </h2>
              <span style={{ fontSize: '11px', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                2 Gaps Detected
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              DrawFlow detected omitted glue nodes between your whiteboard steps.
            </p>
          </div>

          {/* Advice 1 */}
          <div className="advice-card">
            <div className="advice-badge">⚠️ Missing Data Formatter</div>
            <div className="advice-title">Direct Webhook to DB Connection</div>
            <div className="advice-desc">
              Shopify webhooks produce complex nested payloads. Inserting an Edit Fields node cleans
              the parameters before the SQL execution.
            </div>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '6px 10px', marginTop: '4px' }}
            >
              ✓ Auto-Inserted in Export
            </button>
          </div>

          {/* Advice 2 */}
          <div className="advice-card">
            <div className="advice-badge" style={{ color: 'var(--accent-cyan)' }}>
              💡 Missing Null Check
            </div>
            <div className="advice-title">Unhandled New Customer Path</div>
            <div className="advice-desc">
              If the customer is not found in PostgreSQL, downstream Slack messages may send empty
              strings. Add an If condition.
            </div>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '6px 10px', marginTop: '4px' }}
            >
              + Add If Guard Node
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}
