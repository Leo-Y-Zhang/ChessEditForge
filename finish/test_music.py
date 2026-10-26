"""Synthetic cue-sheet regression tests; the all-style matrix runs at 8 kHz."""
import json
from pathlib import Path
import subprocess
import sys
import wave

import numpy as np
import pytest

from music import PEAK, STYLES, _tempo, render, style_for, write_wav


ROOT = Path(__file__).resolve().parent
ENTRIES = json.loads((ROOT / 'fixtures' / 'cues.json').read_text(encoding='utf-8'))
SR = 8000


def rms(audio):
    return float(np.sqrt(np.mean(audio.astype(np.float64) ** 2)))


def window(audio, start, stop, sr=SR):
    return audio[round(start * sr):round(stop * sr)]


def assert_audio(audio, cues, sr):
    times = {cue['kind']:cue['t'] for cue in cues}
    assert audio.shape == (round(times['END'] * sr), 2)
    assert audio.dtype == np.float32
    assert np.isfinite(audio).all()
    assert float(np.max(np.abs(audio))) <= PEAK
    drop = rms(window(audio, times['DROP'], times['OUTRO'], sr))
    assert 10 ** (-16 / 20) <= drop <= 10 ** (-10 / 20)
    tension = rms(window(audio, times['TENSION'], times['DROP'], sr))
    assert tension <= drop * 10 ** (-18 / 20)
    gap = window(audio, times['DROP'] - .120, times['DROP'], sr)
    assert rms(gap) < 10 ** (-50 / 20)
    assert not np.any(gap)
    attack = rms(window(audio, times['DROP'], times['DROP'] + .050, sr))
    assert attack > 10 ** (-16 / 20)
    tail = rms(window(audio, times['OUTRO'], times['END'], sr))
    assert tail <= drop * 10 ** (-6 / 20)
    assert not np.any(audio[-round(.010 * sr):])
    assert np.any(audio[:, 0] != audio[:, 1])


@pytest.mark.parametrize('index', range(len(ENTRIES)))
@pytest.mark.parametrize('style', STYLES)
def test_all_fixture_arrangements(index, style):
    cues = ENTRIES[index]['cues']
    audio = render(cues, style, 2026 + index, SR)
    assert_audio(audio, cues, SR)
    # Every title slam and result has a substantial transient, including when
    # more than one HOOK occurs. Exact cue samples need a short attack ramp.
    for cue in cues:
        if cue['kind'] in ('HOOK', 'FINISH'):
            assert rms(window(audio, cue['t'], cue['t'] + .05)) > .02


@pytest.mark.parametrize('style', STYLES)
def test_determinism(style):
    cues = ENTRIES[7]['cues']
    a = render(cues, style, 311, SR)
    assert np.array_equal(a, render(cues, style, 311, SR))
    assert not np.array_equal(a, render(cues, style, 312, SR))
    # Render calls must not reseed NumPy's legacy global generator.
    np.random.seed(71)
    expected = np.random.random(3)
    np.random.seed(71)
    render(cues, style, 10, SR)
    assert np.array_equal(np.random.random(3), expected)


@pytest.mark.parametrize('vibe, expected', [
    ('PHONK', 'phonk'), ('a villain enters', 'phonk'),
    ('assassin', 'phonk'), ('quiet menace', 'phonk'),
    ('sucker-punch', 'phonk'), ('swagger', 'phonk'), ('doom', 'phonk'),
    ('comedy', 'playful'), ('MEME', 'playful'), ('cartoon', 'playful'),
    ('playful', 'playful'), ('smirk', 'playful'), ('con job', 'playful'),
    ('sneaky', 'playful'), ('a sneaky villain', 'phonk'),
    ('epic and thoughtful', 'cinematic'), ('', 'cinematic'),
])
def test_style_for(vibe, expected):
    assert style_for(vibe) == expected


@pytest.mark.parametrize('index', range(len(ENTRIES)))
def test_tempo_bar_alignment(index):
    times = {cue['kind']:cue['t'] for cue in ENTRIES[index]['cues']}
    duration = times['DROP'] - times['REVEAL']
    bpm = _tempo(times['REVEAL'], times['DROP'])
    assert 120 <= bpm <= 160
    # These synthetic fixtures all admit exact whole-bar alignment in the range.
    bars = duration * bpm / 240
    assert bars == pytest.approx(round(bars), abs=1e-10)


def test_tempo_when_exact_alignment_is_impossible():
    assert _tempo(0, .1) == 160
    assert 120 <= _tempo(0, 2) <= 160


@pytest.mark.parametrize('kind', ['HOOK', 'BEAT', 'BADGE', 'BRIDGE', 'FINAL', 'FINISH'])
def test_cue_events_change_audio_at_the_cue(kind):
    cues = ENTRIES[0]['cues']
    chosen = next(cue for cue in cues if cue['kind'] == kind)
    without = [cue for cue in cues if cue is not chosen]
    # Removing synthesis events can change the master gain, so compare local
    # waveform shape after fitting a gain rather than comparing raw levels.
    a = render(cues, 'phonk', 91, SR)
    b = render(without, 'phonk', 91, SR)
    a = window(a, chosen['t'], chosen['t'] + .04).astype(float).ravel()
    b = window(b, chosen['t'], chosen['t'] + .04).astype(float).ravel()
    fitted = np.dot(a, b) / max(np.dot(b, b), 1e-12)
    assert rms(a - fitted * b) > .0001


@pytest.mark.parametrize('index, style', [(0, 'phonk'), (1, 'cinematic'), (2, 'playful')])
def test_48000_path(index, style):
    cues = ENTRIES[index]['cues']
    audio = render(cues, style, 2026 + index)
    assert_audio(audio, cues, 48000)
    # Keep subsonic energy modest and verify the 30 Hz high-pass is effective.
    start = round(next(c['t'] for c in cues if c['kind'] == 'DROP') * 48000)
    stop = round(next(c['t'] for c in cues if c['kind'] == 'OUTRO') * 48000)
    segment = audio[start:stop].mean(axis=1)
    spectrum = np.abs(np.fft.rfft(segment * np.hanning(len(segment)))) ** 2
    freq = np.fft.rfftfreq(len(segment), 1 / 48000)
    assert spectrum[freq < 30].sum() / spectrum.sum() < .08


def test_wav_pcm_roundtrip(tmp_path):
    audio = np.array([[0., .5], [-.5, 1.], [-1., 0.]], dtype=np.float32)
    path = tmp_path / 'pcm.wav'
    write_wav(path, audio, SR)
    with wave.open(str(path), 'rb') as wav:
        assert (wav.getnchannels(), wav.getsampwidth(), wav.getframerate(),
                wav.getnframes(), wav.getcomptype()) == (2, 2, SR, 3, 'NONE')
        pcm = np.frombuffer(wav.readframes(3), dtype='<i2').reshape(-1, 2)
    assert np.max(np.abs(pcm / 32767. - audio)) <= .5 / 32767


def test_cli_all_and_selected(tmp_path):
    # Use three unmodified fixture entries to exercise CLI iteration and all
    # output metadata without rendering the entire 48 kHz matrix again.
    fixture = tmp_path / 'cues.json'
    fixture.write_text(json.dumps(ENTRIES[:3]), encoding='utf-8')
    all_dir, one_dir = tmp_path / 'all', tmp_path / 'one'
    command = [sys.executable, str(ROOT / 'music.py'), str(fixture)]
    subprocess.run(command + [str(all_dir)], check=True, capture_output=True)
    subprocess.run(command + [str(one_dir), '--id', str(ENTRIES[1]['id'])],
                   check=True, capture_output=True)
    assert {p.name for p in all_dir.iterdir()} == {f"{e['id']}.wav" for e in ENTRIES[:3]}
    assert len(list(one_dir.iterdir())) == 1
    selected = f"{ENTRIES[1]['id']}.wav"
    assert (one_dir / selected).read_bytes() == (all_dir / selected).read_bytes()
    for entry in ENTRIES[:3]:
        with wave.open(str(all_dir / f"{entry['id']}.wav"), 'rb') as wav:
            end = next(c['t'] for c in entry['cues'] if c['kind'] == 'END')
            assert wav.getnframes() == round(end * 48000)
            assert wav.getnchannels() == 2
            assert wav.getsampwidth() == 2
            assert wav.getframerate() == 48000
    result = subprocess.run(command + [str(tmp_path / 'missing'), '--id', 'absent-id'],
                            capture_output=True)
    assert result.returncode != 0
    assert not (tmp_path / 'missing').exists()


@pytest.mark.parametrize('style, sr', [('unknown', SR), ('phonk', 0), ('phonk', 3999)])
def test_invalid_render_arguments(style, sr):
    with pytest.raises(ValueError):
        render(ENTRIES[0]['cues'], style, 0, sr)


def test_invalid_timeline():
    cues = ENTRIES[0]['cues']
    with pytest.raises(ValueError):
        render([c for c in cues if c['kind'] != 'END'], 'phonk', 0, SR)
    with pytest.raises(ValueError):
        render(cues + [{'kind': 'BADGE', 't': float('nan')}], 'phonk', 0, SR)
    with pytest.raises(ValueError):
        render(cues + [{'kind': 'BADGE', 't': 10000}], 'phonk', 0, SR)
