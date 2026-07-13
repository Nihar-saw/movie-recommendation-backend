import os
from groq import Groq

def ask_movie_ai(prompt):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable is not set")

    # Lazy-initialize Groq client so missing key doesn't crash server at startup
    client = Groq(api_key=api_key)

    completion = client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are CineAI, an expert movie recommendation assistant. "
                    "Recommend only real movies. You MUST return a JSON response. "
                    "The JSON response must contain a 'text' key (a markdown string with details "
                    "explaining your recommendation in a friendly conversational style) and a 'movies' "
                    "key (an array of integer TMDB IDs representing the recommended movies, or empty array if none)."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        response_format={"type": "json_object"}
    )

    return completion.choices[0].message.content