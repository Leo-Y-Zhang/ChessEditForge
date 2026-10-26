#!/bin/sh
# compare each finished file with its silent source: same video stream length, audio present, loudness
cd /out
for d in */; do
  f=$(ls "$d"*.mp4); src="/g/$f"
  vd=$(ffprobe -v error -select_streams v:0 -show_entries stream=duration -of csv=p=0 "$f")
  sd=$(ffprobe -v error -select_streams v:0 -show_entries stream=duration -of csv=p=0 "$src")
  a=$(ffprobe -v error -select_streams a:0 -show_entries stream=codec_name -of csv=p=0 "$f")
  vh=$(ffmpeg -v error -i "$f" -map 0:v:0 -c copy -f hash -hash md5 - 2>/dev/null)
  sh=$(ffmpeg -v error -i "$src" -map 0:v:0 -c copy -f hash -hash md5 - 2>/dev/null)
  l=$(ffmpeg -v info -i "$f" -map 0:a:0 -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | tr -s ' ' | tr '\n' ' ')
  same=no; [ "$vh" = "$sh" ] && same=yes
  echo "$(basename "$f") v=$vd src=$sd audio=$a picture_identical=$same $l"
done
