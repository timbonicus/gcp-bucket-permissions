const crypto = require("crypto");
const express = require("express");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { v4: uuid } = require("uuid");

// Create a file with some random data
const data = crypto.randomBytes(12 * 1024);
const filePath = path.join(__dirname, `file-${uuid()}`);
fs.writeFileSync(filePath, data);

const app = express();

app.get("/", function (req, res) {
  res.send("Example server running. GET /copy to run copy tests.");
});

app.get("/copy", function (req, res) {
  res.write(`TEST 1: Control, copy to non-GCS directory...\n`);
  const controlFilePath = path.join(__dirname, `control-${uuid()}`);
  res.write(`Copying file from ${filePath} to ${controlFilePath}...\n`);

  res.write(`TEST 2: Copy from local directory to GCS mount...\n`);
  res.write(`Copying file from ${filePath} to /external...\n`);
  try {
    fs.copyFileSync(filePath, path.join("/external", path.basename(filePath)));
  } catch (err) {
    res.write(`Error copying directly to /external: ${err.message}\n`);
  }

  res.write(`TEST 3: Copy from system temp directory to GCS mount...\n`);
  const tempDir = path.join(os.tmpdir(), uuid());
  fs.mkdirSync(tempDir, { recursive: true });
  const tempFilePath = path.join(tempDir, path.basename(filePath));
  try {
    res.write(`Copying file from ${filePath} to ${tempDir}...\n`);
    fs.copyFileSync(filePath, tempFilePath);
    res.write(`Copying file from ${tempDir} to /external...\n`);
    fs.copyFileSync(
      tempFilePath,
      path.join("/external", path.basename(filePath))
    );
  } catch (err) {
    res.write(
      `Error copying from temp directory to /external: ${err.message}\n`
    );
  }

  res.write(`TEST 4: Write to GCS mount directly and copy...\n`);
  const writeFilePath = path.join("/external", `write-${uuid()}`);
  try {
    fs.writeFileSync(writeFilePath, data);
    const copyFilePath = path.join("/external", `copy-${uuid()}`);
    fs.copyFileSync(writeFilePath, copyFilePath);
  } catch (err) {
    res.write(`Error copying within /external: ${err.message}\n`);
  }
  res.end();
});

app.listen(8080);
console.log("Server running on port 8080");
