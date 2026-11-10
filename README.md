# Breast Cancer Detection from Mammograms

Machine Learning semester project (5th semester, IBA Sukkur).

**Task:** look at a mammogram and decide whether it belongs to a **benign** (0) or **cancer** (1) case.
Missing a cancer is the worst mistake, so besides accuracy we focus on **recall** and choose the decision cut-off to find at least 80% of cancers.

**Team:** Karan Kumar (023-24-0009, group lead) and Muhammad Aman (023-24-0026)

---

## Results

All numbers are on the same 540 test images (patients never seen in training). Each model uses a cut-off chosen on the validation set to reach about 80% recall.

| Model | Type | ROC-AUC | Recall | Precision |
|---|---|---|---|---|
| ResNet18 fine-tuned | Deep learning | 0.703 | 0.809 | 0.598 |
| Random Forest | Classical ML | 0.682 | 0.798 | 0.573 |
| SVM | Classical ML | 0.642 | 0.794 | 0.584 |
| ResNet18 frozen | Deep learning | 0.640 | 0.831 | 0.592 |
| Baseline (always predicts the majority class) | Baseline | 0.500 | 1.000 | 0.504 |

**Honest summary:** the fine-tuned ResNet18 has the highest ROC-AUC, but the 95% ranges (bootstrap over patients) overlap, so the data does not show that one model is clearly better. All models are only modest. At the chosen cut-off about 1 in 5 cancers is still missed and more than half of the benign images are flagged. This is a classroom project and **not** a medical tool.

## Dataset

[Mini-DDSM](https://www.kaggle.com/datasets/cheddad/miniddsm2) (JPEG-8 version), Benign and Cancer classes only: 5,400 images (2,684 benign, 2,716 cancer) from 1,350 patients. Each patient has up to 4 images (left/right breast, CC/MLO view).

- The **images are not included** in this repository (dataset licence, CC BY-ND 4.0). Download them and put the folder `MINI-DDSM-Complete-JPEG-8` in the project folder.
- Mask and overlay files are ignored. The `Normal` folder is not used.

Citation: Lekamlage, C. D., Afzal, F., Westerberg, E., Cheddad, A. *Mini-DDSM: Mammography-based Automatic Age Estimation.* DMIP 2020. doi:10.1145/3441369.3441370. Based on the DDSM database (Heath et al.).

## How we avoided leakage

- The split is **by patient** (80% train / 10% validation / 10% test, stratified, seed 42), so images of one patient never appear in two groups.
- The test set is used once, at the end. Cut-offs and model settings are chosen on the validation set only.
- The deep learning and classical models are tested on exactly the same test images (checked in the code).
- Mask files (tumour outlines drawn after diagnosis) are excluded.

## Files

| File | What it does |
|---|---|
| `deep_learning.ipynb` | Finds the images, makes the patient-level split, trains ResNet18 (frozen, then fine-tuned), evaluates on the test set, looks at the mistakes |
| `ml_models.ipynb` | Majority-class baseline, handcrafted features, SVM, Random Forest, comparison of all models |
| `app.py`, `templates/`, `static/` | Flask web page: upload a mammogram and see the prediction |
| `make_demo.py` | Copies 4 sample test images (2 benign, 2 cancer) for the live demo |
| `data_split.csv` | The train / validation / test split (shared by all notebooks) |
| `features.npy` | The 20 handcrafted features per image (for the classical models) |
| `resnet18_best.pt`, `resnet18_finetuned.pt` | Saved deep learning models (frozen and fine-tuned) |
| `dl_*.csv`, `ml_*.csv`, `all_results.csv` | Results and predictions |
| `roc_all_models.png`, `error_examples.png` | Figures |

## How to run

**1. Install**

```
pip install -r requirements.txt
```

**2. Data:** put `MINI-DDSM-Complete-JPEG-8` in the project folder.

**3. Deep learning (`deep_learning.ipynb`)**
- Steps 1 to 3.1 run on a normal laptop: they build `data_split.csv` and `images_224.npy` (all images resized to 224 x 224, not stored in git).
- Training (steps 3.2 onward) was done on a free Google Colab GPU (T4). Upload `data_split.csv` and `images_224.npy` to Drive first. Training takes a few minutes.
- Step 4 evaluates the saved models on the test set.

**4. Classical ML (`ml_models.ipynb`):** runs on a laptop CPU. Needs `data_split.csv`, `images_224.npy` and `dl_predictions_test.csv`.

**5. Web app**

```
python make_demo.py     # once, creates static/demo/ with 4 sample images
python app.py
```

Then open http://127.0.0.1:5000. The sample images are not stored in git.

## Limitations

- Images were shrunk to 224 x 224, so fine details are lost.
- Models may use brightness, tissue density or film labels instead of the tumour itself (seen in the error analysis, not proven).
- Only one dataset; not tested on other scanners or hospitals.
- The score shown in the app is not a calibrated probability.

## AI use

Claude (Anthropic) was used as an assistant to explain concepts and to help write and check code. We ran the code ourselves, and the results and write-up are ours.
