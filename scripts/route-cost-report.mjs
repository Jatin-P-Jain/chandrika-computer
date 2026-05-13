import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const ROOT = process.cwd();
const NEXT_DIR = path.join(ROOT, ".next");
const SERVER_APP_DIR = path.join(NEXT_DIR, "server", "app");
const REPORT_DIR = path.join(ROOT, "reports");
const REPORT_PATH = path.join(REPORT_DIR, "route-cost-report.md");

function formatKb(bytes) {
  return (bytes / 1024).toFixed(2);
}

function getFileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

function findClientReferenceManifests(dirPath, matches = []) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      findClientReferenceManifests(fullPath, matches);
      continue;
    }

    if (entry.name.endsWith("page_client-reference-manifest.js")) {
      matches.push(fullPath);
    }
  }

  return matches;
}

function parseRscManifest(manifestFilePath) {
  const source = fs.readFileSync(manifestFilePath, "utf8");
  const sandbox = { globalThis: {} };
  vm.runInNewContext(source, sandbox);
  return sandbox.globalThis.__RSC_MANIFEST || {};
}

function toRoutePath(routeKey) {
  if (!routeKey.endsWith("/page")) return null;
  const raw = routeKey.replace(/\/page$/, "");
  return raw === "" ? "/" : raw;
}

function toServerPageFile(routePath) {
  if (routePath === "/") {
    return path.join(SERVER_APP_DIR, "page.js");
  }
  return path.join(SERVER_APP_DIR, routePath.slice(1), "page.js");
}

function toChunkFile(chunkPath) {
  return path.join(NEXT_DIR, chunkPath.replace(/^\/_next\//, ""));
}

function buildRouteCosts() {
  const manifestFiles = findClientReferenceManifests(SERVER_APP_DIR);
  const routeMap = new Map();
  const chunkToRoutes = new Map();

  for (const filePath of manifestFiles) {
    const manifests = parseRscManifest(filePath);
    for (const [routeKey, manifest] of Object.entries(manifests)) {
      const routePath = toRoutePath(routeKey);
      if (!routePath || routePath.startsWith("/_")) continue;

      const chunks = new Set();
      for (const moduleInfo of Object.values(manifest.clientModules || {})) {
        for (const chunkPath of moduleInfo.chunks || []) {
          chunks.add(chunkPath);
        }
      }

      for (const chunkPath of chunks) {
        const routes = chunkToRoutes.get(chunkPath) || new Set();
        routes.add(routePath);
        chunkToRoutes.set(chunkPath, routes);
      }

      const chunkBytes = [...chunks].reduce((total, chunkPath) => {
        return total + getFileSize(toChunkFile(chunkPath));
      }, 0);

      const serverBytes = getFileSize(toServerPageFile(routePath));

      routeMap.set(routePath, {
        routePath,
        chunks,
        clientChunkCount: chunks.size,
        clientBytes: chunkBytes,
        serverBytes,
        totalBytes: chunkBytes + serverBytes,
      });
    }
  }

  const routeCosts = [...routeMap.values()].map((item) => {
    let uniqueClientBytes = 0;

    for (const chunkPath of item.chunks) {
      const routes = chunkToRoutes.get(chunkPath);
      if (!routes || routes.size !== 1) continue;
      uniqueClientBytes += getFileSize(toChunkFile(chunkPath));
    }

    return {
      ...item,
      uniqueClientBytes,
    };
  });

  return routeCosts.sort((a, b) => b.totalBytes - a.totalBytes);
}

function renderMarkdown(routeCosts) {
  const generatedAt = new Date().toISOString();

  const lines = [
    "# Route Cost Report",
    "",
    `Generated at: ${generatedAt}`,
    "",
    "| Route | Client JS (KB) | Unique Client JS (KB) | Server JS (KB) | Total (KB) | Client Chunks |",
    "| --- | ---: | ---: | ---: | ---: | ---: |",
  ];

  for (const item of routeCosts) {
    lines.push(
      `| ${item.routePath} | ${formatKb(item.clientBytes)} | ${formatKb(
        item.uniqueClientBytes
      )} | ${formatKb(item.serverBytes)} | ${formatKb(item.totalBytes)} | ${
        item.clientChunkCount
      } |`
    );
  }

  lines.push(
    "",
    "## Notes",
    "",
    "- Client JS is summed from route client reference chunk paths.",
    "- Unique Client JS is the subset of route chunks not shared with any other route.",
    "- Shared chunks are counted per route to represent per-route cost surface.",
    "- Server JS is measured from .next/server/app/**/page.js for each route."
  );
  return lines.join("\n");
}

if (!fs.existsSync(NEXT_DIR)) {
  console.error("Missing .next directory. Run a build first.");
  process.exit(1);
}

const routeCosts = buildRouteCosts();
const markdown = renderMarkdown(routeCosts);
fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(REPORT_PATH, markdown, "utf8");

console.log("Route cost report generated:", path.relative(ROOT, REPORT_PATH));
for (const item of routeCosts.slice(0, 10)) {
  console.log(
    `${item.routePath} -> client ${formatKb(
      item.clientBytes
    )}KB, unique client ${formatKb(
      item.uniqueClientBytes
    )}KB, server ${formatKb(item.serverBytes)}KB, total ${formatKb(
      item.totalBytes
    )}KB`
  );
}
