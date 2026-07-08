from pathlib import Path
import joblib

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_DIR = BASE_DIR / "models"


class ModelLoader:

    def __init__(self):

        self.movies = joblib.load(
            MODEL_DIR / "movies.pkl"
        )

        self.similarity = joblib.load(
            MODEL_DIR / "content_similarity.pkl"
        )

        self.user_movie = joblib.load(
            MODEL_DIR / "user_movie.pkl"
        )

        self.latent = joblib.load(
            MODEL_DIR / "latent_matrix.pkl"
        )


loader = ModelLoader()