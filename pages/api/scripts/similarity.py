from gensim.models import KeyedVectors

# print("hey pots!!")
# model = KeyedVectors.load_word2vec_format("../models/GoogleNews-vectors-negative300.bin", binary=True)
# model = KeyedVectors.load_word2vec_format("../models/vectors.txt", binary=False)
# model = KeyedVectors.load_word2vec_format("./pages/api/models/GoogleNews-vectors-negative300.bin", binary=True)
model = KeyedVectors.load_word2vec_format("./pages/api/models/vectors.txt", binary=False)

# similar_words = model.most_similar("king")
print(model.similarity("king", "queen"), "king and queen!")
# print(model.similarity("king", "prince"), "king and prince")
print(model.similarity("king", "crown"), "king and crown")
print(model.similarity("king", "laugh"), "king and laugh")
# print(model.similarity("dismiss", "lawyer"), "lawyer and dismiss")


print("distances")

print(model.distance("king", "queen"), "king and queen")
# print(model.distance("king", "prince"), "king and prince")
print(model.distance("king", "crown"), "king and crown")
print(model.distance("king", "laugh"), "king and laugh")


# print(similar_words)
# print(similarity)

print(3)
