from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from core.content import content_recommend
from core.hybrid import hybrid
from services.chatbot import ask_movie_ai

app = FastAPI()

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    prompt: str


@app.get("/")
def home():

    return {

        "status": "running"

    }


# Support both query param (/recommend?movie=...) and path param (/recommend/{movie})
@app.get("/recommend")
def recommend_query(movie: str):

    return content_recommend(movie)


@app.get("/recommend/{movie}")
def recommend_path(movie: str):

    return content_recommend(movie)


# Support both user and user_id parameter for hybrid recommendations
@app.get("/hybrid")
def hybrid_ai(
    movie: Optional[str] = None,
    user: Optional[str] = None,
    user_id: Optional[str] = None
):
    # Support both parameter names, fallback to any of them
    u_id = user_id if user_id is not None else user

    # If no user id is supplied, default to a dummy one
    if u_id is None:
        u_id = "default_user"

    return hybrid(movie or "", u_id)


@app.post("/chat")
def chat(request: ChatRequest):
    try:
        response_text = ask_movie_ai(request.prompt)
        import json
        try:
            parsed = json.loads(response_text)
            return {
                "success": True,
                "response": parsed
            }
        except Exception:
            return {
                "success": True,
                "response": response_text
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }