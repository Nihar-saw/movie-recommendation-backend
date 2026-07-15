from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
import os
from contextlib import asynccontextmanager

# Load .env from the ml/ directory (for local development)
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from core.startup import init_models
from core.content import content_recommend
from core.hybrid import hybrid
from services.chatbot import ask_movie_ai

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Execute startup logic
    init_models()
    yield
    # Cleanup logic (if any) could go here

app = FastAPI(lifespan=lifespan)

# Add CORS Middleware - restrict to specific origins
allowed_origins = os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:5000').split(',')
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
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