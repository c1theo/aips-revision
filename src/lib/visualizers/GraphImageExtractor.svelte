<script lang="ts">
  import ExamAnswer from '../components/ExamAnswer.svelte';

  // GraphImageExtractor — extract a SearchGraph spec from an image of a
  // node-edge diagram (circles for nodes, lines for edges) using classical
  // computer vision + Tesseract OCR. No generative AI.
  //
  // Pipeline:
  //   1. Greyscale → adaptive binarise
  //   2. Find nodes by flood-filling the background and treating any
  //      enclosed (interior) white region as a circle interior
  //   3. Subtract node masks; remaining dark pixels are edges + labels
  //   4. Connected-components on the remainder; classify each as
  //      "edge" (long, thin, touches two node masks) or "label" (compact)
  //   5. OCR labels with Tesseract.js (lazy-loaded)
  //   6. Associate labels to nodes / edges by proximity
  //   7. Emit a spec in the same format as SearchGraph

  type Vec2 = { x: number; y: number };
  interface DetectedNode { id: number; cx: number; cy: number; r: number; label?: string; heuristic?: number; }
  interface DetectedEdge { id: number; a: number; b: number; px: Vec2; cost?: number; }
  interface TextBox { text: string; cx: number; cy: number; x0: number; y0: number; x1: number; y1: number; confidence: number; }

  let imageDataUrl = $state<string | null>(null);
  let processing = $state(false);
  let stage = $state<string>('');
  let progress = $state(0);
  let error = $state<string | null>(null);

  let nodes = $state<DetectedNode[]>([]);
  let edges = $state<DetectedEdge[]>([]);
  let textBoxes = $state<TextBox[]>([]);
  let extractedSpec = $state<string>('');
  let startNodeId = $state<number | null>(null);
  let goalNodeId = $state<number | null>(null);

  // Tunable params surfaced to the user.
  let threshold = $state(140);         // 0..255
  let minNodeRadius = $state(10);      // px
  let maxNodeRadius = $state(80);      // px

  // The processed/rendered canvas (binary + overlay).
  let displayCanvas: HTMLCanvasElement | null = $state(null);
  let imgEl: HTMLImageElement | null = null;

  // ── File / paste handlers ──
  function loadFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => { imageDataUrl = reader.result as string; reset(); };
    reader.readAsDataURL(file);
  }
  function onFileChange(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) loadFile(f);
  }
  function onPaste(e: ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const it of items) {
      if (it.type.startsWith('image/')) {
        const f = it.getAsFile();
        if (f) { loadFile(f); e.preventDefault(); return; }
      }
    }
  }
  function reset() {
    nodes = []; edges = []; textBoxes = [];
    extractedSpec = ''; startNodeId = null; goalNodeId = null;
    error = null;
  }

  // ── Image loading ──
  async function loadImage(): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      if (!imageDataUrl) { reject(new Error('No image')); return; }
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = imageDataUrl;
    });
  }

  // Downscale very large images so processing is fast.
  function drawToCanvas(img: HTMLImageElement): HTMLCanvasElement {
    const MAX = 900;
    const scale = Math.min(1, MAX / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d')!.drawImage(img, 0, 0, w, h);
    return c;
  }

  // ── Binarisation ──
  // Threshold to a binary mask (1 = ink/dark, 0 = paper/light).
  function binarise(src: HTMLCanvasElement, thr: number): { mask: Uint8Array; w: number; h: number } {
    const w = src.width, h = src.height;
    const d = src.getContext('2d')!.getImageData(0, 0, w, h).data;
    const mask = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const g = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
      mask[i] = g < thr ? 1 : 0;
    }
    return { mask, w, h };
  }

  // ── Connected components (4-connectivity) on a binary mask ──
  // Returns an array of components: each is a list of pixel indices.
  function connectedComponents(mask: Uint8Array, w: number, h: number, value: 0 | 1): {
    labels: Int32Array; components: number[][];
  } {
    const labels = new Int32Array(w * h).fill(-1);
    const components: number[][] = [];
    const stack: number[] = [];
    for (let i = 0; i < w * h; i++) {
      if (mask[i] !== value || labels[i] !== -1) continue;
      const label = components.length;
      const comp: number[] = [];
      stack.length = 0; stack.push(i); labels[i] = label;
      while (stack.length) {
        const p = stack.pop()!;
        comp.push(p);
        const x = p % w, y = (p / w) | 0;
        if (x > 0)     { const q = p - 1; if (mask[q] === value && labels[q] === -1) { labels[q] = label; stack.push(q); } }
        if (x < w - 1) { const q = p + 1; if (mask[q] === value && labels[q] === -1) { labels[q] = label; stack.push(q); } }
        if (y > 0)     { const q = p - w; if (mask[q] === value && labels[q] === -1) { labels[q] = label; stack.push(q); } }
        if (y < h - 1) { const q = p + w; if (mask[q] === value && labels[q] === -1) { labels[q] = label; stack.push(q); } }
      }
      components.push(comp);
    }
    return { labels, components };
  }

  // ── Node detection ──
  // Find circle-like shapes by flood-filling the *background* (white pixels
  // connected to the canvas border). Any white component NOT connected to
  // the border is an enclosed region — i.e. the interior of an outlined
  // circle (a node). This is robust to circle thickness, jaggedness, and
  // small breaks in the outline (after a morphological close to seal gaps).
  function detectNodes(mask: Uint8Array, w: number, h: number): DetectedNode[] {
    // 1. Morphological close: dilate then erode the ink mask, to seal small
    //    gaps in circle outlines.
    const closed = morphClose(mask, w, h, 2);

    // 2. Connected components on the white pixels (value = 0).
    const { components } = connectedComponents(closed, w, h, 0);

    // 3. The largest white component is the page background — drop it.
    //    Any other white component is "enclosed white" = a node interior.
    components.sort((a, b) => b.length - a.length);
    const interiors = components.slice(1);

    const minA = Math.PI * minNodeRadius * minNodeRadius;
    const maxA = Math.PI * maxNodeRadius * maxNodeRadius;
    const detected: DetectedNode[] = [];
    for (const comp of interiors) {
      if (comp.length < minA || comp.length > maxA) continue;
      // Centroid and bounding box
      let sx = 0, sy = 0, minX = w, maxX = 0, minY = h, maxY = 0;
      for (const p of comp) {
        const x = p % w, y = (p / w) | 0;
        sx += x; sy += y;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
      const cx = sx / comp.length, cy = sy / comp.length;
      const bw = maxX - minX + 1, bh = maxY - minY + 1;
      // Reject elongated regions (likely text or wedge-shaped, not nodes)
      const aspect = Math.min(bw, bh) / Math.max(bw, bh);
      if (aspect < 0.7) continue;
      // For a perfect inscribed circle, area / bbox-area = π/4 ≈ 0.785.
      // Allow some tolerance; this rejects triangular/curved enclosures
      // (e.g. the "interior" formed where 3+ edge lines cross).
      const fill = comp.length / (bw * bh);
      if (fill < 0.7) continue;
      // Circularity from second moments: for a perfect disc the ratio of
      // major/minor eigenvalue of the covariance matrix is 1; for an
      // elongated/irregular shape it's much greater than 1.
      let mxx = 0, myy = 0, mxy = 0;
      for (const p of comp) {
        const x = (p % w) - cx, y = ((p / w) | 0) - cy;
        mxx += x * x; myy += y * y; mxy += x * y;
      }
      mxx /= comp.length; myy /= comp.length; mxy /= comp.length;
      // Eigenvalues of 2×2 symmetric matrix [[mxx, mxy], [mxy, myy]]
      const tr = mxx + myy;
      const det = mxx * myy - mxy * mxy;
      const disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
      const l1 = tr / 2 + disc, l2 = tr / 2 - disc;
      const eccen = l2 > 0 ? l1 / l2 : Infinity;
      if (eccen > 1.6) continue;  // not circular enough
      const r = Math.max(bw, bh) / 2;
      detected.push({ id: detected.length, cx, cy, r });
    }
    return detected;
  }

  // Simple 3x3 morphological dilate (max) on ink-mask, repeated k times.
  function dilate(m: Uint8Array, w: number, h: number, k: number): Uint8Array {
    let cur = m;
    for (let it = 0; it < k; it++) {
      const next = new Uint8Array(w * h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let v = 0;
        for (let dy = -1; dy <= 1 && !v; dy++) for (let dx = -1; dx <= 1 && !v; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h && cur[ny * w + nx]) v = 1;
        }
        next[y * w + x] = v;
      }
      cur = next;
    }
    return cur;
  }
  function erode(m: Uint8Array, w: number, h: number, k: number): Uint8Array {
    let cur = m;
    for (let it = 0; it < k; it++) {
      const next = new Uint8Array(w * h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let v = 1;
        for (let dy = -1; dy <= 1 && v; dy++) for (let dx = -1; dx <= 1 && v; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= w || ny < 0 || ny >= h || !cur[ny * w + nx]) v = 0;
        }
        next[y * w + x] = v;
      }
      cur = next;
    }
    return cur;
  }
  const morphClose = (m: Uint8Array, w: number, h: number, k: number) => erode(dilate(m, w, h, k), w, h, k);

  // ── Edge detection ──
  // Mask out the node circles (a bit dilated), then connected components
  // on the remaining ink. Each long thin component that "touches" two
  // node-discs in its bounding box is an edge between those two nodes.
  function detectEdges(mask: Uint8Array, w: number, h: number, nodes: DetectedNode[]): {
    edges: DetectedEdge[]; residualMask: Uint8Array;
  } {
    // Build a node-occluding mask (1 = covered by a node disc).
    const nodeMask = new Uint8Array(w * h);
    for (const n of nodes) {
      const r = n.r + 4;  // bit of padding so the circle outline is also masked
      const x0 = Math.max(0, Math.floor(n.cx - r));
      const y0 = Math.max(0, Math.floor(n.cy - r));
      const x1 = Math.min(w - 1, Math.ceil(n.cx + r));
      const y1 = Math.min(h - 1, Math.ceil(n.cy + r));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const dx = x - n.cx, dy = y - n.cy;
        if (dx * dx + dy * dy <= r * r) nodeMask[y * w + x] = 1;
      }
    }
    // Residual = ink AND NOT nodeMask
    const residual = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) residual[i] = mask[i] && !nodeMask[i] ? 1 : 0;
    // Slight dilation so broken line segments rejoin.
    const dilated = dilate(residual, w, h, 1);

    const { components } = connectedComponents(dilated, w, h, 1);
    const edges: DetectedEdge[] = [];
    let edgeId = 0;
    for (const comp of components) {
      if (comp.length < 15) continue;
      // Bounding box
      let minX = w, maxX = 0, minY = h, maxY = 0, sx = 0, sy = 0;
      for (const p of comp) {
        const x = p % w, y = (p / w) | 0;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
        sx += x; sy += y;
      }
      const bw = maxX - minX + 1, bh = maxY - minY + 1;
      const aspect = Math.min(bw, bh) / Math.max(bw, bh);
      const elongation = Math.max(bw, bh);
      // Edge candidate: elongated and reasonably long
      if (aspect > 0.6 && elongation < 60) continue;  // probably a label
      if (elongation < 30) continue;

      // Find which two nodes this component touches: scan ring just outside
      // each node and count overlap with the component's pixel set.
      const compSet = new Set<number>(comp);
      const hits: { id: number; count: number }[] = [];
      for (const n of nodes) {
        const r0 = n.r + 2, r1 = n.r + 8;
        let count = 0;
        const x0 = Math.max(0, Math.floor(n.cx - r1));
        const y0 = Math.max(0, Math.floor(n.cy - r1));
        const x1 = Math.min(w - 1, Math.ceil(n.cx + r1));
        const y1 = Math.min(h - 1, Math.ceil(n.cy + r1));
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
          const dx = x - n.cx, dy = y - n.cy;
          const d2 = dx * dx + dy * dy;
          if (d2 < r0 * r0 || d2 > r1 * r1) continue;
          if (compSet.has(y * w + x)) count++;
        }
        if (count > 0) hits.push({ id: n.id, count });
      }
      hits.sort((a, b) => b.count - a.count);
      if (hits.length < 2) continue;
      const a = hits[0].id, b = hits[1].id;
      if (a === b) continue;
      // De-dup parallel edges
      if (edges.some((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a))) continue;
      edges.push({ id: edgeId++, a, b, px: { x: sx / comp.length, y: sy / comp.length } });
    }
    return { edges, residualMask: residual };
  }

  // ── OCR ──
  // Lazy-load Tesseract only when we actually press "Extract".
  async function ocr(canvas: HTMLCanvasElement): Promise<TextBox[]> {
    stage = 'Loading OCR engine (first run ~5 MB)…';
    const Tesseract = await import('tesseract.js');
    stage = 'Running OCR…';
    const worker = await Tesseract.createWorker('eng', 1, {
      logger: (m: { status: string; progress: number }) => {
        if (m.status === 'recognizing text') progress = Math.round(m.progress * 100);
      },
    });
    // Configure to recognise short strings of letters, digits, parentheses
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789().-_',
      tessedit_pageseg_mode: '11' as unknown as Tesseract.PSM, // sparse text (find as much as possible)
    });
    const { data } = await worker.recognize(canvas);
    await worker.terminate();
    const boxes: TextBox[] = [];
    for (const word of (data as any).words ?? []) {
      const bbox = word.bbox;
      if (!bbox) continue;
      boxes.push({
        text: (word.text || '').trim(),
        cx: (bbox.x0 + bbox.x1) / 2,
        cy: (bbox.y0 + bbox.y1) / 2,
        x0: bbox.x0, y0: bbox.y0, x1: bbox.x1, y1: bbox.y1,
        confidence: word.confidence || 0,
      });
    }
    return boxes.filter((b) => b.text.length > 0);
  }

  // ── Label association ──
  // For each node, find the nearest label whose centre is within ~2*radius.
  // Heuristic in brackets is parsed from a "A(5)"-style label.
  function associateNodeLabels(nodes: DetectedNode[], boxes: TextBox[]) {
    const used = new Set<number>();
    // Try to grab "A(5)" style labels first; otherwise just the nearest token.
    for (const n of nodes) {
      let best = -1, bestD = Infinity;
      for (let i = 0; i < boxes.length; i++) {
        if (used.has(i)) continue;
        const b = boxes[i];
        const dx = b.cx - n.cx, dy = b.cy - n.cy;
        const d = Math.hypot(dx, dy);
        if (d < bestD && d < n.r * 2.5) { bestD = d; best = i; }
      }
      if (best >= 0) {
        used.add(best);
        const text = boxes[best].text;
        const m = text.match(/^([A-Za-z]\w*)\s*\(\s*(-?\d+(?:\.\d+)?)\s*\)/);
        if (m) { n.label = m[1]; n.heuristic = parseFloat(m[2]); }
        else {
          n.label = text.replace(/[^A-Za-z0-9_]/g, '') || `N${n.id}`;
          // Look for a separate heuristic token very close (e.g. "(5)" detected as its own word)
          for (let i = 0; i < boxes.length; i++) {
            if (used.has(i)) continue;
            const b = boxes[i];
            const dx = b.cx - n.cx, dy = b.cy - n.cy;
            if (Math.hypot(dx, dy) < n.r * 2.5) {
              const m2 = b.text.match(/\(?\s*(-?\d+(?:\.\d+)?)\s*\)?/);
              if (m2) { n.heuristic = parseFloat(m2[1]); used.add(i); break; }
            }
          }
        }
      } else {
        n.label = `N${n.id}`;
      }
    }
  }

  function associateEdgeLabels(edges: DetectedEdge[], nodes: DetectedNode[], boxes: TextBox[], usedTexts: Set<TextBox>) {
    for (const e of edges) {
      const a = nodes.find((n) => n.id === e.a)!;
      const b = nodes.find((n) => n.id === e.b)!;
      const mx = (a.cx + b.cx) / 2, my = (a.cy + b.cy) / 2;
      const edgeLen = Math.hypot(a.cx - b.cx, a.cy - b.cy);
      let best: TextBox | null = null, bestD = Infinity;
      for (const tb of boxes) {
        if (usedTexts.has(tb)) continue;
        // Only consider numeric-looking labels
        if (!/^\d+(?:\.\d+)?$/.test(tb.text)) continue;
        const d = Math.hypot(tb.cx - mx, tb.cy - my);
        if (d < bestD && d < edgeLen * 0.6) { bestD = d; best = tb; }
      }
      if (best) { e.cost = parseFloat(best.text); usedTexts.add(best); }
    }
  }

  // ── Main extraction ──
  async function runExtraction() {
    if (!imageDataUrl) return;
    reset();
    processing = true; progress = 0; error = null;
    try {
      stage = 'Loading image…';
      const img = await loadImage();
      imgEl = img;
      const canvas = drawToCanvas(img);
      stage = 'Binarising…';
      const { mask, w, h } = binarise(canvas, threshold);
      stage = 'Detecting nodes…';
      const detNodes = detectNodes(mask, w, h);
      if (detNodes.length === 0) {
        error = 'No circular nodes detected. Try adjusting the threshold or node-radius range — and ensure the image shows clean closed circles.';
        nodes = []; processing = false; return;
      }
      stage = 'Detecting edges…';
      const { edges: detEdges } = detectEdges(mask, w, h, detNodes);
      stage = 'Running OCR on labels…';
      const boxes = await ocr(canvas);
      stage = 'Associating labels…';
      associateNodeLabels(detNodes, boxes);
      const used = new Set<TextBox>();
      // Mark node-label boxes as used (rough re-check by proximity)
      for (const n of detNodes) {
        for (const b of boxes) {
          if (Math.hypot(b.cx - n.cx, b.cy - n.cy) < n.r * 2.5) used.add(b);
        }
      }
      associateEdgeLabels(detEdges, detNodes, boxes, used);
      nodes = detNodes; edges = detEdges; textBoxes = boxes;
      // Default: start = first node, goal = last (user can change in the UI)
      if (nodes.length >= 2) {
        startNodeId = nodes[0].id;
        goalNodeId = nodes[nodes.length - 1].id;
      }
      rebuildSpec();
      drawOverlay(canvas);
      stage = `Done. Detected ${detNodes.length} nodes, ${detEdges.length} edges, ${boxes.length} text fragments.`;
    } catch (e) {
      error = String(e);
    } finally {
      processing = false;
    }
  }

  function drawOverlay(src: HTMLCanvasElement) {
    if (!displayCanvas) return;
    const c = displayCanvas;
    c.width = src.width; c.height = src.height;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(src, 0, 0);
    // Dim
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(0, 0, c.width, c.height);
    // Edges (drawn first so nodes overlay)
    ctx.strokeStyle = '#0ea5e9'; ctx.lineWidth = 2;
    for (const e of edges) {
      const a = nodes.find((n) => n.id === e.a), b = nodes.find((n) => n.id === e.b);
      if (!a || !b) continue;
      ctx.beginPath(); ctx.moveTo(a.cx, a.cy); ctx.lineTo(b.cx, b.cy); ctx.stroke();
      if (e.cost !== undefined) {
        ctx.fillStyle = '#0369a1'; ctx.font = 'bold 14px sans-serif';
        ctx.fillText(`${e.cost}`, (a.cx + b.cx) / 2, (a.cy + b.cy) / 2 - 4);
      }
    }
    // Nodes
    for (const n of nodes) {
      ctx.strokeStyle = n.id === startNodeId ? '#ca8a04' : n.id === goalNodeId ? '#dc2626' : '#16a34a';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(n.cx, n.cy, n.r, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#16a34a'; ctx.font = 'bold 14px sans-serif';
      const lbl = (n.label ?? '?') + (n.heuristic !== undefined ? `(${n.heuristic})` : '');
      ctx.fillText(lbl, n.cx + n.r + 2, n.cy + 4);
    }
  }

  function rebuildSpec() {
    if (nodes.length === 0) { extractedSpec = ''; return; }
    const labels = nodes.map((n) => n.label ?? `N${n.id}`);
    const nodeLine = nodes.map((n, i) => `${labels[i]}(${n.heuristic ?? 0})`).join(' ');
    const edgeLines: string[] = [];
    for (const e of edges) {
      const a = nodes.find((n) => n.id === e.a)!;
      const b = nodes.find((n) => n.id === e.b)!;
      edgeLines.push(`${a.label ?? `N${a.id}`}-${b.label ?? `N${b.id}`} ${e.cost ?? 1}`);
    }
    const start = nodes.find((n) => n.id === startNodeId)?.label ?? labels[0];
    const goal = nodes.find((n) => n.id === goalNodeId)?.label ?? labels[labels.length - 1];
    extractedSpec = `nodes: ${nodeLine}\nedges:\n${edgeLines.join('\n')}\nstart: ${start}\ngoal: ${goal}`;
  }

  function setStart(id: number) { startNodeId = id; rebuildSpec(); if (imgEl) { const c = drawToCanvas(imgEl); drawOverlay(c); } }
  function setGoal(id: number)  { goalNodeId  = id; rebuildSpec(); if (imgEl) { const c = drawToCanvas(imgEl); drawOverlay(c); } }
  function setNodeLabel(id: number, text: string) {
    const n = nodes.find((x) => x.id === id); if (!n) return;
    const m = text.match(/^([A-Za-z]\w*)\s*\(\s*(-?\d+(?:\.\d+)?)\s*\)\s*$/);
    if (m) { n.label = m[1]; n.heuristic = parseFloat(m[2]); }
    else { n.label = text || `N${id}`; }
    nodes = [...nodes]; rebuildSpec();
  }
  function setEdgeCost(id: number, costStr: string) {
    const e = edges.find((x) => x.id === id); if (!e) return;
    const v = parseFloat(costStr);
    e.cost = isNaN(v) ? undefined : v;
    edges = [...edges]; rebuildSpec();
  }
  function removeEdge(id: number) {
    edges = edges.filter((e) => e.id !== id); rebuildSpec();
    if (imgEl) drawOverlay(drawToCanvas(imgEl));
  }
  function removeNode(id: number) {
    nodes = nodes.filter((n) => n.id !== id);
    edges = edges.filter((e) => e.a !== id && e.b !== id);
    if (startNodeId === id) startNodeId = nodes[0]?.id ?? null;
    if (goalNodeId === id) goalNodeId = nodes[nodes.length - 1]?.id ?? null;
    rebuildSpec();
    if (imgEl) drawOverlay(drawToCanvas(imgEl));
  }

  function copySpec() {
    if (!extractedSpec) return;
    navigator.clipboard.writeText(extractedSpec).catch(() => {});
  }
</script>

<svelte:window onpaste={onPaste} />

<div class="space-y-3">
  <div class="card !p-3 bg-amber-50/60 dark:bg-amber-900/10 border-amber-300 dark:border-amber-700">
    <p class="text-sm m-0">
      <strong>Experimental — classical CV + OCR.</strong> Upload or paste an image
      of a node-edge graph diagram. We use pure-JS image processing (no neural
      networks) to find circles and connecting lines, plus Tesseract.js for OCR
      of node/edge labels. <em>Works best on clean printed diagrams with
      solid-outline circles, straight edges and printed labels.</em> Phone-photos
      of hand-drawn graphs are unlikely to extract perfectly — expect to fix a
      few labels manually, then send the spec to the main SearchGraph tool.
    </p>
  </div>

  <div class="flex flex-wrap gap-2 items-center text-sm">
    <label class="btn btn-sm cursor-pointer">
      Upload image
      <input type="file" accept="image/*" class="hidden" onchange={onFileChange} />
    </label>
    <span class="text-xs text-ink-500">…or paste from clipboard (Ctrl+V) anywhere on this page.</span>
    {#if imageDataUrl}
      <button class="btn btn-sm btn-primary ml-auto" disabled={processing} onclick={runExtraction}>
        {processing ? 'Working…' : 'Extract graph'}
      </button>
    {/if}
  </div>

  {#if imageDataUrl}
    <div class="flex flex-wrap gap-3 items-center text-xs">
      <label>Binarisation threshold (0–255):
        <input type="range" min="60" max="220" bind:value={threshold} class="align-middle" />
        <span class="font-mono">{threshold}</span>
      </label>
      <label>Min node radius:
        <input type="number" min="3" max="100" bind:value={minNodeRadius} class="w-16 px-1 py-0.5 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" />
      </label>
      <label>Max node radius:
        <input type="number" min="10" max="200" bind:value={maxNodeRadius} class="w-16 px-1 py-0.5 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" />
      </label>
    </div>
  {/if}

  {#if processing}
    <div class="text-sm">{stage} {progress ? `(${progress}%)` : ''}</div>
  {:else if stage}
    <div class="text-xs text-ink-500">{stage}</div>
  {/if}
  {#if error}
    <div class="text-sm text-red-600">{error}</div>
  {/if}

  <div class="grid lg:grid-cols-2 gap-3">
    <div class="card !p-2">
      {#if imageDataUrl}
        <div class="text-xs text-ink-500 mb-1">Source / detection overlay</div>
        {#if nodes.length > 0}
          <canvas bind:this={displayCanvas} class="w-full h-auto border border-ink-200 dark:border-ink-700 rounded"></canvas>
        {:else}
          <img src={imageDataUrl} alt="Source" class="w-full h-auto border border-ink-200 dark:border-ink-700 rounded" />
        {/if}
      {:else}
        <div class="text-sm text-ink-500 italic p-6 text-center">No image yet — upload or paste one.</div>
      {/if}
    </div>

    <div class="card !p-3 space-y-3">
      <div>
        <h4 class="!mt-0 text-sm font-semibold mb-1">Detected nodes ({nodes.length})</h4>
        {#if nodes.length === 0}
          <div class="text-xs text-ink-500 italic">none yet</div>
        {:else}
          <div class="space-y-1 max-h-40 overflow-y-auto">
            {#each nodes as n (n.id)}
              <div class="flex items-center gap-1 text-xs">
                <input type="text" class="w-32 px-1 py-0.5 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900 font-mono"
                       value={(n.label ?? `N${n.id}`) + (n.heuristic !== undefined ? `(${n.heuristic})` : '')}
                       onchange={(e) => setNodeLabel(n.id, (e.target as HTMLInputElement).value)} />
                <button class="px-1 rounded {startNodeId === n.id ? 'bg-amber-200 dark:bg-amber-700' : 'border border-ink-300 dark:border-ink-700'}"
                        onclick={() => setStart(n.id)}>start</button>
                <button class="px-1 rounded {goalNodeId === n.id ? 'bg-red-200 dark:bg-red-700' : 'border border-ink-300 dark:border-ink-700'}"
                        onclick={() => setGoal(n.id)}>goal</button>
                <button class="px-1 rounded border border-ink-300 dark:border-ink-700 text-red-500" onclick={() => removeNode(n.id)}>×</button>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <div>
        <h4 class="!mt-0 text-sm font-semibold mb-1">Detected edges ({edges.length})</h4>
        {#if edges.length === 0}
          <div class="text-xs text-ink-500 italic">none yet</div>
        {:else}
          <div class="space-y-1 max-h-40 overflow-y-auto">
            {#each edges as e (e.id)}
              {@const a = nodes.find((n) => n.id === e.a)}
              {@const b = nodes.find((n) => n.id === e.b)}
              <div class="flex items-center gap-1 text-xs font-mono">
                <span class="w-24">{a?.label ?? '?'}–{b?.label ?? '?'}</span>
                cost <input type="number" class="w-16 px-1 py-0.5 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900"
                            value={e.cost ?? ''} onchange={(ev) => setEdgeCost(e.id, (ev.target as HTMLInputElement).value)} />
                <button class="px-1 rounded border border-ink-300 dark:border-ink-700 text-red-500" onclick={() => removeEdge(e.id)}>×</button>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>

  {#if extractedSpec}
    <div class="card !p-3">
      <div class="flex items-center gap-2 mb-1">
        <h4 class="!mt-0 text-sm font-semibold">Extracted SearchGraph spec</h4>
        <button class="btn btn-sm ml-auto" onclick={copySpec}>Copy</button>
        <a class="btn btn-sm btn-primary" href="#/visualizers" onclick={copySpec}>Copy &amp; open SearchGraph</a>
      </div>
      <textarea class="w-full font-mono text-xs p-2 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" rows="10" bind:value={extractedSpec}></textarea>
      <div class="text-xs text-ink-500 mt-1">
        Paste this spec into the <em>Search on arbitrary graph</em> visualiser to trace BFS / A* / etc. on it.
      </div>
    </div>
  {/if}

  <ExamAnswer
    summary="Classical CV extraction of a graph diagram"
    answer={`This tool demonstrates a **non-AI** image-to-graph extraction pipeline:\n\n1. **Binarise** the image (greyscale → threshold).\n2. **Detect nodes** by flood-filling the background and treating enclosed white regions as circle interiors — robust to thickness and small breaks.\n3. **Detect edges** by masking out the node discs and finding long thin connected components in the residual ink that touch two node-rings.\n4. **OCR labels** with Tesseract.js (a discriminative model, not generative AI) on the original image.\n5. **Associate** text boxes to nodes (proximity) and edges (proximity, numeric-only).\n\n**Limitations.** Hand-drawn diagrams, curved edges, overlapping labels, and noisy phone photos significantly reduce accuracy. The extracted spec is meant as a *starting point* — verify and correct in the UI before sending to SearchGraph.`}
  />
</div>
