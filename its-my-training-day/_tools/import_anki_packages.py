import argparse
import json
import os
import sys
import time
from urllib import error, request


DEFAULT_ANKI_CONNECT_URL = "http://127.0.0.1:8765"


def call_anki_connect(action, params=None, url=DEFAULT_ANKI_CONNECT_URL):
    payload = {"action": action, "version": 6}
    if params:
        payload["params"] = params
    data = json.dumps(payload).encode("utf-8")
    req = request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        with request.urlopen(req) as resp:
            result = json.loads(resp.read().decode("utf-8"))
    except error.URLError as exc:
        raise RuntimeError(f"AnkiConnect not reachable at {url}") from exc
    if result.get("error"):
        raise RuntimeError(result["error"])
    return result.get("result")


def find_apkg_files(root_dir):
    apkg_files = []
    for dirpath, _, filenames in os.walk(root_dir):
        for name in filenames:
            if name.lower().endswith(".apkg"):
                apkg_files.append(os.path.join(dirpath, name))
    return sorted(apkg_files)


def import_packages(apkg_files, delay_ms, url):
    if not apkg_files:
        print("No .apkg files found.")
        return 0

    failures = 0
    for path in apkg_files:
        print(f"Importing: {path}")
        try:
            call_anki_connect("importPackage", {"path": path}, url=url)
        except Exception as exc:  # noqa: BLE001 - keep simple CLI behavior
            failures += 1
            print(f"Failed: {path}\n  {exc}")
        if delay_ms:
            time.sleep(delay_ms / 1000.0)
    return failures


def ensure_anki_connect(url):
    # AnkiConnect exposes a simple 'version' call; use it as a connectivity check.
    call_anki_connect("version", url=url)


def main():
    parser = argparse.ArgumentParser(
        description="Import all .apkg files in a folder into local Anki via AnkiConnect."
    )
    parser.add_argument(
        "folder",
        nargs="?",
        default=r"C:\Users\derri\its-my-training-day\its-my-training-day\books\anki-cards",
        help="Folder to scan for .apkg files.",
    )
    parser.add_argument(
        "--delay-ms",
        type=int,
        default=250,
        help="Delay between imports to keep Anki responsive (default: 250ms).",
    )
    parser.add_argument(
        "--anki-url",
        default=DEFAULT_ANKI_CONNECT_URL,
        help="AnkiConnect URL (default: http://127.0.0.1:8765).",
    )
    args = parser.parse_args()

    if not os.path.isdir(args.folder):
        print(f"Folder not found: {args.folder}")
        return 1

    print("Make sure Anki is open and AnkiConnect is installed/enabled.")
    try:
        ensure_anki_connect(args.anki_url)
    except RuntimeError as exc:
        print(f"{exc}\nOpen Anki and enable AnkiConnect, then retry.")
        return 1
    apkg_files = find_apkg_files(args.folder)
    failures = import_packages(apkg_files, args.delay_ms, args.anki_url)

    if failures:
        print(f"Done with {failures} failure(s).")
        return 1

    print("Done. All packages imported.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
