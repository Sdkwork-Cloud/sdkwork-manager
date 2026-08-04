import { readFileSync } from "node:fs";

const base = "http://127.0.0.1:5190";
const entry = "/src/main.tsx";
const seen = new Set();
const queue = [entry];
const failures = new Map(); // specifier -> Set(importer)
const otherErrors = [];

function extractModuleUrls(source, importerUrl) {
  const urls = [];
  for (const m of source.matchAll(/(?:from|import\s*\(\s*|import\s+|export\s+\*\s+from\s+|import\s*\(\s*)\s*["']([^"']+)["']/gu)) {
    const raw = m[1];
    if (!raw.startsWith("/")) {
      continue;
    }
    const url = raw.split("?")[0].split("#")[0];
    if (
      url.startsWith("/@vite/")
      || url.startsWith("/node_modules/.vite/")
      || url.startsWith("/@react-refresh")
      || url === "/favicon.svg"
      || url.endsWith(".css")
      || url.endsWith(".svg")
      || url.endsWith(".png")
      || url.endsWith(".woff2")
    ) {
      continue;
    }
    urls.push(url);
  }
  return urls;
}

while (queue.length > 0) {
  const url = queue.shift();
  if (seen.has(url)) {
    continue;
  }
  seen.add(url);
  let response;
  try {
    response = await fetch(base + url, { signal: AbortSignal.timeout(30_000) });
  } catch (error) {
    otherErrors.push({ url, type: "fetch", message: String(error?.message ?? error) });
    continue;
  }
  const text = await response.text();
  if (text.includes("Failed to resolve import")) {
    for (const m of text.matchAll(/Failed to resolve import \\?\\?"([^\\"]+)\\?\\?" from \\?\\?"([^\\"]+)\\?\\?"/gu)) {
      const spec = m[1];
      const importer = m[2];
      if (!failures.has(spec)) {
        failures.set(spec, new Set());
      }
      failures.get(spec).add(importer);
    }
    continue;
  }
  if (text.includes('"message"') && text.includes("error")) {
    const msg = text.match(/"message":"([^"]{0,200})/u)?.[1];
    if (msg && !msg.includes("Failed to resolve import")) {
      otherErrors.push({ url, type: "transform", message: msg });
    }
  }
  for (const next of extractModuleUrls(text, url)) {
    if (!seen.has(next)) {
      queue.push(next);
    }
  }
}

console.log(`modules crawled: ${seen.size}`);
console.log(`unique failing specifiers: ${failures.size}`);
for (const [spec, importers] of [...failures.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  console.log(`- ${spec}`);
  for (const importer of [...importers].slice(0, 2)) {
    console.log(`    from ${importer}`);
  }
}
if (otherErrors.length > 0) {
  console.log(`other errors: ${otherErrors.length}`);
  for (const error of otherErrors.slice(0, 10)) {
    console.log(`  [${error.type}] ${error.url}: ${error.message}`);
  }
}
