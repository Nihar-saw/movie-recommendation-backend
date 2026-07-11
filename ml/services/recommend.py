from pathlib import Path
import joblib
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

movie_vectors = joblib.load("models/content.pkl")

movie_index = ...

scores = cosine_similarity(
    movie_vectors[movie_index],
    movie_vectors
).flatten()

BASE_DIR = Path(__file__).resolve().parent.parent

movies = joblib.load(BASE_DIR / "models" / "movies.pkl")
similarity = joblib.load(BASE_DIR / "models" / "content_similarity.pkl")


def recommend(movie_name, limit=10):

    movie_name = movie_name.lower()

    movie_index = None

    for idx, title in enumerate(movies["title"]):

        if movie_name in title.lower():
            movie_index = idx
            break

    if movie_index is None:
        return []

    distances = list(enumerate(similarity[movie_index]))

    distances = sorted(
        distances,
        key=lambda x: x[1],
        reverse=True
    )[1:limit + 1]

    recommendations = []

    for movie in distances:

        row = movies.iloc[movie[0]]

        recommendations.append({
            "movieId": int(row["movieId"]),
            "title": row["title"],
            "genres": row["genres"],
            "score": float(movie[1])
        })

    return recommendations