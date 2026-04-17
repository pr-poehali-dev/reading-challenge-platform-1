
CREATE TABLE t_p62593867_reading_challenge_pl.challenges (
  id SERIAL PRIMARY KEY,
  creator_id INTEGER NOT NULL REFERENCES t_p62593867_reading_challenge_pl.users(id),
  title VARCHAR(200) NOT NULL,
  books_goal INTEGER NOT NULL,
  days INTEGER NOT NULL,
  emoji VARCHAR(10) DEFAULT '📚',
  join_code VARCHAR(8) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p62593867_reading_challenge_pl.challenge_members (
  id SERIAL PRIMARY KEY,
  challenge_id INTEGER NOT NULL REFERENCES t_p62593867_reading_challenge_pl.challenges(id),
  user_id INTEGER NOT NULL REFERENCES t_p62593867_reading_challenge_pl.users(id),
  books_done INTEGER DEFAULT 0,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);
