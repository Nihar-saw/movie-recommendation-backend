from core.loader import loader


def content_recommend(movie, limit=10):

    movies = loader.movies

    similarity = loader.similarity

    movie = movie.lower()

    index = None

    for i, title in enumerate(movies["title"]):

        if movie in title.lower():

            index = i

            break

    if index is None:

        return []

    scores = list(enumerate(similarity[index]))

    scores.sort(
        key=lambda x: x[1],
        reverse=True
    )

    recommendations = []

    for score in scores[1:limit + 1]:

        row = movies.iloc[score[0]]

        recommendations.append({

            "movieId": int(row.movieId),

            "title": row.title,

            "genres": row.genres,

            "score": float(score[1])

        })

    return recommendations