from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from dotenv import load_dotenv
import os
from contextlib import asynccontextmanager

# Load .env from the ml/ directory (for local development)
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from core.startup import init_models
from core.content import content_recommend
from core.hybrid import hybrid
from core.personalized import compute_user_vector, personalized_hybrid_recommend
from services.chatbot import ask_movie_ai, generate_reasons

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

class VectorRequest(BaseModel):
    tmdb_ids: List[int]

class PersonalizedRequest(BaseModel):
    preference_vector: List[float]
    user_id: str
    exclude_tmdb_ids: List[int] = []
    taste_profile: dict = {}


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


@app.post("/vector")
def compute_vector(request: VectorRequest):
    """Compute a user preference vector from a list of TMDB IDs."""
    try:
        vector = compute_user_vector(request.tmdb_ids)
        return {
            "success": True,
            "vector": vector
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.post("/recommend/personalized")
def recommend_personalized(request: PersonalizedRequest):
    """Get personalized recommendations with AI-generated reasons."""
    try:
        recommendations = personalized_hybrid_recommend(
            request.preference_vector,
            request.user_id,
            request.exclude_tmdb_ids,
            limit=20
        )

        # Generate AI reasons for each recommendation
        taste_str = ", ".join(request.taste_profile.get("genres", [])) or "varied"
        recommendations = generate_reasons(recommendations, taste_str)

        return {
            "success": True,
            "recommendations": recommendations
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e)
        }