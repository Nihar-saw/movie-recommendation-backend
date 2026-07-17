from pathlib import Path

import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent

links = pd.read_csv(
    BASE_DIR / "dataset" / "links.csv"
)


def get_tmdb(movie_id):

    row = links[
        links["movieId"] == movie_id
    ]

    if row.empty:

        return None

    return int(row.iloc[0]["tmdbId"])

def get_movie_id(tmdb_id):
    row = links[links["tmdbId"] == tmdb_id]
    if row.empty:
        return None
    return int(row.iloc[0]["movieId"])