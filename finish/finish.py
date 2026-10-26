"""Finish a silent edit: voiceover, a score cut to its cue sheet (optionally subtitles for spoken
lines the edit does not already show), loudness at -14 LUFS. The picture is copied, not re-encoded. Runs in the chess-finish image.

    python finish.py cues.json GAMES_DIR OUT_DIR --model MODEL --voices VOICES [--id ID] [--voice af_heart]

GAMES_DIR/<folder>/<id>.mp4 is read; OUT_DIR/<folder>/<id>.mp4 is written.
"""
import argparse
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
import music  # noqa: E402

VOICE_SR = 24000
SUB_TOP = 0.215  # subtitles sit in the clear band under the edit's own title
WORD = re.compile(r"[a-z0-9]+")


def words(text):
    return WORD.findall(text.lower().replace("’", "'").replace("'", ""))


def sentences(line):
    return [s for s in re.split(r"(?<=[.!?…])\s+", line.strip()) if s]


def trim(audio, floor=0.01):
    loud = np.flatnonzero(np.abs(audio) > floor)
    if not len(loud):
        return audio
    a, b = max(loud[0] - int(0.02 * VOICE_SR), 0), min(loud[-1] + int(0.06 * VOICE_SR), len(audio))
    return audio[a:b]


def on_screen(edit, t, sentence):
    """True when the edit already shows these words around time t (its hook, beat, finish or
    title card), so a subtitle would only repeat them."""
    shown = []
    for c in edit["cues"]:
        if c.get("text") and abs(c["t"] - t) <= 2.5:
            shown += words(c["text"])
    outro = next((c["t"] for c in edit["cues"] if c["kind"] == "OUTRO"), 1e9)
    if t >= outro - 0.5:
        shown += words(edit["title"])
    want = words(sentence)
    if not want:
        return True
    return sum(w in shown for w in want) / len(want) >= 0.75


def voice_track(edit, kokoro, voice, end):
    """The narration placed at its times, each line sped up only if it would run into the next."""
    track = np.zeros(int(end * VOICE_SR) + VOICE_SR, dtype=np.float32)
    lines = edit["narration"]
    placed = []
    for i, line in enumerate(lines):
        room = (lines[i + 1]["t"] if i + 1 < len(lines) else end - 0.35) - line["t"] - 0.08
        speed = 1.0
        audio = trim(kokoro.create(line["text"], voice=voice, speed=speed, lang="en-us")[0])
        if len(audio) / VOICE_SR > room:
            speed = min(1.35, len(audio) / VOICE_SR / room * 1.02)
            audio = trim(kokoro.create(line["text"], voice=voice, speed=speed, lang="en-us")[0])
        start = int(line["t"] * VOICE_SR)
        audio = audio[: max(len(track) - start, 0)]
        track[start:start + len(audio)] += audio
        placed.append((line, line["t"], len(audio) / VOICE_SR, speed))
    return track[: int(end * VOICE_SR)], placed


def ass_time(t):
    cs = int(round(t * 100))
    return f"{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}"


def subtitles(edit, placed, width, height):
    events = []
    for line, start, dur, _ in placed:
        parts = sentences(line["text"])
        total = sum(len(p) for p in parts) or 1
        t = start
        for p in parts:
            span = dur * len(p) / total
            if not on_screen(edit, t, p):
                text = p.upper().replace("...", "…")
                events.append(f"Dialogue: 0,{ass_time(t)},{ass_time(t + max(span, 0.9) + 0.25)},Sub,,0,0,0,,{{\\fad(110,140)}}{text}")
            t += span
    if not events:
        return None
    size = round(height * 0.03)
    head = [
        "[Script Info]", "ScriptType: v4.00+", f"PlayResX: {width}", f"PlayResY: {height}", "WrapStyle: 0",
        "ScaledBorderAndShadow: yes", "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, "
        "Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, "
        "MarginR, MarginV, Encoding",
        f"Style: Sub,Roboto Condensed,{size},&H00FFFFFF,&H00FFFFFF,&H64000000,&H96000000,-1,0,0,0,100,100,2,0,1,"
        f"{max(2, size // 22)},{max(1, size // 30)},8,{round(width * 0.09)},{round(width * 0.09)},{round(height * SUB_TOP)},1",
        "",
        "[Events]",
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ]
    return "\n".join(head + events) + "\n"


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        sys.exit(f"failed: {' '.join(cmd)}\n{r.stderr[-2000:]}")
    return r


def finish(edit, games, out, kokoro, voice, seed, burn_subs=False):
    import soundfile as sf

    src = games / edit["folder"] / f"{edit['id']}.mp4"
    probe = json.loads(run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                            "stream=width,height:format=duration", "-of", "json", str(src)]).stdout)
    width, height = probe["streams"][0]["width"], probe["streams"][0]["height"]
    end = next(c["t"] for c in edit["cues"] if c["kind"] == "END")
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        style = music.style_for(edit["vibe"])
        sf.write(tmp / "music.wav", music.render(edit["cues"], style, seed), 48000, subtype="PCM_16")
        vo, placed = voice_track(edit, kokoro, voice, end)
        sf.write(tmp / "voice.wav", vo, VOICE_SR, subtype="PCM_16")
        # the music ducks under the voice; then one measured loudness pass to -14 LUFS
        graph = ("[1:a]aresample=48000,asplit=2[vo][key];"
                 "[0:a][key]sidechaincompress=threshold=0.02:ratio=5:attack=15:release=350:makeup=1[bed];"
                 "[bed][vo]amix=inputs=2:weights='1 1.5':normalize=0[mix]")
        run(["ffmpeg", "-v", "error", "-y", "-i", str(tmp / "music.wav"), "-i", str(tmp / "voice.wav"),
             "-filter_complex", graph, "-map", "[mix]", "-ar", "48000", str(tmp / "mix.wav")])
        stats = run(["ffmpeg", "-v", "info", "-i", str(tmp / "mix.wav"), "-af",
                     "loudnorm=I=-14:TP=-2:LRA=11:print_format=json", "-f", "null", "-"]).stderr
        m = json.loads(stats[stats.rindex("{"):stats.rindex("}") + 1])
        norm = (f"loudnorm=I=-14:TP=-2:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
                f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
        # band-limit, then a limiter: AAC removes the top octave, and sharp transients (plucks,
        # woodblock) then overshoot by up to 4.6 dB. Encode, measure the true peak of what was
        # actually encoded, and tighten the limiter until it is under -1 dBTP.
        limit_db = -3.0
        for _ in range(4):
            run(["ffmpeg", "-v", "error", "-y", "-i", str(tmp / "mix.wav"), "-af",
                 norm + ",aformat=channel_layouts=stereo,lowpass=f=15000:poles=2,lowpass=f=15000:poles=2,"
                 f"aresample=192000,alimiter=limit={10 ** (limit_db / 20):.4f}:attack=1:release=60:level=disabled,"
                 "aresample=48000", "-ar", "48000", "-c:a", "aac", "-b:a", "320k", str(tmp / "final.m4a")])
            peak = true_peak(tmp / "final.m4a")
            if peak <= -1.0:
                break
            limit_db -= peak + 1.5
        # off by default: every narrated line is already one of the edit's own titles (the
        # script is generated from the storyboard), so a subtitle layer only doubles the text
        ass = subtitles(edit, placed, width, height) if burn_subs else None
        dest = out / edit["folder"] / f"{edit['id']}.mp4"
        dest.parent.mkdir(parents=True, exist_ok=True)
        cmd = ["ffmpeg", "-v", "error", "-y", "-i", str(src), "-i", str(tmp / "final.m4a"), "-map", "0:v:0",
               "-map", "1:a:0", "-map_metadata", "-1", "-map_chapters", "-1"]
        if ass:
            (tmp / "subs.ass").write_text(ass, encoding="utf-8")
            cmd += ["-vf", f"subtitles={tmp / 'subs.ass'}", "-c:v", "libx264", "-preset", "medium", "-crf", "16",
                    "-pix_fmt", "yuv420p", "-profile:v", "high"]
        else:
            cmd += ["-c:v", "copy"]
        cmd += ["-c:a", "copy", "-shortest", "-movflags", "+faststart", str(dest)]
        run(cmd)
    subs = 0 if not ass else ass.count("Dialogue:")
    return {"id": edit["id"], "style": style, "subs": subs, "lufs_in": m["input_i"],
            "limit_db": round(limit_db, 1), "true_peak": peak, "speeds": [round(p[3], 2) for p in placed]}


def true_peak(path):
    """True peak in dBTP of an encoded file, as a player decoding it would see it."""
    err = run(["ffmpeg", "-v", "info", "-i", str(path), "-af", "ebur128=peak=true", "-f", "null", "-"]).stderr
    lines = [l for l in err.splitlines() if l.strip().startswith("Peak:")]
    return float(lines[-1].split()[1])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cues", type=Path)
    ap.add_argument("games", type=Path)
    ap.add_argument("out", type=Path)
    ap.add_argument("--model", type=Path, required=True, help="path to kokoro-v1.0.onnx")
    ap.add_argument("--voices", type=Path, required=True, help="path to voices-v1.0.bin")
    ap.add_argument("--id")
    ap.add_argument("--voice", default="af_heart")
    ap.add_argument("--subs", action="store_true", help="burn subtitles for lines the edit does not show")
    a = ap.parse_args()
    from kokoro_onnx import Kokoro
    kokoro = Kokoro(str(a.model), str(a.voices))
    edits = json.loads(a.cues.read_text(encoding="utf-8"))
    for n, edit in enumerate(edits):
        if a.id and edit["id"] != a.id:
            continue
        print(json.dumps(finish(edit, a.games, a.out, kokoro, a.voice, seed=n + 1, burn_subs=a.subs)), flush=True)


if __name__ == "__main__":
    main()
