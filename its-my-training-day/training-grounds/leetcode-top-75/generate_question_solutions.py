import importlib.util
import os
import re
from typing import Dict, List, Tuple


BASE_DIR = os.path.dirname(__file__)
QUESTIONS_DIR = os.path.join(BASE_DIR, "questions")


def load_problems() -> List[dict]:
    spec = importlib.util.spec_from_file_location(
        "gen", os.path.join(BASE_DIR, "generate_readmes.py")
    )
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.PROBLEMS


def read_lines(path: str) -> List[str]:
    with open(path, "r", encoding="utf-8") as f:
        return f.read().splitlines()


def extract_python_blocks(lines: List[str]) -> Dict[str, str]:
    import ast

    source = "\n".join(lines)
    tree = ast.parse(source)
    blocks = {}
    for node in tree.body:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            start = node.lineno - 1
            end = node.end_lineno
            blocks[node.name] = "\n".join(lines[start:end]).rstrip() + "\n"
    return blocks


def extract_ts_blocks(lines: List[str]) -> Dict[str, str]:
    starts: List[Tuple[str, int]] = []
    export_const = re.compile(r"^export\s+const\s+([A-Za-z_]\w*)\s*=")
    export_class = re.compile(r"^export\s+class\s+([A-Za-z_]\w*)\b")
    helper_class = re.compile(r"^class\s+([A-Za-z_]\w*)\b")
    for i, line in enumerate(lines):
        if line.startswith("export const "):
            match = export_const.match(line)
            if match:
                starts.append((match.group(1), i))
        elif line.startswith("export class "):
            match = export_class.match(line)
            if match:
                starts.append((match.group(1), i))
        elif line.startswith("class "):
            match = helper_class.match(line)
            if match:
                starts.append((match.group(1), i))

    blocks: Dict[str, str] = {}
    for idx, (name, start) in enumerate(starts):
        end = len(lines)
        if idx + 1 < len(starts):
            end = starts[idx + 1][1]
        blocks[name] = "\n".join(lines[start:end]).rstrip() + "\n"

    helper_matches = {}
    for i, line in enumerate(lines):
        if line.startswith("const quickSortInt"):
            helper_matches["quickSortInt"] = i
        if line.startswith("const quickSortIntervals"):
            helper_matches["quickSortIntervals"] = i
        if line.startswith("const toArray"):
            helper_matches["toArray"] = i

    helper_starts = sorted(helper_matches.items(), key=lambda x: x[1])
    for idx, (name, start) in enumerate(helper_starts):
        end = len(lines)
        if idx + 1 < len(helper_starts):
            end = helper_starts[idx + 1][1]
        blocks[name] = "\n".join(lines[start:end]).rstrip() + "\n"

    return blocks


def extract_cpp_blocks(lines: List[str]) -> Dict[str, str]:
    starts: List[Tuple[str, int]] = []
    class_re = re.compile(r"^(class|struct)\s+([A-Za-z_]\w*)\b")
    func_re = re.compile(r"^[A-Za-z_][A-Za-z0-9_:<>\s*&]*\b([A-Za-z_]\w*)\s*\(")
    for i, line in enumerate(lines):
        if line.startswith(" ") or line.startswith("\t") or line.startswith("#"):
            continue
        class_match = class_re.match(line)
        if class_match:
            starts.append((class_match.group(2), i))
            continue
        func_match = func_re.match(line)
        if func_match:
            name = func_match.group(1)
            if name not in {"if", "for", "while", "switch"}:
                starts.append((name, i))

    blocks: Dict[str, str] = {}
    for idx, (name, start) in enumerate(starts):
        end = len(lines)
        if idx + 1 < len(starts):
            end = starts[idx + 1][1]
        blocks[name] = "\n".join(lines[start:end]).rstrip() + "\n"

    helpers = {"quickSortInt", "quickSortIntervals", "toVector"}
    for helper in helpers:
        if helper not in blocks:
            for name, start in starts:
                if name == helper:
                    idx = starts.index((name, start))
                    end = len(lines)
                    if idx + 1 < len(starts):
                        end = starts[idx + 1][1]
                    blocks[helper] = "\n".join(lines[start:end]).rstrip() + "\n"
    return blocks


def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def build_python_header() -> str:
    return (
        "import os\n"
        "import sys\n"
        "from typing import List, Dict, Optional, Tuple\n\n"
        "ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), \"../../../../\"))\n"
        "if ROOT_DIR not in sys.path:\n"
        "    sys.path.append(ROOT_DIR)\n\n"
        "from shared.python.ds import ArrayList, ListNode, Stack, Queue, TreeNode, MinHeap, MaxHeap\n\n"
    )


def build_ts_header() -> str:
    return (
        "import {\n"
        "  ArrayList,\n"
        "  Stack,\n"
        "  Queue,\n"
        "  ListNode,\n"
        "  TreeNode,\n"
        "  MinHeap,\n"
        "  MaxHeap,\n"
        "} from \"../../../../shared/typescript/ds\";\n\n"
    )


def build_cpp_header() -> str:
    return (
        "#include \"../../../../shared/cpp/ds.hpp\"\n\n"
        "#include <algorithm>\n"
        "#include <cctype>\n"
        "#include <cstdint>\n"
        "#include <functional>\n"
        "#include <string>\n"
        "#include <unordered_map>\n"
        "#include <vector>\n\n"
    )


def write_file(path: str, content: str) -> None:
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


def main() -> None:
    problems = load_problems()

    py_lines = read_lines(os.path.join(BASE_DIR, "solutions", "solutions.py"))
    ts_lines = read_lines(os.path.join(BASE_DIR, "solutions", "solutions.ts"))
    cpp_lines = read_lines(os.path.join(BASE_DIR, "solutions", "solutions.cpp"))

    py_blocks = extract_python_blocks(py_lines)
    ts_blocks = extract_ts_blocks(ts_lines)
    cpp_blocks = extract_cpp_blocks(cpp_lines)

    for problem in problems:
        ds_dir = os.path.join(QUESTIONS_DIR, problem["ds"], problem["technique"], problem["slug"])
        ensure_dir(ds_dir)

        py_refs = [part.strip() for part in problem["py_ref"].split("/") if part.strip()]
        cpp_refs = [part.strip() for part in problem["cpp_ref"].split("/") if part.strip()]
        ts_refs = [part.strip() for part in problem["ts_ref"].split("/") if part.strip()]

        py_content = build_python_header()
        py_helpers = set()
        for ref in py_refs:
            if ref == "clone_graph":
                py_helpers.add("GraphNode")
            if ref == "Trie":
                py_helpers.add("TrieNode")
            if ref in {"three_sum", "merge_intervals", "non_overlapping_intervals", "meeting_rooms", "meeting_rooms_ii"}:
                py_helpers.add("_quick_sort")
        for helper in py_helpers:
            py_content += py_blocks[helper]
        for ref in py_refs:
            py_content += py_blocks[ref]
        write_file(os.path.join(ds_dir, "solution.py"), py_content)

        ts_content = build_ts_header()
        ts_helpers = set()
        for ref in ts_refs:
            if ref in {"threeSum"}:
                ts_helpers.add("quickSortInt")
            if ref in {"mergeIntervals", "nonOverlappingIntervals", "meetingRooms", "meetingRoomsII", "insertInterval"}:
                ts_helpers.add("quickSortIntervals")
            if ref in {"threeSum", "groupAnagrams", "spiralMatrix", "binaryTreeLevelOrder", "binaryTreeRightSideView", "pacificAtlantic"}:
                ts_helpers.add("toArray")
            if ref == "Trie":
                ts_helpers.add("TrieNode")
        for helper in ts_helpers:
            ts_content += ts_blocks[helper]
        for ref in ts_refs:
            ts_content += ts_blocks[ref]
        write_file(os.path.join(ds_dir, "solution.ts"), ts_content)

        cpp_content = build_cpp_header()
        cpp_helpers = set()
        for ref in cpp_refs:
            if ref in {"threeSum"}:
                cpp_helpers.add("quickSortInt")
            if ref in {"mergeIntervals", "nonOverlappingIntervals", "meetingRooms", "meetingRoomsII", "insertInterval"}:
                cpp_helpers.add("quickSortIntervals")
            if ref in {"threeSum", "groupAnagrams", "spiralMatrix", "binaryTreeLevelOrder", "binaryTreeRightSideView", "pacificAtlantic"}:
                cpp_helpers.add("toVector")
        for helper in cpp_helpers:
            cpp_content += cpp_blocks[helper]
        for ref in cpp_refs:
            cpp_content += cpp_blocks[ref]
        write_file(os.path.join(ds_dir, "solution.cpp"), cpp_content)


if __name__ == "__main__":
    main()
