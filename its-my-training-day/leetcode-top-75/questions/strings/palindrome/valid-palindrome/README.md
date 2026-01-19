# Valid Palindrome

## Directory
- Data structure: `strings`
- Technique: `palindrome`

## Approach
Two pointers skip non-alphanumerics and compare lowercased chars.

## Data Structure Deep Dive
- Two-pointer or expand-around-center checks symmetry.
- Odd and even centers cover all palindromes.
- Early mismatch breaks quickly.

## Complexity
Time O(n) | Space O(1)

## Solution References
- Python: `solution.py` → `valid_palindrome`
- C++: `solution.cpp` → `validPalindrome`
- TypeScript: `solution.ts` → `validPalindrome`
