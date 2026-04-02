
import pandas as pd
import json
import re

def load_data():
    # Load tabular data
    df = pd.read_csv('Bacteria_dataset_Multiresictance.csv')
    
    # Load JSON data
    with open('card-diff-v4.0.0-4.0.1.json', 'r') as f:
        card_data = json.load(f)
        
    return df, card_data

def preprocess_tabular(df):
    # Extract bacteria name from 'Souches'
    # Format is usually "ID Name" e.g. "S290 Escherichia coli"
    def extract_bacteria(text):
        if pd.isna(text): return "Unknown"
        # Remove ID prefix (e.g., S290)
        match = re.search(r'S\d+\s+(.*)', text)
        if match:
            return match.group(1).strip()
        return text.strip()

    df['Bacteria'] = df['Souches'].apply(extract_bacteria)
    
    # Process age/gender
    def extract_age(text):
        if pd.isna(text) or text == '': return None
        match = re.search(r'(\d+)', str(text))
        return int(match.group(1)) if match else None

    def extract_gender(text):
        if pd.isna(text) or text == '': return 'Unknown'
        if '/F' in str(text): return 'F'
        if '/M' in str(text): return 'M'
        return 'Unknown'

    df['Age'] = df['age/gender'].apply(extract_age)
    df['Gender'] = df['age/gender'].apply(extract_gender)
    
    # Fill missing values
    df['Age'] = df['Age'].fillna(df['Age'].median())
    
    # Map R/S to 1/0
    # Some columns might have 'I' (Intermediate), treat as 'R' for binary classification or handle separately
    # Let's see unique values in antibiotic columns
    anti_cols = ['AMX/AMP', 'AMC', 'CZ', 'FOX', 'CTX/CRO', 'IPM', 'GEN', 'AN', 'Acide nalidixique', 'ofx', 'CIP', 'C', 'Co-trimoxazole', 'Furanes', 'colistine']
    
    for col in anti_cols:
        df[col] = df[col].map({'R': 1, 'I': 1, 'S': 0}).fillna(0) # Default to S if unknown? Or drop?
        
    return df, anti_cols

def extract_card_priors(card_data):
    # Map (Bacteria, Antibiotic) -> 1 if resistance gene exists
    priors = {}
    
    # The JSON structure is {"$insert": {"model_id": {...}}}
    insert_data = card_data.get('$insert', {})
    
    for model_id, model in insert_data.items():
        bacteria_list = []
        if 'model_sequences' in model:
            seqs = model['model_sequences'].get('sequence', {})
            for seq_id, seq_info in seqs.items():
                tax = seq_info.get('NCBI_taxonomy', {})
                name = tax.get('NCBI_taxonomy_name')
                if name:
                    bacteria_list.append(name)
        
        antibiotics = []
        if 'ARO_category' in model:
            cats = model['ARO_category']
            for cat_id, cat_info in cats.items():
                if cat_info.get('category_aro_class_name') == 'Antibiotic':
                    antibiotics.append(cat_info.get('category_aro_name'))
        
        for b in bacteria_list:
            for a in antibiotics:
                key = (b.lower(), a.lower())
                priors[key] = 1
                
    return priors

if __name__ == "__main__":
    df, card_data = load_data()
    df, anti_cols = preprocess_tabular(df)
    priors = extract_card_priors(card_data)
    
    print(f"Processed {len(df)} rows.")
    print(f"Bacteria types: {df['Bacteria'].nunique()}")
    print(f"Antibiotic columns: {anti_cols}")
    print(f"Found {len(priors)} biological priors in CARD.")
    
    # Sample output
    print("\nSample processed data:")
    print(df[['Bacteria', 'Age', 'Gender'] + anti_cols].head())
