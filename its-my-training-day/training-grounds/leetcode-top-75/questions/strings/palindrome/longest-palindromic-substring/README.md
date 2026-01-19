# Longest Palindromic Substring

## Directory
- Data structure: `strings`
- Technique: `palindrome`

## Approach
Expand around each center for odd/even palindromes.

## Data Structure Deep Dive
- Two-pointer or expand-around-center checks symmetry.
- Odd and even centers cover all palindromes.
- Early mismatch breaks quickly.

## Complexity
Time O(n^2) | Space O(1)

## Solution References
- Python: `solution.py` → `longest_palindromic_substring`
- C++: `solution.cpp` → `longestPalindromicSubstring`
- TypeScript: `solution.ts` → `longestPalindromicSubstring`
