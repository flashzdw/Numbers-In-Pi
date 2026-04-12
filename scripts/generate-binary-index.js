#!/usr/bin/env node

/**
 * Pi Poster - Binary Index Generator
 * 
 * This script scans a specified directory for binary files (e.g., firmware, images),
 * generates metadata (size, hash, last modified), and outputs an index.json file.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TARGET_DIR = process.argv[2] || path.join(__dirname, '../binaries');
const OUTPUT_FILE = process.argv[3] || path.join(TARGET_DIR, 'index.json');

function calculateHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

function generateIndex() {
  console.log(`Scanning directory: ${TARGET_DIR}`);

  if (!fs.existsSync(TARGET_DIR)) {
    console.warn(`Warning: Target directory ${TARGET_DIR} does not exist. Creating it.`);
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }

  const files = fs.readdirSync(TARGET_DIR);
  const index = [];

  files.forEach(file => {
    // Skip the index file itself or hidden files
    if (file === 'index.json' || file.startsWith('.')) return;

    const filePath = path.join(TARGET_DIR, file);
    const stats = fs.statSync(filePath);

    if (stats.isFile()) {
      const fileHash = calculateHash(filePath);
      
      index.push({
        filename: file,
        size: stats.size,
        hash: fileHash,
        lastModified: stats.mtime.toISOString()
      });
      console.log(`Processed: ${file}`);
    }
  });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({
    generatedAt: new Date().toISOString(),
    files: index
  }, null, 2));

  console.log(`\nSuccessfully generated index at: ${OUTPUT_FILE}`);
  console.log(`Total binaries indexed: ${index.length}`);
}

try {
  generateIndex();
} catch (error) {
  console.error('Error generating binary index:', error);
  process.exit(1);
}
