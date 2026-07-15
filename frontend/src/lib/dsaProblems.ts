export interface DSAProblem {
  id: string;
  name: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  leetcodeUrl: string;
  companies: string[];
}

export interface DSATopic {
  id: string;
  name: string;
  problems: DSAProblem[];
}

export const DSA_TOPICS: DSATopic[] = [
  {
    id: "arrays",
    name: "Arrays",
    problems: [
      { id: "arr-1", name: "Two Sum", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/two-sum/", companies: ["Google", "Amazon", "Meta", "Apple", "Microsoft"] },
      { id: "arr-2", name: "Best Time to Buy and Sell Stock", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/", companies: ["Amazon", "Goldman Sachs", "Meta", "Microsoft"] },
      { id: "arr-3", name: "Contains Duplicate", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/contains-duplicate/", companies: ["Apple", "Meta", "Bloomberg"] },
      { id: "arr-4", name: "Majority Element", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/majority-element/", companies: ["Google", "Amazon", "Microsoft"] },
      { id: "arr-5", name: "Move Zeroes", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/move-zeroes/", companies: ["Apple", "Meta", "Bloomberg"] },
      { id: "arr-6", name: "Product of Array Except Self", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/product-of-array-except-self/", companies: ["Amazon", "Microsoft", "Apple", "Meta"] },
      { id: "arr-7", name: "Maximum Subarray", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/maximum-subarray/", companies: ["Amazon", "Microsoft", "LinkedIn", "Apple"] },
      { id: "arr-8", name: "Maximum Product Subarray", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/maximum-product-subarray/", companies: ["Amazon", "Google", "Microsoft", "LinkedIn"] },
      { id: "arr-9", name: "3Sum", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/3sum/", companies: ["Meta", "Amazon", "Google", "Bloomberg"] },
      { id: "arr-10", name: "Container With Most Water", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/container-with-most-water/", companies: ["Amazon", "Google", "Goldman Sachs", "Meta"] },
      { id: "arr-11", name: "Find Minimum in Rotated Sorted Array", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/", companies: ["Amazon", "Google", "Microsoft"] },
      { id: "arr-12", name: "Search in Rotated Sorted Array", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/search-in-rotated-sorted-array/", companies: ["Meta", "Amazon", "Microsoft", "Google"] },
      { id: "arr-13", name: "Rotate Array", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/rotate-array/", companies: ["Microsoft", "Amazon", "Google"] },
      { id: "arr-14", name: "Merge Intervals", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/merge-intervals/", companies: ["Google", "Microsoft", "Amazon", "Apple"] },
      { id: "arr-15", name: "Next Permutation", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/next-permutation/", companies: ["Google", "Meta", "Amazon"] },
      { id: "arr-16", name: "Find the Duplicate Number", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/find-the-duplicate-number/", companies: ["Google", "Amazon"] },
      { id: "arr-17", name: "Trapping Rain Water", difficulty: "HARD", leetcodeUrl: "https://leetcode.com/problems/trapping-rain-water/", companies: ["Amazon", "Google", "Microsoft", "Goldman Sachs"] },
      { id: "arr-18", name: "First Missing Positive", difficulty: "HARD", leetcodeUrl: "https://leetcode.com/problems/first-missing-positive/", companies: ["Google", "Amazon", "Meta"] }
    ]
  },
  {
    id: "strings",
    name: "Strings",
    problems: [
      { id: "str-1", name: "Valid Anagram", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/valid-anagram/", companies: ["Amazon", "Google", "Meta"] },
      { id: "str-2", name: "Valid Palindrome", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/valid-palindrome/", companies: ["Meta", "Amazon", "Microsoft"] },
      { id: "str-3", name: "Valid Parentheses", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/valid-parentheses/", companies: ["Amazon", "Meta", "Google", "Bloomberg"] },
      { id: "str-4", name: "Roman to Integer", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/roman-to-integer/", companies: ["Google", "Apple", "Amazon"] },
      { id: "str-5", name: "Longest Common Prefix", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/longest-common-prefix/", companies: ["Google", "Apple", "Amazon"] },
      { id: "str-6", name: "Longest Substring Without Repeating Characters", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/longest-substring-without-repeating-characters/", companies: ["Amazon", "Meta", "Google", "Bloomberg", "Microsoft"] },
      { id: "str-7", name: "Longest Palindromic Substring", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/longest-palindromic-substring/", companies: ["Amazon", "Google", "Microsoft", "Meta"] },
      { id: "str-8", name: "Palindromic Substrings", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/palindromic-substrings/", companies: ["Google", "Meta", "Amazon"] },
      { id: "str-9", name: "Group Anagrams", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/group-anagrams/", companies: ["Amazon", "Meta", "Google", "Microsoft"] },
      { id: "str-10", name: "Longest Repeating Character Replacement", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/longest-repeating-character-replacement/", companies: ["Google", "Amazon", "Microsoft"] },
      { id: "str-11", name: "String to Integer (atoi)", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/string-to-integer-atoi/", companies: ["Google", "Amazon", "Microsoft"] },
      { id: "str-12", name: "Zigzag Conversion", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/zigzag-conversion/", companies: ["Google", "Amazon"] },
      { id: "str-13", name: "Word Break", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/word-break/", companies: ["Google", "Amazon", "Meta"] },
      { id: "str-14", name: "Encode and Decode Strings", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/encode-and-decode-strings/", companies: ["Google", "Meta", "Amazon"] },
      { id: "str-15", name: "Reverse Words in a String", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/reverse-words-in-a-string/", companies: ["Microsoft", "Google", "Amazon"] },
      { id: "str-16", name: "Minimum Window Substring", difficulty: "HARD", leetcodeUrl: "https://leetcode.com/problems/minimum-window-substring/", companies: ["Meta", "Amazon", "Google", "Uber"] },
      { id: "str-17", name: "Text Justification", difficulty: "HARD", leetcodeUrl: "https://leetcode.com/problems/text-justification/", companies: ["Google", "Apple", "Amazon"] },
      { id: "str-18", name: "Edit Distance", difficulty: "HARD", leetcodeUrl: "https://leetcode.com/problems/edit-distance/", companies: ["Google", "Amazon", "Microsoft"] }
    ]
  },
  {
    id: "linked-lists",
    name: "Linked Lists",
    problems: [
      { id: "ll-1", name: "Reverse Linked List", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/reverse-linked-list/", companies: ["Apple", "Google", "Meta", "Microsoft"] },
      { id: "ll-2", name: "Merge Two Sorted Lists", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/merge-two-sorted-lists/", companies: ["Amazon", "Microsoft", "Apple", "Google"] },
      { id: "ll-3", name: "Linked List Cycle", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/linked-list-cycle/", companies: ["Amazon", "Microsoft", "Apple"] },
      { id: "ll-4", name: "Palindrome Linked List", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/palindrome-linked-list/", companies: ["Amazon", "Microsoft", "Apple"] },
      { id: "ll-5", name: "Intersection of Two Linked Lists", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/intersection-of-two-linked-lists/", companies: ["Amazon", "Microsoft", "Apple"] },
      { id: "ll-6", name: "Remove Duplicates from Sorted List", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/remove-duplicates-from-sorted-list/", companies: ["Google", "Amazon"] },
      { id: "ll-7", name: "Add Two Numbers", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/add-two-numbers/", companies: ["Amazon", "Google", "Meta", "Microsoft"] },
      { id: "ll-8", name: "Remove Nth Node From End of List", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/remove-nth-node-from-end-of-list/", companies: ["Google", "Meta", "Amazon"] },
      { id: "ll-9", name: "Reorder List", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/reorder-list/", companies: ["Microsoft", "Amazon", "Google"] },
      { id: "ll-10", name: "Swap Nodes in Pairs", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/swap-nodes-in-pairs/", companies: ["Microsoft", "Apple", "Google"] },
      { id: "ll-11", name: "Copy List with Random Pointer", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/copy-list-with-random-pointer/", companies: ["Google", "Amazon", "Microsoft"] },
      { id: "ll-12", name: "Rotate List", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/rotate-list/", companies: ["Microsoft", "Google", "Amazon"] },
      { id: "ll-13", name: "Odd Even Linked List", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/odd-even-linked-list/", companies: ["Microsoft", "Amazon", "Apple"] },
      { id: "ll-14", name: "Design Linked List", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/design-linked-list/", companies: ["Google", "Amazon"] },
      { id: "ll-15", name: "LRU Cache", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/lru-cache/", companies: ["Google", "Meta", "Amazon", "Microsoft"] },
      { id: "ll-16", name: "Flatten a Multilevel Doubly Linked List", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/flatten-a-multilevel-doubly-linked-list/", companies: ["Google", "Microsoft", "Amazon"] },
      { id: "ll-17", name: "Merge k Sorted Lists", difficulty: "HARD", leetcodeUrl: "https://leetcode.com/problems/merge-k-sorted-lists/", companies: ["Amazon", "Google", "Meta", "Microsoft"] },
      { id: "ll-18", name: "Reverse Nodes in k-Group", difficulty: "HARD", leetcodeUrl: "https://leetcode.com/problems/reverse-nodes-in-k-group/", companies: ["Google", "Amazon", "Microsoft"] }
    ]
  },
  {
    id: "stacks",
    name: "Stacks",
    problems: [
      { id: "st-1", name: "Valid Parentheses", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/valid-parentheses/", companies: ["Amazon", "Meta", "Google"] },
      { id: "st-2", name: "Min Stack", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/min-stack/", companies: ["Google", "Amazon", "Microsoft"] },
      { id: "st-3", name: "Implement Queue using Stacks", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/implement-queue-using-stacks/", companies: ["Google", "Amazon"] },
      { id: "st-4", name: "Baseball Game", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/baseball-game/", companies: ["Amazon", "Apple"] },
      { id: "st-5", name: "Next Greater Element I", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/next-greater-element-i/", companies: ["Google", "Amazon"] },
      { id: "st-6", name: "Evaluate Reverse Polish Notation", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/evaluate-reverse-polish-notation/", companies: ["Google", "Amazon"] },
      { id: "st-7", name: "Generate Parentheses", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/generate-parentheses/", companies: ["Google", "Amazon", "Meta"] },
      { id: "st-8", name: "Daily Temperatures", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/daily-temperatures/", companies: ["Google", "Amazon", "Meta"] },
      { id: "st-9", name: "Car Fleet", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/car-fleet/", companies: ["Google", "Amazon"] },
      { id: "st-10", name: "Decode String", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/decode-string/", companies: ["Google", "Amazon"] },
      { id: "st-11", name: "Asteroid Collision", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/asteroid-collision/", companies: ["Google", "Amazon"] },
      { id: "st-12", name: "Simplify Path", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/simplify-path/", companies: ["Meta", "Microsoft", "Google"] },
      { id: "st-13", name: "Remove Duplicate Letters", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/remove-duplicate-letters/", companies: ["Google", "Amazon"] },
      { id: "st-14", name: "Online Stock Span", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/online-stock-span/", companies: ["Google", "Amazon"] },
      { id: "st-15", name: "Design a Stack With Increment Operation", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/design-a-stack-with-increment-operation/", companies: ["Google", "Amazon"] },
      { id: "st-16", name: "Largest Rectangle in Histogram", difficulty: "HARD", leetcodeUrl: "https://leetcode.com/problems/largest-rectangle-in-histogram/", companies: ["Google", "Amazon", "Microsoft"] },
      { id: "st-17", name: "Basic Calculator", difficulty: "HARD", leetcodeUrl: "https://leetcode.com/problems/basic-calculator/", companies: ["Google", "Microsoft", "Meta"] },
      { id: "st-18", name: "Trapping Rain Water", difficulty: "HARD", leetcodeUrl: "https://leetcode.com/problems/trapping-rain-water/", companies: ["Amazon", "Google"] }
    ]
  },
  {
    id: "queues",
    name: "Queues",
    problems: [
      { id: "q-1", name: "Implement Queue using Stacks", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/implement-queue-using-stacks/", companies: ["Google", "Amazon"] },
      { id: "q-2", name: "Number of Recent Calls", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/number-of-recent-calls/", companies: ["Google", "Amazon"] },
      { id: "q-3", name: "Design Circular Queue", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/design-circular-queue/", companies: ["Google", "Amazon"] },
      { id: "q-4", name: "Moving Average from Data Stream", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/moving-average-from-data-stream/", companies: ["Google", "Amazon"] },
      { id: "q-5", name: "Binary Tree Level Order Traversal", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/binary-tree-level-order-traversal/", companies: ["Google", "Amazon", "Microsoft"] },
      { id: "q-6", name: "Rotting Oranges", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/rotting-oranges/", companies: ["Google", "Amazon", "Meta"] },
      { id: "q-7", name: "Walls and Gates", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/walls-and-gates/", companies: ["Google", "Amazon"] },
      { id: "q-8", name: "Open the Lock", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/open-the-lock/", companies: ["Google", "Amazon"] },
      { id: "q-9", name: "Perfect Squares", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/perfect-squares/", companies: ["Google", "Amazon"] },
      { id: "q-10", name: "Design Hit Counter", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/design-hit-counter/", companies: ["Google", "Amazon"] },
      { id: "q-11", name: "Task Scheduler", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/task-scheduler/", companies: ["Google", "Amazon", "Meta"] },
      { id: "q-12", name: "Dota2 Senate", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/dota2-senate/", companies: ["Google", "Amazon"] },
      { id: "q-13", name: "Design Circular Deque", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/design-circular-deque/", companies: ["Google", "Amazon"] },
      { id: "q-14", name: "01 Matrix", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/01-matrix/", companies: ["Google", "Amazon"] },
      { id: "q-15", name: "Sliding Window Maximum", difficulty: "HARD", leetcodeUrl: "https://leetcode.com/problems/sliding-window-maximum/", companies: ["Google", "Amazon", "Microsoft"] },
      { id: "q-16", name: "Shortest Path in a Grid with Obstacles Elimination", difficulty: "HARD", leetcodeUrl: "https://leetcode.com/problems/shortest-path-in-a-grid-with-obstacles-elimination/", companies: ["Google", "Amazon"] }
    ]
  },
  {
    id: "hash-tables",
    name: "Hash Tables / Maps",
    problems: [
      { id: "ht-1", name: "Two Sum", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/two-sum/", companies: ["Google", "Amazon", "Meta"] },
      { id: "ht-2", name: "Contains Duplicate", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/contains-duplicate/", companies: ["Apple", "Meta"] },
      { id: "ht-3", name: "Valid Anagram", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/valid-anagram/", companies: ["Amazon", "Google"] },
      { id: "ht-4", name: "Ransom Note", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/ransom-note/", companies: ["Google", "Amazon"] },
      { id: "ht-5", name: "Jewels and Stones", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/jewels-and-stones/", companies: ["Google", "Amazon"] },
      { id: "ht-6", name: "First Unique Character in a String", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/first-unique-character-in-a-string/", companies: ["Google", "Amazon"] },
      { id: "ht-7", name: "Design HashMap", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/design-hashmap/", companies: ["Google", "Amazon"] },
      { id: "ht-8", name: "Group Anagrams", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/group-anagrams/", companies: ["Amazon", "Meta", "Google"] },
      { id: "ht-9", name: "Top K Frequent Elements", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/top-k-frequent-elements/", companies: ["Google", "Amazon"] },
      { id: "ht-10", name: "Longest Consecutive Sequence", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/longest-consecutive-sequence/", companies: ["Google", "Amazon"] },
      { id: "ht-11", name: "Subarray Sum Equals K", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/subarray-sum-equals-k/", companies: ["Meta", "Google"] },
      { id: "ht-12", name: "Insert Delete GetRandom O(1)", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/insert-delete-getrandom-o1/", companies: ["Google", "Amazon"] },
      { id: "ht-13", name: "Copy List with Random Pointer", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/copy-list-with-random-pointer/", companies: ["Google", "Amazon"] },
      { id: "ht-14", name: "LRU Cache", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/lru-cache/", companies: ["Google", "Meta", "Amazon"] },
      { id: "ht-15", name: "4Sum II", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/4sum-ii/", companies: ["Google", "Amazon"] },
      { id: "ht-16", name: "Encode and Decode Strings", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/encode-and-decode-strings/", companies: ["Google", "Meta"] },
      { id: "ht-17", name: "LFU Cache", difficulty: "HARD", leetcodeUrl: "https://leetcode.com/problems/lfu-cache/", companies: ["Google", "Amazon"] },
      { id: "ht-18", name: "Substring with Concatenation of All Words", difficulty: "HARD", leetcodeUrl: "https://leetcode.com/problems/substring-with-concatenation-of-all-words/", companies: ["Google", "Amazon"] }
    ]
  },
  {
    id: "trees",
    name: "Trees (Binary Trees / BST)",
    problems: [
      { id: "tr-1", name: "Invert Binary Tree", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/invert-binary-tree/", companies: ["Google", "Amazon"] },
      { id: "tr-2", name: "Maximum Depth of Binary Tree", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/maximum-depth-of-binary-tree/", companies: ["Google", "Amazon"] },
      { id: "tr-3", name: "Same Tree", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/same-tree/", companies: ["Google", "Amazon"] },
      { id: "tr-4", name: "Symmetric Tree", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/symmetric-tree/", companies: ["Google", "Amazon"] },
      { id: "tr-5", name: "Path Sum", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/path-sum/", companies: ["Google", "Amazon"] },
      { id: "tr-6", name: "Diameter of Binary Tree", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/diameter-of-binary-tree/", companies: ["Google", "Amazon"] },
      { id: "tr-7", name: "Balanced Binary Tree", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/balanced-binary-tree/", companies: ["Google", "Amazon"] },
      { id: "tr-8", name: "Binary Tree Level Order Traversal", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/binary-tree-level-order-traversal/", companies: ["Google", "Amazon"] },
      { id: "tr-9", name: "Validate Binary Search Tree", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/validate-binary-search-tree/", companies: ["Google", "Amazon"] },
      { id: "tr-10", name: "Kth Smallest Element in a BST", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/kth-smallest-element-in-a-bst/", companies: ["Google", "Amazon"] },
      { id: "tr-11", name: "Construct Binary Tree from Preorder and Inorder Traversal", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/", companies: ["Google", "Amazon"] },
      { id: "tr-12", name: "Lowest Common Ancestor of a Binary Search Tree", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/", companies: ["Google", "Amazon"] },
      { id: "tr-13", name: "Lowest Common Ancestor of a Binary Tree", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/", companies: ["Google", "Amazon"] },
      { id: "tr-14", name: "Binary Tree Right Side View", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/binary-tree-right-side-view/", companies: ["Google", "Amazon"] },
      { id: "tr-15", name: "Count Good Nodes in Binary Tree", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/count-good-nodes-in-binary-tree/", companies: ["Google", "Amazon"] },
      { id: "tr-16", name: "Delete Node in a BST", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/delete-node-in-a-bst/", companies: ["Google", "Amazon"] },
      { id: "tr-17", name: "Binary Tree Maximum Path Sum", difficulty: "HARD", leetcodeUrl: "https://leetcode.com/problems/binary-tree-maximum-path-sum/", companies: ["Google", "Amazon"] },
      { id: "tr-18", name: "Serialize and Deserialize Binary Tree", difficulty: "HARD", leetcodeUrl: "https://leetcode.com/problems/serialize-and-deserialize-binary-tree/", companies: ["Google", "Amazon"] }
    ]
  },
  {
    id: "graphs",
    name: "Graphs",
    problems: [
      { id: "gr-1", name: "Find Center of Star Graph", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/find-center-of-star-graph/", companies: ["Google", "Amazon"] },
      { id: "gr-2", name: "Flood Fill", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/flood-fill/", companies: ["Google", "Amazon"] },
      { id: "gr-3", name: "Number of Islands", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/number-of-islands/", companies: ["Google", "Amazon", "Meta"] },
      { id: "gr-4", name: "Clone Graph", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/clone-graph/", companies: ["Google", "Amazon"] },
      { id: "gr-5", name: "Course Schedule", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/course-schedule/", companies: ["Google", "Amazon"] },
      { id: "gr-6", name: "Course Schedule II", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/course-schedule-ii/", companies: ["Google", "Amazon"] },
      { id: "gr-7", name: "Pacific Atlantic Water Flow", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/pacific-atlantic-water-flow/", companies: ["Google", "Amazon"] },
      { id: "gr-8", name: "Rotting Oranges", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/rotting-oranges/", companies: ["Google", "Amazon", "Meta"] },
      { id: "gr-9", name: "Graph Valid Tree", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/graph-valid-tree/", companies: ["Google", "Amazon"] },
      { id: "gr-10", name: "Number of Connected Components in an Undirected Graph", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/", companies: ["Google", "Amazon"] },
      { id: "gr-11", name: "Redundant Connection", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/redundant-connection/", companies: ["Google", "Amazon"] },
      { id: "gr-12", name: "Surrounded Regions", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/surrounded-regions/", companies: ["Google", "Amazon"] },
      { id: "gr-13", name: "Word Ladder", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/word-ladder/", companies: ["Google", "Amazon"] },
      { id: "gr-14", name: "Network Delay Time", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/network-delay-time/", companies: ["Google", "Amazon"] },
      { id: "gr-15", name: "Evaluate Division", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/evaluate-division/", companies: ["Google", "Amazon"] },
      { id: "gr-16", name: "Alien Dictionary", difficulty: "HARD", leetcodeUrl: "https://leetcode.com/problems/alien-dictionary/", companies: ["Google", "Amazon"] },
      { id: "gr-17", name: "Reconstruct Itinerary", difficulty: "HARD", leetcodeUrl: "https://leetcode.com/problems/reconstruct-itinerary/", companies: ["Google", "Amazon"] },
      { id: "gr-18", name: "Swim in Rising Water", difficulty: "HARD", leetcodeUrl: "https://leetcode.com/problems/swim-in-rising-water/", companies: ["Google", "Amazon"] }
    ]
  },
  {
    id: "heaps",
    name: "Heaps (Priority Queues)",
    problems: [
      { id: "hp-1", name: "Kth Largest Element in a Stream", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/kth-largest-element-in-a-stream/", companies: ["Google", "Amazon"] },
      { id: "hp-2", name: "Last Stone Weight", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/last-stone-weight/", companies: ["Google", "Amazon"] },
      { id: "hp-3", name: "Kth Largest Element in an Array", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/kth-largest-element-in-an-array/", companies: ["Google", "Amazon"] },
      { id: "hp-4", name: "Top K Frequent Elements", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/top-k-frequent-elements/", companies: ["Google", "Amazon"] },
      { id: "hp-5", name: "K Closest Points to Origin", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/k-closest-points-to-origin/", companies: ["Google", "Amazon"] },
      { id: "hp-6", name: "Task Scheduler", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/task-scheduler/", companies: ["Google", "Amazon"] },
      { id: "hp-7", name: "Design Twitter", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/design-twitter/", companies: ["Google", "Amazon"] },
      { id: "hp-8", name: "Reorganize String", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/reorganize-string/", companies: ["Google", "Amazon"] },
      { id: "hp-9", name: "Furthest Building You Can Reach", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/furthest-building-you-can-reach/", companies: ["Google", "Amazon"] },
      { id: "hp-10", name: "Single-Threaded CPU", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/single-threaded-cpu/", companies: ["Google", "Amazon"] },
      { id: "hp-11", name: "Meeting Rooms II", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/meeting-rooms-ii/", companies: ["Google", "Amazon"] },
      { id: "hp-12", name: "Ugly Number II", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/ugly-number-ii/", companies: ["Google", "Amazon"] },
      { id: "hp-13", name: "Find Median from Data Stream", difficulty: "HARD", leetcodeUrl: "https://leetcode.com/problems/find-median-from-data-stream/", companies: ["Google", "Amazon"] },
      { id: "hp-14", name: "Merge k Sorted Lists", difficulty: "HARD", leetcodeUrl: "https://leetcode.com/problems/merge-k-sorted-lists/", companies: ["Google", "Amazon"] },
      { id: "hp-15", name: "IPO", difficulty: "HARD", leetcodeUrl: "https://leetcode.com/problems/ipo/", companies: ["Google", "Amazon"] },
      { id: "hp-16", name: "Trapping Rain Water II", difficulty: "HARD", leetcodeUrl: "https://leetcode.com/problems/trapping-rain-water-ii/", companies: ["Google", "Amazon"] }
    ]
  },
  {
    id: "dp",
    name: "Dynamic Programming (DP)",
    problems: [
      { id: "dp-1", name: "Climbing Stairs", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/climbing-stairs/", companies: ["Google", "Amazon"] },
      { id: "dp-2", name: "House Robber", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/house-robber/", companies: ["Google", "Amazon"] },
      { id: "dp-3", name: "Min Cost Climbing Stairs", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/min-cost-climbing-stairs/", companies: ["Google", "Amazon"] },
      { id: "dp-4", name: "Fibonacci Number", difficulty: "EASY", leetcodeUrl: "https://leetcode.com/problems/fibonacci-number/", companies: ["Google", "Amazon"] },
      { id: "dp-5", name: "House Robber II", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/house-robber-ii/", companies: ["Google", "Amazon"] },
      { id: "dp-6", name: "Longest Increasing Subsequence", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/longest-increasing-subsequence/", companies: ["Google", "Amazon"] },
      { id: "dp-7", name: "Coin Change", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/coin-change/", companies: ["Google", "Amazon"] },
      { id: "dp-8", name: "Maximum Subarray", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/maximum-subarray/", companies: ["Google", "Amazon"] },
      { id: "dp-9", name: "Word Break", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/word-break/", companies: ["Google", "Amazon"] },
      { id: "dp-10", name: "Combination Sum IV", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/combination-sum-iv/", companies: ["Google", "Amazon"] },
      { id: "dp-11", name: "Decode Ways", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/decode-ways/", companies: ["Google", "Amazon"] },
      { id: "dp-12", name: "Unique Paths", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/unique-paths/", companies: ["Google", "Amazon"] },
      { id: "dp-13", name: "Longest Common Subsequence", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/longest-common-subsequence/", companies: ["Google", "Amazon"] },
      { id: "dp-14", name: "Partition Equal Subset Sum", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/partition-equal-subset-sum/", companies: ["Google", "Amazon"] },
      { id: "dp-15", name: "Target Sum", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/target-sum/", companies: ["Google", "Amazon"] },
      { id: "dp-16", name: "Palindromic Substrings", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/palindromic-substrings/", companies: ["Google", "Amazon"] },
      { id: "dp-17", name: "Longest Palindromic Substring", difficulty: "MEDIUM", leetcodeUrl: "https://leetcode.com/problems/longest-palindromic-substring/", companies: ["Google", "Amazon"] },
      { id: "dp-18", name: "Edit Distance", difficulty: "HARD", leetcodeUrl: "https://leetcode.com/problems/edit-distance/", companies: ["Google", "Amazon"] },
      { id: "dp-19", name: "Regular Expression Matching", difficulty: "HARD", leetcodeUrl: "https://leetcode.com/problems/regular-expression-matching/", companies: ["Google", "Amazon"] },
      { id: "dp-20", name: "Burst Balloons", difficulty: "HARD", leetcodeUrl: "https://leetcode.com/problems/burst-balloons/", companies: ["Google", "Amazon"] }
    ]
  }
];

export function getLeetcodeUrl(problemName: string): string {
  const nameLower = problemName.toLowerCase().trim();
  for (const topic of DSA_TOPICS) {
    for (const prob of topic.problems) {
      if (prob.name.toLowerCase().trim() === nameLower) {
        return prob.leetcodeUrl;
      }
    }
  }
  // Fallback slug format
  const slug = nameLower
    .replace(/[^a-z0-9\s-]/g, "") // remove special chars
    .replace(/\s+/g, "-")         // spaces to hyphens
    .replace(/-+/g, "-");         // collapse duplicate hyphens
  return `https://leetcode.com/problems/${slug}/`;
}

