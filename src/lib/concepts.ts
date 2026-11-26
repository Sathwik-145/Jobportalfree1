// @ts-nocheck
// Important concepts library - localStorage backed, editable from admin

export interface Concept {
  id: string;
  category: string; // e.g. "Web Development", "SQL", "OOPS", "OS", "DSA"
  title: string;
  summary: string;
  bullets: string[];
  importance: 'must-know' | 'important' | 'good-to-know';
  forInterview: boolean;
  forCoding: boolean;
}

const KEY = 'jpf_important_concepts_v1';

export const DEFAULT_CONCEPTS: Concept[] = [
  // DSA
  { id: 'c-dsa-arr', category: 'DSA', title: 'Arrays & Strings', summary: 'Foundation of most coding problems. Master indexing, two-pointers, sliding window.', bullets: ['Two-pointer technique', 'Sliding window (max/min subarray)', 'Prefix sums', 'Kadane\'s algorithm'], importance: 'must-know', forInterview: true, forCoding: true },
  { id: 'c-dsa-hash', category: 'DSA', title: 'Hash Maps & Sets', summary: 'O(1) lookup unlocks most easy/medium problems.', bullets: ['Two Sum pattern', 'Frequency counting', 'Anagram detection', 'Detecting duplicates'], importance: 'must-know', forInterview: true, forCoding: true },
  { id: 'c-dsa-tree', category: 'DSA', title: 'Trees & BSTs', summary: 'Hierarchical data. Recursion + traversal patterns.', bullets: ['In-order/Pre-order/Post-order', 'Level-order (BFS)', 'BST property', 'LCA (Lowest Common Ancestor)'], importance: 'must-know', forInterview: true, forCoding: true },
  { id: 'c-dsa-graph', category: 'DSA', title: 'Graphs', summary: 'Model relationships. BFS/DFS, shortest paths.', bullets: ['DFS / BFS', 'Dijkstra', 'Topological sort', 'Union-Find'], importance: 'important', forInterview: true, forCoding: true },
  { id: 'c-dsa-dp', category: 'DSA', title: 'Dynamic Programming', summary: 'Overlapping subproblems + memoization.', bullets: ['Top-down (memo)', 'Bottom-up (tabulation)', 'Knapsack family', 'LIS / LCS'], importance: 'must-know', forInterview: true, forCoding: true },

  // OOPS
  { id: 'c-oop-1', category: 'OOPS', title: 'Four Pillars', summary: 'Encapsulation, Inheritance, Polymorphism, Abstraction.', bullets: ['Encapsulation hides state', 'Inheritance reuses code', 'Polymorphism = many forms', 'Abstraction exposes only what matters'], importance: 'must-know', forInterview: true, forCoding: false },
  { id: 'c-oop-2', category: 'OOPS', title: 'SOLID Principles', summary: 'Five design rules for maintainable code.', bullets: ['Single Responsibility', 'Open/Closed', 'Liskov Substitution', 'Interface Segregation', 'Dependency Inversion'], importance: 'important', forInterview: true, forCoding: false },

  // OS
  { id: 'c-os-1', category: 'Operating Systems', title: 'Process vs Thread', summary: 'Process = isolated memory; Thread = shared memory inside a process.', bullets: ['Context switching cost', 'IPC mechanisms', 'Thread safety', 'Race conditions'], importance: 'must-know', forInterview: true, forCoding: false },
  { id: 'c-os-2', category: 'Operating Systems', title: 'Deadlocks', summary: 'Four conditions: Mutual exclusion, Hold-and-wait, No preemption, Circular wait.', bullets: ['Prevention strategies', 'Banker\'s algorithm', 'Detection vs avoidance'], importance: 'important', forInterview: true, forCoding: false },
  { id: 'c-os-3', category: 'Operating Systems', title: 'Memory Management', summary: 'Paging, segmentation, virtual memory.', bullets: ['Page table', 'TLB', 'Thrashing', 'Page replacement (LRU, FIFO)'], importance: 'important', forInterview: true, forCoding: false },

  // DBMS / SQL
  { id: 'c-sql-1', category: 'SQL & DBMS', title: 'Joins', summary: 'INNER, LEFT, RIGHT, FULL OUTER, CROSS, SELF.', bullets: ['INNER returns matches only', 'LEFT keeps all from left', 'Use ON for join key', 'SELF JOIN for hierarchies'], importance: 'must-know', forInterview: true, forCoding: true },
  { id: 'c-sql-2', category: 'SQL & DBMS', title: 'Normalization', summary: '1NF, 2NF, 3NF, BCNF.', bullets: ['Eliminate redundancy', 'Functional dependencies', 'Trade-off vs read performance'], importance: 'important', forInterview: true, forCoding: false },
  { id: 'c-sql-3', category: 'SQL & DBMS', title: 'Indexes', summary: 'Speed up reads, slow down writes.', bullets: ['B-Tree vs Hash index', 'Composite indexes', 'Covering index', 'EXPLAIN plan'], importance: 'important', forInterview: true, forCoding: true },
  { id: 'c-sql-4', category: 'SQL & DBMS', title: 'ACID & Transactions', summary: 'Atomicity, Consistency, Isolation, Durability.', bullets: ['Isolation levels', 'Phantom reads', 'Deadlocks in DB'], importance: 'important', forInterview: true, forCoding: false },

  // Web Dev
  { id: 'c-web-1', category: 'Web Development', title: 'HTTP & REST', summary: 'Stateless protocol, verbs, status codes.', bullets: ['GET/POST/PUT/PATCH/DELETE', '2xx success, 4xx client, 5xx server', 'Idempotency', 'Caching headers'], importance: 'must-know', forInterview: true, forCoding: true },
  { id: 'c-web-2', category: 'Web Development', title: 'Authentication', summary: 'Session cookies vs JWT vs OAuth.', bullets: ['Cookies + CSRF', 'JWT in Authorization header', 'Refresh tokens', 'OAuth 2.0 flow'], importance: 'must-know', forInterview: true, forCoding: false },
  { id: 'c-web-3', category: 'Web Development', title: 'Browser Rendering', summary: 'How the page paints.', bullets: ['DOM + CSSOM → render tree', 'Layout / Paint / Composite', 'Reflow vs Repaint', 'Critical rendering path'], importance: 'good-to-know', forInterview: true, forCoding: false },
  { id: 'c-web-4', category: 'Web Development', title: 'React Fundamentals', summary: 'Components, props, state, hooks.', bullets: ['Virtual DOM diffing', 'useState / useEffect rules', 'Lifting state up', 'Keys in lists'], importance: 'must-know', forInterview: true, forCoding: true },

  // Networking
  { id: 'c-net-1', category: 'Computer Networks', title: 'OSI vs TCP/IP', summary: '7-layer OSI model; 4-layer TCP/IP stack.', bullets: ['Application, Transport, Network, Link', 'TCP vs UDP', '3-way handshake', 'Sliding window'], importance: 'important', forInterview: true, forCoding: false },
  { id: 'c-net-2', category: 'Computer Networks', title: 'DNS & HTTPS', summary: 'Name resolution + secure transport.', bullets: ['Recursive vs iterative resolution', 'TLS handshake', 'Cert chain', 'HSTS'], importance: 'good-to-know', forInterview: true, forCoding: false },

  // ML / CNN
  { id: 'c-ml-1', category: 'Machine Learning', title: 'CNN Basics', summary: 'Convolution + pooling for spatial data.', bullets: ['Filter / kernel', 'Stride & padding', 'Pooling (max/avg)', 'Feature maps'], importance: 'good-to-know', forInterview: true, forCoding: false },
  { id: 'c-ml-2', category: 'Machine Learning', title: 'Bias-Variance', summary: 'Underfit vs overfit trade-off.', bullets: ['Regularization', 'Cross-validation', 'Train/val/test split'], importance: 'important', forInterview: true, forCoding: false },

  // System Design
  { id: 'c-sys-1', category: 'System Design', title: 'Scalability Basics', summary: 'Vertical vs horizontal scaling.', bullets: ['Load balancers', 'Caching (Redis)', 'CDN', 'Database sharding'], importance: 'important', forInterview: true, forCoding: false },
];

export function loadConcepts(): Concept[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_CONCEPTS;
}

export function saveConcepts(items: Concept[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
}

export function resetConcepts() {
  try { localStorage.removeItem(KEY); } catch {}
}

export const CONCEPT_CATEGORIES = [
  'DSA', 'OOPS', 'Operating Systems', 'SQL & DBMS',
  'Web Development', 'Computer Networks', 'Machine Learning', 'System Design',
];
