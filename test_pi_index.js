const fs = require('fs');

// 1. Generate a mock Pi file (10 million digits for testing)
const PI_LENGTH = 10000000;
console.log(`Generating ${PI_LENGTH} digits of mock Pi...`);
let mockPi = '3.';
for(let i=0; i<PI_LENGTH; i++) {
    mockPi += Math.floor(Math.random() * 10).toString();
}
fs.writeFileSync('/workspace/mock_pi.txt', mockPi);
console.log('Mock Pi generated.');

// 2. Build the index for up to 6-digit numbers (to save time in this small test)
// For 6 digits, we need 1,000,000 entries * 4 bytes = 4MB
const INDEX_DIGITS = 6;
const NUM_ENTRIES = Math.pow(10, INDEX_DIGITS);
const index = new Uint32Array(NUM_ENTRIES);
index.fill(0xFFFFFFFF); // Fill with max uint32 to indicate "not found"

console.log(`Building index for ${INDEX_DIGITS} digits...`);
// Only process the fractional part
for (let i = 2; i <= mockPi.length - INDEX_DIGITS; i++) {
    const numStr = mockPi.substring(i, i + INDEX_DIGITS);
    const num = parseInt(numStr, 10);
    if (index[num] === 0xFFFFFFFF) {
        index[num] = i - 2; // Position after the decimal point
    }
}

const buffer = Buffer.from(index.buffer);
fs.writeFileSync('/workspace/pi_index.bin', buffer);
console.log(`Index built and saved to pi_index.bin (${buffer.length} bytes).`);

// 3. Simulate an R2 Range Request query
function querySimulateR2(queryStr) {
    console.log(`\n--- Querying for "${queryStr}" ---`);
    const targetLength = queryStr.length;
    
    // We pad with zeros and nines to find the range in the index
    const minVal = parseInt(queryStr.padEnd(INDEX_DIGITS, '0'), 10);
    const maxVal = parseInt(queryStr.padEnd(INDEX_DIGITS, '9'), 10);
    
    // Simulate R2 Range request: read from (minVal * 4) to (maxVal * 4 + 3)
    const offset = minVal * 4;
    const length = (maxVal - minVal + 1) * 4;
    
    console.log(`[R2 Simulation] Fetching range bytes=${offset}-${offset + length - 1} from pi_index.bin`);
    
    const fd = fs.openSync('/workspace/pi_index.bin', 'r');
    const readBuf = Buffer.alloc(length);
    fs.readSync(fd, readBuf, 0, length, offset);
    fs.closeSync(fd);
    
    const indexSlice = new Uint32Array(readBuf.buffer, readBuf.byteOffset, length / 4);
    
    let minPos = 0xFFFFFFFF;
    for (let i = 0; i < indexSlice.length; i++) {
        if (indexSlice[i] < minPos) {
            minPos = indexSlice[i];
        }
    }
    
    if (minPos === 0xFFFFFFFF) {
        console.log(`Result: Not found.`);
        return;
    }
    
    console.log(`Found at position: ${minPos}`);
    
    // Simulate R2 Range request for context
    const contextStart = Math.max(0, minPos - 10);
    const contextLength = targetLength + 20;
    console.log(`[R2 Simulation] Fetching context bytes=${contextStart + 2}-${contextStart + 2 + contextLength - 1} from mock_pi.txt`);
    
    const piFd = fs.openSync('/workspace/mock_pi.txt', 'r');
    const piBuf = Buffer.alloc(contextLength);
    fs.readSync(piFd, piBuf, 0, contextLength, contextStart + 2); // +2 for "3."
    fs.closeSync(piFd);
    
    console.log(`Context: ...${piBuf.toString()}...`);
}

querySimulateR2("1234");
querySimulateR2("99999");
querySimulateR2("000000");

