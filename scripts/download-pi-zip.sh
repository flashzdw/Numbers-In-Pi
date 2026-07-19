#!/bin/bash
# 断点续传式并行分块下载 calculat.io 1b.zip（469,005,602 字节）
# 用法: scripts/download-pi-zip.sh [最大秒数]   可反复运行直到完成
set -u
URL="https://calculat.io/storage/pi/1b.zip"
TOTAL=469005602
CHUNK=16000000
PAR=14
MAX_SECS="${1:-30}"
DIR="$(cd "$(dirname "$0")/.." && pwd)/pi_zip_chunks"
mkdir -p "$DIR"
START_TS=$(date +%s)

i=0
> /tmp/pi_zip_chunks_list.txt
while [ $((i * CHUNK)) -lt $TOTAL ]; do
  s=$((i * CHUNK)); e=$((s + CHUNK - 1))
  [ $e -ge $TOTAL ] && e=$((TOTAL - 1))
  echo "$i $s $e" >> /tmp/pi_zip_chunks_list.txt
  i=$((i + 1))
done

fetch_chunk() {
  local idx=$1 s=$2 e=$3
  local f="$DIR/chunk_$(printf '%03d' "$idx")"
  local want=$((e - s + 1))
  local have
  have=$(stat -f%z "$f" 2>/dev/null || echo 0)
  [ "$have" -ge "$want" ] && return 0
  curl -s --max-time 250 -r $((s + have))-"$e" "$URL" >> "$f" 2>/dev/null
}

while IFS= read -r line; do
  set -- $line
  idx=$1; s=$2; e=$3
  f="$DIR/chunk_$(printf '%03d' "$idx")"
  want=$((e - s + 1))
  have=$(stat -f%z "$f" 2>/dev/null || echo 0)
  [ "$have" -ge "$want" ] && continue
  now=$(date +%s)
  [ $((now - START_TS)) -gt "$MAX_SECS" ] && continue
  fetch_chunk "$idx" "$s" "$e" &
  while [ "$(jobs -r | wc -l)" -ge "$PAR" ]; do sleep 1; done
done < /tmp/pi_zip_chunks_list.txt
wait

done_bytes=0; done_chunks=0; total_chunks=0
while IFS= read -r line; do
  set -- $line
  idx=$1; s=$2; e=$3
  f="$DIR/chunk_$(printf '%03d' "$idx")"
  want=$((e - s + 1))
  have=$(stat -f%z "$f" 2>/dev/null || echo 0)
  total_chunks=$((total_chunks + 1))
  [ "$have" -ge "$want" ] && done_chunks=$((done_chunks + 1))
  done_bytes=$((done_bytes + have))
done < /tmp/pi_zip_chunks_list.txt
echo "PROGRESS chunks=$done_chunks/$total_chunks bytes=$done_bytes/$TOTAL"
[ "$done_chunks" -eq "$total_chunks" ] && echo "DOWNLOAD_COMPLETE" || echo "DOWNLOAD_INCOMPLETE"
