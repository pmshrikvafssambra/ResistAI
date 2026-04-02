import sys
import os
import json
import joblib
import pandas as pd
import numpy as np
import warnings

# Suppress warnings for clean output
warnings.filterwarnings("ignore")

# Add src to path to import components from ml_pipeline
sys.path.append(os.path.join(os.getcwd(), 'src'))

try:
    from ml_pipeline import BioinformaticsKB, AdvancedFeatureEngineer
except ImportError:
    # Fallback if import fails (e.g. running from different directory)
    # In a real app, we'd ensure these are in a shared lib
    pass

def predict(bacteria, antibiotic, dosage_mg, age=45, sex='M', exposure=5, ward='General', comorbidity=2, ndm1=0, mcr1=0):
    model_path = os.path.join('models', 'resistai_master_v2.pkl')
    
    if not os.path.exists(model_path):
        return {"error": "Model file not found. Please run the training pipeline first."}
    
    try:
        # Load the trained model
        model = joblib.load(model_path)
        
        # Prepare input data (matching the training format)
        input_data = {
            'bacteria': [bacteria],
            'antibiotic': [antibiotic],
            'dosage_mg': [float(dosage_mg)],
            'patient_age': [int(age)],
            'patient_sex': [sex],
            'prior_exposure_days': [int(exposure)],
            'hospital_ward': [ward],
            'comorbidity_index': [int(comorbidity)],
            'growth_rate_log': [0.5], # Default biological constant
            'temperature': [37.2],    # Default physiological constant
            'genetic_marker_ndm1': [int(ndm1)],
            'genetic_marker_mcr1': [int(mcr1)],
        }
        
        X_input = pd.DataFrame(input_data)
        
        # Get prediction and probabilities
        prediction_idx = model.predict(X_input)[0]
        probabilities = model.predict_proba(X_input)[0]
        
        classes = ['Susceptible', 'Intermediate', 'Resistant']
        prediction = classes[prediction_idx]
        probability = float(probabilities[prediction_idx])
        
        # Calculate MDR risk score
        mdr_risk = int(probabilities[2] * 100)
        
        # Generate Clinical Insights (Explanation & Recommendation)
        explanation, recommendation = get_clinical_insights(bacteria, antibiotic, prediction, ndm1, mcr1, dosage_mg)
        
        return {
            "prediction": prediction,
            "probability": f"{probability:.2%}",
            "mdrRiskScore": f"{mdr_risk}%",
            "explanation": explanation,
            "recommendation": recommendation,
            "clinical_context": {
                "bacteria": bacteria,
                "antibiotic": antibiotic,
                "dosage": f"{dosage_mg}mg",
                "ward": ward,
                "genetic_markers": "Detected" if (ndm1 or mcr1) else "None"
            },
            "status": "success"
        }
    except Exception as e:
        return {"error": str(e)}

def get_clinical_insights(bacteria, antibiotic, prediction, ndm1, mcr1, dosage_mg):
    """
    Generates deterministic clinical insights based on the ML prediction 
    and biological markers. This replaces the need for an external LLM.
    """
    explanation = ""
    recommendation = ""
    
    if prediction == "Resistant":
        if ndm1:
            explanation = f"The resistance in {bacteria} is highly correlated with the detected NDM-1 (New Delhi Metallo-beta-lactamase) gene. This enzyme hydrolyzes almost all beta-lactams, including carbapenems like {antibiotic}."
            recommendation = "Consider non-beta-lactam alternatives such as Tigecycline, Colistin, or Fosfomycin. Infectious Disease consultation is strongly advised."
        elif mcr1:
            explanation = f"The resistance is likely driven by the mcr-1 gene, which mediates plasmid-borne colistin resistance. This significantly limits the efficacy of last-resort polymyxins."
            recommendation = "Evaluate susceptibility to Ceftazidime-Avibactam or Meropenem-Vaborbactam if appropriate for the strain."
        else:
            explanation = f"The ML model identified a high probability of resistance for {bacteria} against {antibiotic}. This may be due to intrinsic resistance mechanisms, efflux pump over-expression, or porin mutations common in this clinical profile."
            recommendation = "Perform formal E-test or broth microdilution to confirm MIC. Switch to a different antibiotic class (e.g., Aminoglycosides or Fluoroquinolones) pending further sensitivity testing."
    elif prediction == "Intermediate":
        explanation = f"{bacteria} shows reduced susceptibility to {antibiotic}. The dosage of {dosage_mg}mg may be insufficient to reach the required PK/PD targets (fT>MIC) for effective clearance."
        recommendation = "Consider increasing the dosage or using an extended infusion strategy. Monitor therapeutic drug levels if possible."
    else: # Susceptible
        explanation = f"The model predicts that {bacteria} is susceptible to {antibiotic}. The clinical parameters and absence of major resistance markers suggest a high likelihood of treatment success."
        recommendation = "Continue current regimen. Monitor for clinical improvement over the next 48-72 hours."
        
    return explanation, recommendation

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='ResistAI Prediction Engine')
    parser.add_argument('--bacteria', type=str, required=True, help='Bacteria name (e.g., "E. coli")')
    parser.add_argument('--antibiotic', type=str, required=True, help='Antibiotic name (e.g., "Amoxicillin")')
    parser.add_argument('--dosage', type=float, required=True, help='Dosage in mg')
    parser.add_argument('--age', type=int, default=45, help='Patient age')
    parser.add_argument('--sex', type=str, default='M', choices=['M', 'F'], help='Patient sex')
    parser.add_argument('--exposure', type=int, default=5, help='Prior exposure days')
    parser.add_argument('--ward', type=str, default='General', choices=['ICU', 'General', 'OPD', 'NICU', 'Burn Unit'], help='Hospital ward')
    parser.add_argument('--comorbidity', type=int, default=2, help='Comorbidity index (0-10)')
    parser.add_argument('--ndm1', type=int, default=0, choices=[0, 1], help='NDM-1 genetic marker')
    parser.add_argument('--mcr1', type=int, default=0, choices=[0, 1], help='MCR-1 genetic marker')
    
    args = parser.parse_args()
    
    result = predict(
        args.bacteria, args.antibiotic, args.dosage, 
        args.age, args.sex, args.exposure, args.ward, 
        args.comorbidity, args.ndm1, args.mcr1
    )
    
    print("\n" + "="*50)
    print(" RESISTAI CLINICAL PREDICTION ".center(50, "="))
    print("="*50)
    
    if "error" in result:
        print(f"ERROR: {result['error']}")
    else:
        print(f"BACTERIA:    {result['clinical_context']['bacteria']}")
        print(f"ANTIBIOTIC:  {result['clinical_context']['antibiotic']}")
        print(f"DOSAGE:      {result['clinical_context']['dosage']}")
        print(f"WARD:        {result['clinical_context']['ward']}")
        print("-" * 50)
        print(f"PREDICTION:  {result['prediction'].upper()}")
        print(f"CONFIDENCE:  {result['probability']}")
        print(f"MDR RISK:    {result['mdrRiskScore']}")
    
    print("="*50 + "\n")
    
    # Final JSON output for API consumption
    print(json.dumps(result))
