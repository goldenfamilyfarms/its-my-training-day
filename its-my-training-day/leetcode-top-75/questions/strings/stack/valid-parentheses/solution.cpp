#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

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
