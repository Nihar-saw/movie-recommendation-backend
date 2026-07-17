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

def generate_reasons(recommendations, taste_profile):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        # Fallback if no API key
        for rec in recommendations:
            rec["reason"] = f"Based on your watchlist and preference for {rec.get('genres', 'similar movies')}."
        return recommendations

    client = Groq(api_key=api_key)
    
    # We will ask the AI to generate a brief reason for each movie in one go to save time/tokens.
    movie_list_str = "\n".join([f"- {m['title']} (Genres: {m['genres']})" for m in recommendations])
    prompt = f"User taste profile: {taste_profile}\n\nI am recommending the following movies:\n{movie_list_str}\n\nFor each movie, provide a very short 1-sentence reason (under 15 words) why they might like it based on their taste profile. Return a JSON object with movie titles as keys and the short reason as the string value."
    
    try:
        completion = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {
                    "role": "system",
                    "content": "You are a movie recommendation engine. Return a JSON object mapped { 'Movie Title': 'Short reason' }. Be creative and mention genres, directors, or similar vibes."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            response_format={"type": "json_object"}
        )
        import json
        reasons_dict = json.loads(completion.choices[0].message.content)
        
        for rec in recommendations:
            title = rec['title']
            # Try to find a matching title in the dictionary (fuzzy match or exact)
            reason = reasons_dict.get(title)
            if reason:
                rec["reason"] = reason
            else:
                rec["reason"] = f"A great choice based on your watchlist."
    except Exception as e:
        print("Error generating reasons:", e)
        for rec in recommendations:
            rec["reason"] = "A personalized recommendation for you."
            
    return recommendations