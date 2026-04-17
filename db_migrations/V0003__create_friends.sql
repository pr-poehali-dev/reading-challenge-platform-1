
CREATE TABLE t_p62593867_reading_challenge_pl.friends (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p62593867_reading_challenge_pl.users(id),
  friend_id INTEGER NOT NULL REFERENCES t_p62593867_reading_challenge_pl.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id <> friend_id)
);
