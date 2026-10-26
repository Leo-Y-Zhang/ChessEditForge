"""Collect each edit's cue sheet and narration into a JSON file.

Usage: python gather_cues.py GAMES_DIR OUT_JSON
"""
import argparse
import json
import re
from pathlib import Path

T = re.compile(r"^(\d+):(\d+\.\d+)\s+(\S+)\s*(.*)$")


def secs(m, s):
    return round(int(m) * 60 + float(s), 3)


def gather_cues(games):
    edits = []
    for day in sorted(games.iterdir()):
        if not day.is_dir():
            continue
        mp4 = next(day.glob("*.mp4"))
        cues, lines = [], []
        for raw in (day / "cuts.txt").read_text(encoding="utf-8").splitlines():
            m = T.match(raw.strip())
            if m:
                rest = m[4].strip()
                q = re.search(r'"([^"]+)"', rest)
                cues.append({"t": secs(m[1], m[2]), "kind": m[3], "text": q[1] if q else (rest if m[3] == "FINISH" else "")})
        for raw in (day / "narration.txt").read_text(encoding="utf-8").splitlines():
            m = re.match(r"^(\d+):(\d+\.\d+)\s+(.+)$", raw.strip())
            if m:
                lines.append({"t": secs(m[1], m[2]), "text": m[3].strip()})
        vibe = ""
        for raw in (day / "sound.txt").read_text(encoding="utf-8").splitlines():
            if raw.startswith("Vibe:"):
                vibe = raw.split(":", 1)[1].strip()
        edits.append({"id": mp4.stem, "day": day.name[:6], "folder": day.name, "title": day.name.split(" — ", 1)[1] if " — " in day.name else "", "cues": cues, "narration": lines, "vibe": vibe})
    return edits


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("games", type=Path)
    ap.add_argument("out", type=Path)
    a = ap.parse_args()
    edits = gather_cues(a.games)
    a.out.write_text(json.dumps(edits, indent=1, ensure_ascii=False), encoding="utf-8")
    print(len(edits), "edits")


if __name__ == "__main__":
    main()
