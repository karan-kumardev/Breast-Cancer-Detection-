"""Pick 4 sample images from the TEST set (2 benign, 2 cancer) for the live demo.

Run once from the project folder:  python make_demo.py
The images are copied to static/demo/
"""
import json
import shutil
from pathlib import Path

import pandas as pd

SEED = 42
test = pd.read_csv("dl_predictions_test.csv")    # created in the deep learning notebook

demo = Path("static/demo")
demo.mkdir(parents=True, exist_ok=True)

samples = []
for label, name in [(0, "Benign"), (1, "Cancer")]:
    for i, (_, row) in enumerate(test[test.label == label].sample(2, random_state=SEED).iterrows(), start=1):
        src = Path(row.path)
        if not src.exists():
            raise SystemExit(f"Image not found: {src}\nRun this from the project folder that contains the images folder.")
        dst = f"{name.lower()}_{i}.jpg"
        shutil.copy(src, demo / dst)
        samples.append({"file": dst, "label": name, "view": row["view"]})

(demo / "demo.json").write_text(json.dumps(samples, indent=2))
print("Saved", len(samples), "sample images in", demo)
