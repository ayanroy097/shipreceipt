# ShipReceipt

**Browser-local SHA-256 release pack** for digital sellers.

Drop your release files → get `checksums.sha256`, `manifest.json`, and `BUYER_UPDATE.md` (plus optional `CHANGELOG.md`). Hashing uses Web Crypto in your browser. **Nothing is uploaded. No account.**

**Live:** https://ayanroy097.github.io/shipreceipt/

## Job to be done

You sell a ZIP / file pack (Gumroad, Lemon, email, etc.). Buyers should be able to prove they got the bits you shipped — without you running a server or pasting openssl one-liners into every receipt.

ShipReceipt gives you:

1. **`checksums.sha256`** — classic `sha256sum` format (`<hash><two spaces><path>`)
2. **`manifest.json`** — product, version, date, support URL, what-changed, per-file path/bytes/sha256
3. **`BUYER_UPDATE.md`** — plain-language verify steps for the buyer
4. Optional **`CHANGELOG.md`** stub from the same bullets

## How to use

1. Open the [Pages app](https://ayanroy097.github.io/shipreceipt/) (or open `index.html` locally over HTTPS/`localhost`).
2. Drop files or a folder.
3. Fill product name, version, date, what-changed, support URL.
4. Download the pack and attach it next to the product download you already sell.

### Buyer verify (macOS / Linux)

```bash
sha256sum -c checksums.sha256
```

## Demo fixtures

See [`demo/`](./demo/). Gold hashes for Reviewer:

| File | SHA-256 |
| --- | --- |
| `hello.txt` | `f7c858d2e73f16bab94945d62dde569930afb949d0bb95684e5655371f5ab289` |
| `VERSION` | `f50b53c5d61db0e4ecc6ff16457bf83c083fc5dffb8c2de70f58be3080b6c056` |
| `sample.json` | `e5f1eb4d806641698a35efe20e098efd20d7d57a9b90ee69079d5bb650920726` |

Also: `demo/checksums.sha256.gold`. Changing one byte in any fixture must flip its hash.

## Honest differentiation

| Alternative | ShipReceipt |
| --- | --- |
| openssl / `sha256sum` alone | Same math, plus **BUYER_UPDATE** + **manifest** in one click |
| Paid “Release & Update Manager”-style tools (~USD 29) | Free GitHub Pages alternative focused on **checksum + buyer notice** (not updates/CDN) |

## Privacy / network

- Hash and export use only `crypto.subtle` and local `Blob` downloads.
- **No third-party scripts, analytics, or APIs** during hash/export.
- Use **HTTPS** Pages (or localhost) so Web Crypto is available in Chrome.

## Out of scope

Server · analytics · Gumroad API · GPG · autopost · form→HTML toys

## Assignment

`EXP-006-BUILD-1` · INR 0 · Cursor-funded
