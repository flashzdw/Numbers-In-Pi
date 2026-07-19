#!/usr/bin/env python3
"""从 π 文本文件生成 8 位前缀索引（numpy 向量化版本）。

索引格式与 scripts/generate-pi-index.js 一致：
1 亿条 uint32，index[num] = 该 8 位数字在 π 小数部分首次出现的位置
（0 表示紧随 "3." 的第 1 位），0xFFFFFFFF 表示未出现。

用法: python3 scripts/generate-index-numpy.py [pi_file] [index_file]
"""
import sys
import time

import numpy as np
from numpy.lib.stride_tricks import sliding_window_view

PI_FILE = sys.argv[1] if len(sys.argv) > 1 else "pi-billion.txt"
INDEX_FILE = sys.argv[2] if len(sys.argv) > 2 else "pi_index.bin"
INDEX_DIGITS = 8
NUM_ENTRIES = 10**INDEX_DIGITS
NOT_FOUND = np.uint32(0xFFFFFFFF)
CHUNK = 25_000_000  # 每块处理的窗口数，控制内存峰值

t0 = time.time()
data = np.memmap(PI_FILE, dtype=np.uint8, mode="r")
n = len(data)
print(f"π 文件: {PI_FILE} ({n:,} 字节)")

# 窗口起点 i ∈ [2, n-8]（跳过 "3."），位置 = i - 2
first_start, last_start = 2, n - INDEX_DIGITS
total_windows = last_start - first_start + 1
print(f"窗口总数: {total_windows:,}")

index = np.full(NUM_ENTRIES, NOT_FOUND, dtype=np.uint32)
weights = (10 ** np.arange(INDEX_DIGITS - 1, -1, -1, dtype=np.int64)).astype(np.int32)

done = 0
for chunk_start in range(first_start, last_start + 1, CHUNK):
    chunk_end = min(chunk_start + CHUNK, last_start + 1)  # 窗口起点开区间上界
    seg = data[chunk_start : chunk_end + INDEX_DIGITS - 1]
    windows = sliding_window_view(seg, INDEX_DIGITS)  # (m, 8) uint8 视图，零拷贝
    digits = windows.astype(np.int32) - 48
    nums = (digits * weights).sum(axis=1, dtype=np.int32)
    positions = np.arange(
        chunk_start - 2, chunk_start - 2 + len(nums), dtype=np.uint32
    )
    # min 语义 = 首次出现位置（位置单调递增）
    np.minimum.at(index, nums, positions)
    done += len(nums)
    print(f"  已处理 {done:,}/{total_windows:,} 窗口 ({time.time()-t0:.0f}s)")

# ---- 内置校验 ----
head = bytes(data[2 : 2 + INDEX_DIGITS]).decode()
assert index[int(head)] == 0, f"首窗口 {head} 应位于位置 0，实际 {index[int(head)]}"
found = int(np.count_nonzero(index != NOT_FOUND))
print(f"8 位数字覆盖率: {found:,}/{NUM_ENTRIES} ({found/NUM_ENTRIES*100:.4f}%)")

# 随机抽查 300 个窗口：索引位置必须 <= 实际位置，且该位置内容一致
rng = np.random.default_rng(31415)
for pos in rng.integers(0, total_windows, size=300):
    off = int(pos) + 2
    w = bytes(data[off : off + INDEX_DIGITS]).decode()
    idx_val = int(index[int(w)])
    assert idx_val <= pos, f"窗口 {w} @ {pos}: 索引值 {idx_val} 更大!"
    assert bytes(data[idx_val + 2 : idx_val + 2 + INDEX_DIGITS]).decode() == w, (
        f"窗口 {w} @ {pos}: 索引位置 {idx_val} 内容不匹配"
    )
print("随机抽查 300 个窗口: 全部通过 ✓")

index.tofile(INDEX_FILE)
print(f"索引已写入 {INDEX_FILE} ({NUM_ENTRIES * 4:,} 字节)，总耗时 {time.time()-t0:.0f}s")
