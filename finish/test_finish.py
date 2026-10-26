"""Offline tests for text, timing and cue collection; no TTS or media tools needed."""
import json
from pathlib import Path
import subprocess
import sys
from types import SimpleNamespace

import numpy as np
import pytest

import finish as finishing
from finish import VOICE_SR, ass_time, on_screen, sentences, subtitles, trim, words
from gather_cues import gather_cues


ROOT = Path(__file__).resolve().parent


@pytest.mark.parametrize("text, expected", [
    ("", []),
    ("  \n ", []),
    ("  A quiet move  ", ["A quiet move"]),
    ("One. Two! Three? Four… Done.", ["One.", "Two!", "Three?", "Four…", "Done."]),
    ("Wait...\nThen win.\tReally?! Yes.", ["Wait...", "Then win.", "Really?!", "Yes."]),
    ("One.Two", ["One.Two"]),
])
def test_sentences(text, expected):
    assert sentences(text) == expected


@pytest.mark.parametrize("text, expected", [
    ("", []),
    ("…?! —", []),
    ("QUEEN takes D4, check!", ["queen", "takes", "d4", "check"]),
    ("It's the king’s move; don't rush.", ["its", "the", "kings", "move", "dont", "rush"]),
    ("Rook-to-e4: 2 moves", ["rook", "to", "e4", "2", "moves"]),
])
def test_words(text, expected):
    assert words(text) == expected


@pytest.fixture
def edit():
    return {
        "title": "A quiet victory",
        "cues": [
            {"t": 1., "kind": "HOOK", "text": "THE QUEEN FALLS"},
            {"t": 6., "kind": "BEAT", "text": "A quiet move"},
            {"t": 14., "kind": "FINISH", "text": "CHECKMATE"},
            {"t": 17., "kind": "OUTRO", "text": ""},
            {"t": 20., "kind": "END", "text": ""},
        ],
    }


@pytest.mark.parametrize("t, text, expected", [
    (1., "The queen falls.", True),
    (3.5, "The queen falls!", True),
    (3.501, "The queen falls.", False),
    (6., "A quiet move.", True),
    (6., "A quiet move wins.", True),  # the 75% overlap boundary
    (6., "A quiet move wins the game.", False),
    (14., "Checkmate!", True),
    (16.5, "A quiet victory.", True),
    (16.49, "A quiet victory.", False),
    (18., "An unseen sentence.", False),
    (0., "…?!", True),
])
def test_on_screen(edit, t, text, expected):
    assert on_screen(edit, t, text) is expected


def test_on_screen_combines_nearby_titles(edit):
    edit["cues"].insert(1, {"t": 1.5, "kind": "HOOK", "text": "THE KING WAITS"})
    assert on_screen(edit, 1., "The queen falls, the king waits.")
    assert not on_screen({"cues": [], "title": "A quiet victory"}, 18., "A quiet victory.")


@pytest.mark.parametrize("t, expected", [
    (0, "0:00:00.00"),
    (1.234, "0:00:01.23"),
    (1.236, "0:00:01.24"),
    (59.999, "0:01:00.00"),
    (3599.999, "1:00:00.00"),
    (3661.23, "1:01:01.23"),
])
def test_ass_time(t, expected):
    assert ass_time(t) == expected


@pytest.mark.parametrize("audio", [np.array([], dtype=np.float32), np.zeros(20), np.full(20, .01)])
def test_trim_keeps_audio_without_samples_above_floor(audio):
    assert trim(audio) is audio


def test_trim_keeps_voice_and_short_padding():
    audio = np.zeros(VOICE_SR, dtype=np.float32)
    audio[5000:6000] = .5
    result = trim(audio)
    np.testing.assert_array_equal(result, audio[5000 - 480:5999 + 1440])
    assert result.dtype == audio.dtype
    assert np.count_nonzero(result) == 1000


def test_trim_clamps_padding_and_accepts_custom_floor():
    audio = np.array([.1, 0., .02, 0., .1], dtype=np.float32)
    np.testing.assert_array_equal(trim(audio), audio)
    assert trim(audio, floor=.2) is audio


@pytest.mark.parametrize("text", [None, "The queen falls.", "…?!"])
def test_subtitles_returns_none_without_visible_events(edit, text):
    placed = [] if text is None else [({"text": text}, 1., 2., 1.)]
    assert subtitles(edit, placed, 1080, 1920) is None


def test_subtitles_preserves_punctuation_and_ass_tags(edit):
    text = 'Wait... It’s "rook & pawn", <check>!'
    ass = subtitles(edit, [({"text": text}, 9., 2., 1.)], 1080, 1920)
    assert "PlayResX: 1080\nPlayResY: 1920" in ass
    assert "Style: Sub,Roboto Condensed,58," in ass
    events = [line for line in ass.splitlines() if line.startswith("Dialogue:")]
    assert len(events) == 2
    assert events[0].endswith(r"{\fad(110,140)}WAIT…")
    assert events[1].endswith(r'''{\fad(110,140)}IT’S "ROOK & PAWN", <CHECK>!''')
    assert "&amp;" not in ass and "&lt;" not in ass and r"\{" not in ass
    assert ass.endswith("\n")


def test_subtitles_suppresses_shown_sentence_and_keeps_its_time(edit):
    ass = subtitles(edit, [({"text": "The queen falls. Run!"}, 1., 1.9, 1.)], 1080, 1920)
    events = [line for line in ass.splitlines() if line.startswith("Dialogue:")]
    assert events == [r"Dialogue: 0,0:00:02.52,0:00:03.67,Sub,,0,0,0,,{\fad(110,140)}RUN!"]


@pytest.fixture
def games(tmp_path):
    games = tmp_path / "rendered edits"
    games.mkdir()
    (games / "INDEX.md").write_text("Ignored index\n", encoding="utf-8")
    for folder, ident, vibe in [
        ("Day 02", "second", ""),
        ("Day 01 — A quiet victory", "first", "Vibe: quiet: thoughtful\n"),
    ]:
        day = games / folder
        day.mkdir()
        (day / f"{ident}.mp4").touch()
        (day / "cuts.txt").write_text(
            'Beat cuts\n\n0:00.95  HOOK     "THE QUEEN" slams in\n'
            '0:01.50  REVEAL   the board appears\n'
            '0:06.25  BEAT     "A quiet move…"\n'
            '1:02.75  FINISH   CHECKMATE\n'
            '1:04.00  OUTRO    title card\n'
            '1:06.125  END     video ends\n', encoding="utf-8")
        (day / "narration.txt").write_text(
            'Narration\nIgnore these instructions\n\n 0:00.95  The queen.  \n'
            '1:02.75  Checkmate!\n', encoding="utf-8")
        (day / "sound.txt").write_text("Sound notes\n" + vibe, encoding="utf-8")
    return games


def test_gather_cues_parses_folder(games):
    edits = gather_cues(games)
    assert edits == [
        {
            "id": ident, "day": f"Day 0{index}", "folder": folder, "title": title,
            "cues": [
                {"t": .95, "kind": "HOOK", "text": "THE QUEEN"},
                {"t": 1.5, "kind": "REVEAL", "text": ""},
                {"t": 6.25, "kind": "BEAT", "text": "A quiet move…"},
                {"t": 62.75, "kind": "FINISH", "text": "CHECKMATE"},
                {"t": 64., "kind": "OUTRO", "text": ""},
                {"t": 66.125, "kind": "END", "text": ""},
            ],
            "narration": [{"t": .95, "text": "The queen."}, {"t": 62.75, "text": "Checkmate!"}],
            "vibe": vibe,
        }
        for index, ident, folder, title, vibe in [
            (1, "first", "Day 01 — A quiet victory", "A quiet victory", "quiet: thoughtful"),
            (2, "second", "Day 02", "", ""),
        ]
    ]


def test_gather_cues_empty_directory(tmp_path):
    assert gather_cues(tmp_path) == []


def test_gather_cues_cli(games, tmp_path):
    out = tmp_path / "collected cues.json"
    result = subprocess.run([sys.executable, str(ROOT / "gather_cues.py"), str(games), str(out)],
                            check=True, capture_output=True, text=True)
    assert result.stdout == "2 edits\n"
    assert json.loads(out.read_text(encoding="utf-8")) == gather_cues(games)
    assert "A quiet move…" in out.read_text(encoding="utf-8")


def test_finish_cli_requires_model_paths():
    result = subprocess.run([sys.executable, str(ROOT / "finish.py"), "cues.json", "games", "out"],
                            capture_output=True, text=True)
    assert result.returncode == 2
    assert "--model" in result.stderr and "--voices" in result.stderr


def test_finish_cli_help_without_optional_dependencies():
    result = subprocess.run([sys.executable, str(ROOT / "finish.py"), "--help"],
                            check=True, capture_output=True, text=True)
    assert "--model" in result.stdout and "--voices" in result.stdout


def test_finish_cli_passes_supplied_paths(tmp_path, monkeypatch, capsys):
    cues = tmp_path / "input cues.json"
    edits = [{"id": "skip"}, {"id": "selected"}]
    cues.write_text(json.dumps(edits), encoding="utf-8")
    games, out = tmp_path / "source edits", tmp_path / "finished edits"
    model, voices = tmp_path / "model.onnx", tmp_path / "voices.bin"
    kokoro = object()
    calls = []

    def load_model(model_path, voices_path):
        assert (model_path, voices_path) == (str(model), str(voices))
        return kokoro

    def finish_edit(*args, **kwargs):
        calls.append((args, kwargs))
        return {"id": args[0]["id"]}

    monkeypatch.setitem(sys.modules, "kokoro_onnx", SimpleNamespace(Kokoro=load_model))
    monkeypatch.setattr(finishing, "finish", finish_edit)
    monkeypatch.setattr(sys, "argv", [
        "finish.py", str(cues), str(games), str(out),
        "--model", str(model), "--voices", str(voices),
        "--id", "selected", "--voice", "test_voice", "--subs",
    ])
    finishing.main()
    assert calls == [((edits[1], games, out, kokoro, "test_voice"), {"seed": 2, "burn_subs": True})]
    assert json.loads(capsys.readouterr().out) == {"id": "selected"}
