export type CodingCase = { id: string; name: string; input: string; expected: string; sample: boolean };
export type CodingTask = {
  id: string; statement: string; inputFormat: string; outputFormat: string;
  constraints: string[]; cases: CodingCase[]; starter: string;
  comparison: 'tokens' | 'decimal';
};
type CaseRow = [name: string, input: string, expected: string];
const starter = `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        // Read the input described in the problem.
        // Write your approach here, then print only the answer.
    }
}
`;
const arrayInput = 'Read n, followed by n integers separated by whitespace.';
const arrayBounds = ['0 ≤ n ≤ 1,000', '−1,000,000 ≤ each value ≤ 1,000,000'];
const treeInput = 'Read m, then m level-order tokens. Each token is an integer or null. For each non-null node, the next two tokens describe its left and right children; omitted trailing children are null. m = 0 means an empty tree.';
const treeBounds = ['0 ≤ m ≤ 511', 'Node values are integers from −1,000 to 1,000', 'The input describes a valid binary tree'];
function task(id: string, statement: string, inputFormat: string, outputFormat: string, constraints: string[], cases: CaseRow[], comparison: CodingTask['comparison'] = 'tokens'): CodingTask {
  return { id, statement, inputFormat, outputFormat, constraints, comparison, starter,
    cases: cases.map(([name, input, expected], i) => ({id: String(i + 1), name, input, expected, sample: i < 2})) };
}
const definitions: CodingTask[] = [
  task('variables', 'Read a student profile into appropriately typed variables and display its four fields with the labels shown.', 'Line 1: student name. Line 2: age (int), practice hours (double), eligibility (boolean).', 'Print four lines: Name: <name>, Age: <age>, Hours: <hours>, Eligible: <true/false>.', ['1–60 characters in the name', '0 ≤ age ≤ 120', 'Hours is one of 0.0, 0.5, 1.0, 1.5, 2.0'], [
    ['Student profile','Muthu\n20 1.5 true','Name: Muthu\nAge: 20\nHours: 1.5\nEligible: true'],
    ['Two-word name','Anu Ravi\n18 1.0 false','Name: Anu Ravi\nAge: 18\nHours: 1.0\nEligible: false'],
    ['Zero values','Sam\n0 0.0 false','Name: Sam\nAge: 0\nHours: 0.0\nEligible: false'],
    ['Half hour','Lee\n21 0.5 true','Name: Lee\nAge: 21\nHours: 0.5\nEligible: true'],
    ['Maximum age','Jo\n120 2.0 false','Name: Jo\nAge: 120\nHours: 2.0\nEligible: false'],
  ]),
  task('operators', 'Calculate the total and arithmetic mean of three marks. Preserve the fractional part of the mean.', 'Three integer marks a, b and c.', 'Print the total, then the mean, separated by whitespace. Decimal answers allow an absolute error of 0.000001.', ['0 ≤ each mark ≤ 100'], [
    ['Whole-number average','71 82 90','243 81'],['Fractional average','1 2 2','5 1.6666666667'],['All zero','0 0 0','0 0'],['Maximum marks','100 100 100','300 100'],['Unequal marks','0 50 100','150 50'],
  ], 'decimal'),
  task('input', 'Read three integers and print them in the same order.', 'Three signed integers separated by spaces or newlines.', 'Print each integer on its own line.', ['−2,000,000,000 ≤ each integer ≤ 2,000,000,000'], [
    ['Sample numbers','8 15 23','8\n15\n23'],['Negative and zero','-9 0 9','-9\n0\n9'],['Mixed whitespace','1\n2  3\n','1\n2\n3'],['Large values','2000000000 -2000000000 0','2000000000\n-2000000000\n0'],['Repeated values','7 7 7','7\n7\n7'],
  ]),
  task('conditions', 'Classify a signed integer as positive, negative, or zero.', 'One integer n.', 'Print exactly positive, negative, or zero in lowercase.', ['−2,000,000,000 ≤ n ≤ 2,000,000,000'], [
    ['Positive','12','positive'],['Negative','-3','negative'],['Zero boundary','0','zero'],['Small positive','1','positive'],['Small negative','-1','negative'],['Large negative','-2000000000','negative'],
  ]),
  task('loops', 'Calculate the sum of every integer from 1 through n, including n. Start with a loop; then consider a constant-time approach.', 'One integer n.', 'Print the sum as an integer. The answer may require long.', ['0 ≤ n ≤ 1,000,000'], [
    ['Five numbers','5','15'],['Single number','1','1'],['Empty sum','0','0'],['Two numbers','2','3'],['Overflow check','1000000','500000500000'],['Ten numbers','10','55'],
  ]),
  task('arrays', 'Find the largest value in a nonempty array.', arrayInput, 'Print the largest integer.', ['1 ≤ n ≤ 1,000', ...arrayBounds.slice(1)], [
    ['Mixed values','4\n4 9 2 7','9'],['One element','1\n-8','-8'],['All negative','4\n-7 -2 -11 -3','-2'],['Repeated maximum','5\n8 8 1 8 0','8'],['Zero maximum','3\n-2 0 -1','0'],['Largest last','4\n1 2 3 1000000','1000000'],
  ]),
  task('strings', 'Count English vowels a, e, i, o and u in a line of text, ignoring case.', 'One complete line of text; it can be empty and can contain spaces.', 'Print the vowel count.', ['0–1,000 characters', 'ASCII letters, digits, spaces and punctuation'], [
    ['Placement','Placement','3'],['Uppercase vowels','AEIOU','5'],['Empty text','\n','0'],['No vowels','rhythm 123!','0'],['Mixed case','Java IS fun','4'],['Repeated vowels','AaEeIiOoUu','10'],
  ]),
  task('methods', 'Write and call a static boolean isEven(int value) method to check whether the input is even.', 'One signed integer.', 'Print true for even values and false otherwise.', ['−2,000,000,000 ≤ value ≤ 2,000,000,000'], [
    ['Even','8','true'],['Odd','7','false'],['Zero','0','true'],['Negative even','-12','true'],['Negative odd','-3','false'],['Large even','2000000000','true'],
  ]),
  task('oop', 'Model a BankAccount with a private long balance, a deposit method and a getter. Start with the initial balance; accept only positive deposits. Ignore zero and negative deposits.', 'Initial balance, deposit count n, then n signed deposit amounts.', 'Print the final balance.', ['0 ≤ initial balance ≤ 1,000,000,000', '0 ≤ n ≤ 1,000', '−1,000,000,000 ≤ deposit ≤ 1,000,000,000'], [
    ['Valid deposits','100 3\n20 30 50','200'],['Reject invalid deposits','50 4\n0 -20 10 -1','60'],['No deposits','17 0','17'],['Starts at zero','0 2\n1 2','3'],['Large balance','1000000000 3\n1000000000 1000000000 1000000000','4000000000'],
  ]),
  task('arraylist', 'Collect all even numbers into an ArrayList while preserving their original order.', arrayInput, 'Print the even values separated by spaces. Print EMPTY if there are none.', arrayBounds, [
    ['Mixed parity','5\n1 2 4 7 8','2 4 8'],['No even values','3\n1 3 5','EMPTY'],['Empty array','0','EMPTY'],['Negative and zero','4\n-4 -3 0 2','-4 0 2'],['Keep repetitions','4\n2 2 6 2','2 2 6 2'],
  ]),
  task('hashmap', 'Count each word using a frequency map. Display the result in lexicographic word order so the output is deterministic.', 'Read n, then n lowercase words separated by whitespace.', 'One line per distinct word: word count. Print EMPTY if n is zero.', ['0 ≤ n ≤ 1,000', 'Each word contains 1–20 lowercase English letters'], [
    ['Word frequencies','3\njava sql java','java 2\nsql 1'],['Alphabetical order','4\nzebra apple zebra banana','apple 1\nbanana 1\nzebra 2'],['No words','0','EMPTY'],['One word','1\njava','java 1'],['Repeated word','5\na a a a a','a 5'],
  ]),
  task('hashset', 'Determine whether any integer appears more than once.', arrayInput, 'Print true if a duplicate exists; otherwise print false.', arrayBounds, [
    ['Duplicate','3\n2 4 2','true'],['All distinct','3\n2 4 7','false'],['Empty input','0','false'],['Single value','1\n0','false'],['Negative duplicate','4\n-1 2 -1 3','true'],['Repeated zero','2\n0 0','true'],
  ]),
  task('collections', 'Use suitable Java collections to remove duplicate IDs and display the distinct IDs in ascending order.', arrayInput, 'Print the sorted unique values separated by spaces, or EMPTY.', arrayBounds, [
    ['Sort unique IDs','6\n4 1 4 2 1 3','1 2 3 4'],['Empty IDs','0','EMPTY'],['One ID','1\n7','7'],['Repeated ID','4\n2 2 2 2','2'],['Signed IDs','5\n-1 0 -2 -1 3','-2 -1 0 3'],
  ]),
  task('complexity', 'Two loops each run from 0 through n−1. Calculate how many times their innermost operation would run, without executing the nested loops.', 'One integer n.', 'Print the exact number of operations using long arithmetic.', ['0 ≤ n ≤ 1,000,000,000', 'Use O(1) time and O(1) auxiliary space'], [
    ['Three by three','3','9'],['One by one','1','1'],['Zero operations','0','0'],['Beyond int','100000','10000000000'],['Maximum input','1000000000','1000000000000000000'],
  ]),
  task('sorting', 'Sort the integers in ascending order. Practise implementing insertion sort rather than calling a built-in sort.', arrayInput, 'Print sorted values separated by spaces, or EMPTY.', arrayBounds, [
    ['Unsorted','4\n5 2 4 1','1 2 4 5'],['Already sorted','4\n1 2 3 4','1 2 3 4'],['Empty array','0','EMPTY'],['Duplicates','5\n3 1 3 1 3','1 1 3 3 3'],['Negative values','4\n-1 -5 0 -2','-5 -2 -1 0'],['Descending','6\n6 5 4 3 2 1','1 2 3 4 5 6'],
  ]),
  task('binary-search', 'Find the zero-based index of a target in a sorted array of distinct integers. Use binary search.', 'Read n and target, then n ascending distinct integers.', 'Print the index, or -1 when the target is absent.', arrayBounds, [
    ['Found in middle','4 7\n1 3 7 9','2'],['Not found','4 5\n1 3 7 9','-1'],['Empty array','0 2','-1'],['First position','4 -5\n-5 -1 0 8','0'],['Last position','4 8\n-5 -1 0 8','3'],['Single element','1 12\n12','0'],
  ]),
  task('two-pointers', 'Reverse an integer array in place using two pointers.', arrayInput, 'Print the reversed values, or EMPTY.', arrayBounds, [
    ['Even length','4\n1 2 3 4','4 3 2 1'],['Odd length','5\n1 2 3 4 5','5 4 3 2 1'],['Empty','0','EMPTY'],['One value','1\n7','7'],['Signed values','4\n-2 0 3 -9','-9 3 0 -2'],
  ]),
  task('sliding-window', 'Find the maximum sum among all contiguous windows containing exactly k values.', 'Read n and k, then n integers.', 'Print the maximum window sum. Use long for sums.', ['1 ≤ k ≤ n ≤ 1,000', '−1,000,000,000 ≤ each value ≤ 1,000,000,000'], [
    ['Three-value window','6 3\n2 1 5 1 3 2','9'],['Negative windows','4 2\n-5 -2 -8 -1','-7'],['Whole array','3 3\n2 3 4','9'],['Single-value window','4 1\n-2 9 3 4','9'],['Large sum','4 3\n1000000000 1000000000 1000000000 1000000000','3000000000'],['One value','1 1\n-7','-7'],
  ]),
  task('prefix-sum', 'Calculate the running sum through each array position, including the current value.', arrayInput, 'Print the running sums separated by spaces, or EMPTY.', ['0 ≤ n ≤ 1,000', '−1,000,000,000 ≤ each value ≤ 1,000,000,000', 'Use long for sums'], [
    ['Positive values','4\n1 2 3 4','1 3 6 10'],['Signed values','4\n3 -5 2 7','3 -2 0 7'],['Empty','0','EMPTY'],['One value','1\n-8','-8'],['Large sums','3\n1000000000 1000000000 1000000000','1000000000 2000000000 3000000000'],
  ]),
  task('hashing', 'Return the indices of two different elements whose sum is the target. Exactly one valid index pair exists.', 'Read n and target, then n integers.', 'Print the two zero-based indices in increasing order.', ['2 ≤ n ≤ 1,000', '−1,000,000 ≤ each value and target ≤ 1,000,000', 'Exactly one answer exists; do not reuse one element'], [
    ['Standard pair','4 9\n2 7 11 15','0 1'],['Equal values','2 6\n3 3','0 1'],['Negative pair','4 -5\n-2 4 -3 9','0 2'],['Pair at the end','4 12\n1 2 5 7','2 3'],['Zero target','3 0\n-4 0 4','0 2'],
  ]),
  task('linked-list', 'Build a singly linked list from the values and count its nodes by following next references.', arrayInput, 'Print the number of nodes. An empty list has zero nodes.', arrayBounds, [
    ['Three nodes','3\n4 8 12','3'],['Empty list','0','0'],['One node','1\n9','1'],['Repeated values','4\n2 2 2 2','4'],['Signed nodes','5\n-2 0 3 -1 4','5'],
  ]),
  task('stack', 'Determine whether a string containing only round brackets is balanced. Every closing bracket must match an earlier opening bracket.', 'One line containing only ( and ); it may be empty.', 'Print true if balanced, otherwise false.', ['0–1,000 brackets'], [
    ['Nested pairs','(())','true'],['Missing closer','(()','false'],['Empty string','\n','true'],['Wrong order',')(','false'],['Adjacent pairs','()()','true'],['Extra closer','())','false'],
  ]),
  task('queue', 'Enqueue the tokens in input order, serve up to k tokens, and report the next token. Serving an empty queue does nothing.', 'Read n and k, then n token integers.', 'Print the next token, or EMPTY if none remain.', ['0 ≤ n, k ≤ 1,000', 'Token IDs are positive integers'], [
    ['Serve two','3 2\n101 102 103','103'],['Serve none','3 0\n101 102 103','101'],['Empty queue','0 3','EMPTY'],['Exactly exhausted','2 2\n5 6','EMPTY'],['Serve too many','2 7\n5 6','EMPTY'],
  ]),
  task('recursion', 'Write a recursive method that sums 1 through n. Include a base case for zero.', 'One integer n.', 'Print the sum.', ['0 ≤ n ≤ 300'], [
    ['Four numbers','4','10'],['One number','1','1'],['Base case','0','0'],['Two numbers','2','3'],['Larger recursion','300','45150'],
  ]),
  task('trees', 'Count all non-null nodes in the binary tree.', treeInput, 'Print the node count.', treeBounds, [
    ['Root and leaves','3\n1 2 3','3'],['Leaf','1\n7','1'],['Empty input','0','0'],['Null root','1\nnull','0'],['Sparse tree','7\n1 2 3 null 4 null 5','5'],
  ]),
  task('bst', 'Insert the distinct input values into a binary search tree in their given order. Determine whether the target exists.', 'Read n and target, then n distinct insertion values.', 'Print true if the target is present; otherwise false.', arrayBounds, [
    ['Found leaf','7 6\n5 3 8 2 4 6 9','true'],['Missing value','4 7\n5 3 8 2','false'],['Empty tree','0 2','false'],['Root matches','3 5\n5 3 8','true'],['Skewed tree','5 5\n1 2 3 4 5','true'],
  ]),
  task('tree-dfs', 'Find the maximum depth of the binary tree. Depth counts nodes along the longest root-to-leaf path.', treeInput, 'Print 0 for an empty tree, 1 for a leaf, and the maximum depth otherwise.', treeBounds, [
    ['Two levels','3\n1 2 3','2'],['Leaf','1\n8','1'],['Empty tree','0','0'],['Long branch','7\n1 2 null 3 null 4 null','4'],['Sparse tree','7\n1 2 3 null 4 null 5','3'],
  ]),
  task('tree-bfs', 'Visit the binary tree level by level, from left to right within each level.', treeInput, 'Print one space-separated line per level, or EMPTY.', treeBounds, [
    ['Two levels','3\n1 2 3','1\n2 3'],['Leaf','1\n8','8'],['Empty tree','0','EMPTY'],['Sparse tree','7\n1 2 3 null 4 null 5','1\n2 3\n4 5'],['Right branch','5\n1 null 2 null 3','1\n2\n3'],
  ]),
  task('traversals', 'Print an inorder traversal: left subtree, current node, right subtree.', treeInput, 'Print the values in inorder, separated by spaces, or EMPTY.', treeBounds, [
    ['Balanced tree','3\n2 1 3','1 2 3'],['Leaf','1\n7','7'],['Empty tree','0','EMPTY'],['Sparse tree','7\n1 2 3 null 4 null 5','2 4 1 3 5'],['Left branch','5\n3 2 null 1 null','1 2 3'],
  ]),
  task('heap', 'Find the kth largest element. Repeated values occupy separate positions in sorted order.', 'Read n and k, then n values.', 'Print the kth largest value.', ['1 ≤ k ≤ n ≤ 1,000', ...arrayBounds.slice(1)], [
    ['Second largest','6 2\n3 2 1 5 6 4','5'],['Count duplicates','5 3\n5 5 4 3 2','4'],['Largest','3 1\n-1 8 2','8'],['Smallest','3 3\n-1 8 2','-1'],['One value','1 1\n-7','-7'],
  ]),
  task('greedy', 'Select the maximum number of non-overlapping meetings for one room. A meeting may start exactly when the previous one ends.', 'Read n, then n start/end pairs.', 'Print the maximum number of meetings.', ['0 ≤ n ≤ 1,000', '0 ≤ start < end ≤ 1,000,000'], [
    ['Mixed intervals','6\n1 2\n3 4\n0 6\n5 7\n8 9\n5 9','4'],['Touching intervals','3\n1 2\n2 3\n3 4','3'],['No meetings','0','0'],['All overlapping','3\n1 5\n2 5\n3 5','1'],['Unsorted meetings','4\n8 10\n1 3\n3 8\n0 20','3'],
  ]),
  task('graphs', 'Build an undirected adjacency list. Output vertices in numeric order and sort each neighbor list in ascending order.', 'Read V and E, then E pairs u v. Vertices are numbered 0 through V−1.', 'For each vertex, print v: followed by its sorted neighbors. An isolated vertex prints only v:.', ['1 ≤ V ≤ 100', '0 ≤ E ≤ 1,000', 'No duplicate edges or self-loops'], [
    ['Triangle','3 3\n0 1\n1 2\n0 2','0: 1 2\n1: 0 2\n2: 0 1'],['Isolated vertex','3 1\n0 1','0: 1\n1: 0\n2:'],['One vertex','1 0','0:'],['No edges','2 0','0:\n1:'],['Unsorted edges','4 3\n0 3\n0 1\n0 2','0: 1 2 3\n1: 0\n2: 0\n3: 0'],
  ]),
  task('graph-traversal', 'Determine whether an undirected graph contains a path from source to target. A vertex is reachable from itself.', 'Read V, E, source and target, then E undirected edge pairs.', 'Print true if a path exists; otherwise false.', ['1 ≤ V ≤ 100', '0 ≤ E ≤ 1,000', 'Vertices are numbered 0 through V−1; no duplicate edges or self-loops'], [
    ['Connected path','4 3 0 3\n0 1\n1 2\n2 3','true'],['Disconnected target','4 2 0 3\n0 1\n1 2','false'],['Same vertex','1 0 0 0','true'],['Cycle','4 3 0 2\n0 1\n1 2\n2 0','true'],['No edges','3 0 0 2','false'],
  ]),
  task('union-find', 'Process an undirected graph and determine whether any edge creates a cycle. Practise disjoint sets with path compression and union by size or rank.', 'Read V and E, then E distinct undirected edge pairs.', 'Print true if a cycle exists; otherwise false.', ['1 ≤ V ≤ 100', '0 ≤ E ≤ 1,000', 'Vertices are numbered 0 through V−1; no self-loops or duplicate edges'], [
    ['Triangle cycle','3 3\n0 1\n1 2\n2 0','true'],['Simple path','3 2\n0 1\n1 2','false'],['No edges','1 0','false'],['Disconnected cycle','5 4\n0 1\n2 3\n3 4\n4 2','true'],['Two components','4 2\n0 1\n2 3','false'],
  ]),
  task('dp', 'Each stair has a cost. Start at index 0 or 1, pay the cost when leaving a stair, and move up one or two stairs. Find the minimum cost to reach just beyond the last stair.', arrayInput, 'Print the minimum total cost.', ['2 ≤ n ≤ 1,000', '0 ≤ each cost ≤ 10,000'], [
    ['Three stairs','3\n10 15 20','15'],['Repeated subproblems','10\n1 100 1 1 1 100 1 1 100 1','6'],['Two stairs','2\n5 2','2'],['Zero costs','4\n0 0 0 0','0'],['Equal costs','5\n7 7 7 7 7','14'],
  ]),
  task('fibonacci', 'Compute F(n), where F(0) = 0, F(1) = 1 and each later value is the sum of the two preceding values.', 'One integer n.', 'Print F(n).', ['0 ≤ n ≤ 40'], [
    ['Sixth value','6','8'],['One','1','1'],['Zero','0','0'],['Two','2','1'],['Upper boundary','40','102334155'],
  ]),
  task('climbing', 'Count the ways to climb n stairs using moves of one or two stairs. There is one way to climb zero stairs: make no moves.', 'One integer n.', 'Print the number of ways using long.', ['0 ≤ n ≤ 50'], [
    ['Three stairs','3','3'],['Two stairs','2','2'],['No stairs','0','1'],['One stair','1','1'],['Long result','50','20365011074'],
  ]),
  task('knapsack', 'Choose each item at most once to maximize total value without exceeding the weight capacity.', 'Read n and capacity W, then n weights, then n values.', 'Print the maximum achievable value.', ['0 ≤ n ≤ 100', '0 ≤ W ≤ 1,000', '1 ≤ weight ≤ 1,000; 0 ≤ value ≤ 10,000'], [
    ['Choose two items','3 4\n1 3 4\n15 20 30','35'],['No item fits','2 1\n2 3\n4 5','0'],['Zero capacity','2 0\n1 2\n7 8','0'],['No items','0 10','0'],['Do not reuse items','1 6\n3\n10','10'],['Take every item','3 10\n1 2 3\n4 5 6','15'],
  ]),
  task('subset', 'Determine whether a subset of the nonnegative input values sums to the target. Each element may be used at most once. The empty subset sums to zero.', 'Read n and target, then n values.', 'Print true if a suitable subset exists; otherwise false.', ['0 ≤ n ≤ 100', '0 ≤ target ≤ 1,000', '0 ≤ each value ≤ 1,000'], [
    ['Reachable','3 9\n3 7 2','true'],['Unreachable','3 8\n3 7 2','false'],['Empty subset','0 0','true'],['Empty nonzero target','0 1','false'],['Cannot reuse a value','1 6\n3','false'],['Zero elements','4 2\n0 0 2 5','true'],
  ]),
  task('lis', 'Find the length of the longest strictly increasing subsequence. A subsequence preserves order and can skip elements.', arrayInput, 'Print the maximum length, or 0 for an empty array.', arrayBounds, [
    ['Mixed sequence','6\n10 9 2 5 3 7','3'],['Descending','4\n4 3 2 1','1'],['Empty','0','0'],['Equal values','4\n2 2 2 2','1'],['Increasing','5\n1 2 3 4 5','5'],['Signed values','5\n-3 -1 -2 0 2','4'],
  ]),
  task('grid-dp', 'Count paths from the top-left to bottom-right cell of a rows-by-columns grid. Only right and down moves are allowed.', 'Read rows and columns.', 'Print the number of distinct paths using long.', ['1 ≤ rows, columns ≤ 18', 'There are no blocked cells'], [
    ['Rectangle','3 2','3'],['Square','3 3','6'],['One cell','1 1','1'],['One row','1 18','1'],['One column','18 1','1'],['Largest grid','18 18','2333606220'],
  ]),
];

export const codingTasks: Record<string, CodingTask> = Object.fromEntries(definitions.map(t => [t.id, t]));
codingTasks.variables.starter = starter.replace('// Read the input described in the problem.', 'String name = input.nextLine();\n        int age = input.nextInt();\n        double hours = input.nextDouble();\n        boolean eligible = input.nextBoolean();');

export function compareOutput(actual: string, expected: string, comparison: CodingTask['comparison']): boolean {
  const tokens = (text: string) => text.trim() ? text.trim().split(/\s+/) : [];
  const a = tokens(actual), b = tokens(expected);
  if (a.length !== b.length) return false;
  return a.every((value, i) => {
    if (comparison === 'tokens') return value === b[i];
    const numberPattern = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
    if (!numberPattern.test(value) || !numberPattern.test(b[i])) return value === b[i];
    const x = Number(value), y = Number(b[i]);
    return Number.isFinite(x) && Number.isFinite(y) && Math.abs(x - y) <= 0.000001;
  });
}
