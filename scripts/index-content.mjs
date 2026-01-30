import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import OpenAI from "openai";

const CONTENT_DIR = path.resolve(process.cwd(), "content");
const ALLOWED_EXTS = new Set([".md", ".txt", ".pdf"]);

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("Missing OPENAI_API_KEY in environment.");
  process.exit(1);
}

const client = new OpenAI({ apiKey });

const entries = await fsPromises.readdir(CONTENT_DIR, { withFileTypes: true });
const files = entries
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name)
  .filter((name) => ALLOWED_EXTS.has(path.extname(name).toLowerCase()));

if (files.length === 0) {
  console.error("No content files found in ./content (expected .md, .txt, .pdf)");
  process.exit(1);
}

const uploaded = [];
for (const filename of files) {
  const fullPath = path.join(CONTENT_DIR, filename);
  const file = await client.files.create({
    file: fs.createReadStream(fullPath),
    purpose: "assistants",
  });
  uploaded.push({ filename, id: file.id });
}

const vectorStore = await client.vectorStores.create({
  name: "Eksido Website KB",
  file_ids: uploaded.map((item) => item.id),
});

console.log("VECTOR_STORE_ID:", vectorStore.id);
console.log("Uploaded files:");
for (const item of uploaded) {
  console.log(`- ${item.filename} (${item.id})`);
}
