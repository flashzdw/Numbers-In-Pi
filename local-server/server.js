const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();

// 允许所有跨域请求，方便与前端联调
app.use(cors());

const PORT = process.env.PORT || 3000;

// 直接指向你项目根目录的数据文件
const INDEX_FILE = path.join(__dirname, '../pi_index.bin');
const PI_FILE = path.join(__dirname, '../mock_pi.txt'); // 如果你有真实的 pi.txt，可以在这里改名

app.get('/api/search', async (req, res) => {
  const q = req.query.q;
  if (!q || !/^\d{4,8}$/.test(q)) {
    return res.status(400).json({ error: 'Please provide a numeric query between 4 and 8 digits.' });
  }

  const targetLength = q.length;
  const indexDigits = 8;
  
  // 计算 8 位前缀的范围
  const minValStr = q.padEnd(indexDigits, '0');
  const maxValStr = q.padEnd(indexDigits, '9');
  const minVal = parseInt(minValStr, 10);
  const maxVal = parseInt(maxValStr, 10);

  const offset = minVal * 4;
  const length = (maxVal - minVal + 1) * 4;

  try {
    let indexHandle;
    try {
      // 打开本地二进制索引文件
      indexHandle = await fs.open(INDEX_FILE, 'r');
    } catch (e) {
      return res.status(500).json({ error: 'Index file not found. Please run scripts/generate-pi-index.js first.' });
    }

    // 从磁盘中精准读取 (Range Read) 指定范围内的数据，而不用把 400MB 的文件全部加载到内存
    const buffer = Buffer.alloc(length);
    await indexHandle.read(buffer, 0, length, offset);
    await indexHandle.close();

    // 转换为 32 位无符号整数数组
    const indexSlice = new Uint32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4);

    let minPos = 0xFFFFFFFF;
    for (let i = 0; i < indexSlice.length; i++) {
      if (indexSlice[i] < minPos) {
        minPos = indexSlice[i];
      }
    }

    if (minPos === 0xFFFFFFFF) {
      return res.json({ found: false, searchStr: q });
    }

    let piHandle;
    try {
      // 打开本地圆周率文本文件
      piHandle = await fs.open(PI_FILE, 'r');
    } catch (e) {
      return res.status(500).json({ error: 'Pi data file not found.' });
    }

    const contextMargin = 20;
    const contextStart = Math.max(0, minPos - contextMargin);
    const contextLength = targetLength + (contextMargin * 2);

    const piBuffer = Buffer.alloc(contextLength);
    // +2 因为文本文件开头是 "3."
    const readOffset = contextStart + 2; 
    
    // 精准读取目标位置的上下文文本
    const { bytesRead } = await piHandle.read(piBuffer, 0, contextLength, readOffset);
    await piHandle.close();

    const context = piBuffer.toString('utf-8', 0, bytesRead);

    return res.json({
      found: true,
      position: minPos,
      context: context,
      searchStr: q
    });

  } catch (err) {
    console.error('Error during search:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n===================================================`);
  console.log(`🚀 本地版 Pi Poster 后端 API 已启动!`);
  console.log(`📡 监听地址: http://localhost:${PORT}`);
  console.log(`📂 索引文件路径: ${INDEX_FILE}`);
  console.log(`📄 文本文件路径: ${PI_FILE}`);
  console.log(`===================================================\n`);
});
