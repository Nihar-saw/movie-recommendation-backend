from pathlib import Path
import joblib

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_DIR = BASE_DIR / "models"


class ModelLoader:
    def __init__(self):
        self.movies = None
        self.tfidf_matrix = None
        self.user_movie = None
        self.latent = None
        self.is_loaded = False

    def load_models(self):
        if self.is_loaded:
            return

        print("Loading models...")
        self.movies = joblib.load(MODEL_DIR / "movies.pkl")
        self.tfidf_matrix = joblib.load(MODEL_DIR / "content.pkl")
        self.user_movie = joblib.load(MODEL_DIR / "user_movie.pkl")
        self.latent = joblib.load(MODEL_DIR / "latent_matrix.pkl")
        self.is_loaded = True
        print("ML Service Ready.")

loader = ModelLoader()