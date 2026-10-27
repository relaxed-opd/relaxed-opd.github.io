"""Export figure crops from the submitted PDF, without redrawing its data."""

import argparse
import json
import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
# Crop coordinates refer to the 928 x 1200 inspection render of the PDF.
CROPS = {
    "sample-efficiency": (2, (163, 108, 415, 256)),
    "test-time-scaling": (2, (418, 108, 765, 256)),
    "credit-distribution": (3, (164, 110, 514, 246)),
    "entropy-credit": (4, (164, 109, 461, 228)),
    "training-schedule": (4, (470, 109, 766, 228)),
    "long-training": (9, (164, 108, 438, 266)),
    "opd-comparison": (9, (164, 331, 461, 552)),
    "qwen3-vl": (9, (470, 331, 765, 552)),
}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("paper", type=Path)
    args = parser.parse_args()
    paper = args.paper.resolve(strict=True)
    figures = ROOT / "assets" / "figures"
    figures.mkdir(parents=True, exist_ok=True)
    (ROOT / "assets" / "paper").mkdir(parents=True, exist_ok=True)
    shutil.copyfile(paper, ROOT / "assets" / "paper" / "reopold.pdf")

    manifest = {}
    with tempfile.TemporaryDirectory(prefix="reopold-figures-") as tmp:
        for page in sorted({page for page, _ in CROPS.values()}):
            prefix = str(Path(tmp) / f"page-{page}")
            subprocess.run(
                ["pdftoppm", "-f", str(page), "-l", str(page), "-singlefile",
                 "-scale-to", "4200", "-png", str(paper), prefix],
                check=True, capture_output=True,
            )
            with Image.open(prefix + ".png") as image:
                scale_x, scale_y = image.width / 928, image.height / 1200
                for name, (source_page, box) in CROPS.items():
                    if source_page != page:
                        continue
                    crop = image.crop(tuple(round(value * (scale_x if i % 2 == 0 else scale_y))
                                            for i, value in enumerate(box)))
                    crop.save(figures / f"{name}.webp", quality=94, method=6)
                    manifest[name] = {
                        "pdf_page": page, "inspection_crop": box,
                        "width": crop.width, "height": crop.height,
                    }
    (figures / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"Exported {len(manifest)} figures and the camera-ready PDF.")


if __name__ == "__main__":
    main()
