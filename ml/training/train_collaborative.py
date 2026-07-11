from pathlib import Path
import pandas as pd
import joblib

from sklearn.decomposition import TruncatedSVD

BASE_DIR = Path(__file__).resolve().parent.parent

def train_collaborative_model():
    print("Training Collaborative model...")
    ratings = pd.read_csv(BASE_DIR / "dataset" / "ratings.csv")

    # User-Movie matrix
    user_movie = ratings.pivot_table(
        index="userId",
        columns="movieId",
        values="rating"
    ).fillna(0)

    svd = TruncatedSVD(
        n_components=50,
        random_state=42
    )

    latent_matrix = svd.fit_transform(user_movie)

    models_dir = BASE_DIR / "models"
    models_dir.mkdir(exist_ok=True)

    joblib.dump(user_movie, models_dir / "user_movie.pkl")
    joblib.dump(latent_matrix, models_dir / "latent_matrix.pkl")
    joblib.dump(svd, models_dir / "svd_model.pkl")

    print("✅ Collaborative model trained")
    return True

if __name__ == "__main__":
    train_collaborative_model()