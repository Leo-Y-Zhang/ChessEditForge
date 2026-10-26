# Finish silent edits

This Python pipeline adds timed voiceover and an original procedural score to
silent vertical chess videos, then muxes the audio into each video. The Node
renderer runs separately; this step consumes its rendered edits and cue sheets.

Each stage has a purpose:

- Gather `cuts.txt`, `narration.txt` and the `Vibe:` in `sound.txt` into one cue sheet so speech and music follow the edit's timing.
- Generate speech with Kokoro at each narration timestamp, speeding up crowded lines to help them fit.
- Synthesize the score from cues and a repeatable seed so hooks, beats, drops and finishes have matching musical events.
- Duck the music under speech so the narration stays intelligible.
- Measure loudness, then apply a second normalization pass targeting **-14 LUFS** so edits have a consistent listening level.
- Band-limit at 15 kHz and limit transients before **320k AAC** encoding to reduce codec-induced peak overshoot while retaining audio detail.
- Measure the encoded audio's true peak and tighten the limiter for a target of **<= -1 dBTP**, with up to four encoding attempts.
- Copy the picture stream by default to preserve every encoded frame and avoid the time and quality loss of re-encoding.
- Leave subtitles off by default because every narrated line is already an on-screen title, so subtitles would duplicate it.

`--subs` optionally burns subtitles for sentences that do not match nearby cue
texts or the outro title. Burning subtitles re-encodes the picture, so video
stream hashes will differ in that mode.

## Run with Docker

Run these commands from the repository root. Place rendered edit folders under
`rendered/`; each folder must contain one `<id>.mp4`, `cuts.txt`, `narration.txt`
and `sound.txt`. Folders are read in sorted order. A folder named
`Day 01 — A quiet victory` supplies `A quiet victory` as the outro title for
subtitle matching; a folder without ` — ` supplies an empty title.

Build the image (downloads packages and both model files; their SHA-256 hashes
are checked during the build):

```sh
docker build -t chess-finish finish
mkdir -p finished
```

Gather cues into `cues.json`:

```sh
docker run --rm \
  -v "$PWD:/w" -v "$PWD/rendered:/g:ro" \
  chess-finish python finish/gather_cues.py /g /w/cues.json
```

Finish all edits, preserving the input folder names under `finished/`:

```sh
docker run --rm \
  -v "$PWD:/w:ro" -v "$PWD/rendered:/g:ro" -v "$PWD/finished:/out" \
  chess-finish python finish/finish.py /w/cues.json /g /out \
    --model /models/kokoro-v1.0.onnx --voices /models/voices-v1.0.bin
```

Add `--id <id>` to select one edit, `--voice af_heart` to choose a voice, or
`--subs` to enable subtitle burning. Output files at matching paths are
overwritten. All input, output and model paths are supplied as arguments;
`/models` is the location used by this image. Runtime processing is local and
needs no downloads. Each completed edit prints a JSON record containing its
style, subtitle count, input loudness, limiter setting and encoded true peak.

Verify the finished files against the silent sources:

```sh
docker run --rm \
  -v "$PWD:/w:ro" -v "$PWD/rendered:/g:ro" -v "$PWD/finished:/out:ro" \
  chess-finish sh finish/verify.sh
```

`verify.sh` expects sources at `/g` and finished files at `/out`. It reports
video durations, the audio codec, whether the video stream hash is identical,
and decoded integrated loudness and true peak. Check for equal video durations,
`audio=aac`, `picture_identical=yes` (without `--subs`), loudness near -14 LUFS
and peak <= -1 dBTP. This is a report for inspection, not an assertion-based gate;
limiting and encoding can move loudness away from the normalization target.

## Offline tests

```sh
python -m pip install numpy==2.1.3 pytest
pytest finish/test_music.py finish/test_finish.py
```

The tests use synthetic cue sheets in `fixtures/cues.json` and temporary edit
folders. They need no model files, network, Kokoro, soundfile or ffmpeg. They
cover synthesis, cue timing, deterministic output, WAV writing, text matching,
subtitle construction and cue collection. Full speech generation, encoded
loudness and picture preservation are checked by running the Docker workflow
and inspecting `verify.sh` output.

## Licences

The **Kokoro-82M** voice model is licensed under **Apache-2.0**;
**kokoro-onnx** is licensed under **MIT**. Those licences apply to the voice
components independently of the procedural music.

The music is generated entirely by this repository's procedural synthesizer,
with no samples or existing recordings, so it is original and copyright-free.
