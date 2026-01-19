# Best Time to Buy and Sell Stock

## Directory
- Data structure: `arrays-hashing`
- Technique: `greedy`

## Approach
Track the minimum price so far and update max profit on each day.

## Data Structure Deep Dive
- Track the best choice so far and never revisit earlier states.
- Correctness depends on a proven locally optimal rule.
- Greedy often reduces to a single pass with constant memory.

## Complexity
Time O(n) | Space O(1)

## Solution References
- Python: `solution.py` → `best_time_buy_sell_stock`
- C++: `solution.cpp` → `bestTimeBuySellStock`
- TypeScript: `solution.ts` → `bestTimeBuySellStock`
