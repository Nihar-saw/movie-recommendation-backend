from core.loader import loader

import numpy as np


def collaborative_recommend(user_id):

    # Map MongoDB ObjectId string to an integer index in the dataset if it's not an integer
    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        # Stable hash of the ObjectId string to a valid index in the user-movie index
        import hashlib
        hash_val = int(hashlib.md5(str(user_id).encode()).hexdigest(), 16)
        user_list = list(loader.user_movie.index)
        user_id = user_list[hash_val % len(user_list)]

    if user_id not in loader.user_movie.index:

        return []

    user_index = list(
        loader.user_movie.index
    ).index(user_id)

    vector = loader.latent[user_index]

    similarity = np.dot(
        loader.latent,
        vector
    )

    nearest = similarity.argsort()[::-1][1:6]

    scores = {}

    for n in nearest:

        ratings = loader.user_movie.iloc[n]

        ratings = ratings[ratings >= 4]

        for movie, rating in ratings.items():

            scores[movie] = scores.get(movie, 0) + rating

    scores = sorted(
        scores.items(),
        key=lambda x: x[1],
        reverse=True
    )

    recommendations = []
    from services.tmdb_mapper import get_tmdb

    for movie_id, score in scores[:20]:
        movie_row = loader.movies[loader.movies["movieId"] == movie_id]
        if not movie_row.empty:
            row = movie_row.iloc[0]
            tmdb_id = get_tmdb(movie_id)
            recommendations.append({
                "movieId": int(movie_id),
                "tmdbId": int(tmdb_id) if tmdb_id is not None else None,
                "title": row.title,
                "genres": row.genres,
                "score": float(score)
            })

    return recommendations