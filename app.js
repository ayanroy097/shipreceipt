(() => {
  "use strict";

  /** @typedef {{ path: string, bytes: number, sha256: string }} FileRow */

  /** @type {FileRow[]} */
  let rows = [];

  const $ = (id) => document.getElementById(id);
  const dropzone = $("dropzone");
  const fileInput = $("fileInput");
  const dirInput = $("dirInput");
  const hashTable = $("hashTable");
  const hashBody = $("hashBody");
  const statusEl = $("status");
  const buttons = ["btnChecksums", "btnManifest", "btnBuyer", "btnChangelog", "btnAll"].map($);

  const today = new Date();
  $("releaseDate").value = today.toISOString().slice(0, 10);

  function setStatus(msg, isErr) {
    statusEl.textContent = msg || "";
    statusEl.classList.toggle("err", !!isErr);
  }

  function setBusy(busy) {
    buttons.forEach((b) => {
      b.disabled = busy || rows.length === 0;
    });
  }

  async function sha256Hex(buffer) {
    const digest = await crypto.subtle.digest("SHA-256", buffer);
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function normalizePath(file) {
    const rel = file.webkitRelativePath || file.name;
    return rel.replace(/\\/g, "/");
  }

  async function ingestFiles(fileList) {
    const files = [...fileList].filter((f) => f && f.size >= 0 && f.name);
    if (!files.length) {
      setStatus("No files selected.", true);
      return;
    }
    setStatus(`Hashing ${files.length} file(s)…`);
    setBusy(true);
    const next = [];
    try {
      for (const file of files) {
        const buf = await file.arrayBuffer();
        const sha256 = await sha256Hex(buf);
        next.push({ path: normalizePath(file), bytes: file.size, sha256 });
      }
      next.sort((a, b) => a.path.localeCompare(b.path));
      rows = next;
      renderTable();
      setStatus(`Hashed ${rows.length} file(s). Ready to export.`);
    } catch (err) {
      console.error(err);
      setStatus("Hash failed. Try again with fewer or smaller files.", true);
      rows = [];
      renderTable();
    } finally {
      setBusy(false);
    }
  }

  function renderTable() {
    hashBody.replaceChildren();
    if (!rows.length) {
      hashTable.hidden = true;
      return;
    }
    hashTable.hidden = false;
    const frag = document.createDocumentFragment();
    for (const r of rows) {
      const tr = document.createElement("tr");
      const tdPath = document.createElement("td");
      tdPath.textContent = r.path;
      const tdBytes = document.createElement("td");
      tdBytes.textContent = String(r.bytes);
      const tdHash = document.createElement("td");
      tdHash.className = "hash";
      tdHash.textContent = r.sha256;
      tr.append(tdPath, tdBytes, tdHash);
      frag.append(tr);
    }
    hashBody.append(frag);
  }

  function meta() {
    const bullets = ($("whatChanged").value || "")
      .split("\n")
      .map((l) => l.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean);
    return {
      productName: ($("productName").value || "").trim() || "Untitled product",
      version: ($("version").value || "").trim() || "0.0.0",
      date: ($("releaseDate").value || "").trim() || today.toISOString().slice(0, 10),
      supportUrl: ($("supportUrl").value || "").trim(),
      whatChanged: bullets,
    };
  }

  /** sha256sum text format: `<hash><two spaces><path>\n` */
  function checksumsText() {
    return rows.map((r) => `${r.sha256}  ${r.path}`).join("\n") + (rows.length ? "\n" : "");
  }

  function manifestObject() {
    const m = meta();
    return {
      product: m.productName,
      version: m.version,
      date: m.date,
      supportUrl: m.supportUrl || null,
      whatChanged: m.whatChanged,
      algorithm: "SHA-256",
      fileCount: rows.length,
      files: rows.map((r) => ({ path: r.path, bytes: r.bytes, sha256: r.sha256 })),
      generatedBy: "ShipReceipt",
      note: "Hashes computed locally in the browser with Web Crypto. No upload.",
    };
  }

  function buyerUpdateMd() {
    const m = meta();
    const bullets =
      m.whatChanged.length > 0
        ? m.whatChanged.map((b) => `- ${b}`).join("\n")
        : "- (No change notes provided.)";
    const support = m.supportUrl
      ? `Support: ${m.supportUrl}`
      : "Support: (add your support URL in ShipReceipt before export)";
    return `# Buyer update — ${m.productName} ${m.version}

**Release date:** ${m.date}

## What changed

${bullets}

## How to verify this release

1. Download the product files and \`checksums.sha256\` from the same place you bought them.
2. On macOS/Linux, from the folder that contains the files:

\`\`\`bash
sha256sum -c checksums.sha256
\`\`\`

   On Windows (PowerShell), compare each file’s hash to the matching line in \`checksums.sha256\` (or use a trusted checksum tool).

3. Every file should report **OK**. If any file fails, re-download — do not install a mismatched build.

## Integrity

This notice was generated with **ShipReceipt**. Checksums use **SHA-256**. Your seller’s files were hashed in their browser; ShipReceipt does not host or receive your purchase.

${support}
`;
  }

  function changelogMd() {
    const m = meta();
    const bullets =
      m.whatChanged.length > 0
        ? m.whatChanged.map((b) => `- ${b}`).join("\n")
        : "- Initial release notes stub.";
    return `# Changelog

## ${m.version} — ${m.date}

${bullets}
`;
  }

  function downloadBlob(filename, text, type) {
    const blob = new Blob([text], { type: type || "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function requireRows() {
    if (!rows.length) {
      setStatus("Add files first.", true);
      return false;
    }
    return true;
  }

  $("btnChecksums").addEventListener("click", () => {
    if (!requireRows()) return;
    downloadBlob("checksums.sha256", checksumsText(), "text/plain;charset=utf-8");
  });
  $("btnManifest").addEventListener("click", () => {
    if (!requireRows()) return;
    downloadBlob("manifest.json", JSON.stringify(manifestObject(), null, 2) + "\n", "application/json");
  });
  $("btnBuyer").addEventListener("click", () => {
    if (!requireRows()) return;
    downloadBlob("BUYER_UPDATE.md", buyerUpdateMd(), "text/markdown;charset=utf-8");
  });
  $("btnChangelog").addEventListener("click", () => {
    if (!requireRows()) return;
    downloadBlob("CHANGELOG.md", changelogMd(), "text/markdown;charset=utf-8");
  });
  $("btnAll").addEventListener("click", () => {
    if (!requireRows()) return;
    downloadBlob("checksums.sha256", checksumsText());
    downloadBlob("manifest.json", JSON.stringify(manifestObject(), null, 2) + "\n", "application/json");
    downloadBlob("BUYER_UPDATE.md", buyerUpdateMd(), "text/markdown;charset=utf-8");
    downloadBlob("CHANGELOG.md", changelogMd(), "text/markdown;charset=utf-8");
  });

  fileInput.addEventListener("change", () => {
    if (fileInput.files) ingestFiles(fileInput.files);
    fileInput.value = "";
  });
  dirInput.addEventListener("change", () => {
    if (dirInput.files) ingestFiles(dirInput.files);
    dirInput.value = "";
  });

  ;["dragenter", "dragover"].forEach((ev) => {
    dropzone.addEventListener(ev, (e) => {
      e.preventDefault();
      dropzone.classList.add("drag");
    });
  });
  ;["dragleave", "drop"].forEach((ev) => {
    dropzone.addEventListener(ev, (e) => {
      e.preventDefault();
      dropzone.classList.remove("drag");
    });
  });
  dropzone.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length) ingestFiles(dt.files);
  });
  dropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInput.click();
    }
  });

  setBusy(false);
})();
