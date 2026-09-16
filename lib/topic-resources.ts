// Brief, original teaching notes and adapted examples, with links to the source topic.
// Keep these separate from saved study state so content updates never rewrite progress.
export type TopicResource = {
    path: string;
    topics: string[];
    use: string;
    exampleTitle: string;
    input: string;
    output: string;
    explanation: string;
    questions: [
        string,
        string
    ];
    related?: {
        label: string;
        path: string;
    }[];
};
export const gfgUrl = (path: string) => `https://www.geeksforgeeks.org/${path}/`;
export const topicResources: Record<string, TopicResource> = {
    variables: {
        path: 'java/variables-in-java', topics: ['Declaration', 'Primitive types', 'Initialization', 'Scope'],
        use: 'Store different kinds of information, such as an age, a salary and a name, with suitable types.',
        exampleTitle: 'Give each value a suitable type', input: 'Age: 25 · salary: 50000.50 · name: GFG', output: 'int · double · String',
        explanation: 'The whole-number age fits an int. The decimal salary needs a decimal type. The name is text. A declaration gives each value a name and a type.',
        questions: ['How do primitive and reference types differ?', 'What happens if you read an uninitialized local variable?'],
    },
    operators: {
        path: 'java/operators-in-java', topics: ['Arithmetic', 'Integer division', 'Remainder', 'Assignment'],
        use: 'Calculate totals, divide items into groups and make comparisons in everyday program logic.',
        exampleTitle: 'Division and remainder', input: 'Two integers: 10 and 3', output: '10 / 3 = 3 · 10 % 3 = 1',
        explanation: 'Three whole groups fit, with one item left. Integer division drops the fractional part; using 10 / 3.0 produces a decimal result.',
        questions: ['How do / and % differ?', 'Why does 5 / 2 produce 2 in Java?'],
    },
    input: {
        path: 'java/scanner-class-in-java', topics: ['Scanner', 'nextInt()', 'nextLine()', 'Console output'],
        use: 'Accept values while the program runs, such as a user’s age or a series of test inputs.',
        exampleTitle: 'Read a value from the console', input: 'The user types 25', output: 'nextInt() reads the integer 25',
        explanation: 'Create a Scanner over System.in, then choose the method that matches the expected type. A later nextLine() can read a pending newline after nextInt().',
        questions: ['How do next() and nextLine() differ?', 'Why can nextLine() appear to skip input after nextInt()?'],
    },
    conditions: {
        path: 'java/decision-making-javaif-else-switch-break-continue-jump', topics: ['if / else', 'else if', 'Boolean expressions', 'switch'],
        use: 'Choose a path through your program, such as granting access only when a condition is true.',
        exampleTitle: 'Follow one decision branch', input: 'age = 20 · condition: age >= 18', output: 'The true branch runs',
        explanation: 'Evaluate the condition first. An if/else chooses one branch; independent if statements can run more than one branch.',
        questions: ['When is an else-if chain useful?', 'What can happen without break in a traditional switch?'],
    },
    loops: {
        path: 'java/loops-in-java', topics: ['for', 'while', 'do-while', 'Loop boundaries'],
        use: 'Repeat the same operation over counters, input values or a collection of items.',
        exampleTitle: 'Print the even numbers', input: 'Start at 2 · stop at 10 · increment by 2', output: '2, 4, 6, 8, 10',
        explanation: 'The condition is checked before each for-loop iteration. Once the counter becomes 12, the condition fails and the loop ends.',
        questions: ['Which loop executes its body at least once?', 'How do break and continue differ?'],
    },
    arrays: {
        path: 'java/arrays-in-java', topics: ['Zero-based indexing', 'Declaration', 'Traversal', 'Bounds'],
        use: 'Keep a fixed number of related values with quick access by position.',
        exampleTitle: 'Read an array position', input: 'values = [10, 20, 30, 40]', output: 'values[0] is 10 · length is 4',
        explanation: 'The last valid index is 3. Accessing index 4 throws an exception. A loop using index < values.length stays inside the bounds.',
        questions: ['What are the default values in a new int array?', 'Why is an array’s last index length - 1?'],
    },
    strings: {
        path: 'java/strings-in-java', topics: ['Immutability', 'String pool', 'equals()', 'charAt()'],
        use: 'Represent text such as usernames, search terms and interview problem inputs.',
        exampleTitle: 'Compare text content', input: 'Two String objects both contain “Java”', output: 'equals() returns true',
        explanation: 'Content equality and reference identity are different questions. String contents cannot be changed in place; operations that change text produce a result string.',
        questions: ['How do == and equals() differ for strings?', 'Why use StringBuilder for repeated changes?'],
    },
    methods: {
        path: 'java/methods-in-java', topics: ['Parameters', 'Return values', 'static', 'Overloading'],
        use: 'Name reusable work and split a larger solution into pieces that are easy to test and explain.',
        exampleTitle: 'Trace a small method call', input: 'A method returns the sum of its two arguments: 4 and 6', output: 'The returned value is 10',
        explanation: 'Arguments supply values for the parameters. A return statement passes a result back to the caller; printing a value alone does not return it.',
        questions: ['What is a method signature?', 'Can two methods be overloaded by return type alone?'],
    },
    oop: {
        path: 'java/object-oriented-programming-oops-concept-in-java', topics: ['Classes & objects', 'Encapsulation', 'Inheritance', 'Polymorphism'],
        use: 'Model entities with their own state and behavior, while keeping responsibilities clear.',
        exampleTitle: 'A class is a blueprint', input: 'A Car class is used to create two car objects', output: 'Each object has its own instance state',
        explanation: 'Both objects follow the same class definition, but changing one car’s instance field does not change the other car’s field. Static state is shared by the class.',
        questions: ['How do abstraction and encapsulation differ?', 'What is runtime polymorphism?'],
    },
    arraylist: {
        path: 'java/arraylist-in-java', topics: ['Dynamic size', 'add / get / set', 'Removal', 'Iteration'],
        use: 'Maintain an ordered sequence when the number of items can grow.',
        exampleTitle: 'Add elements to a growing list', input: 'Start empty; append 1, then 2, then 3', output: '[1, 2, 3] · get(1) returns 2',
        explanation: 'Appending preserves insertion order. Inserting at a position shifts later elements, which costs more than reading an index.',
        questions: ['How is ArrayList different from an array?', 'Why is append amortized O(1), rather than always O(1)?'],
    },
    hashmap: {
        path: 'java/java-util-hashmap-in-java-with-examples', topics: ['Keys & values', 'put / get', 'getOrDefault', 'Collisions'],
        use: 'Find a value by its key, such as a student’s score or a word’s frequency.',
        exampleTitle: 'Putting the same key twice', input: 'put("Java", 1), then put("Java", 2)', output: 'get("Java") returns 2 · size is 1',
        explanation: 'A map stores one value per key. A later put for an equal key replaces the previous value. HashMap does not promise iteration order.',
        questions: ['What is the role of equals() and hashCode()?', 'Does HashMap preserve insertion order?'],
    },
    hashset: {
        path: 'java/hashset-in-java', topics: ['Uniqueness', 'add / contains', 'Equality', 'Iteration order'],
        use: 'Track distinct items and quickly test whether an item has already appeared.',
        exampleTitle: 'Add the same value twice', input: 'Add “Java”, “SQL”, then “Java”', output: 'Size is 2 · the last add returns false',
        explanation: 'Duplicate values are not stored again. The iteration order is unspecified, so do not rely on how the set prints.',
        questions: ['How does HashSet identify duplicates?', 'When would you choose LinkedHashSet or TreeSet?'],
    },
    collections: {
        path: 'java/java-collection-tutorial', topics: ['List / Set / Queue', 'Map', 'Interfaces', 'Implementations'],
        use: 'Select a standard data structure based on the operations your program needs.',
        exampleTitle: 'One input, two collection behaviors', input: 'Insert A, B, A into a List and a Set', output: 'List size: 3 · Set size: 2',
        explanation: 'A list can keep duplicates and positions. A set keeps unique values. Map belongs to the framework but does not extend the Collection interface.',
        questions: ['How do Collection and Collections differ?', 'Why declare a variable using an interface type?'],
    },
    complexity: {
        path: 'dsa/understanding-time-complexity-simple-examples', topics: ['Big O', 'Input size', 'Loop counting', 'Auxiliary space'],
        use: 'Compare how solutions scale before choosing one for large inputs.',
        exampleTitle: 'Halve the remaining work', input: 'Repeatedly divide 16 by 2 until it becomes 1', output: '16 → 8 → 4 → 2 → 1: four halvings',
        explanation: 'Doubling the starting size adds only one halving. That is logarithmic growth. Keeping one counter uses constant auxiliary memory.',
        questions: ['Does O(n) describe exact seconds?', 'What is the difference between total and auxiliary space?'],
    },
    sorting: {
        path: 'dsa/insertion-sort-algorithm', topics: ['Sorted prefix', 'Insertion sort', 'Stability', 'Best / worst case'],
        use: 'Put items in order to make searching, grouping and comparison easier.',
        exampleTitle: 'One insertion-sort step', input: 'Sorted prefix [5, 12]; next value 11', output: 'The prefix becomes [5, 11, 12]',
        explanation: 'Keep 11 aside, shift 12 right, and place 11 in the gap. Continue growing the sorted prefix. This trace illustrates one step, not the full practice solution.',
        questions: ['Why is insertion sort efficient on nearly sorted input?', 'What makes a sorting algorithm stable?'],
    },
    'binary-search': {
        path: 'dsa/binary-search', topics: ['Sorted input', 'Search bounds', 'Midpoint', 'Halving'],
        use: 'Locate a value in a sorted search space without checking every element.',
        exampleTitle: 'Discard half the search space', input: '[2, 3, 4, 10, 40], target 10', output: 'Inspect 4, then 10; target is at index 3',
        explanation: 'The target is larger than the first midpoint, so ignore that midpoint and everything to its left. Maintain clear inclusive or exclusive bounds.',
        questions: ['Why must the array be sorted?', 'Why write low + (high - low) / 2?'],
    },
    'two-pointers': {
        path: 'dsa/two-pointers-technique', topics: ['Left / right pointers', 'Sorted pairs', 'Pointer movement', 'Invariants'],
        use: 'Use two positions together to avoid repeatedly scanning the same elements.',
        exampleTitle: 'Move the correct pointer', input: 'Sorted [1, 2, 4, 6], target sum 8', output: '1 + 6 is too small; 2 + 6 equals 8',
        explanation: 'With sorted input, advancing the left pointer can increase the sum. Explain why each pointer move cannot discard a valid answer.',
        questions: ['Why does this pair-sum strategy need sorted data?', 'How do you show the total pointer work is O(n)?'],
    },
    'sliding-window': {
        path: 'dsa/window-sliding-technique', topics: ['Fixed windows', 'Add / remove', 'Running state', 'Variable windows'],
        use: 'Process consecutive sections, such as the total over the latest few readings.',
        exampleTitle: 'Slide a window of size three', input: '[1, 4, 2, 10, 2], k = 3', output: 'Window sums: 7, 16, 14',
        explanation: 'After the first sum, remove the outgoing number and add the incoming number. For example, 7 - 1 + 10 becomes 16.',
        questions: ['When is sliding window applicable?', 'Why can negative values break some shrinking-window strategies?'],
    },
    'prefix-sum': {
        path: 'dsa/prefix-sum-array-implementation-applications-competitive-programming', topics: ['Running totals', 'Preprocessing', 'Range queries', 'Index boundaries'],
        use: 'Answer many sum queries over a fixed array without rescanning each range.',
        exampleTitle: 'Build cumulative totals', input: '[10, 20, 10, 5]', output: 'Prefix totals: [10, 30, 40, 45]',
        explanation: 'The sum from index 1 through 3 is 45 - 10 = 35. A leading zero in an n+1 prefix array can simplify boundary handling.',
        questions: ['How do you answer an inclusive range-sum query?', 'What changes if the original array is updated often?'],
    },
    hashing: {
        path: 'dsa/introduction-to-hashing-2', topics: ['Hash functions', 'Buckets', 'Collisions', 'Frequency patterns'],
        use: 'Organize values for quick expected lookups rather than scan every stored item.',
        exampleTitle: 'See a collision', input: 'A toy hash function key % 10; keys 12 and 22', output: 'Both map to bucket 2',
        explanation: 'A matching hash is not proof that keys are equal. A hash table needs a collision strategy and equality checks to distinguish those entries.',
        questions: ['What is a hash collision?', 'Why is average O(1) lookup not an unconditional guarantee?'],
    },
    'linked-list': {
        path: 'dsa/singly-linked-list-tutorial', topics: ['Node structure', 'Head', 'next references', 'Traversal'],
        use: 'Connect items through references when insertions and removals around known nodes matter.',
        exampleTitle: 'Follow the next reference', input: 'head points to 10, then 20, then 30', output: 'A traversal visits 10, 20, 30, then reaches null',
        explanation: 'Each node stores its value and a reference to the next node. Unlike an array, reaching the third node requires following the chain.',
        questions: ['Why is indexed access O(n)?', 'What changes when inserting at the head?'],
    },
    stack: {
        path: 'dsa/stack-data-structure', topics: ['LIFO', 'push / pop / peek', 'Underflow', 'ArrayDeque'],
        use: 'Remember the most recent pending item, as in undo history or nested expressions.',
        exampleTitle: 'Think of a stack of plates', input: 'Push 10, push 20, then pop', output: '20 is removed; 10 remains on top',
        explanation: 'The newest entry is the first removed. peek reads the top without removing it. In Java, ArrayDeque is a useful stack implementation.',
        questions: ['Where do you see stacks in program execution?', 'How do peek() and pop() differ?'],
    },
    queue: {
        path: 'dsa/queue-data-structure', topics: ['FIFO', 'offer / poll / peek', 'Empty queues', 'ArrayDeque'],
        use: 'Process pending items in arrival order, such as buffered work or a breadth-first traversal.',
        exampleTitle: 'Serve the earliest arrival', input: 'Offer 10, then 20; call poll()', output: '10 is removed; 20 is next',
        explanation: 'Add at the back and remove from the front. With ArrayDeque, poll returns null when empty, while remove throws an exception.',
        questions: ['How does a queue differ from a stack?', 'Why is a queue useful for BFS?'],
    },
    recursion: {
        path: 'dsa/introduction-to-recursion-2', topics: ['Base case', 'Recursive case', 'Call stack', 'Progress toward base'],
        use: 'Express work using a smaller version of the same problem, especially for trees and backtracking.',
        exampleTitle: 'Trace factorial calls', input: 'factorial(4), with factorial(0) = 1', output: '4 × 3 × 2 × 1 = 24',
        explanation: 'Each call waits for a smaller call to return. A base case ends the chain; the pending calls then finish in reverse order.',
        questions: ['What happens without a reachable base case?', 'Where does recursion’s auxiliary space come from?'],
    },
    trees: {
        path: 'dsa/introduction-to-tree-data-structure', topics: ['Root / child / leaf', 'Edges', 'Depth & height', 'Binary trees'],
        use: 'Represent hierarchical relationships such as folders or an organization chart.',
        exampleTitle: 'Name the parts of a small tree', input: 'Root A has children B and C; B has child D', output: 'A is the root · C and D are leaves',
        explanation: 'This tree has four nodes and three edges. D has depth 2 when depth counts edges from the root. State your height convention in interviews.',
        questions: ['How many edges does a tree with n nodes have?', 'Is every binary tree a binary search tree?'],
    },
    bst: {
        path: 'dsa/binary-search-tree-data-structure', topics: ['Ordering rule', 'Search', 'Insertion', 'Balanced vs skewed'],
        use: 'Maintain searchable ordered data while supporting changes to the set of values.',
        exampleTitle: 'Choose a branch during search', input: 'Root 8; left child 3; right child 10. Search for 3.', output: 'Compare with 8, then follow the left child',
        explanation: 'Smaller keys belong in the left subtree and larger keys in the right, under a no-duplicates policy. Running time depends on the tree height.',
        questions: ['Why can an unbalanced BST search take O(n)?', 'What does inorder traversal of a BST produce?'],
    },
    'tree-dfs': {
        path: 'dsa/dfs-traversal-of-a-tree-using-recursion', topics: ['Recursive descent', 'Preorder', 'Inorder', 'Postorder'],
        use: 'Finish one branch before exploring another, useful for evaluating or inspecting nested structures.',
        exampleTitle: 'Compare depth-first visit orders', input: 'Root 1 has left child 2 and right child 3', output: 'Preorder: 1, 2, 3 · Inorder: 2, 1, 3',
        explanation: 'The placement of the visit operation changes the traversal. Both orders explore the left subtree before the right subtree.',
        questions: ['When is postorder useful?', 'How does a skewed tree affect recursive stack depth?'],
    },
    'tree-bfs': {
        path: 'dsa/level-order-tree-traversal', topics: ['Level order', 'Queue', 'Frontier', 'Level boundaries'],
        use: 'Visit all nodes near the root before deeper nodes, such as displaying a hierarchy one level at a time.',
        exampleTitle: 'Visit a tree by levels', input: 'Root 1; children 2, 3; node 2 has children 4, 5', output: 'Levels: [1], [2, 3], [4, 5]',
        explanation: 'A queue holds nodes awaiting a visit. Record its size at the start of a level if you want to group the output into levels.',
        questions: ['Why does a queue produce level order?', 'How much memory can the widest level require?'],
    },
    traversals: {
        path: 'dsa/tree-traversals-inorder-preorder-and-postorder', topics: ['Preorder', 'Inorder', 'Postorder', 'Traversal comparison'],
        use: 'Choose an order that suits the task, such as processing children before deleting their parent.',
        exampleTitle: 'Move the root’s position', input: 'Root A with leaf children B and C', output: 'Pre: A B C · In: B A C · Post: B C A',
        explanation: 'Preorder visits a parent first. Inorder places it between the two subtrees. Postorder processes both subtrees before the parent.',
        questions: ['Which traversal gives sorted keys for a BST?', 'Can one traversal uniquely reconstruct an arbitrary binary tree?'],
    },
    heap: {
        path: 'java/priority-queue-in-java', topics: ['Min-heap', 'offer / poll / peek', 'Comparators', 'Heap order'],
        use: 'Repeatedly retrieve the smallest or highest-priority item without sorting the full collection each time.',
        exampleTitle: 'Priority beats insertion order', input: 'Offer 30, then 10, then 20 to a default PriorityQueue', output: 'Repeated poll() calls return 10, 20, 30',
        explanation: 'The smallest item is at the head. Iterating over the queue is not guaranteed to produce sorted order; polling repeatedly is different.',
        questions: ['How do you create a max-priority queue in Java?', 'What are the costs of peek(), offer() and poll()?'],
    },
    greedy: {
        path: 'dsa/greedy-algorithms', topics: ['Local choices', 'Greedy property', 'Proof', 'Counterexamples'],
        use: 'Make an efficient local choice when you can prove it leads to a globally correct result.',
        exampleTitle: 'Test a tempting coin rule', input: 'Coins [1, 3, 4]; amount 6; choose the largest first', output: 'Greedy uses 4 + 1 + 1; 3 + 3 uses fewer coins',
        explanation: 'A locally attractive decision is not always globally best. Use counterexamples before claiming that a greedy rule solves every input.',
        questions: ['How would you justify a greedy choice?', 'When should you consider dynamic programming instead?'],
    },
    graphs: {
        path: 'dsa/graph-data-structure-and-algorithms', topics: ['Vertices & edges', 'Directed / undirected', 'Adjacency lists', 'Weighted edges'],
        use: 'Model connections such as roads, dependencies or relationships in a network.',
        exampleTitle: 'Store a small undirected graph', input: 'Edges (0, 1) and (0, 2)', output: 'Neighbors: 0 → [1, 2], 1 → [0], 2 → [0]',
        explanation: 'An undirected connection is recorded in both endpoints’ lists. A directed edge only adds the outgoing relationship.',
        questions: ['When is an adjacency matrix useful?', 'How do directed and undirected edges differ?'],
    },
    'graph-traversal': {
        path: 'dsa/breadth-first-search-or-bfs-for-a-graph', topics: ['Visited state', 'BFS queue', 'DFS stack', 'Disconnected components'],
        use: 'Explore reachability and, with BFS on an unweighted graph, find minimum edge-count distances.',
        exampleTitle: 'Explore neighbors before going deeper', input: 'Edges (0,1), (0,2), (1,3); start at 0', output: 'BFS: 0, 1, 2, 3 when neighbors are in that order',
        explanation: 'Mark a vertex when enqueuing it so cycles cannot repeatedly enqueue the same work. A disconnected graph needs additional starting points to visit every vertex.',
        questions: ['Why does BFS find shortest unweighted paths?', 'Why do graph traversals need visited state?'],
        related: [{ label: 'Depth First Search for a Graph', path: 'dsa/depth-first-search-or-dfs-for-a-graph' }],
    },
    'union-find': {
        path: 'dsa/union-find-algorithm-union-rank-find-optimized-path-compression', topics: ['Disjoint sets', 'find / union', 'Path compression', 'Union by rank'],
        use: 'Maintain connected groups as edges arrive, including cycle detection and network connectivity.',
        exampleTitle: 'Merge two connected groups', input: 'union(0, 1), then union(1, 2)', output: '0, 1 and 2 have the same representative',
        explanation: 'The representative identifies a set, not necessarily its smallest member. Path compression shortens future searches; rank or size avoids needlessly tall trees.',
        questions: ['What does find() return?', 'Why combine path compression with union by rank or size?'],
    },
    dp: {
        path: 'dsa/introduction-to-dynamic-programming-data-structures-and-algorithm-tutorials', topics: ['State', 'Base cases', 'Memoization', 'Tabulation'],
        use: 'Reuse answers when a recursive problem repeatedly solves the same smaller inputs.',
        exampleTitle: 'Spot repeated work', input: 'F(4) needs F(3) and F(2); F(3) also needs F(2)', output: 'The result for F(2) can be computed once and reused',
        explanation: 'Define precisely what each stored answer means before writing a transition. Memoization saves recursive results; tabulation builds answers in dependency order.',
        questions: ['What makes subproblems overlap?', 'How do memoization and tabulation differ?'],
    },
    fibonacci: {
        path: 'dsa/program-for-nth-fibonacci-number', topics: ['Two base values', 'Recurrence', 'Tabulation', 'Rolling state'],
        use: 'Learn how two previous answers can be enough to build the next answer.',
        exampleTitle: 'Build the Fibonacci sequence', input: 'F(0) = 0, F(1) = 1', output: 'F(0..5): 0, 1, 1, 2, 3, 5',
        explanation: 'Each later value adds the previous two. If only the final value is required, the entire array of earlier values need not be retained.',
        questions: ['Why is naive recursion inefficient?', 'When will int overflow become a concern?'],
    },
    climbing: {
        path: 'dsa/count-ways-reach-nth-stair', topics: ['Count states', 'Allowed moves', 'Base cases', 'Fibonacci relationship'],
        use: 'Count ways to reach a position from smaller positions under restricted moves.',
        exampleTitle: 'List the routes up four stairs', input: '4 stairs; each move climbs 1 or 2', output: '5 routes: 1111, 112, 121, 211, 22',
        explanation: 'Separate routes by their final move. A final single step comes from stair 3; a final double step comes from stair 2.',
        questions: ['What does your state for stair i mean?', 'How do the base cases change with different allowed moves?'],
    },
    knapsack: {
        path: 'dsa/0-1-knapsack-problem-dp-10', topics: ['Take / skip', 'Capacity', '2D state', 'Reverse capacity updates'],
        use: 'Choose a valuable subset while respecting a resource limit and using each item at most once.',
        exampleTitle: 'A capacity limit forces a choice', input: 'Weights [10,20,30], values [60,100,120], capacity 50', output: 'Choose weights 20 and 30 for value 220',
        explanation: 'Taking the best value-per-weight item first is not always correct for 0/1 choices. Compare taking and skipping each item within the remaining capacity.',
        questions: ['How does 0/1 knapsack differ from fractional knapsack?', 'Why update capacity downward in a one-array implementation?'],
    },
    subset: {
        path: 'dsa/subset-sum-problem-dp-25', topics: ['Reachability', 'Boolean states', 'Target sum', '0/1 choices'],
        use: 'Check whether a selection of nonnegative numbers can meet an exact target.',
        exampleTitle: 'Find a reachable target', input: '[3, 34, 4, 12, 5, 2], target 9', output: 'Possible: 4 + 5 = 9',
        explanation: 'For each number, a sum is reachable by skipping it or by adding it to an earlier reachable sum. The empty selection makes sum zero reachable.',
        questions: ['Why is the state for sum zero true?', 'What changes if negative numbers are allowed?'],
    },
    lis: {
        path: 'dsa/longest-increasing-subsequence-dp-3', topics: ['Subsequence', 'Strictly increasing', 'DP ending at i', 'Tails technique'],
        use: 'Find a growing sequence while preserving the original order and allowing skipped elements.',
        exampleTitle: 'Skip elements, preserve order', input: '[10, 22, 9, 33, 21, 50, 41, 60]', output: 'Length 5; one LIS is [10, 22, 33, 50, 60]',
        explanation: 'The selected values need not be adjacent. Equal values do not extend a strictly increasing sequence. Multiple longest subsequences may be valid.',
        questions: ['How does a subsequence differ from a subarray?', 'Does a tails array always contain the actual LIS?'],
    },
    'grid-dp': {
        path: 'dsa/count-possible-paths-top-left-bottom-right-nxm-matrix', topics: ['Cell states', 'Right / down moves', 'Boundary cells', 'Rolling rows'],
        use: 'Combine answers from neighboring cells to solve route-counting or grid optimization problems.',
        exampleTitle: 'Count routes across a small grid', input: '2 rows × 3 columns; move only right or down', output: '3 routes: RRD, RDR, DRR',
        explanation: 'An interior cell is reached from above or from the left. Without obstacles, the first row and first column each have exactly one route from the start.',
        questions: ['What changes when some cells are blocked?', 'Why can one row of memory be enough?'],
    },
};
