// @ts-nocheck
import type { Exam, MCQQuestion } from '@/exam/types';

type Row = [string, string[], number, string];
type Pack = { key: string; title: string; topic: string; difficulty: 'easy' | 'medium' | 'hard'; coding: string[]; qs: Row[] };

/** 20 ready-made tests: 10 easy, 5 medium, 5 hard. Added as drafts by "Add starter tests". */
const PACKS: Pack[] = [
  // ---------- EASY ----------
  { key: 'e1', title: 'Basic Arithmetic', topic: 'Aptitude', difficulty: 'easy', coding: ['q18'], qs: [
    ['What is 15% of 200?', ['20', '25', '30', '35'], 2, '0.15 × 200 = 30'],
    ['Average of 4, 8, 12 and 16?', ['8', '10', '12', '9'], 1, 'Sum 40 / 4 = 10'],
    ['Next number: 2, 4, 8, 16, …', ['24', '30', '32', '20'], 2, 'Each term doubles.'],
    ['A shirt costs ₹500 after a 20% discount. Original price?', ['₹600', '₹625', '₹650', '₹700'], 1, '500 / 0.8 = 625'],
    ['Simplify 3² + 4²', ['25', '49', '14', '12'], 0, '9 + 16 = 25'],
  ]},
  { key: 'e2', title: 'Programming Fundamentals', topic: 'Programming', difficulty: 'easy', coding: ['q19'], qs: [
    ['Which of these is a loop keyword in most languages?', ['if', 'for', 'case', 'try'], 1, '"for" repeats a block.'],
    ['What does a variable store?', ['A value', 'A loop', 'A file', 'A keyboard'], 0, 'Variables hold values.'],
    ['Which symbol is usually used for equality comparison?', ['=', '==', '=>', '!='], 1, '== compares; = assigns.'],
    ['Boolean values are…', ['0–9', 'true / false', 'a–z', 'lists'], 1, 'Booleans are true or false.'],
    ['What is the output of 7 % 3?', ['1', '2', '0', '3'], 0, '7 = 2×3 + 1'],
  ]},
  { key: 'e3', title: 'Python Basics', topic: 'Python', difficulty: 'easy', coding: ['q20'], qs: [
    ['Which keyword defines a function in Python?', ['func', 'def', 'function', 'lambda'], 1, 'def name():'],
    ['len("hello") returns', ['4', '5', '6', 'error'], 1, 'Five characters.'],
    ['Which type is [1, 2, 3]?', ['tuple', 'set', 'list', 'dict'], 2, 'Square brackets make a list.'],
    ['How do you write a comment in Python?', ['//', '#', '/* */', '--'], 1, '# starts a comment.'],
    ['What does print(2 ** 3) show?', ['6', '8', '9', '5'], 1, '** is power.'],
  ]},
  { key: 'e4', title: 'HTML & CSS Basics', topic: 'Web', difficulty: 'easy', coding: [], qs: [
    ['HTML stands for', ['Hyper Text Markup Language', 'High Text Machine Language', 'Hyperlink Text Mark Language', 'Home Tool Markup Language'], 0, ''],
    ['Which tag makes a hyperlink?', ['<link>', '<a>', '<href>', '<url>'], 1, '<a href="…">'],
    ['Which CSS property changes text colour?', ['font-color', 'text-color', 'color', 'fg'], 2, ''],
    ['Largest heading tag?', ['<h6>', '<h1>', '<head>', '<heading>'], 1, ''],
    ['Which CSS property adds space inside a border?', ['margin', 'padding', 'gap', 'spacing'], 1, ''],
  ]},
  { key: 'e5', title: 'Computer Basics', topic: 'General', difficulty: 'easy', coding: [], qs: [
    ['CPU stands for', ['Central Processing Unit', 'Computer Personal Unit', 'Central Program Unit', 'Control Processing Unit'], 0, ''],
    ['Which is volatile memory?', ['ROM', 'RAM', 'SSD', 'HDD'], 1, 'RAM loses data on power-off.'],
    ['1 byte equals', ['4 bits', '8 bits', '16 bits', '2 bits'], 1, ''],
    ['Which is an operating system?', ['Chrome', 'Linux', 'Excel', 'Google'], 1, ''],
    ['Binary of decimal 5', ['101', '110', '111', '100'], 0, '4 + 1'],
  ]},
  { key: 'e6', title: 'Logical Reasoning I', topic: 'Reasoning', difficulty: 'easy', coding: [], qs: [
    ['Odd one out: Apple, Mango, Carrot, Banana', ['Apple', 'Mango', 'Carrot', 'Banana'], 2, 'Carrot is a vegetable.'],
    ['If CAT = 3120, DOG = ?', ['4157', '4715', '4167', '4156'], 0, 'Letter positions: D4 O15 G7.'],
    ['Next: A, C, E, G, …', ['H', 'I', 'J', 'K'], 1, 'Skip one letter.'],
    ['All roses are flowers. Some flowers fade. So…', ['All roses fade', 'Some roses may fade', 'No rose fades', 'Roses are not flowers'], 1, ''],
    ['Mirror image of "b" looks like', ['d', 'p', 'q', 'b'], 0, ''],
  ]},
  { key: 'e7', title: 'English Grammar', topic: 'Verbal', difficulty: 'easy', coding: [], qs: [
    ['Choose the correct sentence', ['She go to school.', 'She goes to school.', 'She going school.', 'She gone to school.'], 1, ''],
    ['Synonym of "rapid"', ['Slow', 'Quick', 'Heavy', 'Late'], 1, ''],
    ['Antonym of "ancient"', ['Old', 'Modern', 'Historic', 'Past'], 1, ''],
    ['Plural of "child"', ['childs', 'children', 'childes', 'childrens'], 1, ''],
    ['Fill: He is good ___ maths.', ['in', 'at', 'on', 'for'], 1, ''],
  ]},
  { key: 'e8', title: 'Data Structures Intro', topic: 'DSA', difficulty: 'easy', coding: ['q22'], qs: [
    ['Index of the first element in most arrays', ['1', '0', '-1', 'depends'], 1, ''],
    ['Which follows FIFO?', ['Stack', 'Queue', 'Tree', 'Graph'], 1, ''],
    ['Which follows LIFO?', ['Queue', 'Stack', 'Array', 'Heap'], 1, ''],
    ['A linked list node stores data and', ['an index', 'a pointer to next', 'a hash', 'a key'], 1, ''],
    ['Accessing arr[i] in an array is', ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'], 0, ''],
  ]},
  { key: 'e9', title: 'Number Puzzles', topic: 'Aptitude', difficulty: 'easy', coding: ['q21'], qs: [
    ['Smallest prime number', ['0', '1', '2', '3'], 2, ''],
    ['LCM of 4 and 6', ['12', '24', '6', '2'], 0, ''],
    ['HCF of 18 and 24', ['3', '6', '9', '12'], 1, ''],
    ['√144 =', ['11', '12', '13', '14'], 1, ''],
    ['A train covers 120 km in 2 h. Speed?', ['50', '60', '70', '80'], 1, 'km/h'],
  ]},
  { key: 'e10', title: 'SQL Basics', topic: 'Databases', difficulty: 'easy', coding: [], qs: [
    ['Which command fetches rows?', ['GET', 'SELECT', 'FETCH', 'SHOW'], 1, ''],
    ['Which clause filters rows?', ['ORDER BY', 'WHERE', 'GROUP BY', 'FROM'], 1, ''],
    ['Which removes a table entirely?', ['DELETE', 'DROP', 'REMOVE', 'TRUNCATE ROW'], 1, ''],
    ['Primary key values must be', ['repeated', 'unique', 'null', 'text'], 1, ''],
    ['COUNT(*) returns', ['sum', 'number of rows', 'max', 'average'], 1, ''],
  ]},
  // ---------- MEDIUM ----------
  { key: 'm1', title: 'Algorithms & Complexity', topic: 'DSA', difficulty: 'medium', coding: ['q7'], qs: [
    ['Binary search time complexity', ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], 1, ''],
    ['Merge sort worst case', ['O(n²)', 'O(n log n)', 'O(n)', 'O(log n)'], 1, ''],
    ['Which uses divide and conquer?', ['Bubble sort', 'Quick sort', 'Insertion sort', 'Selection sort'], 1, ''],
    ['BFS typically uses a', ['Stack', 'Queue', 'Heap', 'Set'], 1, ''],
    ['Height of a balanced BST with n nodes', ['O(n)', 'O(log n)', 'O(1)', 'O(√n)'], 1, ''],
  ]},
  { key: 'm2', title: 'OOP Concepts', topic: 'Programming', difficulty: 'medium', coding: ['q10'], qs: [
    ['Hiding internal details is called', ['Inheritance', 'Encapsulation', 'Polymorphism', 'Overloading'], 1, ''],
    ['Method overriding is an example of', ['Compile-time polymorphism', 'Runtime polymorphism', 'Encapsulation', 'Abstraction only'], 1, ''],
    ['A class that cannot be instantiated', ['Final', 'Abstract', 'Static', 'Sealed object'], 1, ''],
    ['"is-a" relationship represents', ['Composition', 'Inheritance', 'Aggregation', 'Association'], 1, ''],
    ['Constructors are called when', ['a method returns', 'an object is created', 'a class compiles', 'memory frees'], 1, ''],
  ]},
  { key: 'm3', title: 'Quantitative Aptitude', topic: 'Aptitude', difficulty: 'medium', coding: [], qs: [
    ['A can do a job in 10 days, B in 15. Together?', ['5 days', '6 days', '8 days', '12 days'], 1, '1/10+1/15 = 1/6'],
    ['Simple interest on ₹1000 at 10% for 3 years', ['₹300', '₹330', '₹310', '₹100'], 0, ''],
    ['Ratio 3:5, total 64. Larger part?', ['24', '40', '36', '32'], 1, '64 × 5/8'],
    ['Probability of a head in one coin toss', ['1/4', '1/2', '1', '0'], 1, ''],
    ['Profit % when CP 80, SP 100', ['20%', '25%', '30%', '15%'], 1, '20/80'],
  ]},
  { key: 'm4', title: 'Operating Systems', topic: 'Core CS', difficulty: 'medium', coding: [], qs: [
    ['Deadlock needs which condition?', ['Preemption', 'Circular wait', 'Unlimited resources', 'Single process'], 1, ''],
    ['Which scheduling can cause starvation?', ['Round Robin', 'FCFS', 'Shortest Job First', 'None'], 2, ''],
    ['Paging removes', ['Internal fragmentation', 'External fragmentation', 'Both', 'Neither'], 1, ''],
    ['A thread shares with its process', ['Stack', 'Registers', 'Address space', 'Program counter'], 2, ''],
    ['Semaphore is used for', ['Sorting', 'Synchronization', 'Networking', 'Compilation'], 1, ''],
  ]},
  { key: 'm5', title: 'Computer Networks', topic: 'Core CS', difficulty: 'medium', coding: [], qs: [
    ['HTTP runs on top of', ['UDP', 'TCP', 'IP only', 'ARP'], 1, ''],
    ['Default HTTPS port', ['80', '443', '21', '8080'], 1, ''],
    ['DNS converts', ['IP to MAC', 'Domain to IP', 'MAC to IP', 'Port to IP'], 1, ''],
    ['Layers in the OSI model', ['5', '7', '4', '6'], 1, ''],
    ['Which is connectionless?', ['TCP', 'UDP', 'FTP', 'SMTP'], 1, ''],
  ]},
  // ---------- HARD ----------
  { key: 'h1', title: 'Advanced DSA', topic: 'DSA', difficulty: 'hard', coding: ['q1', 'q11'], qs: [
    ['Dijkstra fails with', ['Cycles', 'Negative edge weights', 'Undirected graphs', 'Dense graphs'], 1, ''],
    ['Time of building a heap from n items', ['O(n log n)', 'O(n)', 'O(log n)', 'O(n²)'], 1, 'Bottom-up heapify.'],
    ['LIS with patience sorting runs in', ['O(n²)', 'O(n log n)', 'O(n)', 'O(2ⁿ)'], 1, ''],
    ['Union-Find with path compression + rank is nearly', ['O(1) amortized', 'O(log n)', 'O(n)', 'O(n log n)'], 0, 'Inverse Ackermann.'],
    ['Topological sort exists only for', ['Trees', 'DAGs', 'Complete graphs', 'Bipartite graphs'], 1, ''],
  ]},
  { key: 'h2', title: 'Dynamic Programming', topic: 'DSA', difficulty: 'hard', coding: ['q12', 'q13'], qs: [
    ['DP needs overlapping subproblems and', ['Greedy choice', 'Optimal substructure', 'Sorting', 'Recursion depth 1'], 1, ''],
    ['0/1 knapsack DP time', ['O(nW)', 'O(n log n)', 'O(2ⁿ) only', 'O(W)'], 0, ''],
    ['Edit distance of "cat" → "cut"', ['0', '1', '2', '3'], 1, 'One substitution.'],
    ['Number of ways to climb 5 stairs (1 or 2 steps)', ['5', '8', '13', '6'], 1, 'Fibonacci.'],
    ['Matrix chain multiplication is solved in', ['O(n²)', 'O(n³)', 'O(n)', 'O(n log n)'], 1, ''],
  ]},
  { key: 'h3', title: 'System Design Concepts', topic: 'Design', difficulty: 'hard', coding: [], qs: [
    ['CAP theorem: in a partition you choose', ['Consistency or Availability', 'Speed or Cost', 'CPU or RAM', 'SQL or NoSQL'], 0, ''],
    ['Consistent hashing helps with', ['Encryption', 'Rebalancing shards', 'Sorting', 'Compression'], 1, ''],
    ['A write-through cache', ['Writes to cache only', 'Writes to cache and DB together', 'Skips the DB', 'Is read-only'], 1, ''],
    ['Idempotent API means', ['Fast', 'Same result on repeat calls', 'Stateless', 'Cached'], 1, ''],
    ['Which helps absorb traffic spikes?', ['Message queue', 'Bigger font', 'Fewer servers', 'Sync calls'], 0, ''],
  ]},
  { key: 'h4', title: 'Advanced Aptitude', topic: 'Aptitude', difficulty: 'hard', coding: [], qs: [
    ['Two dice: probability the sum is 7', ['1/6', '1/12', '5/36', '7/36'], 0, '6/36'],
    ['Pipes fill a tank in 12 h and 15 h; a drain empties it in 20 h. All open?', ['10 h', '8 h', '12 h', '6 h'], 0, '1/12+1/15−1/20 = 1/10'],
    ['Arrangements of the letters of "LEVEL"', ['30', '60', '120', '20'], 0, '5!/(2!2!)'],
    ['Compound interest on ₹10,000 at 10% for 2 years', ['₹2,000', '₹2,100', '₹2,200', '₹1,900'], 1, ''],
    ['Clock angle at 3:30', ['75°', '90°', '60°', '105°'], 0, ''],
  ]},
  { key: 'h5', title: 'DBMS Deep Dive', topic: 'Databases', difficulty: 'hard', coding: [], qs: [
    ['A relation in BCNF is always in', ['1NF only', '3NF', '4NF', '5NF'], 1, ''],
    ['Isolation level preventing phantom reads', ['Read committed', 'Repeatable read', 'Serializable', 'Read uncommitted'], 2, ''],
    ['B+ tree data is stored in', ['Internal nodes', 'Leaf nodes', 'Root only', 'Hash buckets'], 1, ''],
    ['Two-phase locking guarantees', ['No deadlock', 'Serializability', 'Speed', 'Durability'], 1, ''],
    ['WAL stands for', ['Write-Ahead Logging', 'Wide Area Lock', 'Write And Load', 'Weighted Access List'], 0, ''],
  ]},
];

const DURATION = { easy: 30, medium: 45, hard: 60 };
const MARKS = { easy: 1, medium: 2, hard: 3 };

export function buildStarterPack(): { exams: Exam[]; mcqs: MCQQuestion[] } {
  const now = new Date().toISOString();
  const mcqs: MCQQuestion[] = [];
  const exams: Exam[] = PACKS.map((p) => {
    const ids = p.qs.map(([question, options, correctIndex, explanation], i) => {
      const id = `sp-${p.key}-${i + 1}`;
      mcqs.push({ id, question, options, correctIndex, category: p.topic, difficulty: p.difficulty, marks: MARKS[p.difficulty], explanation, createdAt: now });
      return id;
    });
    return {
      id: `sp-exam-${p.key}`, title: `${p.title} (${p.difficulty[0].toUpperCase()}${p.difficulty.slice(1)})`,
      description: `${p.topic} · ${p.difficulty} · ${p.qs.length} MCQs${p.coding.length ? ` + ${p.coding.length} coding` : ''}`,
      questionIds: p.coding, mcqIds: ids, writingIds: [], fibIds: [],
      sectionNames: { coding: 'Coding', mcq: 'Multiple Choice', writing: 'Writing', fib: 'Fill in the Blanks' },
      assignedStudentIds: [], status: 'draft', createdAt: now,
      isTimed: true, startBufferMinutes: 10, examDurationMinutes: DURATION[p.difficulty], allowCopyPaste: false,
    };
  });
  return { exams, mcqs };
}
