from core.content import content_recommend

from core.collaborative import collaborative_recommend


def hybrid(movie, user):

    content = content_recommend(movie)

    collaborative = collaborative_recommend(user)

    return {

        "content": content,

        "collaborative": collaborative

    }