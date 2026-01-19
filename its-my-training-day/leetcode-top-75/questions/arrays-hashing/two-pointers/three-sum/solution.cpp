#include "../../../../shared/cpp/ds.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

static std::vector<T> toVector(const ArrayList<T>& list) {
    std::vector<T> out(list.size());
    for (std::size_t i = 0; i < list.size(); ++i) {
        out[i] = list.get(i);
    }
    return out;
}
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
