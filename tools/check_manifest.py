#!/usr/bin/env python3
"""Check a scope's manifest: every listed file exists with the listed sha256, no file is unlisted,
and every relative import in the scope's JavaScript resolves to a listed file.
Usage: python3 tools/check_manifest.py scopes/brimwave   (exit 0 = pass)"""
import hashlib, json, pathlib, re, sys

root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "scopes/brimwave")
man = json.loads((root / "manifest.json").read_text(encoding="utf8"))
listed = man["files"]
bad = []
for rel, want in listed.items():
    p = root / rel
    if not p.is_file():
        bad.append(f"missing: {rel}")
    elif hashlib.sha256(p.read_bytes()).hexdigest() != want:
        bad.append(f"hash differs: {rel}")
for p in root.rglob("*"):
    rel = str(p.relative_to(root))
    if p.is_file() and rel != "manifest.json" and rel not in listed:
        bad.append(f"not in manifest: {rel}")
imp = re.compile(r"""(?:from\s+|import\s*\(?\s*)['"](\.{1,2}/[^'"]+)['"]""")
for rel in listed:
    if rel.endswith((".js", ".html")):
        base = (root / rel).parent
        for m in imp.finditer((root / rel).read_text(encoding="utf8")):
            tgt = (base / m.group(1)).resolve().relative_to(root.resolve())
            if str(tgt) not in listed:
                bad.append(f"{rel} imports {m.group(1)}, which is not in the manifest")
for name, b in man.get("blocks", {}).items():
    if listed.get(b["path"]) != b["published_sha256"]:
        bad.append(f"block {name}: published sha256 disagrees with the file list")
print(("FAIL\n  " + "\n  ".join(bad)) if bad else f"PASS: {len(listed)} files, hashes match, imports resolve")
sys.exit(1 if bad else 0)
