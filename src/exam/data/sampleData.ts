// @ts-nocheck
import { Question, Student, Admin, Exam, MCQQuestion, FIBQuestion, WritingQuestion } from '@/exam/types';

// Exam admin access comes from the main admin login; no password is kept in the app.

export const SUPPORTED_LANGUAGES = [
  'python', 'javascript', 'java', 'cpp', 'c',
];

export const LANGUAGE_LABELS: Record<string, string> = {
  python: 'Python 3',
  javascript: 'JavaScript',
  java: 'Java',
  cpp: 'C++',
  c: 'C',
};

export const LANGUAGE_TEMPLATES: Record<string, string> = {
  python: `# Write your solution here\ndef solve():\n    pass\n\nsolve()`,
  javascript: `// Write your solution here\nfunction solve() {\n  \n}\n\nsolve();`,
  java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Write your solution here\n    }\n}`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}`,
  c: `#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}`,
};

const ALL_LANGS = ['python', 'javascript', 'java', 'cpp', 'c'];

function mkTcs(prefix: string, n: number, gen: (i: number) => { input: string; expectedOutput: string }) {
  return Array.from({ length: n }, (_, i) => ({ id: `${prefix}${i + 1}`, ...gen(i) }));
}

function mkQ(id: string, title: string, description: string, difficulty: 'easy' | 'medium' | 'hard', timeLimit: number, order: number, maxMarks: number, pubN: number, privN: number, gen: (i: number) => { input: string; expectedOutput: string }): Question {
  return {
    id, title, description, difficulty,
    defaultPublicCount: pubN, defaultPrivateCount: privN,
    languages: ALL_LANGS, timeLimit, maxMarks,
    createdAt: new Date().toISOString(), order,
    publicTestCases: mkTcs('tc', pubN, gen),
    privateTestCases: mkTcs('ptc', privN, (i) => gen(i + pubN)),
  };
}

export const sampleQuestions: Question[] = [
  mkQ('q1', 'Two Sum',
    'Given an array of integers **nums** and an integer **target**, return the indices of the two numbers that add up to target.\n\n**Input format:** First line contains n and target. Second line contains n integers.\n\n**Output format:** Two space-separated indices.',
    'easy', 30, 0, 10, 10, 10, (i) => {
      const cases = [
        { input: '4 9\n2 7 11 15', expectedOutput: '0 1' },
        { input: '3 6\n3 2 4', expectedOutput: '1 2' },
        { input: '2 6\n3 3', expectedOutput: '0 1' },
        { input: '5 10\n1 2 3 4 6', expectedOutput: '3 4' },
        { input: '4 14\n5 3 9 1', expectedOutput: '0 2' },
        { input: '3 8\n1 7 3', expectedOutput: '0 1' },
        { input: '4 5\n1 2 3 4', expectedOutput: '0 3' },
        { input: '5 11\n2 4 6 8 3', expectedOutput: '1 4' },
        { input: '3 100\n50 25 50', expectedOutput: '0 2' },
        { input: '4 7\n1 3 4 2', expectedOutput: '1 2' },
        { input: '6 15\n1 5 3 7 8 2', expectedOutput: '3 4' },
        { input: '4 20\n10 5 10 3', expectedOutput: '0 2' },
        { input: '5 9\n4 1 5 3 6', expectedOutput: '2 3' },
        { input: '3 4\n2 1 2', expectedOutput: '0 2' },
        { input: '4 12\n6 3 6 1', expectedOutput: '0 2' },
        { input: '5 7\n1 2 3 4 5', expectedOutput: '1 4' },
        { input: '3 10\n8 2 5', expectedOutput: '0 1' },
        { input: '4 16\n9 7 3 1', expectedOutput: '0 1' },
        { input: '5 13\n6 7 2 3 4', expectedOutput: '0 1' },
        { input: '3 3\n1 2 0', expectedOutput: '0 1' },
      ];
      return cases[i];
    }),
  mkQ('q2', 'Reverse a String',
    'Given a string **s**, return the reversed string.\n\n**Input:** A single string.\n**Output:** Reversed string.',
    'easy', 15, 1, 10, 10, 10, (i) => {
      const arr = ['hello','world','abcdef','a','racecar','OpenAI','12345','abba','xyz','coding','algorithm','structure','banana','test','platform','exam','code','level','monitor','screen'];
      const s = arr[i];
      return { input: s, expectedOutput: s.split('').reverse().join('') };
    }),
  mkQ('q3', 'FizzBuzz',
    'Print numbers 1..n. For multiples of 3 print "Fizz", multiples of 5 print "Buzz", both print "FizzBuzz".\n\n**Input:** integer n.\n**Output:** n lines.',
    'medium', 20, 2, 10, 10, 10, (i) => {
      const ns = [5,3,1,15,10,2,6,7,9,4,20,30,8,12,11,16,13,14,18,25];
      const n = ns[i];
      const out: string[] = [];
      for (let k = 1; k <= n; k++) {
        if (k % 15 === 0) out.push('FizzBuzz');
        else if (k % 3 === 0) out.push('Fizz');
        else if (k % 5 === 0) out.push('Buzz');
        else out.push(String(k));
      }
      return { input: String(n), expectedOutput: out.join('\n') };
    }),
  mkQ('q4', 'Prime Number Check',
    'Given an integer **n**, print "YES" if prime else "NO".',
    'easy', 15, 3, 10, 10, 10, (i) => {
      const ns = [2,3,4,5,6,7,8,9,10,11,13,15,17,19,21,23,25,29,31,33];
      const n = ns[i];
      const isPrime = (x: number) => { if (x < 2) return false; for (let j = 2; j*j <= x; j++) if (x%j === 0) return false; return true; };
      return { input: String(n), expectedOutput: isPrime(n) ? 'YES' : 'NO' };
    }),
  mkQ('q5', 'Palindrome Check',
    'Given a string, print "YES" if it is a palindrome else "NO".',
    'easy', 15, 4, 10, 10, 10, (i) => {
      const arr = ['madam','hello','racecar','world','level','noon','python','civic','abc','abba','rotor','test','aba','abcba','xyz','wow','noon','java','kayak','radar'];
      const s = arr[i];
      return { input: s, expectedOutput: s === s.split('').reverse().join('') ? 'YES' : 'NO' };
    }),
  mkQ('q6', 'Sum of N Numbers',
    'Given n, print sum 1+2+..+n.',
    'easy', 15, 5, 10, 10, 10, (i) => {
      const ns = [1,2,3,4,5,10,20,50,100,7,11,13,15,17,25,30,40,60,70,99];
      const n = ns[i];
      return { input: String(n), expectedOutput: String(n*(n+1)/2) };
    }),
  mkQ('q7', 'Valid Parentheses',
    'Given a string of brackets () [] {}, print "YES" if balanced else "NO".',
    'easy', 20, 6, 10, 10, 10, (i) => {
      const arr = ['()','()[]{}','(]','([)]','{[]}','','((()))','([)','[{()}]','{{}}','(((','[[]]','((','{}','([])','[(])','((()','()()','){',')('];
      const s = arr[i];
      const check = (x: string) => {
        const st: string[] = []; const m: Record<string,string> = {')':'(',']':'[','}':'{'};
        for (const c of x) { if ('([{'.includes(c)) st.push(c); else if (m[c]) { if (st.pop() !== m[c]) return false; } }
        return st.length === 0;
      };
      return { input: s, expectedOutput: check(s) ? 'YES' : 'NO' };
    }),
  mkQ('q8', 'Count Vowels',
    'Count vowels (aeiou, case-insensitive) in a string.',
    'easy', 15, 7, 10, 10, 10, (i) => {
      const arr = ['hello','world','aeiou','xyz','programming','beautiful','rhythm','queue','education','sky','apple','banana','grape','orange','melon','strawberry','kiwi','pear','plum','peach'];
      const s = arr[i];
      const c = (s.match(/[aeiouAEIOU]/g) || []).length;
      return { input: s, expectedOutput: String(c) };
    }),
  mkQ('q9', 'Factorial',
    'Given n, print n!.',
    'easy', 15, 8, 10, 10, 10, (i) => {
      const ns = [0,1,2,3,4,5,6,7,8,9,10,11,12,3,4,5,6,7,8,9];
      const n = ns[i];
      let f = 1n; for (let k = 2n; k <= BigInt(n); k++) f *= k;
      return { input: String(n), expectedOutput: f.toString() };
    }),
  mkQ('q10', 'Anagram Check',
    'Two strings on two lines. Print "YES" if anagrams.',
    'medium', 25, 9, 10, 10, 10, (i) => {
      const pairs = [['listen','silent'],['hello','world'],['evil','vile'],['cat','act'],['dog','god'],['rat','tar'],['abc','cba'],['abcd','dcba'],['a','b'],['fluster','restful'],['night','thing'],['stop','tops'],['save','vase'],['name','mean'],['xyz','xyy'],['aabb','abab'],['abc','abd'],['silent','listen'],['triangle','integral'],['apple','papel']];
      const [a,b] = pairs[i];
      const sorted = (x: string) => x.split('').sort().join('');
      return { input: `${a}\n${b}`, expectedOutput: sorted(a) === sorted(b) ? 'YES' : 'NO' };
    }),
  mkQ('q11', 'Fibonacci Nth Term',
    'Given n, print nth Fibonacci (F(0)=0, F(1)=1).',
    'medium', 25, 10, 10, 10, 10, (i) => {
      const ns = [0,1,2,3,4,5,6,7,8,9,10,12,15,20,25,30,11,13,14,18];
      const n = ns[i];
      let a = 0n, b = 1n; for (let k = 0; k < n; k++) { const c = a + b; a = b; b = c; }
      return { input: String(n), expectedOutput: a.toString() };
    }),
  mkQ('q12', 'Second Largest Element',
    'First line n, second line n integers. Print second largest distinct.',
    'medium', 25, 11, 10, 10, 10, (i) => {
      const arrs = [[1,2,3,4,5],[5,5,4,3,2],[10,20,30],[1,1,2],[7,7,7,6],[100,99,98],[3,1,4,1,5,9,2,6],[8,8,7],[1,2],[9,1,9,2,9],[10,10,9,8,7],[5,4,3,2,1],[11,22,33,44],[6,6,6,5,5],[100,50,25],[1,3,5,7,9],[2,4,6,8,10],[12,15,18,21],[7,3,5,1,9],[6,2,8,4,10]];
      const a = arrs[i];
      const uniq = [...new Set(a)].sort((x,y)=>y-x);
      return { input: `${a.length}\n${a.join(' ')}`, expectedOutput: String(uniq[1] ?? uniq[0]) };
    }),
  mkQ('q13', 'Power of Two',
    'Given n, print "YES" if n is power of 2 else "NO".',
    'medium', 20, 12, 10, 10, 10, (i) => {
      const ns = [1,2,3,4,5,8,16,17,32,64,100,128,256,500,512,1023,1024,2048,3000,4096];
      const n = ns[i];
      return { input: String(n), expectedOutput: (n > 0 && (n & (n-1)) === 0) ? 'YES' : 'NO' };
    }),
  mkQ('q18', 'Sum of Two Numbers',
    'Two integers on one line. Print their sum.',
    'easy', 15, 17, 5, 2, 2, (i) => {
      const pairs = [[1,2],[10,20],[5,7],[100,200]];
      const [a,b] = pairs[i];
      return { input: `${a} ${b}`, expectedOutput: String(a+b) };
    }),
  mkQ('q19', 'Echo Input',
    'Print the input as-is.',
    'easy', 10, 18, 5, 2, 2, (i) => {
      const arr = ['hello','test','echo me','42'];
      return { input: arr[i], expectedOutput: arr[i] };
    }),
  mkQ('q20', 'Square Number',
    'Print n*n.',
    'easy', 10, 19, 5, 2, 2, (i) => {
      const ns = [3, 7, 10, 12];
      return { input: String(ns[i]), expectedOutput: String(ns[i]*ns[i]) };
    }),
  mkQ('q21', 'Maximum of Two',
    'Two ints, print max.',
    'easy', 10, 20, 5, 2, 2, (i) => {
      const pairs = [[3,5],[10,2],[7,7],[100,99]];
      const [a,b] = pairs[i];
      return { input: `${a} ${b}`, expectedOutput: String(Math.max(a,b)) };
    }),
  mkQ('q22', 'Even or Odd',
    'Print "even" or "odd".',
    'easy', 10, 21, 5, 2, 2, (i) => {
      const ns = [2,3,10,15];
      return { input: String(ns[i]), expectedOutput: ns[i] % 2 === 0 ? 'even' : 'odd' };
    }),
];

export const sampleMCQs: MCQQuestion[] = [
  { id: 'm1', question: 'What is the time complexity of binary search on a sorted array?', options: ['O(n)','O(log n)','O(n log n)','O(1)'], correctIndex: 1, category: 'Algorithms', difficulty: 'easy', marks: 1, explanation: 'Binary search halves the search space each step, giving O(log n).', createdAt: new Date().toISOString() },
  { id: 'm2', question: 'Which data structure uses FIFO (First-In-First-Out) order?', options: ['Stack','Queue','Tree','Graph'], correctIndex: 1, category: 'Data Structures', difficulty: 'easy', marks: 1, explanation: 'Queues process elements in the order they arrive (FIFO).', createdAt: new Date().toISOString() },
  { id: 'm3', question: 'Which data structure uses LIFO (Last-In-First-Out) order?', options: ['Queue','Stack','Heap','Linked List'], correctIndex: 1, category: 'Data Structures', difficulty: 'easy', marks: 1, explanation: 'Stacks push and pop from the same end (LIFO).', createdAt: new Date().toISOString() },
  { id: 'm4', question: 'What is the worst-case time complexity of Quick Sort?', options: ['O(n log n)','O(n)','O(n^2)','O(log n)'], correctIndex: 2, category: 'Algorithms', difficulty: 'medium', marks: 1, explanation: 'Quick sort degrades to O(n^2) when pivots are poorly chosen.', createdAt: new Date().toISOString() },
  { id: 'm5', question: 'Which of the following is NOT a linear data structure?', options: ['Array','Linked List','Tree','Queue'], correctIndex: 2, category: 'Data Structures', difficulty: 'easy', marks: 1, explanation: 'Trees are hierarchical, not linear.', createdAt: new Date().toISOString() },
  { id: 'm6', question: 'Which sorting algorithm is stable and has O(n log n) worst case?', options: ['Quick Sort','Merge Sort','Heap Sort','Selection Sort'], correctIndex: 1, category: 'Algorithms', difficulty: 'medium', marks: 1, explanation: 'Merge sort preserves equal-key ordering and guarantees O(n log n).', createdAt: new Date().toISOString() },
  { id: 'm7', question: 'In OOP, which concept allows a child class to take on properties of a parent class?', options: ['Encapsulation','Polymorphism','Inheritance','Abstraction'], correctIndex: 2, category: 'OOP', difficulty: 'easy', marks: 1, explanation: 'Inheritance lets subclasses reuse and extend parent behavior.', createdAt: new Date().toISOString() },
  { id: 'm8', question: 'Which SQL clause is used to filter rows BEFORE aggregation?', options: ['HAVING','WHERE','GROUP BY','ORDER BY'], correctIndex: 1, category: 'Databases', difficulty: 'medium', marks: 1, explanation: 'WHERE filters rows before GROUP BY; HAVING filters after aggregation.', createdAt: new Date().toISOString() },
  { id: 'm9', question: 'What is the output of: print(2 ** 3 ** 2) in Python?', options: ['64','512','256','12'], correctIndex: 1, category: 'Python', difficulty: 'medium', marks: 1, explanation: 'Exponent is right-associative: 2 ** (3 ** 2) = 2 ** 9 = 512.', createdAt: new Date().toISOString() },
  { id: 'm10', question: 'Which keyword is used to inherit a class in Java?', options: ['implements','inherits','extends','super'], correctIndex: 2, category: 'Java', difficulty: 'easy', marks: 1, explanation: '`extends` is used for class inheritance; `implements` is for interfaces.', createdAt: new Date().toISOString() },
  { id: 'm11', question: 'Which traversal of a BST produces values in sorted order?', options: ['Pre-order','In-order','Post-order','Level-order'], correctIndex: 1, category: 'Data Structures', difficulty: 'medium', marks: 1, explanation: 'In-order traversal of a BST yields sorted ascending order.', createdAt: new Date().toISOString() },
  { id: 'm12', question: "Which of the following is a greedy algorithm?", options: ['Merge Sort',"Dijkstra's Algorithm",'Floyd-Warshall','Bellman-Ford'], correctIndex: 1, category: 'Algorithms', difficulty: 'medium', marks: 1, explanation: 'Dijkstra picks the locally minimum-distance node at each step.', createdAt: new Date().toISOString() },
  { id: 'm13', question: 'What does the `static` keyword mean for a class member in Java/C++?', options: ['Belongs to an instance','Belongs to the class itself','Cannot be modified','Is private'], correctIndex: 1, category: 'OOP', difficulty: 'medium', marks: 1, explanation: 'Static members are shared across all instances and belong to the class.', createdAt: new Date().toISOString() },
  { id: 'm14', question: 'A hash table with good hashing has average lookup time of:', options: ['O(1)','O(log n)','O(n)','O(n log n)'], correctIndex: 0, category: 'Data Structures', difficulty: 'easy', marks: 1, explanation: 'Average-case lookup in a hash table is constant time.', createdAt: new Date().toISOString() },
  { id: 'm15', question: 'Which of these is NOT a valid HTTP method?', options: ['GET','POST','FETCH','DELETE'], correctIndex: 2, category: 'Web', difficulty: 'easy', marks: 1, explanation: 'FETCH is a JS API, not an HTTP method.', createdAt: new Date().toISOString() },
  { id: 'm16', question: 'Which process scheduling algorithm can cause starvation?', options: ['FCFS','Round Robin','Priority Scheduling','Shortest Job First only'], correctIndex: 2, category: 'OS', difficulty: 'medium', marks: 1, explanation: 'Priority scheduling can starve low-priority processes indefinitely.', createdAt: new Date().toISOString() },
  { id: 'm17', question: 'In C, what does `sizeof(int)` typically return on a 64-bit system?', options: ['2','4','8','16'], correctIndex: 1, category: 'C/C++', difficulty: 'easy', marks: 1, explanation: 'An int is typically 4 bytes even on 64-bit systems.', createdAt: new Date().toISOString() },
  { id: 'm18', question: 'Which algorithm solves the shortest path from one source with NO negative edges most efficiently?', options: ['Bellman-Ford','Dijkstra','Floyd-Warshall','DFS'], correctIndex: 1, category: 'Algorithms', difficulty: 'medium', marks: 1, explanation: 'Dijkstra is optimal for single-source shortest paths with non-negative weights.', createdAt: new Date().toISOString() },
  { id: 'm19', question: 'What is normalization in databases primarily used for?', options: ['Speeding up reads','Reducing data redundancy','Encrypting data','Backing up data'], correctIndex: 1, category: 'Databases', difficulty: 'medium', marks: 1, explanation: 'Normalization minimizes redundancy and dependency anomalies.', createdAt: new Date().toISOString() },
  { id: 'm20', question: 'What is the space complexity of recursion with depth n (ignoring call overhead)?', options: ['O(1)','O(log n)','O(n)','O(n^2)'], correctIndex: 2, category: 'Algorithms', difficulty: 'medium', marks: 1, explanation: 'Each recursive call adds a stack frame, so space is O(n) for depth n.', createdAt: new Date().toISOString() },
  { id: 'm21', question: 'Which language is primarily used for iOS app development?', options: ['Java','Swift','Python','C#'], correctIndex: 1, category: 'Programming', difficulty: 'easy', marks: 1, explanation: "Swift is Apple's primary language for iOS.", createdAt: new Date().toISOString() },
  { id: 'm22', question: 'HTTP status code 404 means?', options: ['Server error','Not found','Unauthorized','Success'], correctIndex: 1, category: 'Web', difficulty: 'easy', marks: 1, explanation: '404 = resource not found.', createdAt: new Date().toISOString() },
  { id: 'm23', question: 'Which of these is NOT a JavaScript framework?', options: ['React','Angular','Vue','Django'], correctIndex: 3, category: 'Web', difficulty: 'easy', marks: 1, explanation: 'Django is a Python framework.', createdAt: new Date().toISOString() },
  { id: 'm24', question: 'Time complexity of accessing an element in an array by index?', options: ['O(1)','O(n)','O(log n)','O(n^2)'], correctIndex: 0, category: 'DSA', difficulty: 'easy', marks: 1, explanation: 'Array access is constant time.', createdAt: new Date().toISOString() },
  { id: 'm25', question: 'Which SQL clause filters groups?', options: ['WHERE','GROUP BY','HAVING','ORDER BY'], correctIndex: 2, category: 'Database', difficulty: 'medium', marks: 1, explanation: 'HAVING filters aggregated groups.', createdAt: new Date().toISOString() },
  { id: 'm26', question: 'Which is a NoSQL database?', options: ['MySQL','PostgreSQL','MongoDB','SQLite'], correctIndex: 2, category: 'Database', difficulty: 'easy', marks: 1, explanation: 'MongoDB is a document NoSQL DB.', createdAt: new Date().toISOString() },
  { id: 'm27', question: 'Which protocol is connectionless?', options: ['TCP','UDP','FTP','SMTP'], correctIndex: 1, category: 'Networking', difficulty: 'medium', marks: 1, explanation: 'UDP is connectionless.', createdAt: new Date().toISOString() },
  { id: 'm28', question: 'Which Python keyword creates an anonymous function?', options: ['def','func','lambda','function'], correctIndex: 2, category: 'Programming', difficulty: 'medium', marks: 1, explanation: 'lambda for anonymous functions.', createdAt: new Date().toISOString() },
  { id: 'm29', question: 'Which symbol denotes a single-line comment in Python?', options: ['//','#','/*','--'], correctIndex: 1, category: 'Programming', difficulty: 'easy', marks: 1, explanation: '# for single-line comments.', createdAt: new Date().toISOString() },
  { id: 'm30', question: 'What is the size of an int in Java (in bits)?', options: ['8','16','32','64'], correctIndex: 2, category: 'Programming', difficulty: 'easy', marks: 1, explanation: 'Java int = 32 bits.', createdAt: new Date().toISOString() },
  { id: 'm31', question: 'Which CSS property changes text color?', options: ['font-color','text-color','color','fg-color'], correctIndex: 2, category: 'Web', difficulty: 'easy', marks: 1, explanation: 'CSS uses `color`.', createdAt: new Date().toISOString() },
  { id: 'm32', question: 'What does API stand for?', options: ['Application Programming Interface','Applied Programming Interaction','Application Process Interface','Automated Programming Index'], correctIndex: 0, category: 'General', difficulty: 'easy', marks: 1, explanation: 'API = Application Programming Interface.', createdAt: new Date().toISOString() },
  { id: 'm33', question: 'Which Git command stages changes?', options: ['git push','git add','git commit','git pull'], correctIndex: 1, category: 'Tools', difficulty: 'easy', marks: 1, explanation: 'git add stages changes.', createdAt: new Date().toISOString() },
  { id: 'm34', question: 'Which is NOT a primitive type in Java?', options: ['int','String','double','char'], correctIndex: 1, category: 'Programming', difficulty: 'medium', marks: 1, explanation: 'String is a class.', createdAt: new Date().toISOString() },
  { id: 'm35', question: 'Which Linux command lists files?', options: ['dir','list','ls','show'], correctIndex: 2, category: 'Tools', difficulty: 'easy', marks: 1, explanation: 'ls lists files.', createdAt: new Date().toISOString() },
  { id: 'm36', question: 'Big O of inserting into a hash table (average)?', options: ['O(1)','O(log n)','O(n)','O(n^2)'], correctIndex: 0, category: 'DSA', difficulty: 'medium', marks: 1, explanation: 'Average O(1) for hash insert.', createdAt: new Date().toISOString() },
  { id: 'm37', question: 'Which OSI layer is responsible for routing?', options: ['Data Link','Network','Transport','Session'], correctIndex: 1, category: 'Networking', difficulty: 'medium', marks: 1, explanation: 'Layer 3 - Network handles routing.', createdAt: new Date().toISOString() },
  { id: 'm38', question: 'Which design pattern restricts a class to one instance?', options: ['Factory','Singleton','Observer','Strategy'], correctIndex: 1, category: 'Programming', difficulty: 'medium', marks: 1, explanation: 'Singleton pattern.', createdAt: new Date().toISOString() },
  { id: 'm39', question: 'Which is a strongly typed language?', options: ['Python','JavaScript','Haskell','PHP'], correctIndex: 2, category: 'Programming', difficulty: 'hard', marks: 1, explanation: 'Haskell is strongly statically typed.', createdAt: new Date().toISOString() },
  { id: 'm40', question: 'In React, which hook manages component state?', options: ['useEffect','useState','useMemo','useRef'], correctIndex: 1, category: 'Web', difficulty: 'easy', marks: 1, explanation: 'useState manages state.', createdAt: new Date().toISOString() },
  { id: 'm41', question: 'Which complexity is best for searching in a balanced BST?', options: ['O(1)','O(n)','O(log n)','O(n log n)'], correctIndex: 2, category: 'DSA', difficulty: 'medium', marks: 1, explanation: 'Balanced BST = O(log n).', createdAt: new Date().toISOString() },
  { id: 'm42', question: 'Which SQL JOIN returns only matching rows from both tables?', options: ['LEFT','RIGHT','INNER','FULL OUTER'], correctIndex: 2, category: 'Database', difficulty: 'medium', marks: 1, explanation: 'INNER JOIN returns matches only.', createdAt: new Date().toISOString() },
  { id: 'm43', question: 'Which Python built-in returns the length of an object?', options: ['size()','length()','len()','count()'], correctIndex: 2, category: 'Programming', difficulty: 'easy', marks: 1, explanation: 'len() returns length.', createdAt: new Date().toISOString() },
];

export const sampleFibs: FIBQuestion[] = [
  { id: 'f1', sentence: 'In Python, the ___ keyword is used to define a function.', answers: ['def'], caseSensitive: false, marks: 1, difficulty: 'easy', explanation: 'def defines functions in Python.', createdAt: new Date().toISOString() },
  { id: 'f2', sentence: 'The time complexity of binary search is O(___ n).', answers: ['log'], caseSensitive: false, marks: 1, difficulty: 'easy', explanation: 'Binary search is O(log n).', createdAt: new Date().toISOString() },
  { id: 'f3', sentence: 'A ___ is a data structure that follows FIFO order.', answers: ['queue'], caseSensitive: false, marks: 1, difficulty: 'easy', explanation: 'Queue = FIFO.', createdAt: new Date().toISOString() },
  { id: 'f4', sentence: 'In SQL, ___ is used to remove duplicate rows from a result.', answers: ['DISTINCT'], caseSensitive: false, marks: 1, difficulty: 'medium', explanation: 'DISTINCT eliminates duplicates.', createdAt: new Date().toISOString() },
  { id: 'f5', sentence: 'The HTML element used for the largest heading is ___.', answers: ['h1'], caseSensitive: false, marks: 1, difficulty: 'easy', explanation: 'h1 is the largest heading.', createdAt: new Date().toISOString() },
  { id: 'f6', sentence: 'In Java, the ___ keyword inherits a class.', answers: ['extends'], caseSensitive: false, marks: 1, difficulty: 'easy', explanation: 'extends inherits a class.', createdAt: new Date().toISOString() },
  { id: 'f7', sentence: 'JavaScript variables declared with ___ have block scope and cannot be reassigned.', answers: ['const'], caseSensitive: false, marks: 1, difficulty: 'medium', explanation: 'const = block-scoped, immutable binding.', createdAt: new Date().toISOString() },
  { id: 'f8', sentence: 'A ___ tree is a binary tree where the left subtree contains only nodes with values less than the parent.', answers: ['BST','binary search'], caseSensitive: false, marks: 1, difficulty: 'medium', explanation: 'Binary Search Tree.', createdAt: new Date().toISOString() },
  { id: 'f9', sentence: 'The protocol used to securely transfer web pages is ___.', answers: ['HTTPS'], caseSensitive: false, marks: 1, difficulty: 'easy', explanation: 'HTTPS is secure HTTP.', createdAt: new Date().toISOString() },
  { id: 'f10', sentence: 'In OOP, ___ allows an object to take many forms.', answers: ['polymorphism'], caseSensitive: false, marks: 1, difficulty: 'medium', explanation: 'Polymorphism = many forms.', createdAt: new Date().toISOString() },
];

export const sampleWritings: WritingQuestion[] = [
  {
    id: 'w1',
    title: 'Introduce Yourself',
    prompt: 'Write a short introduction about yourself. Include your background, your interests in programming, your strengths, and what you hope to achieve. Be authentic and specific.',
    minWords: 50, maxWords: 400, marks: 10, createdAt: new Date().toISOString(),
  },
];

export const sampleExams: Exam[] = [
  {
    id: 'exam1',
    title: 'Sample Coding Test',
    description: 'Three classic coding questions with public + private tests',
    questionIds: ['q1', 'q2', 'q3'],
    mcqIds: [], writingIds: [], fibIds: [],
    sectionNames: { coding: 'Coding', mcq: 'Multiple Choice', writing: 'Writing', fib: 'Fill in the Blanks' },
    assignedStudentIds: [], status: 'active',
    createdAt: new Date().toISOString(),
    isTimed: true, startBufferMinutes: 10, examDurationMinutes: 60, allowCopyPaste: true,
  },
  {
    id: 'exam2',
    title: 'Full Assessment',
    description: 'Coding + MCQs + Writing + Fill in the Blanks',
    questionIds: ['q1', 'q4', 'q5'],
    mcqIds: ['m1','m2','m3','m4','m5','m6','m7','m8','m9','m10'],
    writingIds: ['w1'],
    fibIds: ['f1','f2','f3','f4','f5'],
    sectionNames: { coding: 'Coding', mcq: 'Multiple Choice', writing: 'Writing', fib: 'Fill in the Blanks' },
    assignedStudentIds: [], status: 'active',
    createdAt: new Date().toISOString(),
    isTimed: true, startBufferMinutes: 15, examDurationMinutes: 90, allowCopyPaste: true,
  },
  {
    id: 'exam3',
    title: 'Aptitude MCQ Quick Test',
    description: 'Quick MCQ test - 15 mins',
    questionIds: [], writingIds: [],
    mcqIds: ['m11','m12','m13','m14','m15','m16','m17','m18','m19','m20','m21','m22','m23','m24','m25'],
    fibIds: ['f6','f7','f8','f9','f10'],
    sectionNames: { coding: 'Coding', mcq: 'Multiple Choice', writing: 'Writing', fib: 'Fill in the Blanks' },
    assignedStudentIds: [], status: 'active',
    createdAt: new Date().toISOString(),
    isTimed: true, startBufferMinutes: 10, examDurationMinutes: 20, allowCopyPaste: true,
  },
  {
    id: 'exam-midterm',
    title: 'Mid-Term Assessment Test',
    description: 'A coding assessment designed to evaluate problem-solving skills, programming knowledge, and logical thinking. Candidates complete tasks within a given time frame using their preferred programming language.',
    questionIds: ['q1','q2','q3','q4','q5'],
    mcqIds: ['m1','m2','m3'], writingIds: [], fibIds: [],
    sectionNames: { coding: 'Coding', mcq: 'Multiple Choice', writing: 'Writing', fib: 'Fill in the Blanks' },
    assignedStudentIds: [], status: 'active',
    createdAt: new Date().toISOString(),
    scheduledAt: '2026-05-17T22:00:00.000Z',
    startedAt: '2026-05-18T16:57:01.000Z',
    isTimed: true, startBufferMinutes: 10, examDurationMinutes: 120, allowCopyPaste: false,
  },
  {
    id: 'exam-sample',
    title: 'Sample',
    description: 'Sample assessment with three quick questions.',
    questionIds: ['q1','q2','q3'],
    mcqIds: [], writingIds: [], fibIds: [],
    sectionNames: { coding: 'Coding', mcq: 'Multiple Choice', writing: 'Writing', fib: 'Fill in the Blanks' },
    assignedStudentIds: [], status: 'active',
    createdAt: new Date().toISOString(),
    scheduledAt: '2026-03-21T20:58:00.000Z',
    startedAt: '2026-04-28T11:01:31.000Z',
    isTimed: true, startBufferMinutes: 10, examDurationMinutes: 90, allowCopyPaste: false,
  },
  {
    id: 'exam-coding',
    title: 'Coding Assessment',
    description: 'A coding assessment designed to evaluate problem-solving skills, programming knowledge, and logical thinking.',
    questionIds: ['q1','q4','q5'],
    mcqIds: [], writingIds: [], fibIds: [],
    sectionNames: { coding: 'Coding', mcq: 'Multiple Choice', writing: 'Writing', fib: 'Fill in the Blanks' },
    assignedStudentIds: [], status: 'active',
    createdAt: new Date().toISOString(),
    scheduledAt: '2026-05-16T16:30:00.000Z',
    startedAt: '2026-05-17T22:01:19.000Z',
    isTimed: true, startBufferMinutes: 10, examDurationMinutes: 90, allowCopyPaste: false,
  },
  {
    id: 'exam-new',
    title: 'New',
    description: 'Mixed quick assessment.',
    questionIds: ['q1','q2'],
    mcqIds: ['m1','m2'], writingIds: [], fibIds: [],
    sectionNames: { coding: 'Coding', mcq: 'Multiple Choice', writing: 'Writing', fib: 'Fill in the Blanks' },
    assignedStudentIds: [], status: 'active',
    createdAt: new Date().toISOString(),
    startedAt: '2026-05-17T22:01:16.000Z',
    isTimed: true, startBufferMinutes: 10, examDurationMinutes: 60, allowCopyPaste: true,
  },
];

export const sampleStudents: Student[] = [];

export function generateCredentials(name: string): { email: string; password: string } {
  const clean = name.toLowerCase().replace(/\s+/g, '.');
  const rand = Math.random().toString(36).substring(2, 8);
  return {
    email: `${clean}@student.codexam.com`,
    password: rand,
  };
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
