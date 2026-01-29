CREATE TABLE twitter_replies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tweet_id text UNIQUE NOT NULL,
  tweet_author text,
  tweet_text text,
  reply_text text,
  replied_at timestamptz DEFAULT now()
);
