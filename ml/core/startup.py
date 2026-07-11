import os
from pathlib import Path
from core.loader import loader
from training.train_content import train_content_model
from training.train_collaborative import train_collaborative_model

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "models"

def init_models():
    print("Checking ML models...")
    
    # Required models for content and collaborative filtering
    required_files = [
        "movies.pkl",
        "tfidf.pkl",
        "content.pkl",
        "user_movie.pkl",
        "latent_matrix.pkl",
        "svd_model.pkl"
    ]
    
    missing_models = []
    for file in required_files:
        if not (MODEL_DIR / file).exists():
            missing_models.append(file)
            
    if missing_models:
        print(f"Missing models detected: {missing_models}")
        print("Starting automatic training...")
        
        # Determine which models need training
        content_related = {"movies.pkl", "tfidf.pkl", "content.pkl"}
        collab_related = {"user_movie.pkl", "latent_matrix.pkl", "svd_model.pkl"}
        
        if set(missing_models).intersection(content_related):
            train_content_model()
            
        if set(missing_models).intersection(collab_related):
            train_collaborative_model()
            
        print("Models generated.")
    else:
        print("All required models exist. Skipping training.")
        
    # Load all models into memory
    loader.load_models()
