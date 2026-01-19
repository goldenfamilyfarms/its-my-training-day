#include "shared/cpp/ds.hpp"

#include <string>
#include <unordered_map>
#include <unordered_set>
#include <vector>

static void quickSortInt(std::vector<int>& nums, int left, int right) {
    if (left >= right) return;
    int pivot = nums[(left + right) / 2];
    int i = left;
    int j = right;
    while (i <= j) {
        while (nums[i] < pivot) i += 1;
        while (nums[j] > pivot) j -= 1;
        if (i <= j) {
            int temp = nums[i];
            nums[i] = nums[j];
            nums[j] = temp;
            i += 1;
            j -= 1;
        }
    }
    if (left < j) quickSortInt(nums, left, j);
    if (i < right) quickSortInt(nums, i, right);
}

static void quickSortIntervals(std::vector<std::vector<int>>& intervals, int left, int right) {
    if (left >= right) return;
    std::vector<int> pivot = intervals[(left + right) / 2];
    int i = left;
    int j = right;
    while (i <= j) {
        while (intervals[i][0] < pivot[0]) i += 1;
        while (intervals[j][0] > pivot[0]) j -= 1;
        if (i <= j) {
            std::vector<int> temp = intervals[i];
            intervals[i] = intervals[j];
            intervals[j] = temp;
            i += 1;
            j -= 1;
        }
    }
    if (left < j) quickSortIntervals(intervals, left, j);
    if (i < right) quickSortIntervals(intervals, i, right);
}

template <typename T>
static std::vector<T> toVector(const ArrayList<T>& list) {
    std::vector<T> out(list.size());
    for (std::size_t i = 0; i < list.size(); ++i) {
        out[i] = list.get(i);
    }
    return out;
}

std::vector<int> twoSum(const std::vector<int>& nums, int target) {
    std::unordered_map<int, int> seen;
    for (int i = 0; i < static_cast<int>(nums.size()); ++i) {
        int need = target - nums[i];
        if (seen.find(need) != seen.end()) {
            std::vector<int> out(2);
            out[0] = seen[need];
            out[1] = i;
            return out;
        }
        seen[nums[i]] = i;
    }
    return std::vector<int>();
}

int bestTimeBuySellStock(const std::vector<int>& prices) {
    if (prices.empty()) return 0;
    int minPrice = prices[0];
    int maxProfit = 0;
    for (int i = 1; i < static_cast<int>(prices.size()); ++i) {
        if (prices[i] < minPrice) {
            minPrice = prices[i];
        } else {
            int profit = prices[i] - minPrice;
            if (profit > maxProfit) maxProfit = profit;
        }
    }
    return maxProfit;
}

bool containsDuplicate(const std::vector<int>& nums) {
    std::unordered_map<int, bool> seen;
    for (int i = 0; i < static_cast<int>(nums.size()); ++i) {
        if (seen.find(nums[i]) != seen.end()) return true;
        seen[nums[i]] = true;
    }
    return false;
}

std::vector<int> productExceptSelf(const std::vector<int>& nums) {
    int n = static_cast<int>(nums.size());
    std::vector<int> result(n, 1);
    int prefix = 1;
    for (int i = 0; i < n; ++i) {
        result[i] = prefix;
        prefix *= nums[i];
    }
    int suffix = 1;
    for (int i = n - 1; i >= 0; --i) {
        result[i] *= suffix;
        suffix *= nums[i];
    }
    return result;
}

int maximumSubarray(const std::vector<int>& nums) {
    int best = nums[0];
    int current = nums[0];
    for (int i = 1; i < static_cast<int>(nums.size()); ++i) {
        int val = nums[i];
        if (current + val > val) current = current + val;
        else current = val;
        if (current > best) best = current;
    }
    return best;
}

int maximumProductSubarray(const std::vector<int>& nums) {
    int maxVal = nums[0];
    int minVal = nums[0];
    int best = nums[0];
    for (int i = 1; i < static_cast<int>(nums.size()); ++i) {
        int val = nums[i];
        if (val < 0) {
            int tmp = maxVal;
            maxVal = minVal;
            minVal = tmp;
        }
        maxVal = std::max(val, maxVal * val);
        minVal = std::min(val, minVal * val);
        if (maxVal > best) best = maxVal;
    }
    return best;
}

int findMinRotated(const std::vector<int>& nums) {
    int left = 0;
    int right = static_cast<int>(nums.size()) - 1;
    while (left < right) {
        int mid = (left + right) / 2;
        if (nums[mid] > nums[right]) left = mid + 1;
        else right = mid;
    }
    return nums[left];
}

int searchRotated(const std::vector<int>& nums, int target) {
    int left = 0;
    int right = static_cast<int>(nums.size()) - 1;
    while (left <= right) {
        int mid = (left + right) / 2;
        if (nums[mid] == target) return mid;
        if (nums[left] <= nums[mid]) {
            if (nums[left] <= target && target < nums[mid]) right = mid - 1;
            else left = mid + 1;
        } else {
            if (nums[mid] < target && target <= nums[right]) left = mid + 1;
            else right = mid - 1;
        }
    }
    return -1;
}

std::vector<std::vector<int>> threeSum(std::vector<int> nums) {
    if (nums.size() < 3) return std::vector<std::vector<int>>();
    quickSortInt(nums, 0, static_cast<int>(nums.size()) - 1);
    ArrayList<std::vector<int>> result;
    for (int i = 0; i < static_cast<int>(nums.size()) - 2; ++i) {
        if (i > 0 && nums[i] == nums[i - 1]) continue;
        int left = i + 1;
        int right = static_cast<int>(nums.size()) - 1;
        while (left < right) {
            int total = nums[i] + nums[left] + nums[right];
            if (total == 0) {
                std::vector<int> triple(3);
                triple[0] = nums[i];
                triple[1] = nums[left];
                triple[2] = nums[right];
                result.add(triple);
                left += 1;
                right -= 1;
                while (left < right && nums[left] == nums[left - 1]) left += 1;
                while (left < right && nums[right] == nums[right + 1]) right -= 1;
            } else if (total < 0) {
                left += 1;
            } else {
                right -= 1;
            }
        }
    }
    return toVector(result);
}

int containerWithMostWater(const std::vector<int>& heights) {
    int left = 0;
    int right = static_cast<int>(heights.size()) - 1;
    int best = 0;
    while (left < right) {
        int width = right - left;
        if (heights[left] < heights[right]) {
            int area = heights[left] * width;
            if (area > best) best = area;
            left += 1;
        } else {
            int area = heights[right] * width;
            if (area > best) best = area;
            right -= 1;
        }
    }
    return best;
}

int sumOfTwoIntegers(int a, int b) {
    unsigned int mask = 0xFFFFFFFF;
    while (b != 0) {
        unsigned int carry = (a & b) & mask;
        a = (a ^ b) & mask;
        b = (carry << 1) & mask;
    }
    return a;
}

int numberOf1Bits(unsigned int n) {
    int count = 0;
    while (n != 0) {
        n &= (n - 1);
        count += 1;
    }
    return count;
}

std::vector<int> countingBits(int n) {
    std::vector<int> result(n + 1, 0);
    for (int i = 1; i <= n; ++i) {
        result[i] = result[i >> 1] + (i & 1);
    }
    return result;
}

int missingNumber(const std::vector<int>& nums) {
    int xorVal = 0;
    for (int i = 0; i < static_cast<int>(nums.size()); ++i) {
        xorVal ^= i;
        xorVal ^= nums[i];
    }
    xorVal ^= static_cast<int>(nums.size());
    return xorVal;
}

uint32_t reverseBits(uint32_t n) {
    uint32_t result = 0;
    for (int i = 0; i < 32; ++i) {
        result = (result << 1) | (n & 1);
        n >>= 1;
    }
    return result;
}

int climbingStairs(int n) {
    if (n <= 2) return n;
    int prev2 = 1;
    int prev1 = 2;
    for (int i = 3; i <= n; ++i) {
        int current = prev1 + prev2;
        prev2 = prev1;
        prev1 = current;
    }
    return prev1;
}

int coinChange(const std::vector<int>& coins, int amount) {
    std::vector<int> dp(amount + 1, amount + 1);
    dp[0] = 0;
    for (int i = 1; i <= amount; ++i) {
        for (int j = 0; j < static_cast<int>(coins.size()); ++j) {
            int coin = coins[j];
            if (coin <= i) {
                int cand = dp[i - coin] + 1;
                if (cand < dp[i]) dp[i] = cand;
            }
        }
    }
    return dp[amount] == amount + 1 ? -1 : dp[amount];
}

int longestIncreasingSubsequence(const std::vector<int>& nums) {
    if (nums.empty()) return 0;
    std::vector<int> tails(nums.size(), 0);
    int size = 0;
    for (int i = 0; i < static_cast<int>(nums.size()); ++i) {
        int val = nums[i];
        int left = 0;
        int right = size;
        while (left < right) {
            int mid = (left + right) / 2;
            if (tails[mid] < val) left = mid + 1;
            else right = mid;
        }
        tails[left] = val;
        if (left == size) size += 1;
    }
    return size;
}

int longestCommonSubsequence(const std::string& text1, const std::string& text2) {
    int n = static_cast<int>(text1.size());
    int m = static_cast<int>(text2.size());
    std::vector<std::vector<int>> dp(n + 1, std::vector<int>(m + 1, 0));
    for (int i = 1; i <= n; ++i) {
        for (int j = 1; j <= m; ++j) {
            if (text1[i - 1] == text2[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
            else dp[i][j] = std::max(dp[i - 1][j], dp[i][j - 1]);
        }
    }
    return dp[n][m];
}

bool wordBreak(const std::string& s, const std::vector<std::string>& wordDict) {
    std::unordered_map<std::string, bool> wordSet;
    for (int i = 0; i < static_cast<int>(wordDict.size()); ++i) {
        wordSet[wordDict[i]] = true;
    }
    std::vector<bool> dp(s.size() + 1, false);
    dp[0] = true;
    for (int i = 1; i <= static_cast<int>(s.size()); ++i) {
        for (int j = 0; j < i; ++j) {
            if (dp[j] && wordSet.find(s.substr(j, i - j)) != wordSet.end()) {
                dp[i] = true;
                break;
            }
        }
    }
    return dp[s.size()];
}

std::vector<std::vector<int>> combinationSum(const std::vector<int>& candidates, int target) {
    ArrayList<std::vector<int>> result;
    ArrayList<int> path;

    std::function<void(int, int)> backtrack = [&](int start, int total) {
        if (total == target) {
            result.add(toVector(path));
            return;
        }
        if (total > target) return;
        for (int i = start; i < static_cast<int>(candidates.size()); ++i) {
            path.add(candidates[i]);
            backtrack(i, total + candidates[i]);
            path.removeLast();
        }
    };

    backtrack(0, 0);
    return toVector(result);
}

int houseRobber(const std::vector<int>& nums) {
    int prev1 = 0;
    int prev2 = 0;
    for (int i = 0; i < static_cast<int>(nums.size()); ++i) {
        int take = prev2 + nums[i];
        int skip = prev1;
        int current = take > skip ? take : skip;
        prev2 = prev1;
        prev1 = current;
    }
    return prev1;
}

int houseRobberII(const std::vector<int>& nums) {
    if (nums.empty()) return 0;
    if (nums.size() == 1) return nums[0];
    auto robRange = [&](int left, int right) {
        int prev1 = 0;
        int prev2 = 0;
        for (int i = left; i <= right; ++i) {
            int take = prev2 + nums[i];
            int skip = prev1;
            int current = take > skip ? take : skip;
            prev2 = prev1;
            prev1 = current;
        }
        return prev1;
    };
    int a = robRange(0, static_cast<int>(nums.size()) - 2);
    int b = robRange(1, static_cast<int>(nums.size()) - 1);
    return a > b ? a : b;
}

int decodeWays(const std::string& s) {
    if (s.empty() || s[0] == '0') return 0;
    int prev2 = 1;
    int prev1 = 1;
    for (int i = 1; i < static_cast<int>(s.size()); ++i) {
        int current = 0;
        if (s[i] != '0') current += prev1;
        int two = (s[i - 1] - '0') * 10 + (s[i] - '0');
        if (two >= 10 && two <= 26) current += prev2;
        prev2 = prev1;
        prev1 = current;
    }
    return prev1;
}

int uniquePaths(int m, int n) {
    std::vector<int> dp(n, 1);
    for (int i = 1; i < m; ++i) {
        for (int j = 1; j < n; ++j) {
            dp[j] = dp[j] + dp[j - 1];
        }
    }
    return dp[n - 1];
}

bool jumpGame(const std::vector<int>& nums) {
    int reach = 0;
    for (int i = 0; i < static_cast<int>(nums.size()); ++i) {
        if (i > reach) return false;
        if (i + nums[i] > reach) reach = i + nums[i];
    }
    return true;
}

struct GraphNode {
    int val;
    ArrayList<GraphNode*> neighbors;
    GraphNode(int v) : val(v), neighbors() {}
};

GraphNode* cloneGraph(GraphNode* node) {
    if (node == nullptr) return nullptr;
    std::unordered_map<GraphNode*, GraphNode*> clones;
    std::function<GraphNode*(GraphNode*)> dfs = [&](GraphNode* curr) {
        if (clones.find(curr) != clones.end()) return clones[curr];
        GraphNode* copy = new GraphNode(curr->val);
        clones[curr] = copy;
        for (std::size_t i = 0; i < curr->neighbors.size(); ++i) {
            copy->neighbors.add(dfs(curr->neighbors.get(i)));
        }
        return copy;
    };
    return dfs(node);
}

bool courseSchedule(int numCourses, const std::vector<std::vector<int>>& prerequisites) {
    std::vector<ArrayList<int>> graph(numCourses);
    std::vector<int> indegree(numCourses, 0);
    for (int i = 0; i < static_cast<int>(prerequisites.size()); ++i) {
        int a = prerequisites[i][0];
        int b = prerequisites[i][1];
        graph[b].add(a);
        indegree[a] += 1;
    }
    Queue<int> queue;
    for (int i = 0; i < numCourses; ++i) {
        if (indegree[i] == 0) queue.enqueue(i);
    }
    int visited = 0;
    while (!queue.empty()) {
        int node = queue.dequeue();
        visited += 1;
        ArrayList<int>& neighbors = graph[node];
        for (std::size_t i = 0; i < neighbors.size(); ++i) {
            int next = neighbors.get(i);
            indegree[next] -= 1;
            if (indegree[next] == 0) queue.enqueue(next);
        }
    }
    return visited == numCourses;
}

std::vector<std::vector<int>> pacificAtlantic(std::vector<std::vector<int>> heights) {
    int rows = static_cast<int>(heights.size());
    if (rows == 0) return std::vector<std::vector<int>>();
    int cols = static_cast<int>(heights[0].size());
    std::vector<std::vector<bool>> pac(rows, std::vector<bool>(cols, false));
    std::vector<std::vector<bool>> atl(rows, std::vector<bool>(cols, false));

    std::function<void(int, int, std::vector<std::vector<bool>>&)> dfs =
        [&](int r, int c, std::vector<std::vector<bool>>& visited) {
            visited[r][c] = true;
            int dr[4] = {1, -1, 0, 0};
            int dc[4] = {0, 0, 1, -1};
            for (int i = 0; i < 4; ++i) {
                int nr = r + dr[i];
                int nc = c + dc[i];
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                    if (!visited[nr][nc] && heights[nr][nc] >= heights[r][c]) {
                        dfs(nr, nc, visited);
                    }
                }
            }
        };

    for (int r = 0; r < rows; ++r) {
        dfs(r, 0, pac);
        dfs(r, cols - 1, atl);
    }
    for (int c = 0; c < cols; ++c) {
        dfs(0, c, pac);
        dfs(rows - 1, c, atl);
    }

    ArrayList<std::vector<int>> result;
    for (int r = 0; r < rows; ++r) {
        for (int c = 0; c < cols; ++c) {
            if (pac[r][c] && atl[r][c]) {
                std::vector<int> cell(2);
                cell[0] = r;
                cell[1] = c;
                result.add(cell);
            }
        }
    }
    return toVector(result);
}

int numberOfIslands(std::vector<std::vector<char>> grid) {
    if (grid.empty()) return 0;
    int rows = static_cast<int>(grid.size());
    int cols = static_cast<int>(grid[0].size());
    int count = 0;
    std::function<void(int, int)> dfs = [&](int r, int c) {
        if (r < 0 || r >= rows || c < 0 || c >= cols) return;
        if (grid[r][c] != '1') return;
        grid[r][c] = '0';
        dfs(r + 1, c);
        dfs(r - 1, c);
        dfs(r, c + 1);
        dfs(r, c - 1);
    };
    for (int r = 0; r < rows; ++r) {
        for (int c = 0; c < cols; ++c) {
            if (grid[r][c] == '1') {
                count += 1;
                dfs(r, c);
            }
        }
    }
    return count;
}

int longestConsecutive(const std::vector<int>& nums) {
    std::unordered_map<int, bool> seen;
    for (int i = 0; i < static_cast<int>(nums.size()); ++i) {
        seen[nums[i]] = true;
    }
    int longest = 0;
    for (int val : nums) {
        if (seen.find(val - 1) == seen.end()) {
            int length = 1;
            int current = val + 1;
            while (seen.find(current) != seen.end()) {
                length += 1;
                current += 1;
            }
            if (length > longest) longest = length;
        }
    }
    return longest;
}

std::string alienDictionary(const std::vector<std::string>& words) {
    std::unordered_map<char, ArrayList<char>> graph;
    std::unordered_map<char, int> indegree;
    for (const std::string& w : words) {
        for (char ch : w) {
            if (graph.find(ch) == graph.end()) graph[ch] = ArrayList<char>();
            if (indegree.find(ch) == indegree.end()) indegree[ch] = 0;
        }
    }
    for (int i = 0; i + 1 < static_cast<int>(words.size()); ++i) {
        const std::string& a = words[i];
        const std::string& b = words[i + 1];
        int j = 0;
        while (j < static_cast<int>(a.size()) && j < static_cast<int>(b.size()) && a[j] == b[j]) {
            j += 1;
        }
        if (j < static_cast<int>(a.size()) && j < static_cast<int>(b.size())) {
            graph[a[j]].add(b[j]);
            indegree[b[j]] += 1;
        } else if (a.size() > b.size()) {
            return "";
        }
    }
    Queue<char> queue;
    for (auto& kv : indegree) {
        if (kv.second == 0) queue.enqueue(kv.first);
    }
    ArrayList<char> order;
    while (!queue.empty()) {
        char ch = queue.dequeue();
        order.add(ch);
        ArrayList<char>& neighbors = graph[ch];
        for (std::size_t i = 0; i < neighbors.size(); ++i) {
            char nxt = neighbors.get(i);
            indegree[nxt] -= 1;
            if (indegree[nxt] == 0) queue.enqueue(nxt);
        }
    }
    if (order.size() != indegree.size()) return "";
    std::string result;
    std::vector<char> orderVec = toVector(order);
    result.assign(orderVec.begin(), orderVec.end());
    return result;
}

bool graphValidTree(int n, const std::vector<std::vector<int>>& edges) {
    if (static_cast<int>(edges.size()) != n - 1) return false;
    std::vector<int> parent(n);
    for (int i = 0; i < n; ++i) parent[i] = i;
    auto find = [&](int x) {
        int root = x;
        while (parent[root] != root) root = parent[root];
        while (parent[x] != x) {
            int next = parent[x];
            parent[x] = root;
            x = next;
        }
        return root;
    };
    for (int i = 0; i < static_cast<int>(edges.size()); ++i) {
        int a = edges[i][0];
        int b = edges[i][1];
        int pa = find(a);
        int pb = find(b);
        if (pa == pb) return false;
        parent[pb] = pa;
    }
    return true;
}

int numberOfConnectedComponents(int n, const std::vector<std::vector<int>>& edges) {
    std::vector<int> parent(n);
    for (int i = 0; i < n; ++i) parent[i] = i;
    int count = n;
    auto find = [&](int x) {
        int root = x;
        while (parent[root] != root) root = parent[root];
        while (parent[x] != x) {
            int next = parent[x];
            parent[x] = root;
            x = next;
        }
        return root;
    };
    for (int i = 0; i < static_cast<int>(edges.size()); ++i) {
        int a = edges[i][0];
        int b = edges[i][1];
        int pa = find(a);
        int pb = find(b);
        if (pa != pb) {
            parent[pb] = pa;
            count -= 1;
        }
    }
    return count;
}

std::vector<std::vector<int>> insertInterval(std::vector<std::vector<int>> intervals, std::vector<int> newInterval) {
    ArrayList<std::vector<int>> result;
    int i = 0;
    while (i < static_cast<int>(intervals.size()) && intervals[i][1] < newInterval[0]) {
        result.add(intervals[i]);
        i += 1;
    }
    while (i < static_cast<int>(intervals.size()) && intervals[i][0] <= newInterval[1]) {
        if (intervals[i][0] < newInterval[0]) newInterval[0] = intervals[i][0];
        if (intervals[i][1] > newInterval[1]) newInterval[1] = intervals[i][1];
        i += 1;
    }
    result.add(newInterval);
    while (i < static_cast<int>(intervals.size())) {
        result.add(intervals[i]);
        i += 1;
    }
    return toVector(result);
}

std::vector<std::vector<int>> mergeIntervals(std::vector<std::vector<int>> intervals) {
    if (intervals.empty()) return std::vector<std::vector<int>>();
    quickSortIntervals(intervals, 0, static_cast<int>(intervals.size()) - 1);
    ArrayList<std::vector<int>> result;
    std::vector<int> current = intervals[0];
    for (int i = 1; i < static_cast<int>(intervals.size()); ++i) {
        if (intervals[i][0] <= current[1]) {
            if (intervals[i][1] > current[1]) current[1] = intervals[i][1];
        } else {
            result.add(current);
            current = intervals[i];
        }
    }
    result.add(current);
    return toVector(result);
}

int nonOverlappingIntervals(std::vector<std::vector<int>> intervals) {
    if (intervals.empty()) return 0;
    quickSortIntervals(intervals, 0, static_cast<int>(intervals.size()) - 1);
    int count = 0;
    int end = intervals[0][1];
    for (int i = 1; i < static_cast<int>(intervals.size()); ++i) {
        if (intervals[i][0] < end) {
            count += 1;
            if (intervals[i][1] < end) end = intervals[i][1];
        } else {
            end = intervals[i][1];
        }
    }
    return count;
}

bool meetingRooms(std::vector<std::vector<int>> intervals) {
    if (intervals.empty()) return true;
    quickSortIntervals(intervals, 0, static_cast<int>(intervals.size()) - 1);
    for (int i = 1; i < static_cast<int>(intervals.size()); ++i) {
        if (intervals[i][0] < intervals[i - 1][1]) return false;
    }
    return true;
}

int meetingRoomsII(std::vector<std::vector<int>> intervals) {
    if (intervals.empty()) return 0;
    quickSortIntervals(intervals, 0, static_cast<int>(intervals.size()) - 1);
    MinHeap<int> heap;
    heap.push(intervals[0][1]);
    for (int i = 1; i < static_cast<int>(intervals.size()); ++i) {
        if (heap.size() > 0 && intervals[i][0] >= heap.peek()) {
            heap.pop();
        }
        heap.push(intervals[i][1]);
    }
    return static_cast<int>(heap.size());
}

ListNode<int>* reverseLinkedList(ListNode<int>* head) {
    ListNode<int>* prev = nullptr;
    ListNode<int>* current = head;
    while (current != nullptr) {
        ListNode<int>* next = current->next;
        current->next = prev;
        prev = current;
        current = next;
    }
    return prev;
}

bool detectCycle(ListNode<int>* head) {
    ListNode<int>* slow = head;
    ListNode<int>* fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) return true;
    }
    return false;
}

ListNode<int>* mergeTwoSortedLists(ListNode<int>* l1, ListNode<int>* l2) {
    ListNode<int> dummy(0);
    ListNode<int>* current = &dummy;
    while (l1 && l2) {
        if (l1->val <= l2->val) {
            current->next = l1;
            l1 = l1->next;
        } else {
            current->next = l2;
            l2 = l2->next;
        }
        current = current->next;
    }
    current->next = l1 ? l1 : l2;
    return dummy.next;
}

ListNode<int>* mergeKSortedLists(const std::vector<ListNode<int>*>& lists) {
    struct HeapNode {
        int val;
        int idx;
        ListNode<int>* node;
        bool operator<(const HeapNode& other) const { return val < other.val; }
        bool operator>(const HeapNode& other) const { return val > other.val; }
    };
    MinHeap<HeapNode> heap;
    for (int i = 0; i < static_cast<int>(lists.size()); ++i) {
        if (lists[i]) {
            heap.push({lists[i]->val, i, lists[i]});
        }
    }
    ListNode<int> dummy(0);
    ListNode<int>* current = &dummy;
    while (heap.size() > 0) {
        HeapNode top = heap.pop();
        current->next = top.node;
        current = current->next;
        if (top.node->next) {
            heap.push({top.node->next->val, top.idx, top.node->next});
        }
    }
    return dummy.next;
}

ListNode<int>* removeNthFromEnd(ListNode<int>* head, int n) {
    ListNode<int> dummy(0);
    dummy.next = head;
    ListNode<int>* fast = &dummy;
    ListNode<int>* slow = &dummy;
    for (int i = 0; i < n + 1; ++i) {
        fast = fast->next;
    }
    while (fast) {
        fast = fast->next;
        slow = slow->next;
    }
    slow->next = slow->next->next;
    return dummy.next;
}

void reorderList(ListNode<int>* head) {
    if (!head || !head->next) return;
    ListNode<int>* slow = head;
    ListNode<int>* fast = head;
    while (fast->next && fast->next->next) {
        slow = slow->next;
        fast = fast->next->next;
    }
    ListNode<int>* second = reverseLinkedList(slow->next);
    slow->next = nullptr;
    ListNode<int>* first = head;
    while (second) {
        ListNode<int>* temp1 = first->next;
        ListNode<int>* temp2 = second->next;
        first->next = second;
        second->next = temp1;
        first = temp1;
        second = temp2;
    }
}

void setMatrixZeroes(std::vector<std::vector<int>>& matrix) {
    int rows = static_cast<int>(matrix.size());
    int cols = static_cast<int>(matrix[0].size());
    bool rowZero = false;
    bool colZero = false;
    for (int r = 0; r < rows; ++r) {
        if (matrix[r][0] == 0) colZero = true;
    }
    for (int c = 0; c < cols; ++c) {
        if (matrix[0][c] == 0) rowZero = true;
    }
    for (int r = 1; r < rows; ++r) {
        for (int c = 1; c < cols; ++c) {
            if (matrix[r][c] == 0) {
                matrix[r][0] = 0;
                matrix[0][c] = 0;
            }
        }
    }
    for (int r = 1; r < rows; ++r) {
        if (matrix[r][0] == 0) {
            for (int c = 1; c < cols; ++c) {
                matrix[r][c] = 0;
            }
        }
    }
    for (int c = 1; c < cols; ++c) {
        if (matrix[0][c] == 0) {
            for (int r = 1; r < rows; ++r) {
                matrix[r][c] = 0;
            }
        }
    }
    if (rowZero) {
        for (int c = 0; c < cols; ++c) matrix[0][c] = 0;
    }
    if (colZero) {
        for (int r = 0; r < rows; ++r) matrix[r][0] = 0;
    }
}

std::vector<int> spiralMatrix(const std::vector<std::vector<int>>& matrix) {
    ArrayList<int> result;
    int top = 0;
    int bottom = static_cast<int>(matrix.size()) - 1;
    int left = 0;
    int right = static_cast<int>(matrix[0].size()) - 1;
    while (top <= bottom && left <= right) {
        for (int i = left; i <= right; ++i) result.add(matrix[top][i]);
        top += 1;
        for (int i = top; i <= bottom; ++i) result.add(matrix[i][right]);
        right -= 1;
        if (top <= bottom) {
            for (int i = right; i >= left; --i) result.add(matrix[bottom][i]);
            bottom -= 1;
        }
        if (left <= right) {
            for (int i = bottom; i >= top; --i) result.add(matrix[i][left]);
            left += 1;
        }
    }
    return toVector(result);
}

void rotateImage(std::vector<std::vector<int>>& matrix) {
    int n = static_cast<int>(matrix.size());
    for (int layer = 0; layer < n / 2; ++layer) {
        int first = layer;
        int last = n - 1 - layer;
        for (int i = first; i < last; ++i) {
            int offset = i - first;
            int top = matrix[first][i];
            matrix[first][i] = matrix[last - offset][first];
            matrix[last - offset][first] = matrix[last][last - offset];
            matrix[last][last - offset] = matrix[i][last];
            matrix[i][last] = top;
        }
    }
}

bool wordSearch(std::vector<std::vector<char>>& board, const std::string& word) {
    int rows = static_cast<int>(board.size());
    int cols = static_cast<int>(board[0].size());
    std::function<bool(int, int, int)> dfs = [&](int r, int c, int idx) {
        if (idx == static_cast<int>(word.size())) return true;
        if (r < 0 || r >= rows || c < 0 || c >= cols) return false;
        if (board[r][c] != word[idx]) return false;
        char temp = board[r][c];
        board[r][c] = '#';
        bool found = dfs(r + 1, c, idx + 1) || dfs(r - 1, c, idx + 1) ||
                     dfs(r, c + 1, idx + 1) || dfs(r, c - 1, idx + 1);
        board[r][c] = temp;
        return found;
    };
    for (int r = 0; r < rows; ++r) {
        for (int c = 0; c < cols; ++c) {
            if (dfs(r, c, 0)) return true;
        }
    }
    return false;
}

int longestSubstringWithoutRepeating(const std::string& s) {
    std::unordered_map<char, int> last;
    int left = 0;
    int best = 0;
    for (int right = 0; right < static_cast<int>(s.size()); ++right) {
        char ch = s[right];
        if (last.find(ch) != last.end() && last[ch] >= left) {
            left = last[ch] + 1;
        }
        last[ch] = right;
        int length = right - left + 1;
        if (length > best) best = length;
    }
    return best;
}

int longestRepeatingCharacterReplacement(const std::string& s, int k) {
    std::unordered_map<char, int> counts;
    int left = 0;
    int maxCount = 0;
    int best = 0;
    for (int right = 0; right < static_cast<int>(s.size()); ++right) {
        char ch = s[right];
        counts[ch] += 1;
        if (counts[ch] > maxCount) maxCount = counts[ch];
        int window = right - left + 1;
        if (window - maxCount > k) {
            counts[s[left]] -= 1;
            left += 1;
        } else {
            if (window > best) best = window;
        }
    }
    return best;
}

std::string minimumWindowSubstring(const std::string& s, const std::string& t) {
    if (t.empty()) return "";
    std::unordered_map<char, int> target;
    for (char ch : t) target[ch] += 1;
    int need = static_cast<int>(target.size());
    int formed = 0;
    std::unordered_map<char, int> window;
    int left = 0;
    int bestLen = 1 << 30;
    int bestL = 0;
    int bestR = 0;
    for (int right = 0; right < static_cast<int>(s.size()); ++right) {
        char ch = s[right];
        window[ch] += 1;
        if (target.find(ch) != target.end() && window[ch] == target[ch]) {
            formed += 1;
        }
        while (left <= right && formed == need) {
            if (right - left + 1 < bestLen) {
                bestLen = right - left + 1;
                bestL = left;
                bestR = right;
            }
            char leftCh = s[left];
            window[leftCh] -= 1;
            if (target.find(leftCh) != target.end() && window[leftCh] < target[leftCh]) {
                formed -= 1;
            }
            left += 1;
        }
    }
    if (bestLen == (1 << 30)) return "";
    return s.substr(bestL, bestLen);
}

bool validAnagram(const std::string& s, const std::string& t) {
    if (s.size() != t.size()) return false;
    std::unordered_map<char, int> count;
    for (char ch : s) count[ch] += 1;
    for (char ch : t) {
        if (count.find(ch) == count.end()) return false;
        count[ch] -= 1;
        if (count[ch] < 0) return false;
    }
    return true;
}

std::vector<std::vector<std::string>> groupAnagrams(const std::vector<std::string>& strs) {
    std::unordered_map<std::string, ArrayList<std::string>> groups;
    for (const std::string& s : strs) {
        int count[26] = {0};
        for (char ch : s) count[ch - 'a'] += 1;
        std::string key;
        for (int i = 0; i < 26; ++i) {
            key += std::to_string(count[i]) + "#";
        }
        if (groups.find(key) == groups.end()) groups[key] = ArrayList<std::string>();
        groups[key].add(s);
    }
    ArrayList<std::vector<std::string>> result;
    for (auto& kv : groups) {
        result.add(toVector(kv.second));
    }
    return toVector(result);
}

bool validParentheses(const std::string& s) {
    Stack<char> stack;
    std::unordered_map<char, char> pairs;
    pairs[')'] = '(';
    pairs[']'] = '[';
    pairs['}'] = '{';
    for (char ch : s) {
        if (pairs.find(ch) != pairs.end()) {
            char top = stack.pop();
            if (top == 0 || top != pairs[ch]) return false;
        } else {
            stack.push(ch);
        }
    }
    return stack.empty();
}

bool validPalindrome(const std::string& s) {
    int left = 0;
    int right = static_cast<int>(s.size()) - 1;
    while (left < right) {
        while (left < right && !std::isalnum(s[left])) left += 1;
        while (left < right && !std::isalnum(s[right])) right -= 1;
        if (std::tolower(s[left]) != std::tolower(s[right])) return false;
        left += 1;
        right -= 1;
    }
    return true;
}

std::string longestPalindromicSubstring(const std::string& s) {
    if (s.empty()) return "";
    int start = 0;
    int end = 0;
    auto expand = [&](int l, int r) {
        int left = l;
        int right = r;
        while (left >= 0 && right < static_cast<int>(s.size()) && s[left] == s[right]) {
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
    for (int i = 0; i < static_cast<int>(s.size()); ++i) {
        expand(i, i);
        expand(i, i + 1);
    }
    return s.substr(start, end - start + 1);
}

int palindromicSubstrings(const std::string& s) {
    int count = 0;
    auto expand = [&](int l, int r) {
        int left = l;
        int right = r;
        while (left >= 0 && right < static_cast<int>(s.size()) && s[left] == s[right]) {
            count += 1;
            left -= 1;
            right += 1;
        }
    };
    for (int i = 0; i < static_cast<int>(s.size()); ++i) {
        expand(i, i);
        expand(i, i + 1);
    }
    return count;
}

std::string encodeStrings(const std::vector<std::string>& strs) {
    ArrayList<std::string> parts;
    for (int i = 0; i < static_cast<int>(strs.size()); ++i) {
        parts.add(std::to_string(strs[i].size()));
        parts.add("#");
        parts.add(strs[i]);
    }
    std::vector<std::string> out = toVector(parts);
    std::string result;
    for (int i = 0; i < static_cast<int>(out.size()); ++i) {
        result += out[i];
    }
    return result;
}

std::vector<std::string> decodeStrings(const std::string& s) {
    ArrayList<std::string> result;
    int i = 0;
    while (i < static_cast<int>(s.size())) {
        int j = i;
        while (s[j] != '#') j += 1;
        int length = std::stoi(s.substr(i, j - i));
        int start = j + 1;
        result.add(s.substr(start, length));
        i = start + length;
    }
    return toVector(result);
}

int maxDepthBinaryTree(TreeNode* root) {
    if (!root) return 0;
    int left = maxDepthBinaryTree(root->left);
    int right = maxDepthBinaryTree(root->right);
    return 1 + (left > right ? left : right);
}

bool sameTree(TreeNode* p, TreeNode* q) {
    if (!p && !q) return true;
    if (!p || !q) return false;
    if (p->val != q->val) return false;
    return sameTree(p->left, q->left) && sameTree(p->right, q->right);
}

TreeNode* invertBinaryTree(TreeNode* root) {
    if (!root) return nullptr;
    TreeNode* left = invertBinaryTree(root->left);
    TreeNode* right = invertBinaryTree(root->right);
    root->left = right;
    root->right = left;
    return root;
}

int binaryTreeMaxPathSum(TreeNode* root) {
    int best = -1000000000;
    std::function<int(TreeNode*)> dfs = [&](TreeNode* node) {
        if (!node) return 0;
        int left = dfs(node->left);
        int right = dfs(node->right);
        if (left < 0) left = 0;
        if (right < 0) right = 0;
        int total = node->val + left + right;
        if (total > best) best = total;
        return node->val + (left > right ? left : right);
    };
    dfs(root);
    return best;
}

std::vector<std::vector<int>> binaryTreeLevelOrder(TreeNode* root) {
    if (!root) return std::vector<std::vector<int>>();
    ArrayList<std::vector<int>> result;
    Queue<TreeNode*> queue;
    queue.enqueue(root);
    while (!queue.empty()) {
        Queue<TreeNode*> temp;
        int levelSize = 0;
        while (!queue.empty()) {
            temp.enqueue(queue.dequeue());
            levelSize += 1;
        }
        std::vector<int> level(levelSize);
        int i = 0;
        while (!temp.empty()) {
            TreeNode* node = temp.dequeue();
            level[i] = node->val;
            if (node->left) queue.enqueue(node->left);
            if (node->right) queue.enqueue(node->right);
            i += 1;
        }
        result.add(level);
    }
    return toVector(result);
}

std::string serializeBinaryTree(TreeNode* root) {
    if (!root) return "";
    ArrayList<std::string> result;
    Queue<TreeNode*> queue;
    queue.enqueue(root);
    while (!queue.empty()) {
        TreeNode* node = queue.dequeue();
        if (!node) {
            result.add("#");
        } else {
            result.add(std::to_string(node->val));
            queue.enqueue(node->left);
            queue.enqueue(node->right);
        }
    }
    std::vector<std::string> out = toVector(result);
    std::string s;
    for (int i = 0; i < static_cast<int>(out.size()); ++i) {
        if (i > 0) s += ",";
        s += out[i];
    }
    return s;
}

TreeNode* deserializeBinaryTree(const std::string& data) {
    if (data.empty()) return nullptr;
    ArrayList<std::string> valuesList;
    std::string token;
    for (int i = 0; i <= static_cast<int>(data.size()); ++i) {
        if (i == static_cast<int>(data.size()) || data[i] == ',') {
            valuesList.add(token);
            token.clear();
        } else {
            token += data[i];
        }
    }
    std::vector<std::string> values = toVector(valuesList);
    if (values[0] == "#") return nullptr;
    TreeNode* root = new TreeNode(std::stoi(values[0]));
    Queue<TreeNode*> queue;
    queue.enqueue(root);
    int i = 1;
    while (i < static_cast<int>(values.size())) {
        TreeNode* node = queue.dequeue();
        if (values[i] != "#") {
            node->left = new TreeNode(std::stoi(values[i]));
            queue.enqueue(node->left);
        }
        i += 1;
        if (i < static_cast<int>(values.size()) && values[i] != "#") {
            node->right = new TreeNode(std::stoi(values[i]));
            queue.enqueue(node->right);
        }
        i += 1;
    }
    return root;
}

bool subtreeOfAnotherTree(TreeNode* root, TreeNode* subRoot) {
    std::function<bool(TreeNode*, TreeNode*)> same = [&](TreeNode* a, TreeNode* b) {
        if (!a && !b) return true;
        if (!a || !b) return false;
        if (a->val != b->val) return false;
        return same(a->left, b->left) && same(a->right, b->right);
    };
    if (!root) return subRoot == nullptr;
    if (same(root, subRoot)) return true;
    return subtreeOfAnotherTree(root->left, subRoot) || subtreeOfAnotherTree(root->right, subRoot);
}

TreeNode* buildTreePreIn(const std::vector<int>& preorder, const std::vector<int>& inorder) {
    std::unordered_map<int, int> index;
    for (int i = 0; i < static_cast<int>(inorder.size()); ++i) {
        index[inorder[i]] = i;
    }
    std::function<TreeNode*(int, int, int, int)> helper = [&](int preL, int preR, int inL, int inR) {
        if (preL > preR) return static_cast<TreeNode*>(nullptr);
        int rootVal = preorder[preL];
        TreeNode* root = new TreeNode(rootVal);
        int mid = index[rootVal];
        int leftSize = mid - inL;
        root->left = helper(preL + 1, preL + leftSize, inL, mid - 1);
        root->right = helper(preL + leftSize + 1, preR, mid + 1, inR);
        return root;
    };
    return helper(0, static_cast<int>(preorder.size()) - 1, 0, static_cast<int>(inorder.size()) - 1);
}

bool validateBST(TreeNode* root) {
    std::function<bool(TreeNode*, long long, long long)> helper = [&](TreeNode* node, long long low, long long high) {
        if (!node) return true;
        if (node->val <= low || node->val >= high) return false;
        return helper(node->left, low, node->val) && helper(node->right, node->val, high);
    };
    return helper(root, -1000000000000LL, 1000000000000LL);
}

int kthSmallestBST(TreeNode* root, int k) {
    Stack<TreeNode*> stack;
    TreeNode* current = root;
    int count = 0;
    while (current || !stack.empty()) {
        while (current) {
            stack.push(current);
            current = current->left;
        }
        current = stack.pop();
        count += 1;
        if (count == k) return current->val;
        current = current->right;
    }
    return -1;
}

TreeNode* lcaBST(TreeNode* root, TreeNode* p, TreeNode* q) {
    TreeNode* current = root;
    while (current) {
        if (p->val < current->val && q->val < current->val) {
            current = current->left;
        } else if (p->val > current->val && q->val > current->val) {
            current = current->right;
        } else {
            return current;
        }
    }
    return nullptr;
}

std::vector<int> topKFrequent(const std::vector<int>& nums, int k) {
    std::unordered_map<int, int> freq;
    for (int val : nums) freq[val] += 1;
    struct Pair {
        int count;
        int value;
        bool operator<(const Pair& other) const { return count < other.count; }
        bool operator>(const Pair& other) const { return count > other.count; }
    };
    MinHeap<Pair> heap;
    for (auto& kv : freq) {
        heap.push({kv.second, kv.first});
        if (static_cast<int>(heap.size()) > k) heap.pop();
    }
    std::vector<int> result(k);
    for (int i = k - 1; i >= 0; --i) {
        result[i] = heap.pop().value;
    }
    return result;
}

class MedianFinder {
public:
    void addNum(int num) {
        if (low.size() == 0 || num <= low.peek()) low.push(num);
        else high.push(num);
        if (low.size() > high.size() + 1) high.push(low.pop());
        else if (high.size() > low.size()) low.push(high.pop());
    }

    double findMedian() {
        if (low.size() > high.size()) return static_cast<double>(low.peek());
        return (low.peek() + high.peek()) / 2.0;
    }

private:
    MaxHeap<int> low;
    MinHeap<int> high;
};

int kthLargestInArray(const std::vector<int>& nums, int k) {
    MinHeap<int> heap;
    for (int i = 0; i < static_cast<int>(nums.size()); ++i) {
        heap.push(nums[i]);
        if (static_cast<int>(heap.size()) > k) heap.pop();
    }
    return heap.peek();
}

std::vector<int> binaryTreeRightSideView(TreeNode* root) {
    if (!root) return std::vector<int>();
    ArrayList<int> result;
    Queue<TreeNode*> queue;
    queue.enqueue(root);
    while (!queue.empty()) {
        Queue<TreeNode*> temp;
        int levelSize = 0;
        while (!queue.empty()) {
            temp.enqueue(queue.dequeue());
            levelSize += 1;
        }
        int lastVal = 0;
        while (!temp.empty()) {
            TreeNode* node = temp.dequeue();
            lastVal = node->val;
            if (node->left) queue.enqueue(node->left);
            if (node->right) queue.enqueue(node->right);
        }
        result.add(lastVal);
    }
    return toVector(result);
}

class TrieNode {
public:
    TrieNode() : isEnd(false) {
        for (int i = 0; i < 26; ++i) children[i] = nullptr;
    }
    TrieNode* children[26];
    bool isEnd;
};

class Trie {
public:
    Trie() : root(new TrieNode()) {}

    void insert(const std::string& word) {
        TrieNode* node = root;
        for (int i = 0; i < static_cast<int>(word.size()); ++i) {
            int idx = word[i] - 'a';
            if (node->children[idx] == nullptr) node->children[idx] = new TrieNode();
            node = node->children[idx];
        }
        node->isEnd = true;
    }

    bool search(const std::string& word) {
        TrieNode* node = root;
        for (int i = 0; i < static_cast<int>(word.size()); ++i) {
            int idx = word[i] - 'a';
            if (node->children[idx] == nullptr) return false;
            node = node->children[idx];
        }
        return node->isEnd;
    }

    bool startsWith(const std::string& prefix) {
        TrieNode* node = root;
        for (int i = 0; i < static_cast<int>(prefix.size()); ++i) {
            int idx = prefix[i] - 'a';
            if (node->children[idx] == nullptr) return false;
            node = node->children[idx];
        }
        return true;
    }

private:
    TrieNode* root;
};
