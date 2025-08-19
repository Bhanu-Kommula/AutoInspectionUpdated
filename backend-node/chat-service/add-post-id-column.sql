-- Add missing post_id column to chat_rooms table (PostgreSQL)
-- This fixes errors when saving/reading room post context

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'chat_rooms' 
      AND column_name = 'post_id'
  ) THEN
    ALTER TABLE public.chat_rooms ADD COLUMN post_id INT NULL;
  END IF;
END $$;

-- Create index if it does not exist
CREATE INDEX IF NOT EXISTS idx_post_id ON public.chat_rooms (post_id);

-- Verify structure
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'chat_rooms';
