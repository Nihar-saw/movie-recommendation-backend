from pathlib import Path
import pandas as pd
import joblib

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

BASE_DIR = Path(__file__).resolve().parent.parent

def train_content_model():
    print("Training Content-Based model...")
    movies = pd.read_csv(BASE_DIR / "dataset" / "movies.csv")
    tags = pd.read_csv(BASE_DIR / "dataset" / "tags.csv")

    # Merge all tags for each movie
    tags = (
        tags.groupby("movieId")["tag"]
        .apply(lambda x: " ".join(x.astype(str)))
        .reset_index()
    )

    movies = movies.merge(tags, on="movieId", how="left")

    movies["tag"] = movies["tag"].fillna("")
    movies["genres"] = movies["genres"].fillna("")
    movies["title"] = movies["title"].fillna("")

    # Combine title + genres + tags
    movies["features"] = (
        movies["title"] + " " +
        movies["genres"] + " " +
        movies["tag"]
    )

    vectorizer = TfidfVectorizer(
        stop_words="english",
        max_features=5000
    )

    tfidf_matrix = vectorizer.fit_transform(movies["features"])

    models_dir = BASE_DIR / "models"
    models_dir.mkdir(exist_ok=True)

    joblib.dump(vectorizer, models_dir / "tfidf.pkl")
    joblib.dump(tfidf_matrix, models_dir / "content.pkl")
    joblib.dump(movies, models_dir / "movies.pkl")

    print("✅ Content Based Model Created")
    return True

if __name__ == "__main__":
    train_content_model()