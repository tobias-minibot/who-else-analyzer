#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "data", "who-else-list.txt");
const raw = fs.readFileSync(filePath, "utf-8");
const entries = raw
  .split("\n")
  .map((l) => l.replace(/ who else\?$/i, "").trim())
  .filter(Boolean);

console.log(`\nWho Else? Catalog Analysis`);
console.log(`=========================`);
console.log(`Total entries: ${entries.length}`);
console.log(`Unique entries: ${new Set(entries).size}`);

// Word frequency
const words = {};
entries.forEach((e) =>
  e.toLowerCase().split(/\s+/).forEach((w) => {
    words[w] = (words[w] || 0) + 1;
  })
);
const topWords = Object.entries(words)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20);
console.log(`\nTop 20 words:`);
topWords.forEach(([w, c]) => console.log(`  ${c}x ${w}`));
console.log();
