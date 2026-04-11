const fs = require('fs');

console.time('Load Pi');
const piData = fs.readFileSync('10000000.txt', 'utf8').trim();
const piDigits = piData.startsWith('3.') ? piData.slice(2) : piData;
console.timeEnd('Load Pi');

function searchPi(query, contextSize = 20) {
    console.time('Search Pi');
    const idx = piDigits.indexOf(query);
    console.timeEnd('Search Pi');

    if (idx === -1) {
        console.log(`Could not find ${query} in the first ${piDigits.length} digits of Pi.`);
        return;
    }

    const startIdx = Math.max(0, idx - contextSize);
    const endIdx = Math.min(piDigits.length, idx + query.length + contextSize);
    
    const context = piDigits.slice(startIdx, endIdx);
    console.log(`Found ${query} at decimal position ${idx + 1}`);
    console.log(`Highlighted: ${piDigits.slice(startIdx, idx)}[${query}]${piDigits.slice(idx + query.length, endIdx)}`);
}

searchPi(process.argv[2] || '0512');
