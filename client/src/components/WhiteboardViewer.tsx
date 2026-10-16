import { FC, useState, useEffect, useRef, DragEvent } from 'react';
import { GraphNode } from '@drawflow/shared';
import { Eye, EyeOff, Upload } from 'lucide-react';

interface WhiteboardViewerProps {
  nodes: GraphNode[];
  previewUrl?: string;
  presetName?: string;
  selectedNodeId?: string | null;
  onSelectNode?: (nodeId: string | null) => void;
  onUploadImage?: (dataUrl: string) => void;
  onTriggerUploadClick?: () => void;
}

export const WhiteboardViewer: FC<WhiteboardViewerProps> = ({
  nodes,
  previewUrl,
  presetName,
  selectedNodeId,
  onSelectNode,
  onUploadImage,
  onTriggerUploadClick
}) => {
  const [showBoxes, setShowBoxes] = useState(true);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Nodes with bounding box coordinates (scaled 0 to 1000)
  const boundedNodes = nodes.filter((n) => n.bounds);

  // Handle Drag Over
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  // Handle Drop of custom image file
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const file = e.dataTransfer?.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl && onUploadImage) {
        onUploadImage(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Global paste handler (Ctrl+V / Cmd+V) to accept pasted whiteboard screenshots
  useEffect(() => {
    const handlePaste = (e: globalThis.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const dataUrl = event.target?.result as string;
              if (dataUrl && onUploadImage) {
                onUploadImage(dataUrl);
              }
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onUploadImage]);

  return (
    <div className="whiteboard-section">
      {/* Header with BBox toggle and Upload trigger */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8
        }}
      >
        <span className="section-label">Source Drawing</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {onTriggerUploadClick && (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ height: 26, padding: '0 8px', fontSize: 11 }}
              onClick={onTriggerUploadClick}
              title="Upload custom sketch photo"
            >
              <Upload size={12} />
              <span>Upload</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary"
            style={{ height: 26, padding: '0 8px', fontSize: 11 }}
            onClick={() => setShowBoxes(!showBoxes)}
            title="Toggle detected bounding boxes"
          >
            {showBoxes ? <EyeOff size={12} /> : <Eye size={12} />}
            <span>{showBoxes ? 'Hide BBoxes' : 'Show BBoxes'}</span>
          </button>
        </div>
      </div>

      {/* Whiteboard Frame (Drag-and-Drop Target) */}
      <div
        ref={containerRef}
        className={`whiteboard-frame ${isDraggingOver ? 'dragging-over' : ''}`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => onSelectNode?.(null)}
      >
        {/* Drag Overlay Feedback */}
        {isDraggingOver && (
          <div className="dropzone-overlay">
            <Upload size={32} style={{ color: 'var(--accent)', marginBottom: 8 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>
              Drop whiteboard photo here
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              PNG, JPG, or WebP diagram
            </span>
          </div>
        )}

        {previewUrl ? (
          <img
            src={previewUrl}
            alt={presetName || 'Whiteboard drawing'}
            className="whiteboard-image"
          />
        ) : (
          <svg
            viewBox="0 0 1000 700"
            style={{ width: '100%', height: '100%', display: 'block', backgroundColor: '#0f172a' }}
          >
            {/* Minimal SVG illustration representing hand drawn whiteboard flowchart */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="1000" height="700" fill="url(#grid)" />

            {/* Hand drawn style diagram shapes */}
            <g stroke="#94a3b8" strokeWidth="2" fill="#1e293b" strokeLinejoin="round">
              <rect x="120" y="240" width="180" height="100" rx="6" />
              <text
                x="210"
                y="295"
                fill="#f8fafc"
                fontSize="16"
                fontWeight="600"
                textAnchor="middle"
              >
                Webhook In
              </text>

              <path
                d="M 300 290 L 410 290"
                stroke="#94a3b8"
                strokeWidth="3"
                markerEnd="url(#arrow)"
              />

              <rect x="420" y="240" width="180" height="100" rx="6" />
              <text
                x="510"
                y="295"
                fill="#f8fafc"
                fontSize="16"
                fontWeight="600"
                textAnchor="middle"
              >
                Postgres Query
              </text>

              <path d="M 600 290 L 710 290" stroke="#94a3b8" strokeWidth="3" />

              <rect x="720" y="240" width="180" height="100" rx="6" />
              <text
                x="810"
                y="295"
                fill="#f8fafc"
                fontSize="16"
                fontWeight="600"
                textAnchor="middle"
              >
                Slack Alert
              </text>
            </g>
          </svg>
        )}

        {/* Spatial Bounding Boxes Rendered over the image */}
        {showBoxes &&
          boundedNodes.map((node) => {
            const b = node.bounds!;
            // Convert 0 to 1000 scale to percentage
            const left = `${b.x / 10}%`;
            const top = `${b.y / 7}%`;
            const width = `${b.width / 10}%`;
            const height = `${b.height / 7}%`;

            const isSelected = selectedNodeId === node.id;
            const isHovered = hoveredNodeId === node.id;

            return (
              <div
                key={`bbox-${node.id}`}
                className={`bounding-box ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
                style={{ left, top, width, height }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNode?.(node.id);
                }}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                title={`Click to inspect ${node.label} (${node.category})`}
              >
                <span className="bounding-box-label">{node.label}</span>
              </div>
            );
          })}
      </div>

      {/* Hint for drag-and-drop & clipboard paste */}
      <div
        style={{
          marginTop: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 11,
          color: 'var(--text-muted)'
        }}
      >
        <span>Drag & drop photo or paste image (Ctrl+V)</span>
        {selectedNodeId && (
          <span style={{ color: 'var(--accent)', fontWeight: 500 }}>Node selected</span>
        )}
      </div>
    </div>
  );
};
