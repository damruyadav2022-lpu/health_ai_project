"""
ML Training Script - trains disease prediction models and saves .pkl files.
Datasets use synthetic fallback by default. Place real CSVs in ml/datasets/ for better accuracy.

Usage:
    cd backend
    python -m ml.train
"""
import os
import warnings
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix

warnings.filterwarnings("ignore")

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
DATASETS_DIR = os.path.join(os.path.dirname(__file__), "datasets")
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(DATASETS_DIR, exist_ok=True)


# ─── Dataset loaders ───────────────────────────────────────────────────────────

def load_diabetes_data() -> tuple:
    """Pima Indians Diabetes Dataset."""
    csv_path = os.path.join(DATASETS_DIR, "diabetes.csv")
    if os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
    else:
        # Synthetic fallback (same schema as Pima Indians)
        np.random.seed(42)
        n = 768
        df = pd.DataFrame({
            "Pregnancies": np.random.randint(0, 17, n),
            "Glucose": np.random.randint(0, 200, n),
            "BloodPressure": np.random.randint(0, 122, n),
            "SkinThickness": np.random.randint(0, 99, n),
            "Insulin": np.random.randint(0, 846, n),
            "BMI": np.round(np.random.uniform(0, 67, n), 1),
            "DiabetesPedigreeFunction": np.round(np.random.uniform(0.07, 2.42, n), 3),
            "Age": np.random.randint(21, 81, n),
        })
        df["Outcome"] = ((df["Glucose"] > 120) & (df["BMI"] > 27)).astype(int)
        df.to_csv(csv_path, index=False)
        print("(!) Diabetes: used synthetic data. Place real diabetes.csv in ml/datasets/ for better accuracy.")

    X = df.drop("Outcome", axis=1)
    y = df["Outcome"]
    return X, y, list(X.columns)


def load_heart_data() -> tuple:
    """UCI Heart Disease Dataset."""
    csv_path = os.path.join(DATASETS_DIR, "heart.csv")
    if os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
    else:
        np.random.seed(0)
        n = 303
        df = pd.DataFrame({
            "age": np.random.randint(29, 77, n),
            "sex": np.random.randint(0, 2, n),
            "cp": np.random.randint(0, 4, n),
            "trestbps": np.random.randint(94, 200, n),
            "chol": np.random.randint(126, 564, n),
            "fbs": np.random.randint(0, 2, n),
            "restecg": np.random.randint(0, 3, n),
            "thalach": np.random.randint(71, 202, n),
            "exang": np.random.randint(0, 2, n),
            "oldpeak": np.round(np.random.uniform(0, 6.2, n), 1),
            "slope": np.random.randint(0, 3, n),
            "ca": np.random.randint(0, 4, n),
            "thal": np.random.randint(0, 3, n),
        })
        df["target"] = ((df["thalach"] < 140) | (df["chol"] > 240)).astype(int)
        df.to_csv(csv_path, index=False)
        print("(!) Heart: used synthetic data. Place real heart.csv in ml/datasets/.")

    feature_col = "target" if "target" in df.columns else "num"
    X = df.drop(feature_col, axis=1)
    y = df[feature_col].apply(lambda v: 1 if v > 0 else 0)
    return X, y, list(X.columns)


def load_liver_data() -> tuple:
    """Indian Liver Patient Dataset (ILPD)."""
    csv_path = os.path.join(DATASETS_DIR, "liver.csv")
    if os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
    else:
        # Synthetic fallback (Balanced)
        np.random.seed(7)
        n = 583
        df = pd.DataFrame({
            "Age": np.random.randint(4, 90, n),
            "Gender": np.random.choice([0, 1], n),
            "Total_Bilirubin": np.round(np.random.uniform(0.4, 15.0, n), 1),
            "Direct_Bilirubin": np.round(np.random.uniform(0.1, 8.0, n), 1),
            "Alkaline_Phosphotase": np.random.randint(63, 1000, n),
            "Alamine_Aminotransferase": np.random.randint(10, 500, n),
            "Aspartate_Aminotransferase": np.random.randint(10, 500, n),
            "Total_Protiens": np.round(np.random.uniform(2.7, 9.6, n), 1),
            "Albumin": np.round(np.random.uniform(0.9, 5.5, n), 1),
            "Albumin_and_Globulin_Ratio": np.round(np.random.uniform(0.3, 2.8, n), 1),
        })
        # Create a more balanced target based on multiple factors
        score = (df["Total_Bilirubin"] / 5.0) + (df["Alamine_Aminotransferase"] / 200.0) + (df["Age"] / 60.0)
        df["Dataset"] = (score > 1.5).astype(int)
        
        # Ensure at least 20 samples per class
        if df["Dataset"].value_counts().get(0, 0) < 20: df.iloc[:25, df.columns.get_loc("Dataset")] = 0
        if df["Dataset"].value_counts().get(1, 0) < 20: df.iloc[:25, df.columns.get_loc("Dataset")] = 1
        
        df.to_csv(csv_path, index=False)
        print("(!) Liver: used synthetic data. Place real liver.csv in ml/datasets/.")

    X = df.drop("Dataset", axis=1)
    y = df["Dataset"]
    return X, y, list(X.columns)


# ─── Model builder ─────────────────────────────────────────────────────────────

def build_pipeline() -> Pipeline:
    return Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
        ("clf", RandomForestClassifier(n_estimators=200, max_depth=8, random_state=42, class_weight="balanced")),
    ])


# ─── Train & evaluate ──────────────────────────────────────────────────────────

def train_model(name: str, X, y, feature_names: list):
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    pipeline = build_pipeline()
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    cv_scores = cross_val_score(pipeline, X, y, cv=5, scoring="accuracy")

    print(f"\n{'='*55}")
    print(f"  {name.upper()} MODEL")
    print(f"{'='*55}")
    print(f"  Accuracy : {acc:.4f}")
    print(f"  CV Mean  : {cv_scores.mean():.4f} +/- {cv_scores.std():.4f}")
    print(classification_report(y_test, y_pred, zero_division=0))

    # Save model + metadata
    model_path = os.path.join(MODELS_DIR, f"{name}_model.pkl")
    meta_path = os.path.join(MODELS_DIR, f"{name}_meta.pkl")
    joblib.dump(pipeline, model_path)

    rf = pipeline.named_steps["clf"]
    importances = dict(zip(feature_names, rf.feature_importances_.tolist()))
    importances_sorted = dict(sorted(importances.items(), key=lambda x: x[1], reverse=True))
    joblib.dump({"feature_names": feature_names, "importances": importances_sorted, "accuracy": float(acc)}, meta_path)

    print(f"  [OK] Saved -> {model_path}")
    return acc


def main():
    print("\n[HealthAI] Training disease prediction models...\n")

    datasets = [
        ("diabetes", load_diabetes_data),
        ("heart", load_heart_data),
        ("liver", load_liver_data),
    ]

    results = {}
    for name, loader in datasets:
        X, y, features = loader()
        acc = train_model(name, X, y, features)
        results[name] = acc

    print(f"\n{'='*55}")
    print("  TRAINING COMPLETE")
    print(f"{'='*55}")
    for name, acc in results.items():
        bar = "#" * int(acc * 20) + "-" * (20 - int(acc * 20))
        print(f"  {name:<12} [{bar}] {acc:.1%}")
    print(f"\n  Models saved to: {MODELS_DIR}\n")


if __name__ == "__main__":
    main()
