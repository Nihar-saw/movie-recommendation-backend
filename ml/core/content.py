from core.loader import loader
from sklearn.metrics.pairwise import cosine_similarity


def content_recommend(movie, limit=10):

    if not movie or not isinstance(movie, str):
        return []

    movies = loader.movies
    tfidf_matrix = loader.tfidf_matrix

    movie = movie.lower()

    index = None

    for i, title in enumerate(movies["title"]):

        if movie in title.lower():

            index = i

            break

    if index is None:

        return []

    # Dynamically compute similarity for the selected movie
    target_vector = tfidf_matrix[index]
    similarity = cosine_similarity(target_vector, tfidf_matrix).flatten()

    scores = list(enumerate(similarity))

    scores.sort(
        key=lambda x: x[1],
        reverse=True
    )

    recommendations = []

    from services.tmdb_mapper import get_tmdb

    for score in scores[1:limit + 1]:

        row = movies.iloc[score[0]]
        
        movie_id = int(row.movieId)
        tmdb_id = get_tmdb(movie_id)

        recommendations.append({

            "movieId": movie_id,

            "tmdbId": int(tmdb_id) if tmdb_id is not None else None,

            "title": row.title,

            "genres": row.genres,

            "score": float(score[1])

        })

    return recommendations