-- Add video generation support to history table
ALTER TABLE history ADD COLUMN media_type text DEFAULT 'image';
ALTER TABLE history ADD COLUMN video_model text;
ALTER TABLE history ADD COLUMN video_duration integer;
ALTER TABLE history ADD COLUMN video_aspect_ratio text;
ALTER TABLE history ADD COLUMN video_resolution text;
ALTER TABLE history ADD COLUMN video_result jsonb;

-- Index for filtering by media type
CREATE INDEX history_media_type_idx ON history(media_type);
