-- Create friendships table with RLS
CREATE TABLE IF NOT EXISTS public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  
  -- Prevent duplicate friendships and self-friendship
  CONSTRAINT unique_friendship UNIQUE (user_id, friend_id),
  CONSTRAINT no_self_friendship CHECK (user_id != friend_id)
);

-- Indexes for performance
CREATE INDEX idx_friendships_user_id ON public.friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON public.friendships(friend_id);
CREATE INDEX idx_friendships_created_at ON public.friendships(created_at DESC);

-- Enable RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can see their own friendships
CREATE POLICY "Users can view their own friendships"
  ON public.friendships
  FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can add friends
CREATE POLICY "Users can add friends"
  ON public.friendships
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove their own friendships
CREATE POLICY "Users can remove their own friendships"
  ON public.friendships
  FOR DELETE
  USING (auth.uid() = user_id);

-- RPC function to check if users are friends
CREATE OR REPLACE FUNCTION public.are_friends(user_a uuid, user_b uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.friendships
    WHERE (user_id = user_a AND friend_id = user_b)
       OR (user_id = user_b AND friend_id = user_a)
  );
$$;

-- RPC function to get friends list for a user
CREATE OR REPLACE FUNCTION public.get_friends_list(target_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  friend_user_id uuid,
  friendship_created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT DISTINCT
    CASE 
      WHEN user_id = COALESCE(target_user_id, auth.uid()) THEN friend_id
      ELSE user_id
    END AS friend_user_id,
    created_at AS friendship_created_at
  FROM public.friendships
  WHERE user_id = COALESCE(target_user_id, auth.uid())
     OR friend_id = COALESCE(target_user_id, auth.uid())
  ORDER BY created_at DESC;
$$;

COMMENT ON TABLE public.friendships IS 'User friendships - symmetric relationships';
COMMENT ON FUNCTION public.are_friends IS 'Check if two users are friends (bidirectional)';
COMMENT ON FUNCTION public.get_friends_list IS 'Get list of friends for a user';
