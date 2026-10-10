# Curated Grind 75 Problem List (from Tech Interview Handbook: https://www.techinterviewhandbook.org/grind75/)

GRIND_75_PROBLEMS = [
    {
        "title": "Two Sum",
        "slug": "two-sum",
        "difficulty": "Easy",
        "topic": "Array / Hash Table",
        "url": "https://leetcode.com/problems/two-sum/",
        "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
        "examples": "Input: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExplanation: Because nums[0] + nums[1] == 9, we return [0, 1].",
        "constraints": "• 2 <= nums.length <= 10^4\n• -10^9 <= nums[i] <= 10^9\n• -10^9 <= target <= 10^9\n• Only one valid answer exists."
    },
    {
        "title": "Valid Parentheses",
        "slug": "valid-parentheses",
        "difficulty": "Easy",
        "topic": "Stack / String",
        "url": "https://leetcode.com/problems/valid-parentheses/",
        "description": "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\nAn input string is valid if open brackets are closed by the same type of brackets and in the correct order.",
        "examples": "Input: s = \"()[]{}\"\nOutput: true\n\nInput: s = \"(]\"\nOutput: false",
        "constraints": "• 1 <= s.length <= 10^4\n• s consists of parentheses only '()[]{}'."
    },
    {
        "title": "Merge Two Sorted Lists",
        "slug": "merge-two-sorted-lists",
        "difficulty": "Easy",
        "topic": "Linked List",
        "url": "https://leetcode.com/problems/merge-two-sorted-lists/",
        "description": "You are given the heads of two sorted linked lists list1 and list2. Merge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists. Return the head of the merged linked list.",
        "examples": "Input: list1 = [1,2,4], list2 = [1,3,4]\nOutput: [1,1,2,3,4,4]",
        "constraints": "• Number of nodes in both lists is in range [0, 50].\n• -100 <= Node.val <= 100\n• Both list1 and list2 are sorted in non-decreasing order."
    },
    {
        "title": "Best Time to Buy and Sell Stock",
        "slug": "best-time-to-buy-and-sell-stock",
        "difficulty": "Easy",
        "topic": "Array / Dynamic Programming",
        "url": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
        "description": "You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock. Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.",
        "examples": "Input: prices = [7,1,5,3,6,4]\nOutput: 5\nExplanation: Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.",
        "constraints": "• 1 <= prices.length <= 10^5\n• 0 <= prices[i] <= 10^4"
    },
    {
        "title": "Valid Palindrome",
        "slug": "valid-palindrome",
        "difficulty": "Easy",
        "topic": "Two Pointers / String",
        "url": "https://leetcode.com/problems/valid-palindrome/",
        "description": "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Given a string s, return true if it is a palindrome, or false otherwise.",
        "examples": "Input: s = \"A man, a plan, a canal: Panama\"\nOutput: true\nExplanation: \"amanaplanacanalpanama\" is a palindrome.",
        "constraints": "• 1 <= s.length <= 2 * 10^5\n• s consists only of printable ASCII characters."
    },
    {
        "title": "Invert Binary Tree",
        "slug": "invert-binary-tree",
        "difficulty": "Easy",
        "topic": "Binary Tree / DFS",
        "url": "https://leetcode.com/problems/invert-binary-tree/",
        "description": "Given the root of a binary tree, invert the tree, and return its root.",
        "examples": "Input: root = [4,2,7,1,3,6,9]\nOutput: [4,7,2,9,6,3,1]",
        "constraints": "• The number of nodes in the tree is in the range [0, 100].\n• -100 <= Node.val <= 100"
    },
    {
        "title": "Valid Anagram",
        "slug": "valid-anagram",
        "difficulty": "Easy",
        "topic": "Hash Table / String",
        "url": "https://leetcode.com/problems/valid-anagram/",
        "description": "Given two strings s and t, return true if t is an anagram of s, and false otherwise. An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.",
        "examples": "Input: s = \"anagram\", t = \"nagaram\"\nOutput: true\n\nInput: s = \"rat\", t = \"car\"\nOutput: false",
        "constraints": "• 1 <= s.length, t.length <= 5 * 10^4\n• s and t consist of lowercase English letters."
    },
    {
        "title": "Binary Search",
        "slug": "binary-search",
        "difficulty": "Easy",
        "topic": "Binary Search / Array",
        "url": "https://leetcode.com/problems/binary-search/",
        "description": "Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1. You must write an algorithm with O(log n) runtime complexity.",
        "examples": "Input: nums = [-1,0,3,5,9,12], target = 9\nOutput: 4\nExplanation: 9 exists in nums and its index is 4",
        "constraints": "• 1 <= nums.length <= 10^4\n• -10^4 < nums[i], target < 10^4\n• All the integers in nums are unique.\n• nums is sorted in ascending order."
    },
    {
        "title": "Flood Fill",
        "slug": "flood-fill",
        "difficulty": "Easy",
        "topic": "Graph / BFS / DFS",
        "url": "https://leetcode.com/problems/flood-fill/",
        "description": "An image is represented by an m x n integer grid image where image[i][j] represents the pixel value. You are given sr, sc, and color. Perform a flood fill on the image starting from the pixel image[sr][sc]. Return the modified image.",
        "examples": "Input: image = [[1,1,1],[1,1,0],[1,0,1]], sr = 1, sc = 1, color = 2\nOutput: [[2,2,2],[2,2,0],[2,0,1]]",
        "constraints": "• m == image.length, n == image[i].length\n• 1 <= m, n <= 50\n• 0 <= image[i][j], color < 2^16"
    },
    {
        "title": "Lowest Common Ancestor of a BST",
        "slug": "lowest-common-ancestor-of-a-binary-search-tree",
        "difficulty": "Easy",
        "topic": "Binary Search Tree",
        "url": "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/",
        "description": "Given a binary search tree (BST), find the lowest common ancestor (LCA) node of two given nodes in the BST.",
        "examples": "Input: root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 8\nOutput: 6\nExplanation: The LCA of nodes 2 and 8 is 6.",
        "constraints": "• The number of nodes in the tree is in the range [2, 10^5].\n• All Node.val are unique.\n• p != q and both exist in the BST."
    },
    {
        "title": "Maximum Subarray",
        "slug": "maximum-subarray",
        "difficulty": "Medium",
        "topic": "Array / Dynamic Programming",
        "url": "https://leetcode.com/problems/maximum-subarray/",
        "description": "Given an integer array nums, find the subarray with the largest sum, and return its sum.",
        "examples": "Input: nums = [-2,1,-3,4,-1,2,1,-5,4]\nOutput: 6\nExplanation: The subarray [4,-1,2,1] has the largest sum 6.",
        "constraints": "• 1 <= nums.length <= 10^5\n• -10^4 <= nums[i] <= 10^4"
    },
    {
        "title": "Insert Interval",
        "slug": "insert-interval",
        "difficulty": "Medium",
        "topic": "Array",
        "url": "https://leetcode.com/problems/insert-interval/",
        "description": "You are given an array of non-overlapping intervals intervals where intervals[i] = [starti, endi] sorted in ascending order by starti. You are also given an interval newInterval = [start, end]. Insert newInterval into intervals such that intervals is still sorted and non-overlapping.",
        "examples": "Input: intervals = [[1,3],[6,9]], newInterval = [2,5]\nOutput: [[1,5],[6,9]]",
        "constraints": "• 0 <= intervals.length <= 10^4\n• intervals[i].length == 2\n• 0 <= starti <= endi <= 10^5"
    },
    {
        "title": "01 Matrix",
        "slug": "01-matrix",
        "difficulty": "Medium",
        "topic": "Graph / BFS",
        "url": "https://leetcode.com/problems/01-matrix/",
        "description": "Given an m x n binary matrix mat, return the distance of the nearest 0 for each cell. The distance between two adjacent cells is 1.",
        "examples": "Input: mat = [[0,0,0],[0,1,0],[0,0,0]]\nOutput: [[0,0,0],[0,1,0],[0,0,0]]",
        "constraints": "• m == mat.length, n == mat[i].length\n• 1 <= m, n <= 10^4\n• 1 <= m * n <= 10^4\n• mat[i][j] is either 0 or 1."
    },
    {
        "title": "K Closest Points to Origin",
        "slug": "k-closest-points-to-origin",
        "difficulty": "Medium",
        "topic": "Heap / Priority Queue",
        "url": "https://leetcode.com/problems/k-closest-points-to-origin/",
        "description": "Given an array of points where points[i] = [xi, yi] and an integer k, return the k closest points to the origin (0, 0). The distance between two points on the X-Y plane is the Euclidean distance.",
        "examples": "Input: points = [[1,3],[-2,2]], k = 1\nOutput: [[-2,2]]",
        "constraints": "• 1 <= k <= points.length <= 10^4\n• -10^4 <= xi, yi <= 10^4"
    },
    {
        "title": "Longest Substring Without Repeating Characters",
        "slug": "longest-substring-without-repeating-characters",
        "difficulty": "Medium",
        "topic": "Sliding Window / Hash Table",
        "url": "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
        "description": "Given a string s, find the length of the longest substring without repeating characters.",
        "examples": "Input: s = \"abcabcbb\"\nOutput: 3\nExplanation: The answer is \"abc\", with the length of 3.",
        "constraints": "• 0 <= s.length <= 5 * 10^4\n• s consists of English letters, digits, symbols and spaces."
    },
    {
        "title": "3Sum",
        "slug": "3sum",
        "difficulty": "Medium",
        "topic": "Two Pointers / Array",
        "url": "https://leetcode.com/problems/3sum/",
        "description": "Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0. Notice that the solution set must not contain duplicate triplets.",
        "examples": "Input: nums = [-1,0,1,2,-1,-4]\nOutput: [[-1,-1,2],[-1,0,1]]",
        "constraints": "• 3 <= nums.length <= 3000\n• -10^5 <= nums[i] <= 10^5"
    },
    {
        "title": "Binary Tree Level Order Traversal",
        "slug": "binary-tree-level-order-traversal",
        "difficulty": "Medium",
        "topic": "Binary Tree / BFS",
        "url": "https://leetcode.com/problems/binary-tree-level-order-traversal/",
        "description": "Given the root of a binary tree, return the level order traversal of its nodes' values. (i.e., from left to right, level by level).",
        "examples": "Input: root = [3,9,20,null,null,15,7]\nOutput: [[3],[9,20],[15,7]]",
        "constraints": "• The number of nodes in the tree is in the range [0, 2000].\n• -1000 <= Node.val <= 1000"
    },
    {
        "title": "Clone Graph",
        "slug": "clone-graph",
        "difficulty": "Medium",
        "topic": "Graph / DFS / BFS",
        "url": "https://leetcode.com/problems/clone-graph/",
        "description": "Given a reference of a node in a connected undirected graph. Return a deep copy (clone) of the graph. Each node in the graph contains a value (int) and a list (List[Node]) of its neighbors.",
        "examples": "Input: adjList = [[2,4],[1,3],[2,4],[1,3]]\nOutput: [[2,4],[1,3],[2,4],[1,3]]",
        "constraints": "• The number of nodes in the graph is in the range [0, 100].\n• 1 <= Node.val <= 100\n• Node.val is unique for each node."
    },
    {
        "title": "Coin Change",
        "slug": "coin-change",
        "difficulty": "Medium",
        "topic": "Dynamic Programming",
        "url": "https://leetcode.com/problems/coin-change/",
        "description": "You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money. Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1.",
        "examples": "Input: coins = [1,2,5], amount = 11\nOutput: 3\nExplanation: 11 = 5 + 5 + 1",
        "constraints": "• 1 <= coins.length <= 12\n• 1 <= coins[i] <= 2^31 - 1\n• 0 <= amount <= 10^4"
    },
    {
        "title": "Product of Array Except Self",
        "slug": "product-of-array-except-self",
        "difficulty": "Medium",
        "topic": "Array / Prefix Sum",
        "url": "https://leetcode.com/problems/product-of-array-except-self/",
        "description": "Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i]. You must write an algorithm that runs in O(n) time and without using the division operation.",
        "examples": "Input: nums = [1,2,3,4]\nOutput: [24,12,8,6]",
        "constraints": "• 2 <= nums.length <= 10^5\n• -30 <= nums[i] <= 30\n• The product of any prefix or suffix of nums fits in a 32-bit integer."
    },
    {
        "title": "Course Schedule",
        "slug": "course-schedule",
        "difficulty": "Medium",
        "topic": "Graph / Topological Sort",
        "url": "https://leetcode.com/problems/course-schedule/",
        "description": "There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1. You are given an array prerequisites where prerequisites[i] = [ai, bi] indicates that you must take course bi first if you want to take course ai. Return true if you can finish all courses. Otherwise, return false.",
        "examples": "Input: numCourses = 2, prerequisites = [[1,0]]\nOutput: true\n\nInput: numCourses = 2, prerequisites = [[1,0],[0,1]]\nOutput: false",
        "constraints": "• 1 <= numCourses <= 2000\n• 0 <= prerequisites.length <= 5000\n• prerequisites[i].length == 2\n• All prerequisites pairs are unique."
    },
    {
        "title": "Number of Islands",
        "slug": "number-of-islands",
        "difficulty": "Medium",
        "topic": "Graph / DFS / BFS",
        "url": "https://leetcode.com/problems/number-of-islands/",
        "description": "Given an m x n 2D binary grid grid which represents a map of '1's (land) and '0's (water), return the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.",
        "examples": "Input: grid = [\n  [\"1\",\"1\",\"0\",\"0\",\"0\"],\n  [\"1\",\"1\",\"0\",\"0\",\"0\"],\n  [\"0\",\"0\",\"1\",\"0\",\"0\"],\n  [\"0\",\"0\",\"0\",\"1\",\"1\"]\n]\nOutput: 3",
        "constraints": "• m == grid.length, n == grid[i].length\n• 1 <= m, n <= 300\n• grid[i][j] is '0' or '1'."
    },
    {
        "title": "Rotting Oranges",
        "slug": "rotting-oranges",
        "difficulty": "Medium",
        "topic": "Graph / BFS",
        "url": "https://leetcode.com/problems/rotting-oranges/",
        "description": "You are given an m x n grid where each cell has: 0 empty, 1 fresh orange, 2 rotten orange. Every minute, any fresh orange that is 4-directionally adjacent to a rotten orange becomes rotten. Return the minimum number of minutes that must elapse until no cell has a fresh orange. If impossible, return -1.",
        "examples": "Input: grid = [[2,1,1],[1,1,0],[0,1,1]]\nOutput: 4",
        "constraints": "• m == grid.length, n == grid[i].length\n• 1 <= m, n <= 10\n• grid[i][j] is 0, 1, or 2."
    },
    {
        "title": "Search in Rotated Sorted Array",
        "slug": "search-in-rotated-sorted-array",
        "difficulty": "Medium",
        "topic": "Binary Search / Array",
        "url": "https://leetcode.com/problems/search-in-rotated-sorted-array/",
        "description": "There is an integer array nums sorted in ascending order (with distinct values). Given the array nums after the possible rotation and an integer target, return the index of target if it is in nums, or -1 if it is not in nums. You must write an algorithm with O(log n) runtime complexity.",
        "examples": "Input: nums = [4,5,6,7,0,1,2], target = 0\nOutput: 4",
        "constraints": "• 1 <= nums.length <= 5000\n• -10^4 <= nums[i], target <= 10^4\n• All values of nums are unique."
    },
    {
        "title": "Combination Sum",
        "slug": "combination-sum",
        "difficulty": "Medium",
        "topic": "Backtracking / Array",
        "url": "https://leetcode.com/problems/combination-sum/",
        "description": "Given an array of distinct integers candidates and a target integer target, return a list of all unique combinations of candidates where the chosen numbers sum to target. You may return the combinations in any order. The same number may be chosen an unlimited number of times.",
        "examples": "Input: candidates = [2,3,6,7], target = 7\nOutput: [[2,2,3],[7]]",
        "constraints": "• 1 <= candidates.length <= 30\n• 2 <= candidates[i] <= 40\n• All elements of candidates are distinct.\n• 1 <= target <= 40"
    },
    {
        "title": "Trapping Rain Water",
        "slug": "trapping-rain-water",
        "difficulty": "Hard",
        "topic": "Two Pointers / Stack / Array",
        "url": "https://leetcode.com/problems/trapping-rain-water/",
        "description": "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
        "examples": "Input: height = [0,1,0,2,1,0,1,3,2,1,2,1]\nOutput: 6",
        "constraints": "• n == height.length\n• 1 <= n <= 2 * 10^4\n• 0 <= height[i] <= 10^5"
    }
]

import random

def get_random_grind75_problem(topic: str = None, difficulty: str = None):
    pool = GRIND_75_PROBLEMS
    if topic:
        pool = [p for p in pool if topic.lower() in p["topic"].lower()] or pool
    if difficulty:
        pool = [p for p in pool if p["difficulty"].lower() == difficulty.lower()] or pool
    return random.choice(pool)

def format_grind75_prompt_context():
    """Generates a formatted summary of available Grind 75 problems for the LLM prompt."""
    lines = []
    for p in GRIND_75_PROBLEMS[:15]:
        lines.append(f"- {p['title']} ({p['difficulty']}, {p['topic']}): {p['url']}")
    return "\n".join(lines)
