
CREATE TABLE t_p62593867_reading_challenge_pl.users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  class VARCHAR(20) NOT NULL,
  session_token VARCHAR(64) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p62593867_reading_challenge_pl.books (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p62593867_reading_challenge_pl.users(id),
  title VARCHAR(200) NOT NULL,
  author VARCHAR(150) NOT NULL,
  pages INTEGER NOT NULL,
  pages_read INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'planned',
  rating SMALLINT,
  created_at TIMESTAMP DEFAULT NOW()
);
