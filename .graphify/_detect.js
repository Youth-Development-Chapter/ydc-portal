const { detect } = require('@sentropic/graphify');
const fs = require('fs');
const result = detect('.');
fs.writeFileSync('.graphify/.graphify_detect.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
