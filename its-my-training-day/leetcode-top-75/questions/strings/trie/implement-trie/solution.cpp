#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

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
