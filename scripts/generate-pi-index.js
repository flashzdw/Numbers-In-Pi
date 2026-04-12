const fs = require('fs');

const PI_FILE = process.argv[2] || '../mock_pi.txt';
const INDEX_FILE = process.argv[3] || '../pi_index.bin';
const INDEX_DIGITS = 8;
const NUM_ENTRIES = Math.pow(10, INDEX_DIGITS); // 100,000,000

console.log(`Building index for ${INDEX_DIGITS} digits from ${PI_FILE}...`);

if (!fs.existsSync(PI_FILE)) {
    console.error(`Error: File ${PI_FILE} not found. Generating a mock file for testing...`);
    let mockPi = '3.';
    for(let i=0; i<20000000; i++) { // 20M digits for testing
        mockPi += Math.floor(Math.random() * 10).toString();
    }
    fs.writeFileSync(PI_FILE, mockPi);
    console.log(`Mock Pi file generated at ${PI_FILE}`);
}

const piData = fs.readFileSync(PI_FILE, 'utf-8');
const index = new Uint32Array(NUM_ENTRIES);
index.fill(0xFFFFFFFF); // max uint32 for "not found"

let processedCount = 0;
// Skip "3." at the beginning
for (let i = 2; i <= piData.length - INDEX_DIGITS; i++) {
    const numStr = piData.substring(i, i + INDEX_DIGITS);
    const num = parseInt(numStr, 10);
    
    // Record first occurrence
    if (!isNaN(num) && index[num] === 0xFFFFFFFF) {
        index[num] = i - 2; // Offset after decimal
    }
    
    processedCount++;
    if (processedCount % 10000000 === 0) {
        console.log(`Processed ${processedCount} digits...`);
    }
}

const buffer = Buffer.from(index.buffer);
fs.writeFileSync(INDEX_FILE, buffer);
console.log(`Index built and saved to ${INDEX_FILE} (${buffer.length} bytes).`);
