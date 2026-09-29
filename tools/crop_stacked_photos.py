"""Keep one photo from stacked collage PNGs (white horizontal bar)."""
from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
BACKUP = PUBLIC / "_collage_backup"
FOLDERS = ["mithai", "laddoo", "bengali", "dryfruit"]


def row_white_frac(im: Image.Image, y: int, thresh: int = 232) -> float:
    row = list(im.crop((0, y, im.width, y + 1)).getdata())
    n = 0
    for px in row:
        r, g, b = px[:3]
        if r >= thresh and g >= thresh and b >= thresh:
            n += 1
    return n / max(1, len(row))


def find_white_band(im: Image.Image) -> tuple[int, int] | None:
    h = im.height
    fracs = [row_white_frac(im, y) for y in range(h)]
    best = None
    y = max(2, int(h * 0.02))
    end = int(h * 0.55)
    while y < end:
        if fracs[y] >= 0.65:
            start = y
            while y < h and fracs[y] >= 0.50:
                y += 1
            run = y - start
            if run >= 2 and run <= int(h * 0.18):
                mid = (start + y) / 2
                score = run * (1.0 - abs(mid / h - 0.22))
                if best is None or score > best[0]:
                    best = (score, start, y)
            continue
        y += 1
    if not best:
        return None
    _, a, b = best
    top_h = a
    bot_h = h - b
    if top_h < max(4, int(h * 0.02)) or bot_h < h * 0.40:
        return None
    return a, b


def crop_bottom(im: Image.Image, band: tuple[int, int]) -> Image.Image:
    _, b = band
    panel = im.crop((0, b, im.width, im.height))
    # Trim leftover pale rows at the top of the bottom panel.
    while panel.height > 8:
        if row_white_frac(panel, 0) >= 0.55:
            panel = panel.crop((0, 1, panel.width, panel.height))
        else:
            break
    w, h = panel.size
    target_w = max(w, 1000)
    if target_w > w:
        target_h = max(1, round(h * (target_w / w)))
        panel = panel.resize((target_w, target_h), Image.Resampling.LANCZOS)
    return panel.convert("RGB")


def main() -> None:
    cropped = 0
    skipped = 0
    for folder in FOLDERS:
        src_dir = PUBLIC / folder
        if not src_dir.exists():
            continue
        for path in sorted(src_dir.glob("*.png")):
            im = Image.open(path).convert("RGB")
            band = find_white_band(im)
            if not band:
                skipped += 1
                print(f"skip {path.relative_to(PUBLIC)} {im.size}")
                continue
            dest = BACKUP / folder / path.name
            dest.parent.mkdir(parents=True, exist_ok=True)
            if not dest.exists():
                shutil.copy2(path, dest)
            out = crop_bottom(im, band)
            out.save(path, "PNG", optimize=True)
            cropped += 1
            print(
                f"crop {path.relative_to(PUBLIC)} {im.size} -> {out.size} band={band}"
            )
    print(f"done cropped={cropped} skipped={skipped}")


if __name__ == "__main__":
    main()
