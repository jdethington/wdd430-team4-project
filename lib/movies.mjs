import fs from "fs";

const inputFile = "./lib/watchlist-db.ts";
const outputFile = "./movies.json";

const source = fs.readFileSync(inputFile, "utf8");

// Get everything after `export const movies: Movies[] =`
const match = source.match(
  /export\s+const\s+movies\s*:\s*Movies\[\]\s*=\s*(\[[\s\S]*\])\s*;?\s*$/,
);

if (!match) {
  throw new Error("Could not find the movies array.");
}

const arrayText = match[1];

// Convert the JavaScript object array into actual objects.
// Only use this with a trusted data file.
const movies = Function(`"use strict"; return (${arrayText});`)();

fs.writeFileSync(outputFile, JSON.stringify(movies, null, 2), "utf8");

console.log(`Converted ${movies.length} movies.`);
console.log(`Created: ${outputFile}`);
