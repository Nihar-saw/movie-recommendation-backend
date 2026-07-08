import pandas as pd

movies = pd.read_csv("dataset/movies.csv")

ratings = pd.read_csv("dataset/ratings.csv")

tags = pd.read_csv("dataset/tags.csv")

print(movies.head())

print(ratings.head())

print(tags.head())

print()

print("Movies:",len(movies))

print("Ratings:",len(ratings))

print("Tags:",len(tags))