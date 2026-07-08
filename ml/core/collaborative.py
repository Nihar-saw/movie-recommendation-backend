from core.loader import loader

import numpy as np


def collaborative_recommend(user_id):

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

    return scores[:20]