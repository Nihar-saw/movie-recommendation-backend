import google.generativeai as genai
import os

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-2.5-flash")

def ask_movie_ai(prompt):

    response = model.generate_content(
        f"""
You are an expert movie recommendation assistant.

Recommend only real movies.

Return JSON.

User:
{prompt}
"""
    )

    return response.text