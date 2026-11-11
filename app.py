"""Breast cancer detection demo (Flask).

Run:  python app.py      then open  http://127.0.0.1:5000

The page shows 4 sample mammograms from the test set (blurred, with their true
label). One click scores all of them: each image is prepared exactly like the
training images, the fine-tuned ResNet18 gives a cancer score between 0 and 1,
and the score is compared with the cut-off chosen on the validation set.
"""
import json
from io import BytesIO
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
from flask import Flask, jsonify, render_template
from PIL import Image
from torchvision import models, transforms

BASE = Path(__file__).resolve().parent
MODEL_FILE = BASE / "resnet18_finetuned.pt"     # saved in the deep learning notebook
DEMO_DIR = BASE / "static" / "demo"             # sample images (made by make_demo.py)
IMG_SIZE = 224
CUTOFF = 0.43                                   # chosen on the validation set (recall >= 80%)

# numbers shown on the page (from all_results.csv, test set, cut-off chosen for ~80% recall)
MODEL_TABLE = [
    {"name": "ResNet18 fine-tuned", "family": "Deep learning", "auc": 0.703, "recall": 0.809, "precision": 0.598, "used": True},
    {"name": "Random Forest", "family": "Classical ML", "auc": 0.682, "recall": 0.798, "precision": 0.573, "used": False},
    {"name": "SVM", "family": "Classical ML", "auc": 0.642, "recall": 0.794, "precision": 0.584, "used": False},
    {"name": "ResNet18 frozen", "family": "Deep learning", "auc": 0.640, "recall": 0.831, "precision": 0.592, "used": False},
    {"name": "Baseline (majority class)", "family": "Baseline", "auc": 0.500, "recall": 1.000, "precision": 0.504, "used": False},
]

app = Flask(__name__)

# ---------------------------------------------------------------- model
if not MODEL_FILE.exists():
    raise SystemExit(f"Model file not found: {MODEL_FILE}\nCopy resnet18_finetuned.pt next to app.py.")

model = models.resnet18(weights=None)
model.fc = nn.Linear(model.fc.in_features, 1)
model.load_state_dict(torch.load(MODEL_FILE, map_location="cpu"))
model.eval()

normalize = transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])


def prepare(data):
    """Same steps as in the notebook: grey, 224x224, 0-1, 3 channels, normalise."""
    img = Image.open(BytesIO(data))
    img.draft("L", (IMG_SIZE, IMG_SIZE))
    img = img.convert("L").resize((IMG_SIZE, IMG_SIZE))
    x = torch.tensor(np.array(img), dtype=torch.float32) / 255
    x = x.unsqueeze(0).repeat(3, 1, 1)
    return normalize(x).unsqueeze(0)


def cancer_score(data):
    with torch.no_grad():
        return torch.sigmoid(model(prepare(data)).squeeze()).item()


def load_samples():
    file = DEMO_DIR / "demo.json"
    return json.loads(file.read_text()) if file.exists() else []


# ---------------------------------------------------------------- pages
@app.route("/")
def index():
    return render_template("index.html", samples=load_samples(), cutoff=CUTOFF, table=MODEL_TABLE)


@app.route("/predict_all", methods=["POST"])
def predict_all():
    """Score every sample image in static/demo and say which ones cross the cut-off."""
    results = []
    for s in load_samples():
        score = cancer_score((DEMO_DIR / s["file"]).read_bytes())
        results.append({"file": s["file"], "label": s["label"], "score": score, "flagged": score >= CUTOFF})
    return jsonify(results=results, cutoff=CUTOFF)


if __name__ == "__main__":
    app.run(debug=False)
