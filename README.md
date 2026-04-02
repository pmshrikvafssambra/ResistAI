# 🧬 ResistAI

### 🚀 Antibiotic Resistance Prediction System

**Team:** CodeCurer

---

## 📌 Overview

**ResistAI** is a high-performance, biologically informed machine learning system designed to predict antibiotic resistance in bacterial isolates. Built for real-world applicability, it leverages clinical datasets along with biological insights to assist in antimicrobial decision-making.

This project addresses one of the most critical global healthcare challenges: **Antimicrobial Resistance (AMR)**.

---

## 🧠 Key Features

### 🔬 Real-World Data Driven

* Trained on real antibiotic susceptibility datasets
* No synthetic data dependency for final predictions
* Reflects real biological variability and uncertainty

---

### 🧬 Biological Intelligence Integration

* Incorporates gene-level insights from resistance databases
* Uses features such as:

  * `gene_count`
  * `mutation_present`
* Enhances predictions with biological context (not rule-based shortcuts)

---

### ⚙️ Advanced Machine Learning

* Model: **HistGradientBoostingClassifier**
* Hyperparameter tuning via **RandomizedSearchCV**
* Handles non-linear relationships in tabular clinical data

**Best Parameters Found:**

```python
{
  'classifier__max_iter': 200,
  'classifier__max_depth': 7,
  'classifier__learning_rate': 0.01,
  'classifier__l2_regularization': 1.0
}
```

---

### 📊 Performance Metrics

| Metric           | Value      |
| ---------------- | ---------- |
| Accuracy         | **78.28%** |
| F1 Score (Macro) | **0.7424** |

> ⚠️ Note: ROC-AUC calculation encountered a dimensionality issue and will be fixed in the next iteration.

---

### 🧪 Feature Engineering

* Bacteria and antibiotic encoding
* Biological feature integration
* Interaction-aware modeling
* Clean preprocessing pipeline

---

### 🏗️ Production-Ready Pipeline

* Modular training pipeline
* Model persistence using `joblib`
* Scalable backend-ready design

---

## ⚡ Installation

```bash
pip install -r requirements.txt
```

---

## ▶️ Usage

```bash
python train_model.py
```

---

## 🖥️ Training Output

```
Loading and preprocessing data...
Starting hyperparameter tuning...
Best parameters: {...}
ROC-AUC calculation failed...
Accuracy: 0.7828
F1-Score (Macro): 0.7424
Calculating feature importance...
Training complete. Model and metrics saved.
```

---

## 🧠 Why ResistAI Stands Out

✅ Uses **real clinical data** instead of synthetic shortcuts
✅ Eliminates **data leakage and unrealistic modeling**
✅ Integrates **biological priors** without compromising validity
✅ Provides **interpretable and probabilistic predictions**
✅ Built for **clinical relevance and scalability**

---

## 🔍 Scientific Validity

Unlike many overfitted or synthetic approaches, ResistAI:

* Avoids rule-based label generation
* Uses proper train-test separation
* Handles class imbalance using macro metrics
* Reflects real-world uncertainty in predictions

---

## 🚧 Future Improvements

* Fix ROC-AUC computation for multi-class evaluation
* Improve feature richness from biological datasets
* Explore LightGBM for additional performance gains
* Deploy full API-based inference system

---

## 🏆 Conclusion

ResistAI is a **robust, interpretable, and realistic** machine learning system for antibiotic resistance prediction. It prioritizes **scientific correctness over artificial perfection**, making it suitable for real-world and clinical decision-support scenarios.

---

## 👨‍💻 Team CodeCurer

Building intelligent, responsible, and impactful AI solutions for healthcare.

---
