import {
  ArrayList,
  Stack,
  Queue,
  ListNode,
  TreeNode,
  MinHeap,
  MaxHeap,
} from "../../../../shared/typescript/ds";

const toArray = <T>(list: ArrayList<T>): T[] => list.toArray();

export const twoSum = (nums: number[], target: number): number[] => {
  const seen: Record<number, number> = {};
  for (let i = 0; i < nums.length; i += 1) {
    const need = target - nums[i];
    if (seen[need] !== undefined) {
      return [seen[need], i];
    }
    seen[nums[i]] = i;
  }
  return [];
};

export const bestTimeBuySellStock = (prices: number[]): number => {
  if (prices.length === 0) return 0;
  let minPrice = prices[0];
  let maxProfit = 0;
  for (let i = 1; i < prices.length; i += 1) {
    if (prices[i] < minPrice) minPrice = prices[i];
    else {
      const profit = prices[i] - minPrice;
      if (profit > maxProfit) maxProfit = profit;
    }
  }
  return maxProfit;
};

export const containsDuplicate = (nums: number[]): boolean => {
  const seen: Record<number, boolean> = {};
  for (let i = 0; i < nums.length; i += 1) {
    if (seen[nums[i]]) return true;
    seen[nums[i]] = true;
  }
  return false;
};

export const productExceptSelf = (nums: number[]): number[] => {
  const result = new Array(nums.length).fill(1);
  let prefix = 1;
  for (let i = 0; i < nums.length; i += 1) {
    result[i] = prefix;
    prefix *= nums[i];
  }
  let suffix = 1;
  for (let i = nums.length - 1; i >= 0; i -= 1) {
    result[i] *= suffix;
    suffix *= nums[i];
  }
  return result;
};

export const maximumSubarray = (nums: number[]): number => {
  let best = nums[0];
  let current = nums[0];
  for (let i = 1; i < nums.length; i += 1) {
    const val = nums[i];
    current = current + val > val ? current + val : val;
    if (current > best) best = current;
  }
  return best;
};

export const maximumProductSubarray = (nums: number[]): number => {
  let maxVal = nums[0];
  let minVal = nums[0];
  let best = nums[0];
  for (let i = 1; i < nums.length; i += 1) {
    const val = nums[i];
    if (val < 0) {
      const temp = maxVal;
      maxVal = minVal;
      minVal = temp;
    }
    maxVal = Math.max(val, maxVal * val);
    minVal = Math.min(val, minVal * val);
    if (maxVal > best) best = maxVal;
  }
  return best;
};

export const findMinRotated = (nums: number[]): number => {
  let left = 0;
  let right = nums.length - 1;
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] > nums[right]) left = mid + 1;
    else right = mid;
  }
  return nums[left];
};

export const searchRotated = (nums: number[], target: number): number => {
  let left = 0;
  let right = nums.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) return mid;
    if (nums[left] <= nums[mid]) {
      if (nums[left] <= target && target < nums[mid]) right = mid - 1;
      else left = mid + 1;
    } else {
      if (nums[mid] < target && target <= nums[right]) left = mid + 1;
      else right = mid - 1;
    }
  }
  return -1;
};

export const threeSum = (nums: number[]): number[][] => {
  if (nums.length < 3) return [];
  quickSortInt(nums, 0, nums.length - 1);
  const result = new ArrayList<number[]>();
  for (let i = 0; i < nums.length - 2; i += 1) {
    if (i > 0 && nums[i] === nums[i - 1]) continue;
    let left = i + 1;
    let right = nums.length - 1;
    while (left < right) {
      const total = nums[i] + nums[left] + nums[right];
      if (total === 0) {
        result.add([nums[i], nums[left], nums[right]]);
        left += 1;
        right -= 1;
        while (left < right && nums[left] === nums[left - 1]) left += 1;
        while (left < right && nums[right] === nums[right + 1]) right -= 1;
      } else if (total < 0) {
        left += 1;
      } else {
        right -= 1;
      }
    }
  }
  return toArray(result);
};

export const containerWithMostWater = (heights: number[]): number => {
  let left = 0;
  let right = heights.length - 1;
  let best = 0;
  while (left < right) {
    const width = right - left;
    if (heights[left] < heights[right]) {
      const area = heights[left] * width;
      if (area > best) best = area;
      left += 1;
    } else {
      const area = heights[right] * width;
      if (area > best) best = area;
      right -= 1;
    }
  }
  return best;
};

export const sumOfTwoIntegers = (a: number, b: number): number => {
  let x = a;
  let y = b;
  const mask = 0xffffffff;
  while (y !== 0) {
    const carry = (x & y) & mask;
    x = (x ^ y) & mask;
    y = (carry << 1) & mask;
  }
  return x | 0;
};

export const numberOf1Bits = (n: number): number => {
  let count = 0;
  let x = n >>> 0;
  while (x !== 0) {
    x &= x - 1;
    count += 1;
  }
  return count;
};

export const countingBits = (n: number): number[] => {
  const result = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i += 1) {
    result[i] = result[i >> 1] + (i & 1);
  }
  return result;
};

export const missingNumber = (nums: number[]): number => {
  let xorVal = 0;
  for (let i = 0; i < nums.length; i += 1) {
    xorVal ^= i;
    xorVal ^= nums[i];
  }
  xorVal ^= nums.length;
  return xorVal;
};

export const reverseBits = (n: number): number => {
  let result = 0;
  let x = n >>> 0;
  for (let i = 0; i < 32; i += 1) {
    result = (result << 1) | (x & 1);
    x >>>= 1;
  }
  return result >>> 0;
};

export const climbingStairs = (n: number): number => {
  if (n <= 2) return n;
  let prev2 = 1;
  let prev1 = 2;
  for (let i = 3; i <= n; i += 1) {
    const current = prev1 + prev2;
    prev2 = prev1;
    prev1 = current;
  }
  return prev1;
};

export const coinChange = (coins: number[], amount: number): number => {
  const dp = new Array(amount + 1).fill(amount + 1);
  dp[0] = 0;
  for (let i = 1; i <= amount; i += 1) {
    for (let j = 0; j < coins.length; j += 1) {
      const coin = coins[j];
      if (coin <= i) {
        const cand = dp[i - coin] + 1;
        if (cand < dp[i]) dp[i] = cand;
      }
    }
  }
  return dp[amount] === amount + 1 ? -1 : dp[amount];
};

export const longestIncreasingSubsequence = (nums: number[]): number => {
  if (nums.length === 0) return 0;
  const tails = new Array(nums.length).fill(0);
  let size = 0;
  for (let i = 0; i < nums.length; i += 1) {
    const val = nums[i];
    let left = 0;
    let right = size;
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (tails[mid] < val) left = mid + 1;
      else right = mid;
    }
    tails[left] = val;
    if (left === size) size += 1;
  }
  return size;
};

export const longestCommonSubsequence = (text1: string, text2: string): number => {
  const n = text1.length;
  const m = text2.length;
  const dp = new Array(n + 1);
  for (let i = 0; i <= n; i += 1) {
    dp[i] = new Array(m + 1).fill(0);
  }
  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      if (text1[i - 1] === text2[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[n][m];
};

export const wordBreak = (s: string, wordDict: string[]): boolean => {
  const wordSet: Record<string, boolean> = {};
  for (let i = 0; i < wordDict.length; i += 1) wordSet[wordDict[i]] = true;
  const dp = new Array(s.length + 1).fill(false);
  dp[0] = true;
  for (let i = 1; i <= s.length; i += 1) {
    for (let j = 0; j < i; j += 1) {
      if (dp[j] && wordSet[s.slice(j, i)]) {
        dp[i] = true;
        break;
      }
    }
  }
  return dp[s.length];
};

export const combinationSum = (candidates: number[], target: number): number[][] => {
  const result = new ArrayList<number[]>();
  const path = new ArrayList<number>();
  const backtrack = (start: number, total: number): void => {
    if (total === target) {
      result.add(toArray(path));
      return;
    }
    if (total > target) return;
    for (let i = start; i < candidates.length; i += 1) {
      path.add(candidates[i]);
      backtrack(i, total + candidates[i]);
      path.removeLast();
    }
  };
  backtrack(0, 0);
  return toArray(result);
};

export const houseRobber = (nums: number[]): number => {
  let prev1 = 0;
  let prev2 = 0;
  for (let i = 0; i < nums.length; i += 1) {
    const take = prev2 + nums[i];
    const skip = prev1;
    const current = take > skip ? take : skip;
    prev2 = prev1;
    prev1 = current;
  }
  return prev1;
};

export const houseRobberII = (nums: number[]): number => {
  if (nums.length === 0) return 0;
  if (nums.length === 1) return nums[0];
  const robRange = (left: number, right: number): number => {
    let prev1 = 0;
    let prev2 = 0;
    for (let i = left; i <= right; i += 1) {
      const take = prev2 + nums[i];
      const skip = prev1;
      const current = take > skip ? take : skip;
      prev2 = prev1;
      prev1 = current;
    }
    return prev1;
  };
  return Math.max(robRange(0, nums.length - 2), robRange(1, nums.length - 1));
};

export const decodeWays = (s: string): number => {
  if (s.length === 0 || s[0] === "0") return 0;
  let prev2 = 1;
  let prev1 = 1;
  for (let i = 1; i < s.length; i += 1) {
    let current = 0;
    if (s[i] !== "0") current += prev1;
    const two = parseInt(s.slice(i - 1, i + 1), 10);
    if (two >= 10 && two <= 26) current += prev2;
    prev2 = prev1;
    prev1 = current;
  }
  return prev1;
};

export const uniquePaths = (m: number, n: number): number => {
  const dp = new Array(n).fill(1);
  for (let i = 1; i < m; i += 1) {
    for (let j = 1; j < n; j += 1) {
      dp[j] = dp[j] + dp[j - 1];
    }
  }
  return dp[n - 1];
};

export const jumpGame = (nums: number[]): boolean => {
  let reach = 0;
  for (let i = 0; i < nums.length; i += 1) {
    if (i > reach) return false;
    if (i + nums[i] > reach) reach = i + nums[i];
  }
  return true;
};

export class GraphNode {
  val: number;
  neighbors: ArrayList<GraphNode>;
  constructor(val = 0) {
    this.val = val;
    this.neighbors = new ArrayList<GraphNode>();
  }
}

export const cloneGraph = (node: GraphNode | null): GraphNode | null => {
  if (node === null) return null;
  const clones = new Map<GraphNode, GraphNode>();
  const dfs = (curr: GraphNode): GraphNode => {
    if (clones.has(curr)) return clones.get(curr) as GraphNode;
    const copy = new GraphNode(curr.val);
    clones.set(curr, copy);
    for (let i = 0; i < curr.neighbors.size(); i += 1) {
      copy.neighbors.add(dfs(curr.neighbors.get(i)));
    }
    return copy;
  };
  return dfs(node);
};

export const courseSchedule = (numCourses: number, prerequisites: number[][]): boolean => {
  const graph = new Array(numCourses);
  for (let i = 0; i < numCourses; i += 1) graph[i] = new ArrayList<number>();
  const indegree = new Array(numCourses).fill(0);
  for (let i = 0; i < prerequisites.length; i += 1) {
    const a = prerequisites[i][0];
    const b = prerequisites[i][1];
    graph[b].add(a);
    indegree[a] += 1;
  }
  const queue = new Queue<number>();
  for (let i = 0; i < numCourses; i += 1) {
    if (indegree[i] === 0) queue.enqueue(i);
  }
  let visited = 0;
  while (!queue.isEmpty()) {
    const node = queue.dequeue() as number;
    visited += 1;
    const neighbors = graph[node];
    for (let i = 0; i < neighbors.size(); i += 1) {
      const nxt = neighbors.get(i);
      indegree[nxt] -= 1;
      if (indegree[nxt] === 0) queue.enqueue(nxt);
    }
  }
  return visited === numCourses;
};

export const pacificAtlantic = (heights: number[][]): number[][] => {
  if (heights.length === 0) return [];
  const rows = heights.length;
  const cols = heights[0].length;
  const pac = new Array(rows);
  const atl = new Array(rows);
  for (let r = 0; r < rows; r += 1) {
    pac[r] = new Array(cols).fill(false);
    atl[r] = new Array(cols).fill(false);
  }
  const dfs = (r: number, c: number, visited: boolean[][]): void => {
    visited[r][c] = true;
    const dr = [1, -1, 0, 0];
    const dc = [0, 0, 1, -1];
    for (let i = 0; i < 4; i += 1) {
      const nr = r + dr[i];
      const nc = c + dc[i];
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        if (!visited[nr][nc] && heights[nr][nc] >= heights[r][c]) {
          dfs(nr, nc, visited);
        }
      }
    }
  };
  for (let r = 0; r < rows; r += 1) {
    dfs(r, 0, pac);
    dfs(r, cols - 1, atl);
  }
  for (let c = 0; c < cols; c += 1) {
    dfs(0, c, pac);
    dfs(rows - 1, c, atl);
  }
  const result = new ArrayList<number[]>();
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (pac[r][c] && atl[r][c]) result.add([r, c]);
    }
  }
  return toArray(result);
};

export const numberOfIslands = (grid: string[][]): number => {
  if (grid.length === 0) return 0;
  const rows = grid.length;
  const cols = grid[0].length;
  let count = 0;
  const dfs = (r: number, c: number): void => {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;
    if (grid[r][c] !== "1") return;
    grid[r][c] = "0";
    dfs(r + 1, c);
    dfs(r - 1, c);
    dfs(r, c + 1);
    dfs(r, c - 1);
  };
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (grid[r][c] === "1") {
        count += 1;
        dfs(r, c);
      }
    }
  }
  return count;
};

export const longestConsecutive = (nums: number[]): number => {
  const seen: Record<number, boolean> = {};
  for (let i = 0; i < nums.length; i += 1) seen[nums[i]] = true;
  let longest = 0;
  for (let i = 0; i < nums.length; i += 1) {
    const val = nums[i];
    if (seen[val - 1] !== true) {
      let length = 1;
      let current = val + 1;
      while (seen[current]) {
        length += 1;
        current += 1;
      }
      if (length > longest) longest = length;
    }
  }
  return longest;
};

export const alienDictionary = (words: string[]): string => {
  const graph = new Map<string, ArrayList<string>>();
  const indegree = new Map<string, number>();
  for (let i = 0; i < words.length; i += 1) {
    for (let j = 0; j < words[i].length; j += 1) {
      const ch = words[i][j];
      if (!graph.has(ch)) graph.set(ch, new ArrayList<string>());
      if (!indegree.has(ch)) indegree.set(ch, 0);
    }
  }
  for (let i = 0; i + 1 < words.length; i += 1) {
    const a = words[i];
    const b = words[i + 1];
    let j = 0;
    while (j < a.length && j < b.length && a[j] === b[j]) j += 1;
    if (j < a.length && j < b.length) {
      const from = a[j];
      const to = b[j];
      (graph.get(from) as ArrayList<string>).add(to);
      indegree.set(to, (indegree.get(to) as number) + 1);
    } else if (a.length > b.length) {
      return "";
    }
  }
  const queue = new Queue<string>();
  indegree.forEach((value, key) => {
    if (value === 0) queue.enqueue(key);
  });
  const order = new ArrayList<string>();
  while (!queue.isEmpty()) {
    const ch = queue.dequeue() as string;
    order.add(ch);
    const neighbors = graph.get(ch) as ArrayList<string>;
    for (let i = 0; i < neighbors.size(); i += 1) {
      const nxt = neighbors.get(i);
      indegree.set(nxt, (indegree.get(nxt) as number) - 1);
      if (indegree.get(nxt) === 0) queue.enqueue(nxt);
    }
  }
  if (order.size() !== indegree.size) return "";
  return toArray(order).join("");
};

export const graphValidTree = (n: number, edges: number[][]): boolean => {
  if (edges.length !== n - 1) return false;
  const parent = new Array(n);
  for (let i = 0; i < n; i += 1) parent[i] = i;
  const find = (x: number): number => {
    let root = x;
    while (parent[root] !== root) root = parent[root];
    while (parent[x] !== x) {
      const next = parent[x];
      parent[x] = root;
      x = next;
    }
    return root;
  };
  for (let i = 0; i < edges.length; i += 1) {
    const a = edges[i][0];
    const b = edges[i][1];
    const pa = find(a);
    const pb = find(b);
    if (pa === pb) return false;
    parent[pb] = pa;
  }
  return true;
};

export const numberOfConnectedComponents = (n: number, edges: number[][]): number => {
  const parent = new Array(n);
  for (let i = 0; i < n; i += 1) parent[i] = i;
  let count = n;
  const find = (x: number): number => {
    let root = x;
    while (parent[root] !== root) root = parent[root];
    while (parent[x] !== x) {
      const next = parent[x];
      parent[x] = root;
      x = next;
    }
    return root;
  };
  for (let i = 0; i < edges.length; i += 1) {
    const a = edges[i][0];
    const b = edges[i][1];
    const pa = find(a);
    const pb = find(b);
    if (pa !== pb) {
      parent[pb] = pa;
      count -= 1;
    }
  }
  return count;
};

export const insertInterval = (intervals: number[][], newInterval: number[]): number[][] => {
  const result = new ArrayList<number[]>();
  let i = 0;
  while (i < intervals.length && intervals[i][1] < newInterval[0]) {
    result.add(intervals[i]);
    i += 1;
  }
  while (i < intervals.length && intervals[i][0] <= newInterval[1]) {
    if (intervals[i][0] < newInterval[0]) newInterval[0] = intervals[i][0];
    if (intervals[i][1] > newInterval[1]) newInterval[1] = intervals[i][1];
    i += 1;
  }
  result.add(newInterval);
  while (i < intervals.length) {
    result.add(intervals[i]);
    i += 1;
  }
  return toArray(result);
};

export const mergeIntervals = (intervals: number[][]): number[][] => {
  if (intervals.length === 0) return [];
  quickSortIntervals(intervals, 0, intervals.length - 1);
  const result = new ArrayList<number[]>();
  let current = intervals[0];
  for (let i = 1; i < intervals.length; i += 1) {
    if (intervals[i][0] <= current[1]) {
      if (intervals[i][1] > current[1]) current[1] = intervals[i][1];
    } else {
      result.add(current);
      current = intervals[i];
    }
  }
  result.add(current);
  return toArray(result);
};

export const nonOverlappingIntervals = (intervals: number[][]): number => {
  if (intervals.length === 0) return 0;
  quickSortIntervals(intervals, 0, intervals.length - 1);
  let count = 0;
  let end = intervals[0][1];
  for (let i = 1; i < intervals.length; i += 1) {
    if (intervals[i][0] < end) {
      count += 1;
      if (intervals[i][1] < end) end = intervals[i][1];
    } else {
      end = intervals[i][1];
    }
  }
  return count;
};

export const meetingRooms = (intervals: number[][]): boolean => {
  if (intervals.length === 0) return true;
  quickSortIntervals(intervals, 0, intervals.length - 1);
  for (let i = 1; i < intervals.length; i += 1) {
    if (intervals[i][0] < intervals[i - 1][1]) return false;
  }
  return true;
};

export const meetingRoomsII = (intervals: number[][]): number => {
  if (intervals.length === 0) return 0;
  quickSortIntervals(intervals, 0, intervals.length - 1);
  const heap = new MinHeap<number>();
  heap.push(intervals[0][1]);
  for (let i = 1; i < intervals.length; i += 1) {
    if (heap.peek() !== null && intervals[i][0] >= (heap.peek() as number)) {
      heap.pop();
    }
    heap.push(intervals[i][1]);
  }
  return heap.size();
};

export const reverseLinkedList = (head: ListNode<number> | null): ListNode<number> | null => {
  let prev: ListNode<number> | null = null;
  let current = head;
  while (current !== null) {
    const next = current.next;
    current.next = prev;
    prev = current;
    current = next;
  }
  return prev;
};

export const detectCycle = (head: ListNode<number> | null): boolean => {
  let slow = head;
  let fast = head;
  while (fast !== null && fast.next !== null) {
    slow = slow?.next ?? null;
    fast = fast.next.next;
    if (slow === fast && slow !== null) return true;
  }
  return false;
};

export const mergeTwoSortedLists = (
  l1: ListNode<number> | null,
  l2: ListNode<number> | null
): ListNode<number> | null => {
  const dummy = new ListNode<number>(0);
  let current = dummy;
  let a = l1;
  let b = l2;
  while (a !== null && b !== null) {
    if (a.val <= b.val) {
      current.next = a;
      a = a.next;
    } else {
      current.next = b;
      b = b.next;
    }
    current = current.next as ListNode<number>;
  }
  current.next = a !== null ? a : b;
  return dummy.next;
};

export const mergeKSortedLists = (lists: Array<ListNode<number> | null>): ListNode<number> | null => {
  type NodeEntry = { val: number; idx: number; node: ListNode<number> };
  const heap = new MinHeap<NodeEntry>();
  for (let i = 0; i < lists.length; i += 1) {
    if (lists[i] !== null) {
      heap.push({ val: (lists[i] as ListNode<number>).val, idx: i, node: lists[i] as ListNode<number> });
    }
  }
  const dummy = new ListNode<number>(0);
  let current = dummy;
  while (heap.size() > 0) {
    const top = heap.pop() as NodeEntry;
    current.next = top.node;
    current = current.next as ListNode<number>;
    if (top.node.next !== null) {
      heap.push({ val: top.node.next.val, idx: top.idx, node: top.node.next });
    }
  }
  return dummy.next;
};

export const removeNthFromEnd = (head: ListNode<number> | null, n: number): ListNode<number> | null => {
  const dummy = new ListNode<number>(0, head);
  let fast: ListNode<number> | null = dummy;
  let slow: ListNode<number> | null = dummy;
  for (let i = 0; i < n + 1; i += 1) {
    fast = fast?.next ?? null;
  }
  while (fast !== null) {
    fast = fast.next;
    slow = slow?.next ?? null;
  }
  if (slow !== null && slow.next !== null) slow.next = slow.next.next;
  return dummy.next;
};

export const reorderList = (head: ListNode<number> | null): void => {
  if (head === null || head.next === null) return;
  let slow: ListNode<number> | null = head;
  let fast: ListNode<number> | null = head;
  while (fast?.next && fast.next.next) {
    slow = slow?.next ?? null;
    fast = fast.next.next;
  }
  const second = reverseLinkedList(slow?.next ?? null);
  if (slow) slow.next = null;
  let first = head;
  let secondNode = second;
  while (secondNode !== null) {
    const temp1 = first.next;
    const temp2 = secondNode.next;
    first.next = secondNode;
    secondNode.next = temp1;
    first = temp1 as ListNode<number>;
    secondNode = temp2;
  }
};

export const setMatrixZeroes = (matrix: number[][]): void => {
  const rows = matrix.length;
  const cols = matrix[0].length;
  let rowZero = false;
  let colZero = false;
  for (let r = 0; r < rows; r += 1) {
    if (matrix[r][0] === 0) colZero = true;
  }
  for (let c = 0; c < cols; c += 1) {
    if (matrix[0][c] === 0) rowZero = true;
  }
  for (let r = 1; r < rows; r += 1) {
    for (let c = 1; c < cols; c += 1) {
      if (matrix[r][c] === 0) {
        matrix[r][0] = 0;
        matrix[0][c] = 0;
      }
    }
  }
  for (let r = 1; r < rows; r += 1) {
    if (matrix[r][0] === 0) {
      for (let c = 1; c < cols; c += 1) matrix[r][c] = 0;
    }
  }
  for (let c = 1; c < cols; c += 1) {
    if (matrix[0][c] === 0) {
      for (let r = 1; r < rows; r += 1) matrix[r][c] = 0;
    }
  }
  if (rowZero) {
    for (let c = 0; c < cols; c += 1) matrix[0][c] = 0;
  }
  if (colZero) {
    for (let r = 0; r < rows; r += 1) matrix[r][0] = 0;
  }
};

export const spiralMatrix = (matrix: number[][]): number[] => {
  const result = new ArrayList<number>();
  let top = 0;
  let bottom = matrix.length - 1;
  let left = 0;
  let right = matrix[0].length - 1;
  while (top <= bottom && left <= right) {
    for (let i = left; i <= right; i += 1) result.add(matrix[top][i]);
    top += 1;
    for (let i = top; i <= bottom; i += 1) result.add(matrix[i][right]);
    right -= 1;
    if (top <= bottom) {
      for (let i = right; i >= left; i -= 1) result.add(matrix[bottom][i]);
      bottom -= 1;
    }
    if (left <= right) {
      for (let i = bottom; i >= top; i -= 1) result.add(matrix[i][left]);
      left += 1;
    }
  }
  return toArray(result);
};

export const rotateImage = (matrix: number[][]): void => {
  const n = matrix.length;
  for (let layer = 0; layer < Math.floor(n / 2); layer += 1) {
    const first = layer;
    const last = n - 1 - layer;
    for (let i = first; i < last; i += 1) {
      const offset = i - first;
      const top = matrix[first][i];
      matrix[first][i] = matrix[last - offset][first];
      matrix[last - offset][first] = matrix[last][last - offset];
      matrix[last][last - offset] = matrix[i][last];
      matrix[i][last] = top;
    }
  }
};

export const wordSearch = (board: string[][], word: string): boolean => {
  const rows = board.length;
  const cols = board[0].length;
  const dfs = (r: number, c: number, idx: number): boolean => {
    if (idx === word.length) return true;
    if (r < 0 || r >= rows || c < 0 || c >= cols) return false;
    if (board[r][c] !== word[idx]) return false;
    const temp = board[r][c];
    board[r][c] = "#";
    const found =
      dfs(r + 1, c, idx + 1) ||
      dfs(r - 1, c, idx + 1) ||
      dfs(r, c + 1, idx + 1) ||
      dfs(r, c - 1, idx + 1);
    board[r][c] = temp;
    return found;
  };
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (dfs(r, c, 0)) return true;
    }
  }
  return false;
};

export const longestSubstringWithoutRepeating = (s: string): number => {
  const last: Record<string, number> = {};
  let left = 0;
  let best = 0;
  for (let right = 0; right < s.length; right += 1) {
    const ch = s[right];
    if (last[ch] !== undefined && last[ch] >= left) left = last[ch] + 1;
    last[ch] = right;
    const length = right - left + 1;
    if (length > best) best = length;
  }
  return best;
};

export const longestRepeatingCharacterReplacement = (s: string, k: number): number => {
  const counts: Record<string, number> = {};
  let left = 0;
  let maxCount = 0;
  let best = 0;
  for (let right = 0; right < s.length; right += 1) {
    const ch = s[right];
    counts[ch] = (counts[ch] || 0) + 1;
    if (counts[ch] > maxCount) maxCount = counts[ch];
    const window = right - left + 1;
    if (window - maxCount > k) {
      counts[s[left]] -= 1;
      left += 1;
    } else if (window > best) {
      best = window;
    }
  }
  return best;
};

export const minimumWindowSubstring = (s: string, t: string): string => {
  if (t.length === 0) return "";
  const target: Record<string, number> = {};
  for (let i = 0; i < t.length; i += 1) target[t[i]] = (target[t[i]] || 0) + 1;
  const need = Object.keys(target).length;
  let formed = 0;
  const window: Record<string, number> = {};
  let left = 0;
  let bestLen = 1 << 30;
  let bestL = 0;
  let bestR = 0;
  for (let right = 0; right < s.length; right += 1) {
    const ch = s[right];
    window[ch] = (window[ch] || 0) + 1;
    if (target[ch] !== undefined && window[ch] === target[ch]) formed += 1;
    while (left <= right && formed === need) {
      if (right - left + 1 < bestLen) {
        bestLen = right - left + 1;
        bestL = left;
        bestR = right;
      }
      const leftCh = s[left];
      window[leftCh] -= 1;
      if (target[leftCh] !== undefined && window[leftCh] < target[leftCh]) formed -= 1;
      left += 1;
    }
  }
  if (bestLen === (1 << 30)) return "";
  return s.slice(bestL, bestR + 1);
};

export const validAnagram = (s: string, t: string): boolean => {
  if (s.length !== t.length) return false;
  const count: Record<string, number> = {};
  for (let i = 0; i < s.length; i += 1) count[s[i]] = (count[s[i]] || 0) + 1;
  for (let i = 0; i < t.length; i += 1) {
    const ch = t[i];
    if (count[ch] === undefined) return false;
    count[ch] -= 1;
    if (count[ch] < 0) return false;
  }
  return true;
};

export const groupAnagrams = (strs: string[]): string[][] => {
  const groups = new Map<string, ArrayList<string>>();
  for (let i = 0; i < strs.length; i += 1) {
    const s = strs[i];
    const count = new Array(26).fill(0);
    for (let j = 0; j < s.length; j += 1) {
      count[s.charCodeAt(j) - 97] += 1;
    }
    let key = "";
    for (let j = 0; j < 26; j += 1) key += `${count[j]}#`;
    if (!groups.has(key)) groups.set(key, new ArrayList<string>());
    (groups.get(key) as ArrayList<string>).add(s);
  }
  const result = new ArrayList<string[]>();
  groups.forEach((value) => result.add(toArray(value)));
  return toArray(result);
};

export const validParentheses = (s: string): boolean => {
  const stack = new Stack<string>();
  const pairs: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];
    if (pairs[ch]) {
      const top = stack.pop();
      if (top === null || top !== pairs[ch]) return false;
    } else {
      stack.push(ch);
    }
  }
  return stack.isEmpty();
};

export const validPalindrome = (s: string): boolean => {
  let left = 0;
  let right = s.length - 1;
  const isAlphaNum = (ch: string): boolean => /[a-z0-9]/i.test(ch);
  while (left < right) {
    while (left < right && !isAlphaNum(s[left])) left += 1;
    while (left < right && !isAlphaNum(s[right])) right -= 1;
    if (s[left].toLowerCase() !== s[right].toLowerCase()) return false;
    left += 1;
    right -= 1;
  }
  return true;
};

export const longestPalindromicSubstring = (s: string): string => {
  if (s.length === 0) return "";
  let start = 0;
  let end = 0;
  const expand = (l: number, r: number): void => {
    let left = l;
    let right = r;
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      left -= 1;
      right += 1;
    }
    left += 1;
    right -= 1;
    if (right - left > end - start) {
      start = left;
      end = right;
    }
  };
  for (let i = 0; i < s.length; i += 1) {
    expand(i, i);
    expand(i, i + 1);
  }
  return s.slice(start, end + 1);
};

export const palindromicSubstrings = (s: string): number => {
  let count = 0;
  const expand = (l: number, r: number): void => {
    let left = l;
    let right = r;
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      count += 1;
      left -= 1;
      right += 1;
    }
  };
  for (let i = 0; i < s.length; i += 1) {
    expand(i, i);
    expand(i, i + 1);
  }
  return count;
};

export const encodeStrings = (strs: string[]): string => {
  const parts = new ArrayList<string>();
  for (let i = 0; i < strs.length; i += 1) {
    parts.add(String(strs[i].length));
    parts.add("#");
    parts.add(strs[i]);
  }
  return toArray(parts).join("");
};

export const decodeStrings = (s: string): string[] => {
  const result = new ArrayList<string>();
  let i = 0;
  while (i < s.length) {
    let j = i;
    while (s[j] !== "#") j += 1;
    const length = parseInt(s.slice(i, j), 10);
    const start = j + 1;
    result.add(s.slice(start, start + length));
    i = start + length;
  }
  return toArray(result);
};

export const maxDepthBinaryTree = (root: TreeNode | null): number => {
  if (root === null) return 0;
  const left = maxDepthBinaryTree(root.left);
  const right = maxDepthBinaryTree(root.right);
  return 1 + (left > right ? left : right);
};

export const sameTree = (p: TreeNode | null, q: TreeNode | null): boolean => {
  if (p === null && q === null) return true;
  if (p === null || q === null) return false;
  if (p.val !== q.val) return false;
  return sameTree(p.left, q.left) && sameTree(p.right, q.right);
};

export const invertBinaryTree = (root: TreeNode | null): TreeNode | null => {
  if (root === null) return null;
  const left = invertBinaryTree(root.left);
  const right = invertBinaryTree(root.right);
  root.left = right;
  root.right = left;
  return root;
};

export const binaryTreeMaxPathSum = (root: TreeNode | null): number => {
  let best = -1e9;
  const dfs = (node: TreeNode | null): number => {
    if (node === null) return 0;
    let left = dfs(node.left);
    let right = dfs(node.right);
    if (left < 0) left = 0;
    if (right < 0) right = 0;
    const total = node.val + left + right;
    if (total > best) best = total;
    return node.val + (left > right ? left : right);
  };
  dfs(root);
  return best;
};

export const binaryTreeLevelOrder = (root: TreeNode | null): number[][] => {
  if (root === null) return [];
  const result = new ArrayList<number[]>();
  const queue = new Queue<TreeNode>();
  queue.enqueue(root);
  while (!queue.isEmpty()) {
    const temp = new Queue<TreeNode>();
    let levelSize = 0;
    while (!queue.isEmpty()) {
      temp.enqueue(queue.dequeue() as TreeNode);
      levelSize += 1;
    }
    const level = new Array(levelSize);
    let i = 0;
    while (!temp.isEmpty()) {
      const node = temp.dequeue() as TreeNode;
      level[i] = node.val;
      if (node.left) queue.enqueue(node.left);
      if (node.right) queue.enqueue(node.right);
      i += 1;
    }
    result.add(level);
  }
  return toArray(result);
};

export const serializeBinaryTree = (root: TreeNode | null): string => {
  if (root === null) return "";
  const result = new ArrayList<string>();
  const queue = new Queue<TreeNode | null>();
  queue.enqueue(root);
  while (!queue.isEmpty()) {
    const node = queue.dequeue() as TreeNode | null;
    if (node === null) {
      result.add("#");
    } else {
      result.add(String(node.val));
      queue.enqueue(node.left);
      queue.enqueue(node.right);
    }
  }
  return toArray(result).join(",");
};

export const deserializeBinaryTree = (data: string): TreeNode | null => {
  if (data.length === 0) return null;
  const values = data.split(",");
  if (values[0] === "#") return null;
  const root = new TreeNode(parseInt(values[0], 10));
  const queue = new Queue<TreeNode>();
  queue.enqueue(root);
  let i = 1;
  while (i < values.length) {
    const node = queue.dequeue() as TreeNode;
    const leftVal = values[i];
    i += 1;
    if (leftVal !== "#") {
      node.left = new TreeNode(parseInt(leftVal, 10));
      queue.enqueue(node.left);
    }
    const rightVal = values[i] ?? "#";
    i += 1;
    if (rightVal !== "#") {
      node.right = new TreeNode(parseInt(rightVal, 10));
      queue.enqueue(node.right);
    }
  }
  return root;
};

export const subtreeOfAnotherTree = (root: TreeNode | null, subRoot: TreeNode | null): boolean => {
  const same = (a: TreeNode | null, b: TreeNode | null): boolean => {
    if (a === null && b === null) return true;
    if (a === null || b === null) return false;
    if (a.val !== b.val) return false;
    return same(a.left, b.left) && same(a.right, b.right);
  };
  if (root === null) return subRoot === null;
  if (same(root, subRoot)) return true;
  return subtreeOfAnotherTree(root.left, subRoot) || subtreeOfAnotherTree(root.right, subRoot);
};

export const buildTreePreIn = (preorder: number[], inorder: number[]): TreeNode | null => {
  const indexMap: Record<number, number> = {};
  for (let i = 0; i < inorder.length; i += 1) indexMap[inorder[i]] = i;
  const helper = (preL: number, preR: number, inL: number, inR: number): TreeNode | null => {
    if (preL > preR) return null;
    const rootVal = preorder[preL];
    const root = new TreeNode(rootVal);
    const mid = indexMap[rootVal];
    const leftSize = mid - inL;
    root.left = helper(preL + 1, preL + leftSize, inL, mid - 1);
    root.right = helper(preL + leftSize + 1, preR, mid + 1, inR);
    return root;
  };
  return helper(0, preorder.length - 1, 0, inorder.length - 1);
};

export const validateBST = (root: TreeNode | null): boolean => {
  const helper = (node: TreeNode | null, low: number, high: number): boolean => {
    if (node === null) return true;
    if (node.val <= low || node.val >= high) return false;
    return helper(node.left, low, node.val) && helper(node.right, node.val, high);
  };
  return helper(root, -1e18, 1e18);
};

export const kthSmallestBST = (root: TreeNode | null, k: number): number => {
  const stack = new Stack<TreeNode>();
  let current: TreeNode | null = root;
  let count = 0;
  while (current !== null || !stack.isEmpty()) {
    while (current !== null) {
      stack.push(current);
      current = current.left;
    }
    current = stack.pop() as TreeNode;
    count += 1;
    if (count === k) return current.val;
    current = current.right;
  }
  return -1;
};

export const lcaBST = (root: TreeNode | null, p: TreeNode, q: TreeNode): TreeNode | null => {
  let current = root;
  while (current !== null) {
    if (p.val < current.val && q.val < current.val) current = current.left;
    else if (p.val > current.val && q.val > current.val) current = current.right;
    else return current;
  }
  return null;
};

export const topKFrequent = (nums: number[], k: number): number[] => {
  const freq: Record<number, number> = {};
  for (let i = 0; i < nums.length; i += 1) freq[nums[i]] = (freq[nums[i]] || 0) + 1;
  type Pair = { count: number; value: number };
  const heap = new MinHeap<Pair>();
  Object.keys(freq).forEach((key) => {
    const value = parseInt(key, 10);
    heap.push({ count: freq[value], value });
    if (heap.size() > k) heap.pop();
  });
  const result = new Array(k);
  for (let i = k - 1; i >= 0; i -= 1) {
    result[i] = (heap.pop() as Pair).value;
  }
  return result;
};

export class MedianFinder {
  private low: MaxHeap<number>;
  private high: MinHeap<number>;

  constructor() {
    this.low = new MaxHeap<number>();
    this.high = new MinHeap<number>();
  }

  addNum(num: number): void {
    if (this.low.size() === 0 || num <= (this.low.peek() as number)) this.low.push(num);
    else this.high.push(num);
    if (this.low.size() > this.high.size() + 1) this.high.push(this.low.pop() as number);
    else if (this.high.size() > this.low.size()) this.low.push(this.high.pop() as number);
  }

  findMedian(): number {
    if (this.low.size() > this.high.size()) return this.low.peek() as number;
    return ((this.low.peek() as number) + (this.high.peek() as number)) / 2;
  }
}

export const kthLargestInArray = (nums: number[], k: number): number => {
  const heap = new MinHeap<number>();
  for (let i = 0; i < nums.length; i += 1) {
    heap.push(nums[i]);
    if (heap.size() > k) heap.pop();
  }
  return heap.peek() as number;
};

export const binaryTreeRightSideView = (root: TreeNode | null): number[] => {
  if (root === null) return [];
  const result = new ArrayList<number>();
  const queue = new Queue<TreeNode>();
  queue.enqueue(root);
  while (!queue.isEmpty()) {
    const temp = new Queue<TreeNode>();
    let lastVal = 0;
    while (!queue.isEmpty()) temp.enqueue(queue.dequeue() as TreeNode);
    while (!temp.isEmpty()) {
      const node = temp.dequeue() as TreeNode;
      lastVal = node.val;
      if (node.left) queue.enqueue(node.left);
      if (node.right) queue.enqueue(node.right);
    }
    result.add(lastVal);
  }
  return toArray(result);
};

class TrieNode {
  children: (TrieNode | null)[];
  isEnd: boolean;
  constructor() {
    this.children = new Array(26).fill(null);
    this.isEnd = false;
  }
}

export class Trie {
  private root: TrieNode;
  constructor() {
    this.root = new TrieNode();
  }

  insert(word: string): void {
    let node = this.root;
    for (let i = 0; i < word.length; i += 1) {
      const idx = word.charCodeAt(i) - 97;
      if (node.children[idx] === null) node.children[idx] = new TrieNode();
      node = node.children[idx] as TrieNode;
    }
    node.isEnd = true;
  }

  search(word: string): boolean {
    let node = this.root;
    for (let i = 0; i < word.length; i += 1) {
      const idx = word.charCodeAt(i) - 97;
      if (node.children[idx] === null) return false;
      node = node.children[idx] as TrieNode;
    }
    return node.isEnd;
  }

  startsWith(prefix: string): boolean {
    let node = this.root;
    for (let i = 0; i < prefix.length; i += 1) {
      const idx = prefix.charCodeAt(i) - 97;
      if (node.children[idx] === null) return false;
      node = node.children[idx] as TrieNode;
    }
    return true;
  }
}
export const binaryTreeLevelOrder = (root: TreeNode | null): number[][] => {
  if (root === null) return [];
  const result = new ArrayList<number[]>();
  const queue = new Queue<TreeNode>();
  queue.enqueue(root);
  while (!queue.isEmpty()) {
    const temp = new Queue<TreeNode>();
    let levelSize = 0;
    while (!queue.isEmpty()) {
      temp.enqueue(queue.dequeue() as TreeNode);
      levelSize += 1;
    }
    const level = new Array(levelSize);
    let i = 0;
    while (!temp.isEmpty()) {
      const node = temp.dequeue() as TreeNode;
      level[i] = node.val;
      if (node.left) queue.enqueue(node.left);
      if (node.right) queue.enqueue(node.right);
      i += 1;
    }
    result.add(level);
  }
  return toArray(result);
};
