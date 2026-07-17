from core.loader import loader
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from services.tmdb_mapper import get_tmdb, get_movie_id

def compute_user_vector(tmdb_ids):
    """
    Computes a single preference vector (average of TF-IDF vectors) 
    for a list of TMDB IDs.
    """
    if not tmdb_ids:
        return []

    tfidf_matrix = loader.tfidf_matrix
    movies = loader.movies

    vectors = []
    for tmdb_id in tmdb_ids:
        movie_id = get_movie_id(tmdb_id)
        if movie_id:
            try:
                # Find index of movie_id
                idx_arr = movies.index[movies['movieId'] == movie_id].tolist()
                if idx_arr:
                    idx = idx_arr[0]
                    vectors.append(tfidf_matrix[idx].toarray())
            except Exception:
                pass
    
    if not vectors:
        return []

    # Calculate average vector
    avg_vector = np.mean(vectors, axis=0)
    return avg_vector[0].tolist()  # return as list for JSON serialization

def personalized_hybrid_recommend(preference_vector, user_id, exclude_tmdb_ids=None, limit=20):
    if not preference_vector:
        return []
        
    if exclude_tmdb_ids is None:
        exclude_tmdb_ids = set()
    else:
        exclude_tmdb_ids = set(exclude_tmdb_ids)

    movies = loader.movies
    tfidf_matrix = loader.tfidf_matrix
    
    # 1. Content-Based Score (Cosine similarity of preference_vector with all movies)
    # Convert list back to numpy array
    user_vec_np = np.array(preference_vector).reshape(1, -1)
    
    # Compute similarity
    similarity = cosine_similarity(user_vec_np, tfidf_matrix).flatten()
    cb_scores = {movies.iloc[i]['movieId']: float(sim) for i, sim in enumerate(similarity)}
    
    # 2. Collaborative Score
    # We will get collaborative recommendations and assign them a normalized score
    cf_scores = {}
    try:
        from core.collaborative import collaborative_recommend
        cf_recs = collaborative_recommend(user_id)
        # Normalize CF scores between 0 and 1
        if cf_recs:
            max_cf = max(rec['score'] for rec in cf_recs)
            for rec in cf_recs:
                cf_scores[rec['movieId']] = rec['score'] / (max_cf if max_cf > 0 else 1)
    except Exception as e:
        print("CF error:", e)

    # 3. Hybrid Score Combination
    # Hybrid Formula: 40% CB, 40% CF, 20% Preference/Popularity (using CB as base if CF is missing)
    final_scores = []
    
    for i, row in movies.iterrows():
        m_id = row['movieId']
        tmdb_id = get_tmdb(m_id)
        
        if tmdb_id is None or tmdb_id in exclude_tmdb_ids:
            continue
            
        cb_score = cb_scores.get(m_id, 0)
        cf_score = cf_scores.get(m_id, 0)
        
        # We blend the scores
        hybrid_score = (0.5 * cb_score) + (0.5 * cf_score)
        
        if hybrid_score > 0.05: # Threshold to filter out completely unrelated movies
            final_scores.append({
                "movieId": m_id,
                "tmdbId": int(tmdb_id),
                "title": row['title'],
                "genres": row['genres'],
                "score": float(hybrid_score)
            })

    # Sort by hybrid score
    final_scores.sort(key=lambda x: x["score"], reverse=True)
    
    return final_scores[:limit]
