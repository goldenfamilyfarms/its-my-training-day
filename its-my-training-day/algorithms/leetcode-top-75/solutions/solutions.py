from typing import List, Dict, Optional, Tuple

from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap


def two_sum(nums: List[int], target: int) -> List[int]:
    seen: Dict[int, int] = {}
    i = 0
    while i < len(nums):
        val = nums[i]
        need = target - val
        if need in seen:
            return [seen[need], i]
        seen[val] = i
        i += 1
    return []


def best_time_buy_sell_stock(prices: List[int]) -> int:
    if not prices:
        return 0
    min_price = prices[0]
    max_profit = 0
    i = 1
    while i < len(prices):
        if prices[i] < min_price:
            min_price = prices[i]
        else:
            profit = prices[i] - min_price
            if profit > max_profit:
                max_profit = profit
        i += 1
    return max_profit


def contains_duplicate(nums: List[int]) -> bool:
    seen: Dict[int, bool] = {}
    i = 0
    while i < len(nums):
        val = nums[i]
        if val in seen:
            return True
        seen[val] = True
        i += 1
    return False


def product_except_self(nums: List[int]) -> List[int]:
    n = len(nums)
    result = [1] * n
    prefix = 1
    i = 0
    while i < n:
        result[i] = prefix
        prefix *= nums[i]
        i += 1
    suffix = 1
    i = n - 1
    while i >= 0:
        result[i] *= suffix
        suffix *= nums[i]
        i -= 1
    return result


def maximum_subarray(nums: List[int]) -> int:
    best = nums[0]
    current = nums[0]
    i = 1
    while i < len(nums):
        val = nums[i]
        if current + val > val:
            current = current + val
        else:
            current = val
        if current > best:
            best = current
        i += 1
    return best


def maximum_product_subarray(nums: List[int]) -> int:
    max_val = nums[0]
    min_val = nums[0]
    best = nums[0]
    i = 1
    while i < len(nums):
        val = nums[i]
        if val < 0:
            max_val, min_val = min_val, max_val
        max_val = max(val, max_val * val)
        min_val = min(val, min_val * val)
        if max_val > best:
            best = max_val
        i += 1
    return best


def find_min_rotated(nums: List[int]) -> int:
    left = 0
    right = len(nums) - 1
    while left < right:
        mid = (left + right) // 2
        if nums[mid] > nums[right]:
            left = mid + 1
        else:
            right = mid
    return nums[left]


def search_rotated(nums: List[int], target: int) -> int:
    left = 0
    right = len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        if nums[left] <= nums[mid]:
            if nums[left] <= target < nums[mid]:
                right = mid - 1
            else:
                left = mid + 1
        else:
            if nums[mid] < target <= nums[right]:
                left = mid + 1
            else:
                right = mid - 1
    return -1


def _quick_sort(nums: List[int], left: int, right: int) -> None:
    if left >= right:
        return
    pivot = nums[(left + right) // 2]
    i = left
    j = right
    while i <= j:
        while nums[i] < pivot:
            i += 1
        while nums[j] > pivot:
            j -= 1
        if i <= j:
            nums[i], nums[j] = nums[j], nums[i]
            i += 1
            j -= 1
    if left < j:
        _quick_sort(nums, left, j)
    if i < right:
        _quick_sort(nums, i, right)


def three_sum(nums: List[int]) -> List[List[int]]:
    if len(nums) < 3:
        return []
    _quick_sort(nums, 0, len(nums) - 1)
    result = ArrayList()
    i = 0
    while i < len(nums) - 2:
        if i > 0 and nums[i] == nums[i - 1]:
            i += 1
            continue
        left = i + 1
        right = len(nums) - 1
        while left < right:
            total = nums[i] + nums[left] + nums[right]
            if total == 0:
                result.add([nums[i], nums[left], nums[right]])
                left += 1
                right -= 1
                while left < right and nums[left] == nums[left - 1]:
                    left += 1
                while left < right and nums[right] == nums[right + 1]:
                    right -= 1
            elif total < 0:
                left += 1
            else:
                right -= 1
        i += 1
    return result.to_list()


def container_with_most_water(heights: List[int]) -> int:
    left = 0
    right = len(heights) - 1
    best = 0
    while left < right:
        width = right - left
        if heights[left] < heights[right]:
            area = heights[left] * width
            if area > best:
                best = area
            left += 1
        else:
            area = heights[right] * width
            if area > best:
                best = area
            right -= 1
    return best


def sum_of_two_integers(a: int, b: int) -> int:
    mask = 0xFFFFFFFF
    while b != 0:
        carry = (a & b) & mask
        a = (a ^ b) & mask
        b = (carry << 1) & mask
    if a & (1 << 31):
        return ~(a ^ mask)
    return a


def number_of_1_bits(n: int) -> int:
    count = 0
    while n != 0:
        n &= n - 1
        count += 1
    return count


def counting_bits(n: int) -> List[int]:
    result = [0] * (n + 1)
    i = 1
    while i <= n:
        result[i] = result[i >> 1] + (i & 1)
        i += 1
    return result


def missing_number(nums: List[int]) -> int:
    xor_val = 0
    i = 0
    while i < len(nums):
        xor_val ^= i
        xor_val ^= nums[i]
        i += 1
    xor_val ^= len(nums)
    return xor_val


def reverse_bits(n: int) -> int:
    result = 0
    i = 0
    while i < 32:
        result = (result << 1) | (n & 1)
        n >>= 1
        i += 1
    return result


def climbing_stairs(n: int) -> int:
    if n <= 2:
        return n
    prev2 = 1
    prev1 = 2
    i = 3
    while i <= n:
        current = prev1 + prev2
        prev2 = prev1
        prev1 = current
        i += 1
    return prev1


def coin_change(coins: List[int], amount: int) -> int:
    dp = [amount + 1] * (amount + 1)
    dp[0] = 0
    i = 1
    while i <= amount:
        j = 0
        while j < len(coins):
            coin = coins[j]
            if coin <= i:
                cand = dp[i - coin] + 1
                if cand < dp[i]:
                    dp[i] = cand
            j += 1
        i += 1
    return -1 if dp[amount] == amount + 1 else dp[amount]


def longest_increasing_subsequence(nums: List[int]) -> int:
    if not nums:
        return 0
    tails = [0] * len(nums)
    size = 0
    i = 0
    while i < len(nums):
        val = nums[i]
        left = 0
        right = size
        while left < right:
            mid = (left + right) // 2
            if tails[mid] < val:
                left = mid + 1
            else:
                right = mid
        tails[left] = val
        if left == size:
            size += 1
        i += 1
    return size


def longest_common_subsequence(text1: str, text2: str) -> int:
    n = len(text1)
    m = len(text2)
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    i = 1
    while i <= n:
        j = 1
        while j <= m:
            if text1[i - 1] == text2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
            j += 1
        i += 1
    return dp[n][m]


def word_break(s: str, word_dict: List[str]) -> bool:
    word_set = {}
    i = 0
    while i < len(word_dict):
        word_set[word_dict[i]] = True
        i += 1
    dp = [False] * (len(s) + 1)
    dp[0] = True
    i = 1
    while i <= len(s):
        j = 0
        while j < i:
            if dp[j] and s[j:i] in word_set:
                dp[i] = True
                break
            j += 1
        i += 1
    return dp[len(s)]


def combination_sum(candidates: List[int], target: int) -> List[List[int]]:
    result = ArrayList()
    path = ArrayList()

    def backtrack(start: int, total: int) -> None:
        if total == target:
            result.add(path.to_list())
            return
        if total > target:
            return
        i = start
        while i < len(candidates):
            path.add(candidates[i])
            backtrack(i, total + candidates[i])
            path.remove_last()
            i += 1

    backtrack(0, 0)
    return result.to_list()


def house_robber(nums: List[int]) -> int:
    prev1 = 0
    prev2 = 0
    i = 0
    while i < len(nums):
        take = prev2 + nums[i]
        skip = prev1
        current = take if take > skip else skip
        prev2 = prev1
        prev1 = current
        i += 1
    return prev1


def house_robber_ii(nums: List[int]) -> int:
    if not nums:
        return 0
    if len(nums) == 1:
        return nums[0]

    def rob_range(left: int, right: int) -> int:
        prev1 = 0
        prev2 = 0
        i = left
        while i <= right:
            take = prev2 + nums[i]
            skip = prev1
            current = take if take > skip else skip
            prev2 = prev1
            prev1 = current
            i += 1
        return prev1

    return max(rob_range(0, len(nums) - 2), rob_range(1, len(nums) - 1))


def decode_ways(s: str) -> int:
    if not s or s[0] == "0":
        return 0
    prev2 = 1
    prev1 = 1
    i = 1
    while i < len(s):
        current = 0
        if s[i] != "0":
            current += prev1
        two = int(s[i - 1:i + 1])
        if 10 <= two <= 26:
            current += prev2
        prev2 = prev1
        prev1 = current
        i += 1
    return prev1


def unique_paths(m: int, n: int) -> int:
    dp = [1] * n
    i = 1
    while i < m:
        j = 1
        while j < n:
            dp[j] = dp[j] + dp[j - 1]
            j += 1
        i += 1
    return dp[n - 1]


def jump_game(nums: List[int]) -> bool:
    reach = 0
    i = 0
    while i < len(nums):
        if i > reach:
            return False
        if i + nums[i] > reach:
            reach = i + nums[i]
        i += 1
    return True


class GraphNode:
    def __init__(self, val=0, neighbors=None):
        self.val = val
        self.neighbors = neighbors if neighbors is not None else ArrayList()


def clone_graph(node: Optional[GraphNode]) -> Optional[GraphNode]:
    if node is None:
        return None
    clones: Dict[GraphNode, GraphNode] = {}

    def dfs(curr: GraphNode) -> GraphNode:
        if curr in clones:
            return clones[curr]
        copy = GraphNode(curr.val, ArrayList())
        clones[curr] = copy
        i = 0
        while i < curr.neighbors.size():
            copy.neighbors.add(dfs(curr.neighbors.get(i)))
            i += 1
        return copy

    return dfs(node)


def course_schedule(num_courses: int, prerequisites: List[List[int]]) -> bool:
    graph = [ArrayList() for _ in range(num_courses)]
    indegree = [0] * num_courses
    i = 0
    while i < len(prerequisites):
        a = prerequisites[i][0]
        b = prerequisites[i][1]
        graph[b].add(a)
        indegree[a] += 1
        i += 1
    queue = Queue()
    i = 0
    while i < num_courses:
        if indegree[i] == 0:
            queue.enqueue(i)
        i += 1
    visited = 0
    while not queue.is_empty():
        node = queue.dequeue()
        visited += 1
        neighbors = graph[node]
        j = 0
        while j < neighbors.size():
            nxt = neighbors.get(j)
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.enqueue(nxt)
            j += 1
    return visited == num_courses


def pacific_atlantic(heights: List[List[int]]) -> List[List[int]]:
    if not heights or not heights[0]:
        return []
    rows = len(heights)
    cols = len(heights[0])
    pac = [[False] * cols for _ in range(rows)]
    atl = [[False] * cols for _ in range(rows)]

    def dfs(r: int, c: int, visited: List[List[bool]]):
        visited[r][c] = True
        dr = [1, -1, 0, 0]
        dc = [0, 0, 1, -1]
        i = 0
        while i < 4:
            nr = r + dr[i]
            nc = c + dc[i]
            if 0 <= nr < rows and 0 <= nc < cols:
                if not visited[nr][nc] and heights[nr][nc] >= heights[r][c]:
                    dfs(nr, nc, visited)
            i += 1

    r = 0
    while r < rows:
        dfs(r, 0, pac)
        dfs(r, cols - 1, atl)
        r += 1
    c = 0
    while c < cols:
        dfs(0, c, pac)
        dfs(rows - 1, c, atl)
        c += 1

    result = ArrayList()
    r = 0
    while r < rows:
        c = 0
        while c < cols:
            if pac[r][c] and atl[r][c]:
                result.add([r, c])
            c += 1
        r += 1
    return result.to_list()


def number_of_islands(grid: List[List[str]]) -> int:
    if not grid:
        return 0
    rows = len(grid)
    cols = len(grid[0])
    count = 0

    def dfs(r: int, c: int):
        if r < 0 or r >= rows or c < 0 or c >= cols:
            return
        if grid[r][c] != "1":
            return
        grid[r][c] = "0"
        dfs(r + 1, c)
        dfs(r - 1, c)
        dfs(r, c + 1)
        dfs(r, c - 1)

    r = 0
    while r < rows:
        c = 0
        while c < cols:
            if grid[r][c] == "1":
                count += 1
                dfs(r, c)
            c += 1
        r += 1
    return count


def longest_consecutive(nums: List[int]) -> int:
    seen = {}
    i = 0
    while i < len(nums):
        seen[nums[i]] = True
        i += 1
    longest = 0
    i = 0
    while i < len(nums):
        val = nums[i]
        if (val - 1) not in seen:
            length = 1
            current = val + 1
            while current in seen:
                length += 1
                current += 1
            if length > longest:
                longest = length
        i += 1
    return longest


def alien_dictionary(words: List[str]) -> str:
    graph: Dict[str, ArrayList] = {}
    indegree: Dict[str, int] = {}
    i = 0
    while i < len(words):
        j = 0
        while j < len(words[i]):
            ch = words[i][j]
            if ch not in graph:
                graph[ch] = ArrayList()
                indegree[ch] = 0
            j += 1
        i += 1

    i = 0
    while i < len(words) - 1:
        w1 = words[i]
        w2 = words[i + 1]
        j = 0
        while j < len(w1) and j < len(w2) and w1[j] == w2[j]:
            j += 1
        if j < len(w1) and j < len(w2):
            a = w1[j]
            b = w2[j]
            graph[a].add(b)
            indegree[b] += 1
        elif len(w1) > len(w2):
            return ""
        i += 1

    queue = Queue()
    for ch in indegree:
        if indegree[ch] == 0:
            queue.enqueue(ch)

    order = ArrayList()
    while not queue.is_empty():
        ch = queue.dequeue()
        order.add(ch)
        neighbors = graph[ch]
        k = 0
        while k < neighbors.size():
            nxt = neighbors.get(k)
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.enqueue(nxt)
            k += 1

    if order.size() != len(indegree):
        return ""
    return "".join(order.to_list())


def graph_valid_tree(n: int, edges: List[List[int]]) -> bool:
    if len(edges) != n - 1:
        return False
    parent = [i for i in range(n)]

    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    i = 0
    while i < len(edges):
        a = edges[i][0]
        b = edges[i][1]
        pa = find(a)
        pb = find(b)
        if pa == pb:
            return False
        parent[pb] = pa
        i += 1
    return True


def number_of_connected_components(n: int, edges: List[List[int]]) -> int:
    parent = [i for i in range(n)]
    count = n

    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    i = 0
    while i < len(edges):
        a = edges[i][0]
        b = edges[i][1]
        pa = find(a)
        pb = find(b)
        if pa != pb:
            parent[pb] = pa
            count -= 1
        i += 1
    return count


def insert_interval(intervals: List[List[int]], new_interval: List[int]) -> List[List[int]]:
    result = ArrayList()
    i = 0
    while i < len(intervals) and intervals[i][1] < new_interval[0]:
        result.add(intervals[i])
        i += 1
    while i < len(intervals) and intervals[i][0] <= new_interval[1]:
        if intervals[i][0] < new_interval[0]:
            new_interval[0] = intervals[i][0]
        if intervals[i][1] > new_interval[1]:
            new_interval[1] = intervals[i][1]
        i += 1
    result.add(new_interval)
    while i < len(intervals):
        result.add(intervals[i])
        i += 1
    return result.to_list()


def merge_intervals(intervals: List[List[int]]) -> List[List[int]]:
    if not intervals:
        return []
    _quick_sort(intervals, 0, len(intervals) - 1)
    result = ArrayList()
    current = intervals[0]
    i = 1
    while i < len(intervals):
        if intervals[i][0] <= current[1]:
            if intervals[i][1] > current[1]:
                current[1] = intervals[i][1]
        else:
            result.add(current)
            current = intervals[i]
        i += 1
    result.add(current)
    return result.to_list()


def non_overlapping_intervals(intervals: List[List[int]]) -> int:
    if not intervals:
        return 0
    _quick_sort(intervals, 0, len(intervals) - 1)
    count = 0
    end = intervals[0][1]
    i = 1
    while i < len(intervals):
        if intervals[i][0] < end:
            count += 1
            if intervals[i][1] < end:
                end = intervals[i][1]
        else:
            end = intervals[i][1]
        i += 1
    return count


def meeting_rooms(intervals: List[List[int]]) -> bool:
    if not intervals:
        return True
    _quick_sort(intervals, 0, len(intervals) - 1)
    i = 1
    while i < len(intervals):
        if intervals[i][0] < intervals[i - 1][1]:
            return False
        i += 1
    return True


def meeting_rooms_ii(intervals: List[List[int]]) -> int:
    if not intervals:
        return 0
    _quick_sort(intervals, 0, len(intervals) - 1)
    heap = MinHeap()
    heap.push(intervals[0][1])
    i = 1
    while i < len(intervals):
        if heap.peek() is not None and intervals[i][0] >= heap.peek():
            heap.pop()
        heap.push(intervals[i][1])
        i += 1
    return heap.size()


def reverse_linked_list(head: Optional[ListNode]) -> Optional[ListNode]:
    prev = None
    current = head
    while current:
        nxt = current.next
        current.next = prev
        prev = current
        current = nxt
    return prev


def detect_cycle(head: Optional[ListNode]) -> bool:
    slow = head
    fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow == fast:
            return True
    return False


def merge_two_sorted_lists(l1: Optional[ListNode], l2: Optional[ListNode]) -> Optional[ListNode]:
    dummy = ListNode(0)
    current = dummy
    while l1 and l2:
        if l1.val <= l2.val:
            current.next = l1
            l1 = l1.next
        else:
            current.next = l2
            l2 = l2.next
        current = current.next
    current.next = l1 if l1 else l2
    return dummy.next


def merge_k_sorted_lists(lists: List[Optional[ListNode]]) -> Optional[ListNode]:
    heap = MinHeap()
    i = 0
    while i < len(lists):
        if lists[i]:
            heap.push((lists[i].val, i, lists[i]))
        i += 1
    dummy = ListNode(0)
    current = dummy
    while heap.size() > 0:
        val, idx, node = heap.pop()
        current.next = node
        current = current.next
        if node.next:
            heap.push((node.next.val, idx, node.next))
    return dummy.next


def remove_nth_from_end(head: Optional[ListNode], n: int) -> Optional[ListNode]:
    dummy = ListNode(0, head)
    fast = dummy
    slow = dummy
    i = 0
    while i < n + 1:
        fast = fast.next
        i += 1
    while fast:
        fast = fast.next
        slow = slow.next
    slow.next = slow.next.next
    return dummy.next


def reorder_list(head: Optional[ListNode]) -> None:
    if not head or not head.next:
        return
    slow = head
    fast = head
    while fast.next and fast.next.next:
        slow = slow.next
        fast = fast.next.next
    second = reverse_linked_list(slow.next)
    slow.next = None
    first = head
    while second:
        temp1 = first.next
        temp2 = second.next
        first.next = second
        second.next = temp1
        first = temp1
        second = temp2


def set_matrix_zeroes(matrix: List[List[int]]) -> None:
    rows = len(matrix)
    cols = len(matrix[0])
    row_zero = False
    col_zero = False
    r = 0
    while r < rows:
        if matrix[r][0] == 0:
            col_zero = True
        r += 1
    c = 0
    while c < cols:
        if matrix[0][c] == 0:
            row_zero = True
        c += 1
    r = 1
    while r < rows:
        c = 1
        while c < cols:
            if matrix[r][c] == 0:
                matrix[r][0] = 0
                matrix[0][c] = 0
            c += 1
        r += 1
    r = 1
    while r < rows:
        if matrix[r][0] == 0:
            c = 1
            while c < cols:
                matrix[r][c] = 0
                c += 1
        r += 1
    c = 1
    while c < cols:
        if matrix[0][c] == 0:
            r = 1
            while r < rows:
                matrix[r][c] = 0
                r += 1
        c += 1
    if row_zero:
        c = 0
        while c < cols:
            matrix[0][c] = 0
            c += 1
    if col_zero:
        r = 0
        while r < rows:
            matrix[r][0] = 0
            r += 1


def spiral_matrix(matrix: List[List[int]]) -> List[int]:
    result = ArrayList()
    top = 0
    bottom = len(matrix) - 1
    left = 0
    right = len(matrix[0]) - 1
    while top <= bottom and left <= right:
        i = left
        while i <= right:
            result.add(matrix[top][i])
            i += 1
        top += 1
        i = top
        while i <= bottom:
            result.add(matrix[i][right])
            i += 1
        right -= 1
        if top <= bottom:
            i = right
            while i >= left:
                result.add(matrix[bottom][i])
                i -= 1
            bottom -= 1
        if left <= right:
            i = bottom
            while i >= top:
                result.add(matrix[i][left])
                i -= 1
            left += 1
    return result.to_list()


def rotate_image(matrix: List[List[int]]) -> None:
    n = len(matrix)
    layer = 0
    while layer < n // 2:
        first = layer
        last = n - 1 - layer
        i = first
        while i < last:
            offset = i - first
            top = matrix[first][i]
            matrix[first][i] = matrix[last - offset][first]
            matrix[last - offset][first] = matrix[last][last - offset]
            matrix[last][last - offset] = matrix[i][last]
            matrix[i][last] = top
            i += 1
        layer += 1


def word_search(board: List[List[str]], word: str) -> bool:
    rows = len(board)
    cols = len(board[0])

    def dfs(r: int, c: int, idx: int) -> bool:
        if idx == len(word):
            return True
        if r < 0 or r >= rows or c < 0 or c >= cols:
            return False
        if board[r][c] != word[idx]:
            return False
        temp = board[r][c]
        board[r][c] = "#"
        found = (
            dfs(r + 1, c, idx + 1)
            or dfs(r - 1, c, idx + 1)
            or dfs(r, c + 1, idx + 1)
            or dfs(r, c - 1, idx + 1)
        )
        board[r][c] = temp
        return found

    r = 0
    while r < rows:
        c = 0
        while c < cols:
            if dfs(r, c, 0):
                return True
            c += 1
        r += 1
    return False


def longest_substring_without_repeating(s: str) -> int:
    last: Dict[str, int] = {}
    left = 0
    best = 0
    right = 0
    while right < len(s):
        ch = s[right]
        if ch in last and last[ch] >= left:
            left = last[ch] + 1
        last[ch] = right
        length = right - left + 1
        if length > best:
            best = length
        right += 1
    return best


def longest_repeating_character_replacement(s: str, k: int) -> int:
    counts: Dict[str, int] = {}
    left = 0
    max_count = 0
    best = 0
    right = 0
    while right < len(s):
        ch = s[right]
        counts[ch] = counts.get(ch, 0) + 1
        if counts[ch] > max_count:
            max_count = counts[ch]
        window = right - left + 1
        if window - max_count > k:
            left_ch = s[left]
            counts[left_ch] -= 1
            left += 1
        else:
            if window > best:
                best = window
        right += 1
    return best


def minimum_window_substring(s: str, t: str) -> str:
    if not t:
        return ""
    target: Dict[str, int] = {}
    i = 0
    while i < len(t):
        ch = t[i]
        target[ch] = target.get(ch, 0) + 1
        i += 1
    need = len(target)
    formed = 0
    window: Dict[str, int] = {}
    left = 0
    best_len = 1 << 30
    best = (0, 0)
    right = 0
    while right < len(s):
        ch = s[right]
        window[ch] = window.get(ch, 0) + 1
        if ch in target and window[ch] == target[ch]:
            formed += 1
        while left <= right and formed == need:
            if right - left + 1 < best_len:
                best_len = right - left + 1
                best = (left, right)
            left_ch = s[left]
            window[left_ch] -= 1
            if left_ch in target and window[left_ch] < target[left_ch]:
                formed -= 1
            left += 1
        right += 1
    if best_len == 1 << 30:
        return ""
    return s[best[0]:best[1] + 1]


def valid_anagram(s: str, t: str) -> bool:
    if len(s) != len(t):
        return False
    count: Dict[str, int] = {}
    i = 0
    while i < len(s):
        ch = s[i]
        count[ch] = count.get(ch, 0) + 1
        i += 1
    i = 0
    while i < len(t):
        ch = t[i]
        if ch not in count:
            return False
        count[ch] -= 1
        if count[ch] < 0:
            return False
        i += 1
    return True


def group_anagrams(strs: List[str]) -> List[List[str]]:
    groups: Dict[Tuple[int, ...], ArrayList] = {}
    i = 0
    while i < len(strs):
        s = strs[i]
        count = [0] * 26
        j = 0
        while j < len(s):
            count[ord(s[j]) - 97] += 1
            j += 1
        key = tuple(count)
        if key not in groups:
            groups[key] = ArrayList()
        groups[key].add(s)
        i += 1
    result = ArrayList()
    for key in groups:
        result.add(groups[key].to_list())
    return result.to_list()


def valid_parentheses(s: str) -> bool:
    stack = Stack()
    pairs = {")": "(", "]": "[", "}": "{"}
    i = 0
    while i < len(s):
        ch = s[i]
        if ch in pairs:
            top = stack.pop()
            if top is None or top != pairs[ch]:
                return False
        else:
            stack.push(ch)
        i += 1
    return stack.is_empty()


def valid_palindrome(s: str) -> bool:
    left = 0
    right = len(s) - 1
    while left < right:
        while left < right and not s[left].isalnum():
            left += 1
        while left < right and not s[right].isalnum():
            right -= 1
        if s[left].lower() != s[right].lower():
            return False
        left += 1
        right -= 1
    return True


def longest_palindromic_substring(s: str) -> str:
    if not s:
        return ""
    start = 0
    end = 0

    def expand(l: int, r: int) -> None:
        nonlocal start, end
        while l >= 0 and r < len(s) and s[l] == s[r]:
            l -= 1
            r += 1
        l += 1
        r -= 1
        if r - l > end - start:
            start = l
            end = r

    i = 0
    while i < len(s):
        expand(i, i)
        expand(i, i + 1)
        i += 1
    return s[start:end + 1]


def palindromic_substrings(s: str) -> int:
    count = 0

    def expand(l: int, r: int) -> None:
        nonlocal count
        while l >= 0 and r < len(s) and s[l] == s[r]:
            count += 1
            l -= 1
            r += 1

    i = 0
    while i < len(s):
        expand(i, i)
        expand(i, i + 1)
        i += 1
    return count


def encode_strings(strs: List[str]) -> str:
    parts = ArrayList()
    i = 0
    while i < len(strs):
        s = strs[i]
        parts.add(str(len(s)))
        parts.add("#")
        parts.add(s)
        i += 1
    return "".join(parts.to_list())


def decode_strings(s: str) -> List[str]:
    result = ArrayList()
    i = 0
    while i < len(s):
        j = i
        while s[j] != "#":
            j += 1
        length = int(s[i:j])
        start = j + 1
        result.add(s[start:start + length])
        i = start + length
    return result.to_list()


def max_depth_binary_tree(root: Optional[TreeNode]) -> int:
    if root is None:
        return 0
    left = max_depth_binary_tree(root.left)
    right = max_depth_binary_tree(root.right)
    return 1 + (left if left > right else right)


def same_tree(p: Optional[TreeNode], q: Optional[TreeNode]) -> bool:
    if p is None and q is None:
        return True
    if p is None or q is None:
        return False
    if p.val != q.val:
        return False
    return same_tree(p.left, q.left) and same_tree(p.right, q.right)


def invert_binary_tree(root: Optional[TreeNode]) -> Optional[TreeNode]:
    if root is None:
        return None
    left = invert_binary_tree(root.left)
    right = invert_binary_tree(root.right)
    root.left = right
    root.right = left
    return root


def binary_tree_max_path_sum(root: Optional[TreeNode]) -> int:
    best = -10**9

    def dfs(node: Optional[TreeNode]) -> int:
        nonlocal best
        if node is None:
            return 0
        left = dfs(node.left)
        right = dfs(node.right)
        left = left if left > 0 else 0
        right = right if right > 0 else 0
        total = node.val + left + right
        if total > best:
            best = total
        return node.val + (left if left > right else right)

    dfs(root)
    return best


def binary_tree_level_order(root: Optional[TreeNode]) -> List[List[int]]:
    if root is None:
        return []
    result = ArrayList()
    queue = Queue()
    queue.enqueue(root)
    while not queue.is_empty():
        level_size = 0
        temp_queue = Queue()
        while not queue.is_empty():
            temp_queue.enqueue(queue.dequeue())
            level_size += 1
        level = [0] * level_size
        i = 0
        while not temp_queue.is_empty():
            node = temp_queue.dequeue()
            level[i] = node.val
            if node.left:
                queue.enqueue(node.left)
            if node.right:
                queue.enqueue(node.right)
            i += 1
        result.add(level)
    return result.to_list()


def serialize_binary_tree(root: Optional[TreeNode]) -> str:
    if root is None:
        return ""
    result = ArrayList()
    queue = Queue()
    queue.enqueue(root)
    while not queue.is_empty():
        node = queue.dequeue()
        if node is None:
            result.add("#")
        else:
            result.add(str(node.val))
            queue.enqueue(node.left)
            queue.enqueue(node.right)
    return ",".join(result.to_list())


def deserialize_binary_tree(data: str) -> Optional[TreeNode]:
    if not data:
        return None
    values = data.split(",")
    root_val = values[0]
    if root_val == "#":
        return None
    root = TreeNode(int(root_val))
    queue = Queue()
    queue.enqueue(root)
    i = 1
    while i < len(values):
        node = queue.dequeue()
        left_val = values[i]
        i += 1
        if left_val != "#":
            node.left = TreeNode(int(left_val))
            queue.enqueue(node.left)
        right_val = values[i] if i < len(values) else "#"
        i += 1
        if right_val != "#":
            node.right = TreeNode(int(right_val))
            queue.enqueue(node.right)
    return root


def subtree_of_another_tree(root: Optional[TreeNode], sub_root: Optional[TreeNode]) -> bool:
    def is_same(a: Optional[TreeNode], b: Optional[TreeNode]) -> bool:
        if a is None and b is None:
            return True
        if a is None or b is None:
            return False
        if a.val != b.val:
            return False
        return is_same(a.left, b.left) and is_same(a.right, b.right)

    if root is None:
        return sub_root is None
    if is_same(root, sub_root):
        return True
    return subtree_of_another_tree(root.left, sub_root) or subtree_of_another_tree(root.right, sub_root)


def build_tree_pre_in(preorder: List[int], inorder: List[int]) -> Optional[TreeNode]:
    index_map = {}
    i = 0
    while i < len(inorder):
        index_map[inorder[i]] = i
        i += 1

    def helper(pre_left: int, pre_right: int, in_left: int, in_right: int) -> Optional[TreeNode]:
        if pre_left > pre_right:
            return None
        root_val = preorder[pre_left]
        root = TreeNode(root_val)
        mid = index_map[root_val]
        left_size = mid - in_left
        root.left = helper(pre_left + 1, pre_left + left_size, in_left, mid - 1)
        root.right = helper(pre_left + left_size + 1, pre_right, mid + 1, in_right)
        return root

    return helper(0, len(preorder) - 1, 0, len(inorder) - 1)


def validate_bst(root: Optional[TreeNode]) -> bool:
    def helper(node: Optional[TreeNode], low: int, high: int) -> bool:
        if node is None:
            return True
        if node.val <= low or node.val >= high:
            return False
        return helper(node.left, low, node.val) and helper(node.right, node.val, high)

    return helper(root, -10**18, 10**18)


def kth_smallest_bst(root: Optional[TreeNode], k: int) -> int:
    stack = Stack()
    current = root
    count = 0
    while current or not stack.is_empty():
        while current:
            stack.push(current)
            current = current.left
        current = stack.pop()
        count += 1
        if count == k:
            return current.val
        current = current.right
    return -1


def lca_bst(root: Optional[TreeNode], p: TreeNode, q: TreeNode) -> Optional[TreeNode]:
    current = root
    while current:
        if p.val < current.val and q.val < current.val:
            current = current.left
        elif p.val > current.val and q.val > current.val:
            current = current.right
        else:
            return current
    return None


def top_k_frequent(nums: List[int], k: int) -> List[int]:
    freq: Dict[int, int] = {}
    i = 0
    while i < len(nums):
        val = nums[i]
        freq[val] = freq.get(val, 0) + 1
        i += 1
    heap = MinHeap()
    for key in freq:
        heap.push((freq[key], key))
        if heap.size() > k:
            heap.pop()
    result = [0] * k
    i = k - 1
    while i >= 0:
        result[i] = heap.pop()[1]
        i -= 1
    return result


class MedianFinder:
    def __init__(self):
        self.low = MaxHeap()
        self.high = MinHeap()

    def add_num(self, num: int) -> None:
        if self.low.size() == 0 or num <= self.low.peek():
            self.low.push(num)
        else:
            self.high.push(num)
        if self.low.size() > self.high.size() + 1:
            self.high.push(self.low.pop())
        elif self.high.size() > self.low.size():
            self.low.push(self.high.pop())

    def find_median(self) -> float:
        if self.low.size() > self.high.size():
            return float(self.low.peek())
        return (self.low.peek() + self.high.peek()) / 2.0


def kth_largest_in_array(nums: List[int], k: int) -> int:
    heap = MinHeap()
    i = 0
    while i < len(nums):
        heap.push(nums[i])
        if heap.size() > k:
            heap.pop()
        i += 1
    return heap.peek()


def binary_tree_right_side_view(root: Optional[TreeNode]) -> List[int]:
    if root is None:
        return []
    result = ArrayList()
    queue = Queue()
    queue.enqueue(root)
    while not queue.is_empty():
        level_size = 0
        temp_queue = Queue()
        while not queue.is_empty():
            temp_queue.enqueue(queue.dequeue())
            level_size += 1
        i = 0
        last_val = 0
        while not temp_queue.is_empty():
            node = temp_queue.dequeue()
            last_val = node.val
            if node.left:
                queue.enqueue(node.left)
            if node.right:
                queue.enqueue(node.right)
            i += 1
        result.add(last_val)
    return result.to_list()


class TrieNode:
    def __init__(self):
        self.children = [None] * 26
        self.is_end = False


class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word: str) -> None:
        node = self.root
        i = 0
        while i < len(word):
            idx = ord(word[i]) - 97
            if node.children[idx] is None:
                node.children[idx] = TrieNode()
            node = node.children[idx]
            i += 1
        node.is_end = True

    def search(self, word: str) -> bool:
        node = self.root
        i = 0
        while i < len(word):
            idx = ord(word[i]) - 97
            if node.children[idx] is None:
                return False
            node = node.children[idx]
            i += 1
        return node.is_end

    def starts_with(self, prefix: str) -> bool:
        node = self.root
        i = 0
        while i < len(prefix):
            idx = ord(prefix[i]) - 97
            if node.children[idx] is None:
                return False
            node = node.children[idx]
            i += 1
        return True
