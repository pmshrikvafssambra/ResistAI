# ResistAI: Antibiotic Resistance Prediction & Decision Support

## 🧬 Project Overview
ResistAI is a competition-grade AI system designed for the **CodeCure AI Hackathon (IIT BHU) – Track B: Antibiotic Resistance Prediction**. It leverages machine learning to predict bacterial resistance (Resistant / Susceptible / Intermediate) and provides interpretable insights for clinical decision support.

## 🚀 Tech Stack & Tools
- **Language**: Python (ML Pipeline), TypeScript (Web Interface)
- **ML Libraries**: Scikit-learn, XGBoost, LightGBM, SHAP, Category Encoders
- **Web Framework**: React (Frontend), Express (Backend)
- **Data Visualization**: Recharts, D3.js
- **Explainability**: SHAP (Shapley Additive Explanations)

## 🛠️ NumPy 2.0 Compatibility Fix
We have resolved the `ImportError: numpy.core.multiarray failed to import` by pinning `numpy<2.0.0` and ensuring all dependencies are compatible with the legacy NumPy 1.x ABI while supporting modern features.

## ⚡ God-Level ML Pipeline
The prediction engine has been upgraded to a **Stacking Ensemble Classifier**:
- **Base Models**: Random Forest, XGBoost, LightGBM.
- **Meta-Model**: Logistic Regression for optimal weight blending.
- **Feature Engineering**: Target encoding, interaction terms, and dosage binning.
- **Imbalance Handling**: SMOTE (Synthetic Minority Over-sampling Technique) to ensure high accuracy even on rare resistant strains.
- **Accuracy Goal**: 90% - 100% on validated clinical datasets.

## 📂 Dataset Description
- **Primary Dataset**: [Mendeley - Antibiotic Susceptibility](https://data.mendeley.com/datasets/ccmrx8n7mk/1)
- **Secondary Dataset**: [Kaggle - Multi-Resistance Antibiotic Susceptibility](https://www.kaggle.com/datasets/adilimadeddinehosni/multi-resistance-antibiotic-susceptibility)
- **Advanced (Optional)**: [CARD (Comprehensive Antibiotic Resistance Database)](https://card.mcmaster.ca/download)

## ✨ Features
- **Resistance Prediction**: Multi-class classification (R/S/I).
- **MDR Risk Scoring**: Quantifies multi-drug resistance risk.
- **Antibiotic Recommendation**: Suggests alternative treatments if resistance is predicted.
- **XAI Dashboard**: Explainable AI using SHAP to visualize feature contributions.
- **Clinical Simulation**: Real-world scenarios for testing bacterial strains.

## ⚙️ Technical Workflow
1. **Data Processing**: Loading, validation, handling missing values, and SMOTE for class imbalance.
2. **Feature Engineering**: Creating bacteria-antibiotic interaction profiles and statistical aggregations.
3. **Model Development**: Training Random Forest and XGBoost with hyperparameter tuning.
4. **Explainability**: Using SHAP to provide local and global explanations for predictions.
5. **Deployment**: Integrated React dashboard with an Express backend for real-time inference.

## 🛠️ Installation & Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/ResistAI.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Create a `.env` file and add your `GEMINI_API_KEY`.

## 🖥️ How to Run the Project
- **Development Mode**:
  ```bash
  npm run dev
  ```
- **ML Pipeline (Python)**:
  ```bash
  python src/ml_pipeline.py
  ```

---
*Built for CodeCure AI Hackathon (IIT BHU) by ResistAI Team.*
