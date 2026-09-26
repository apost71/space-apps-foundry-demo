#!/usr/bin/env python3
"""Download NASA bioscience publications from NTRS (NASA Technical Reports Server)
into src/files/ so they get indexed by the AI Search pipeline on first startup.

Usage: python3 scripts/download_nasa_docs.py [max_docs]
"""
import json
import os
import sys
import time
import urllib.request
import ssl
import pathlib

TARGET_DIR = pathlib.Path(__file__).resolve().parent.parent / "src" / "files"

QUERIES = [
    "space biology microgravity",
    "microgravity effects immune system",
    "spaceflight bone loss astronauts",
    "plant growth microgravity ISS",
    "muscle atrophy spaceflight",
    "space radiation biology effects",
    "cell culture microgravity",
    "astronaut health long duration spaceflight",
    "gene expression spaceflight",
    "microbial behavior spaceflight ISS",
]

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE


def ntrs_search(query: str, limit: int = 5):
    url = f"https://ntrs.nasa.gov/api/citations/search?q={urllib.parse.quote(query)}&page.size={limit}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30, context=ctx) as resp:
        return json.loads(resp.read().decode("utf-8"))


def download_pdf(citation_id: str, download_path: str, dest: pathlib.Path) -> bool:
    url = f"https://ntrs.nasa.gov{download_path}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=60, context=ctx) as resp:
            data = resp.read()
        if len(data) < 10_000 or not data[:5].startswith(b"%PDF"):
            return False
        dest.write_bytes(data)
        return True
    except Exception as e:
        print(f"  ! failed {citation_id}: {e}")
        return False


def main():
    max_docs = int(sys.argv[1]) if len(sys.argv) > 1 else 20
    TARGET_DIR.mkdir(parents=True, exist_ok=True)
    seen, count = set(), 0

    for query in QUERIES:
        if count >= max_docs:
            break
        print(f"Query: {query}")
        try:
            results = ntrs_search(query).get("results", [])
        except Exception as e:
            print(f"  ! search failed: {e}")
            continue
        for r in results:
            if count >= max_docs:
                break
            cid = str(r.get("id"))
            if cid in seen:
                continue
            downloads = [d for d in r.get("downloads", []) if d.get("links", {}).get("pdf")]
            if not downloads:
                continue
            title = "".join(c for c in r.get("title", "nasa_doc") if c.isalnum() or c in " -_").strip()[:80]
            dest = TARGET_DIR / f"{cid}_{title or 'nasa_doc'}.pdf"
            if dest.exists():
                seen.add(cid); count += 1; continue
            path = downloads[0]["links"]["pdf"]
            print(f"  ↓ {cid}: {r.get('title','')[:70]}")
            if download_pdf(cid, path, dest):
                seen.add(cid)
                count += 1
                print(f"    ✓ saved ({dest.stat().st_size // 1024} KB)")
            time.sleep(0.4)

    print(f"\nDone: {count} NASA documents in {TARGET_DIR}")


if __name__ == "__main__":
    import urllib.parse
    main()
