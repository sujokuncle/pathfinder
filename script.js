// MinHeap implementation
class MinHeap {
    constructor() {
        this.heap = [];
    }

    insert(node, dist) {
        this.heap.push({ node, dist });
        this.bubbleUp();
    }

    bubbleUp() {
        let idx = this.heap.length - 1;
        while (idx > 0) {
            let parent = Math.floor((idx - 1) / 2);
            if (this.heap[parent].dist <= this.heap[idx].dist) break;
            [this.heap[parent], this.heap[idx]] = [this.heap[idx], this.heap[parent]];
            idx = parent;
        }
    }

    extractMin() {
        if (this.heap.length === 1) return this.heap.pop();
        const min = this.heap[0];
        this.heap[0] = this.heap.pop();
        this.sinkDown(0);
        return min;
    }

    sinkDown(idx) {
        const length = this.heap.length;
        while (true) {
            let left = 2 * idx + 1, right = 2 * idx + 2, smallest = idx;
            if (left < length && this.heap[left].dist < this.heap[smallest].dist) smallest = left;
            if (right < length && this.heap[right].dist < this.heap[smallest].dist) smallest = right;
            if (smallest === idx) break;
            [this.heap[smallest], this.heap[idx]] = [this.heap[idx], this.heap[smallest]];
            idx = smallest;
        }
    }

    isEmpty() {
        return this.heap.length === 0;
    }
}

// Graph implementation
class Graph {
    constructor() {
        this.adjList = {};
        this.nodes = [];
        this.edges = [];
    }

    addNode(node) {
        if (!this.adjList[node]) {
            this.adjList[node] = [];
            this.nodes.push(node);
        }
    }

    addEdge(u, v, w) {
        this.adjList[u].push({ node: v, weight: w });
        this.adjList[v].push({ node: u, weight: w });
        this.edges.push({ u, v, weight: w });
    }

    getNodes() {
        return this.nodes;
    }

    getNeighbors(node) {
        return this.adjList[node] || [];
    }

    getEdges() {
        return this.edges;
    }
}

// Dijkstra's algorithm with step tracking
function dijkstra(graph, start, end) {
    const dist = {};
    const prev = {};
    const visited = new Set();
    const heap = new MinHeap();

    graph.getNodes().forEach(n => {
        dist[n] = Infinity;
        prev[n] = null;
    });

    dist[start] = 0;
    heap.insert(start, 0);

    while (!heap.isEmpty()) {
        const { node: u, dist: d } = heap.extractMin();

        if (visited.has(u)) continue;
        visited.add(u);

        if (u === end) break;

        for (let { node: v, weight: w } of graph.getNeighbors(u)) {
            if (!visited.has(v)) {
                let newDist = d + w;
                if (newDist < dist[v]) {
                    dist[v] = newDist;
                    prev[v] = u;
                    heap.insert(v, newDist);
                }
            }
        }
    }

    // Reconstruct path
    let path = [];
    let at = end;
    while (at !== null) {
        path.push(at);
        at = prev[at];
    }
    path.reverse();

    // Check if path exists
    if (path[0] !== start) {
        path = [];
    }

    return { dist, path, totalCost: dist[end] };
}

// UI Variables
const canvas = document.getElementById("graphCanvas");
const ctx = canvas.getContext("2d");
const srcSelect = document.getElementById("src");
const dstSelect = document.getElementById("dst");
const runBtn = document.getElementById("runBtn");
const randBtn = document.getElementById("randBtn");
const resetBtn = document.getElementById("resetBtn");
const nodeCountSelect = document.getElementById("nodeCount");
const densitySelect = document.getElementById("density");
const loading = document.getElementById("loading");

let graph = new Graph();
let positions = {};
let currentPath = [];
let animationId = null;

// Generate random graph with better distribution
function generateRandomGraph() {
    const nodeCount = parseInt(nodeCountSelect.value);
    const density = parseFloat(densitySelect.value);

    graph = new Graph();
    positions = {};
    currentPath = [];

    // Create nodes with better spacing and margin from edges
    const margin = 80; // Margin from canvas edges
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(canvas.width - margin * 2, canvas.height - margin * 2) / 2;

    for (let i = 0; i < nodeCount; i++) {
        const angle = (2 * Math.PI * i) / nodeCount;
        // Use different radius layers for better distribution
        const radiusVariation = Math.random() * 0.3; // 0 to 30% variation
        const radius = maxRadius * (0.7 + radiusVariation);

        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        // Ensure nodes don't go outside canvas bounds
        const finalX = Math.max(margin, Math.min(canvas.width - margin, x));
        const finalY = Math.max(margin, Math.min(canvas.height - margin, y));

        const nodeId = String.fromCharCode(65 + i); // A, B, C, etc.
        graph.addNode(nodeId);
        positions[nodeId] = { x: finalX, y: finalY };
    }

    // Add edges based on density
    const nodes = graph.getNodes();
    const maxEdges = (nodes.length * (nodes.length - 1)) / 2;
    const targetEdges = Math.floor(maxEdges * density);
    let edgesAdded = 0;

    // First, ensure the graph is connected
    for (let i = 1; i < nodes.length; i++) {
        const weight = Math.floor(Math.random() * 15) + 1;
        graph.addEdge(nodes[i - 1], nodes[i], weight);
        edgesAdded++;
    }

    // Add random edges to reach target density
    while (edgesAdded < targetEdges) {
        const i = Math.floor(Math.random() * nodes.length);
        const j = Math.floor(Math.random() * nodes.length);

        if (i !== j) {
            // Check if edge already exists
            const neighbors = graph.getNeighbors(nodes[i]);
            const exists = neighbors.some(n => n.node === nodes[j]);

            if (!exists) {
                const weight = Math.floor(Math.random() * 15) + 1;
                graph.addEdge(nodes[i], nodes[j], weight);
                edgesAdded++;
            }
        }
    }

    updateSelectOptions();
    updateStats();
    drawGraph();
}

function updateSelectOptions() {
    srcSelect.innerHTML = "";
    dstSelect.innerHTML = "";

    graph.getNodes().forEach(n => {
        srcSelect.innerHTML += `<option value="${n}">${n}</option>`;
        dstSelect.innerHTML += `<option value="${n}">${n}</option>`;
    });

    // Set default selection
    if (graph.getNodes().length > 1) {
        dstSelect.selectedIndex = 1;
    }
}

function updateStats() {
    document.getElementById('nodeCountStat').textContent = graph.getNodes().length;
    document.getElementById('edgeCountStat').textContent = graph.getEdges().length;
}

function drawGraph(highlightPath = [], currentNode = null) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pathEdges = new Set();
    for (let i = 0; i < highlightPath.length - 1; i++) {
        pathEdges.add(`${highlightPath[i]}-${highlightPath[i + 1]}`);
        pathEdges.add(`${highlightPath[i + 1]}-${highlightPath[i]}`);
    }

    // Draw edges
    ctx.lineWidth = 3;
    for (let edge of graph.getEdges()) {
        const { u, v, weight } = edge;
        const pos1 = positions[u];
        const pos2 = positions[v];

        if (!pos1 || !pos2) continue;

        const { x: x1, y: y1 } = pos1;
        const { x: x2, y: y2 } = pos2;

        const isPathEdge = pathEdges.has(`${u}-${v}`);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = isPathEdge ? "red" : "black";
        ctx.lineWidth = isPathEdge ? 4 : 2;
        ctx.stroke();

        // Draw weight label with background
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;

        ctx.fillStyle = "white";
        ctx.fillRect(midX - 15, midY - 12, 30, 20);
        ctx.strokeStyle = "#666";
        ctx.lineWidth = 1;
        ctx.strokeRect(midX - 15, midY - 12, 30, 20);

        ctx.fillStyle = isPathEdge ? "red" : "#333";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(weight, midX, midY + 4);
    }

    // Draw nodes
    for (let node of graph.getNodes()) {
        const pos = positions[node];
        if (!pos) continue;

        const { x, y } = pos;
        const isInPath = highlightPath.includes(node);
        const isCurrent = node === currentNode;

        // Node circle
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, 2 * Math.PI);

        if (isCurrent) {
            ctx.fillStyle = "#ffeb3b";
        } else if (isInPath) {
            ctx.fillStyle = "orange";
        } else {
            ctx.fillStyle = "lightgray";
        }

        ctx.fill();
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 3;
        ctx.stroke();

        // Node label
        ctx.fillStyle = "black";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(node, x, y + 5);
    }
}

async function runDijkstra() {
    const start = srcSelect.value;
    const end = dstSelect.value;

    if (!start || !end) {
        alert("Please select both source and destination nodes!");
        return;
    }

    if (start === end) {
        alert("Source and destination must be different!");
        return;
    }

    // Show loading
    loading.classList.add('active');
    runBtn.disabled = true;

    // Small delay for loading animation
    await new Promise(resolve => setTimeout(resolve, 500));

    const result = dijkstra(graph, start, end);

    loading.classList.remove('active');
    runBtn.disabled = false;

    if (result.path.length === 0 || result.totalCost === Infinity) {
        alert("No path exists between the selected nodes!");
        return;
    }

    currentPath = result.path;

    // Update stats
    document.getElementById('pathLengthStat').textContent = result.path.length;
    document.getElementById('pathCostStat').textContent = result.totalCost.toFixed(1);

    // Animate the path discovery
    animatePath(result.path);
}

function animatePath(path) {
    let step = 0;

    function animate() {
        if (step <= path.length) {
            const currentPath = path.slice(0, step);
            const currentNode = step < path.length ? path[step] : null;
            drawGraph(currentPath, currentNode);
            step++;
            animationId = setTimeout(animate, 800);
        } else {
            // Final draw with complete path
            drawGraph(path);
        }
    }

    animate();
}

function resetVisualization() {
    if (animationId) {
        clearTimeout(animationId);
        animationId = null;
    }

    currentPath = [];
    document.getElementById('pathLengthStat').textContent = '-';
    document.getElementById('pathCostStat').textContent = '-';
    drawGraph();
}

// Event listeners
runBtn.addEventListener('click', runDijkstra);
randBtn.addEventListener('click', generateRandomGraph);
resetBtn.addEventListener('click', resetVisualization);

// Handle canvas resize
window.addEventListener('resize', () => {
    drawGraph(currentPath);
});

// Initialize
generateRandomGraph();