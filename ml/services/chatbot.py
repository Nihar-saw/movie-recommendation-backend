import os
from groq import Groq

# Initialize Groq client
# Reads GROQ_API_KEY from environment variables
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def ask_movie_ai(prompt):
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