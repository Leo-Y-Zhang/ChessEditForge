"""Deterministic, cue-scored procedural music. Requires only Python and NumPy.

Usage: python music.py cues.json OUT_DIR [--id ID]
All synthesis and effects are generated in memory; no samples are loaded.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
import wave

import numpy as np


STYLES = ("phonk", "cinematic", "playful")
PEAK = 10 ** (-1.0 / 20)
KINDS = {"HOOK", "REVEAL", "BEAT", "BADGE", "BRIDGE", "TENSION", "DROP",
         "FINAL", "FINISH", "OUTRO", "END"}


def style_for(vibe: str) -> str:
    """Choose a style by case-insensitive phrase matching; phonk takes priority."""
    vibe = vibe.casefold()
    if any(word in vibe for word in ("phonk", "villain", "assassin", "menace",
                                    "sucker-punch", "swagger", "doom")):
        return "phonk"
    if any(word in vibe for word in ("comedy", "meme", "cartoon", "playful",
                                    "smirk", "con job", "sneaky")):
        return "playful"
    return "cinematic"


def _timeline(cues: list[dict]) -> dict[str, float]:
    times = {}
    for cue in cues:
        kind, t = cue["kind"], float(cue["t"])
        if kind not in KINDS or not math.isfinite(t) or t < 0:
            raise ValueError("Cue kinds and nonnegative finite times are required")
        if kind in {"REVEAL", "TENSION", "DROP", "OUTRO", "END"}:
            if kind in times:
                raise ValueError(f"Duplicate structural cue: {kind}")
            times[kind] = t
    order = ("REVEAL", "TENSION", "DROP", "OUTRO", "END")
    if any(kind not in times for kind in order):
        raise ValueError("REVEAL, TENSION, DROP, OUTRO and END are required")
    if not all(times[a] < times[b] for a, b in zip(order, order[1:])):
        raise ValueError("Structural cues must be in chronological order")
    if any(float(cue["t"]) > times["END"] for cue in cues):
        raise ValueError("Cues cannot follow END")
    return times


def _tempo(reveal: float, drop: float) -> float:
    """Minimize bar-duration error in seconds, then prefer a tempo near 140.

    For each possible bar count, its ideal BPM is either in range or the
    nearest boundary is optimal. This searches that finite set exactly.
    """
    duration = drop - reveal
    candidates = []
    for bars in range(1, math.ceil(duration * 160 / 240) + 2):
        bpm = min(160.0, max(120.0, 240 * bars / duration))
        error = abs(duration - 240 * bars / bpm)
        candidates.append((round(error, 12), abs(bpm - 140), bpm))
    return min(candidates)[2]


def _filter(audio: np.ndarray, sr: int, cutoff: float, master: bool = False) -> np.ndarray:
    """Causal one-pole filtering via its transfer function and a padded FFT.

    Padding covers 16 time constants, so circular wrap is below -130 dB.
    The master combines two 30 Hz high-passes and a broad 1--4 kHz dip.
    """
    a = math.exp(-2 * math.pi * min(cutoff, sr * .45) / sr)
    padding = math.ceil(16 / -math.log(a))
    size = 1 << (len(audio) + padding - 1).bit_length()
    z = np.exp(-2j * np.pi * np.fft.rfftfreq(size))
    response = (1 - a) / (1 - a * z)
    if master:
        def lp(hz):
            pole = math.exp(-2 * math.pi * min(hz, sr * .45) / sr)
            return (1 - pole) / (1 - pole * z)
        response = (1 - response) ** 2 * (1 - .42 * (lp(4000) - lp(1000)))
    spectrum = np.fft.rfft(audio, n=size, axis=0)
    if audio.ndim == 2:
        response = response[:, None]
    return np.fft.irfft(spectrum * response, n=size, axis=0)[:len(audio)]


def _osc(freq: float, t: np.ndarray, sr: int, square: bool = False) -> np.ndarray:
    """PolyBLEP saw or square, with antialiased discontinuities."""
    dt = min(freq / sr, .45)
    phase = (t * freq) % 1

    def blep(p):
        result = np.zeros_like(p)
        start = p < dt
        x = p[start] / dt
        result[start] = 2 * x - x * x - 1
        end = p > 1 - dt
        x = (p[end] - 1) / dt
        result[end] = x * x + 2 * x + 1
        return result

    if square:
        return np.where(phase < .5, 1., -1.) + blep(phase) - blep((phase + .5) % 1)
    return 2 * phase - 1 - blep(phase)


def _envelope(t: np.ndarray, decay: float, attack: float = .002) -> np.ndarray:
    env = np.minimum(t / attack, 1) * np.exp(-t / decay)
    # Release the truncated tail to avoid clicks when a voice ends.
    return env * np.minimum((t[-1] - t) / .008, 1)


def _pluck(freq: float, duration: float, sr: int, rng: np.random.Generator) -> np.ndarray:
    """Karplus-Strong: loop a noise excitation with averaging and feedback."""
    period = max(3, round(sr / freq - .5))
    ring = rng.uniform(-1, 1, period)
    result = np.empty(round(duration * sr))
    feedback = math.exp(-period / (sr * duration * .25))
    for start in range(0, len(result), period):
        count = min(period, len(result) - start)
        result[start:start + count] = ring[:count]
        ring = feedback * .5 * (ring + np.roll(ring, 1))
    t = np.arange(len(result)) / sr
    return result * _envelope(t, duration, .001)


def _reverb(audio: np.ndarray, sr: int) -> np.ndarray:
    """Parallel feedback delay combs, unrolled to inaudible tails.

    Different, nonmatching stereo delays supply a small diffuse room. Repeated
    one-pole filtering absorbs high frequencies on each round trip.
    """
    wet = np.zeros_like(audio)
    for delay, pan in ((.071, .2), (.097, .8), (.131, .45), (.173, .65)):
        tail = audio.copy()
        step = round(delay * sr)
        for repeat in range(1, 7):
            offset = repeat * step
            if offset >= len(audio):
                break
            tail = .48 * (.62 * tail + .38 * np.roll(tail, 1, axis=0))
            tail[0] = 0
            wet[offset:, 0] += tail[:-offset, 0] * (1 - pan)
            wet[offset:, 1] += tail[:-offset, 1] * pan
    return audio + .26 * wet


def render(cues: list[dict], style: str, seed: int, sr: int = 48000) -> np.ndarray:
    """Render float32 stereo music; cue times are rounded to sample positions.

    Drop RMS is mastered to -13.8 dBFS. Section gains and the final silence
    gates are applied after the room and master EQ, keeping tails cue-safe.
    """
    if style not in STYLES:
        raise ValueError(f"Unknown style: {style}")
    if not isinstance(sr, int) or sr < 4000:
        raise ValueError("sr must be an integer of at least 4000 Hz")
    times = _timeline(cues)
    rng = np.random.default_rng(seed)
    n = round(times["END"] * sr)
    audio = np.zeros((n, 2), dtype=np.float64)
    reveal, tension, drop, outro = (times[k] for k in ("REVEAL", "TENSION", "DROP", "OUTRO"))
    beat = 60 / _tempo(reveal, drop)
    root = int(rng.choice([33, 36, 38]))
    scale = [0, 2, 3, 5, 7, 10] if style != "playful" else [0, 2, 4, 7, 9, 12]
    riffs = ([0, 2, 4, 2, 3, 2, 1, 4], [0, 4, 2, 1, 0, 3, 4, 2],
             [0, 1, 2, 4, 3, 2, 4, 1])
    riff = riffs[int(rng.integers(len(riffs)))]

    def add(sound, when, gain=1., pan=.5):
        start = round(when * sr)
        left = max(0, start)
        right = min(n, start + len(sound))
        if right <= left:
            return
        segment = sound[left - start:right - start] * gain
        audio[left:right, 0] += segment * math.sqrt(1 - pan)
        audio[left:right, 1] += segment * math.sqrt(pan)

    def clock(duration):
        return np.arange(max(2, round(duration * sr))) / sr

    def drum(big=False):
        t = clock(.8 if big else .38)
        f0, fall = (42, 105) if big else (52, 95)
        phase = 2 * np.pi * (f0 * t + fall * .025 * (1 - np.exp(-t / .025)))
        body = np.sin(phase) * np.exp(-t / (.24 if big else .10))
        noise = rng.standard_normal(len(t))
        noise = noise - _filter(noise, sr, 1200)
        return (body + (.24 if big else .12) * noise * np.exp(-t / .022)) * np.minimum(t / .0007, 1)

    def impact():
        t = clock(1.4)
        boom = np.sin(2 * np.pi * (39 * t + 3 * (1 - np.exp(-t / .06)))) * np.exp(-t / .38)
        noise = _filter(rng.standard_normal(len(t)), sr, 2100) * np.exp(-t / .075)
        return (boom + .65 * noise) * _envelope(t, 1.2, .0005)

    kick, boom = drum(), impact()
    t = clock(.22)
    noise = rng.standard_normal(len(t))
    bright = noise - _filter(noise, sr, 1800)
    clap = bright * (np.exp(-t / .045) + .5 * np.exp(-np.maximum(t - .013, 0) / .025) * (t >= .013))
    ht = clock(.065)
    hn = rng.standard_normal(len(ht))
    hat = (hn - _filter(hn, sr, min(5500, sr * .36))) * _envelope(ht, .018, .0005)
    tt = clock(.035)
    tick = (np.sin(2 * np.pi * 1800 * tt) + .3 * rng.standard_normal(len(tt))) * _envelope(tt, .008, .0005)
    wt = clock(.12)
    wood = (np.sin(2 * np.pi * 820 * wt) + .45 * np.sin(2 * np.pi * 1230 * wt)) * _envelope(wt, .025, .0005)

    # Sustain under the cinematic ostinato; harmonics open progressively.
    if style == "cinematic":
        pt = np.arange(n) / sr
        opening = np.clip((pt - reveal) / max(drop - reveal, .1), 0, 1)
        pad = np.zeros(n)
        for semitone in (0, 7, 12):
            freq = 440 * 2 ** ((root + semitone - 69) / 12)
            voice = _osc(freq * .997, pt, sr) + _osc(freq * 1.003, pt, sr)
            dark = _filter(voice, sr, 280)
            pad += dark + opening * .65 * (_filter(voice, sr, 1600) - dark)
        pad *= np.clip((pt - reveal) / .5, 0, 1)
        add(pad, 0, .19, .5)

    # Every beat and subdivision is derived directly from DROP, avoiding drift.
    first = math.ceil((reveal - drop) / beat - 1e-9)
    last = math.ceil((times["END"] - drop) / beat)
    for index in range(first, last):
        when = drop + index * beat
        if when < reveal - 1e-8:
            continue
        full = when >= drop - 1e-8
        progress = np.clip((when - reveal) / (tension - reveal), 0, 1)
        gain = 1. if full else .35 + .5 * progress
        degree = scale[riff[index % len(riff)]]
        bass_degree = 0 if (index // 4) % 4 != 2 else scale[3]
        bass_freq = 440 * 2 ** ((root + bass_degree - 69) / 12)
        freq = 440 * 2 ** ((root + 24 + degree - 69) / 12)
        if style == "phonk":
            bt = clock(beat * .95)
            # Integrated exponential pitch bend supplies the 808 attack/glide.
            bend = bass_freq * .13
            phase = 2 * np.pi * (bass_freq * bt + bend * .06 * (1 - np.exp(-bt / .06)))
            bass = np.tanh(2.5 * np.sin(phase)) * _envelope(bt, beat * .7, .003)
            add(bass, when, .62 * gain)
            ct = clock(.23)
            # Tune the nominal 540/800 Hz pair to the bass's selected key.
            ratio = freq * 2 / 540
            bell = _osc(540 * ratio, ct, sr, True) + .65 * _osc(800 * ratio, ct, sr, True)
            bell = _filter(bell, sr, 3400) - _filter(bell, sr, 420)
            bell *= _envelope(ct, .065, .001)
            add(bell, when, .19 * gain, .35 + .3 * (index % 2))
            add(kick, when, .9 * gain)
            if index % 4 in (1, 3) and (full or progress > .2):
                add(clap, when, .30 * gain, .55)
            if full or progress > .35:
                for sub in (0, .5):
                    add(hat, when + sub * beat, .16 * gain, .3 if sub else .7)
                if full and index % 4 == 3:
                    for sub in (.25, .75):
                        add(hat, when + sub * beat, .12, .65)
        elif style == "cinematic":
            add(_pluck(freq / 2, beat * .8, sr, rng), when, .45 * gain, .35)
            if full or progress > .55:
                add(_pluck(freq / 2, beat * .6, sr, rng), when + beat / 2, .28 * gain, .65)
            if full or index % 4 == 0:
                add(drum(True), when, .95 * gain)
            if full and index % 4 in (1, 3):
                add(clap, when, .17)
        else:
            add(_pluck(freq, beat * .65, sr, rng), when, .8 * gain, .35)
            add(_pluck(bass_freq * 2, beat * .6, sr, rng), when, .9 * gain, .55)
            if full or progress > .3:
                add(wood, when + beat / 2, .26 * gain, .7)
            if index % 4 in (1, 3) and (full or progress > .5):
                add(clap, when, .12 * gain)
            if full:
                add(kick, when, .36)
                add(_pluck(freq * 1.5, beat * .4, sr, rng), when + beat / 2, .4, .65)

    for cue in cues:
        when, kind = float(cue["t"]), cue["kind"]
        if kind in ("HOOK", "DROP", "FINISH"):
            add(boom, when, .75 if style == "playful" else 1.25)
            add(kick, when, .6)
        elif kind == "BEAT":
            add(wood if style == "playful" else clap, when, .24)
            add(kick, when, .2)
        elif kind == "BADGE":
            add(tick, when, .18, .65)
        elif kind == "FINAL":
            add(wood if style == "playful" else kick, when, .5)
        elif kind == "BRIDGE":
            duration = min(1.6, max(.05, tension - when))
            st = clock(duration)
            noise = rng.standard_normal(len(st))
            low = _filter(noise, sr, 600)
            high = _filter(noise, sr, 5500)
            ramp = st / duration
            sweep = ((1 - ramp) * low + ramp * high) * ramp ** 1.5
            sweep *= np.minimum((duration - st) / .04, 1)
            add(sweep, when, .3, .55)

    # A restrained rising texture survives the tension duck, then stops dead.
    rt = clock(drop - tension)
    noise = rng.standard_normal(len(rt))
    ramp = rt / (drop - tension)
    riser = ((1 - ramp) * _filter(noise, sr, 400) + ramp * _filter(noise, sr, 6000)) * ramp ** 2
    add(riser, tension, .35)
    audio = _filter(_reverb(audio, sr), sr, 30, master=True)
    d, o, te, r = (round(t * sr) for t in (drop, outro, tension, reveal))
    # Introduce the outro filter just before the boundary to avoid a click.
    transition = min(o, round(.030 * sr))
    filtered_tail = _filter(audio[o - transition:], sr, 650)
    blend = np.ones(len(filtered_tail))
    blend[:transition] = np.linspace(0, 1, transition)
    audio[o - transition:] += blend[:, None] * (filtered_tail - audio[o - transition:])
    section = np.ones(n)
    section[:r] = .45
    section[r:te] = np.linspace(.45, .8, te - r)
    section[te:d] = .025  # -32 dB before the final level calibration
    section[o:] = .20
    # Finish ducking before each boundary, leaving its entire section quiet.
    for boundary, level in ((te, .025), (o, .20)):
        width = min(boundary, round(.015 * sr))
        section[boundary - width:boundary] = np.linspace(section[boundary - width], level, width)
    audio *= section[:, None]

    # Solve a single soft-limiter drive for -13.8 dBFS in the full arrangement.
    target = 10 ** (-13.8 / 20)
    reference = audio[d:o]
    lo, hi = 0., 1.
    while np.sqrt(np.mean((PEAK * np.tanh(reference * hi / PEAK)) ** 2)) < target:
        hi *= 2
    for _ in range(22):
        mid = (lo + hi) / 2
        rms = np.sqrt(np.mean((PEAK * np.tanh(reference * mid / PEAK)) ** 2))
        if rms < target:
            lo = mid
        else:
            hi = mid
    audio = PEAK * np.tanh(audio * ((lo + hi) / 2) / PEAK)
    # Bound tension/outro RMS even for unusually sparse drop arrangements.
    for start, stop, ratio in ((te, d, .07), (o, n, .40)):
        rms = np.sqrt(np.mean(audio[start:stop] ** 2))
        audio[start:stop] *= min(1., target * ratio / max(rms, 1e-12))
    gap = max(0, round((drop - .120) * sr))
    audio[gap:d] = 0
    fade_start = max(0, n - round(1.2 * sr))
    audio[fade_start:] *= (.5 + .5 * np.cos(np.linspace(0, np.pi, n - fade_start)))[:, None]
    audio[max(0, n - round(.010 * sr)):] = 0
    # Roundoff during float32 conversion must also respect the peak ceiling.
    ceiling = np.nextafter(np.float32(PEAK), np.float32(0))
    return np.clip(audio, -ceiling, ceiling).astype(np.float32)


def write_wav(path: str, audio: np.ndarray, sr: int = 48000) -> None:
    """Write stereo signed 16-bit little-endian PCM using the stdlib."""
    audio = np.asarray(audio)
    if audio.ndim != 2 or audio.shape[1] != 2 or not np.isfinite(audio).all():
        raise ValueError("audio must be a finite (samples, 2) array")
    if not isinstance(sr, int) or sr <= 0:
        raise ValueError("sr must be a positive integer")
    pcm = np.rint(np.clip(audio, -1, 1) * 32767).astype('<i2')
    with wave.open(str(path), 'wb') as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(sr)
        wav.writeframes(pcm.tobytes())


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("cues", type=Path)
    parser.add_argument("out_dir", type=Path)
    parser.add_argument("--id", help="render only the entry with this ID")
    args = parser.parse_args()
    with args.cues.open(encoding="utf-8") as file:
        entries = json.load(file)
    if args.id is not None:
        entries = [entry for entry in entries if str(entry["id"]) == args.id]
        if not entries:
            parser.error("requested ID is absent from the cue sheet")
    args.out_dir.mkdir(parents=True, exist_ok=True)
    for entry in entries:
        name = str(entry["id"])
        if name in (".", "..") or "/" in name or "\\" in name or not name:
            parser.error("IDs must be nonempty file names")
        # Stable across Python processes (unlike hash()); changing an ID also
        # gives that entry its own deterministic riff and percussion details.
        seed = int.from_bytes(hashlib.sha256(name.encode()).digest()[:8], "little")
        write_wav(args.out_dir / f"{name}.wav",
                  render(entry["cues"], style_for(entry["vibe"]), seed))


if __name__ == "__main__":
    main()
