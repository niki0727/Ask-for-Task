import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const publicDir = path.resolve("public");
const checkOnly = process.argv.includes("--check");
const origin = "https://askfortask.co.uk";
const changed = [];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

function hashFile(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex").slice(0, 12);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceVersion(content, publicPath, version) {
  const local = escapeRegExp(publicPath);
  const absolute = escapeRegExp(`${origin}${publicPath}`);
  return content.replace(
    new RegExp(`(${absolute}|${local})(?:\\?v=[A-Za-z0-9._-]+)?`, "g"),
    `$1?v=${version}`,
  );
}

function updateFile(file, versions) {
  const original = fs.readFileSync(file, "utf8");
  let updated = original;
  for (const [publicPath, version] of versions) {
    updated = replaceVersion(updated, publicPath, version);
  }
  if (updated === original) return;
  changed.push(path.relative(process.cwd(), file));
  if (!checkOnly) fs.writeFileSync(file, updated);
}

const allFiles = walk(publicDir);
const assetFiles = allFiles.filter((file) => file.startsWith(path.join(publicDir, "assets", path.sep)));
const assetVersions = assetFiles
  .map((file) => [`/${path.relative(publicDir, file).replaceAll(path.sep, "/")}`, hashFile(file)])
  .sort(([a], [b]) => b.length - a.length);

const codeFiles = allFiles.filter((file) => /\.(?:css|js)$/.test(file));
for (const file of codeFiles) updateFile(file, assetVersions);

const codeVersions = codeFiles
  .map((file) => [`/${path.relative(publicDir, file).replaceAll(path.sep, "/")}`, hashFile(file)])
  .sort(([a], [b]) => b.length - a.length);
const htmlFiles = allFiles.filter((file) => file.endsWith(".html"));
for (const file of htmlFiles) updateFile(file, [...assetVersions, ...codeVersions]);

if (checkOnly && changed.length) {
  console.error("Immutable asset versions are stale in:");
  for (const file of changed) console.error(`- ${file}`);
  console.error("Run npm run version-assets and review the generated references.");
  process.exitCode = 1;
} else if (checkOnly) {
  console.log("Immutable asset versions match current file content.");
} else {
  console.log(`Updated immutable asset versions in ${changed.length} file${changed.length === 1 ? "" : "s"}.`);
}
