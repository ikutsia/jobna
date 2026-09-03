const fs = require("fs");
const path = require("path");

const source = path.join(
  __dirname,
  "..",
  "node_modules",
  "pdfjs-dist",
  "build",
  "pdf.worker.min.mjs"
);
const destination = path.join(__dirname, "..", "public", "pdf.worker.min.mjs");

if (!fs.existsSync(source)) {
  console.error("PDF.js worker not found at", source);
  process.exit(1);
}

fs.copyFileSync(source, destination);
console.log("Copied PDF.js worker to public/pdf.worker.min.mjs");
