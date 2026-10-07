import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const publicDirectory = fileURLToPath(new URL("../public/", import.meta.url));
const baseUrl = "https://askfortask.co.uk";
const extensions = new Set([".html", ".css", ".js", ".xml", ".txt"]);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

function publicPath(file) {
  const path = `/${relative(publicDirectory, file).split(sep).join("/")}`;
  return path.endsWith("/index.html") ? path.slice(0, -"index.html".length) : path;
}

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const files = (await walk(publicDirectory)).filter((path) =>
  [...extensions].some((extension) => path.endsWith(extension))
);

const results = [];
for (const file of files.sort()) {
  const path = publicPath(file);
  const localHash = hash(await readFile(file));
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: { "user-agent": "A4T-readonly-release-audit/1.0" },
      signal: AbortSignal.timeout(12000)
    });
    const liveHash = hash(Buffer.from(await response.arrayBuffer()));
    results.push({ path, httpStatus: response.status, localSha256: localHash, liveSha256: liveHash, matches: localHash === liveHash });
  } catch (error) {
    results.push({ path, localSha256: localHash, matches: false, error: error.message });
  }
}

const summary = {
  checkedAtUtc: new Date().toISOString(),
  baseUrl,
  filesChecked: results.length,
  matches: results.filter((item) => item.matches).length,
  differences: results.filter((item) => !item.matches).length,
  note: "Read-only byte comparison of local public text files and live HTTP bodies; does not compare Worker code, D1, secrets, external systems or binary assets.",
  results
};
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
if (summary.differences) process.exitCode = 1;
