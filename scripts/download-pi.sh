#!/bin/bash
# 断点续传式并行分块下载 MIT pi-billion.txt（1,000,000,002 字节）
# 用法: scripts/download-pi.sh [最大秒数]   可反复运行直到完成
set -u
URL="https://stuff.mit.edu/afs/sipb/contrib/pi/pi-billion.txt"
TOTAL=1000000002
CHUNK=24000000
PAR=12
MAX_SECS="${1:-240}"
DIR="$(cd "$(dirname "$0")/.." && pwd)/pi_chunks"
mkdir -p "$DIR"
START_TS=$(date +%s)

# 生成块清单: "idx start end"
i=0
> /tmp/pi_chunks_list.txt
while [ $((i * CHUNK)) -lt $TOTAL ]; do
  s=$((i * CHUNK)); e=$((s + CHUNK - 1))
  [ $e -ge $TOTAL ] && e=$((TOTAL - 1))
  echo "$i $s $e" >> /tmp/pi_chunks_list.txt
  i=$((i + 1))
done

fetch_chunk() {
  local idx=$1 s=$2 e=$3
  local f="$DIR/chunk_$(printf '%03d' "$idx")"
  local want=$((e - s + 1))
  local have
  have=$(stat -f%z "$f" 2>/dev/null || echo 0)
  [ "$have" -ge "$want" ] && return 0
  # 从已有字节处续传，追加写入
  curl -s --max-time 280 -r $((s + have))-"$e" "$URL" >> "$f" 2>/dev/null
}

complete=0; incomplete=0
mapfile -t LINES < /tmp/pi_chunks_list.txt 2>/dev/null || LINES=()
[ ${#LINES[@]} -eq 0 ] && while IFS= read -r l; do LINES+=("$l"); done < /tmp/pi_chunks_list.txt

for line in "${LINES[@]}"; do
  set -- $line
  idx=$1; s=$2; e=$3
  f="$DIR/chunk_$(printf '%03d' "$idx")"
  want=$((e - s + 1))
  have=$(stat -f%z "$f" 2>/dev/null || echo 0)
  if [ "$have" -ge "$want" ]; then
    complete=$((complete + 1))
    continue
  fi
  # 时间预算用完就停止开新批次
  now=$(date +%s)
  [ $((now - START_TS)) -gt "$MAX_SECS" ] && { incomplete=$((incomplete + 1)); continue; }
  # 并行一批
  fetch_chunk "$idx" "$s" "$e" &
  # 控制并发数
  while [ "$(jobs -r | wc -l)" -ge "$PAR" ]; do sleep 1; done
done
wait

# 汇总状态
done_bytes=0; done_chunks=0; total_chunks=0
for line in "${LINES[@]}"; do
  set -- $line
  idx=$1; s=$2; e=$3
  f="$DIR/chunk_$(printf '%03d' "$idx")"
  want=$((e - s + 1))
  have=$(stat -f%z "$f" 2>/dev/null || echo 0)
  total_chunks=$((total_chunks + 1))
  [ "$have" -ge "$want" ] && done_chunks=$((done_chunks + 1))
  done_bytes=$((done_bytes + have))
done
echo "PROGRESS chunks=$done_chunks/$total_chunks bytes=$done_bytes/$TOTAL"
[ "$done_chunks" -eq "$total_chunks" ] && echo "DOWNLOAD_COMPLETE" || echo "DOWNLOAD_INCOMPLETE"
