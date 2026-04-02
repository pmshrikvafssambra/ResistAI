
import sys
import json
import joblib
import pandas as pd
import numpy as np
import re

def load_card_features(bacteria, antibiotic):
    try:
        with open('card-diff-v4.0.0-4.0.1.json', 'r') as f:
            card = json.load(f)
        
        models = card.get('$insert', card)
        count = 0
        mutation = 0
        
        for model in models.values():
            if not isinstance(model, dict): continue
            
            # Check bacteria
            bacteria_match = False
            if 'model_sequences' in model and 'sequence' in model['model_sequences']:
                for seq in model['model_sequences']['sequence'].values():
                    name = seq.get('NCBI_taxonomy', {}).get('NCBI_taxonomy_name')
                    if name == bacteria:
                        bacteria_match = True
                        break
            
            if not bacteria_match: continue
            
            # Check antibiotic
            anti_match = False
            if 'ARO_category' in model:
                for cat in model['ARO_category'].values():
                    if cat.get('category_aro_class_name') == 'Antibiotic':
                        if cat.get('category_aro_name') == antibiotic:
                            anti_match = True
                            break
            
            if anti_match:
                count += 1
                mechanism = model.get('ARO_description', '').lower()
                if 'mutation' in mechanism or 'variant' in mechanism:
                    mutation = 1
        
        return count, mutation
    except Exception as e:
        print(f"Error loading CARD features: {e}", file=sys.stderr)
        return 0, 0

def predict():
    try:
        # Load model and encoder
        model = joblib.load('models/amr_model.joblib')
        le = joblib.load('models/label_encoder.joblib')
        
        # Read input from stdin
        input_data = json.load(sys.stdin)
        
        # Calculate biological features if not provided
        if 'gene_count' not in input_data or 'mutation_present' not in input_data:
            gene_count, mutation_present = load_card_features(input_data.get('bacteria'), input_data.get('antibiotic'))
            input_data['gene_count'] = gene_count
            input_data['mutation_present'] = mutation_present
            
        # Prepare data for prediction
        X = pd.DataFrame([input_data])
        
        # Ensure all columns exist in the correct order as expected by the pipeline
        # The pipeline expects: ['bacteria', 'antibiotic', 'age', 'gender', 'gene_count', 'mutation_present']
        # But wait, the pipeline preprocessor uses numerical_features and categorical_features
        # numerical_features = ['age', 'gene_count', 'mutation_present']
        # categorical_features = ['bacteria', 'antibiotic', 'gender']
        
        # Predict
        y_prob = model.predict_proba(X)[0]
        y_pred = model.predict(X)[0]
        
        # Get label
        label = le.inverse_transform([y_pred])[0]
        confidence = float(np.max(y_prob))
        
        # Prepare result
        result = {
            "prediction": label,
            "confidence": confidence,
            "probabilities": {le.classes_[i]: float(y_prob[i]) for i in range(len(le.classes_))},
            "status": "success",
            "features": {
                "gene_count": int(input_data['gene_count']),
                "mutation_present": int(input_data['mutation_present'])
            }
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        import traceback
        print(json.dumps({"status": "error", "message": str(e), "trace": traceback.format_exc()}))

if __name__ == "__main__":
    predict()
