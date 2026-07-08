from fastapi import FastAPI

from core.content import content_recommend

from core.hybrid import hybrid

app = FastAPI()


@app.get("/")
def home():

    return {

        "status": "running"

    }


@app.get("/recommend")

def recommend(movie: str):

    return content_recommend(movie)


@app.get("/hybrid")

def hybrid_ai(

        movie: str,

        user: int

):

    return hybrid(movie, user)