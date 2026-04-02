
import pandas as pd
import numpy as np
import json
import re
import joblib
import os
from sklearn.model_selection import train_test_split, RandomizedSearchCV, StratifiedKFold
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score, confusion_matrix, classification_report
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer

def load_data():
    # Load tabular data
    df_raw = pd.read_csv('Bacteria_dataset_Multiresictance.csv')
    
    # Process tabular data
    processed_data = []
    anti_cols = ['AMX/AMP', 'AMC', 'CZ', 'FOX', 'CTX/CRO', 'IPM', 'GEN', 'AN', 'Acide nalidixique', 'ofx', 'CIP', 'C', 'Co-trimoxazole', 'Furanes', 'colistine']
    
    for _, row in df_raw.iterrows():
        souches = str(row['Souches'])
        bacteria_match = re.search(r'S\d+\s+(.*)', souches)
        bacteria = bacteria_match.group(1).strip() if bacteria_match else souches.strip()
        
        age_gender = str(row['age/gender'])
        age_match = re.search(r'(\d+)', age_gender)
        age = int(age_match.group(1)) if age_match else np.nan
        gender = 'F' if '/F' in age_gender else ('M' if '/M' in age_gender else 'Unknown')
        
        for col in anti_cols:
            if pd.notna(row[col]) and row[col] in ['R', 'S', 'I']:
                processed_data.append({
                    'bacteria': bacteria,
                    'antibiotic': col,
                    'status': row[col],
                    'age': age,
                    'gender': gender
                })
    
    df = pd.DataFrame(processed_data)
    
    # Load CARD data for biological features
    with open('card-diff-v4.0.0-4.0.1.json', 'r') as f:
        card = json.load(f)
    
    models = card.get('$insert', card)
    priors = []
    for model in models.values():
        if not isinstance(model, dict): continue
        gene = model.get('ARO_name')
        mechanism = model.get('ARO_description', '')
        if not gene: continue
        
        bacteria_list = []
        if 'model_sequences' in model and 'sequence' in model['model_sequences']:
            for seq in model['model_sequences']['sequence'].values():
                name = seq.get('NCBI_taxonomy', {}).get('NCBI_taxonomy_name')
                if name: bacteria_list.append(name)
        
        antibiotics = []
        if 'ARO_category' in model:
            for cat in model['ARO_category'].values():
                if cat.get('category_aro_class_name') == 'Antibiotic':
                    antibiotics.append(cat.get('category_aro_name'))
        
        for b in bacteria_list:
            for a in antibiotics:
                priors.append({
                    'bacteria': b,
                    'antibiotic': a,
                    'gene': gene,
                    'mechanism': mechanism,
                    'is_mutation': 'mutation' in mechanism.lower() or 'variant' in mechanism.lower()
                })
    
    df_priors = pd.DataFrame(priors)
    
    # Aggregate biological features to avoid leakage
    # We use counts and categories instead of direct "is resistant"
    bio_features = df_priors.groupby(['bacteria', 'antibiotic']).agg({
        'gene': 'count',
        'is_mutation': 'max'
    }).reset_index().rename(columns={'gene': 'gene_count', 'is_mutation': 'mutation_present'})
    
    # Merge biological features
    df = df.merge(bio_features, on=['bacteria', 'antibiotic'], how='left')
    df['gene_count'] = df['gene_count'].fillna(0)
    df['mutation_present'] = df['mutation_present'].fillna(0).astype(int)
    
    return df

def train():
    print("Loading and preprocessing data...")
    df = load_data()
    
    # Prepare features and target
    X = df.drop('status', axis=1)
    y = df['status']
    
    # Encode target
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    # Mapping: I=0, R=1, S=2 (usually alphabetical)
    
    # Stratified split
    X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, stratify=y_encoded, random_state=42)
    
    # Define preprocessing for different column types
    categorical_features = ['bacteria', 'antibiotic', 'gender']
    numerical_features = ['age', 'gene_count', 'mutation_present']
    
    # We'll use a pipeline to handle preprocessing and modeling
    # HistGradientBoosting handles NaNs natively, but we'll use SimpleImputer for age
    
    # Preprocessing pipeline
    # Note: HistGradientBoosting handles categorical features natively if they are integer encoded
    # But we'll use OrdinalEncoder for simplicity in the pipeline
    from sklearn.preprocessing import OrdinalEncoder
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', Pipeline([
                ('imputer', SimpleImputer(strategy='median')),
                ('scaler', StandardScaler())
            ]), numerical_features),
            ('cat', OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1), categorical_features)
        ])
    
    # Model
    model = HistGradientBoostingClassifier(random_state=42)
    
    pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('classifier', model)
    ])
    
    # Hyperparameter tuning
    param_dist = {
        'classifier__max_iter': [100, 200, 300],
        'classifier__learning_rate': [0.01, 0.05, 0.1],
        'classifier__max_depth': [3, 5, 7, 10],
        'classifier__l2_regularization': [0, 0.1, 1.0]
    }
    
    print("Starting hyperparameter tuning...")
    cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
    search = RandomizedSearchCV(pipeline, param_distributions=param_dist, n_iter=15, cv=cv, scoring='f1_macro', n_jobs=-1, random_state=42)
    search.fit(X_train, y_train)
    
    best_pipeline = search.best_estimator_
    print(f"Best parameters: {search.best_params_}")
    
    # Evaluation
    y_pred = best_pipeline.predict(X_test)
    y_prob = best_pipeline.predict_proba(X_test)
    
    metrics = {
        'accuracy': accuracy_score(y_test, y_pred),
        'f1_macro': f1_score(y_test, y_pred, average='macro'),
        'classification_report': classification_report(y_test, y_pred, target_names=le.classes_, output_dict=True),
        'confusion_matrix': confusion_matrix(y_test, y_pred).tolist()
    }
    
    # ROC-AUC for multi-class
    try:
        metrics['roc_auc'] = roc_auc_score(y_test, y_prob, multi_class='ovr', average='macro')
    except Exception as e:
        print(f"ROC-AUC calculation failed: {e}")
        metrics['roc_auc'] = None
    
    print(f"Accuracy: {metrics['accuracy']:.4f}")
    print(f"F1-Score (Macro): {metrics['f1_macro']:.4f}")
    if metrics['roc_auc']:
        print(f"ROC-AUC: {metrics['roc_auc']:.4f}")
    
    # Save model and metadata
    os.makedirs('models', exist_ok=True)
    joblib.dump(best_pipeline, 'models/amr_model.joblib')
    joblib.dump(le, 'models/label_encoder.joblib')
    
    with open('models/metrics.json', 'w') as f:
        json.dump(metrics, f)
        
    # Generate insights
    # 1. Feature importance (permutation importance for pipelines)
    from sklearn.inspection import permutation_importance
    print("Calculating feature importance...")
    perm_importance = permutation_importance(best_pipeline, X_test, y_test, n_repeats=10, random_state=42)
    
    feature_names = numerical_features + categorical_features
    importance_df = pd.DataFrame({
        'feature': feature_names,
        'importance': perm_importance.importances_mean
    }).sort_values('importance', ascending=False)
    
    insights = {
        'feature_importance': importance_df.to_dict(orient='records'),
        'top_bacteria_accuracy': {}, # To be filled
        'difficult_classes': []
    }
    
    # Accuracy by bacteria
    X_test_with_pred = X_test.copy()
    X_test_with_pred['true'] = y_test
    X_test_with_pred['pred'] = y_pred
    
    for bact in X_test_with_pred['bacteria'].unique():
        subset = X_test_with_pred[X_test_with_pred['bacteria'] == bact]
        if len(subset) > 5:
            acc = accuracy_score(subset['true'], subset['pred'])
            insights['top_bacteria_accuracy'][str(bact)] = acc
            
    with open('models/insights.json', 'w') as f:
        json.dump(insights, f)
    
    print("Training complete. Model and metrics saved.")

if __name__ == "__main__":
    train()
