// RelationshipGraph — interactive node-edge diagram using Canvas API
// UX spec §5.8: Force-directed graph, click-to-expand, hover tooltips, zoom/pan, minimap

import { h, React } from '../lib/dom.js';

const NODE_TYPES = {
  Participant: { color: '#5c7cfa', radius: 18, label: 'Participant' },
  Asset: { color: '#22c55e', radius: 14, label: 'Asset' },
  Product: { color: '#f59e0b', radius: 14, label: 'Product' },
  Fund: { color: '#f97316', radius: 14, label: 'Fund' },
  Account: { color: '#3b82f6', radius: 12, label: 'Account' },
  Position: { color: '#a855f7', radius: 12, label: 'Position' },
  Settlement: { color: '#ef4444', radius: 12, label: 'Settlement' },
  Payment: { color: '#06b6d4', radius: 12, label: 'Payment' },
  Document: { color: '#6b7280', radius: 10, label: 'Document' },
  Wallet: { color: '#ec4899', radius: 10, label: 'Wallet' },
};

const INITIAL_NODES = [
  { id: 'center', label: 'Apple Inc.', sublabel: 'US0378331005', type: 'Asset', x: 400, y: 300, fixed: true },
  { id: 'n1', label: 'Goldman Sachs', sublabel: 'LEI: 549300...', type: 'Participant', x: 200, y: 150 },
  { id: 'n2', label: 'BlackRock Global', sublabel: 'Fund Manager', type: 'Participant', x: 600, y: 120 },
  { id: 'n3', label: 'Custody Acct 0456', sublabel: 'BNY Mellon', type: 'Account', x: 150, y: 350 },
  { id: 'n4', label: 'Pos: 50,000 sh', sublabel: 'ABOR Position', type: 'Position', x: 250, y: 450 },
  { id: 'n5', label: 'Fund BR-Global-01', sublabel: 'Mutual Fund', type: 'Fund', x: 550, y: 350 },
  { id: 'n6', label: 'AAPL-T Token', sublabel: 'ERC-3643', type: 'Asset', x: 650, y: 450 },
  { id: 'n7', label: 'STL-000456', sublabel: 'Settlement', type: 'Settlement', x: 400, y: 150 },
  { id: 'n8', label: 'Payment $5.2M', sublabel: 'SWIFT gpi', type: 'Payment', x: 500, y: 500 },
  { id: 'n9', label: 'JPMorgan Chase', sublabel: 'Custodian', type: 'Participant', x: 100, y: 250 },
  { id: 'n10', label: 'MSFT Position', sublabel: '15,000 shares', type: 'Position', x: 300, y: 200 },
  { id: 'n11', label: 'DTCC', sublabel: 'CCP', type: 'Participant', x: 700, y: 250 },
  { id: 'n12', label: 'Wallet 0x7f3a...', sublabel: 'Ethereum', type: 'Wallet', x: 600, y: 200 },
  { id: 'n13', label: 'SEC Filing', sublabel: 'Form PF', type: 'Document', x: 200, y: 520 },
  { id: 'n14', label: 'Product Alpha', sublabel: 'ILP Structure', type: 'Product', x: 450, y: 400 },
  { id: 'n15', label: 'Euroclear', sublabel: 'ICSDS', type: 'Participant', x: 700, y: 380 },
];

const INITIAL_EDGES = [
  { id: 'e1', source: 'center', target: 'n1', label: 'held by', type: 'owns' },
  { id: 'e2', source: 'center', target: 'n2', label: 'managed by', type: 'references' },
  { id: 'e3', source: 'center', target: 'n3', label: 'custodied at', type: 'settled-by' },
  { id: 'e4', source: 'center', target: 'n4', label: 'has position', type: 'owns' },
  { id: 'e5', source: 'center', target: 'n5', label: 'held in', type: 'references' },
  { id: 'e6', source: 'center', target: 'n6', label: 'tokenised as', type: 'references' },
  { id: 'e7', source: 'center', target: 'n7', label: 'settles via', type: 'settled-by' },
  { id: 'e8', source: 'n3', target: 'n9', label: 'at custodian', type: 'references' },
  { id: 'e9', source: 'n7', target: 'n8', label: 'funds', type: 'settled-by' },
  { id: 'e10', source: 'n1', target: 'n3', label: 'manages', type: 'references' },
  { id: 'e11', source: 'n5', target: 'n4', label: 'contains', type: 'owns' },
  { id: 'e12', source: 'n6', target: 'n12', label: 'stored in', type: 'references' },
  { id: 'e13', source: 'n7', target: 'n11', label: 'cleared by', type: 'references' },
  { id: 'e14', source: 'n2', target: 'n5', label: 'manages', type: 'references' },
  { id: 'e15', source: 'n4', target: 'n10', label: 'related', type: 'references' },
  { id: 'e16', source: 'center', target: 'n15', label: 'settles via', type: 'references' },
];

export function RelationshipGraph() {
  const canvasRef = React.useRef(null);
  const containerRef = React.useRef(null);
  const [nodes, setNodes] = React.useState(INITIAL_NODES);
  const [edges, setEdges] = React.useState(INITIAL_EDGES);
  const [hoveredNode, setHoveredNode] = React.useState(null);
  const [tooltip, setTooltip] = React.useState(null);
  const [expandedNodes, setExpandedNodes] = React.useState(new Set());
  const [legendOpen, setLegendOpen] = React.useState(true);
  const animRef = React.useRef(null);
  const dragRef = React.useRef(null);
  const viewRef = React.useRef({ offsetX: 0, offsetY: 0, scale: 1.0 });
  const mouseRef = React.useRef({ x: 0, y: 0 });
  const lastMouseRef = React.useRef({ x: 0, y: 0 });

  // Force simulation state
  const simRef = React.useRef({ nodes: [], velocities: {} });

  React.useEffect(() => {
    // Initialize velocities
    nodes.forEach(n => {
      if (!simRef.current.velocities[n.id]) {
        simRef.current.velocities[n.id] = { vx: 0, vy: 0 };
      }
    });
    simRef.current.nodes = nodes.map(n => ({ ...n }));

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const container = containerRef.current;
    let rafId;

    const resizeCanvas = () => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const findNodeAt = (mx, my) => {
      const { offsetX, offsetY, scale } = viewRef.current;
      const simNodes = simRef.current.nodes;
      for (let i = simNodes.length - 1; i >= 0; i--) {
        const n = simNodes[i];
        const nx = n.x * scale + offsetX;
        const ny = n.y * scale + offsetY;
        const r = (NODE_TYPES[n.type]?.radius || 14) * scale;
        const dx = mx - nx;
        const dy = my - ny;
        if (dx * dx + dy * dy <= r * r + 16) return i;
      }
      return -1;
    };

    const forceStep = () => {
      const simNodes = simRef.current.nodes;
      const vel = simRef.current.velocities;
      const w = canvas.width / window.devicePixelRatio || 800;
      const h = canvas.height / window.devicePixelRatio || 600;
      const centerX = w / 2 - viewRef.current.offsetX;
      const centerY = h / 2 - viewRef.current.offsetY;

      for (let i = 0; i < simNodes.length; i++) {
        const a = simNodes[i];
        if (a.fixed) continue;
        let fx = 0, fy = 0;

        // Repulsion between all nodes
        for (let j = 0; j < simNodes.length; j++) {
          if (i === j) continue;
          const b = simNodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 800 / (dist * dist);
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
        }

        // Attraction along edges
        edges.forEach(edge => {
          const b = simNodes.find(n => n.id === edge.target);
          if (!b || (a.id !== edge.source && a.id !== edge.target)) return;
          const other = a.id === edge.source ? b : simNodes.find(n => n.id === edge.source);
          if (!other) return;
          const dx = other.x - a.x;
          const dy = other.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - 120) * 0.005;
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
        });

        // Center gravity
        fx += (centerX - a.x) * 0.001;
        fy += (centerY - a.y) * 0.001;

        // Damping
        if (!vel[a.id]) vel[a.id] = { vx: 0, vy: 0 };
        vel[a.id].vx = (vel[a.id].vx + fx) * 0.85;
        vel[a.id].vy = (vel[a.id].vy + fy) * 0.85;

        // Apply velocity
        if (Math.abs(vel[a.id].vx) > 0.01 || Math.abs(vel[a.id].vy) > 0.01) {
          a.x += vel[a.id].vx;
          a.y += vel[a.id].vy;
        }
      }
    };

    const draw = () => {
      const w = canvas.width / window.devicePixelRatio;
      const h = canvas.height / window.devicePixelRatio;
      ctx.clearRect(0, 0, w, h);

      const { offsetX, offsetY, scale } = viewRef.current;
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      // Draw edges
      edges.forEach(edge => {
        const src = simRef.current.nodes.find(n => n.id === edge.source);
        const tgt = simRef.current.nodes.find(n => n.id === edge.target);
        if (!src || !tgt) return;

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Edge label
        const mx = (src.x + tgt.x) / 2;
        const my = (src.y + tgt.y) / 2;
        ctx.fillStyle = '#64748b';
        ctx.font = '8px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(edge.label, mx, my - 4);

        // Direction arrow
        const angle = Math.atan2(tgt.y - src.y, tgt.x - src.x);
        const tgtR = (NODE_TYPES[tgt.type]?.radius || 14) + 4;
        const ax = tgt.x - Math.cos(angle) * tgtR;
        const ay = tgt.y - Math.sin(angle) * tgtR;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax - Math.cos(angle - 0.5) * 6, ay - Math.sin(angle - 0.5) * 6);
        ctx.lineTo(ax - Math.cos(angle + 0.5) * 6, ay - Math.sin(angle + 0.5) * 6);
        ctx.closePath();
        ctx.fillStyle = '#64748b';
        ctx.fill();
      });

      // Draw nodes
      simRef.current.nodes.forEach(n => {
        const cfg = NODE_TYPES[n.type] || { color: '#6b7280', radius: 12 };
        const r = cfg.radius;
        const isCenter = n.id === 'center';
        const isHovered = hoveredNode === n.id;

        // Glow for center node
        if (isCenter) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, r + 8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(92, 124, 250, 0.15)';
          ctx.fill();
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = cfg.color;
        ctx.fill();

        if (isHovered) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Label
        const fontSize = isCenter ? 11 : 9;
        ctx.fillStyle = '#e2e8f0';
        ctx.font = `${isCenter ? 'bold ' : ''}${fontSize}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        const label = n.label.length > 20 ? n.label.slice(0, 18) + '...' : n.label;
        ctx.fillText(label, n.x, n.y + r + 14);

        // Sublabel
        if (n.sublabel && (isCenter || isHovered)) {
          ctx.fillStyle = '#94a3b8';
          ctx.font = '8px Inter, system-ui, sans-serif';
          ctx.fillText(n.sublabel, n.x, n.y + r + 24);
        }
      });

      ctx.restore();

      // Minimap
      const mmW = 160, mmH = 120;
      const mmX = w - mmW - 10, mmY = h - mmH - 10;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(mmX, mmY, mmW, mmH, 4);
      ctx.fill();
      ctx.stroke();

      // Viewport indicator
      const viewScale = 0.15;
      ctx.strokeStyle = '#5c7cfa';
      ctx.lineWidth = 1;
      ctx.strokeRect(
        mmX + (-offsetX / scale) * viewScale,
        mmY + (-offsetY / scale) * viewScale,
        (w / scale) * viewScale,
        (h / scale) * viewScale
      );

      // Count
      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px Inter, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${nodes.length} nodes · ${edges.length} edges`, w - 14, mmY - 6);
    };

    const animate = () => {
      forceStep();
      draw();
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      mouseRef.current = { x: mx, y: my };

      // Handle drag
      if (dragRef.current) {
        const dx = (mx - lastMouseRef.current.x);
        const dy = (my - lastMouseRef.current.y);
        const simNode = simRef.current.nodes.find(n => n.id === dragRef.current);
        if (simNode && simNode.fixed) {
          simNode.x += dx / viewRef.current.scale;
          simNode.y += dy / viewRef.current.scale;
        } else {
          viewRef.current.offsetX += dx;
          viewRef.current.offsetY += dy;
        }
        lastMouseRef.current = { x: mx, y: my };
        return;
      }

      const nodeIdx = findNodeAt(mx, my);
      if (nodeIdx >= 0) {
        const n = simRef.current.nodes[nodeIdx];
        setHoveredNode(n.id);
        setTooltip({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          node: n,
        });
        canvas.style.cursor = 'pointer';
      } else {
        setHoveredNode(null);
        setTooltip(null);
        canvas.style.cursor = 'grab';
      }
    };

    const handleWheel = (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newScale = Math.max(0.2, Math.min(3, viewRef.current.scale * zoomFactor));
      // Zoom toward mouse
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      viewRef.current.offsetX = mx - ((mx - viewRef.current.offsetX) / viewRef.current.scale) * newScale;
      viewRef.current.offsetY = my - ((my - viewRef.current.offsetY) / viewRef.current.scale) * newScale;
      viewRef.current.scale = newScale;
    };

    const handleMouseDown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      lastMouseRef.current = { x: mx, y: my };

      const nodeIdx = findNodeAt(mx, my);
      if (nodeIdx >= 0) {
        dragRef.current = simRef.current.nodes[nodeIdx].id;
      } else {
        dragRef.current = 'pan';
        canvas.style.cursor = 'grabbing';
      }
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      canvas.style.cursor = hoveredNode ? 'pointer' : 'grab';
    };

    const handleClick = (e) => {
      if (dragRef.current && lastMouseRef.current.x !== undefined) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const moved = Math.abs(mx - lastMouseRef.current.x) > 3 || Math.abs(my - lastMouseRef.current.y) > 3;
        if (moved) return;
      }

      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const nodeIdx = findNodeAt(mx, my);
      if (nodeIdx >= 0) {
        const node = simRef.current.nodes[nodeIdx];
        // Double-click to re-center
        const now = Date.now();
        if (canvas._lastClick && canvas._lastClick.nodeId === node.id && now - canvas._lastClick.time < 300) {
          // Re-center
          viewRef.current.scale = 1.0;
          const w = canvas.width / window.devicePixelRatio;
          const h = canvas.height / window.devicePixelRatio;
          viewRef.current.offsetX = w / 2 - node.x;
          viewRef.current.offsetY = h / 2 - node.y;
          canvas._lastClick = null;
          return;
        }
        canvas._lastClick = { nodeId: node.id, time: now };
        // Expand/collapse
        setExpandedNodes(prev => {
          const next = new Set(prev);
          if (next.has(node.id)) next.delete(node.id); else next.add(node.id);
          return next;
        });
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mouseleave', () => { setHoveredNode(null); setTooltip(null); dragRef.current = null; });

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('mouseleave', () => {});
    };
  }, []);

  return h('div', { className: 'flex h-full' },
    // Main graph area
    h('div', { className: 'flex-1 relative', ref: containerRef },
      h('canvas', {
        ref: canvasRef,
        className: 'w-full h-full',
        style: { cursor: 'grab' },
        tabIndex: 0,
        'aria-label': 'Relationship graph showing 15 nodes and 16 edges. Center node is Apple Inc. asset. Interact with mouse to pan, zoom, and click nodes.',
        role: 'img',
      }),

      // Tooltip overlay
      tooltip && h('div', {
        className: 'absolute pointer-events-none bg-surface-raised border border-surface-border rounded-lg px-3 py-2 shadow-lg z-20',
        style: {
          left: Math.min(tooltip.x + 16, (containerRef.current?.getBoundingClientRect()?.width || 800) - 200),
          top: Math.min(tooltip.y + 16, (containerRef.current?.getBoundingClientRect()?.height || 600) - 80),
        }
      },
        h('div', { className: 'text-xs font-medium text-slate-200' }, tooltip.node.label),
        tooltip.node.sublabel && h('div', { className: 'text-2xs text-slate-500 font-mono' }, tooltip.node.sublabel),
        h('div', { className: 'mt-1' },
          h('span', {
            className: 'px-1.5 py-0.5 rounded text-2xs',
            style: { backgroundColor: (NODE_TYPES[tooltip.node.type]?.color || '#6b7280') + '20', color: NODE_TYPES[tooltip.node.type]?.color || '#6b7280' }
          }, tooltip.node.type),
        ),
      ),

      // Legend toggle
      h('button', {
        className: 'absolute top-3 left-3 px-2 py-1 bg-surface/80 border border-surface-border rounded text-xs text-slate-400 hover:text-slate-200 focus-ring',
        onClick: () => setLegendOpen(!legendOpen),
        'aria-label': 'Toggle legend'
      }, legendOpen ? 'Legend ▾' : 'Legend ▸'),

      // Legend panel
      legendOpen && h('div', { className: 'absolute top-10 left-3 bg-surface/90 border border-surface-border rounded-lg p-3 z-10 text-xs max-h-[320px] overflow-auto scrollbar-thin' },
        h('div', { className: 'text-2xs text-slate-500 uppercase mb-2' }, 'Object Types'),
        ...Object.entries(NODE_TYPES).map(([type, cfg]) =>
          h('div', { key: type, className: 'flex items-center gap-2 mb-1.5' },
            h('div', {
              className: 'w-3 h-3 rounded-full shrink-0',
              style: { backgroundColor: cfg.color }
            }),
            h('span', { className: 'text-slate-300' }, type),
          )
        ),
        h('div', { className: 'text-2xs text-slate-500 mt-3 mb-1' }, 'Controls'),
        h('div', { className: 'text-2xs text-slate-500' }, '🖱 Scroll: zoom'),
        h('div', { className: 'text-2xs text-slate-500' }, '🖱 Drag: pan'),
        h('div', { className: 'text-2xs text-slate-500' }, '🖱 Click node: expand'),
        h('div', { className: 'text-2xs text-slate-500' }, '🖱 Double-click: re-center'),
      ),

      // Zoom controls
      h('div', { className: 'absolute bottom-3 right-3 flex gap-1' },
        h('button', {
          className: 'w-7 h-7 bg-surface/80 border border-surface-border rounded text-xs text-slate-400 hover:text-slate-200 focus-ring flex items-center justify-center',
          onClick: () => {
            viewRef.current.scale = Math.min(3, viewRef.current.scale + 0.2);
          },
          'aria-label': 'Zoom in',
        }, '+'),
        h('button', {
          className: 'w-7 h-7 bg-surface/80 border border-surface-border rounded text-xs text-slate-400 hover:text-slate-200 focus-ring flex items-center justify-center',
          onClick: () => {
            viewRef.current.scale = Math.max(0.2, viewRef.current.scale - 0.2);
          },
          'aria-label': 'Zoom out',
        }, '−'),
        h('button', {
          className: 'w-7 h-7 bg-surface/80 border border-surface-border rounded text-xs text-slate-400 hover:text-slate-200 focus-ring flex items-center justify-center',
          onClick: () => {
            viewRef.current.scale = 1.0;
            viewRef.current.offsetX = 0;
            viewRef.current.offsetY = 0;
          },
          'aria-label': 'Reset view',
        }, '⟳'),
      ),
    ),

    // Sidebar info
    h('div', { className: 'w-56 border-l border-surface-border bg-surface-raised/30 p-3 overflow-auto scrollbar-thin hidden lg:block' },
      h('h3', { className: 'text-xs font-semibold text-slate-400 uppercase mb-3' }, 'Graph Info'),
      h('div', { className: 'space-y-2 text-xs' },
        h('div', { className: 'flex justify-between py-1' },
          h('span', { className: 'text-slate-500' }, 'Nodes'),
          h('span', { className: 'text-slate-300' }, nodes.length),
        ),
        h('div', { className: 'flex justify-between py-1' },
          h('span', { className: 'text-slate-500' }, 'Edges'),
          h('span', { className: 'text-slate-300' }, edges.length),
        ),
        h('div', { className: 'flex justify-between py-1' },
          h('span', { className: 'text-slate-500' }, 'Center'),
          h('span', { className: 'text-slate-300' }, 'Apple Inc.'),
        ),
        h('div', { className: 'flex justify-between py-1' },
          h('span', { className: 'text-slate-500' }, 'Hovered'),
          h('span', { className: 'text-slate-300' }, hoveredNode ? simRef.current.nodes.find(n => n.id === hoveredNode)?.label || '—' : '—'),
        ),
      ),
      h('div', { className: 'mt-4 pt-3 border-t border-surface-border' },
        h('button', {
          className: 'w-full py-1.5 text-xs text-slate-400 hover:text-slate-200 border border-surface-border rounded hover:bg-surface-overlay focus-ring',
          onClick: () => {
            // Simulate export
            alert('PNG export would be triggered here in production.');
          },
        }, '📥 Export PNG'),
      ),
    ),
  );
}
