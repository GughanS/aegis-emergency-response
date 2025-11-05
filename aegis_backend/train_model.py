import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
import xgboost as xgb
import warnings
import os

# Suppress warnings for cleaner output
warnings.filterwarnings('ignore')

def train_risk_model(data_path='india_district_level_10per.csv', model_output_path='aegis_risk_model.joblib'):
    """
    Trains a risk prediction model using the provided district-level dataset.
    
    The script loads the data, defines preprocessing steps for numeric and
    categorical features, and trains an XGBoost classifier. The entire
    pipeline (preprocessing + model) is saved to a joblib file.
    """
    
    print(f"--- Aegis ML Model Training Started ---")

    # Check if dataset exists
    if not os.path.exists(data_path):
        print(f"Error: Dataset not found at '{data_path}'.")
        print("Please download the 'india_district_level_10per.csv' file and place it in the same directory.")
        return

    print(f"Loading dataset from '{data_path}'...")
    try:
        data = pd.read_csv(data_path)
    except Exception as e:
        print(f"Error loading CSV: {e}")
        return

    # --- Feature Engineering & Preprocessing ---
    print("Defining features and target...")

    # Define the target variable
    target = 'risk_level'
    
    # Define features to be used
    # 'primary_hazard_type' is included as a categorical feature
    numeric_features = [
        'lat', 
        'lon', 
        'elevation_meters', 
        'dist_to_coast_km', 
        'dist_to_major_river_km', 
        'avg_annual_rainfall_mm', 
        'seismic_zone'
    ]
    
    categorical_features = [
        'state', 
        'district', 
        'primary_hazard_type'
    ]
    
    features = numeric_features + categorical_features

    # Data integrity check
    if target not in data.columns:
        print(f"Error: Target column '{target}' not found in the dataset.")
        return
        
    missing_features = [f for f in features if f not in data.columns]
    if missing_features:
        print(f"Error: The following feature columns are missing from the dataset: {missing_features}")
        return

    # Drop rows where the target is missing
    data = data.dropna(subset=[target])
    
    # Separate features and target
    X = data[features]
    y = data[target]

    # --- FIX: Map text labels to integers ---
    # XGBoost requires integer labels for classification
    label_mapping = {'Low': 0, 'Medium': 1, 'High': 2}
    y_encoded = y.map(label_mapping)
    
    print(f"Target variable 'risk_level' mapped to integers.")
    
    # Check for any unmapped values (which would become NaN)
    if y_encoded.isnull().any():
        print("Error: Found unmapped 'risk_level' values. Check the 'label_mapping' dictionary.")
        print(f"Unmapped values found: {y[y_encoded.isnull()].unique()}")
        return
    
    # --- Build Preprocessing Pipeline ---
    print("Building preprocessing pipelines...")

    # Create pipeline for numeric features
    # 1. Impute missing values with the median
    # 2. Scale features to have zero mean and unit variance
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])

    # Create pipeline for categorical features
    # 1. Impute missing values with a constant "missing" string
    # 2. One-hot encode the features, ignoring unknown categories at predict time
    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
        ('onehot', OneHotEncoder(handle_unknown='ignore'))
    ])

    # Combine numeric and categorical pipelines using ColumnTransformer
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_features),
            ('cat', categorical_transformer, categorical_features)
        ],
        remainder='passthrough' # Keep any other columns (though we aren't using any)
    )

    # --- Define the Model ---
    print("Defining XGBoost model...")
    # Using XGBClassifier for classification (Low, Medium, High)
    model = xgb.XGBClassifier(
        objective='multi:softmax',  # Use softmax for multi-class classification
        num_class=3,  # We know there are 3 classes: Low, Medium, High
        use_label_encoder=False,    # Suppress deprecation warning
        eval_metric='mlogloss',     # Evaluation metric for multi-class
        n_estimators=100,           # Number of trees
        learning_rate=0.1,
        max_depth=5,
        random_state=42
    )

    # --- Create the Full ML Pipeline ---
    # This chainlinks the preprocessor and the model.
    # When we call `predict`, data will automatically be preprocessed
    # before being fed to the model.
    full_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('model', model)
    ])

    # --- Train the Model ---
    print("Splitting data and training model...")
    # Use the new y_encoded variable for training
    X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42)
    
    full_pipeline.fit(X_train, y_train)

    # --- Evaluate the Model (Optional) ---
    accuracy = full_pipeline.score(X_test, y_test)
    print(f"Model training complete.")
    print(f"Model accuracy on test set: {accuracy * 100:.2f}%")

    # --- Save the Pipeline ---
    print(f"Saving the complete model pipeline to '{model_output_path}'...")
    joblib.dump(full_pipeline, model_output_path)
    
    print(f"--- Model saved successfully as '{model_output_path}' ---")
    print("You can now restart your Python backend server.")

if __name__ == "__main__":
    train_risk_model()

